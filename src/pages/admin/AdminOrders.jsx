import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiEye,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiChevronDown,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
  FiRefreshCw,
  FiLogIn,
} from "react-icons/fi";
import { getAllOrders, updateOrderStatus } from "../../services/orderService";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("=== Starting to fetch orders ===");
      const adminToken = localStorage.getItem("adminJwtToken") || "";
      const userToken = localStorage.getItem("userJwtToken") || "";

      console.log("Admin token exists:", !!adminToken);
      console.log("User token exists:", !!userToken);

      if (!adminToken && !userToken) {
        const errorMsg = "No authentication tokens found. Please log in.";
        console.error(errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Check if backend is reachable
      try {
        const healthCheck = await fetch("http://localhost:5000/api/health");
        console.log("Backend health check status:", healthCheck.status);
      } catch (healthError) {
        console.error("Backend health check failed:", healthError);
        throw new Error(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      }

      try {
        console.log("Calling getAllOrders...");
        const startTime = Date.now();

        // Add auth header manually for debugging
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Use admin token if available, otherwise use user token
        const token = adminToken || userToken;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("Using token for authorization");
        } else {
          console.warn("No authentication token found");
        }

        console.log("Sending request to http://localhost:5000/api/orders");
        console.log("Request headers:", JSON.stringify(headers, null, 2));

        const response = await fetch("http://localhost:5000/api/orders", {
          method: "GET",
          headers: headers,
          credentials: "include",
          mode: "cors",
        });

        const responseTime = Date.now() - startTime;
        console.log(`=== Orders API Response (${responseTime}ms) ===`);
        console.log("Response status:", response.status, response.statusText);

        // Log response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        console.log("Response headers:", responseHeaders);

        // Handle non-2xx responses
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error(
              "API Error Response:",
              JSON.stringify(errorData, null, 2)
            );
          } catch (e) {
            const text = await response.text();
            console.error("Failed to parse error response as JSON:", text);
            errorData = { message: text || "Unknown error occurred" };
          }

          const errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
          console.error("API Error Details:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            error: errorData,
          });

          // Handle specific status codes
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          } else if (response.status === 403) {
            throw new Error("You do not have permission to view orders.");
          } else if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(errorMessage);
          }
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (!data) {
          throw new Error("No data received from server");
        }

        // Handle different response formats
        let orders = [];
        if (Array.isArray(data)) {
          orders = data;
        } else if (data && Array.isArray(data.orders)) {
          orders = data.orders;
        } else if (data && data.data && Array.isArray(data.data)) {
          orders = data.data;
        } else {
          console.warn("Unexpected response format:", data);
          throw new Error("Unexpected data format received from server");
        }

        console.log(`Successfully processed ${orders.length} orders`);
        setOrders(orders);

        // If no orders, check if this is expected
        if (orders.length === 0) {
          console.warn("No orders found in the database");
          // You might want to show a different message if no orders exist yet
          setError("No orders found in the database");
        }
      } catch (apiError) {
        console.error("API Error:", {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
        });

        if (apiError.response?.status === 401) {
          // Token might be expired, try to refresh
          try {
            console.log("Attempting to refresh token...");
            const refreshResponse = await fetch(
              "http://localhost:5000/api/auth/refresh-token",
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (refreshResponse.ok) {
              const { token, user } = await refreshResponse.json();
              if (user.role === "admin") {
                localStorage.setItem("adminJwtToken", token);
                console.log("Token refreshed, retrying...");
                // Retry fetching orders
                await fetchOrders();
                return;
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            throw new Error("Session expired. Please login again.");
          }
        }

        throw apiError;
      }
    } catch (err) {
      console.error("Error in fetchOrders:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load orders";
      setError(errorMessage);

      if (err.response?.status === 401) {
        // Redirect to login if unauthorized
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      icon: <FiClock className="mr-2 h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800",
      hoverColor: "hover:bg-yellow-200",
      confirmMessage: "Mark this order as pending?",
      confirmIcon: <FiInfo className="text-yellow-500 mr-2" />,
    },
    {
      value: "processing",
      label: "Processing",
      icon: <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />,
      color: "bg-blue-100 text-blue-800",
      hoverColor: "hover:bg-blue-200",
      confirmMessage: "Mark this order as processing?",
      confirmIcon: <FiInfo className="text-blue-500 mr-2" />,
    },
    {
      value: "shipped",
      label: "Shipped",
      icon: <FiTruck className="mr-2 h-4 w-4" />,
      color: "bg-indigo-100 text-indigo-800",
      hoverColor: "hover:bg-indigo-200",
      confirmMessage: "Mark this order as shipped?",
      confirmIcon: <FiInfo className="text-indigo-500 mr-2" />,
    },
    {
      value: "delivered",
      label: "Delivered",
      icon: <FiCheckCircle className="mr-2 h-4 w-4" />,
      color: "bg-green-100 text-green-800",
      hoverColor: "hover:bg-green-200",
      confirmMessage: "Mark this order as delivered?",
      confirmIcon: <FiCheck className="text-green-500 mr-2" />,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      icon: <FiXCircle className="mr-2 h-4 w-4" />,
      color: "bg-red-100 text-red-800",
      hoverColor: "hover:bg-red-200",
      confirmMessage: "Are you sure you want to cancel this order?",
      confirmIcon: <FiAlertTriangle className="text-red-500 mr-2" />,
    },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': {
        icon: <FiClock className="mr-1.5 h-3.5 w-3.5" />,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pending'
      },
      'processing': {
        icon: <FiRefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />,
        color: 'bg-blue-100 text-blue-800',
        label: 'Processing'
      },
      'shipped': {
        icon: <FiTruck className="mr-1.5 h-3.5 w-3.5" />,
        color: 'bg-indigo-100 text-indigo-800',
        label: 'Shipped'
      },
      'delivered': {
        icon: <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" />,
        color: 'bg-green-100 text-green-800',
        label: 'Delivered'
      },
      'cancelled': {
        icon: <FiXCircle className="mr-1.5 h-3.5 w-3.5" />,
        color: 'bg-red-100 text-red-800',
        label: 'Cancelled'
      }
    };

    const statusInfo = statusMap[status?.toLowerCase()] || {
      icon: <FiClock className="mr-1.5 h-3.5 w-3.5" />,
      color: 'bg-gray-100 text-gray-800',
      label: status || 'Unknown'
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <span className="flex items-center">
          {statusInfo.icon}
          {statusInfo.label}
        </span>
      </div>
    );
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);

      // First try to update the order status
      try {
        await updateOrderStatus(orderId, { status: newStatus });

        // Update the orders state with the new status
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );

        toast.success("Order status updated successfully");
      } catch (apiError) {
        console.error("API Error updating status:", {
          message: apiError.message,
          stack: apiError.stack,
          response: apiError.response?.data,
        });

        const errorMessage =
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to update order status. Please try again.";

        // If unauthorized, redirect to login after a delay
        if (apiError.response?.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        // If this is a token expiration error, try to refresh the token
        if (
          errorMessage.toLowerCase().includes("token") ||
          errorMessage.toLowerCase().includes("expired")
        ) {
          try {
            const refreshResponse = await fetch(
              "http://localhost:5000/api/auth/refresh-token",
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (refreshResponse.ok) {
              const { token, user } = await refreshResponse.json();
              if (user.role === "admin") {
                localStorage.setItem("adminJwtToken", token);
                console.log("Token refreshed, retrying status update...");

                // Retry the status update with the new token
                await updateOrderStatus(orderId, { status: newStatus });

                // Update the orders state with the new status
                setOrders((prevOrders) =>
                  prevOrders.map((order) =>
                    order._id === orderId
                      ? {
                          ...order,
                          status: newStatus,
                          updatedAt: new Date().toISOString(),
                        }
                      : order
                  )
                );

                toast.success("Order status updated successfully");
                return;
              }
            }
          } catch (refreshError) {
            console.error(
              "Token refresh failed during status update:",
              refreshError
            );
            throw new Error("Session expired. Please login again.");
          }
        }

        throw apiError;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update order status";
      console.error("Error updating order status:", errorMessage);

      if (err.response?.status === 401) {
        // Redirect to login if unauthorized
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Error loading orders
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                    Show technical details
                  </summary>
                  <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono text-red-800 overflow-x-auto">
                    {error.stack || error.toString()}
                  </div>
                </details>
              </div>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => {
                    setError(null);
                    fetchOrders();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Try Again
                </button>
                <button
                  onClick={() => {
                    // Clear local storage and redirect to login
                    localStorage.removeItem("adminJwtToken");
                    localStorage.removeItem("userJwtToken");
                    window.location.href = "/login";
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiLogIn className="mr-1.5 h-3.5 w-3.5" />
                  Log In Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Orders</h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage customer orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No orders
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no orders to display.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Items
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #
                      {order.orderNumber ||
                        order._id.substring(18, 24).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user?.name || "Guest"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(order.orderItems || []).reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      )}{" "}
                      items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(order.totalPrice || order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(order.status || "pending")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <FiEye className="inline-block mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
