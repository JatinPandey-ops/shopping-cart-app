import React, { createContext, useState } from 'react';
import { Alert } from 'react-native';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Store itemId → quantity map, e.g., { "1": 2, "P124": 1 }
  const [cartItems, setCartItems] = useState({});

  // Add new item or increment if already exists
const addToCart = (itemId, maxQty = Infinity) => {
  setCartItems((prev) => {
    const currentQty = prev[itemId] || 0;
    if (currentQty >= maxQty) {
      Alert.alert('Out of Stock', 'You’ve already added all available stock of this item.');
      return prev; // block add
    }
    return {
      ...prev,
      [itemId]: currentQty + 1,
    };
  });
};

  // Remove item completely
  const removeFromCart = (itemId) => {
    const updated = { ...cartItems };
    delete updated[itemId];
    setCartItems(updated);
  };

  // Increase quantity of item
 const incrementQty = (itemId, maxQty = Infinity) => {
  setCartItems((prev) => {
    const currentQty = prev[itemId] || 0;
    if (currentQty >= maxQty) {
      Alert.alert('Out of Stock', 'You’ve already added all available stock of this item.');
      return prev; // block increment
    }
    return {
      ...prev,
      [itemId]: currentQty + 1,
    };
  });
};

  // Decrease quantity (and remove if it hits 0)
  const decrementQty = (itemId) => {
    setCartItems((prev) => {
      const currentQty = prev[itemId] || 0;
      if (currentQty <= 1) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return {
        ...prev,
        [itemId]: currentQty - 1,
      };
    });
  };

  // Clear the cart
  const clearCart = () => setCartItems({});

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        incrementQty,
        decrementQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
