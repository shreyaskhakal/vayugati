"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[var(--color-canvas)] flex flex-col items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl font-black tracking-tighter text-[var(--color-text-main)] mb-8"
          >
            [V-G]
          </motion.div>
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-1 bg-[var(--color-accent-indigo)] w-64 rounded-full"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs font-bold tracking-[0.3em] text-[var(--color-text-muted)] uppercase"
            >
              Initializing Digital Twin...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
