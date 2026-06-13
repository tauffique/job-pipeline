// Shared utilities — no "use client" directive, safe to import from API routes

export function newJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
  
  export function newMsgId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }