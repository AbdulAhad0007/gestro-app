import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';

interface GestroButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  className?: string;
  labelClassName?: string;
}

export function GestroButton({
  label,
  variant = 'primary',
  isLoading = false,
  className = '',
  labelClassName = '',
  disabled,
  ...props
}: GestroButtonProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());

  let bgClass = '';
  let textClass = '';
  let borderClass = '';

  switch (variant) {
    case 'primary':
      bgClass = 'bg-gestro-green';
      textClass = 'text-zinc-900 font-bold';
      break;
    case 'secondary':
      bgClass = isDark ? 'bg-dark-surfaceSecondary' : 'bg-light-surfaceSecondary';
      textClass = isDark ? 'text-dark-textPrimary font-semibold' : 'text-light-textPrimary font-semibold';
      break;
    case 'outline':
      bgClass = 'bg-transparent';
      borderClass = `border ${isDark ? 'border-dark-border' : 'border-light-border'}`;
      textClass = isDark ? 'text-dark-textPrimary font-semibold' : 'text-light-textPrimary font-semibold';
      break;
    case 'danger':
      bgClass = 'bg-red-500/10';
      borderClass = 'border border-red-500/50';
      textClass = 'text-red-500 font-semibold';
      break;
  }

  const disabledClass = disabled || isLoading ? 'opacity-50' : 'active:opacity-80';

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center rounded-xl py-3.5 px-6 ${bgClass} ${borderClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#121212' : (isDark ? '#FFFFFF' : '#121212')} />
      ) : (
        <Text className={`text-base ${textClass} ${labelClassName}`}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
