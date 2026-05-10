"use client";

import { motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Clock, Play, Pause } from "lucide-react";

interface Props {
  hour: number; // 0 to 24 (24 means "Live")
  onChange: (hour: number) => void;
}

export function TimelineScrubber({ hour, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      // set initial position based on hour
      x.set((hour / 24) * containerRef.current.offsetWidth);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        x.set((hour / 24) * containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external hour changes if not dragging
  useEffect(() => {
    if (containerWidth > 0 && !isPlaying) {
      x.set((hour / 24) * containerWidth);
    }
  }, [hour, containerWidth, isPlaying, x]);

  useMotionValueEvent(x, "change", (latestX) => {
    if (containerWidth > 0) {
      let percentage = (latestX / containerWidth);
      let newHour = Math.round(percentage * 24);
      newHour = Math.max(0, Math.min(24, newHour));
      if (newHour !== hour) {
        onChange(newHour);
      }
    }
  });

  // Playback effect
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      onChange(hour >= 24 ? 0 : hour + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, hour, onChange]);

  const displayTime = hour === 24 ? "LIVE" : `${hour.toString().padStart(2, '0')}:00 UTC`;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-[80%] max-w-3xl flex items-center gap-4 bg-[var(--color-surface-a)]/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 rounded-full bg-[var(--color-accent-indigo)] text-white flex items-center justify-center shrink-0 shadow-[var(--shadow-indigo-glow)] transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
      </button>

      <div className="flex-1 relative h-10 flex items-center group" ref={containerRef}>
        {/* Track */}
        <div className="absolute left-0 right-0 h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          {/* Fill */}
          <motion.div 
            className="absolute left-0 top-0 bottom-0 bg-[var(--color-accent-indigo)]"
            style={{ width: x }}
          />
        </div>

        {/* Hour markers */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none px-1">
          {[0, 6, 12, 18, 24].map(tick => (
            <div key={tick} className="w-1 h-3 bg-[var(--color-border-subtle)] group-hover:bg-gray-500 transition-colors" />
          ))}
        </div>

        {/* Handle */}
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDragStart={() => setIsPlaying(false)}
          className="absolute w-5 h-5 bg-white border-2 border-[var(--color-accent-indigo)] rounded-full cursor-grab active:cursor-grabbing shadow-lg top-1/2 -mt-2.5 -ml-2.5 z-10"
        />
      </div>

      <div className="w-28 shrink-0 flex items-center justify-end gap-2 text-[var(--color-text-main)] font-mono font-bold tracking-widest text-sm">
        {hour !== 24 && <Clock size={14} className="text-[var(--color-text-muted)]" />}
        {hour === 24 ? (
          <span className="flex items-center gap-2 text-[var(--color-accent-indigo)]"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/> LIVE</span>
        ) : displayTime}
      </div>

    </div>
  );
}
