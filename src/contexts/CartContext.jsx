import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCart,
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService,
} from "../services/cartService";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format cart data from API response
  const formatCartData = (data) => {
    console.log('Raw cart data received:', data);
    
    if (!data) {
      console.warn('No cart data provided');
      return { items: [], total: 0 };
    }
    
    // Handle different response formats
    let items = [];
    let total = 0;
    
    // Format 1: { success: true, data: { items: [...], total: X } }
    if (data.success && data.data) {
      items = Array.isArray(data.data.items) ? data.data.items : [];
      total = typeof data.data.total === 'number' ? data.data.total : 0;
    } 
    // Format 2: { items: [...], total: X }
    else if (Array.isArray(data.items)) {
      items = data.items;
      total = typeof data.total === 'number' ? data.total : 0;
    }
    // Format 3: Direct array of items
    else if (Array.isArray(data)) {
      items = data;
      total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    }
    
    // Ensure items have required fields
    items = items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0
    }));
    
    const result = { items, total };
    console.log('Formatted cart data:', result);
    return result;
  };

  // Load cart on mount and handle session storage restoration
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const cookies = document.cookie.split('; ');
        const userToken = cookies.find(row => row.startsWith('userJwtToken='));
        const adminToken = cookies.find(row => row.startsWith('adminJwtToken='));
        
        if (!userToken && !adminToken) {
          console.log('No authentication token found, using empty cart');
          setCart({ items: [], total: 0 });
          return;
        }
        
        // Check for pending cart in localStorage (more persistent than sessionStorage)
        const pendingCart = localStorage.getItem('pendingCart');
        const savedCart = sessionStorage.getItem('checkoutCart') || pendingCart;
        
        if (savedCart) {
          try {
            const parsedCart = typeof savedCart === 'string' ? JSON.parse(savedCart) : savedCart;
            console.log('Found saved cart for restoration:', parsedCart);
            
            if (parsedCart?.items?.length > 0) {
              // Clear the saved cart data
              sessionStorage.removeItem('checkoutCart');
              localStorage.removeItem('pendingCart');
              
              try {
                // First, clear the current cart
                await clearCartService();
                
                // Add each item to the cart
                const addPromises = parsedCart.items.map(item => 
                  addToCartService(item.id || item._id, item.quantity || 1)
                );
                
                await Promise.all(addPromises);
                
                // Refresh the cart
                const cartData = await getCart();
                setCart(formatCartData(cartData));
                return;
              } catch (restoreError) {
                console.error('Error restoring saved cart:', restoreError);
                // Continue to load the regular cart
              }
            }
          } catch (err) {
            console.error('Error processing saved cart:', err);
            // Clear invalid cart data
            sessionStorage.removeItem('checkoutCart');
            sessionStorage.removeItem('returnTo');
            localStorage.removeItem('pendingCart');
          }
        }
        
        // If no saved cart or error occurred, load the regular cart
        try {
          console.log('Loading regular cart...');
          const cartData = await getCart();
          setCart(formatCartData(cartData));
        } catch (cartError) {
          if (cartError.response && cartError.response.status === 401) {
            console.log('User not authenticated, using empty cart');
            setCart({ items: [], total: 0 });
          } else {
            console.error('Error loading cart:', cartError);
            setError(cartError.message);
            setCart({ items: [], total: 0 });
          }
        }
        
      } catch (err) {
        console.error('Error initializing cart:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load cart');
        // Initialize with empty cart on error
        setCart({ items: [], total: 0 });
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
    
    // Listen for auth state changes to restore cart after login
    const handleStorageChange = (e) => {
      if (e.key === 'userJwtToken' && e.newValue) {
        // User just logged in, check for pending cart
        const pendingCart = localStorage.getItem('pendingCart');
        if (pendingCart) {
          console.log('User logged in with pending cart, initializing...');
          initializeCart();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add item to cart
  const addToCart = async (itemId, quantity = 1) => {
    try {
      setLoading(true);
      const response = await addToCartService(itemId, quantity);
      const updatedCart = formatCartData(response);
      setCart(updatedCart);
      toast.success("Item added to cart");
      return updatedCart;
    } catch (err) {
      console.error("Error in addToCart:", err);
      const errorMessage = err.message || "Failed to add item to cart";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      const response = await updateCartItemService(itemId, quantity);
      const updatedCart = formatCartData(response);
      setCart(updatedCart);
      toast.success("Cart updated");
      return updatedCart;
    } catch (err) {
      console.error("Error updating cart item:", err);
      const errorMessage = err.message || "Failed to update cart";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      const response = await removeFromCartService(itemId);
      const updatedCart = formatCartData(response);
      setCart(updatedCart);
      toast.success("Item removed from cart");
      return updatedCart;
    } catch (err) {
      console.error("Error removing item from cart:", err);
      const errorMessage = err.message || "Failed to remove item from cart";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);
      await clearCartService();
      setCart({ items: [], total: 0 });
      toast.success("Cart cleared");
    } catch (err) {
      console.error("Error clearing cart:", err);
      const errorMessage = err.message || "Failed to clear cart";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total items in cart
  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  // Calculate cart subtotal
  const getCartSubtotal = () => {
    return cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartItemCount,
        getCartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
