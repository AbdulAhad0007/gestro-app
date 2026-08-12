import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommandLog {
  id: string;
  action: string;
  timestamp: number;
}

interface CommandHistoryState {
  history: CommandLog[];
  addCommand: (action: string) => void;
  clearHistory: () => void;
}

export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addCommand: (action: string) => {
        const newLog: CommandLog = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          action,
          timestamp: Date.now()
        };
        // Keep last 50 commands
        set({ history: [newLog, ...get().history].slice(0, 50) });
      },
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'gestro-command-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
