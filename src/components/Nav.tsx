"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { pipelineStore, trackerStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/search",   label: "Search",   icon: "🔍" },
  { href: "/pipeline", label: "Pipeline", icon: "⚡" },
  { href: "/tracker",  label: "Tracker",  icon: "📋" },
  { href: "/agent",    label: "Agent",    icon: "🤖" },
];

export default function Nav() {
  const pathname = usePathname();
  const [pipelineCount, setPipelineCount] = useState(0);
  const [trackerCount, setTrackerCount]   = useState(0);

  useEffect(() => {
    setPipelineCount(pipelineStore.getAll().length);
    setTrackerCount(trackerStore.getAll().length);
  }, [pathname]);

  return (
    <header style={{
      background: "white",
      borderBottom: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: 896, margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: 14,
            }}>T</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                Job Apply Pipeline
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1, marginTop: 3 }}>
                Search · Score · Generate · Track
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const count =
                item.href === "/pipeline" ? pipelineCount :
                item.href === "/tracker"  ? trackerCount  : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                    background: isActive ? "#eef2ff" : "transparent",
                    color: isActive ? "#4f46e5" : "#64748b",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {count !== null && count > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 999,
                      background: isActive ? "#c7d2fe" : "#f1f5f9",
                      color: isActive ? "#4f46e5" : "#64748b",
                    }}>{count}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
