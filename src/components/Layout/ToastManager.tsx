"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  timestamp: string;
  source: "junction" | "log";
}

// Pool of simulated CRIT log entries that fire over time
const CRIT_LOG_POOL = [
  "Emergency preemption triggered — Sector 4 lockdown active",
  "Node J3 OFFLINE — density overflow (1.0), throughput = 0",
  "Alert: Sector 4 emergency still unresolved — escalating to L2",
  "BRG-1 structural load exceeded 90% — immediate inspection required",
  "EMS transponder signal lost — rerouting AMB-774",
  "Cascade failure risk detected — nodes J2+J3 correlated",
];

function formatTimestamp(): string {
  return new Date().toISOString().substring(11, 19) + " UTC";
}

export function ToastManager() {
  const { junctions, setActiveTab } = useStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenMessages = useRef<Set<string>>(new Set());
  const poolIndex = useRef(0);

  const addToast = (toast: Omit<Toast, "id">) => {
    if (seenMessages.current.has(toast.message)) return;
    seenMessages.current.add(toast.message);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const full: Toast = { ...toast, id };

    setToasts((prev) => [...prev.slice(-3), full]); // max 4 visible

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // ── Monitor junction states ─────────────────────────────────────────────
  useEffect(() => {
    const criticals = junctions.filter((j) => j.status === "emergency");
    if (criticals.length > 0) {
      const msg = `CRITICAL anomaly at ${criticals.map((j) => j.id).join(", ")}`;
      addToast({ message: msg, timestamp: formatTimestamp(), source: "junction" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junctions]);

  // ── Simulate live CRIT log entries ─────────────────────────────────────
  useEffect(() => {
    // Fire first one quickly for demo impact, then every ~15s
    const first = setTimeout(() => {
      const msg = CRIT_LOG_POOL[poolIndex.current % CRIT_LOG_POOL.length];
      poolIndex.current++;
      addToast({ message: msg, timestamp: formatTimestamp(), source: "log" });

      const recurring = setInterval(() => {
        const m = CRIT_LOG_POOL[poolIndex.current % CRIT_LOG_POOL.length];
        poolIndex.current++;
        addToast({ message: m, timestamp: formatTimestamp(), source: "log" });
      }, 15000);

      return () => clearInterval(recurring);
    }, 4000);

    return () => clearTimeout(first);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2.5 pointer-events-none w-80">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 56, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 56, scale: 0.92, transition: { duration: 0.18 } }}
            layout
            className="pointer-events-auto rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(239,68,68,0.25)] border border-red-500/30"
            style={{ background: "rgba(20,10,10,0.95)", backdropFilter: "blur(12px)" }}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-red-600 to-red-400" />

            <div className="p-3.5 flex flex-col gap-2.5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-px" />
                  <span className="text-[10px] font-black tracking-[0.15em] uppercase text-red-500">
                    CRIT
                  </span>
                  <span className="text-[9px] font-mono text-red-500/50 shrink-0">
                    {toast.timestamp}
                  </span>
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-red-500/50 hover:text-red-400 transition-colors shrink-0"
                  aria-label="Dismiss alert"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Message */}
              <p className="text-xs font-medium text-red-100/90 leading-relaxed">
                {toast.message}
              </p>

              {/* View Logs button */}
              <button
                onClick={() => {
                  setActiveTab("system-logs");
                  dismiss(toast.id);
                }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors self-start"
              >
                <ExternalLink size={11} />
                View System Logs
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="h-0.5 bg-red-600/60"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
