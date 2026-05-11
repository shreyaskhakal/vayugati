"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { Search, X, Sparkles, ChevronRight } from "lucide-react";
import clsx from "clsx";

const SUGGESTIONS = [
  "Which nodes are in warning state?",
  "What is the load on BRG-1?",
  "Show arteries with risk above 60%",
  "When was the last CRIT event?",
  "What is the current city pulse status?",
  "Which zones have emergency nodes?",
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { junctions, logs, greenSweepActive, greenWaveActive, cityZone } = useStore();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setResponse(""); setError(""); }
  }, [open]);

  const askQuery = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResponse("");
    setError("");

    const context = {
      cityZone,
      greenSweepActive,
      greenWaveActive,
      cityPulse: junctions.some(j => j.status === "emergency") ? "CRITICAL" : junctions.some(j => j.status === "warning") ? "WARNING" : "STABLE",
      nodes: junctions.map(j => ({
        id: j.id, name: j.name, status: j.status,
        load: j.load, latency: j.latency, density: j.density,
        predictedRisk: j.predictedRisk, lastEvent: j.lastEvent,
      })),
      recentLogs: logs.slice(0, 10).map(l => ({ severity: l.severity, message: l.message, time: l.timestamp })),
    };

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context }),
      });

      if (!res.ok) throw new Error("Query failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setResponse(full);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [junctions, logs, greenSweepActive, greenWaveActive, cityZone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuery(query);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-a)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <Sparkles size={16} className="text-[var(--color-accent-indigo)] shrink-0" />
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask the intelligence layer..."
              className="flex-1 bg-transparent text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] outline-none text-sm font-medium"
            />
            {query && (
              <button type="submit" disabled={loading}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--color-accent-indigo)] text-white disabled:opacity-50 flex items-center gap-1 shrink-0">
                {loading ? "..." : <><ChevronRight size={12} /> Ask</>}
              </button>
            )}
          </form>
          <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Response area */}
        {(response || loading || error) && (
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] min-h-[80px]">
            <div className="text-[10px] font-bold text-[var(--color-accent-indigo)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles size={10} /> Intelligence Layer
            </div>
            {loading && !response && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-indigo)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                Querying telemetry...
              </div>
            )}
            {error && <div className="text-sm text-red-400 font-medium">{error}</div>}
            {response && (
              <p className="text-sm text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap">
                {response}
                {loading && <span className="inline-block w-0.5 h-4 bg-[var(--color-accent-indigo)] animate-pulse ml-0.5 align-middle" />}
              </p>
            )}
          </div>
        )}

        {/* Suggestions */}
        {!response && !loading && (
          <div className="p-3 flex flex-col gap-1">
            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2 mb-1">Suggested Queries</div>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); askQuery(s); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-text-main)] transition-colors text-left group"
              >
                <Search size={13} className="shrink-0 group-hover:text-[var(--color-accent-indigo)] transition-colors" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[var(--color-canvas)] flex items-center justify-between border-t border-[var(--color-border-subtle)]">
          <span className="text-[10px] text-[var(--color-text-muted)]">Powered by Gemini · Vayu-Gati Intelligence Layer</span>
          <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-border-subtle)] font-bold">↵</kbd> to ask
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-border-subtle)] font-bold">Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
