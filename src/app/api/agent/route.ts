import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_SYSTEM } from "@/lib/prompts";
import { type Job, type Platform } from "@/lib/store";
import { newJobId } from "@/lib/utils";

const client = new Anthropic();

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for job listings on LinkedIn, StepStone, Indeed, or Xing. Use specific queries like 'Werkstudent Machine Learning Berlin site:linkedin.com'",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "extract_jobs",
    description:
      "Extract structured job listings from raw search result text. Returns array of jobs with title, company, description, platform.",
    input_schema: {
      type: "object" as const,
      properties: {
        search_results: {
          type: "string",
          description: "Raw text from web search results containing job listings",
        },
        platform_hint: {
          type: "string",
          description: "Which platform these results are from (LinkedIn, StepStone, Indeed DE, Xing)",
        },
      },
      required: ["search_results"],
    },
  },
  {
    name: "score_job",
    description:
      "Score a single job description against the candidate profile. Returns score 0-100, match reasons, gaps.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Job title" },
        company: { type: "string", description: "Company name" },
        jd: { type: "string", description: "Full job description text" },
      },
      required: ["title", "jd"],
    },
  },
  {
    name: "add_to_pipeline",
    description:
      "Add a scored job to the candidate's pipeline. Call this after scoring a job that has score >= 50.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        company: { type: "string" },
        platform: {
          type: "string",
          enum: ["LinkedIn", "StepStone", "Indeed DE", "Xing", "Other"],
        },
        location: { type: "string" },
        jd: { type: "string" },
        url: { type: "string" },
        score: { type: "number" },
        match_reasons: {
          type: "array",
          items: { type: "string" },
        },
        gaps: {
          type: "array",
          items: { type: "string" },
        },
        role_type: {
          type: "string",
          enum: ["Werkstudent", "Internship", "Thesis", "Full-time", "Other"],
        },
        score_summary: { type: "string" },
      },
      required: ["title", "jd", "score"],
    },
  },
];

// ─── Tool handlers ─────────────────────────────────────────────────────────────
async function handleWebSearch(query: string): Promise<string> {
  // Use Anthropic's built-in web search via a sub-call with search tool
  try {
    const searchResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `Search for: ${query}. Return job listings you find with title, company, location, and a brief description. Focus on real current job postings.`,
        },
      ],
    });

    const results = searchResponse.content
      .map((b) => {
        if (b.type === "text") return b.text;
        return "";
      })
      .join("\n");

    return results || "No results found for this query.";
  } catch (err) {
    console.error("Web search error:", err);
    return "Web search failed. Try a different query.";
  }
}

async function handleExtractJobs(
  searchResults: string,
  platformHint?: string
): Promise<string> {
  const extractResponse = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system:
      "Extract job listings from search results. Return ONLY a JSON array, no markdown:\n[{\"title\":\"...\",\"company\":\"...\",\"location\":\"...\",\"platform\":\"...\",\"jd\":\"...\",\"url\":\"...\"}]\nIf no real jobs found, return []. Never invent job listings.",
    messages: [
      {
        role: "user",
        content: `Platform hint: ${platformHint || "unknown"}\n\nSearch results:\n${searchResults}`,
      },
    ],
  });

  const text = extractResponse.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  return text;
}

async function handleScoreJob(
  title: string,
  jd: string,
  company?: string
): Promise<string> {
  const { SCORE_SYSTEM } = await import("@/lib/prompts");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SCORE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Score this job:\nTITLE: ${title}\nCOMPANY: ${company || "Unknown"}\n\n${jd}`,
      },
    ],
  });

  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  return text;
}

function handleAddToPipeline(input: {
  title: string;
  company?: string;
  platform?: string;
  location?: string;
  jd: string;
  url?: string;
  score: number;
  match_reasons?: string[];
  gaps?: string[];
  role_type?: string;
  score_summary?: string;
}): Job {
  const job: Job = {
    id: newJobId(),
    title: input.title,
    company: input.company || "Unknown",
    platform: (input.platform as Platform) || "Other",
    location: input.location || "",
    jd: input.jd,
    url: input.url,
    addedAt: new Date().toLocaleDateString("de-DE"),
    status: "scored",
    score: input.score,
    matchReasons: input.match_reasons || [],
    gaps: input.gaps || [],
    roleType: (input.role_type as Job["roleType"]) || "Other",
    scoreSummary: input.score_summary || null,
    cvBullets: null,
    coverLetter: null,
    cvLatexEN: null,
    cvLatexDE: null,
    clLatexEN: null,
    clLatexDE: null,
  };
  return job;
}

// ─── Agentic loop ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const addedJobs: Job[] = [];
    const agentMessages: Anthropic.MessageParam[] = messages;
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    // Agentic loop
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: AGENT_SYSTEM,
        tools: TOOLS,
        messages: agentMessages,
      });

      // If no tool calls → final response
      if (response.stop_reason === "end_turn") {
        const finalText = response.content
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("");
        return NextResponse.json({
          message: finalText,
          jobsAdded: addedJobs,
          done: true,
        });
      }

      // Process tool calls
      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b) => b.type === "tool_use"
        ) as Anthropic.ToolUseBlock[];

        // Add assistant message with tool calls to history
        agentMessages.push({ role: "assistant", content: response.content });

        // Process each tool call and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          let result = "";

          try {
            if (toolUse.name === "web_search") {
              const input = toolUse.input as { query: string };
              result = await handleWebSearch(input.query);
            } else if (toolUse.name === "extract_jobs") {
              const input = toolUse.input as {
                search_results: string;
                platform_hint?: string;
              };
              result = await handleExtractJobs(
                input.search_results,
                input.platform_hint
              );
            } else if (toolUse.name === "score_job") {
              const input = toolUse.input as {
                title: string;
                company?: string;
                jd: string;
              };
              result = await handleScoreJob(input.title, input.jd, input.company);
            } else if (toolUse.name === "add_to_pipeline") {
              const input = toolUse.input as Parameters<
                typeof handleAddToPipeline
              >[0];
              const job = handleAddToPipeline(input);
              addedJobs.push(job);
              result = JSON.stringify({
                success: true,
                job_id: job.id,
                message: `Added "${job.title}" at ${job.company} to pipeline (score: ${job.score}%)`,
              });
            }
          } catch (toolErr) {
            result = JSON.stringify({ error: String(toolErr) });
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        // Add tool results to history
        agentMessages.push({ role: "user", content: toolResults });
      }
    }

    // Max iterations reached
    return NextResponse.json({
      message:
        "Agent reached maximum steps. Here are the jobs found so far.",
      jobsAdded: addedJobs,
      done: true,
    });
  } catch (err) {
    console.error("/api/agent error:", err);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}