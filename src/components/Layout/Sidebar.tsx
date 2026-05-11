"use client";

import { useStore } from "@/store/useStore";
import { Activity, Map as MapIcon, ShieldAlert, GitBranch, Terminal, Moon, Sun, Zap, Settings, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function Sidebar() {
  const { greenSweepActive, setGreenSweepActive, activeTab, setActiveTab, junctions, logs, cityZone, setCityZone, availableZones, addLog } = useStore();
  const [zoneOpen, setZoneOpen] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);

  const criticalCount = junctions.filter(j => j.status === 'emergency').length;
  const anomalyCount = logs.length;
  const currentZone = availableZones.find(z => z.id === cityZone);

  const pulseColor: Record<string, string> = {
    STABLE: 'bg-green-500',
    WARNING: 'bg-orange-500',
    CRITICAL: 'bg-red-500',
  };

  const NAV_ITEMS = [
    { id: "pulse-map", label: "Pulse Map", icon: MapIcon },
    { id: "artery-health", label: "Artery Health", icon: Activity, badge: criticalCount > 0 ? criticalCount : null, badgeColor: "bg-red-500" },
    { id: "green-corridor", label: "Green Corridor", icon: ShieldAlert },
    { id: "simulations", label: "Simulations", icon: GitBranch },
    { id: "system-logs", label: "System Logs", icon: Terminal, badge: anomalyCount > 0 ? Math.min(anomalyCount, 99) : null, badgeColor: "bg-orange-500" },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close zone dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (zoneRef.current && !zoneRef.current.contains(e.target as Node)) setZoneOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleZoneSwitch = (zoneId: string) => {
    const zone = availableZones.find(z => z.id === zoneId);
    if (!zone || zoneId === cityZone) { setZoneOpen(false); return; }
    setCityZone(zoneId);
    addLog({
      id: `${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19) + " UTC",
      severity: "INFO",
      message: `Zone switched to ${zone.name} — loading telemetry...`,
    });
    setZoneOpen(false);
    setActiveTab('pulse-map');
  };

  return (
    <aside className="w-64 bg-[var(--color-surface-a)] border-r border-[var(--color-border-subtle)] flex flex-col justify-between z-50 h-full">
      <div className="flex flex-col p-6 gap-2">
        {/* Logo + Theme Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--color-accent-indigo)] flex items-center justify-center text-white font-black text-sm">V</div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-[var(--color-text-main)] leading-none -mb-1">VAYU</span>
              <span className="font-black text-xl tracking-tighter text-[var(--color-accent-indigo)] leading-none">GATI</span>
            </div>
          </div>
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-indigo)] transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>

        {/* Zone Selector */}
        <div ref={zoneRef} className="relative mb-4">
          <button
            onClick={() => setZoneOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-canvas)] hover:border-[var(--color-accent-indigo)] transition-all text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={clsx("w-2 h-2 rounded-full shrink-0", pulseColor[currentZone?.pulse ?? 'STABLE'])} />
              <span className="text-xs font-bold text-[var(--color-text-main)] truncate">{currentZone?.name}</span>
            </div>
            <ChevronDown size={14} className={clsx("text-[var(--color-text-muted)] transition-transform shrink-0", zoneOpen && "rotate-180")} />
          </button>

          {zoneOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl z-50 overflow-hidden">
              {availableZones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSwitch(zone.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-canvas)] transition-colors",
                    zone.id === cityZone && "bg-[var(--color-accent-indigo)]/5"
                  )}
                >
                  <span className={clsx("w-2 h-2 rounded-full shrink-0", pulseColor[zone.pulse])} />
                  <div className="flex-1 min-w-0">
                    <div className={clsx("text-xs font-bold truncate", zone.id === cityZone ? "text-[var(--color-accent-indigo)]" : "text-[var(--color-text-main)]")}>{zone.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{zone.pulse} · {zone.junctions.length} nodes</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5">
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
                    : "text-[#6B7280] hover:bg-[var(--color-canvas)] hover:text-[var(--color-accent-indigo)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.badge != null && (
                  <span className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Legend */}
      <div className="p-6 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-a)]">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Pulse Legend</div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]"><span className="w-2 h-2 rounded-full bg-[var(--color-accent-indigo)] shadow-[var(--shadow-indigo-glow)]" /> Optimal Flow</div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]"><span className="w-2 h-2 rounded-full bg-orange-500" /> Warning / Congestion</div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)]"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical / Emergency</div>
      </div>

      {/* Green Sweep Button */}
      <div className="p-6 pt-2">
        <button
          onClick={() => setGreenSweepActive(!greenSweepActive)}
          className={clsx(
            "relative w-full p-4 border rounded overflow-hidden transition-all duration-300 font-semibold text-sm",
            greenSweepActive
              ? "border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              : "border-[rgba(34,197,94,0.3)] text-green-600 dark:text-green-400 hover:border-green-500"
          )}
        >
          <span className="relative z-10 tracking-widest uppercase text-xs flex items-center justify-center gap-2">
            <Zap size={14} className={greenSweepActive ? "text-white" : "text-green-500"} />
            Green Sweep
          </span>
          <div className={clsx("absolute inset-0 z-0 transition-transform duration-500 bg-green-500", greenSweepActive ? "translate-y-0" : "translate-y-full")} />
        </button>
      </div>
    </aside>
  );
}
