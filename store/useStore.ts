import { create } from 'zustand';
import { Log, Profile, ActivityLog } from '@/types';

interface AppState {
    logs: Log[];
    profile: Profile | null;
    activityLogs: ActivityLog[];
    isLoading: boolean;
    error: string | null;
    setLogs: (logs: Log[]) => void;
    addLog: (log: Log) => void;
    removeLog: (id: string) => void;
    setActivityLogs: (logs: ActivityLog[]) => void;
    addActivityLog: (log: ActivityLog) => void;
    removeActivityLog: (id: string) => void;
    setProfile: (profile: Profile) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
    logs: [],
    activityLogs: [],
    profile: null,
    isLoading: true,
    error: null,
    setLogs: (logs) => set({ logs }),
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
    removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
    setActivityLogs: (activityLogs) => set({ activityLogs }),
    addActivityLog: (log) => set((state) => ({ activityLogs: [log, ...state.activityLogs] })),
    removeActivityLog: (id) => set((state) => ({ activityLogs: state.activityLogs.filter((l) => l.id !== id) })),
    setProfile: (profile) => set({ profile }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
