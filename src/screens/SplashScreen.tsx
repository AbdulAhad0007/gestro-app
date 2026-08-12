import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function SplashScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    const checkSession = async () => {
      // Small delay for premium feel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      await restoreSession();
      
      const { session } = useAuthStore.getState();
      
      if (!session) {
        navigation.replace('Login');
      }
    };
    
    checkSession();
  }, []);

  return (
    <View className={`flex-1 items-center justify-center ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <Image 
        source={require('../../assets/icon.png')} 
        style={{ width: 120, height: 120, marginBottom: 20 }}
        resizeMode="contain"
      />
      <ActivityIndicator color="#00C278" />
    </View>
  );
}
