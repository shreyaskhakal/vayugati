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
  density: number;
  lat: number;
  lng: number;
  throughput: number;
  waitTime: number;
  load: number;
  latency: string;
  lastEvent: string;
  predictedRisk: string;
  loadHistory: number[];
  rerouteSuggestion?: { toNodeId: string; reason: string };
}

export interface CityZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pulse: 'STABLE' | 'WARNING' | 'CRITICAL';
  junctions: Junction[];
}

const PUNE_ZONES: CityZone[] = [
  {
    id: 'central-pune',
    name: 'Central Pune',
    lat: 18.5204,
    lng: 73.8567,
    pulse: 'WARNING',
    junctions: [
      { id: 'J1', name: 'Shivajinagar Signal', status: 'optimal', density: 0.3, lat: 18.5304, lng: 73.8467, throughput: 1200, waitTime: 14, load: 30, latency: '45ms', lastEvent: 'Normal traffic flow', predictedRisk: '12%', loadHistory: [25,28,30,29,31,30,32,30,29,31,30,30] },
      { id: 'J2', name: 'FC Road Junction', status: 'warning', density: 0.7, lat: 18.5204, lng: 73.8567, throughput: 3400, waitTime: 45, load: 72, latency: '120ms', lastEvent: 'Load spike detected', predictedRisk: '65%', loadHistory: [45,48,52,55,61,65,68,70,71,72,72,72] },
      { id: 'J3', name: 'Deccan Intersection', status: 'emergency', density: 0.95, lat: 18.5100, lng: 73.8450, throughput: 450, waitTime: 120, load: 95, latency: '350ms', lastEvent: 'Density overflow', predictedRisk: '92%', loadHistory: [70,75,80,85,88,90,92,94,95,95,95,95] },
      { id: 'J4', name: 'Pune Station Gate', status: 'optimal', density: 0.1, lat: 18.5280, lng: 73.8740, throughput: 800, waitTime: 5, load: 10, latency: '20ms', lastEvent: 'System nominal', predictedRisk: '5%', loadHistory: [15,14,12,10,11,10,9,10,11,10,10,10] },
    ]
  },
  {
    id: 'pimpri-chinchwad',
    name: 'Pimpri-Chinchwad',
    lat: 18.6298,
    lng: 73.7997,
    pulse: 'STABLE',
    junctions: [
      { id: 'PC1', name: 'Pimpri Chowk', status: 'optimal', density: 0.25, lat: 18.6298, lng: 73.7997, throughput: 2100, waitTime: 10, load: 25, latency: '30ms', lastEvent: 'Nominal flow', predictedRisk: '8%', loadHistory: [20,22,24,25,24,23,25,26,25,24,25,25] },
      { id: 'PC2', name: 'Chinchwad Station', status: 'optimal', density: 0.4, lat: 18.6398, lng: 73.8097, throughput: 1800, waitTime: 22, load: 40, latency: '55ms', lastEvent: 'Light congestion', predictedRisk: '22%', loadHistory: [35,36,38,40,39,41,40,42,41,40,40,40] },
      { id: 'PC3', name: 'PCMC HQ Signal', status: 'warning', density: 0.65, lat: 18.6198, lng: 73.7897, throughput: 2900, waitTime: 38, load: 65, latency: '98ms', lastEvent: 'Load rising', predictedRisk: '58%', loadHistory: [40,45,50,55,58,60,62,64,65,65,65,65] },
      { id: 'PC4', name: 'Akurdi Junction', status: 'optimal', density: 0.2, lat: 18.6498, lng: 73.7797, throughput: 900, waitTime: 8, load: 20, latency: '25ms', lastEvent: 'Clear', predictedRisk: '4%', loadHistory: [18,19,20,20,21,20,19,20,21,20,20,20] },
    ]
  },
  {
    id: 'hinjewadi',
    name: 'Hinjewadi Tech Park',
    lat: 18.5912,
    lng: 73.7380,
    pulse: 'CRITICAL',
    junctions: [
      { id: 'HW1', name: 'Phase 1 Gate', status: 'emergency', density: 0.98, lat: 18.5912, lng: 73.7380, throughput: 200, waitTime: 180, load: 98, latency: '420ms', lastEvent: 'Severe congestion', predictedRisk: '95%', loadHistory: [60,70,78,85,88,92,94,96,97,98,98,98] },
      { id: 'HW2', name: 'Phase 2 Entry', status: 'warning', density: 0.75, lat: 18.5812, lng: 73.7480, throughput: 1100, waitTime: 65, load: 75, latency: '180ms', lastEvent: 'Heavy load', predictedRisk: '70%', loadHistory: [50,55,60,65,68,70,72,74,75,75,75,75] },
      { id: 'HW3', name: 'Rajiv Gandhi IT Park', status: 'warning', density: 0.68, lat: 18.6012, lng: 73.7280, throughput: 1400, waitTime: 50, load: 68, latency: '145ms', lastEvent: 'IT rush hour', predictedRisk: '62%', loadHistory: [40,48,55,60,63,65,67,68,68,68,68,68] },
      { id: 'HW4', name: 'Wakad Bridge', status: 'optimal', density: 0.35, lat: 18.5712, lng: 73.7580, throughput: 1600, waitTime: 18, load: 35, latency: '48ms', lastEvent: 'Normal', predictedRisk: '18%', loadHistory: [30,32,33,35,34,35,36,35,34,35,35,35] },
    ]
  },
  {
    id: 'kothrud',
    name: 'Kothrud Sector',
    lat: 18.5074,
    lng: 73.8077,
    pulse: 'STABLE',
    junctions: [
      { id: 'KT1', name: 'Karve Road Signal', status: 'optimal', density: 0.28, lat: 18.5074, lng: 73.8077, throughput: 1500, waitTime: 12, load: 28, latency: '38ms', lastEvent: 'Smooth flow', predictedRisk: '10%', loadHistory: [22,24,26,28,27,28,29,28,27,28,28,28] },
      { id: 'KT2', name: 'Chandani Chowk', status: 'optimal', density: 0.45, lat: 18.4974, lng: 73.7977, throughput: 2000, waitTime: 25, load: 45, latency: '65ms', lastEvent: 'Moderate traffic', predictedRisk: '28%', loadHistory: [38,40,42,44,45,44,45,46,45,45,45,45] },
      { id: 'KT3', name: 'Vanaz Junction', status: 'warning', density: 0.6, lat: 18.5174, lng: 73.8177, throughput: 2600, waitTime: 40, load: 60, latency: '105ms', lastEvent: 'Congestion detected', predictedRisk: '52%', loadHistory: [42,46,50,54,56,58,59,60,60,60,60,60] },
      { id: 'KT4', name: 'MIT College Gate', status: 'optimal', density: 0.15, lat: 18.4874, lng: 73.8277, throughput: 700, waitTime: 6, load: 15, latency: '22ms', lastEvent: 'Clear', predictedRisk: '3%', loadHistory: [12,13,14,15,14,15,16,15,14,15,15,15] },
    ]
  },
];

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
  logs: SystemLog[];
  addLog: (log: SystemLog) => void;
  executeReroute: (fromId: string, toId: string) => void;
  alertThresholds: { loadSpike: number; latency: number; density: number; riskNotify: number };
  updateThresholds: (thresholds: Partial<AppState['alertThresholds']>) => void;
  cityZone: string;
  setCityZone: (zone: string) => void;
  availableZones: CityZone[];
  relocateJunctions: (baseLat: number, baseLng: number) => void;
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
  junctions: PUNE_ZONES[0].junctions,
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
        lat: baseLat + (offsets[i]?.dLat ?? 0),
        lng: baseLng + (offsets[i]?.dLng ?? 0),
      }))
    };
  }),
  logs: [],
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 500) })),
  executeReroute: (fromId, toId) => set((state) => {
    const fromNode = state.junctions.find(j => j.id === fromId);
    if (!fromNode) return state;
    const shiftAmount = fromNode.density * 0.3;
    return {
      junctions: state.junctions.map(j => {
        if (j.id === fromId) {
          const newDensity = Math.max(0.1, j.density - shiftAmount);
          return { ...j, density: newDensity, load: Math.round(newDensity * 100), status: 'optimal' as const, rerouteSuggestion: undefined };
        }
        if (j.id === toId) {
          const newDensity = Math.min(1.0, j.density + shiftAmount);
          return { ...j, density: newDensity, load: Math.round(newDensity * 100) };
        }
        return j;
      })
    };
  }),
  alertThresholds: { loadSpike: 20, latency: 200, density: 0.9, riskNotify: 60 },
  updateThresholds: (thresholds) => set((state) => ({
    alertThresholds: { ...state.alertThresholds, ...thresholds }
  })),
  availableZones: PUNE_ZONES,
  cityZone: 'central-pune',
  setCityZone: (zoneId) => set((state) => {
    const zone = PUNE_ZONES.find(z => z.id === zoneId);
    if (!zone) return state;
    return {
      cityZone: zoneId,
      activeJunctionId: null,
      junctions: zone.junctions,
    };
  }),
}));
