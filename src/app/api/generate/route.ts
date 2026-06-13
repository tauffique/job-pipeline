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

  const contentRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,  // tight limit forces brevity
    system: `Write ONLY the body text of a cover letter — no LaTeX, no greetings, no closing.
Output EXACTLY 3 short paragraphs separated by a blank line.
Language: ${isDE ? "German (formal Sie-form)" : "English"}.

CANDIDATE: Mohammad Tauffique Umar, M.Sc. CSE, TU Ilmenau.
Key projects: ZiyaraOS (FastAPI+PostgreSQL+Next.js, sole developer, real client), Multi-Agent Pipeline (n8n+Claude API, 20 articles/day, Hetzner VPS), Predictive Maintenance (XGBoost+KMeans, NASA CMAPSS), Sentiment Analysis (83k+ YouTube comments, 80% accuracy).
Skills: Python, FastAPI, REST APIs, PostgreSQL, Docker, n8n, Claude API, Next.js, Hetzner VPS.

STRICT word limits — do NOT exceed:
P1 = 40-50 words: "I am applying for [role] at [company]." + why this company (1 sentence from JD). + your match (1 sentence).
P2 = 55-65 words: "In [Project 1], I [verb] [JD keyword] to [outcome]." + "In [Project 2], I [verb] [JD keyword] achieving [number/result]." Use EXACT words from the JD.
P3 = 35-45 words: Availability ("immediately available" or "available from [month] 2026") + one value sentence + invite.

Total: MAX 160 words. Be concise. Do not write more than specified.`,
    messages: [{
      role: "user",
      content: `ROLE: ${title || "Position"}
COMPANY: ${company || "Company"}
JD KEYWORDS TO USE: ${jd.slice(0, 800)}`,
    }],
  });

  const bodyText = contentRes.content.map(b => b.type === "text" ? b.text : "").join("").trim();
  const paragraphs = bodyText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

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