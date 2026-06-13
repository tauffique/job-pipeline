"use client";

import { useEffect, useState } from "react";
import { trackerStore, type TrackedJob, type TrackerStatus } from "@/lib/store";

const STATUSES: TrackerStatus[] = [
  "Applied", "Interview", "Take-home", "Offer", "Rejected", "Ghosted"
];

const STATUS_STYLES: Record<TrackerStatus, { bg: string; color: string; border: string }> = {
  Applied:     { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  Interview:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  "Take-home": { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  Offer:       { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Rejected:    { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Ghosted:     { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
};

export default function TrackerPage() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setJobs(trackerStore.getAll());
  }, []);

  const handleStatusChange = (id: string, status: TrackerStatus) => {
    const updated = trackerStore.updateStatus(id, status);
    setJobs(updated);
  };

  const handleRemove = (id: string) => {
    const updated = trackerStore.remove(id);
    setJobs(updated);
  };

  const handleNoteSave = (id: string) => {
    const updated = trackerStore.updateNotes(id, noteText);
    setJobs(updated);
    setEditingNote(null);
    setNoteText("");
  };

  // Stats
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.trackerStatus === s).length;
    return acc;
  }, {} as Record<TrackerStatus, number>);

  // ── Empty state ──────────────────────────────────────────────
  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
          No applications tracked yet
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Hit "Mark Applied →" on any pipeline job to track it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>
          Application Tracker
        </h1>

        {/* Status summary pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STATUSES.filter(s => counts[s] > 0).map(s => {
            const style = STATUS_STYLES[s];
            return (
              <div key={s} style={{
                padding: "5px 14px",
                borderRadius: 20,
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12,
              }}>
                <span style={{ fontWeight: 700, color: style.color }}>{counts[s]}</span>
                <span style={{ color: style.color }}>{s}</span>
              </div>
            );
          })}
          <div style={{
            padding: "5px 14px",
            borderRadius: 20,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#64748b",
          }}>
            {jobs.length} total
          </div>
        </div>
      </div>

      {/* Job rows */}
      {jobs.map(job => {
        const sStyle = STATUS_STYLES[job.trackerStatus];
        const isEditingThis = editingNote === job.id;

        return (
          <div key={job.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ padding: "14px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>

                {/* Left */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{job.title}</span>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>@ {job.company}</span>
                    {job.location && (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>· {job.location}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Applied {job.appliedAt}
                    </span>
                    <span style={{ fontSize: 11, color: "#cbd5e1" }}>·</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{job.platform}</span>
                    {job.score !== null && (
                      <>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>·</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: job.score >= 75 ? "#16a34a" : job.score >= 50 ? "#d97706" : "#dc2626",
                        }}>
                          {job.score}% match
                        </span>
                      </>
                    )}
                  </div>

                  {/* Note */}
                  {isEditingThis ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                      <input
                        className="input"
                        style={{ maxWidth: 360 }}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add a note (e.g. interview on Monday)"
                        onKeyDown={e => e.key === "Enter" && handleNoteSave(job.id)}
                        autoFocus
                      />
                      <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => handleNoteSave(job.id)}>
                        Save
                      </button>
                      <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setEditingNote(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setEditingNote(job.id); setNoteText(job.notes || ""); }}
                      style={{
                        fontSize: 12,
                        color: job.notes ? "#475569" : "#94a3b8",
                        cursor: "pointer",
                        marginTop: 4,
                        fontStyle: job.notes ? "normal" : "italic",
                      }}
                    >
                      {job.notes || "+ Add note"}
                    </div>
                  )}
                </div>

                {/* Right: status + remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <select
                    value={job.trackerStatus}
                    onChange={e => handleStatusChange(job.id, e.target.value as TrackerStatus)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${sStyle.border}`,
                      background: sStyle.bg,
                      color: sStyle.color,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <button
                    className="btn-danger"
                    style={{ fontSize: 11, padding: "6px 12px" }}
                    onClick={() => handleRemove(job.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}