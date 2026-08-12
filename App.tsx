import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/store/useThemeStore';
import { useAuthStore } from './src/store/useAuthStore';

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("REAL ERROR CAUGHT:", error); }
  render() { if (this.state.hasError) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>{String(this.state.error)}</Text></View>; return this.props.children; }
}

export default function App() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { session, isTemporarySession, isInitialized } = useAuthStore();

  const isAuthenticated = session !== null || isTemporarySession;

  return (
    <NavigationContainer>
      {(!isInitialized || !isAuthenticated) ? (
        <AuthNavigator />
      ) : (
        <ErrorBoundary>
          <BottomTabNavigator />
        </ErrorBoundary>
      )}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}
