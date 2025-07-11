// src/navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image } from 'react-native';
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
          backgroundColor: '#FCC316', 
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          paddingTop: 12,     
          paddingBottom: 12, 
        },
        headerTitleStyle: {
          color: '#212121', 
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: '#212121', 
      }}
    >
      <Stack.Screen
        name="Main"
        component={BottomTabs}
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="Bill"
        component={BillScreen}
        options={{
          headerTitle: 'Bill Summary', 
        }}
      />
      <Stack.Screen
        name="CartControl"
        component={CartControlScreen}
        options={{
          headerTitle: 'Cart Control',
        }}
      />
      <Stack.Screen
        name="SearchItem"
        component={SearchItemScreen}
        options={{
          headerTitle: 'Search Item',
        }}
      />
    </Stack.Navigator>
  );
}
