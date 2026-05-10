import { useEffect } from "react";
import { useStore } from "@/store/useStore";

/**
 * useLiveTelemetry
 * Simulates real-time sensor data by subtly fluctuating junction metrics
 * every few seconds — making the dashboard feel "alive" without real data.
 */
export function useLiveTelemetry() {
  const { junctions, updateJunction, addLog } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      junctions.forEach((j) => {
        // Small random drift on density (+/- up to 3%)
        const drift = (Math.random() - 0.5) * 0.06;
        const newDensity = Math.max(0.05, Math.min(1.0, j.density + drift));
        const newLoad = Math.round(newDensity * 100);

        // Recalculate throughput inversely with density
        const newThroughput = Math.round(
          Math.max(100, j.throughput + (Math.random() - 0.5) * 200)
        );

        // Latency fluctuates
        const baseLatency = parseInt(j.latency.replace("ms", "")) || 50;
        const newLatency = Math.max(
          10,
          Math.round(baseLatency + (Math.random() - 0.5) * 30)
        );

        // Wait time correlates with density
        const newWaitTime = Math.max(2, Math.round(newDensity * 130 + Math.random() * 10));

        // Update loadHistory (rolling window)
        const newHistory = [...(j.loadHistory || []), newLoad].slice(-12);

        // Only emit logs for significant changes (not every tick)
        const densityDelta = Math.abs(newDensity - j.density);
        if (densityDelta > 0.04 && j.status !== "emergency") {
          addLog({
            id: `${Date.now()}-${j.id}`,
            timestamp: new Date().toISOString().substring(11, 19) + " UTC",
            severity: newLoad > 80 ? "WARN" : "INFO",
            message:
              newLoad > 80
                ? `Node ${j.id} density spike — load at ${newLoad}%`
                : `Node ${j.id} density shift: ${Math.round(j.density * 100)}% → ${newLoad}%`,
          });
        }

        updateJunction(j.id, {
          density: newDensity,
          load: newLoad,
          throughput: newThroughput,
          latency: `${newLatency}ms`,
          waitTime: newWaitTime,
          loadHistory: newHistory,
        });
      });
    }, 3000); // update every 3 seconds

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junctions.length]);
}
