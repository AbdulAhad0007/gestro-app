import React from 'react';
import { View, Text } from 'react-native';
import { GestroCard } from './GestroCard';
import { useThemeStore } from '../store/useThemeStore';

interface GestroMetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function GestroMetricCard({ title, value, icon, trend, className = '' }: GestroMetricCardProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  
  return (
    <GestroCard className={`flex-1 ${className}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-sm font-medium ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          {title}
        </Text>
        {icon && (
          <View className={`p-1.5 rounded-full ${isDark ? 'bg-dark-surfaceSecondary' : 'bg-light-surfaceSecondary'}`}>
            {icon}
          </View>
        )}
      </View>
      <Text className={`text-2xl font-bold ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
        {value}
      </Text>
      
      {trend && (
        <View className="flex-row items-center mt-2">
          <Text className={`text-xs font-medium ${trend.isPositive ? 'text-gestro-green' : 'text-red-500'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </Text>
          <Text className={`text-xs ml-1 ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
            vs last week
          </Text>
        </View>
      )}
    </GestroCard>
  );
}
