import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestroShareScreen } from '../screens/GestroShareScreen';
import { TransferProgressScreen } from '../screens/TransferProgressScreen';

const Stack = createNativeStackNavigator();

export function ShareStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestroShare" component={GestroShareScreen} />
      <Stack.Screen name="TransferProgress" component={TransferProgressScreen} />
    </Stack.Navigator>
  );
}
