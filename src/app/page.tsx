"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Layout/Sidebar";
import { GoogleMapWrapper } from "@/components/Map/GoogleMapWrapper";
import { Slider } from "@/components/DigitalTwin/Slider";
import { JunctionCard } from "@/components/Telemetry/JunctionCard";
import { useState, useEffect, useRef } from "react";

import clsx from "clsx";
import { Search, ShieldAlert } from "lucide-react";
import { LineChart, Line, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { activeTab, greenSweepActive, activeJunctionId, junctions, updateJunction, setActiveTab } = useStore();
  const [sliderPercentage, setSliderPercentage] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulation state
  const [trafficMod, setTrafficMod] = useState(0);
  const [weatherIndex, setWeatherIndex] = useState(5);
  const [simResults, setSimResults] = useState<null | { congestion: number; arteries: string[]; etaImpact: string; savedAt: string }>(null);
  const [savedSims, setSavedSims] = useState<Array<{ id: string; name: string; congestion: number; savedAt: string }>>([]);
  const [compareToLive, setCompareToLive] = useState(false);

  const activeJunction = junctions.find((j) => j.id === activeJunctionId);

  const [logSearch, setLogSearch] = useState("");
  const [logFilterSeverity, setLogFilterSeverity] = useState<string | null>(null);
  const [logTimeRange, setLogTimeRange] = useState<string>('1h');
  const [logTailActive, setLogTailActive] = useState(true);
  const logScrollRef = useRef<HTMLDivElement>(null);

  
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

  const ALL_LOGS = [
    { time: "10:40:01", level: "INFO",  message: "System boot sequence complete. All nodes nominal.",              color: "text-green-400" },
    { time: "10:40:22", level: "INFO",  message: "Digital Twin telemetry link established (WebSocket OK)",         color: "text-green-400" },
    { time: "10:41:05", level: "WARN",  message: "Node J2 — latency spike detected (220ms, threshold: 150ms)",    color: "text-orange-400" },
    { time: "10:41:30", level: "INFO",  message: "Green Sweep Protocol standing by (no active EMS routes)",       color: "text-green-400" },
    { time: "10:42:01", level: "INFO",  message: "Node J1 density shift detected (0.30 → 0.35)",                  color: "text-green-400" },
    { time: "10:42:05", level: "INFO",  message: "Synchronizing Digital Twin state... OK",                         color: "text-green-400" },
    { time: "10:42:12", level: "WARN",  message: "Node J3 latency spike (120ms). Auto-recovery in progress.",      color: "text-orange-400" },
    { time: "10:42:15", level: "INFO",  message: "Awaiting EMS transponder signals from dispatch...",              color: "text-green-400" },
    { time: "10:42:55", level: "WARN",  message: "Artery BRG-1 — structural load approaching 85% threshold",       color: "text-orange-400" },
    { time: "10:43:00", level: "CRIT",  message: "Emergency preemption triggered — Sector 4 lockdown active",      color: "text-red-400" },
    { time: "10:43:08", level: "CRIT",  message: "Node J3 OFFLINE — density overflow (1.0), throughput = 0",       color: "text-red-400" },
    { time: "10:43:22", level: "INFO",  message: "Rerouting confirmed: traffic redirected via EXP-5 and ART-2A",   color: "text-green-400" },
    { time: "10:43:45", level: "WARN",  message: "Weather API: rain probability > 70% — activating wet-road mode", color: "text-orange-400" },
    { time: "10:44:10", level: "INFO",  message: "Prediction model run complete. ETA impact: +14min avg",          color: "text-green-400" },
    { time: "10:44:30", level: "CRIT",  message: "Alert: Sector 4 emergency still unresolved — escalating to L2",  color: "text-red-400" },
  ];

  const filteredLogs = ALL_LOGS.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || log.level.toLowerCase().includes(logSearch.toLowerCase());
    const matchesSeverity = logFilterSeverity ? log.level === logFilterSeverity : true;
    return matchesSearch && matchesSeverity;
  });

  const logCounts = {
    total: filteredLogs.length,
    CRIT: filteredLogs.filter(l => l.level === 'CRIT').length,
    WARN: filteredLogs.filter(l => l.level === 'WARN').length,
    INFO: filteredLogs.filter(l => l.level === 'INFO').length,
  };

  // Auto-scroll to bottom when tail is active
  useEffect(() => {
    if (logTailActive && logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [filteredLogs, logTailActive]);

  const handleExportLogs = () => {
    const content = filteredLogs.map(l => `[${l.time}] ${l.level.padEnd(4)} : ${l.message}`).join('\n');
    const blob = new Blob([`VAYU-GATI TELEMETRY EXPORT\nGenerated: ${new Date().toISOString()}\nFilter: ${logFilterSeverity ?? 'ALL'} | Search: "${logSearch}" | Range: ${logTimeRange}\n${'─'.repeat(60)}\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vg-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                 <div className="text-5xl font-black text-[var(--color-text-main)] relative z-10">1,042</div>
                 <div className="text-xs text-[var(--color-text-muted)] mt-1 relative z-10">
                   <span className="font-bold text-[var(--color-text-main)]">{junctions.length}</span> monitored in central sector
                 </div>
                 <div className="h-28 mt-3 flex items-center">
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

            {/* DEMO STORY BANNER */}
            <div className="mb-6 p-5 rounded-lg bg-[var(--color-surface-a)] border border-[var(--color-accent-indigo)]/30 shadow-[var(--shadow-weightless)]">
              <div className="text-[10px] font-bold text-[var(--color-accent-indigo)] uppercase tracking-widest mb-2">📋 Demo Script</div>
              <ol className="text-sm text-[var(--color-text-muted)] space-y-1 list-decimal list-inside">
                <li>Open <strong className="text-[var(--color-text-main)]">Simulations</strong> → click <em>Infrastructure Failure</em> preset to set CRITICAL city state.</li>
                <li>Go to <strong className="text-[var(--color-text-main)]">Pulse Map</strong> — watch red emergency nodes pulse aggressively.</li>
                <li>Return here and click <strong className="text-green-500">Activate Green Sweep</strong> in the sidebar to auto-clear EMS routes.</li>
                <li>Watch the <strong className="text-[var(--color-text-main)]">Artery Health</strong> tab — CRITICAL banner clears and sensor donut shifts to green.</li>
              </ol>
            </div>

            {/* Impact Numbers */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Emergency Response Time', value: '↓ 34%', color: 'text-green-500' },
                { label: 'Avg Intersection Wait', value: '↓ 28%', color: 'text-green-500' },
                { label: 'Carbon Emissions', value: '↓ 18%', color: 'text-green-500' },
                { label: 'EMS Route Clearance', value: '< 90s', color: 'text-[var(--color-accent-indigo)]' },
              ].map(stat => (
                <div key={stat.label} className="p-5 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)] text-center">
                  <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="p-6 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[var(--color-text-main)]">Emergency Preemption</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Auto-clear routes for flagged EMS vehicles</p>
                </div>
                <div className="w-12 h-6 bg-[var(--color-accent-indigo)] rounded-full flex items-center p-1 justify-end cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              
              <div className="p-6 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
                <h3 className="font-bold mb-4 text-[var(--color-text-main)]">Active Incident Routes</h3>
                <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
                  <span className="text-sm font-mono text-blue-500">AMB-774</span>
                  <span className="text-sm text-[var(--color-text-main)]">En route to General Hospital</span>
                  <span className="text-xs font-bold text-green-500">CLEAR</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-mono text-red-500">FIRE-22</span>
                  <span className="text-sm text-[var(--color-text-main)]">Responding to Sector 4</span>
                  <span className="text-xs font-bold text-orange-500">ROUTING</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
                   <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Today's Green Score</div>
                   <div className="text-5xl font-black text-green-500">87<span className="text-2xl text-[var(--color-text-muted)]">/100</span></div>
                   <div className="mt-4 text-xs font-bold text-[var(--color-text-muted)]">Top 10% among city zones</div>
                </div>
                <div className="p-6 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
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
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">Simulations &amp; "What-If" Models</h2>

            {/* Compare to Live Banner */}
            {compareToLive && (
              <div className="mb-6 p-4 rounded border border-[var(--color-accent-indigo)]/30 bg-[var(--color-accent-indigo)]/5 flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--color-accent-indigo)] uppercase tracking-widest">Compare to Live Mode Active — Showing Simulation vs Current Reality</div>
                <button onClick={() => setCompareToLive(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">✕ Exit</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Left: Controls */}
              <div className="flex flex-col gap-6">
                <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)] flex flex-col gap-6">
                  <h3 className="font-bold text-base">Manual Parameter Tuning</h3>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Traffic Volume Modifier</label>
                      <span className={clsx("text-sm font-black tabular-nums", trafficMod > 0 ? 'text-orange-500' : trafficMod < 0 ? 'text-green-500' : 'text-[var(--color-text-muted)]')}>
                        Traffic: {trafficMod > 0 ? '+' : ''}{trafficMod}%
                      </span>
                    </div>
                    <input
                      type="range" min={-50} max={100} value={trafficMod}
                      onChange={e => setTrafficMod(Number(e.target.value))}
                      className="w-full accent-[var(--color-accent-indigo)]"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
                      <span>-50%</span><span>0</span><span>+100%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Weather Impact Index</label>
                      <span className={clsx("text-sm font-black tabular-nums", weatherIndex >= 7 ? 'text-red-500' : weatherIndex >= 4 ? 'text-orange-500' : 'text-green-500')}>
                        Weather: {weatherIndex.toFixed(1)}/10
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={10} step={0.1} value={weatherIndex}
                      onChange={e => setWeatherIndex(Number(e.target.value))}
                      className="w-full accent-[var(--color-accent-indigo)]"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
                      <span>Clear</span><span>Moderate</span><span>Severe</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      disabled={isSimulating}
                      onClick={() => {
                        setIsSimulating(true);
                        setTimeout(() => {
                          const congestion = Math.min(99, Math.round(45 + trafficMod * 0.4 + weatherIndex * 3));
                          const affected = ['ART-4B', 'BRG-1'];
                          if (trafficMod > 30) affected.push('EXP-5');
                          if (weatherIndex > 6) affected.push('TUN-9');
                          const etaMin = Math.round(8 + trafficMod * 0.15 + weatherIndex * 1.2);
                          setSimResults({ congestion, arteries: affected, etaImpact: `+${etaMin} min avg`, savedAt: new Date().toISOString() });
                          updateJunction('J1', { density: Math.min(1, 0.4 + trafficMod / 100), status: trafficMod > 40 ? 'emergency' : trafficMod > 10 ? 'warning' : 'optimal', throughput: 3000 });
                          updateJunction('J2', { density: Math.min(1, 0.3 + weatherIndex / 10), status: weatherIndex > 7 ? 'emergency' : weatherIndex > 4 ? 'warning' : 'optimal', throughput: 2000 });
                          setIsSimulating(false);
                        }, 2000);
                      }}
                      className={clsx(
                        "flex-1 text-white font-bold text-sm py-3 rounded transition-all",
                        isSimulating ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--color-accent-indigo)] shadow-[var(--shadow-indigo-glow)] hover:bg-indigo-500"
                      )}
                    >
                      {isSimulating ? "Running AI Model..." : "▶ Run Prediction"}
                    </button>
                    <button
                      onClick={() => setCompareToLive(!compareToLive)}
                      className={clsx(
                        "px-4 py-3 rounded text-sm font-bold border transition-all",
                        compareToLive
                          ? "bg-[var(--color-accent-indigo)] text-white border-[var(--color-accent-indigo)]"
                          : "border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-indigo)] hover:text-[var(--color-accent-indigo)]"
                      )}
                    >
                      ⇄ vs Live
                    </button>
                  </div>
                </div>

                {/* Results Panel — always visible */}
                <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">Simulation Results</h3>
                    {simResults && (
                      <button
                        onClick={() => {
                          setSavedSims(prev => [...prev, {
                            id: Date.now().toString(),
                            name: `Run at ${new Date().toLocaleTimeString()}`,
                            congestion: simResults.congestion,
                            savedAt: simResults.savedAt,
                          }]);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded border border-[var(--color-accent-indigo)] text-[var(--color-accent-indigo)] hover:bg-[var(--color-accent-indigo)] hover:text-white transition-all"
                      >
                        💾 Save Simulation
                      </button>
                    )}
                  </div>

                  {!simResults && !isSimulating && (
                    <div className="text-center py-8 flex flex-col items-center gap-2">
                      <div className="text-4xl">▶</div>
                      <div className="text-sm font-bold text-[var(--color-text-muted)]">Set parameters and click Run Prediction</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Results will appear here — congestion %, affected arteries, and ETA impact</div>
                    </div>
                  )}

                  {isSimulating && (
                    <div className="text-center py-8 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin" />
                      <div className="text-sm font-bold text-[var(--color-accent-indigo)]">Running AI prediction model...</div>
                    </div>
                  )}

                  {simResults && !isSimulating && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 rounded bg-[var(--color-canvas)] border border-[var(--color-border-subtle)]">
                          <div className={clsx("text-3xl font-black", simResults.congestion > 70 ? 'text-red-500' : simResults.congestion > 40 ? 'text-orange-500' : 'text-green-500')}>
                            {simResults.congestion}%
                          </div>
                          <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1 text-center">Predicted Congestion</div>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded bg-[var(--color-canvas)] border border-[var(--color-border-subtle)]">
                          <div className="text-3xl font-black text-orange-500">{simResults.arteries.length}</div>
                          <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1 text-center">Arteries Affected</div>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded bg-[var(--color-canvas)] border border-[var(--color-border-subtle)]">
                          <div className="text-3xl font-black text-red-500">{simResults.etaImpact}</div>
                          <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1 text-center">ETA Impact</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        <span className="font-bold text-[var(--color-text-main)]">Affected Arteries: </span>
                        {simResults.arteries.join(', ')}
                      </div>
                      {compareToLive && (
                        <div className="p-3 rounded bg-[var(--color-accent-indigo)]/5 border border-[var(--color-accent-indigo)]/20 text-xs">
                          <div className="font-bold text-[var(--color-accent-indigo)] mb-1">Live vs Simulation</div>
                          <div className="grid grid-cols-2 gap-2 text-[var(--color-text-muted)]">
                            <span>Live Congestion: <strong className="text-[var(--color-text-main)]">~42%</strong></span>
                            <span>Sim Congestion: <strong className={simResults.congestion > 70 ? 'text-red-500' : 'text-orange-500'}>{simResults.congestion}%</strong></span>
                            <span>Live ETA: <strong className="text-[var(--color-text-main)]">Normal</strong></span>
                            <span>Sim ETA: <strong className="text-orange-500">{simResults.etaImpact}</strong></span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Saved Simulations */}
                {savedSims.length > 0 && (
                  <div className="p-6 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)]">
                    <h3 className="font-bold text-sm mb-3">Saved Simulations</h3>
                    {savedSims.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0">
                        <div>
                          <div className="text-xs font-bold text-[var(--color-text-main)]">{s.name}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Congestion: {s.congestion}%</div>
                        </div>
                        <span className={clsx("text-xs font-black", s.congestion > 70 ? 'text-red-500' : s.congestion > 40 ? 'text-orange-500' : 'text-green-500')}>{s.congestion}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Presets */}
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-base">Preset Simulation Scenarios</h3>
                {[
                  {
                    label: 'Rush Hour Gridlock', color: 'orange',
                    desc: 'Simulates 5PM Friday traffic density across all central arteries.',
                    action: () => { setTrafficMod(75); setWeatherIndex(3); updateJunction('J1', { density: 0.9, status: 'warning', throughput: 2800 }); updateJunction('J2', { density: 0.95, status: 'emergency', throughput: 450 }); updateJunction('J3', { density: 0.85, status: 'warning', throughput: 1100 }); }
                  },
                  {
                    label: 'Flood Event', color: 'blue',
                    desc: 'Severe waterlogging at Junction 3, rerouting traffic to J4.',
                    action: () => { setTrafficMod(20); setWeatherIndex(9.5); updateJunction('J3', { density: 1.0, status: 'emergency', throughput: 0 }); updateJunction('J4', { density: 0.9, status: 'warning', throughput: 500 }); }
                  },
                  {
                    label: 'Major Event', color: 'purple',
                    desc: 'Stadium event causing 80k+ attendee surge in Zone 2 + Zone 5.',
                    action: () => { setTrafficMod(90); setWeatherIndex(2); updateJunction('J2', { density: 0.98, status: 'emergency', throughput: 200 }); updateJunction('J4', { density: 0.88, status: 'warning', throughput: 900 }); }
                  },
                  {
                    label: 'Power Outage', color: 'yellow',
                    desc: 'Grid failure at Sector 4 disabling signals across 6 intersections.',
                    action: () => { setTrafficMod(50); setWeatherIndex(4); updateJunction('J1', { density: 0.85, status: 'warning', throughput: 600 }); updateJunction('J4', { density: 0.95, status: 'emergency', throughput: 0 }); }
                  },
                  {
                    label: 'Infrastructure Failure', color: 'red',
                    desc: 'Critical bridge structural failure. All lanes on BRG-1 closed.',
                    action: () => { setTrafficMod(60); setWeatherIndex(5); updateJunction('J3', { density: 1.0, status: 'emergency', throughput: 0 }); updateJunction('J1', { density: 0.92, status: 'emergency', throughput: 300 }); }
                  },
                  {
                    label: 'Heavy Rain', color: 'cyan',
                    desc: 'Sustained rainfall reducing visibility and road traction citywide.',
                    action: () => { setTrafficMod(30); setWeatherIndex(8.5); updateJunction('J2', { density: 0.75, status: 'warning', throughput: 1500 }); updateJunction('J3', { density: 0.80, status: 'warning', throughput: 1200 }); }
                  },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => { preset.action(); setActiveTab('pulse-map'); }}
                    className={clsx(
                      "p-4 border rounded text-left transition-all hover:shadow-[var(--shadow-weightless)]",
                      preset.color === 'orange' && 'border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                      preset.color === 'blue' && 'border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                      preset.color === 'purple' && 'border-purple-200 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                      preset.color === 'yellow' && 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
                      preset.color === 'red' && 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20',
                      preset.color === 'cyan' && 'border-cyan-200 bg-cyan-50/50 dark:border-cyan-900/30 dark:bg-cyan-900/10 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
                    )}
                  >
                    <div className={clsx(
                      "font-bold text-sm",
                      preset.color === 'orange' && 'text-orange-700 dark:text-orange-400',
                      preset.color === 'blue' && 'text-blue-700 dark:text-blue-400',
                      preset.color === 'purple' && 'text-purple-700 dark:text-purple-400',
                      preset.color === 'yellow' && 'text-yellow-700 dark:text-yellow-400',
                      preset.color === 'red' && 'text-red-700 dark:text-red-400',
                      preset.color === 'cyan' && 'text-cyan-700 dark:text-cyan-400',
                    )}>{preset.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "system-logs" && (
          <div className="absolute inset-0 pt-14 bg-[#0d1117] flex flex-col font-mono text-xs overflow-hidden">
            
            {/* Header toolbar */}
            <div className="p-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur z-10 flex flex-wrap items-center gap-3">
              {/* Title + log count */}
              <div className="flex items-center gap-3 mr-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 whitespace-nowrap">
                  <Search size={14} className="text-gray-500"/>
                  Telemetry Logs
                </h2>
                <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                  {logCounts.total} events —{" "}
                  {logCounts.CRIT > 0 && <span className="text-red-400">{logCounts.CRIT} CRIT</span>}
                  {logCounts.CRIT > 0 && logCounts.WARN > 0 && ", "}
                  {logCounts.WARN > 0 && <span className="text-orange-400">{logCounts.WARN} WARN</span>}
                  {(logCounts.CRIT > 0 || logCounts.WARN > 0) && logCounts.INFO > 0 && ", "}
                  {logCounts.INFO > 0 && <span className="text-green-400">{logCounts.INFO} INFO</span>}
                </span>
              </div>

              {/* Severity pills */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => setLogFilterSeverity(null)} className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", !logFilterSeverity ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-500")}>ALL</button>
                <button onClick={() => setLogFilterSeverity('INFO')} className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", logFilterSeverity === 'INFO' ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500")}>INFO</button>
                <button onClick={() => setLogFilterSeverity('WARN')} className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", logFilterSeverity === 'WARN' ? "bg-orange-900 text-orange-400" : "bg-gray-800 text-gray-500")}>WARN</button>
                <button onClick={() => setLogFilterSeverity('CRIT')} className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", logFilterSeverity === 'CRIT' ? "bg-red-900 text-red-400" : "bg-gray-800 text-gray-500")}>CRIT</button>
              </div>

              {/* Time range pills */}
              <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
                {['15m', '1h', '6h', '24h'].map(r => (
                  <button key={r} onClick={() => setLogTimeRange(r)} className={clsx("px-2.5 py-1 rounded text-[10px] font-bold", logTimeRange === r ? "bg-[var(--color-accent-indigo)] text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300")}>{r}</button>
                ))}
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1.5 rounded border border-gray-700 outline-none focus:border-[var(--color-accent-indigo)] text-xs flex-1 min-w-32"
              />

              {/* Tail + Export controls */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setLogTailActive(p => !p)}
                  className={clsx(
                    "px-3 py-1.5 rounded text-[10px] font-bold border transition-all",
                    logTailActive
                      ? "border-green-500/50 bg-green-900/30 text-green-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:text-white"
                  )}
                >
                  {logTailActive ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button
                  onClick={handleExportLogs}
                  className="px-3 py-1.5 rounded text-[10px] font-bold border border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  ↓ Export
                </button>
              </div>
            </div>

            {/* Log lines */}
            <div ref={logScrollRef} className="flex-1 p-4 overflow-auto flex flex-col gap-0.5">
              {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    "px-3 py-1.5 rounded-sm flex items-start gap-3 leading-relaxed",
                    log.level === 'CRIT'
                      ? "border-l-2 border-red-500 bg-red-500/5 font-bold"
                      : log.level === 'WARN'
                      ? "border-l-2 border-orange-500/50"
                      : "border-l-2 border-transparent"
                  )}
                >
                  <span className="text-gray-600 shrink-0 tabular-nums">[{log.time}]</span>
                  <span className={clsx(
                    "shrink-0 w-10",
                    log.level === 'CRIT' ? 'text-red-400' : log.level === 'WARN' ? 'text-orange-400' : 'text-green-400'
                  )}>{log.level}</span>
                  <span className={clsx("flex-1", log.level === 'CRIT' ? 'text-red-300' : 'text-gray-300')}>{log.message}</span>
                </div>
              )) : (
                <span className="text-gray-600 italic px-3">No telemetry data matches your filter.</span>
              )}
            </div>

            {/* Tail status bar */}
            <div className="h-7 border-t border-gray-800 bg-gray-900/60 px-4 flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                Range: <span className="text-gray-400">{logTimeRange}</span>
                {" · "}
                Filter: <span className="text-gray-400">{logFilterSeverity ?? 'ALL'}</span>
              </span>
              <span className={clsx("text-[10px] font-bold flex items-center gap-1.5", logTailActive ? 'text-green-500' : 'text-gray-600')}>
                <span className={clsx("w-1.5 h-1.5 rounded-full", logTailActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600')} />
                {logTailActive ? 'LIVE TAIL' : 'PAUSED'}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
