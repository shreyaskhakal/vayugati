import { create } from 'zustand';

export type JunctionStatus = 'optimal' | 'warning' | 'emergency';

export interface Junction {
  id: string;
  name: string;
  status: JunctionStatus;
  density: number; // 0.0 to 1.0
  lat: number;
  lng: number;
  throughput: number;
  waitTime: number;
}

interface AppState {
  greenSweepActive: boolean;
  setGreenSweepActive: (active: boolean) => void;
  junctions: Junction[];
  activeJunctionId: string | null;
  setActiveJunctionId: (id: string | null) => void;
  updateJunction: (id: string, updates: Partial<Junction>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useStore = create<AppState>((set) => ({
  greenSweepActive: false,
  setGreenSweepActive: (active) => set({ greenSweepActive: active }),
  junctions: [
    // Simulating Manhattan junction coordinates for the mock
    { id: 'J1', name: 'Alpha Intersect', status: 'optimal', density: 0.3, lat: 40.7128, lng: -74.0060, throughput: 1200, waitTime: 14 },
    { id: 'J2', name: 'Beta Coronal', status: 'warning', density: 0.7, lat: 40.7200, lng: -73.9900, throughput: 3400, waitTime: 45 },
    { id: 'J3', name: 'Gamma Node', status: 'emergency', density: 0.95, lat: 40.7100, lng: -74.0150, throughput: 450, waitTime: 120 },
    { id: 'J4', name: 'Delta Matrix', status: 'optimal', density: 0.1, lat: 40.7250, lng: -74.0000, throughput: 800, waitTime: 5 },
  ],
  activeJunctionId: null,
  setActiveJunctionId: (id) => set({ activeJunctionId: id }),
  updateJunction: (id, updates) => set((state) => ({
    junctions: state.junctions.map(j => j.id === id ? { ...j, ...updates } : j)
  })),
  activeTab: 'pulse-map',
  setActiveTab: (tab) => set({ activeTab: tab })
}));
