import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MouseState {
  layoutPreference: number;
  setLayoutPreference: (layout: number) => void;
}

export const useMouseStore = create<MouseState>()(
  persist(
    (set) => ({
      layoutPreference: 1, // 1: Touchpad Top, 2: Buttons Top, 3: Side Buttons
      setLayoutPreference: (layout) => set({ layoutPreference: layout }),
    }),
    {
      name: 'gestro-mouse-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
