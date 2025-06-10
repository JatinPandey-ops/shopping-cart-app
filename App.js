import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppStack from './src/navigation/AppStack';
import { CartProvider } from './src/context/CartContext';
import { StatusBar } from 'react-native';

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    <CartProvider>
      <StatusBar backgroundColor="#0b0b0b" barStyle="light-content" />
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="App" component={AppStack} />
        </RootStack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
