"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";
import clsx from "clsx";

const STATIC_INSIGHTS = [
  "Node J3 density at 95% — recommend activating Green Sweep to pre-clear Sector 4 routes.",
  "BRG-1 structural load trending toward 85% threshold. Inspect within 48 hours.",
  "EXP-5 risk declining (↓45%). Route recovery proceeding as expected.",
  "City Pulse STABLE. All EMS corridors nominal. No intervention needed.",
  "Green Wave Sync can reduce Sector 2 wait times by up to 68% during peak hours.",
  "ART-4B load rising — consider diverting traffic via ART-2A before reaching critical.",
];

export function AIInsightsTicker() {
  const { junctions, greenSweepActive } = useStore();
  const [insightIdx, setInsightIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const criticalCount = junctions.filter((j) => j.status === "emergency").length;
  const warningCount = junctions.filter((j) => j.status === "warning").length;

  // Build a dynamic insight based on real state
  const dynamicInsight =
    criticalCount > 0
      ? `⚠ ${criticalCount} node${criticalCount > 1 ? "s" : ""} in CRITICAL state. Activate Green Sweep to auto-clear EMS routes.`
      : warningCount > 0
      ? `${warningCount} warning node${warningCount > 1 ? "s" : ""} detected. Monitor BRG-1 and ART-4B for escalation.`
      : greenSweepActive
      ? "Green Sweep active — EMS route clearance nominal. CO₂ savings accumulating."
      : STATIC_INSIGHTS[insightIdx % STATIC_INSIGHTS.length];

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setInsightIdx((p) => p + 1);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent-indigo)]/8 border border-[var(--color-accent-indigo)]/20 max-w-md overflow-hidden">
      <Sparkles size={13} className="text-[var(--color-accent-indigo)] shrink-0" />
      <div
        className={clsx(
          "text-[11px] font-medium text-[var(--color-text-muted)] truncate transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="font-bold text-[var(--color-accent-indigo)] mr-1">AI:</span>
        {dynamicInsight}
      </div>
    </div>
  );
}
