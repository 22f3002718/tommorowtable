import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on initialization
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, restaurantId, restaurantName) => {
    const existingItem = cart.find(
      ci => ci.menu_item_id === item.id && ci.restaurant_id === restaurantId
    );
    
    if (existingItem) {
      // Increase quantity
      setCart(cart.map(ci =>
        ci.menu_item_id === item.id && ci.restaurant_id === restaurantId
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      // Add new item
      setCart([...cart, {
        menu_item_id: item.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (menuItemId, restaurantId) => {
    const existingItem = cart.find(
      ci => ci.menu_item_id === menuItemId && ci.restaurant_id === restaurantId
    );
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity
      setCart(cart.map(ci =>
        ci.menu_item_id === menuItemId && ci.restaurant_id === restaurantId
          ? { ...ci, quantity: ci.quantity - 1 }
          : ci
      ));
    } else {
      // Remove item completely
      setCart(cart.filter(
        ci => !(ci.menu_item_id === menuItemId && ci.restaurant_id === restaurantId)
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartByVendor = () => {
    // Group cart items by restaurant
    const grouped = {};
    cart.forEach(item => {
      if (!grouped[item.restaurant_id]) {
        grouped[item.restaurant_id] = {
          restaurant_id: item.restaurant_id,
          restaurant_name: item.restaurant_name,
          items: []
        };
      }
      grouped[item.restaurant_id].items.push(item);
    });
    return Object.values(grouped);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartByVendor
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
