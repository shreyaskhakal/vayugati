"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Layout/Sidebar";
import { GoogleMapWrapper } from "@/components/Map/GoogleMapWrapper";
import { Slider } from "@/components/DigitalTwin/Slider";
import { JunctionCard } from "@/components/Telemetry/JunctionCard";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { Search, ShieldAlert } from "lucide-react";
import { LineChart, Line, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { activeTab, greenSweepActive, activeJunctionId, junctions, updateJunction, setActiveTab } = useStore();
  const [sliderPercentage, setSliderPercentage] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeJunction = junctions.find((j) => j.id === activeJunctionId);

  const [logSearch, setLogSearch] = useState("");
  const [logFilterSeverity, setLogFilterSeverity] = useState<string | null>(null);
  
  const [time, setTime] = useState("00:00:00");
  const [sortConfig, setSortConfig] = useState<{ key: 'risk' | 'location', direction: 'asc' | 'desc' }>({ key: 'risk', direction: 'desc' });

  useEffect(() => {
    const updateTime = () => setTime(new Date().toISOString().substr(11, 8));
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, []);

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

  const stableCount = junctions.filter(j => j.status !== 'emergency' && j.status !== 'warning').length;
  const warningCount = junctions.filter(j => j.status === 'warning').length;
  const criticalCount = junctions.filter(j => j.status === 'emergency').length;

  const PIE_DATA = [
    { name: 'Optimal', value: stableCount, color: '#4F46E5' },
    { name: 'Warning', value: warningCount, color: '#f97316' },
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const INTEGRITY_DATA = [
    { time: '00:00', value: 99 }, { time: '04:00', value: 98.5 },
    { time: '08:00', value: 95 }, { time: '12:00', value: 92 },
    { time: '16:00', value: 88 }, { time: '20:00', value: 91 },
    { time: '24:00', value: 98.4 },
  ];

  const ARTERY_DATA = [
    { id: 'ART-4B', location: 'Sector 4', trend: 'down', risk: 72 },
    { id: 'TUN-9', location: 'Midtown Tunnel', trend: 'stable', risk: 12 },
    { id: 'BRG-1', location: 'North Bridge', trend: 'up', risk: 85 },
    { id: 'ART-2A', location: 'Sector 2', trend: 'stable', risk: 4 },
    { id: 'EXP-5', location: 'West Expressway', trend: 'down', risk: 45 },
  ];

  const sortedArteries = [...ARTERY_DATA].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: 'risk' | 'location') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const MOCK_LOGS = [
    { time: "10:42:01", level: "INFO", message: "Node J1 Density shift detected (0.3 -> 0.35)", color: "text-green-400" },
    { time: "10:42:05", level: "INFO", message: "Synchronizing Digital Twin state... OK", color: "text-green-400" },
    { time: "10:42:12", level: "WARN", message: "Node J3 latency spike (120ms)", color: "text-orange-400" },
    { time: "10:42:15", level: "INFO", message: "Awaiting EMS transponder signals...", color: "text-green-400" },
    { time: "10:43:00", level: "CRIT", message: "Emergency preemption triggered on Sector 4", color: "text-red-400" },
  ];

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || log.level.toLowerCase().includes(logSearch.toLowerCase());
    const matchesSeverity = logFilterSeverity ? log.level === logFilterSeverity : true;
    return matchesSearch && matchesSeverity;
  });

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
           <div className="font-mono text-xs text-gray-500 tracking-wider flex flex-col items-end">
             <span>LAST SYNCED</span>
             <span className="text-[var(--color-text-main)] font-bold">UTC {time}</span>
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
            <h2 className="text-2xl font-extrabold tracking-tight mb-6 flex items-center justify-between">
              Artery Health
            </h2>
            
            {isCritical && (
              <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/50 text-red-500 font-bold flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <ShieldAlert size={20} />
                City Pulse CRITICAL due to Emergency Preemption Protocol
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] relative overflow-hidden bg-[var(--color-surface-a)] flex flex-col">
                 <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 relative z-10">24H Infrastructure Integrity</div>
                 <div className="text-5xl font-black text-[var(--color-accent-indigo)] relative z-10 mb-4">98.4%</div>
                 <div className="flex-1 -ml-4 -mb-4 mt-2">
                   <ResponsiveContainer width="100%" height={120}>
                     <LineChart data={INTEGRITY_DATA}>
                       <Line type="monotone" dataKey="value" stroke="var(--color-accent-indigo)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                       <RechartsTooltip 
                         contentStyle={{ backgroundColor: 'var(--color-surface-a)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                         itemStyle={{ color: 'var(--color-text-main)' }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
              </div>
              <div className="p-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] relative overflow-hidden bg-[var(--color-surface-a)]">
                 <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 relative z-10">Active Sensor Nodes</div>
                 <div className="text-5xl font-black text-[var(--color-text-main)] relative z-10">{junctions.length}</div>
                 <div className="h-32 mt-4 flex items-center">
                   <ResponsiveContainer width="50%" height="100%">
                     <PieChart>
                       <Pie data={PIE_DATA} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                         {PIE_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                     </PieChart>
                   </ResponsiveContainer>
                   <div className="flex flex-col gap-2 w-1/2 justify-center pl-4">
                     {PIE_DATA.map(d => (
                       <div key={d.name} className="flex items-center justify-between text-xs font-bold">
                         <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /> <span className="text-[var(--color-text-main)]">{d.name}</span></div>
                         <span style={{ color: d.color }}>{d.value}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="mt-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] bg-[var(--color-surface-a)] overflow-hidden">
               <div className="p-4 border-b border-[var(--color-border-subtle)]">
                 <h3 className="font-bold">AI Predictive Health Analysis</h3>
               </div>
               <table className="w-full text-left text-sm">
                 <thead className="bg-[var(--color-canvas)] text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                   <tr>
                     <th className="p-4 font-bold tracking-widest uppercase text-[10px] cursor-pointer hover:text-[var(--color-text-main)] transition-colors" onClick={() => handleSort('location')}>
                       Artery / Location {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                     </th>
                     <th className="p-4 font-bold tracking-widest uppercase text-[10px]">Trend</th>
                     <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-right cursor-pointer hover:text-[var(--color-text-main)] transition-colors" onClick={() => handleSort('risk')}>
                       Predicted Risk % {sortConfig.key === 'risk' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                     </th>
                   </tr>
                 </thead>
                 <tbody>
                   {sortedArteries.map((a, i) => (
                     <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-canvas)] transition-colors">
                       <td className="p-4">
                         <div className="font-bold text-[var(--color-text-main)]">{a.id}</div>
                         <div className="text-xs text-[var(--color-text-muted)]">{a.location}</div>
                       </td>
                       <td className="p-4">
                         {a.trend === 'up' && <span className="text-red-500 font-bold">↑</span>}
                         {a.trend === 'down' && <span className="text-green-500 font-bold">↓</span>}
                         {a.trend === 'stable' && <span className="text-[var(--color-text-muted)] font-bold">-</span>}
                       </td>
                       <td className="p-4 text-right">
                         <span className={clsx("font-black", a.risk > 50 ? "text-red-500" : a.risk > 20 ? "text-orange-500" : "text-green-500")}>
                           {a.risk}%
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
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
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
                   <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Today's Green Score</div>
                   <div className="text-5xl font-black text-green-500">87<span className="text-2xl text-[var(--color-text-muted)]">/100</span></div>
                   <div className="mt-4 text-xs font-bold text-[var(--color-text-muted)]">Top 10% among city zones</div>
                </div>
                <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
                   <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Est. CO₂ Tons Saved</div>
                   <div className="text-5xl font-black text-[var(--color-text-main)]">12.4</div>
                   <div className="mt-4 text-xs font-bold text-green-500">↓ 4% vs yesterday</div>
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
              
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-lg">Preset Simulation Scenarios</h3>
                <button className="p-4 border border-[var(--color-border-subtle)] rounded text-left hover:bg-[var(--color-surface-a)] transition-colors" onClick={() => {
                  updateJunction('J1', { density: 0.9, status: 'warning', throughput: 2800 });
                  updateJunction('J2', { density: 0.95, status: 'emergency', throughput: 450 });
                  updateJunction('J3', { density: 0.85, status: 'warning', throughput: 1100 });
                  setActiveTab('pulse-map');
                }}>
                  <div className="font-bold">Rush Hour Gridlock</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Simulates 5PM Friday traffic density load across all central arteries.</div>
                </button>
                <button className="p-4 border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10 rounded text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={() => {
                  updateJunction('J3', { density: 1.0, status: 'emergency', throughput: 0 });
                  updateJunction('J4', { density: 0.9, status: 'warning', throughput: 500 });
                  setActiveTab('pulse-map');
                }}>
                  <div className="font-bold text-blue-700 dark:text-blue-400">Flood Event</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Simulates severe waterlogging at Junction 3, routing traffic to J4.</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system-logs" && (
          <div className="absolute inset-0 pt-14 bg-[#111827] flex flex-col font-mono text-xs overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 shadow-md z-10 gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 whitespace-nowrap"><Search size={16} className="text-gray-500"/> Telemetry Logs</h2>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setLogFilterSeverity(null)} className={clsx("px-3 py-1 rounded-full text-xs font-bold", !logFilterSeverity ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-500")}>ALL</button>
                <button onClick={() => setLogFilterSeverity('INFO')} className={clsx("px-3 py-1 rounded-full text-xs font-bold", logFilterSeverity === 'INFO' ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500")}>INFO</button>
                <button onClick={() => setLogFilterSeverity('WARN')} className={clsx("px-3 py-1 rounded-full text-xs font-bold", logFilterSeverity === 'WARN' ? "bg-orange-900 text-orange-400" : "bg-gray-800 text-gray-500")}>WARN</button>
                <button onClick={() => setLogFilterSeverity('CRIT')} className={clsx("px-3 py-1 rounded-full text-xs font-bold", logFilterSeverity === 'CRIT' ? "bg-red-900 text-red-400" : "bg-gray-800 text-gray-500")}>CRIT</button>
              </div>

              <input 
                type="text" 
                placeholder="Search..." 
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
