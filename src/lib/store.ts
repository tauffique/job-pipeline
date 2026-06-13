"use client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type JobStatus = "queued" | "scored" | "ready" | "applied";
export type TrackerStatus = "Applied" | "Interview" | "Take-home" | "Offer" | "Rejected" | "Ghosted";
export type RoleType = "Werkstudent" | "Internship" | "Thesis" | "Full-time" | "Other";
export type Platform = "LinkedIn" | "StepStone" | "Indeed DE" | "Xing" | "Other";
export type Language = "en" | "de";

export interface Job {
  id: string;
  title: string;
  company: string;
  platform: Platform;
  location: string;
  jd: string;
  url?: string;
  addedAt: string;
  // Scoring
  status: JobStatus;
  score: number | null;
  matchReasons: string[];
  gaps: string[];
  roleType: RoleType | null;
  scoreSummary: string | null;
  // Generated docs
  cvBullets: string | null;
  coverLetter: string | null;
  cvLatexEN: string | null;
  cvLatexDE: string | null;
  clLatexEN: string | null;
  clLatexDE: string | null;
  // ATS analysis (post-generation)
  atsScore:           number | null;
  atsMatchedKeywords: string[];
  atsMissingKeywords: string[];
  atsVerdict:         string | null;
}

export interface TrackedJob extends Job {
  appliedAt: string;
  trackerStatus: TrackerStatus;
  notes: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  jobsAdded?: Job[];
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  pipeline: "jp_pipeline",
  tracker: "jp_tracker",
  agentHistory: "jp_agent_history",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error("localStorage write failed:", key);
  }
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export const pipelineStore = {
  getAll(): Job[] {
    return read<Job[]>(KEYS.pipeline, []);
  },
  save(jobs: Job[]): void {
    write(KEYS.pipeline, jobs);
  },
  add(job: Job): Job[] {
    const jobs = [job, ...this.getAll().filter(j => j.id !== job.id)];
    this.save(jobs);
    return jobs;
  },
  update(id: string, updates: Partial<Job>): Job[] {
    const jobs = this.getAll().map(j => j.id === id ? { ...j, ...updates } : j);
    this.save(jobs);
    return jobs;
  },
  remove(id: string): Job[] {
    const jobs = this.getAll().filter(j => j.id !== id);
    this.save(jobs);
    return jobs;
  },
  clear(): void {
    write(KEYS.pipeline, []);
  },
};

// ─── Tracker ──────────────────────────────────────────────────────────────────
export const trackerStore = {
  getAll(): TrackedJob[] {
    return read<TrackedJob[]>(KEYS.tracker, []);
  },
  save(jobs: TrackedJob[]): void {
    write(KEYS.tracker, jobs);
  },
  add(job: Job): TrackedJob[] {
    const tracked: TrackedJob = {
      ...job,
      appliedAt: new Date().toLocaleDateString("de-DE"),
      trackerStatus: "Applied",
      notes: "",
    };
    const jobs = [tracked, ...this.getAll().filter(j => j.id !== job.id)];
    this.save(jobs);
    return jobs;
  },
  updateStatus(id: string, trackerStatus: TrackerStatus): TrackedJob[] {
    const jobs = this.getAll().map(j => j.id === id ? { ...j, trackerStatus } : j);
    this.save(jobs);
    return jobs;
  },
  updateNotes(id: string, notes: string): TrackedJob[] {
    const jobs = this.getAll().map(j => j.id === id ? { ...j, notes } : j);
    this.save(jobs);
    return jobs;
  },
  remove(id: string): TrackedJob[] {
    const jobs = this.getAll().filter(j => j.id !== id);
    this.save(jobs);
    return jobs;
  },
};

// ─── Agent History ────────────────────────────────────────────────────────────
export const agentStore = {
  getHistory(): AgentMessage[] {
    return read<AgentMessage[]>(KEYS.agentHistory, []);
  },
  addMessage(msg: AgentMessage): AgentMessage[] {
    const history = [...this.getHistory(), msg];
    write(KEYS.agentHistory, history);
    return history;
  },
  clear(): void {
    write(KEYS.agentHistory, []);
  },
};

// ─── Utils (re-exported from shared utils for backwards compatibility) ────────
export { newJobId, newMsgId } from "./utils";