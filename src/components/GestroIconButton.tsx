import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

interface GestroIconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function GestroIconButton({
  icon,
  variant = 'secondary',
  className = '',
  disabled,
  ...props
}: GestroIconButtonProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());

  let bgClass = '';
  switch (variant) {
    case 'primary':
      bgClass = 'bg-gestro-green';
      break;
    case 'secondary':
      bgClass = isDark ? 'bg-dark-surfaceSecondary' : 'bg-light-surfaceSecondary';
      break;
    case 'ghost':
      bgClass = 'bg-transparent';
      break;
  }

  const disabledClass = disabled ? 'opacity-50' : 'active:opacity-80';

  return (
    <TouchableOpacity
      className={`p-3 rounded-full items-center justify-center ${bgClass} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}
