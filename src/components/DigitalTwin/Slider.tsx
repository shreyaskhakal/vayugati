"use client";

import { motion, useMotionValue } from "framer-motion";
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

  useEffect(() => {
    return x.on("change", (latestX) => {
      if (containerWidth > 0) {
        let percentage = (latestX / containerWidth) * 100;
        percentage = Math.max(0, Math.min(100, Math.round(percentage)));
        onDrag(percentage);
      }
    });
  }, [x, containerWidth, onDrag]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        className="absolute top-0 bottom-0 w-1 bg-[var(--color-accent-indigo)] cursor-ew-resize pointer-events-auto flex items-center justify-center translate-x-[-50%]"
      >
        <div className="w-8 h-8 bg-[var(--color-accent-indigo)] text-white rounded-full flex items-center justify-center shadow-[var(--shadow-indigo-glow)]">
          <ArrowLeftRight size={16} />
        </div>
      </motion.div>
    </div>
  );
}
