import axios from "axios";

const API_URL = "https://inventoryappbackend-hgjf.onrender.com/api/users";

// Helper function to get the appropriate token
const getAuthToken = () => {
  // First try to get admin token, fall back to user token
  return (
    localStorage.getItem("adminJwtToken") ||
    localStorage.getItem("userJwtToken")
  );
};

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
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
            "https://inventoryappbackend-hgjf.onrender.com/api/auth/refresh-token",
            { refreshToken },
            { withCredentials: true }
          );

          const { token, user } = response.data;

          // Store the new token
          if (user.role === "admin") {
            localStorage.setItem("adminJwtToken", token);
          } else {
            localStorage.setItem("userJwtToken", token);
          }

          // Update the Authorization header
          originalRequest.headers["Authorization"] = `Bearer ${token}`;

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // If refresh fails, redirect to login
        localStorage.removeItem("adminJwtToken");
        localStorage.removeItem("userJwtToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const userService = {
  // Get all users
  getUsers: async () => {
    try {
      const response = await api.get("/");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};

export default userService;
