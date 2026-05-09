"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Layout/Sidebar";
import { GoogleMapWrapper } from "@/components/Map/GoogleMapWrapper";
import { Slider } from "@/components/DigitalTwin/Slider";
import { JunctionCard } from "@/components/Telemetry/JunctionCard";
import { useState } from "react";
import clsx from "clsx";

export default function Dashboard() {
  const { activeTab, greenSweepActive, activeJunctionId, junctions } = useStore();
  const [sliderPercentage, setSliderPercentage] = useState(50);

  const activeJunction = junctions.find((j) => j.id === activeJunctionId);

  return (
    <div
      className={clsx(
        "flex h-screen w-full overflow-hidden transition-shadow duration-1000",
        greenSweepActive ? "shadow-[inset_0_0_100px_rgba(6,182,212,0.2)] border-2 border-[var(--color-cyan-glow)] box-border" : ""
      )}
    >
      <Sidebar />

      <main className="flex-1 relative bg-[var(--color-canvas)] overflow-hidden">
        {/* TOP HEADER STATUS */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md z-30 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-6 pointer-events-none">
           <div className="flex items-center gap-2">
             <span className={clsx("w-2 h-2 rounded-full", greenSweepActive ? "bg-cyan-400" : "bg-green-500")} />
             <span className="font-bold text-xs tracking-widest text-gray-800 uppercase">
               City Pulse: {greenSweepActive ? "GREEN SWEEP ACTIVE" : "STABLE"}
             </span>
           </div>
           <div className="font-mono text-xs text-gray-500 tracking-wider">
             UTC {new Date().toISOString().substr(11, 8)}
           </div>
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "pulse-map" && (
          <div className="absolute inset-0 pt-14">
            <GoogleMapWrapper sliderPercentage={sliderPercentage} />
            <Slider onDrag={setSliderPercentage} />
            {activeJunction && <JunctionCard junction={activeJunction} />}
          </div>
        )}

        {activeTab === "artery-health" && (
          <div className="absolute inset-0 pt-14 p-8 overflow-auto">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">Artery Health</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)]">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Infrastructure Integrity</div>
                 <div className="text-5xl font-black text-[var(--color-accent-indigo)]">98.4%</div>
                 <div className="mt-4 h-2 bg-gray-100 rounded overflow-hidden">
                   <div className="w-[98.4%] h-full bg-[var(--color-accent-indigo)]" />
                 </div>
              </div>
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)]">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Sensor Nodes</div>
                 <div className="text-5xl font-black text-gray-800">1,042</div>
                 <div className="mt-4 text-xs font-bold text-green-500">+12 online in last hour</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "green-corridor" && (
          <div className="absolute inset-0 pt-14 p-8 overflow-auto">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">Green Corridor Control</h2>
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-white shadow-[var(--shadow-weightless)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Emergency Preemption</h3>
                  <p className="text-sm text-gray-500">Auto-clear routes for flagged EMS vehicles</p>
                </div>
                <div className="w-12 h-6 bg-[var(--color-accent-indigo)] rounded-full flex items-center p-1 justify-end cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              
              <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-white shadow-[var(--shadow-weightless)]">
                <h3 className="font-bold mb-4">Active Incident Routes</h3>
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-200">
                  <span className="text-sm font-mono text-blue-600">AMB-774</span>
                  <span className="text-sm">En route to General Hospital</span>
                  <span className="text-xs font-bold text-green-500">CLEAR</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-mono text-red-600">FIRE-22</span>
                  <span className="text-sm">Responding to Sector 4</span>
                  <span className="text-xs font-bold text-orange-500">ROUTING</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "simulations" && (
          <div className="absolute inset-0 pt-14 p-8 overflow-auto">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">Simulations & "What-If" Models</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-white shadow-[var(--shadow-weightless)] flex flex-col gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Traffic Volume Modifier (+/- %)</label>
                  <input type="range" className="w-full accent-[var(--color-accent-indigo)]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Weather Impact Index</label>
                  <input type="range" className="w-full accent-[var(--color-accent-indigo)]" />
                </div>
                <button className="bg-[var(--color-accent-indigo)] text-white font-bold text-sm py-3 rounded shadow-[var(--shadow-indigo-glow)] mt-4">
                  Run Prediction Model
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system-logs" && (
          <div className="absolute inset-0 pt-14 bg-[#111827] text-green-400 font-mono text-xs p-6 overflow-auto">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">System Telemetry Logs</h2>
            <div className="flex flex-col gap-1">
              <span>[10:42:01] INFO : Node J1 Density shift detected (0.3 -&gt; 0.35)</span>
              <span>[10:42:05] INFO : Synchronizing Digital Twin state... OK</span>
              <span className="text-red-400">[10:42:12] WARN : Node J3 latency spike (120ms)</span>
              <span>[10:42:15] INFO : Awaiting EMS transponder signals...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
