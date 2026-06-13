import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SCORE_SYSTEM } from "@/lib/prompts";
import { type Job, type Platform } from "@/lib/store";
import { newJobId } from "@/lib/utils";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const client = new Anthropic();

// Score a single job with Haiku (fast)
async function scoreJob(title: string, jd: string, company: string) {
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SCORE_SYSTEM,
      messages: [{ role: "user", content: `TITLE: ${title}\nCOMPANY: ${company}\n\n${jd.slice(0, 600)}` }],
    });
    const text = res.content.map(b => b.type === "text" ? b.text : "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return { score: 50, match_reasons: [], gaps: [], role_type: "Other", summary: "" };
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userQuery = messages?.[messages.length - 1]?.content ?? "";
  if (!userQuery) return new Response("No query", { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch { clearInterval(ping); }
      }, 4000);

      try {
        // ── Step 1: generate 2 search queries ──────────────────────
        send({ type: "status", text: "Planning search queries…" });

        const queryRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: "Generate 2 short web search queries for German job listings based on the user request. Return ONLY a JSON array of 2 strings, no markdown. Focus on German job boards. Example: [\"Werkstudent Machine Learning Berlin\", \"Werkstudent KI Python Deutschland\"]",
          messages: [{ role: "user", content: userQuery }],
        });
        const queryText = queryRes.content.map(b => b.type === "text" ? b.text : "").join("").replace(/```json|```/g, "").trim();
        let queries: string[] = [];
        try { queries = JSON.parse(queryText); } catch { queries = [userQuery]; }
        queries = queries.slice(0, 2);

        send({ type: "status", text: `Searching: "${queries[0]}"…` });

        // ── Step 2: web search both queries in parallel ─────────────
        const searchResults = await Promise.all(queries.map(async (q) => {
          try {
            const res = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1200,
              tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
              messages: [{ role: "user", content: `Find job listings for: ${q}. List each job with: title, company, location, short description (2-3 sentences), URL if available.` }],
            });
            return res.content.map(b => b.type === "text" ? b.text : "").join("\n");
          } catch { return ""; }
        }));

        const combinedResults = searchResults.join("\n\n");
        send({ type: "status", text: "Extracting job listings…" });

        // ── Step 3: extract structured jobs ────────────────────────
        const extractRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          system: `Extract job listings from search results into JSON. Return ONLY a JSON array, no markdown:
[{"title":"...","company":"...","location":"...","platform":"LinkedIn|StepStone|Indeed DE|Xing|Other","jd":"...","url":"..."}]
- "jd": combine description + requirements into 3-5 sentences
- Extract maximum 6 jobs
- If no real jobs found, return []
- Never invent jobs`,
          messages: [{ role: "user", content: combinedResults || "No results found" }],
        });

        const extractText = extractRes.content.map(b => b.type === "text" ? b.text : "").join("").replace(/```json|```/g, "").trim();
        let jobs: { title: string; company: string; location: string; platform: string; jd: string; url: string }[] = [];
        try { jobs = JSON.parse(extractText); } catch { jobs = []; }

        if (jobs.length === 0) {
          send({ type: "text", text: `I searched for "${userQuery}" but couldn't find specific job listings right now. This can happen for very specific locations like Ilmenau.\n\nTry:\n• Searching directly on [StepStone](https://www.stepstone.de) or [LinkedIn](https://www.linkedin.com/jobs)\n• Broadening to "Thüringen" or "Remote Germany"\n• Using the Search tab to paste JDs manually` });
          send({ type: "done", jobsAdded: [] });
          clearInterval(ping);
          controller.close();
          return;
        }

        send({ type: "status", text: `Found ${jobs.length} listings — scoring all in parallel…` });

        // ── Step 4: score ALL jobs in parallel ──────────────────────
        const scored = await Promise.all(
          jobs.map(async (job) => {
            const result = await scoreJob(job.title, job.jd, job.company);
            return { ...job, ...result };
          })
        );

        // ── Step 5: add qualifying jobs to pipeline ─────────────────
        const addedJobs: Job[] = [];
        for (const job of scored) {
          if ((job.score ?? 0) >= 45) {
            const pipelineJob: Job = {
              id: newJobId(),
              title:        job.title,
              company:      job.company      || "Unknown",
              platform:     (job.platform as Platform) || "Other",
              location:     job.location     || "",
              jd:           job.jd,
              url:          job.url,
              addedAt:      new Date().toLocaleDateString("de-DE"),
              status:       "scored",
              score:        job.score        ?? 0,
              matchReasons: job.match_reasons ?? [],
              gaps:         job.gaps          ?? [],
              roleType:     job.role_type     ?? "Other",
              scoreSummary: job.summary       ?? null,
              cvBullets: null, coverLetter: null,
              cvLatexEN: null, cvLatexDE: null,
              clLatexEN: null, clLatexDE: null,
              atsScore: null, atsMatchedKeywords: [], atsMissingKeywords: [], atsVerdict: null,
            };
            addedJobs.push(pipelineJob);
            send({ type: "job_added", job: pipelineJob });
          }
        }

        // ── Step 6: summary message ─────────────────────────────────
        const top = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
        const skipped = scored.length - addedJobs.length;

        let summary = addedJobs.length > 0
          ? `Found **${addedJobs.length} matching job${addedJobs.length !== 1 ? "s" : ""}** and added them to your pipeline.\n\nTop match: **${top.title}** at ${top.company} — ${top.score}% match`
          : `Found ${scored.length} listing${scored.length !== 1 ? "s" : ""} but none scored above 45% match for your profile.`;

        if (skipped > 0 && addedJobs.length > 0) {
          summary += `\n${skipped} low-match listing${skipped !== 1 ? "s" : ""} filtered out.`;
        }

        summary += `\n\nGo to the **Pipeline tab** to generate your tailored CV + LaTeX cover letter for each.`;

        send({ type: "text", text: summary });
        send({ type: "done", jobsAdded: addedJobs });

      } catch (err) {
        send({ type: "error", text: "Search failed: " + String(err) });
      } finally {
        clearInterval(ping);
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}