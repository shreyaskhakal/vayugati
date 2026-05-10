"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, X } from "lucide-react";
import { useStore } from "@/store/useStore";

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { junctions, activeTab } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Focus input on next tick to allow rendering
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Small delay before clearing to allow exit animation
      setTimeout(() => {
        setQuery("");
        setResponse("");
      }, 200);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse("");

    try {
      // Gather context
      const context = {
        junctions: junctions,
        activeTab: activeTab,
        currentTime: new Date().toISOString()
      };

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API error");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setResponse((prev) => prev + chunk);
        }
      }
    } catch (error: any) {
      console.error(error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-32 p-4">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10"
          >
            <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
              <Sparkles size={20} className="text-[var(--color-accent-indigo)] mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask the intelligence layer... (e.g. 'Which nodes are in warning state?')"
                className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-main)] text-sm placeholder:text-[var(--color-text-muted)]"
              />
              <div className="flex items-center gap-2 ml-3">
                {isLoading && <Loader2 size={16} className="text-[var(--color-accent-indigo)] animate-spin" />}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </form>

            {/* Suggestions or Results */}
            <div className="p-4 max-h-[60vh] overflow-auto">
              {!response && !isLoading && !query && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Suggested Queries</div>
                  {[
                    "What is the current load on Gamma Node?",
                    "Which nodes are in warning state?",
                    "Is Green Sweep active right now?",
                    "Give me a summary of critical junctions."
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuery(suggestion)}
                      className="text-left text-sm px-3 py-2 rounded text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)]/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {(response || isLoading) && (
                <div className="text-sm leading-relaxed text-[var(--color-text-main)] whitespace-pre-wrap">
                  {response}
                  {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-[var(--color-accent-indigo)] animate-pulse" />}
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-canvas)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
              <div className="flex items-center gap-4">
                <span><kbd className="font-sans px-1.5 py-0.5 rounded bg-[var(--color-border-subtle)] text-[var(--color-text-main)] font-medium">↵</kbd> to submit</span>
                <span><kbd className="font-sans px-1.5 py-0.5 rounded bg-[var(--color-border-subtle)] text-[var(--color-text-main)] font-medium">esc</kbd> to close</span>
              </div>
              <div>Powered by Gemini AI</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
