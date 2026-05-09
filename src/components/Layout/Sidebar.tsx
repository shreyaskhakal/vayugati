"use client";

import { useStore } from "@/store/useStore";
import { Activity, Map as MapIcon, ShieldAlert, GitBranch, Terminal, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const NAV_ITEMS = [
  { id: "pulse-map", label: "Pulse Map", icon: MapIcon },
  { id: "artery-health", label: "Artery Health", icon: Activity },
  { id: "green-corridor", label: "Green Corridor", icon: ShieldAlert },
  { id: "simulations", label: "Simulations", icon: GitBranch },
  { id: "system-logs", label: "System Logs", icon: Terminal },
];

export function Sidebar() {
  const { greenSweepActive, setGreenSweepActive, activeTab, setActiveTab } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="w-64 bg-[var(--color-surface-a)] border-r border-[var(--color-border-subtle)] flex flex-col justify-between z-50 h-full">
      <div className="flex flex-col p-6 gap-2">
        <div className="mb-8 flex items-center justify-between">
          <div className="font-extrabold tracking-tighter text-2xl text-[var(--color-text-main)]">[V-G]</div>
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
                  "flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all text-left",
                  isActive
                    ? "bg-[var(--color-canvas)] text-[var(--color-accent-indigo)] shadow-[var(--shadow-weightless)]"
                    : "text-[#6B7280] hover:bg-[var(--color-canvas)] hover:text-[var(--color-accent-indigo)] hover:shadow-[var(--shadow-weightless)]"
                )}
              >
                <Icon size={18} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        <button
          onClick={() => setGreenSweepActive(!greenSweepActive)}
          className={clsx(
            "relative w-full p-4 border rounded overflow-hidden transition-all duration-300 font-semibold text-sm",
            greenSweepActive
              ? "border-[var(--color-cyan-glow)] text-white shadow-[var(--shadow-cyan-glow)]"
              : "border-[rgba(79,70,229,0.2)] text-[var(--color-accent-indigo)] bg-[rgba(255,255,255,0.1)] hover:border-[var(--color-accent-indigo)] hover:shadow-[var(--shadow-indigo-glow)]"
          )}
        >
          <span className="relative z-10 tracking-widest uppercase text-xs">Green Sweep</span>
          <div
            className={clsx(
              "absolute inset-0 z-0 transition-transform duration-500",
              greenSweepActive ? "bg-[var(--color-cyan-glow)] translate-y-0" : "bg-[var(--color-accent-indigo)] translate-y-full"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
