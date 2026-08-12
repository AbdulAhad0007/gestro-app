import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => Promise<void>;
  setProfile: (profile: any | null) => void;
  setInitialized: (initialized: boolean) => void;
  isTemporarySession: boolean;
  setTemporarySession: (isTemp: boolean) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  isTemporarySession: false,
  setSession: async (session) => {
    set({ session, user: session?.user || null });
    const { setCustomJwt } = require('../services/supabase');
    if (session) {
      setCustomJwt(session.access_token);
      await AsyncStorage.setItem('gestro_session', JSON.stringify(session));
    } else {
      setCustomJwt(null);
      await AsyncStorage.removeItem('gestro_session');
    }
  },
  setProfile: (profile) => set({ profile }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setTemporarySession: (isTemp) => set({ isTemporarySession: isTemp }),
  restoreSession: async () => {
    try {
      const storedSessionStr = await AsyncStorage.getItem('gestro_session');
      if (storedSessionStr) {
        const session = JSON.parse(storedSessionStr);
        set({ session, user: session.user });
        const { setCustomJwt } = require('../services/supabase');
        setCustomJwt(session.access_token);
        
        // Fetch the corresponding profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          set({ profile, isTemporarySession: false });
        }
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
    } finally {
      set({ isInitialized: true });
    }
  }
}));
