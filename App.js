import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppStack from './src/navigation/AppStack';
import { ActivityIndicator, View } from 'react-native';
import { CartProvider } from './src/context/CartContext'; // ✅ Import the context
import { StatusBar } from 'react-native';


const RootStack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4C5FD5" />
      </View>
    );
  }

  return (

    <CartProvider> {/* ✅ Wrap here */}
          <StatusBar backgroundColor="#0b0b0b" barStyle="light-content" />
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>

            <RootStack.Screen name="App" component={AppStack} />

        </RootStack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
