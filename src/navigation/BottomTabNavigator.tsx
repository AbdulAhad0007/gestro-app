import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Monitor, MousePointer2, Keyboard as KeyboardIcon, Menu, AppWindow } from 'lucide-react-native';
import { ControlPCScreen } from '../screens/ControlPCScreen';
import { MouseScreen } from '../screens/MouseScreen';
import { KeyboardScreen } from '../screens/KeyboardScreen';
import { MoreStackNavigator } from './MoreStackNavigator';
import { ApplicationsScreen } from '../screens/ApplicationsScreen';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  const isDark = useThemeStore((state) => state.isDarkMode());

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
          borderTopColor: isDark ? colors.dark.border : colors.light.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gestroGreen,
        tabBarInactiveTintColor: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Control PC" 
        component={ControlPCScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Monitor color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Mouse" 
        component={MouseScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MousePointer2 color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Keys" 
        component={KeyboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <KeyboardIcon color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Apps" 
        component={ApplicationsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <AppWindow color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreStackNavigator} 
        options={{
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
