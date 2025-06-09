// src/navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import BillScreen from '../screens/BillScreen';
import CartControlScreen from '../screens/CartControlScreen';
import SearchItemScreen from '../screens/SearchItem';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0b0b0b',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          paddingTop: 12,     // ✅ Top padding
          paddingBottom: 12,  // ✅ Bottom padding
        },
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Main"
        component={BottomTabs}
        options={{ headerShown: false }} // Hide header for BottomTabs
      />
      <Stack.Screen name="Bill" component={BillScreen} />
      <Stack.Screen name="CartControl" component={CartControlScreen} />
      <Stack.Screen name="SearchItem" component={SearchItemScreen} />
    </Stack.Navigator>
  );
}
