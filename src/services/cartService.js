import axios from "axios";

const API_URL = "https://inventoryappbackend-hgjf.onrender.com/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Import the getCookie function
import { getCookie } from "../utils/cookies";

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // First try to get the admin token, fall back to user token
    let token = getCookie("adminJwtToken");
    if (!token) {
      token = getCookie("userJwtToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No authentication token found for cart request");
      // Don't throw here, let the server handle the unauthorized request
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get user's cart
export const getCart = async () => {
  try {
    console.log("Fetching cart from:", `${API_URL}/cart`);
    const token = localStorage.getItem("userJwtToken");
    console.log("Using token:", token ? "Token exists" : "No token found");

    const response = await api.get("/cart");
    console.log("Cart API response:", response.data);

    if (!response.data) {
      console.warn("Empty response from cart API");
      return { items: [], total: 0 };
    }

    // Handle different response formats
    if (response.data.success && response.data.data) {
      // Format: { success: true, data: { items: [...], total: X } }
      return response.data.data;
    } else if (response.data.items) {
      // Format: { items: [...], total: X }
      return response.data;
    }

    console.warn("Unexpected cart response format:", response.data);
    return { items: [], total: 0 };
  } catch (error) {
    console.error("Error fetching cart:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });

    // If 404, return empty cart
    if (error.response?.status === 404) {
      console.log("Cart not found, returning empty cart");
      return { items: [], total: 0 };
    }

    throw (
      error.response?.data?.message || error.message || "Failed to fetch cart"
    );
  }
};

// Add item to cart
export const addToCart = async (itemId, quantity = 1) => {
  try {
    const response = await api.post("/cart/items", { itemId, quantity });
    return response.data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to add item to cart"
    );
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to update cart item"
    );
  }
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
  try {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("Error removing item from cart:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to remove item from cart"
    );
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await api.delete("/cart");
    return response.data;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw (
      error.response?.data?.message || error.message || "Failed to clear cart"
    );
  }
};
