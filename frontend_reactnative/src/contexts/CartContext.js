import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCart();
  }, [cart]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item, restaurant) => {
    const existing = cart.find((c) => c.id === item.id && c.restaurant_id === restaurant.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.restaurant_id === restaurant.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
        },
      ]);
    }
  };

  const removeFromCart = (item, restaurantId) => {
    const existing = cart.find((c) => c.id === item.id && c.restaurant_id === restaurantId);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.restaurant_id === restaurantId
            ? { ...c, quantity: c.quantity - 1 }
            : c
        )
      );
    } else {
      setCart(cart.filter((c) => !(c.id === item.id && c.restaurant_id === restaurantId)));
    }
  };

  const removeRestaurantFromCart = (restaurantId) => {
    setCart(cart.filter((c) => c.restaurant_id !== restaurantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getItemQuantity = (itemId, restaurantId) => {
    const item = cart.find((c) => c.id === itemId && c.restaurant_id === restaurantId);
    return item ? item.quantity : 0;
  };

  const getRestaurantItems = (restaurantId) => {
    return cart.filter((c) => c.restaurant_id === restaurantId);
  };

  const getRestaurants = () => {
    const restaurants = {};
    cart.forEach((item) => {
      if (!restaurants[item.restaurant_id]) {
        restaurants[item.restaurant_id] = {
          id: item.restaurant_id,
          name: item.restaurant_name,
          items: [],
        };
      }
      restaurants[item.restaurant_id].items.push(item);
    });
    return Object.values(restaurants);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getRestaurantTotal = (restaurantId) => {
    return cart
      .filter((c) => c.restaurant_id === restaurantId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        removeRestaurantFromCart,
        clearCart,
        getItemQuantity,
        getRestaurantItems,
        getRestaurants,
        getTotalAmount,
        getRestaurantTotal,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
