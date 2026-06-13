"use client";

import { useState } from "react";
import type { Job } from "@/lib/store";
import LatexPanel from "./LatexPanel";

interface Props {
  job: Job;
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onRemove: (id: string) => void;
  onApply:  (job: Job) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn:    "#0A66C2",
  StepStone:   "#E8001D",
  "Indeed DE": "#2557A7",
  Xing:        "#006567",
  Other:       "#6366f1",
};

const ROLE_TYPE_COLORS: Record<string, string> = {
  Werkstudent: "#6366f1",
  Internship:  "#8b5cf6",
  Thesis:      "#0891b2",
  "Full-time": "#0f172a",
  Other:       "#64748b",
};

const scoreColor = (s: number) => s >= 75 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";
const scoreBg    = (s: number) => s >= 75 ? "#f0fdf4" : s >= 50 ? "#fffbeb" : "#fef2f2";

export default function JobCard({ job, onUpdate, onRemove, onApply }: Props) {
  const [scoring,      setScoring]      = useState(false);
  const [generating,   setGenerating]   = useState<"en" | "de" | null>(null);
  const [genMode,      setGenMode]      = useState<"cv" | "cl">("cv");
  const [expanded,     setExpanded]     = useState(false);

  // ── Score ──────────────────────────────────────────────────
  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: job.jd }),
      });
      const data = await res.json();
      onUpdate(job.id, {
        score:        data.score        ?? 0,
        matchReasons: data.match_reasons ?? [],
        gaps:         data.gaps          ?? [],
        roleType:     data.role_type     ?? "Other",
        scoreSummary: data.summary       ?? null,
        status:       "scored",
      });
    } catch {
      onUpdate(job.id, { score: 0, status: "scored" });
    }
    setScoring(false);
  };

  // ── Generate — only the requested language ─────────────────
  const handleGenerate = async (lang: "en" | "de" = "en", mode: "cv" | "cl" | "both" = "cv") => {
    setGenerating(lang);
    setGenMode(mode === "cl" ? "cl" : "cv");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: job.jd, title: job.title, company: job.company, lang, mode }),
      });
      const data = await res.json();
      const updates: Partial<Job> = { status: "ready" };

      if (lang === "en") {
        if (data.cvLatexEN) updates.cvLatexEN = data.cvLatexEN;
        if (data.clLatexEN) updates.clLatexEN = data.clLatexEN;
        if (data.atsScore !== null && data.atsScore !== undefined) {
          updates.atsScore           = data.atsScore;
          updates.atsMatchedKeywords = data.atsMatchedKeywords ?? [];
          updates.atsMissingKeywords = data.atsMissingKeywords ?? [];
          updates.atsVerdict         = data.atsVerdict ?? null;
        }
      } else {
        if (data.cvLatexDE) updates.cvLatexDE = data.cvLatexDE;
        if (data.clLatexDE) updates.clLatexDE = data.clLatexDE;
      }
      onUpdate(job.id, updates);
      setExpanded(true);
    } catch {
      onUpdate(job.id, { status: "ready" });
    }
    setGenerating(null);
  };

  const isGenerating = generating !== null;
  const hasEN = !!job.cvLatexEN;
  const hasDE = !!job.cvLatexDE;
  const hasAny = hasEN || hasDE;
  const pColor = PLATFORM_COLORS[job.platform] ?? "#6366f1";

  return (
    <div className="card" style={{ marginBottom: 12 }}>

      {/* ── Card body ── */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>

          {/* Left: info */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Title + badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{job.title}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>@ {job.company}</span>
              {job.location && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>· {job.location}</span>
              )}
            </div>

            {/* Platform + role type + status badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <span className="badge" style={{ background: pColor + "15", color: pColor, border: `1px solid ${pColor}33` }}>
                {job.platform}
              </span>
              {job.roleType && (
                <span className="badge" style={{
                  background: ROLE_TYPE_COLORS[job.roleType] + "15",
                  color: ROLE_TYPE_COLORS[job.roleType],
                  border: `1px solid ${ROLE_TYPE_COLORS[job.roleType]}33`,
                }}>
                  {job.roleType}
                </span>
              )}
              {job.status === "ready" && (
                <span className="badge-green">LaTeX Ready ✓</span>
              )}
              <span style={{ fontSize: 11, color: "#cbd5e1" }}>Added {job.addedAt}</span>
            </div>

            {/* Score bar */}
            {job.score !== null && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Match score</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: scoreColor(job.score),
                    background: scoreBg(job.score),
                    padding: "1px 8px", borderRadius: 6,
                  }}>
                    {job.score}%
                  </span>
                  {job.scoreSummary && (
                    <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                      {job.scoreSummary}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, width: 240 }}>
                  <div style={{
                    height: 4,
                    borderRadius: 2,
                    background: scoreColor(job.score),
                    width: `${job.score}%`,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                {/* Match/gap tags */}
                {(job.matchReasons.length > 0 || job.gaps.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {job.matchReasons.map((r, i) => (
                      <span key={i} className="badge-green" style={{ fontSize: 10 }}>✓ {r}</span>
                    ))}
                    {job.gaps.map((g, i) => (
                      <span key={i} className="badge-red" style={{ fontSize: 10 }}>✗ {g}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end", flexShrink: 0 }}>

            {/* Score button */}
            {job.score === null && (
              <button className="btn-secondary" onClick={handleScore} disabled={scoring} style={{ fontSize: 12 }}>
                {scoring ? "Scoring…" : "Score Match"}
              </button>
            )}

            {/* Generate buttons — EN and DE separately */}
            {job.score !== null && (
              <>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textAlign: "right" }}>CV</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn-primary" onClick={() => handleGenerate("en", "cv")} disabled={isGenerating} style={{ fontSize: 11 }}>
                    {generating === "en" ? "…" : hasEN ? "↻ EN" : "EN CV"}
                  </button>
                  <button className="btn-secondary" onClick={() => handleGenerate("de", "cv")} disabled={isGenerating} style={{ fontSize: 11 }}>
                    {generating === "de" ? "…" : hasDE ? "↻ DE" : "DE CV"}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textAlign: "right", marginTop: 3 }}>Cover Letter</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn-ghost" onClick={() => handleGenerate("en", "cl")} disabled={isGenerating} style={{ fontSize: 11 }}>
                    {job.clLatexEN ? "↻ EN" : "EN CL"}
                  </button>
                  <button className="btn-ghost" onClick={() => handleGenerate("de", "cl")} disabled={isGenerating} style={{ fontSize: 11 }}>
                    {job.clLatexDE ? "↻ DE" : "DE CL"}
                  </button>
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>~$0.003 per generate</span>
              </>
            )}

            {/* View/hide LaTeX */}
            {hasAny && (
              <button className="btn-ghost" onClick={() => setExpanded(e => !e)} style={{ fontSize: 12 }}>
                {expanded ? "Hide" : "View LaTeX"}
              </button>
            )}

            {/* Mark applied */}
            {job.status === "ready" && (
              <button className="btn-green" onClick={() => onApply(job)} style={{ fontSize: 12 }}>
                Mark Applied →
              </button>
            )}

            {/* Remove */}
            <button className="btn-danger" onClick={() => onRemove(job.id)} style={{ fontSize: 12 }}>
              Remove
            </button>
          </div>
        </div>

            {/* ATS Score Panel — shown after generation */}
            {job.atsScore !== null && job.atsScore !== undefined && (
              <div style={{
                marginTop: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>ATS Keyword Coverage</span>
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: job.atsScore >= 75 ? "#16a34a" : job.atsScore >= 60 ? "#d97706" : "#dc2626",
                    background: job.atsScore >= 75 ? "#f0fdf4" : job.atsScore >= 60 ? "#fffbeb" : "#fef2f2",
                    padding: "2px 10px", borderRadius: 6,
                    border: `1px solid ${job.atsScore >= 75 ? "#bbf7d0" : job.atsScore >= 60 ? "#fde68a" : "#fecaca"}`,
                  }}>
                    {job.atsScore}%
                  </span>
                  {job.score !== null && (
                    <span style={{ fontSize: 11 }}>
                      {job.atsScore >= job.score
                        ? <span style={{ color: "#16a34a", fontWeight: 600 }}>↑ +{job.atsScore - job.score}pts vs profile score</span>
                        : <span style={{ color: "#94a3b8" }}>profile score: {job.score}%</span>
                      }
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
                    achievable JD keywords in CV
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, marginBottom: 8 }}>
                  <div style={{
                    height: 5, borderRadius: 3,
                    background: job.atsScore >= 75 ? "#16a34a" : job.atsScore >= 60 ? "#d97706" : "#dc2626",
                    width: `${job.atsScore}%`,
                    transition: "width 0.6s ease",
                  }} />
                </div>

                {job.atsVerdict && (
                  <p style={{ fontSize: 11, color: "#475569", margin: "0 0 8px", fontStyle: "italic" }}>
                    {job.atsVerdict}
                  </p>
                )}

                {/* Matched keywords */}
                {job.atsMatchedKeywords?.length > 0 && (
                  <div style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", marginRight: 6 }}>✓ Matched</span>
                    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
                      {job.atsMatchedKeywords.slice(0, 8).map((k, i) => (
                        <span key={i} style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "1px 6px", borderRadius: 4 }}>{k}</span>
                      ))}
                      {job.atsMatchedKeywords.length > 8 && (
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>+{job.atsMatchedKeywords.length - 8} more</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Missing keywords */}
                {job.atsMissingKeywords?.length > 0 && (
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginRight: 6 }}>✗ Missing</span>
                    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
                      {job.atsMissingKeywords.slice(0, 6).map((k, i) => (
                        <span key={i} style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "1px 6px", borderRadius: 4 }}>{k}</span>
                      ))}
                    </span>
                    {job.atsMissingKeywords.length > 0 && (
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "4px 0 0", fontStyle: "italic" }}>
                        These are achievable keywords from the JD your CV could still include.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Generating progress indicator */}
            {generating && (
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, border: "2px solid #4f46e5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Generating {generating === "de" ? "Deutsch" : "English"} {genMode === "cl" ? "Cover Letter" : "CV"}…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

      {/* LaTeX panel */}
      {expanded && hasAny && <LatexPanel job={job} onGenerateLang={handleGenerate} generatingLang={generating} />}
    </div>
  );
}