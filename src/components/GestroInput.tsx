import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { Eye, EyeOff } from 'lucide-react-native';

interface GestroInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
}

export function GestroInput({
  label,
  error,
  containerClassName = '',
  className = '',
  secureTextEntry,
  icon,
  ...props
}: GestroInputProps) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const bgClass = isDark ? 'bg-dark-surfaceSecondary' : 'bg-light-surfaceSecondary';
  const textClass = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const placeholderColor = isDark ? '#A0A0A0' : '#666666';
  const borderClass = error 
    ? 'border border-red-500' 
    : isDark ? 'border border-dark-border focus:border-gestro-green' : 'border border-light-border focus:border-gestro-greenDark';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          {label}
        </Text>
      )}
      <View className="relative w-full flex-row items-center">
        {icon && (
          <View className="absolute left-4 z-10 flex items-center justify-center">
            {icon}
          </View>
        )}
        <TextInput
          className={`flex-1 rounded-xl py-3.5 text-base ${bgClass} ${textClass} ${borderClass} ${icon ? 'pl-12' : 'px-4'} ${secureTextEntry ? 'pr-12' : 'pr-4'} ${className}`}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            className="absolute right-4 top-0 bottom-0 justify-center z-10"
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={placeholderColor} />
            ) : (
              <Eye size={20} color={placeholderColor} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="mt-1.5 text-sm text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
}
