import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

interface GestroCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat';
}

export function GestroCard({ children, className = '', variant = 'elevated', ...props }: GestroCardProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());

  // In Android, true neumorphism is hard with standard styles, 
  // so we use a subtle border and background color that matches the theme
  const baseClasses = isDark
    ? 'bg-dark-surface border border-dark-border'
    : 'bg-light-surface border border-light-border';

  const elevationClasses = variant === 'elevated' ? 'shadow-sm' : '';

  return (
    <View
      className={`rounded-2xl p-4 ${baseClasses} ${elevationClasses} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
