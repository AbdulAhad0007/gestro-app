import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { WindowsListScreen } from '../screens/WindowsListScreen';
import { ClipboardScreen } from '../screens/ClipboardScreen';
import { MicScreen } from '../screens/MicScreen';
import { CameraScreen } from '../screens/CameraScreen';

const Stack = createNativeStackNavigator();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} />
      <Stack.Screen name="WindowsList" component={WindowsListScreen} />
      <Stack.Screen name="ClipboardSync" component={ClipboardScreen} />
      <Stack.Screen name="Microphone" component={MicScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
}
