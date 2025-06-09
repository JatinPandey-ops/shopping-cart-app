// src/navigation/BottomTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo icon set
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen'; // Make sure this exists

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
         headerStyle: {
    backgroundColor: '#0b0b0b',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitleStyle: {
  color: '#fff',          // Title text color
  fontWeight: 'bold',
  fontSize: 18,
},
headerTintColor: '#fff',  // Icon & back button color

        tabBarActiveTintColor: 'red', // active icon color
        tabBarInactiveTintColor: '#ccc',   // inactive icon color
       tabBarStyle: {
  backgroundColor: '#0b0b0b',
  borderTopWidth: 0,
  elevation: 8, 
  shadowColor: '#000', 
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  height: 60,
  paddingTop : 5
},
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
    </Tab.Navigator>
  );
}
