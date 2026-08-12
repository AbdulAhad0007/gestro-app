import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/useThemeStore';

interface GradientButtonProps extends TouchableOpacityProps {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function GradientButton({
  label,
  subtitle,
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const disabledClass = disabled || isLoading ? 'opacity-50' : 'active:opacity-80';

  return (
    <TouchableOpacity
      className={`rounded-2xl overflow-hidden shadow-lg shadow-gestro-green/20 ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <LinearGradient
        colors={['#00C278', '#009B5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="flex-row items-center justify-between py-4 px-6"
      >
        <View className="flex-row items-center flex-1">
          {icon && (
            <View className="mr-4 bg-white/20 p-2 rounded-xl">
              {icon}
            </View>
          )}
          <View>
            <Text className="text-zinc-900 font-bold text-lg">{label}</Text>
            {subtitle && (
              <Text className="text-zinc-900/80 font-medium text-xs mt-0.5">{subtitle}</Text>
            )}
          </View>
        </View>
        
        {isLoading && (
          <ActivityIndicator color="#121212" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
