import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCVSystem } from "@/lib/prompts";

const client = new Anthropic();

const ATS_SCORE_SYSTEM = `You are an ATS keyword coverage analyzer. Your ONLY job is to check if keywords from the JD appear in the CV text.

STEP 1 — FILTER OUT GENUINE GAPS (skills the candidate does NOT have):
Remove these from consideration entirely — they are NOT achievable, do NOT count as missing:
- Hardware, embedded systems, hardware-software integration, firmware, PCB, FPGA
- C, C++, C#, Java, Rust, Go, Kotlin, Swift (unless the JD is about Python/JS)
- Consulting, hardware consulting, industry clients, government sector, administration clients
- SAP, ABAP, Oracle, Salesforce, legacy systems
- Civil engineering, mechanical engineering, electrical engineering
- Any domain the candidate clearly has no background in

STEP 2 — IDENTIFY ACHIEVABLE KEYWORDS (from this candidate's real background):
The candidate HAS these skills — if the JD mentions them, they are achievable:
Python, FastAPI, REST API, backend development, API development, web development
Next.js, React, JavaScript, TypeScript, frontend, full-stack
PostgreSQL, SQL, databases, Docker, GitHub, Git, CI/CD
n8n, automation, workflow automation, webhook, integration
Claude API, OpenAI API, LLM, AI, machine learning, ML, NLP
Multi-agent, agentic AI, agent orchestration, LangChain, RAG, prompt engineering
XGBoost, KMeans, data science, data analysis, Jupyter, HuggingFace
Hetzner VPS, Railway, Vercel, cloud deployment, DevOps, Linux, Ubuntu
Gmail API, Google Sheets API, Google Cloud, REST APIs
Technical documentation, stakeholder reporting, agile, project management
Werkstudent, internship, student, part-time

STEP 3 — SCORE:
ats_score = (achievable JD keywords found in CV) / (total achievable JD keywords) * 100

matched_keywords = achievable keywords that ARE in the CV
missing_keywords = achievable keywords NOT in the CV (candidate has them but CV missed them)
NEVER put genuine gaps in missing_keywords.

A well-tailored CV should score 75-95% on achievable keywords.

Return ONLY valid JSON (no markdown):
{"ats_score":<0-100>,"matched_keywords":["k1","k2"],"missing_keywords":["k1"],"verdict":"<one sentence about achievable keyword coverage>"}`;

function stripLatex(latex: string): string {
  return latex
    .replace(/\\[a-zA-Z]+(\[.*?\])?\{([^}]*)\}/g, "$2")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateCV(lang: "en" | "de", jd: string, title: string, company: string, today: string) {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3500,
    system: buildCVSystem(lang),
    messages: [{
      role: "user",
      content: `Generate a full one-page tailored CV in LaTeX.

ROLE: ${title || "Position"}
COMPANY: ${company || "Company"}
TODAY: ${today}

Follow the exact word/line budgets:
- Profile: 40-55 words, 2 sentences
- Projects: 11 bullets minimum (4+3+2+2), each 12-18 words
- Skills: 4-5 rows, relevant to JD only

JOB DESCRIPTION:
${jd.slice(0, 2500)}

Output ONLY complete LaTeX from \\documentclass to \\end{document}.`,
    }],
  });
  return res.content.map(b => b.type === "text" ? b.text : "").join("").trim();
}

async function generateCL(lang: "en" | "de", jd: string, title: string, company: string, today: string) {
  const isDE = lang === "de";
  const { CANDIDATE } = await import("@/lib/candidate");

  // Haiku generates ONLY the text content — no LaTeX, no structure
  // This keeps token usage low and prevents truncation
  const contentRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: `You write cover letter body text only — no LaTeX, no formatting, no greetings.
Output EXACTLY 3 paragraphs separated by blank lines.

CANDIDATE:
Mohammad Tauffique Umar, M.Sc. CSE student TU Ilmenau.
Projects: Multi-Agent AI Pipeline (n8n+Claude, 20 articles/day, Hetzner VPS), ZiyaraOS (FastAPI+Next.js+PostgreSQL, solo delivered for real client), Predictive Maintenance (XGBoost+KMeans, NASA CMAPSS, 80% accuracy), Job Apply Pipeline (Claude tool-use agent, Next.js, Vercel).
Skills: Python, FastAPI, REST APIs, n8n, Claude API, Next.js, PostgreSQL, Docker, Hetzner VPS, XGBoost, LangChain, RAG.
IBM RAG and Agentic AI Professional Certificate (2026). English C1, German B1.

PARAGRAPH RULES:
P1 (55-70 words): "I am writing to apply for [exact role] at [company]." Then: why this company specifically (reference their product/sector from JD). End: connect your background to their need.
P2 (100-120 words): "In my recent work," then 2-3 achievements using EXACT JD keywords. Each: [Project]: [what built] using [JD tech] — [outcome with number].
P3 (45-55 words): Availability statement + one contribution sentence + invite to interview.

Output ${isDE ? "in German (formal Sie-form)" : "in English"}. Plain text only — no LaTeX, no bullet points, no headers.`,
    messages: [{
      role: "user",
      content: `Write cover letter body for:
ROLE: ${title || "Position"}
COMPANY: ${company || "Company"}
JD: ${jd.slice(0, 1500)}`,
    }],
  });

  const bodyText = contentRes.content.map(b => b.type === "text" ? b.text : "").join("").trim();
  const paragraphs = bodyText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // Escape special LaTeX chars in the text
  const escapeLatex = (s: string) => s
    .replace(/&/g, "\\&").replace(/%/g, "\\%").replace(/#/g, "\\#")
    .replace(/\$/g, "\\$").replace(/_/g, "\\_").replace(/\^/g, "\\^{}");

  const salutation = isDE ? "Sehr geehrte Damen und Herren," : "Dear Hiring Team,";
  const closing    = isDE ? "Mit freundlichen Grüßen," : "Kind regards,";
  const subject    = isDE
    ? `Bewerbung als ${escapeLatex(title || "Werkstudent")} bei ${escapeLatex(company || "Ihrem Unternehmen")}`
    : `Application for ${escapeLatex(title || "Position")} at ${escapeLatex(company || "Your Company")}`;
  const encLabel   = isDE ? "\\textbf{Anlagen}" : "\\textbf{Enclosures}";
  const encItems   = isDE ? "Lebenslauf $\\cdot$ Relevante Zeugnisse" : "Curriculum Vitae $\\cdot$ Relevant Certificates";
  const babel      = isDE ? "ngerman" : "english";

  return `\\documentclass[a4paper,10pt]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${babel}]{babel}
\\usepackage{lmodern,microtype}
\\usepackage[top=2.2cm,bottom=2cm,left=2.5cm,right=2.5cm]{geometry}
\\usepackage{hyperref,parskip,ragged2e}
\\hypersetup{colorlinks=false,hidelinks}
\\urlstyle{same}
\\pagestyle{empty}
\\setlength{\\parskip}{9pt}
\\setlength{\\parindent}{0pt}
\\begin{document}

\\begin{FlushRight}
{\\small Mohammad Tauffique Umar\\\\
${CANDIDATE.street}\\\\
${CANDIDATE.zip} Ilmenau\\\\
${CANDIDATE.phone}\\\\
${CANDIDATE.email}}
\\end{FlushRight}

\\vspace{10pt}

{\\small ${escapeLatex(company || "Company Name")}\\\\
${isDE ? "z.\\,Hd. Personalabteilung" : "Hiring Team"}\\\\
Germany}

\\vspace{14pt}

\\begin{FlushRight}
{\\small Ilmenau, ${today}}
\\end{FlushRight}

\\vspace{10pt}

{\\bfseries\\large ${subject}}

\\vspace{12pt}

${salutation}

\\vspace{4pt}

${paragraphs.map(p => escapeLatex(p)).join("\n\n")}

\\vspace{14pt}

${closing}

\\vspace{28pt}

Mohammad Tauffique Umar

\\vspace{14pt}

${encLabel}\\\\
${encItems}

\\end{document}`;
}

async function scoreATS(cvLatex: string, jd: string) {
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: ATS_SCORE_SYSTEM,
      messages: [{
        role: "user",
        content: `TAILORED CV TEXT (after stripping LaTeX):\n${stripLatex(cvLatex).slice(0, 2500)}\n\nJOB DESCRIPTION:\n${jd.slice(0, 1500)}`,
      }],
    });
    const raw = res.content.map(b => b.type === "text" ? b.text : "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  } catch {
    return { ats_score: null, matched_keywords: [], missing_keywords: [], verdict: "" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { jd, title, company, lang = "en", mode = "cv" } = await req.json();
    if (!jd?.trim()) return NextResponse.json({ error: "No JD provided" }, { status: 400 });

    const today = new Date().toLocaleDateString(
      lang === "de" ? "de-DE" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" }
    );

    let cvLatex = "", clLatex = "";
    let atsScore = null, atsMatchedKeywords: string[] = [], atsMissingKeywords: string[] = [], atsVerdict = "";

    if (mode === "cv" || mode === "both") {
      cvLatex = await generateCV(lang, jd, title, company, today);
      // ATS score only for CV
      const ats = await scoreATS(cvLatex, jd);
      atsScore = ats.ats_score;
      atsMatchedKeywords = ats.matched_keywords ?? [];
      atsMissingKeywords = ats.missing_keywords ?? [];
      atsVerdict = ats.verdict ?? "";
    }

    if (mode === "cl" || mode === "both") {
      clLatex = await generateCL(lang, jd, title, company, today);
    }

    return NextResponse.json({
      [`cvLatex${lang.toUpperCase()}`]:   cvLatex || undefined,
      [`clLatex${lang.toUpperCase()}`]:   clLatex || undefined,
      cvBullets: "", coverLetter: "",
      atsScore, atsMatchedKeywords, atsMissingKeywords, atsVerdict,
    });
  } catch (err) {
    console.error("/api/generate error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}