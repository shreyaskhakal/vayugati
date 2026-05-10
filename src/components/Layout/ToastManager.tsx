"use client";

import { useStore, SystemLog } from "@/store/useStore";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  timestamp: string;
  source: "junction" | "log";
  severity: "WARN" | "CRIT";
}

function formatTimestamp(): string {
  return new Date().toISOString().substring(11, 19) + " UTC";
}

export function ToastManager() {
  const { junctions, logs, setActiveTab } = useStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenMessages = useRef<Set<string>>(new Set());
  const lastLogId = useRef<string | null>(null);

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
      addToast({ message: msg, timestamp: formatTimestamp(), source: "junction", severity: "CRIT" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junctions]);

  // ── Listen to real logs from Anomaly Engine ─────────────────────────────
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      if (latestLog.id !== lastLogId.current && (latestLog.severity === "WARN" || latestLog.severity === "CRIT")) {
        lastLogId.current = latestLog.id;
        addToast({
          message: latestLog.message,
          timestamp: latestLog.timestamp,
          source: "log",
          severity: latestLog.severity as "WARN" | "CRIT"
        });
      }
    }
  }, [logs]);

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
            className={`pointer-events-auto rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(${toast.severity === 'CRIT' ? '239,68,68' : '249,115,22'},0.25)] border ${toast.severity === 'CRIT' ? 'border-red-500/30' : 'border-orange-500/30'}`}
            style={{ background: "rgba(20,10,10,0.95)", backdropFilter: "blur(12px)" }}
          >
            {/* Top accent line */}
            <div className={`h-0.5 w-full bg-gradient-to-r ${toast.severity === 'CRIT' ? 'from-red-600 to-red-400' : 'from-orange-500 to-amber-400'}`} />

            <div className="p-3.5 flex flex-col gap-2.5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={14} className={`${toast.severity === 'CRIT' ? 'text-red-500' : 'text-orange-500'} shrink-0 mt-px`} />
                  <span className={`text-[10px] font-black tracking-[0.15em] uppercase ${toast.severity === 'CRIT' ? 'text-red-500' : 'text-orange-500'}`}>
                    {toast.severity}
                  </span>
                  <span className={`text-[9px] font-mono ${toast.severity === 'CRIT' ? 'text-red-500/50' : 'text-orange-500/50'} shrink-0`}>
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
              className={`h-0.5 ${toast.severity === 'CRIT' ? 'bg-red-600/60' : 'bg-orange-500/60'}`}
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
