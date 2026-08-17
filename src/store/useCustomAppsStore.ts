import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomApp {
  id: string;
  name: string;
  path: string;
  type: string;
  deviceId?: string; // Optional: associate with specific PC if needed
  createdAt: number;
}

interface CustomAppsState {
  customApps: CustomApp[];
  isMyAppsExpanded: boolean;
  addCustomApp: (app: Omit<CustomApp, 'id' | 'createdAt'>) => void;
  removeCustomApp: (id: string) => void;
  updateCustomApp: (id: string, updates: Partial<CustomApp>) => void;
  toggleMyAppsExpanded: () => void;
}

export const useCustomAppsStore = create<CustomAppsState>()(
  persist(
    (set) => ({
      customApps: [],
      isMyAppsExpanded: true,

      addCustomApp: (app) => set((state) => ({
        customApps: [
          ...state.customApps,
          {
            ...app,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            createdAt: Date.now(),
          }
        ]
      })),

      removeCustomApp: (id) => set((state) => ({
        customApps: state.customApps.filter((app) => app.id !== id)
      })),

      updateCustomApp: (id, updates) => set((state) => ({
        customApps: state.customApps.map((app) => 
          app.id === id ? { ...app, ...updates } : app
        )
      })),

      toggleMyAppsExpanded: () => set((state) => ({
        isMyAppsExpanded: !state.isMyAppsExpanded
      })),
    }),
    {
      name: 'gestro-custom-apps-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
