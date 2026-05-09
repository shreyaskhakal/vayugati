"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
}

export function ToastManager() {
  const { junctions } = useStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Monitor for critical states
  useEffect(() => {
    const criticalJunctions = junctions.filter(j => j.status === 'emergency');
    
    if (criticalJunctions.length > 0) {
      const newToast = {
        id: Date.now().toString(),
        message: `CRITICAL: Anomaly detected at ${criticalJunctions.map(j => j.id).join(', ')}`,
      };
      
      setToasts(prev => {
        // Prevent spamming the same message
        if (prev.some(t => t.message === newToast.message)) return prev;
        return [...prev, newToast];
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    }
  }, [junctions]);

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-red-500/10 backdrop-blur-md border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] text-red-500 px-4 py-3 rounded-lg flex items-center gap-3 w-80"
          >
            <AlertTriangle size={20} className="shrink-0" />
            <div className="text-sm font-bold leading-tight flex-1">
              {toast.message}
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-red-500/70 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
