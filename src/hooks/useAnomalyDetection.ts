import { useEffect, useRef } from "react";
import { useStore, Junction } from "@/store/useStore";

// Helper to generate a unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useAnomalyDetection() {
  const { junctions, addLog, updateJunction, alertThresholds } = useStore();
  
  // Keep track of previous state to detect spikes and trends
  const prevJunctions = useRef<Record<string, Junction>>({});

  useEffect(() => {
    // Populate initial state without triggering anomalies
    if (Object.keys(prevJunctions.current).length === 0 && junctions.length > 0) {
      junctions.forEach(j => {
        prevJunctions.current[j.id] = j;
      });
      return;
    }

    const interval = setInterval(() => {
      junctions.forEach(junction => {
        const prev = prevJunctions.current[junction.id];
        if (!prev) return;

        let newStatus = junction.status;
        let eventMsg = "";
        let severity: "INFO" | "WARN" | "CRIT" | null = null;

        // a) Density overflow
        if (junction.density >= alertThresholds.density && prev.density < alertThresholds.density) {
          severity = "CRIT";
          eventMsg = `Node ${junction.id} OFFLINE — density overflow (${junction.density.toFixed(2)})`;
          newStatus = "emergency";
        }
        // b) Sudden load spike
        else if (junction.load - prev.load > alertThresholds.loadSpike) {
          severity = "WARN";
          eventMsg = `Sudden load spike detected at ${junction.id} (+${junction.load - prev.load}%)`;
          newStatus = "warning";
        }
        // c) Latency anomaly
        else {
          const currentLatency = parseInt(junction.latency.replace('ms', ''));
          const prevLatency = parseInt(prev.latency.replace('ms', ''));
          if (currentLatency > alertThresholds.latency && prevLatency <= alertThresholds.latency) {
            severity = "WARN";
            eventMsg = `High latency anomaly at ${junction.id} (${currentLatency}ms)`;
            newStatus = "warning";
          }
        }

        if (severity && eventMsg) {
          // 1. Add log entry
          addLog({
            id: generateId(),
            timestamp: new Date().toISOString().substring(11, 19) + " UTC",
            severity,
            message: eventMsg
          });

          // 2. Update junction status and last event
          updateJunction(junction.id, {
            status: newStatus,
            lastEvent: eventMsg
          });
        }
      });

      // Update refs for next interval
      junctions.forEach(j => {
        prevJunctions.current[j.id] = j;
      });

    }, 30000); // Run every 30 seconds

    return () => clearInterval(interval);
  }, [junctions, addLog, updateJunction]);
}
