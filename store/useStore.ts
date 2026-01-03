import { create } from 'zustand';
import { Log, Profile } from '@/types';

interface AppState {
    logs: Log[];
    profile: Profile | null;
    setLogs: (logs: Log[]) => void;
    addLog: (log: Log) => void;
    removeLog: (id: string) => void;
    setProfile: (profile: Profile) => void;
}

export const useStore = create<AppState>((set) => ({
    logs: [],
    profile: null,
    setLogs: (logs) => set({ logs }),
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
    removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
    setProfile: (profile) => set({ profile }),
}));
