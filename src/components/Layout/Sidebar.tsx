"use client";

import { useStore } from "@/store/useStore";
import { Activity, Map as MapIcon, ShieldAlert, GitBranch, Terminal, Moon, Sun, Zap, Settings } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function Sidebar() {
  const { greenSweepActive, setGreenSweepActive, activeTab, setActiveTab, junctions, logs } = useStore();
  
  const criticalCount = junctions.filter(j => j.status === 'emergency').length;
  const anomalyCount = logs.length;

  const NAV_ITEMS = [
    { id: "pulse-map", label: "Pulse Map", icon: MapIcon },
    { id: "artery-health", label: "Artery Health", icon: Activity, badge: criticalCount > 0 ? criticalCount : null, badgeColor: "bg-red-500" },
    { id: "green-corridor", label: "Green Corridor", icon: ShieldAlert },
    { id: "simulations", label: "Simulations", icon: GitBranch },
    { id: "system-logs", label: "System Logs", icon: Terminal, badge: anomalyCount > 0 ? anomalyCount : null, badgeColor: "bg-orange-500" },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="w-64 bg-[var(--color-surface-a)] border-r border-[var(--color-border-subtle)] flex flex-col justify-between z-50 h-full">
      <div className="flex flex-col p-6 gap-2">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--color-accent-indigo)] flex items-center justify-center text-white font-black text-sm">V</div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-[var(--color-text-main)] leading-none -mb-1">VAYU</span>
              <span className="font-black text-xl tracking-tighter text-[var(--color-accent-indigo)] leading-none">GATI</span>
            </div>
          </div>
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-indigo)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  "flex items-center justify-between px-4 py-3 rounded text-sm font-medium transition-all text-left",
                  isActive
                    ? "bg-[var(--color-canvas)] text-[var(--color-accent-indigo)] shadow-[var(--shadow-weightless)]"
                    : "text-[#6B7280] hover:bg-[var(--color-canvas)] hover:text-[var(--color-accent-indigo)] hover:shadow-[var(--shadow-weightless)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] mt-auto bg-[var(--color-surface-a)]">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Pulse Legend</div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-indigo)] shadow-[var(--shadow-indigo-glow)]" /> Optimal Flow
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" /> Warning / Congestion
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse" /> Critical / Emergency
        </div>
      </div>

      <div className="p-6 pt-2">
        <button
          onClick={() => setGreenSweepActive(!greenSweepActive)}
          className={clsx(
            "relative w-full p-4 border rounded overflow-hidden transition-all duration-300 font-semibold text-sm",
            greenSweepActive
              ? "border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              : "border-[rgba(34,197,94,0.3)] text-green-600 dark:text-green-400 bg-[rgba(255,255,255,0.1)] hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          )}
        >
          <span className="relative z-10 tracking-widest uppercase text-xs flex items-center justify-center gap-2">
            <Zap size={14} className={greenSweepActive ? "text-white" : "text-green-500"} />
            Green Sweep
          </span>
          <div
            className={clsx(
              "absolute inset-0 z-0 transition-transform duration-500",
              greenSweepActive ? "bg-green-500 translate-y-0" : "bg-green-500 translate-y-full"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
