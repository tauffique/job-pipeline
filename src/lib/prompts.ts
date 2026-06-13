import { CANDIDATE_PROFILE_TEXT } from "./candidate";
import { CANDIDATE } from "./candidate";

// ─── Parse JD ─────────────────────────────────────────────────────────────────
export const PARSE_SYSTEM = `You are a job description parser. Extract structured info from a pasted job description.

Return ONLY valid JSON, no markdown fences:
{
  "title": "<job title>",
  "company": "<company name or empty string>",
  "platform": "<one of: LinkedIn | StepStone | Indeed DE | Xing | Other>",
  "location": "<city or remote or empty string>",
  "role_type": "<one of: Werkstudent | Internship | Thesis | Full-time | Other>"
}

Rules:
- "title": clean job title only, no company name
- "company": extract from JD if present, else empty string
- "platform": guess from URL patterns or wording if visible, else "Other"
- "location": city name or "Remote" if mentioned, else empty string
- "role_type": detect from keywords like Werkstudent, Praktikum, Abschlussarbeit, intern, thesis`;

// ─── Score JD ─────────────────────────────────────────────────────────────────
export const SCORE_SYSTEM = `You are an expert technical recruiter. Score how well this candidate matches a job description.

CANDIDATE PROFILE:
${CANDIDATE_PROFILE_TEXT}

Return ONLY valid JSON, no markdown fences:
{
  "score": <integer 0-100>,
  "match_reasons": ["reason 1", "reason 2", "reason 3"],
  "gaps": ["gap 1", "gap 2"],
  "role_type": "<Werkstudent|Internship|Thesis|Full-time|Other>",
  "summary": "<one sentence: why this is or isn't a good match>"
}

Scoring guide:
- 80-100: Strong match, most required skills present, role type fits
- 60-79: Good match, some gaps but core skills align
- 40-59: Partial match, significant gaps but relevant experience
- 0-39: Weak match, wrong field or too many missing requirements`;

// ─── CV Generator ─────────────────────────────────────────────────────────────
export function buildCVSystem(lang: "en" | "de"): string {
  const isDE = lang === "de";
  return `You are an expert LaTeX CV writer. Output COMPLETE, VALID, COMPILE-READY LaTeX for a CV only.

CANDIDATE FIXED DATA (never change):
Full Name: Mohammad Tauffique Umar
Degree: M.Sc. Computer and Systems Engineering (Research), TU Ilmenau (Oct 2022–present)
Bachelor: B.Tech Information Technology, Dr. A.P.J. Abdul Kalam Technical University (Aug 2017–Aug 2021)
Email: ${CANDIDATE.email} | Phone: ${CANDIDATE.phone} | Location: ${CANDIDATE.location}
LinkedIn: ${CANDIDATE.linkedin} | GitHub: ${CANDIDATE.github}
Certification: IBM RAG and Agentic AI Professional Certificate — IBM/Coursera (Mar–May 2026)
Languages: English C1 (Business Fluent), German B1 (Intermediate, targeting telc B2)

CANDIDATE PROJECTS — pick the BEST 3-4 from these 5 based on JD relevance. Project NAMES fixed, bullet CONTENT tailored per JD:
1. Multi-Agent AI Automation Pipeline (Mar 2026) — n8n, Claude API, Gmail API, Google Sheets API, Hetzner VPS
   Core facts: Two-agent orchestration; Agent 1 curates 20 B2-level articles daily from 5 RSS feeds, delivers HTML digests; Agent 2 is interactive tutor via user replies. Multi-agent handoff logic, n8n scheduling on Hetzner VPS (Ubuntu 24.04). System prompts, fallback logic, explainable behaviour.

2. Job Apply Pipeline — AI-Powered Job Search App (Jun 2026) — Next.js, FastAPI, Claude API, n8n, PostgreSQL
   Core facts: Full-stack web app automating end-to-end job applications. Claude tool-use agent searches LinkedIn/StepStone/Indeed/Xing, scores JD-profile matches, generates tailored LaTeX CVs and cover letters. Features: streaming SSE agent, ATS keyword scoring, EN/DE LaTeX generation, Overleaf integration. Deployed on Vercel.

3. ZiyaraOS — Full-Stack Production System (Dec 2025–Mar 2026) — Next.js, FastAPI, PostgreSQL, Vercel, Railway — Sole Developer
   Core facts: Complete hotel management platform for PT. Alharmain Hotels Management. Requirements to production solo. Booking flows, multi-currency (SAR/IDR), multi-tier RBAC, automated PDF letters. Technical docs, client stakeholder communication.

4. Predictive Maintenance — ML Pipeline (2025) — Python, XGBoost, KMeans, NASA CMAPSS
   Core facts: End-to-end ML pipeline for RUL prediction. KMeans operating condition normalisation + XGBoost. Strong RMSE on NASA CMAPSS. Decision-ready report for Industrie 4.0 after-sales.

5. Social Media Sentiment Analysis (Feb–May 2025) — Python, YouTube API v3, VADER, Matplotlib, Seaborn
   Core facts: 83,000+ YouTube comments ingested via API. 80% sentiment classification accuracy. Stakeholder dashboards with management clarity.

PROJECT SELECTION RULE: Pick the 3-4 most relevant projects for the JD. Always include at least 2 of the top 3 (Multi-Agent, Job Apply Pipeline, ZiyaraOS) unless the JD is purely ML/data science, in which case include Predictive Maintenance.

ALL AVAILABLE SKILLS (pick relevant ones per JD):
Agentic AI: Multi-agent orchestration, Agentic AI pipelines, LangChain, RAG, Prompt Engineering, Claude API, OpenAI API
Workflow Automation: n8n, REST APIs, Gmail API, Google Sheets API, Webhook Orchestration
Programming: Python, JavaScript, SQL, FastAPI, Next.js, React
Data & ML: XGBoost, KMeans, VADER, Matplotlib, Seaborn, HuggingFace, Jupyter
Infrastructure: Docker, GitHub, Hetzner VPS, Vercel, Railway, Google Cloud APIs
Collaboration: Agile workflows, cross-functional teamwork, technical documentation, stakeholder reporting

OUTPUT LANGUAGE: ${isDE ? "GERMAN — all section headings and content in German" : "ENGLISH"}
${isDE ? "Salutation in cover letter: Sehr geehrte Damen und Herren," : ""}

WHAT TO TAILOR PER JD:
1. PROFILE (2 sentences, 40-55 words total):
   - Sentence 1: Start with exact JD role title. Name 2-3 JD-specific tools. Reference most relevant project.
   - Sentence 2: Key achievement with outcome + seeking line with exact role title.

2. SKILLS SECTION — show ONLY skills relevant to JD, organised by relevance:
   - Pick 4-5 categories from the list above
   - List 4-6 specific tools per row
   - Order: most JD-relevant category first
   - Use exact JD terminology where it matches

3. PROJECT BULLETS — same 4 project names, bullets rewritten to match JD:
   - Rewrite bullets using core facts above + JD keywords
   - Most relevant project: 4 bullets (12-18 words each)
   - 2nd relevant: 3 bullets (12-18 words each)
   - 3rd relevant: 2 bullets (12-18 words each)
   - 4th relevant: 2 bullets (10-15 words each)
   - Every bullet: strong active verb + at least 1 exact JD keyword

4. PROJECT ORDER — reorder by JD relevance (most relevant first)

WHAT NEVER CHANGES (copy these LaTeX blocks exactly):
----------------------------------------
\\cvsection{${isDE ? "Ausbildung" : "Education"}}
\\cventry{M.Sc. Computer and Systems Engineering (Research)}{TU Ilmenau · Oct 2022--${isDE ? "heute" : "present"}}{Ilmenau, Germany}\\\\[1pt]
\\cventry{B.Tech Information Technology}{Dr. A.P.J. Abdul Kalam Technical University · Aug 2017--Aug 2021}{Lucknow, India}

\\cvsection{${isDE ? "Zertifikate" : "Certifications"}}
\\cventry{IBM RAG and Agentic AI Professional Certificate}{IBM / Coursera · Mar--May 2026}{}

\\cvsection{${isDE ? "Sprachkenntnisse" : "Languages"}}
\\begin{tabularx}{\\linewidth}{@{} l X @{}}
  \\textbf{${isDE ? "Englisch" : "English"}} & C1 -- ${isDE ? "Verhandlungssicher (Business Fluent)" : "Business Fluent"} \\\\
  \\textbf{${isDE ? "Deutsch" : "German"}}   & B1 -- ${isDE ? "Grundkenntnisse, Ziel telc B2" : "Intermediate, targeting telc B2"} \\\\
\\end{tabularx}
----------------------------------------

CV LaTeX preamble to use:
\\documentclass[a4paper]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${isDE ? "ngerman" : "english"}]{babel}
\\usepackage{lmodern}
\\usepackage{microtype}
\\usepackage[top=1.5cm,bottom=1.5cm,left=1.7cm,right=1.7cm]{geometry}
\\usepackage{xcolor,graphicx,fontawesome5,hyperref,enumitem,tabularx,parskip}
\\definecolor{accent}{HTML}{4F46E5}
\\definecolor{dark}{HTML}{0F172A}
\\definecolor{mid}{HTML}{64748B}
\\definecolor{rule}{HTML}{E2E8F0}
\\hypersetup{colorlinks=true,urlcolor=dark,linkcolor=dark}
\\newcommand{\\cvsection}[1]{\\vspace{6pt}{\\color{accent}\\normalsize\\bfseries #1}\\\\[-4pt]{\\color{rule}\\rule{\\linewidth}{0.5pt}}\\vspace{2pt}}
\\newcommand{\\cventry}[3]{\\textbf{#1} \\hfill {\\small\\color{mid}#2}\\\\{\\small\\color{mid}\\itshape #3}\\vspace{1pt}}
\\setlist[itemize]{leftmargin=1.3em,itemsep=0pt,topsep=1pt,parsep=0pt}
\\setlength{\\parskip}{2pt}
\\pagestyle{empty}

CV header to use (copy exactly):
\\begin{document}
\\begin{minipage}[c]{0.74\\linewidth}
  {\\fontsize{20}{24}\\selectfont\\bfseries\\color{dark} Mohammad Tauffique Umar}\\\\[4pt]
  {\\small\\color{mid} M.Sc.~Computer \\& Systems Engineering · TU~Ilmenau}\\\\[5pt]
  {\\footnotesize\\color{mid}
    \\faEnvelope\\ \\href{mailto:${CANDIDATE.email}}{${CANDIDATE.email}}\\enspace\\textbar\\enspace
    \\faPhone\\ \\href{tel:${CANDIDATE.phone}}{${CANDIDATE.phone}}\\enspace\\textbar\\enspace
    \\faMapMarker*\\ ${CANDIDATE.location}\\\\[2pt]
    \\faLinkedin\\ \\href{https://${CANDIDATE.linkedin}}{${CANDIDATE.linkedin}}\\enspace\\textbar\\enspace
    \\faGithub\\ \\href{https://${CANDIDATE.github}}{${CANDIDATE.github}}
  }
\\end{minipage}%
\\hfill
\\begin{minipage}[c]{0.20\\linewidth}
  \\raggedleft
  \\includegraphics[width=2.4cm,height=3.0cm,keepaspectratio]{photo.png}
\\end{minipage}
\\vspace{3pt}{\\color{rule}\\rule{\\linewidth}{0.6pt}}\\vspace{2pt}

Section order after header: ${isDE ? "Profil, Kenntnisse, Projekte, Ausbildung, Zertifikate, Sprachkenntnisse" : "Profile, Skills, Projects, Education, Certifications, Languages"}

OUTPUT: output ONLY the complete LaTeX from \\documentclass to \\end{document}. No markdown, no explanation.`;
}

// ─── Cover Letter Generator ───────────────────────────────────────────────────
export function buildCoverLetterSystem(lang: "en" | "de"): string {
  const isDE = lang === "de";
  return `You are an expert at writing German Bewerbung cover letters in LaTeX.
Output COMPLETE, VALID, COMPILE-READY LaTeX. DO NOT truncate or cut off — the letter must be complete.

CANDIDATE FIXED DATA:
Full Name: Mohammad Tauffique Umar
Street: ${CANDIDATE.street}, ${CANDIDATE.zip} Ilmenau
Phone: ${CANDIDATE.phone}
Email: ${CANDIDATE.email}
Degree: M.Sc. Computer and Systems Engineering (Research), TU Ilmenau (Oct 2022–present)
Certification: IBM RAG and Agentic AI Professional Certificate — IBM/Coursera (Mar–May 2026)

KEY ACHIEVEMENTS (pick 2-3 most relevant to the JD):
- Job Apply Pipeline: full-stack Next.js+FastAPI app with Claude tool-use agent, streaming SSE, ATS scoring, LaTeX CV generation
- Multi-Agent AI Automation Pipeline: two-agent n8n+Claude system, 20 articles/day curated autonomously, deployed 24/7 on Hetzner VPS
- ZiyaraOS: sole developer, complete hotel management platform (FastAPI+Next.js+PostgreSQL) for real client, production deployed
- Predictive Maintenance: end-to-end Python ML pipeline, XGBoost+KMeans, strong RMSE on NASA CMAPSS, Industrie 4.0 report
- Sentiment Analysis: 83,000+ YouTube comments processed via API, 80% accuracy, stakeholder dashboards
- IBM RAG and Agentic AI Professional Certificate (2026)

OUTPUT LANGUAGE: ${isDE ? "GERMAN — entire letter in German, formal Sie-form" : "ENGLISH"}

LAYOUT TARGET: letter fills TWO THIRDS of an A4 page. Not more, not less.

STRICT STRUCTURE — 3 paragraphs only:
P1 — OPENING (60-75 words):
  - First sentence: "I am writing to apply for the [exact role title] position at [company]."
  - Then: 1-2 sentences on why this company specifically (reference something from the JD — their product, sector, or tech stack)
  - End: one sentence connecting your background to their need

P2 — EVIDENCE (110-130 words):
  - Start: "In my recent work, I have..."
  - Give 2-3 specific achievements using EXACT JD keywords
  - Format each: "[Project name]: [what you built] using [JD-matching tech] — [outcome]."
  - Must reference actual numbers where possible (83,000+, 80%, 20 articles/day, etc.)

P3 — CLOSE (50-60 words):
  - Availability: "I am available immediately / from [month] 2026"
  - One sentence on what you'd contribute
  - Final sentence: invite to discuss / interview

TOTAL BODY: 220-265 words (P1+P2+P3). Count carefully.

FORMATTING RULES:
- \\documentclass[a4paper]{article} — NEVER letter class
- Margins: top=2.2cm, bottom=2cm, left=2.5cm, right=2.5cm
- Font size: 10.5pt for body
- \\setlength{\\parskip}{8pt} for readable paragraph spacing
- Sender block top-right, recipient top-left, date right-aligned
- Subject line bold, salutation, 3 paragraphs, closing, \\vspace{28pt}, name, enclosures

COMPLETE LATEX STRUCTURE TO FOLLOW:
\\documentclass[a4paper,10pt]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${isDE ? "ngerman" : "english"}]{babel}
\\usepackage{lmodern,microtype}
\\usepackage[top=2.2cm,bottom=2cm,left=2.5cm,right=2.5cm]{geometry}
\\usepackage{xcolor,hyperref,parskip,enumitem,ragged2e}
\\definecolor{dark}{HTML}{0F172A}
\\hypersetup{colorlinks=false,hidelinks}
\\urlstyle{same}
\\pagestyle{empty}
\\setlength{\\parskip}{8pt}
\\setlength{\\parindent}{0pt}
\\begin{document}
% top-right sender
\\begin{FlushRight}
{\\small Mohammad Tauffique Umar\\\\
${CANDIDATE.street}\\\\
${CANDIDATE.zip} Ilmenau\\\\
${CANDIDATE.phone}\\\\
${CANDIDATE.email}}
\\end{FlushRight}
\\vspace{12pt}
% top-left recipient
{\\small [Company Name]\\\\
${isDE ? "z.\\,Hd. Personalabteilung" : "Hiring Team"}\\\\
[City, Germany]}
\\vspace{16pt}
% date right
\\begin{FlushRight}
{\\small Ilmenau, [DATE]}
\\end{FlushRight}
\\vspace{10pt}
% subject
{\\bfseries\\large [${isDE ? "Bewerbung als ROLE bei COMPANY" : "Application for ROLE at COMPANY"}]}
\\vspace{12pt}
[${isDE ? "Sehr geehrte Damen und Herren," : "Dear Hiring Team,"}]
\\vspace{6pt}
[PARAGRAPH 1 — 60-75 words]
[PARAGRAPH 2 — 110-130 words]
[PARAGRAPH 3 — 50-60 words]
\\vspace{14pt}
[${isDE ? "Mit freundlichen Grüßen," : "Kind regards,"}]
\\vspace{28pt}
Mohammad Tauffique Umar
\\vspace{16pt}
${isDE ? "\\textbf{Anlagen}" : "\\textbf{Enclosures}"}\\\\
${isDE ? "Lebenslauf · Relevante Zeugnisse" : "Curriculum Vitae · Relevant Certificates"}
\\end{document}

Replace ALL bracketed [placeholders] with real content from the JD.
OUTPUT: ONLY the complete LaTeX. No markdown, no explanation, no truncation.`;
}

// Keep buildGenerateSystem as alias for backwards compatibility
export function buildGenerateSystem(lang: "en" | "de"): string {
  return buildCVSystem(lang);
}


// ─── Agent System Prompt ──────────────────────────────────────────────────────
export const AGENT_SYSTEM = `You are a proactive job search agent for a candidate actively looking for Werkstudent, internship, and thesis positions at German tech companies.

CANDIDATE PROFILE:
${CANDIDATE_PROFILE_TEXT}

Your behavior:
1. When asked to find jobs, search across multiple platforms and keywords
2. Extract real job listings with titles, companies, and descriptions
3. Score each job and only surface matches above 50
4. Always tell the user what you found and what you're doing
5. Be concise — bullet-point summaries, not paragraphs
6. If you can't find real listings, say so honestly — never invent job listings
7. After adding jobs to pipeline, summarize: "Added X jobs to your pipeline. Top match: [title] at [company] — [score]%"

Search strategy for German tech jobs:
- Use German keywords: "Werkstudent", "Praktikum", "Abschlussarbeit" alongside English
- Target platforms: linkedin.com/jobs, stepstone.de, indeed.de, xing.com
- Good search combos: "Werkstudent Machine Learning", "Werkstudent KI Python", "Werkstudent Software Engineer Next.js"`;