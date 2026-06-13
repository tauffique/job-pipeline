"use client";

import { useEffect, useRef, useState } from "react";
import { agentStore, pipelineStore, newMsgId, type AgentMessage, type Job } from "@/lib/store";

const SUGGESTIONS = [
  "Find Werkstudent Machine Learning jobs in Germany",
  "Search for AI internships in Berlin or Munich",
  "Find thesis positions in Industrie 4.0 or embedded ML",
  "Search Werkstudent Full Stack Next.js roles",
  "Find AI automation Werkstudent jobs on StepStone",
];

interface StreamChunk {
  type: "text" | "status" | "job_added" | "done" | "error";
  text?: string;
  job?: Job;
  jobsAdded?: Job[];
}

export default function AgentPage() {
  const [history, setHistory]         = useState<AgentMessage[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [statusText, setStatusText]   = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [sessionJobs, setSessionJobs] = useState<Job[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(agentStore.getHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: AgentMessage = {
      id: newMsgId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newHistory = agentStore.addMessage(userMsg);
    setHistory(newHistory);
    setInput("");
    setLoading(true);
    setStatusText("Thinking…");
    setStreamingText("");

    const addedThisRound: Job[] = [];
    let finalText = "";

    try {
      const messages = newHistory.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));

            if (chunk.type === "text") {
              finalText += chunk.text;
              setStreamingText(finalText);
              setStatusText("");
            } else if (chunk.type === "status") {
              setStatusText(chunk.text || "");
            } else if (chunk.type === "job_added" && chunk.job) {
              pipelineStore.add(chunk.job);
              addedThisRound.push(chunk.job);
              setSessionJobs(prev => [...prev, chunk.job!]);
            } else if (chunk.type === "done") {
              // Finalise
            } else if (chunk.type === "error") {
              finalText = chunk.text || "Something went wrong.";
              setStreamingText(finalText);
            }
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (err) {
      finalText = "Connection error. Please try again.";
    }

    // Save final assistant message
    const assistantMsg: AgentMessage = {
      id: newMsgId(),
      role: "assistant",
      content: finalText || (addedThisRound.length > 0
        ? `Added ${addedThisRound.length} job${addedThisRound.length !== 1 ? "s" : ""} to your pipeline.`
        : "Done."),
      timestamp: new Date().toISOString(),
      jobsAdded: addedThisRound,
    };
    const finalHistory = agentStore.addMessage(assistantMsg);
    setHistory(finalHistory);
    setStreamingText("");
    setStatusText("");
    setLoading(false);
  };

  const handleClear = () => {
    agentStore.clear();
    setHistory([]);
    setSessionJobs([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>

      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
            Job Search Agent
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Searches LinkedIn, StepStone, Indeed & Xing — scores matches in parallel — adds best ones to your pipeline.
          </p>
        </div>
        {history.length > 0 && (
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={handleClear}>
            Clear chat
          </button>
        )}
      </div>

      {/* Jobs added banner */}
      {sessionJobs.length > 0 && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, padding: "10px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
            ✓ {sessionJobs.length} job{sessionJobs.length !== 1 ? "s" : ""} added to your pipeline this session
          </span>
          <a href="/pipeline" style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
            View Pipeline →
          </a>
        </div>
      )}

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: "auto",
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: 20, marginBottom: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>

        {/* Empty state */}
        {history.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
              Job Search Agent
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px", maxWidth: 440, marginInline: "auto" }}>
              Tell me what kind of role to find. I'll search, score in parallel, and add the best matches to your pipeline automatically.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", background: "#f8fafc", border: "1px solid #e2e8f0",
                  color: "#475569", transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#eef2ff";
                    (e.currentTarget as HTMLElement).style.borderColor = "#c7d2fe";
                    (e.currentTarget as HTMLElement).style.color = "#4f46e5";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                    (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.color = "#475569";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message history */}
        {history.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
          }}>
            {msg.role === "assistant" && <Avatar label="A" color="#4f46e5" />}
            <div style={{ maxWidth: "75%" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: msg.role === "user" ? "#4f46e5" : "#f8fafc",
                border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                color: msg.role === "user" ? "white" : "#0f172a",
                fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>

              {/* Jobs added by this message */}
              {msg.jobsAdded && msg.jobsAdded.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {msg.jobsAdded.map((job: Job) => (
                    <JobChip key={job.id} job={job} />
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4,
                textAlign: msg.role === "user" ? "right" : "left" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            {msg.role === "user" && <Avatar label="T" color="#e2e8f0" textColor="#475569" />}
          </div>
        ))}

        {/* Streaming response (in progress) */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <Avatar label="A" color="#4f46e5" />
            <div style={{ maxWidth: "75%" }}>
              {streamingText ? (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "12px 12px 12px 2px",
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  color: "#0f172a", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
                }}>
                  {streamingText}
                  <span style={{
                    display: "inline-block", width: 2, height: 14,
                    background: "#4f46e5", marginLeft: 2, verticalAlign: "middle",
                    animation: "blink 1s step-end infinite",
                  }} />
                </div>
              ) : (
                <div style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  borderRadius: "12px 12px 12px 2px",
                  padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Dots />
                  {statusText && (
                    <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                      {statusText}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        display: "flex", gap: 10,
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "10px 14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <input
          className="input"
          style={{ border: "none", boxShadow: "none", padding: "4px 0", fontSize: 13 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask the agent to find jobs… (Enter to send)"
          disabled={loading}
        />
        <button
          className="btn-primary"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, fontSize: 13 }}
        >
          {loading ? "Working…" : "Send"}
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function Avatar({ label, color, textColor = "white" }: { label: string; color: string; textColor?: string }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, color: textColor, fontWeight: 700,
      flexShrink: 0, margin: "2px 8px 0",
    }}>{label}</div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function JobChip({ job }: { job: Job }) {
  const scoreColor = job.score !== null
    ? job.score >= 75 ? "#16a34a" : job.score >= 50 ? "#d97706" : "#dc2626"
    : "#64748b";
  return (
    <div style={{
      background: "#f0fdf4", border: "1px solid #bbf7d0",
      borderRadius: 8, padding: "7px 12px", marginBottom: 5,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{job.title}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}> @ {job.company}</span>
        {job.location && <span style={{ fontSize: 11, color: "#94a3b8" }}> · {job.location}</span>}
      </div>
      {job.score !== null && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: scoreColor,
          background: "white", padding: "2px 8px",
          borderRadius: 5, border: "1px solid #bbf7d0", marginLeft: 10,
        }}>
          {job.score}%
        </span>
      )}
    </div>
  );
}