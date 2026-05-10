import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function useReroutePlanner() {
  const { junctions, updateJunction } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      junctions.forEach(junction => {
        // Only suggest reroutes for Emergency nodes that don't have one yet
        if (junction.status === 'emergency' && !junction.rerouteSuggestion) {
          // Find the nearest "Optimal" junction to reroute traffic to
          const optimalNodes = junctions.filter(j => j.status === 'optimal' && j.id !== junction.id);
          
          if (optimalNodes.length > 0) {
            // Simple logic: pick the first optimal node for now (or could use distance)
            const target = optimalNodes[0];
            
            updateJunction(junction.id, {
              rerouteSuggestion: {
                toNodeId: target.id,
                reason: `Primary artery Node ${junction.id} saturated. Shifting load to Node ${target.id} via secondary route.`
              }
            });
          }
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [junctions, updateJunction]);
}
