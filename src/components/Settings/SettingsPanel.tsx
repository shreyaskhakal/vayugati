"use client";

import { useStore } from "@/store/useStore";
import { Sliders, Bell, Globe, Save } from "lucide-react";

export function SettingsPanel() {
  const { alertThresholds, updateThresholds, cityZone, setCityZone } = useStore();

  return (
    <div className="absolute inset-0 pt-14 p-8 overflow-auto">
      <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-[var(--color-text-main)]">System Configuration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        
        {/* Threshold Settings */}
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
              <input 
                type="range" min="5" max="50" step="1"
                value={alertThresholds.loadSpike}
                onChange={(e) => updateThresholds({ loadSpike: parseInt(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 bg-[var(--color-canvas)] rounded-full appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-[var(--color-text-muted)]">Sensitivity for sudden traffic surges.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>Latency Threshold</span>
                <span className="text-[var(--color-accent-indigo)]">{alertThresholds.latency}ms</span>
              </div>
              <input 
                type="range" min="50" max="1000" step="10"
                value={alertThresholds.latency}
                onChange={(e) => updateThresholds({ latency: parseInt(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 bg-[var(--color-canvas)] rounded-full appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-[var(--color-text-muted)]">Maximum acceptable node communication delay.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>Density Critical Limit</span>
                <span className="text-[var(--color-accent-indigo)]">{(alertThresholds.density * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="1.0" step="0.05"
                value={alertThresholds.density}
                onChange={(e) => updateThresholds({ density: parseFloat(e.target.value) })}
                className="w-full accent-[var(--color-accent-indigo)] h-1.5 bg-[var(--color-canvas)] rounded-full appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-[var(--color-text-muted)]">Threshold for "Emergency" status triggered by traffic density.</p>
            </div>
          </div>
        </div>

        {/* City Zone Settings */}
        <div className="p-6 rounded-lg bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-weightless)]">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="text-[var(--color-accent-indigo)]" size={20} />
            <h3 className="font-bold text-[var(--color-text-main)]">City Zone & Geofencing</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              Switching zones will relocate all sensor nodes to the selected district's coordinates.
            </p>
            
            {['Manhattan', 'Sector 4', 'Industrial'].map(zone => (
              <button
                key={zone}
                onClick={() => setCityZone(zone)}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  cityZone === zone 
                    ? 'border-[var(--color-accent-indigo)] bg-[var(--color-accent-indigo)]/5 text-[var(--color-accent-indigo)]' 
                    : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-text-main)]'
                }`}
              >
                <span className="font-bold">{zone} District</span>
                {cityZone === zone && <div className="w-2 h-2 rounded-full bg-[var(--color-accent-indigo)] animate-pulse" />}
              </button>
            ))}
          </div>
        </div>

        {/* Persistence Banner */}
        <div className="md:col-span-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
          <div className="p-2 bg-blue-500 rounded text-white"><Save size={18} /></div>
          <div>
            <div className="text-sm font-bold text-[var(--color-text-main)]">Auto-Sync Enabled</div>
            <p className="text-xs text-[var(--color-text-muted)]">Configuration changes are persisted to the cloud and synced across all edge nodes instantly.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
