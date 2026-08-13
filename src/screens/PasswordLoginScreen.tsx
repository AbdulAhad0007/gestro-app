import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { GestroInput } from '../components/GestroInput';
import { GradientButton } from '../components/GradientButton';
import { GestroIconButton } from '../components/GestroIconButton';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function PasswordLoginScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const textMuted = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        
        // Also setup application state with profile data if available
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profile) {
          useAuthStore.getState().setTemporarySession(false);
          useAuthStore.getState().setProfile(profile);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className={`flex-1 px-6 pt-12 pb-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className="absolute top-12 left-4 z-10">
        <GestroIconButton 
          icon={<ArrowLeft color={isDark ? '#FFF' : '#000'} />} 
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
      </View>

      <View className="items-center mt-12 mb-8">
        <Image 
          source={require('../../assets/icon.png')} 
          className="w-20 h-20 mb-4" 
          resizeMode="contain"
        />
        <Text className={`text-2xl font-bold mb-2 text-center ${textColor}`}>
          Welcome Back to <Text className="text-gestro-green">Gestro</Text>
        </Text>
        <Text className={`text-center text-sm px-4 ${textMuted}`}>
          Log in with your email and password.
        </Text>
      </View>
      
      <View className="w-full flex-1">
        <GestroInput 
          label=""
          placeholder="Email Address"
          icon={<Mail color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          containerClassName="mb-4"
        />
        <GestroInput 
          label=""
          placeholder="Password"
          icon={<Lock color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          containerClassName="mb-6"
        />
        
        {error && <Text className="text-red-500 mb-4 text-center">{error}</Text>}
        
        <GradientButton 
          label="Login" 
          onPress={handleLogin} 
          isLoading={isLoading}
          className="w-full mt-auto"
        />

        <View className="flex-row justify-center mt-6">
          <Text className={textMuted}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateProfile')}>
            <Text className="text-gestro-green font-bold">Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
