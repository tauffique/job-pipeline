"use client";

import { useState } from "react";
import type { Job } from "@/lib/store";

type Lang = "en" | "de";
type DocType = "cv" | "cl";

interface Props {
  job: Job;
  onGenerateLang?: (lang: Lang) => void;
  generatingLang?: Lang | null;
}

export default function LatexPanel({ job, onGenerateLang, generatingLang }: Props) {
  const [lang, setLang]     = useState<Lang>("en");
  const [docType, setDocType] = useState<DocType>("cv");
  const [copied, setCopied] = useState(false);

  const latex = docType === "cv"
    ? (lang === "en" ? job.cvLatexEN : job.cvLatexDE)
    : (lang === "en" ? job.clLatexEN : job.clLatexDE);

  const handleLangSwitch = (l: Lang) => {
    setLang(l);
    if (l === "de" && !job.cvLatexDE && onGenerateLang) onGenerateLang("de");
    if (l === "en" && !job.cvLatexEN && onGenerateLang) onGenerateLang("en");
  };

  const handleCopy = async () => {
    if (!latex) return;
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = generatingLang === lang;

  const STEPS = ["Copy LaTeX", "Open Overleaf → New Project → Blank", "Paste into main.tex",
    docType === "cv" ? "Upload photo.png to root" : "Update recipient address", "Compiler → XeLaTeX → Compile"];

  return (
    <div style={{ borderTop: "1px solid #f1f5f9" }}>
      {/* Controls */}
      <div style={{ padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="section-label">Overleaf LaTeX</span>

        {/* Language toggle */}
        <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {(["en", "de"] as Lang[]).map(l => (
            <button key={l} onClick={() => handleLangSwitch(l)} style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              background: lang === l ? "#4f46e5" : "white", color: lang === l ? "white" : "#64748b",
            }}>
              {l === "en" ? "English" : "Deutsch"}
              {l === "de" && !job.cvLatexDE && generatingLang !== "de" && <span style={{ fontSize: 9, opacity: 0.6 }}> +gen</span>}
            </button>
          ))}
        </div>

        {/* Doc type toggle */}
        <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {([["cv", "📄 CV"], ["cl", "✉️ Cover Letter"]] as [DocType, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setDocType(v as DocType)} style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              background: docType === v ? "#7c3aed" : "white", color: docType === v ? "white" : "#64748b",
            }}>{label}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <button onClick={handleCopy} className={copied ? "btn-green" : "btn-ghost"} style={{ fontSize: 12 }}>
          {copied ? "Copied ✓" : "Copy LaTeX"}
        </button>
        <a href="https://www.overleaf.com/project" target="_blank" rel="noopener noreferrer"
          className="btn-secondary" style={{ fontSize: 12, textDecoration: "none" }}>
          Open Overleaf ↗
        </a>
      </div>

      {/* Steps */}
      <div style={{ padding: "8px 20px", background: "#fafafa", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 20, flexWrap: "wrap" }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#eef2ff", color: "#4f46e5", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
            {step}
          </div>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "32px 20px", textAlign: "center", background: "#f8fafc" }}>
          <div style={{ width: 20, height: 20, border: "2px solid #4f46e5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>Generating {lang === "de" ? "Deutsch" : "English"} version (~$0.005)…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <pre className="latex-block" style={{ margin: 0, borderRadius: 0 }}>
          {latex || `Click "Generate ${lang.toUpperCase()}" to create the ${lang === "de" ? "Deutsch" : "English"} version.`}
        </pre>
      )}
    </div>
  );
}