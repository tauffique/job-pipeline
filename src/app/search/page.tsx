"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { pipelineStore, newJobId, type Job, type Platform } from "@/lib/store";

const PLATFORMS = [
  { id: "linkedin",  name: "LinkedIn",    color: "#0A66C2", getUrl: (q: string, l: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || "Germany")}&f_TPR=r604800` },
  { id: "stepstone", name: "StepStone",   color: "#E8001D", getUrl: (q: string, l: string) => `https://www.stepstone.de/jobs/${encodeURIComponent(q.replace(/ /g, "-"))}?radius=50&location=${encodeURIComponent(l || "Deutschland")}` },
  { id: "indeed",    name: "Indeed DE",   color: "#2557A7", getUrl: (q: string, l: string) => `https://de.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l || "Deutschland")}&fromage=7` },
  { id: "xing",      name: "Xing",        color: "#006567", getUrl: (q: string, l: string) => `https://www.xing.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || "Deutschland")}` },
];

const QUICK_QUERIES = [
  "Working Student Machine Learning",
  "Werkstudent KI Python",
  "Internship Data Science",
  "Thesis ML Industrie 4.0",
  "Werkstudent Full Stack Next.js",
  "Working Student Automation",
];

export default function SearchPage() {
  const router = useRouter();

  // Search config
  const [query, setQuery]       = useState("Working Student Machine Learning");
  const [location, setLocation] = useState("Deutschland");

  // Add job form
  const [jd, setJd]             = useState("");
  const [title, setTitle]       = useState("");
  const [company, setCompany]   = useState("");
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [loc, setLoc]           = useState("");

  // UI state
  const [parsing, setParsing]   = useState(false);
  const [added, setAdded]       = useState(false);
  const [parseError, setParseError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-parse JD as user types (debounced 900ms)
  useEffect(() => {
    if (!jd.trim() || jd.trim().length < 80) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setParsing(true);
      setParseError("");
      try {
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jd }),
        });
        const data = await res.json();
        if (data.title)    setTitle(data.title);
        if (data.company)  setCompany(data.company);
        if (data.platform && data.platform !== "Other") setPlatform(data.platform as Platform);
        if (data.location) setLoc(data.location);
      } catch {
        setParseError("Auto-parse failed — fill in manually.");
      }
      setParsing(false);
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [jd]);

  const handleAdd = () => {
    if (!jd.trim()) return;
    const job: Job = {
      id: newJobId(),
      title:    title    || "Untitled Role",
      company:  company  || "Unknown Company",
      platform: platform || "Other",
      location: loc      || "",
      jd,
      addedAt:  new Date().toLocaleDateString("de-DE"),
      status:   "queued",
      score:    null,
      matchReasons:  [],
      gaps:          [],
      roleType:      null,
      scoreSummary:  null,
      cvBullets:     null,
      coverLetter:   null,
      cvLatexEN:     null,
      cvLatexDE:     null,
      clLatexEN:     null,
      clLatexDE:     null,
      atsScore:           null,
      atsMatchedKeywords: [],
      atsMissingKeywords: [],
      atsVerdict:         null,
    };
    pipelineStore.add(job);
    setAdded(true);
    setJd(""); setTitle(""); setCompany(""); setLoc("");
    setTimeout(() => {
      setAdded(false);
      router.push("/pipeline");
    }, 1200);
  };

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
          Find jobs across 4 platforms
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Open a search link → find a role → paste the JD below. Fields auto-fill instantly.
        </p>
      </div>

      {/* Search config card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="section-label">Search Settings</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Keywords
              </label>
              <input
                className="input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Werkstudent Machine Learning"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Location
              </label>
              <input
                className="input"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Deutschland / Berlin"
              />
            </div>
          </div>

          {/* Quick query chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_QUERIES.map(qq => (
              <button
                key={qq}
                onClick={() => setQuery(qq)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${query === qq ? "#c7d2fe" : "#e2e8f0"}`,
                  background: query === qq ? "#eef2ff" : "white",
                  color: query === qq ? "#4f46e5" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {qq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {PLATFORMS.map(p => (
          <a
            key={p.id}
            href={p.getUrl(query, location)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div
              className="card"
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                marginBottom: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = p.color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${p.color}18`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: p.color + "15",
                  border: `1px solid ${p.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: p.color,
                }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 18, color: "#cbd5e1" }}>↗</span>
            </div>
          </a>
        ))}
      </div>

      {/* Add job card */}
      <div className="card">
        <div className="card-header">
          <span className="section-label">Add Job to Pipeline</span>
          {parsing && (
            <span style={{ fontSize: 11, color: "#6366f1", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 10, height: 10,
                border: "2px solid #6366f1",
                borderTopColor: "transparent",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }} />
              Auto-filling fields…
            </span>
          )}
        </div>

        <div style={{ padding: 20 }}>
          {/* JD textarea first */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
              Job Description <span style={{ color: "#94a3b8", fontWeight: 400 }}>(paste here — fields auto-fill)</span>
            </label>
            <textarea
              className="input"
              style={{ minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here…&#10;&#10;Title, company, and platform will be detected automatically."
            />
            {parseError && (
              <p style={{ fontSize: 11, color: "#dc2626", margin: "4px 0 0" }}>{parseError}</p>
            )}
          </div>

          {/* Auto-filled fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Job Title
              </label>
              <input
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Auto-detected"
                style={{ background: title ? "white" : "#fafafa" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Company
              </label>
              <input
                className="input"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Auto-detected"
                style={{ background: company ? "white" : "#fafafa" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Location
              </label>
              <input
                className="input"
                value={loc}
                onChange={e => setLoc(e.target.value)}
                placeholder="Auto-detected"
                style={{ background: loc ? "white" : "#fafafa" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
                Platform
              </label>
              <select
                className="input"
                value={platform}
                onChange={e => setPlatform(e.target.value as Platform)}
              >
                {PLATFORMS.map(p => <option key={p.id}>{p.name}</option>)}
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn-primary"
              onClick={handleAdd}
              disabled={!jd.trim() || parsing}
            >
              Add to Pipeline →
            </button>
            {added && (
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                ✓ Added! Redirecting to pipeline…
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}