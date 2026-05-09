"use client";

import { motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";

interface Props {
  onDrag: (percentage: number) => void;
}

export function Slider({ onDrag }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      // Initialize at center
      x.set(containerRef.current.offsetWidth / 2);
      onDrag(50);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useMotionValueEvent(x, "change", (latestX) => {
    if (containerWidth > 0) {
      let percentage = (latestX / containerWidth) * 100;
      percentage = Math.max(0, Math.min(100, Math.round(percentage)));
      onDrag(percentage);
    }
  });

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: containerWidth }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, left: 0 }}
        className="absolute top-0 bottom-0 w-1 bg-[var(--color-accent-indigo)] cursor-ew-resize pointer-events-auto flex items-center justify-center -ml-[2px]"
      >
        <div className="absolute top-1/4 -right-0 translate-x-full bg-[var(--color-surface-a)]/95 backdrop-blur-md px-3 py-1.5 rounded-r border-y border-r border-[var(--color-accent-indigo)]/30 text-[10px] font-bold text-[var(--color-text-main)] whitespace-nowrap shadow-[var(--shadow-weightless)] tracking-widest flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-indigo)] animate-pulse" />
          AI PREDICTION BOUNDARY (T+5MIN)
        </div>
        <div className="w-8 h-8 bg-[var(--color-accent-indigo)] text-white rounded-full flex items-center justify-center shadow-[var(--shadow-indigo-glow)]">
          <ArrowLeftRight size={16} />
        </div>
      </motion.div>
    </div>
  );
}
