export const CANDIDATE = {
  name: "Tauffique",
  fullName: "Mohammad Tauffique Umar",
  title: "M.Sc. Computer & Systems Engineering",
  university: "TU Ilmenau, Germany",
  email: "tauffique@icloud.com",
  phone: "+49 174 634 4155",
  location: "Ilmenau, Germany",
  street: "Helmholtzring 3",
  zip: "98693",
  linkedin: "linkedin.com/in/tauffique",
  github: "github.com/tauffique",
  languages: [
    { lang: "English", level: "C1", note: "Business Fluent" },
    { lang: "German",  level: "B1", note: "Intermediate, targeting telc B2" },
  ],
  seeking: ["Werkstudent", "Internship", "Thesis"],
  certifications: [
    {
      name: "IBM RAG and Agentic AI Professional Certificate",
      issuer: "IBM / Coursera",
      date: "Mar.–May 2026",
    },
  ],
  skills: {
    agenticAI:   ["Multi-agent orchestration", "Agentic AI pipelines", "LangChain", "RAG", "Prompt Engineering", "Claude API", "OpenAI API"],
    automation:  ["n8n", "REST APIs", "Gmail API", "Google Sheets API", "Webhook Orchestration"],
    programming: ["Python", "JavaScript", "SQL", "FastAPI", "Next.js", "React"],
    dataML:      ["XGBoost", "KMeans", "VADER", "Matplotlib", "Seaborn", "HuggingFace", "Jupyter"],
    infra:       ["Docker", "GitHub", "Hetzner VPS", "Vercel", "Railway", "Google Cloud APIs"],
    collab:      ["Agile workflows", "cross-functional teamwork", "technical documentation", "stakeholder reporting"],
  },
  projects: [
    {
      name: "Multi-Agent AI Automation Pipeline",
      date: "Mar. 2026",
      tech: ["n8n", "Claude API", "Gmail API", "Google Sheets API", "Hetzner VPS"],
      bullets: [
        "Designed and implemented a two-agent orchestration system: Agent 1 autonomously curates 20 B2-level articles daily from 5 RSS feeds using Claude Sonnet and delivers structured HTML email digests; Agent 2 acts as an interactive tutor triggered by user replies, reading context from Google Sheets and generating adaptive comprehension questions.",
        "Architected multi-agent handoff logic, scheduling, and deterministic workflow orchestration using n8n; deployed on self-hosted Hetzner VPS (Ubuntu 24.04) for 24/7 uptime.",
        "Designed all system prompts, agent roles, and fallback logic to ensure explainable, governed agent behaviour — directly analogous to enterprise agentic automation requirements.",
      ],
    },
    {
      name: "Job Apply Pipeline — AI-Powered Job Search App",
      date: "Jun. 2026",
      tech: ["Next.js", "FastAPI", "Claude API", "n8n", "PostgreSQL", "Vercel"],
      bullets: [
        "Built full-stack web app automating end-to-end job applications: Claude tool-use agent searches LinkedIn, StepStone, Indeed, and Xing; scores JD-profile match; generates tailored LaTeX CV and cover letter per application.",
        "Implemented streaming SSE agent pipeline with parallel job scoring (Promise.all), ATS keyword coverage analysis, and EN/DE LaTeX generation via Anthropic Haiku API.",
        "Deployed on Vercel with Next.js App Router, server-side API routes for secure Claude API calls, and localStorage-based application tracker.",
      ],
    },
    {
      name: "ZiyaraOS — Full-Stack Production System",
      date: "Dec. 2025 – Mar. 2026",
      tech: ["Next.js", "FastAPI", "PostgreSQL", "Vercel", "Railway"],
      role: "Sole Developer",
      bullets: [
        "Independently delivered a complete hotel management platform for PT. Alharmain Hotels Management — from requirements gathering and software architecture design to production deployment and client handover.",
        "Built booking flows, multi-currency payment tracking, multi-tier role-based access control (RBAC), and automated PDF confirmation letters; managed full delivery lifecycle solo.",
        "Prepared technical documentation, tracked progress, and communicated status updates directly with client stakeholders — mirroring PMO responsibilities in an agile environment.",
      ],
    },
    {
      name: "Predictive Maintenance — Machine Learning Pipeline",
      date: "2025",
      tech: ["Python", "XGBoost", "KMeans", "NASA CMAPSS Dataset"],
      bullets: [
        "Designed and implemented an end-to-end ML pipeline for Remaining Useful Life (RUL) prediction; used KMeans-based operating condition normalisation with XGBoost to achieve strong RMSE results on the NASA CMAPSS benchmark dataset.",
        "Documented model architecture, validation methodology, and results in a decision-ready technical report targeting Industrie 4.0 after-sales use cases.",
      ],
    },
    {
      name: "Sustainability in Sport: Social Media Sentiment Analysis",
      date: "Feb.–May 2025",
      tech: ["Python", "YouTube API v3", "VADER", "Matplotlib", "Seaborn"],
      bullets: [
        "Built a scalable end-to-end ML pipeline ingesting 83,000+ YouTube comments via API, achieving 80% sentiment classification accuracy across preprocessing, annotation, and iterative model training stages.",
        "Prepared and presented stakeholder-facing dashboards balancing technical depth with management-level clarity.",
      ],
    },
  ],
  education: [
    {
      degree: "M.Sc. Computer and Systems Engineering (Research)",
      institution: "Technische Universität Ilmenau",
      period: "Oct. 2022 – Present",
      location: "Ilmenau, Germany",
    },
    {
      degree: "B.Tech Information Technology",
      institution: "Dr. A.P.J. Abdul Kalam Technical University",
      period: "Aug. 2017 – Aug. 2021",
      location: "Lucknow, India",
    },
  ],
};

// ─── Flat text for Claude prompts ─────────────────────────────────────────────
export const CANDIDATE_PROFILE_TEXT = `
NAME: Mohammad Tauffique Umar
DEGREE: M.Sc. Computer and Systems Engineering, TU Ilmenau, Germany (Oct 2022–present)
BACHELOR: B.Tech Information Technology, Dr. APJ Abdul Kalam Technical University, Lucknow (2017–2021)
LOCATION: Ilmenau, Germany
LANGUAGES: English C1 (Business Fluent), German B1 (Intermediate, targeting telc B2)
CERTIFICATION: IBM RAG and Agentic AI Professional Certificate — IBM/Coursera (Mar–May 2026)
SEEKING: Werkstudent, Internship, Thesis positions at German tech companies

TECHNICAL SKILLS:
- Agentic AI: Multi-agent orchestration, Agentic AI pipelines, LangChain, RAG, Prompt Engineering, Claude API, OpenAI API
- Workflow Automation: n8n, REST APIs, Gmail API, Google Sheets API, Webhook Orchestration
- Programming: Python, JavaScript, SQL, FastAPI, Next.js, React
- Data & ML: XGBoost, KMeans, VADER, Matplotlib, Seaborn, HuggingFace, Jupyter
- Infrastructure: Docker, GitHub, Hetzner VPS, Vercel, Railway, Google Cloud APIs
- Collaboration: Agile workflows, cross-functional teamwork, technical documentation, stakeholder reporting

PROJECTS:
1. Multi-Agent AI Automation Pipeline (Mar 2026) — n8n, Claude API, Gmail API, Google Sheets API, Hetzner VPS
   Two-agent orchestration: Agent 1 curates 20 B2-level articles daily from 5 RSS feeds via Claude Sonnet, delivers HTML email digests; Agent 2 acts as interactive tutor via user replies with Google Sheets context. Deployed on self-hosted Hetzner VPS (Ubuntu 24.04) for 24/7 uptime. Designed system prompts, agent roles, fallback logic for explainable governed behaviour.

2. ZiyaraOS — Full-Stack Production System (Dec 2025–Mar 2026) — Next.js, FastAPI, PostgreSQL, Vercel, Railway (Sole Developer)
   Independently delivered complete hotel management platform for PT. Alharmain Hotels Management — requirements to production. Built booking flows, multi-currency payment tracking (SAR/IDR), multi-tier RBAC, automated PDF letters. Technical documentation and client stakeholder communication throughout.

3. ZiyaraOS — Full-Stack Production System (Dec 2025–Mar 2026) — Next.js, FastAPI, PostgreSQL, Vercel, Railway (Sole Developer)
   Independently delivered complete hotel management platform for PT. Alharmain Hotels Management. Booking flows, multi-currency (SAR/IDR), multi-tier RBAC, automated PDF letters. Client stakeholder communication throughout.

4. Predictive Maintenance — ML Pipeline (2025) — Python, XGBoost, KMeans, NASA CMAPSS
   End-to-end ML pipeline for RUL prediction. KMeans + XGBoost; strong RMSE on NASA CMAPSS. Industrie 4.0 decision-ready report.

5. Social Media Sentiment Analysis (Feb–May 2025) — Python, YouTube API v3, VADER, Matplotlib, Seaborn
   83,000+ YouTube comments via API; 80% sentiment classification accuracy. Stakeholder dashboards.

PROFILE SUMMARY:
M.Sc. CSE student at TU Ilmenau. Hands-on experience building agentic AI systems, multi-agent workflows, and full-stack production applications. Deployed two-agent n8n+Claude pipeline and delivered ZiyaraOS solo from architecture to client handover. Strong in Python, REST APIs, agent orchestration, LLM integration.
`.trim();