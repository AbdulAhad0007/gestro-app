import { create } from 'zustand';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApplicationMapping {
  id: string;
  app_name: string;
  process_name: string;
  is_enabled: boolean;
  user_id: string;
  created_at: string;
}

export interface GestureMapping {
  id: string;
  gesture_name: string;
  action_type: string;
  action_value: string;
  app_id: string | null;
  is_enabled: boolean;
  user_id: string;
}

interface MappingsState {
  applications: ApplicationMapping[];
  gestures: GestureMapping[];
  isLoading: boolean;
  error: string | null;

  fetchMappings: (userId: string) => Promise<void>;
  updateApplicationStatus: (appId: string, isEnabled: boolean) => Promise<void>;
  addApplication: (appName: string, processName: string, userId: string) => Promise<void>;
}

export const useMappingsStore = create<MappingsState>((set, get) => ({
  applications: [],
  gestures: [],
  isLoading: false,
  error: null,

  fetchMappings: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch from Supabase
      const [appsResponse, gesturesResponse] = await Promise.all([
        supabase.from('applications').select('*').eq('user_id', userId),
        supabase.from('gesture_mappings').select('*').eq('user_id', userId)
      ]);

      if (appsResponse.error) throw appsResponse.error;
      if (gesturesResponse.error) throw gesturesResponse.error;

      const applications = appsResponse.data as ApplicationMapping[];
      const gestures = gesturesResponse.data as GestureMapping[];

      // Cache locally
      await AsyncStorage.setItem(`@mappings_apps_${userId}`, JSON.stringify(applications));
      await AsyncStorage.setItem(`@mappings_gestures_${userId}`, JSON.stringify(gestures));

      set({ applications, gestures, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching mappings:', error.message);
      
      // Fallback to offline cache
      try {
        const cachedApps = await AsyncStorage.getItem(`@mappings_apps_${userId}`);
        const cachedGestures = await AsyncStorage.getItem(`@mappings_gestures_${userId}`);
        
        if (cachedApps && cachedGestures) {
          set({ 
            applications: JSON.parse(cachedApps), 
            gestures: JSON.parse(cachedGestures),
            isLoading: false,
            error: 'Loaded from offline cache.'
          });
        } else {
          set({ error: error.message, isLoading: false });
        }
      } catch (e) {
        set({ error: error.message, isLoading: false });
      }
    }
  },

  updateApplicationStatus: async (appId: string, isEnabled: boolean) => {
    try {
      const { applications } = get();
      const updatedApps = applications.map(app => 
        app.id === appId ? { ...app, is_enabled: isEnabled } : app
      );
      
      set({ applications: updatedApps });
      
      const { error } = await supabase
        .from('applications')
        .update({ is_enabled: isEnabled })
        .eq('id', appId);
        
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating application:', error.message);
      // Revert if error? We could re-fetch
    }
  },

  addApplication: async (appName: string, processName: string, userId: string) => {
    try {
      const newApp = {
        app_name: appName,
        process_name: processName,
        is_enabled: true,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('applications')
        .insert([newApp])
        .select()
        .single();

      if (error) throw error;

      const { applications } = get();
      set({ applications: [...applications, data as ApplicationMapping] });
      
    } catch (error: any) {
      console.error('Error adding application:', error.message);
      throw error;
    }
  }
}));
