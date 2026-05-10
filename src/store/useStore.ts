import { create } from 'zustand';

export type JunctionStatus = 'optimal' | 'warning' | 'emergency';

export interface SystemLog {
  id: string;
  timestamp: string;
  severity: "INFO" | "WARN" | "CRIT";
  message: string;
}

export interface Junction {
  id: string;
  name: string;
  status: JunctionStatus;
  density: number; // 0.0 to 1.0
  lat: number;
  lng: number;
  throughput: number;
  waitTime: number;
  load: number;
  latency: string;
  lastEvent: string;
  predictedRisk: string;
  loadHistory: number[];
  rerouteSuggestion?: {
    toNodeId: string;
    reason: string;
  };
}

interface AppState {
  greenSweepActive: boolean;
  setGreenSweepActive: (active: boolean) => void;
  greenWaveActive: boolean;
  setGreenWaveActive: (active: boolean) => void;
  junctions: Junction[];
  activeJunctionId: string | null;
  setActiveJunctionId: (id: string | null) => void;
  updateJunction: (id: string, updates: Partial<Junction>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  relocateJunctions: (baseLat: number, baseLng: number) => void;
  logs: SystemLog[];
  addLog: (log: SystemLog) => void;
  executeReroute: (fromId: string, toId: string) => void;
  alertThresholds: {
    loadSpike: number;
    latency: number;
    density: number;
  };
  updateThresholds: (thresholds: Partial<AppState['alertThresholds']>) => void;
  cityZone: string;
  setCityZone: (zone: string) => void;
}

export const useStore = create<AppState>((set) => ({
  greenSweepActive: false,
  setGreenSweepActive: (active) => set({ greenSweepActive: active }),
  greenWaveActive: false,
  setGreenWaveActive: (active) => set((state) => ({ 
    greenWaveActive: active,
    junctions: state.junctions.map(j => ({
      ...j,
      waitTime: active ? Math.max(2, Math.round(j.waitTime * 0.2)) : j.waitTime
    }))
  })),
  junctions: [
    // Simulating Manhattan junction coordinates for the mock with full Node structure
    { id: 'J1', name: 'Alpha Intersect', status: 'optimal', density: 0.3, lat: 40.7128, lng: -74.0060, throughput: 1200, waitTime: 14, load: 30, latency: '45ms', lastEvent: 'Normal traffic flow', predictedRisk: '12%', loadHistory: [25,28,30,29,31,30,32,30,29,31,30,30] },
    { id: 'J2', name: 'Beta Coronal', status: 'warning', density: 0.7, lat: 40.7200, lng: -73.9900, throughput: 3400, waitTime: 45, load: 72, latency: '120ms', lastEvent: 'Load spike detected', predictedRisk: '65%', loadHistory: [45,48,52,55,61,65,68,70,71,72,72,72] },
    { id: 'J3', name: 'Gamma Node', status: 'emergency', density: 0.95, lat: 40.7100, lng: -74.0150, throughput: 450, waitTime: 120, load: 95, latency: '350ms', lastEvent: 'Density overflow', predictedRisk: '92%', loadHistory: [70,75,80,85,88,90,92,94,95,95,95,95] },
    { id: 'J4', name: 'Delta Matrix', status: 'optimal', density: 0.1, lat: 40.7250, lng: -74.0000, throughput: 800, waitTime: 5, load: 10, latency: '20ms', lastEvent: 'System nominal', predictedRisk: '5%', loadHistory: [15,14,12,10,11,10,9,10,11,10,10,10] },
  ],
  activeJunctionId: null,
  setActiveJunctionId: (id) => set({ activeJunctionId: id }),
  updateJunction: (id, updates) => set((state) => ({
    junctions: state.junctions.map(j => j.id === id ? { ...j, ...updates } : j)
  })),
  activeTab: 'pulse-map',
  setActiveTab: (tab) => set({ activeTab: tab }),
  relocateJunctions: (baseLat, baseLng) => set((state) => {
    const offsets = [
      { dLat: 0.002, dLng: -0.005 },
      { dLat: 0.008, dLng: 0.009 },
      { dLat: -0.003, dLng: -0.012 },
      { dLat: 0.012, dLng: -0.004 },
    ];
    return {
      junctions: state.junctions.map((j, i) => ({
        ...j,
        lat: baseLat + (offsets[i] ? offsets[i].dLat : 0),
        lng: baseLng + (offsets[i] ? offsets[i].dLng : 0),
      }))
    };
  }),
  logs: [],
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 500) })),
  executeReroute: (fromId, toId) => set((state) => {
    const fromNode = state.junctions.find(j => j.id === fromId);
    if (!fromNode) return state;
    
    // Simulate reroute by shifting 30% of density from 'from' to 'to'
    const shiftAmount = fromNode.density * 0.3;
    
    return {
      junctions: state.junctions.map(j => {
        if (j.id === fromId) {
          const newDensity = Math.max(0.1, j.density - shiftAmount);
          return { 
            ...j, 
            density: newDensity, 
            load: Math.round(newDensity * 100),
            status: 'optimal' as const, // Force recovery
            rerouteSuggestion: undefined 
          };
        }
        if (j.id === toId) {
          const newDensity = Math.min(1.0, j.density + shiftAmount);
          return { 
            ...j, 
            density: newDensity, 
            load: Math.round(newDensity * 100) 
          };
        }
        return j;
      })
    };
  }),
  alertThresholds: {
    loadSpike: 20,
    latency: 200,
    density: 0.9,
  },
  updateThresholds: (thresholds) => set((state) => ({
    alertThresholds: { ...state.alertThresholds, ...thresholds }
  })),
  cityZone: 'Manhattan',
  setCityZone: (zone) => set((state) => {
    let baseLat = 40.7128;
    let baseLng = -74.0060;
    
    if (zone === 'Sector 4') {
      baseLat = 40.7580; baseLng = -73.9855;
    } else if (zone === 'Industrial') {
      baseLat = 40.7831; baseLng = -73.9712;
    }
    
    // Auto-relocate junctions when zone changes
    const offsets = [
      { dLat: 0.002, dLng: -0.005 },
      { dLat: 0.008, dLng: 0.009 },
      { dLat: -0.003, dLng: -0.012 },
      { dLat: 0.012, dLng: -0.004 },
    ];
    
    return {
      cityZone: zone,
      junctions: state.junctions.map((j, i) => ({
        ...j,
        lat: baseLat + (offsets[i] ? offsets[i].dLat : 0),
        lng: baseLng + (offsets[i] ? offsets[i].dLng : 0),
      }))
    };
  })
}));
