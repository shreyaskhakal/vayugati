"use client";

import { Junction, useStore } from "@/store/useStore";
import { X, Activity } from "lucide-react";
import clsx from "clsx";

interface Props {
  junction: Junction;
}

export function JunctionCard({ junction }: Props) {
  const { setActiveJunctionId, executeReroute } = useStore();

  const isEmergency = junction.status === "emergency";
  const isWarning = junction.status === "warning";

  return (
    <div
      className={clsx(
        "absolute top-6 left-6 w-80 bg-white/80 backdrop-blur-md rounded border flex flex-col shadow-[var(--shadow-weightless)] z-40 overflow-hidden",
        isEmergency ? "border-[var(--color-emergency)] shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "border-[var(--color-border-subtle)]"
      )}
    >
      <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-subtle)]">
        <h3 className="font-semibold text-sm tracking-wide">{junction.name}</h3>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
              isEmergency ? "bg-blue-100 text-blue-600" : isWarning ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
            )}
          >
            {junction.status}
          </span>
          <button onClick={() => setActiveJunctionId(null)} className="text-gray-400 hover:text-gray-800">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50/50 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flow Rate</span>
            <span className="text-xl font-bold">{junction.throughput} <span className="text-xs font-medium text-gray-500">v/h</span></span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wait</span>
            <span className="text-xl font-bold">{junction.waitTime}s</span>
          </div>
        </div>
        
        {/* Sparkline Chart SVG */}
        <div className="h-12 w-full flex items-end justify-between border-b border-dashed border-gray-200 pb-1">
           {/* Mock sparkline data rendering */}
           {[40, 70, 45, 90, 60, 85, parseInt((junction.density * 100).toString())].map((val, i) => (
             <div key={i} className="w-8 flex flex-col justify-end h-full items-center group relative">
               <div 
                 className={clsx(
                   "w-full rounded-t-sm transition-all",
                   val > 80 ? "bg-blue-500" : val > 50 ? "bg-indigo-400" : "bg-gray-200"
                 )}
                 style={{ height: `${val}%` }}
               />
               <div className="hidden group-hover:block absolute -top-6 text-[10px] font-bold bg-gray-800 text-white px-1 rounded">{val}</div>
             </div>
           ))}
        </div>
      </div>

      {isEmergency && (
        <div className="bg-blue-50 text-blue-600 p-3 text-xs font-bold flex items-center gap-2">
          <Activity size={14} /> Bypass Active
        </div>
      )}

      {junction.rerouteSuggestion && (
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-blue-500/5">
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Reroute Suggestion</div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {junction.rerouteSuggestion.reason}
          </p>
          <button 
            onClick={() => executeReroute(junction.id, junction.rerouteSuggestion!.toNodeId)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg transition-all"
          >
            Execute Autonomous Reroute
          </button>
        </div>
      )}
    </div>
  );
}
