import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let customJwt: string | null = null;
export const setCustomJwt = (token: string | null) => {
  customJwt = token;
};

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  if (customJwt && options) {
    // Convert Headers object to plain object if needed
    let existingHeaders: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          existingHeaders[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          existingHeaders[key] = value;
        });
      } else {
        existingHeaders = { ...(options.headers as Record<string, string>) };
      }
    }
    existingHeaders['Authorization'] = `Bearer ${customJwt}`;
    options.headers = existingHeaders;
  }
  return fetch(url, options);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch
  }
});
