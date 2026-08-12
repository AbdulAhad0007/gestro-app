import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: () => boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      isDarkMode: () => {
        const { themeMode } = get();
        if (themeMode === 'system') {
          return Appearance.getColorScheme() === 'dark';
        }
        return themeMode === 'dark';
      },
    }),
    {
      name: 'gestro-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
