import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { CartService } from "../shared/data/cart";

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
  const { auth } = useAuth();
  const user = auth?.user;

  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from LocalStorage on mount (always init with local)
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

  // Sync with DB when user logs in
  useEffect(() => {
    if (!isLoaded) return;

    const syncCart = async () => {
      if (user) {
        setIsSyncing(true);
        try {
          // 1. Get DB Cart
          const dbItems = await CartService.getCart(user.$id);

          // 2. Get current Local items
          const localItems = cartItems;

          // 3. Find items in local that are NOT in DB
          const itemsToPush = localItems.filter(
            (localItem) =>
              !dbItems.some(
                (dbItem) =>
                  dbItem.courseId === localItem.$id ||
                  dbItem.$id === localItem.$id,
              ),
          );

          // 4. Push local-only items to DB
          await Promise.all(
            itemsToPush.map((item) =>
              CartService.addToCart(user.$id, item.$id),
            ),
          );

          // 5. Re-fetch DB Cart to get final state
          const finalItems = await CartService.getCart(user.$id);

          setCartItems(finalItems);

          // Optional: Clear local storage since we are now Auth-based?
          // Or keep it in sync? Keeping it in sync acts as a backup/cache.
          // But usually we can clear it to avoid confusion or just overwrite it.
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(finalItems));
        } catch (error) {
          console.error("Cart sync failed:", error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User logged out:
        // We should likely clear the in-memory cart to avoid showing previous user's items.
        // And revert to whatever is in localStorage or empty.
        // For privacy, best to clear.
        // However, if we want "Guest Cart" validation, we might want to reload from storage
        // but storage was overwritten by User cart above.
        // It's tricky. Simple approach: Clear on logout.
        setCartItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    // run sync
    syncCart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id, isLoaded]); // Only run when user changes or initial load finishes

  // Persist to LocalStorage (Observer)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = async (course) => {
    // Optimistic Update
    const newItem = { ...course, addedAt: new Date().toISOString() };

    setCartItems((prevItems) => {
      if (
        prevItems.some(
          (item) => item.$id === course.$id || item.courseId === course.$id,
        )
      ) {
        return prevItems; // Already in cart
      }
      return [...prevItems, newItem];
    });

    if (user) {
      try {
        await CartService.addToCart(user.$id, course.$id);
        // Background refresh to get real ID? Not strictly needed if we use course.$id for keys
      } catch (e) {
        console.error("Failed to add to server cart", e);
        // Rollback?
      }
    }
  };

  const removeFromCart = async (courseId) => {
    // Optimistic Update
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => item.$id !== courseId && item.courseId !== courseId,
      ),
    );

    if (user) {
      try {
        await CartService.removeFromCart(user.$id, courseId);
      } catch (e) {
        console.error("Failed to remove from server cart", e);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      try {
        await CartService.clearCart(user.$id);
      } catch (e) {
        console.error("Failed to clear server cart", e);
      }
    }
  };

  const isInCart = (courseId) => {
    return cartItems.some(
      (item) => item.$id === courseId || item.courseId === courseId,
    );
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
    isLoading: !isLoaded || isSyncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
