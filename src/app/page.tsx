"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Layout/Sidebar";
import { GoogleMapWrapper } from "@/components/Map/GoogleMapWrapper";
import { Slider } from "@/components/DigitalTwin/Slider";
import { JunctionCard } from "@/components/Telemetry/JunctionCard";
import { useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";

export default function Dashboard() {
  const { activeTab, greenSweepActive, activeJunctionId, junctions, updateJunction, setActiveTab } = useStore();
  const [sliderPercentage, setSliderPercentage] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeJunction = junctions.find((j) => j.id === activeJunctionId);

  const [logSearch, setLogSearch] = useState("");
  
  // Dynamic Global Severity
  const isCritical = junctions.some(j => j.status === 'emergency');
  const isWarning = junctions.some(j => j.status === 'warning');
  const globalSeverity = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'STABLE';

  const severityColor = greenSweepActive 
    ? "bg-cyan-400" 
    : isCritical ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-green-500";

  const severityText = greenSweepActive 
    ? "GREEN SWEEP ACTIVE" 
    : globalSeverity;

  const MOCK_LOGS = [
    { time: "10:42:01", level: "INFO", message: "Node J1 Density shift detected (0.3 -> 0.35)", color: "text-green-400" },
    { time: "10:42:05", level: "INFO", message: "Synchronizing Digital Twin state... OK", color: "text-green-400" },
    { time: "10:42:12", level: "WARN", message: "Node J3 latency spike (120ms)", color: "text-orange-400" },
    { time: "10:42:15", level: "INFO", message: "Awaiting EMS transponder signals...", color: "text-green-400" },
    { time: "10:43:00", level: "CRIT", message: "Emergency preemption triggered on Sector 4", color: "text-red-400" },
  ];

  const filteredLogs = MOCK_LOGS.filter(log => 
    log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
    log.level.toLowerCase().includes(logSearch.toLowerCase())
  );

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
             <span className={clsx("w-2 h-2 rounded-full", severityColor, "animate-pulse")} />
             <span className="font-bold text-xs tracking-widest text-gray-800 uppercase">
               City Pulse: {severityText}
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
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] relative overflow-hidden">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Infrastructure Integrity</div>
                 <div className="text-5xl font-black text-[var(--color-accent-indigo)] relative z-10">98.4%</div>
                 <div className="mt-4 h-2 bg-gray-100 rounded overflow-hidden relative z-10">
                   <div className="w-[98.4%] h-full bg-[var(--color-accent-indigo)]" />
                 </div>
                 <div className="absolute bottom-0 right-0 left-0 h-16 flex items-end opacity-20 pointer-events-none">
                   {[80, 85, 90, 88, 92, 95, 98].map((v, i) => (
                     <div key={i} className="flex-1 bg-[var(--color-accent-indigo)] mx-[1px]" style={{ height: `${v}%` }} />
                   ))}
                 </div>
              </div>
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] relative overflow-hidden">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">Active Sensor Nodes</div>
                 <div className="text-5xl font-black text-gray-800 relative z-10">1,042</div>
                 <div className="mt-4 text-xs font-bold text-green-500 relative z-10">+12 online in last hour</div>
                 <div className="absolute bottom-0 right-0 left-0 h-16 flex items-end opacity-10 pointer-events-none">
                   {[40, 50, 45, 60, 75, 80, 100].map((v, i) => (
                     <div key={i} className="flex-1 bg-gray-800 mx-[1px]" style={{ height: `${v}%` }} />
                   ))}
                 </div>
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
                <button 
                  disabled={isSimulating}
                  onClick={() => {
                    setIsSimulating(true);
                    setTimeout(() => {
                      updateJunction('J1', { density: 0.9, status: 'warning', throughput: 2800 });
                      updateJunction('J2', { density: 0.95, status: 'emergency', throughput: 450 });
                      setIsSimulating(false);
                      setActiveTab('pulse-map');
                    }, 2000);
                  }}
                  className={clsx(
                    "text-white font-bold text-sm py-3 rounded mt-4 transition-all",
                    isSimulating 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-[var(--color-accent-indigo)] shadow-[var(--shadow-indigo-glow)] hover:bg-indigo-500"
                  )}
                >
                  {isSimulating ? "Running AI Analysis (Gemini 1.5 Flash)..." : "Run Prediction Model"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system-logs" && (
          <div className="absolute inset-0 pt-14 bg-[#111827] flex flex-col font-mono text-xs overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 shadow-md z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Search size={16} className="text-gray-500"/> System Telemetry Logs</h2>
              <input 
                type="text" 
                placeholder="Filter logs (e.g., WARN, J1)..." 
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 outline-none focus:border-[var(--color-accent-indigo)] w-64"
              />
            </div>
            <div className="flex-1 p-6 overflow-auto flex flex-col gap-1">
              {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                <span key={idx} className={log.color}>
                  [{log.time}] {log.level.padEnd(4, ' ')} : {log.message}
                </span>
              )) : (
                <span className="text-gray-500 italic">No telemetry data matches your filter.</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
