import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "https://inventoryappbackend-hgjf.onrender.com/api";

// Helper function to get the appropriate token
const getAuthToken = () => {
  // First try to get admin token, fall back to user token
  return (
    localStorage.getItem("adminJwtToken") ||
    localStorage.getItem("userJwtToken") ||
    Cookies.get("adminJwtToken") ||
    Cookies.get("userJwtToken")
  );
};

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["x-auth-token"] = token; // For backward compatibility
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh or redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );

          const { token, user } = response.data;

          if (token && user) {
            // Store the appropriate token based on user role
            if (user.role === "admin") {
              localStorage.setItem("adminJwtToken", token);
            } else {
              localStorage.setItem("userJwtToken", token);
            }

            // Update the Authorization header
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            originalRequest.headers["x-auth-token"] = token; // For backward compatibility

            // Retry the original request
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("adminJwtToken");
        localStorage.removeItem("userJwtToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Create new order
const createOrder = async (orderData) => {
  try {
    console.log("Creating order with data:", orderData);

    // Get token from localStorage or cookies
    const token =
      localStorage.getItem("userJwtToken") || Cookies.get("userJwtToken");

    if (!token) {
      console.error("No authentication token found");
      throw new Error("Authentication required. Please log in.");
    }

    console.log("Sending order request to server...");
    console.log("Request URL:", `${API_URL}/orders`);

    // The interceptor will automatically add the Authorization header
    const response = await api.post("/orders", orderData);

    console.log("Order created successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error in createOrder:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem("userJwtToken");
        throw new Error("Your session has expired. Please log in again.");
      } else if (status === 400) {
        throw new Error(
          data.message || "Invalid order data. Please check your information."
        );
      } else if (status === 404) {
        throw new Error("The requested resource was not found.");
      } else if (status >= 500) {
        throw new Error("Server error. Please try again later.");
      }

      throw new Error(
        data.message || "Failed to create order. Please try again."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error(
        "No response from server. Please check your connection and try again."
      );
    } else {
      console.error("Request setup error:", error.message);
      throw new Error("Failed to process your request. Please try again.");
    }
  }
};

// Get order by ID
const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw (
      error.response?.data?.message || error.message || "Failed to fetch order"
    );
  }
};

// Get logged in user's orders
const getMyOrders = async () => {
  try {
    const response = await api.get("/orders/myorders");
    return response.data;
  } catch (error) {
    console.error("Error getting user orders:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch your orders. Please try again."
    );
  }
};

// Get all orders (Admin)
const getAllOrders = async () => {
  try {
    console.log("Fetching all orders...");
    const token = getAuthToken();
    console.log(
      "Using token for request:",
      token ? "Token exists" : "No token found"
    );

    const response = await api.get("/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Orders API Response:", response);

    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;
  } catch (error) {
    console.error("Error getting all orders:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });

    if (error.response?.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem("adminJwtToken");
      localStorage.removeItem("userJwtToken");
      Cookies.remove("adminJwtToken");
      Cookies.remove("userJwtToken");

      // Redirect to login
      window.location.href = "/login";
    }

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch orders. Please try again."
    );
  }
};

// Update order to paid
/**
 * Updates an order's payment status
 * @param {string} orderId - The ID of the order to update
 * @param {Object} paymentResult - Payment details
 * @param {string} paymentResult.id - Payment transaction ID
 * @param {string} paymentResult.status - Payment status
 * @param {string} paymentResult.update_time - When the payment was updated
 * @param {string} paymentResult.email_address - Payer's email
 * @returns {Promise<Object>} Updated order data
 */
const updateOrderToPaid = async (orderId, paymentResult) => {
  try {
    console.log(
      `Updating order ${orderId} with payment result:`,
      paymentResult
    );

    const response = await api.put(`/orders/${orderId}/pay`, paymentResult);

    if (!response.data) {
      throw new Error("No data received from server");
    }

    console.log("Order payment updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating order payment status:", {
      error: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update payment status. Please try again.";

    throw new Error(errorMessage);
  }
};

// Update order to delivered (Admin)
const updateOrderToDelivered = async (orderId) => {
  try {
    const response = await api.put(`/orders/${orderId}/deliver`);
    return response.data;
  } catch (error) {
    console.error("Error updating order to delivered:", error);
    throw error;
  }
};

/**
 * Update order status (Admin)
 * @param {string} orderId - The ID of the order to update
 * @param {Object} statusData - Status update data
 * @param {string} statusData.status - New status value (pending, processing, shipped, delivered, cancelled, refunded)
 * @param {string} [statusData.reason] - Optional reason for cancellation/refund
 * @param {Object} [statusData.paymentResult] - Payment result data (for paid status)
 * @param {string} [statusData.paymentMethod] - Payment method (for paid status)
 * @returns {Promise<Object>} Updated order data
 */
const updateOrderStatus = async (orderId, statusData) => {
  try {
    const { status, ...data } = statusData;

    // Map the status to the correct API endpoint if needed
    let endpoint = `/orders/${orderId}/status`;
    let payload = { status, ...data };

    // For backward compatibility with existing code
    if (status === "delivered") {
      endpoint = `/orders/${orderId}/deliver`;
      payload = {};
    } else if (status === "paid") {
      endpoint = `/orders/${orderId}/pay`;
      payload = data.paymentResult || {};
    }

    const response = await api.put(endpoint, payload);

    // If using the old endpoints, we might need to update the status field
    if (status === "delivered" || status === "paid") {
      const updateResponse = await api.put(`/orders/${orderId}/status`, {
        status,
      });
      return updateResponse.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);

    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem("adminJwtToken");
        localStorage.removeItem("userJwtToken");
        window.location.href = "/login";
      }

      throw new Error(data.message || `Error updating order status: ${status}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || "Error updating order status");
    }
  }
};

export {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
};
