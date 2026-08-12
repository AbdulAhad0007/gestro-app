import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronRight } from 'lucide-react-native';

interface GlassButtonProps extends TouchableOpacityProps {
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  borderType?: 'green' | 'subtle';
  showArrow?: boolean;
}

export function GlassButton({
  label,
  subtitle,
  icon,
  isLoading = false,
  className = '',
  borderType = 'subtle',
  showArrow = true,
  disabled,
  ...props
}: GlassButtonProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const disabledClass = disabled || isLoading ? 'opacity-50' : 'active:opacity-80';

  const borderColor = borderType === 'green' ? 'border-[#00C278]/30' : 'border-white/10';

  return (
    <TouchableOpacity
      className={`rounded-2xl flex-row items-center justify-between py-4 px-5 bg-white/5 border ${borderColor} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <View className="flex-row items-center flex-1">
        {icon && (
          <View className="mr-4">
            {icon}
          </View>
        )}
        <View>
          <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-zinc-900'}`}>{label}</Text>
          {subtitle && (
            <Text className={`font-normal text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-zinc-500'}`}>{subtitle}</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={isDark ? '#FFF' : '#121212'} />
      ) : showArrow ? (
        <ChevronRight size={20} color={isDark ? '#FFF' : '#121212'} opacity={0.5} />
      ) : null}
    </TouchableOpacity>
  );
}
