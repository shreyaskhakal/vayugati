"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const STATS = [
  { value: "1,042", label: "Sensor Nodes" },
  { value: "98.4%", label: "Uptime" },
  { value: "< 45s", label: "EMS Clearance" },
  { value: "12.4t", label: "CO₂ Saved" },
];

const BOOT_LINES = [
  "Establishing telemetry link...",
  "Loading junction topology...",
  "Calibrating anomaly detectors...",
  "Digital twin synchronized ✓",
];

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [bootLine, setBootLine] = useState(0);

  useEffect(() => {
    const lineInterval = setInterval(() => {
      setBootLine(prev => {
        if (prev < BOOT_LINES.length - 1) return prev + 1;
        clearInterval(lineInterval);
        return prev;
      });
    }, 550);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearInterval(lineInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[var(--color-canvas)] flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex flex-col items-center mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-indigo)] flex items-center justify-center shadow-[var(--shadow-indigo-glow)]">
                <span className="text-white font-black text-xl">V</span>
              </div>
              <div>
                <div className="font-black text-5xl tracking-tighter text-[var(--color-text-main)] leading-none">VAYU</div>
                <div className="font-black text-5xl tracking-tighter text-[var(--color-accent-indigo)] leading-none">GATI</div>
              </div>
            </div>
            <div className="text-xs font-bold tracking-[0.35em] text-[var(--color-text-muted)] uppercase mt-1">
              Urban Digital Twin Platform
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="w-72 mb-8">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.8, ease: "easeInOut" }}
              style={{ originX: 0 }}
              className="h-0.5 bg-[var(--color-accent-indigo)] rounded-full"
            />
          </div>

          {/* Boot lines */}
          <div className="font-mono text-xs text-[var(--color-text-muted)] flex flex-col gap-1 mb-10 w-64">
            {BOOT_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= bootLine ? 1 : 0, x: i <= bootLine ? 0 : -10 }}
                transition={{ duration: 0.3 }}
                className={i === bootLine ? "text-[var(--color-accent-indigo)]" : "text-[var(--color-text-muted)]"}
              >
                {i < bootLine ? "✓ " : i === bootLine ? "› " : "  "}{line}
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex items-center gap-8"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6 + i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="text-2xl font-black text-[var(--color-text-main)]">{stat.value}</div>
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
