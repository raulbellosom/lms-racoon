import React, { createContext, useContext, useEffect, useState } from "react";

const CART_STORAGE_KEY = "racoon_cart";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart data:", error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = (course) => {
    setCartItems((prevItems) => {
      if (prevItems.some((item) => item.$id === course.$id)) {
        return prevItems; // Already in cart
      }
      return [...prevItems, course];
    });
  };

  const removeFromCart = (courseId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.$id !== courseId),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (courseId) => {
    return cartItems.some((item) => item.$id === courseId);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.priceCents || 0), 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartTotal,
    isLoading: !isLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
