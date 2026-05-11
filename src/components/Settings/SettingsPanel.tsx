"use client";

import { useStore } from "@/store/useStore";
import { Sliders, Bell, Globe, Save, RefreshCw, CheckCircle } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export function SettingsPanel() {
  const { alertThresholds, updateThresholds, cityZone, setCityZone, availableZones, junctions, addLog } = useStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    updateThresholds({ loadSpike: 20, latency: 200, density: 0.9, riskNotify: 60 });
  };

  // Preview: which junctions would trigger at current threshold
  const triggeredNodes = junctions.filter(j => j.load >= alertThresholds.loadSpike + j.load - alertThresholds.loadSpike || j.load > 60);

  return (
    <div className="absolute inset-0 pt-14 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-main)]">System Configuration</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
            <RefreshCw size={13} /> Reset Defaults
          </button>
          <button onClick={handleSave} className={clsx("flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all", saved ? "bg-green-500 text-white" : "bg-[var(--color-accent-indigo)] text-white hover:bg-indigo-500")}>
            {saved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save Config</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">

        {/* Alert Thresholds */}
        <div className="p-6 rounded-lg bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-weightless)]">
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="text-[var(--color-accent-indigo)]" size={20} />
            <h3 className="font-bold text-[var(--color-text-main)]">Anomaly Detection Thresholds</h3>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>Load Spike Tolerance</span>
                <span className="text-[var(--color-accent-indigo)]">{alertThresholds.loadSpike}%</span>
              </div>
              <input type="range" min="5" max="50" step="1" value={alertThresholds.loadSpike}
                onChange={e => updateThresholds({ loadSpike: parseInt(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 rounded-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]"><span>Sensitive (5%)</span><span>Tolerant (50%)</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>Latency Threshold</span>
                <span className="text-[var(--color-accent-indigo)]">{alertThresholds.latency}ms</span>
              </div>
              <input type="range" min="50" max="1000" step="10" value={alertThresholds.latency}
                onChange={e => updateThresholds({ latency: parseInt(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 rounded-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]"><span>50ms</span><span>1000ms</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>Density Critical Limit</span>
                <span className="text-[var(--color-accent-indigo)]">{(alertThresholds.density * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.5" max="1.0" step="0.05" value={alertThresholds.density}
                onChange={e => updateThresholds({ density: parseFloat(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 rounded-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]"><span>50%</span><span>100%</span></div>
            </div>

            {/* Risk Notify */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Risk Notification Level</div>
              <div className="grid grid-cols-4 gap-2">
                {[50, 60, 70, 80].map(level => (
                  <button key={level} onClick={() => updateThresholds({ riskNotify: level })}
                    className={clsx("py-2 rounded text-xs font-bold border transition-all",
                      alertThresholds.riskNotify === level
                        ? "bg-[var(--color-accent-indigo)] text-white border-[var(--color-accent-indigo)]"
                        : "border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-text-main)]"
                    )}>
                    {level}%
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">Notify when predicted risk exceeds this level.</p>
            </div>
          </div>
        </div>

        {/* Zone Settings */}
        <div className="p-6 rounded-lg bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-weightless)]">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="text-[var(--color-accent-indigo)]" size={20} />
            <h3 className="font-bold text-[var(--color-text-main)]">City Zone Management</h3>
          </div>

          <div className="flex flex-col gap-3">
            {availableZones.map(zone => {
              const pulseColor = zone.pulse === 'CRITICAL' ? 'text-red-500 bg-red-500/10 border-red-500/30' : zone.pulse === 'WARNING' ? 'text-orange-500 bg-orange-500/10 border-orange-500/30' : 'text-green-500 bg-green-500/10 border-green-500/30';
              const dotColor = zone.pulse === 'CRITICAL' ? 'bg-red-500' : zone.pulse === 'WARNING' ? 'bg-orange-500' : 'bg-green-500';
              return (
                <button key={zone.id} onClick={() => {
                  setCityZone(zone.id);
                  addLog({ id: `${Date.now()}`, timestamp: new Date().toISOString().substring(11,19) + ' UTC', severity: 'INFO', message: `Zone switched to ${zone.name} — loading telemetry...` });
                }}
                  className={clsx("flex items-center justify-between p-4 border rounded-lg transition-all text-left",
                    cityZone === zone.id
                      ? "border-[var(--color-accent-indigo)] bg-[var(--color-accent-indigo)]/5"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-text-main)]"
                  )}>
                  <div className="flex items-center gap-3">
                    <span className={clsx("w-2 h-2 rounded-full shrink-0", dotColor)} />
                    <div>
                      <div className={clsx("text-sm font-bold", cityZone === zone.id ? "text-[var(--color-accent-indigo)]" : "text-[var(--color-text-main)]")}>{zone.name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{zone.junctions.length} sensor nodes · {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</div>
                    </div>
                  </div>
                  <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", pulseColor)}>{zone.pulse}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Threshold Preview */}
        <div className="p-6 rounded-lg bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-weightless)]">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-[var(--color-accent-indigo)]" size={20} />
            <h3 className="font-bold text-[var(--color-text-main)]">Threshold Preview</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Nodes that would trigger alerts at current thresholds:</p>
          <div className="flex flex-col gap-2">
            {junctions.map(j => {
              const latencyMs = parseInt(j.latency.replace('ms', ''));
              const wouldTrigger = j.load >= 60 || latencyMs > alertThresholds.latency || j.density >= alertThresholds.density;
              return (
                <div key={j.id} className={clsx("flex items-center justify-between p-3 rounded text-xs border", wouldTrigger ? "border-orange-500/30 bg-orange-500/5" : "border-[var(--color-border-subtle)]")}>
                  <span className="font-bold text-[var(--color-text-main)]">{j.id} — {j.name}</span>
                  <span className={clsx("font-bold", wouldTrigger ? "text-orange-500" : "text-green-500")}>
                    {wouldTrigger ? "⚠ Would Alert" : "✓ Clear"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-Sync Banner */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-4 self-start">
          <div className="p-2 bg-blue-500 rounded text-white"><Save size={18} /></div>
          <div>
            <div className="text-sm font-bold text-[var(--color-text-main)]">Auto-Sync Enabled</div>
            <p className="text-xs text-[var(--color-text-muted)]">Thresholds sync to all edge nodes on save. Zone changes apply instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
