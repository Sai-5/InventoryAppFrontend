import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "https://inventoryappbackend-hgjf.onrender.com/api/auth";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    // Try to get admin token first from localStorage, then from cookies
    let token =
      localStorage.getItem("adminJwtToken") ||
      Cookies.get("adminJwtToken") ||
      Cookies.get("userJwtToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      Cookies.remove("userJwtToken");
      Cookies.remove("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const register = async (userData) => {
  try {
    const response = await api.post("/register", userData);
    if (response.data.token) {
      // Set token in cookie with 7 days expiration
      Cookies.set("userJwtToken", response.data.token, {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });

      // Store user data in cookie
      if (response.data.user) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          isAdmin: response.data.user.role === "admin",
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }
      return response.data;
    }
    throw new Error("Registration successful but no token received");
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage =
      error.response?.data?.message || error.message || "Registration failed";
    throw new Error(errorMessage);
  }
};

const login = async (credentials) => {
  try {
    const response = await api.post("/login", credentials);
    if (response.data.token) {
      const isAdmin = response.data.user?.role === "admin";
      const tokenName = isAdmin ? "adminJwtToken" : "userJwtToken";
      const userCookieName = isAdmin ? "admin" : "user";
      const token = response.data.token;

      // Store token in both cookie and localStorage for admin
      if (isAdmin) {
        // For admin, store in both cookie and localStorage
        Cookies.set(tokenName, token, {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });
        localStorage.setItem("adminJwtToken", token);
      } else {
        // For regular users, just use cookie
        Cookies.set(tokenName, token, {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });
      }

      // Store user data in cookie and localStorage for admin
      if (response.data.user) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          isAdmin: isAdmin,
        };
        const userDataString = JSON.stringify(userData);

        Cookies.set(userCookieName, userDataString, {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });

        // Store admin data in localStorage as well
        if (isAdmin) {
          localStorage.setItem("admin", userDataString);
        }
      }
      return response.data;
    }
    throw new Error("Login successful but no token received");
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage =
      error.response?.data?.message || error.message || "Login failed";
    throw new Error(errorMessage);
  }
};

const logout = () => {
  // Remove all possible auth cookies
  ["userJwtToken", "adminJwtToken", "user", "admin"].forEach((cookie) => {
    Cookies.remove(cookie);
    localStorage.removeItem(cookie);
  });

  // Clear all localStorage for good measure
  localStorage.clear();
  sessionStorage.clear();
};

const getCurrentUser = () => {
  try {
    // Try admin first, then fall back to regular user
    let token = Cookies.get("adminJwtToken");
    let userStr = Cookies.get("admin");

    if (!token || !userStr) {
      token = Cookies.get("userJwtToken");
      userStr = Cookies.get("user");
    }

    if (!token || !userStr) return null;

    const user = JSON.parse(userStr);
    return {
      ...user,
      token,
      isAdmin: user.role === "admin",
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  api, // Export the configured axios instance for other services
};
