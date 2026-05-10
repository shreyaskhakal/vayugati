import { useState, useEffect } from "react";
import { Loader2, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface Artery { id: string; risk: number; }
interface Props { arteries: Artery[]; }

export function MaintenanceRecommendations({ arteries }: Props) {
  const [recommendations, setRecommendations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const highRiskArteries = arteries.filter(a => a.risk > 50).map(a => a.id);

  const fetchRecommendations = async (forceRegenerate = false) => {
    if (highRiskArteries.length === 0) return;
    
    setIsLoading(true);
    setError("");

    try {
      if (!forceRegenerate) {
        const cached = sessionStorage.getItem("maintenance_recs");
        if (cached) {
          setRecommendations(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arteries: highRiskArteries })
      });

      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      
      setRecommendations(data.recommendations);
      sessionStorage.setItem("maintenance_recs", JSON.stringify(data.recommendations));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(highRiskArteries)]);

  if (highRiskArteries.length === 0) return null;

  return (
    <div className="mt-6 border border-[var(--color-border-subtle)] rounded shadow-[var(--shadow-weightless)] bg-[var(--color-surface-a)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-[var(--color-text-main)]">
          <AlertCircle size={18} className="text-[var(--color-accent-indigo)]" />
          Predictive Maintenance Actions
        </h3>
        <button
          onClick={() => fetchRecommendations(true)}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin text-[var(--color-accent-indigo)]" /> : <RefreshCw size={14} />}
          REGENERATE
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 bg-[var(--color-canvas)]">
        {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
        
        {highRiskArteries.map(id => {
          const risk = arteries.find(a => a.id === id)?.risk || 0;
          const urgency = risk > 80 ? "URGENT" : risk > 50 ? "SOON" : "MONITOR";
          const urgencyClass = risk > 80 ? "bg-red-500/10 text-red-500 border border-red-500/30" : "bg-orange-500/10 text-orange-500 border border-orange-500/30";
          const Icon = risk > 80 ? AlertTriangle : AlertCircle;

          return (
            <div key={id} className="flex flex-col md:flex-row gap-4 p-4 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-surface-a)] shadow-[var(--shadow-weightless)] relative overflow-hidden">
              <div className="flex flex-col w-32 shrink-0">
                <div className="font-bold text-[var(--color-text-main)] mb-1">{id}</div>
                <div className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-max", urgencyClass)}>
                  <Icon size={10} />
                  {urgency} ({risk}%)
                </div>
              </div>
              
              <div className="flex-1 text-sm text-[var(--color-text-main)] border-l border-[var(--color-border-subtle)] pl-4 flex items-center">
                {isLoading && (!recommendations || !recommendations[id]) ? (
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)] italic">
                    <Loader2 size={14} className="animate-spin" /> Analyzing telemetry...
                  </div>
                ) : (
                  recommendations && recommendations[id] ? recommendations[id] : <span className="text-[var(--color-text-muted)]">No recommendation generated.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
