"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pipelineStore, trackerStore, type Job } from "@/lib/store";
import JobCard from "@/components/JobCard";

export default function PipelinePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scoringAll, setScoringAll] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setJobs(pipelineStore.getAll());
  }, []);

  const handleUpdate = (id: string, updates: Partial<Job>) => {
    const updated = pipelineStore.update(id, updates);
    setJobs(updated);
  };

  const handleRemove = (id: string) => {
    const updated = pipelineStore.remove(id);
    setJobs(updated);
  };

  const handleApply = (job: Job) => {
    trackerStore.add(job);
    const updated = pipelineStore.remove(job.id);
    setJobs(updated);
    router.push("/tracker");
  };

  const handleScoreAll = async () => {
    const unscored = jobs.filter(j => j.score === null);
    if (!unscored.length) return;
    setScoringAll(true);
    for (const job of unscored) {
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jd: job.jd }),
        });
        const data = await res.json();
        handleUpdate(job.id, {
          score:        data.score        ?? 0,
          matchReasons: data.match_reasons ?? [],
          gaps:         data.gaps          ?? [],
          roleType:     data.role_type     ?? "Other",
          scoreSummary: data.summary       ?? null,
          status:       "scored",
        });
      } catch {
        handleUpdate(job.id, { score: 0, status: "scored" });
      }
    }
    setScoringAll(false);
  };

  // Sort by score descending, unscored at bottom
  const sorted = [...jobs].sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  const unscored = jobs.filter(j => j.score === null).length;
  const ready    = jobs.filter(j => j.status === "ready").length;

  // ── Empty state ──────────────────────────────────────────────
  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
          No jobs queued yet
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
          Go to Search, find a role, paste the JD and add it here.
        </p>
        <button className="btn-primary" onClick={() => router.push("/search")}>
          ← Go to Search
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
            Application Pipeline
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} queued
            {unscored > 0 && ` · ${unscored} unscored`}
            {ready > 0    && ` · ${ready} ready to apply`}
          </p>
        </div>
        {unscored > 0 && (
          <button
            className="btn-secondary"
            onClick={handleScoreAll}
            disabled={scoringAll}
          >
            {scoringAll ? "Scoring all…" : `Score all (${unscored})`}
          </button>
        )}
      </div>

      {/* Job cards */}
      {sorted.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onApply={handleApply}
        />
      ))}
    </div>
  );
}