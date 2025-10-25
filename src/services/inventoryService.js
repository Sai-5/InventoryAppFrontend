import axios from "axios";

const API_URL = "https://inventoryappbackend-hgjf.onrender.com/api/items";

// Axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Axios instance for file uploads (no Content-Type header for FormData)
const apiFormData = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
  },
});

// Add auth token to FormData requests
apiFormData.interceptors.request.use((config) => {
  const token = localStorage.getItem("userJwtToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userJwtToken");
    if (token) {
      // Use the same header format as auth service
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userJwtToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    // Return error response if available, otherwise return a generic error
    return Promise.reject(
      error.response?.data || { message: "Network error occurred" }
    );
  }
);

// Functions returning axios Response
export const fetchItems = async () => {
  try {
    const response = await api.get("/");
    console.log("Inventory API Response:", response);
    return response;
  } catch (error) {
    console.error("Error in fetchItems:", error);
    throw error;
  }
};
export const createItem = (item) => {
  if (item instanceof FormData) {
    return apiFormData.post("/", item);
  }
  return api.post("/", item);
};
export const removeItem = (id) => api.delete(`/${id}`);
export const updateItem = (id, item) => {
  if (item instanceof FormData) {
    return apiFormData.put(`/${id}`, item);
  }
  return api.put(`/${id}`, item);
};
export const fetchItemById = (id) => api.get(`/${id}`);

// Legacy aliases (compatibility with existing imports)
export const getItems = fetchItems;
export const getItemById = fetchItemById;
export const deleteItem = removeItem;

// Default export with data-unwrapped helpers for existing components
const inventoryService = {
  getAll: async () => {
    try {
      const response = await api.get("/");
      // Return the data array from the response
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching items:", error);
      // Return empty array on error to prevent UI breakage
      return [];
    }
  },
  create: async (item) => {
    try {
      // Log the form data keys for debugging
      if (item instanceof FormData) {
        console.log("FormData entries:");
        for (let [key, value] of item.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        console.log("Item data:", JSON.stringify(item, null, 2));
      }

      // Use apiFormData for FormData (file uploads), otherwise use regular api
      const client = item instanceof FormData ? apiFormData : api;

      console.log("Sending item data to server...");
      const response = await client.post("/", item);
      console.log("Server response status:", response.status);

      // Check if response has the expected structure
      if (!response.data) {
        const error = new Error("Invalid server response format");
        error.response = {
          data: { message: "Server returned an empty response" },
        };
        throw error;
      }

      console.log("Server response data:", response.data);

      // Return the data object directly if it exists, otherwise return the whole response
      return response.data.data || response.data;
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
            ? {
                ...error.config.headers,
                // Don't log the full auth token for security
                Authorization: error.config.headers.Authorization
                  ? "Bearer [REDACTED]"
                  : undefined,
              }
            : undefined,
          data: error.config?.data,
        },
      };

      console.error(
        "Error in inventoryService.create:",
        JSON.stringify(errorDetails, null, 2)
      );

      // Create a more descriptive error message
      let errorMessage = "Failed to create item";

      if (error.response) {
        // Handle HTTP error responses
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Invalid request data";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication required";
        } else if (error.response.status === 500) {
          errorMessage = "Server error occurred while creating item";
        }

        // Include server error details if available
        if (error.response.data?.errors) {
          errorMessage +=
            ": " + Object.values(error.response.data.errors).join(", ");
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      }

      // Create a new error with the enhanced message
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;

      throw enhancedError;
    }
  },
  remove: async (id) => {
    try {
      if (!id) {
        throw new Error("Item ID is required for deletion");
      }

      console.log("Attempting to delete item with ID:", id);
      const response = await api.delete(`/${id}`);
      console.log("Delete response:", response.data);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      return response.data;
    } catch (error) {
      console.error("Error in inventoryService.remove:", {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              headers: {
                ...error.config.headers,
                Authorization: error.config.headers?.Authorization
                  ? "Bearer [REDACTED]"
                  : undefined,
              },
              data: error.config.data,
            }
          : undefined,
      });

      // Create a more descriptive error message
      let errorMessage = "Failed to delete item";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          errorMessage = "You are not authorized to delete this item";
        } else if (error.response.status === 403) {
          errorMessage = "You do not have permission to delete this item";
        } else if (error.response.status === 404) {
          errorMessage = "Item not found";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || "Error setting up request";
      }

      const customError = new Error(errorMessage);
      customError.status = error.response?.status;
      customError.data = error.response?.data;

      throw customError;
    }
  },
  update: async (id, item) => {
    try {
      // Use apiFormData for FormData (file uploads), otherwise use regular api
      const client = item instanceof FormData ? apiFormData : api;
      console.log(
        `Sending ${
          item instanceof FormData ? "FormData" : "JSON"
        } update for item ${id}`
      );

      const response = await client.put(`/${id}`, item, {
        headers: {
          "Content-Type":
            item instanceof FormData
              ? "multipart/form-data"
              : "application/json",
        },
      });

      console.log("Update response:", response);

      // Return the full response so we can access both data and status
      return response.data;
    } catch (error) {
      console.error("Error updating item:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });

      // Create a more informative error object
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update item";

      const customError = new Error(errorMessage);
      customError.status = error.response?.status;
      customError.data = error.response?.data;

      throw customError;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching item:", error);
      throw error;
    }
  },
};

export default inventoryService;
