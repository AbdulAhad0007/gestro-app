import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { GradientButton } from '../components/GradientButton';
import { GlassButton } from '../components/GlassButton';
import { ScanFace, UserPlus, Zap, Shield, Hand, Mic } from 'lucide-react-native';

export function LoginScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const setTemporarySession = useAuthStore((state) => state.setTemporarySession);

  const bgColor = isDark ? 'bg-dark-background' : 'bg-light-background';
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const textMuted = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const iconColor = isDark ? '#FFFFFF' : '#121212';
  const greenColor = '#00C278'; // gestro-green

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <View className="flex-1 px-6 pt-12 pb-6 justify-between max-w-md mx-auto w-full self-center">
        
        {/* Top Section */}
        <View className="items-center mt-10">
          <Image 
            source={require('../../assets/icon.png')} 
            className="w-24 h-24 mb-6" 
            resizeMode="contain"
          />
          <Text className={`text-3xl font-bold mb-2 text-center ${textColor}`}>
            Welcome to <Text className="text-gestro-green">Gestro</Text>
          </Text>
          <Text className={`text-center text-sm px-6 ${textMuted}`}>
            Control your world with just your gestures and voice.
          </Text>
        </View>

        {/* Features Row */}
        <View className="flex-row justify-between px-2 mt-8 mb-12">
          <View className="items-center flex-1">
            <View className="bg-gestro-green/10 p-3 rounded-full mb-3">
              <Hand size={24} color={greenColor} />
            </View>
            <Text className={`font-medium text-xs mb-1 ${textColor}`}>Gesture Control</Text>
            <Text className={`text-[10px] text-center ${textMuted}`}>Natural & intuitive</Text>
          </View>
          <View className="items-center flex-1">
            <View className="bg-gestro-green/10 p-3 rounded-full mb-3">
              <Mic size={24} color={greenColor} />
            </View>
            <Text className={`font-medium text-xs mb-1 ${textColor}`}>Voice Commands</Text>
            <Text className={`text-[10px] text-center ${textMuted}`}>Smart & powerful</Text>
          </View>
          <View className="items-center flex-1">
            <View className="bg-gestro-green/10 p-3 rounded-full mb-3">
              <Shield size={24} color={greenColor} />
            </View>
            <Text className={`font-medium text-xs mb-1 ${textColor}`}>Secure & Private</Text>
            <Text className={`text-[10px] text-center ${textMuted}`}>Your data, protected</Text>
          </View>
        </View>
        
        {/* Main Buttons */}
        <View className="w-full space-y-4 mb-8">
          <GradientButton 
            label="Face Login"
            subtitle="Quick and secure access"
            icon={<ScanFace size={24} color="#121212" />}
            onPress={() => navigation.navigate('FaceLogin')} 
            className="mb-4"
          />
          
          <GlassButton 
            label="Create Profile"
            subtitle="Setup your account"
            icon={<UserPlus size={24} color={iconColor} opacity={0.8} />}
            borderType="green"
            onPress={() => navigation.navigate('CreateProfile')} 
            className="mb-4"
          />
          
          <GlassButton 
            label="Continue Temporarily"
            subtitle="Use Gestro without signup"
            icon={<Zap size={24} color={iconColor} opacity={0.8} />}
            onPress={() => setTemporarySession(true)} 
          />
        </View>

        {/* Bottom Text */}
        <View className="flex-row items-center justify-center mt-auto">
          <Shield size={14} color={greenColor} className="mr-2" />
          <Text className={`text-xs ml-1 ${textMuted}`}>
            Your data is encrypted and secure
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
