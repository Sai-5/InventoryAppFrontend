import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowLeft,
} from "react-icons/fi";
import { useCart } from "../contexts/CartContext";
import { toast } from "react-toastify";
import { createOrder } from "../services/orderService";
import Cookies from "js-cookie";
import { API_URL } from "../config";

const Cart = () => {
  const {
    cart,
    loading,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSubtotal,
  } = useCart();

  // Debug logging
  useEffect(() => {
    console.log("Cart data:", cart);
    console.log("Loading state:", loading);
  }, [cart, loading]);

  const navigate = useNavigate();
  const [updating, setUpdating] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("cart"); // 'cart' | 'shipping' | 'review' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "", // Add this field
    postalCode: "",
    country: "United States",
    phone: "",
  });

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }));
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      toast.error(error.message || "Failed to update cart");
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this item from your cart?"
      )
    ) {
      try {
        await removeFromCart(itemId);
      } catch (error) {
        toast.error(error.message || "Failed to remove item");
      }
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart();
      } catch (error) {
        toast.error(error.message || "Failed to clear cart");
      }
    }
  };

  const handlePlaceOrder = () => {
    // Check if cart is empty
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      return;
    }

    // Check if user is authenticated
    const token =
      localStorage.getItem("userJwtToken") ||
      localStorage.getItem("adminJwtToken") ||
      Cookies.get("userJwtToken") ||
      Cookies.get("adminJwtToken");

    console.log("Authentication check - Token found:", !!token);

    if (!token) {
      // Save cart and redirect to login
      const cartData = {
        items: cart.items,
        total: cart.total,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem("checkoutCart", JSON.stringify(cartData));
      navigate("/login", {
        state: {
          from: "/cart",
          message: "Please log in to complete your order",
        },
      });
      return;
    }

    // Show shipping form
    setStep("shipping");
  };

  const validateShipping = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "address",
      "city",
      "postalCode",
      "country",
    ];
    for (const key of required) {
      if (!shippingDetails[key] || String(shippingDetails[key]).trim() === "") {
        toast.error(
          `Please enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }
    if (!/\S+@\S+\.\S+/.test(shippingDetails.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleConfirmOrder = async (e) => {
    e && e.preventDefault();

    // Basic form validation
    if (step === "shipping") {
      if (!validateShipping()) return;
      setStep("review");
      return;
    }

    // If we're in review step, submit the order
    setIsSubmitting(true);

    try {
      console.log("Starting order submission process...");

      // Calculate totals
      const subtotal =
        cart?.items?.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ) || 0;
      const shipping = subtotal > 100 ? 0 : 10;
      const tax = subtotal * 0.15;
      const total = subtotal + shipping + tax;

      // Enhanced order payload with complete shipping info
      const orderPayload = {
        orderItems: cart.items.map((item) => ({
          item: item.item?._id || item._id || item.itemId,
          name: item.item?.name || item.name || "Unknown Item",
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          imageUrl: item.item?.imageUrl || item.imageUrl || "",
        })),
        shippingAddress: {
          firstName: shippingDetails.firstName.trim(),
          lastName: shippingDetails.lastName.trim(),
          address: shippingDetails.address.trim(),
          city: shippingDetails.city.trim(),
          postalCode: shippingDetails.postalCode.trim(),
          country: shippingDetails.country.trim(),
          phone: shippingDetails.phone?.trim() || "",
          email: shippingDetails.email.trim(), // Add email to shipping address
          fullName: `${shippingDetails.firstName.trim()} ${shippingDetails.lastName.trim()}`, // Add full name
          state: shippingDetails.state || "", // Add state if your backend expects it
          zipCode: shippingDetails.postalCode.trim(), // Alternative naming
        },
        paymentMethod: "Credit Card",
        itemsPrice: Number(subtotal.toFixed(2)),
        shippingPrice: Number(shipping.toFixed(2)),
        taxPrice: Number(tax.toFixed(2)),
        totalPrice: Number(total.toFixed(2)),
        email: shippingDetails.email.trim(),
        // Add these additional fields that might be expected
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        status: "pending",
      };

      console.log(
        "Final order payload:",
        JSON.stringify(orderPayload, null, 2)
      );

      // Validate required shipping fields before sending
      const requiredShippingFields = [
        "firstName",
        "lastName",
        "address",
        "city",
        "postalCode",
        "country",
        "email",
      ];
      const missingFields = requiredShippingFields.filter(
        (field) =>
          !orderPayload.shippingAddress[field] ||
          orderPayload.shippingAddress[field].trim() === ""
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required shipping fields: ${missingFields.join(", ")}`
        );
      }

      const response = await createOrder(orderPayload);
      console.log("Order API response:", response);

      if (response && (response.data || response._id)) {
        const orderResult = response.data || response;

        setOrderData({
          orderId: orderResult._id || orderResult.id || "Unknown",
          total: total,
          email: shippingDetails.email,
          items: cart.items,
          shippingAddress: shippingDetails,
          orderNumber: orderResult.orderNumber || orderResult._id || "N/A",
        });

        try {
          await clearCart();
          console.log("Cart cleared successfully");
        } catch (clearError) {
          console.warn("Failed to clear cart:", clearError);
        }

        setStep("success");
        toast.success("🎉 Order placed successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error placing order:", {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
      });

      let errorMessage = "Failed to place order. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads/"))
      return `${API_URL.replace("/api", "")}${imageUrl}`;
    if (imageUrl.startsWith("/")) return `${API_URL}${imageUrl}`;
    return `${API_URL}/${imageUrl}`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  // Show empty state
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <FiShoppingCart className="mx-auto h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Your cart is empty
        </h3>
        <p className="mt-1 text-gray-500">
          You haven't added any items to your cart yet.
        </p>
        <div className="mt-6">
          <Link
            to="/inventory"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Browse Inventory
          </Link>
        </div>
      </div>
    );
  }

  // Calculate cart totals
  const subtotal =
    cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const tax = subtotal * 0.15; // 15% tax
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Shopping Cart
        </h1>

        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Cart Items - Hide when showing success */}
          {step !== "success" && (
            <div className="lg:col-span-7">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item._id || item.item._id} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={
                          getImageUrl(item.imageUrl || item.item?.imageUrl) ||
                          "https://via.placeholder.com/100"
                        }
                        alt={item.name || item.item?.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/100?text=No+Image";
                        }}
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.name || item.item?.name}</h3>
                          <p className="ml-4">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          SKU: {item.sku || "N/A"}
                        </p>
                      </div>

                      <div className="flex-1 flex items-end justify-between text-sm">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item._id || item.item._id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={updating[item._id || item.item._id]}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item._id || item.item._id,
                                item.quantity + 1
                              )
                            }
                            disabled={updating[item._id || item.item._id]}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(item._id || item.item._id)
                            }
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  <FiTrash2 className="inline mr-1" />
                  Clear Cart
                </button>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div
            className={`mt-10 lg:mt-0 ${
              step === "success" ? "lg:col-span-12" : "lg:col-span-5"
            }`}
          >
            <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
              {/* SUCCESS CARD */}
              {step === "success" && orderData ? (
                <div className="text-center max-w-lg mx-auto">
                  {/* Success Icon with Animation */}
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                    <svg
                      className="h-10 w-10 text-green-600 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  {/* Success Title */}
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    🎉 Order Placed Successfully!
                  </h2>

                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 text-lg font-medium mb-2">
                      Thank you for your purchase!
                    </p>
                    <p className="text-green-700">
                      Your order has been received and is being processed. We've
                      sent a confirmation email to{" "}
                      <span className="font-semibold text-green-900">
                        {orderData.email}
                      </span>
                    </p>
                  </div>

                  {/* Order Details Card */}
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-500">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
                      📋 Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">
                          Order ID:
                        </span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                          #
                          {(orderData.orderId || "").slice(-8).toUpperCase() ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">
                          Total Amount:
                        </span>
                        <span className="font-bold text-2xl text-green-600">
                          ${orderData.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">
                          Items Ordered:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {orderData.items?.length || 0} item(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate("/orders")}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg shadow-lg py-4 px-6 text-lg font-semibold text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105"
                    >
                      📦 View Your Orders
                    </button>
                    <button
                      onClick={() => navigate("/user/inventory")}
                      className="w-full bg-white border border-gray-300 rounded-lg shadow-md py-4 px-6 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200"
                    >
                      🛍️ Continue Shopping
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 <strong>What's Next?</strong> You'll receive tracking
                      information via email once your order ships. Expected
                      delivery: 3-5 business days.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order summary
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Subtotal</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        ${subtotal.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="flex items-center text-sm text-gray-600">
                        <span>Shipping</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {shipping === 0
                            ? "(Free shipping on orders over $100)"
                            : ""}
                        </span>
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="flex text-sm text-gray-600">
                        <span>Tax</span>
                        <span className="ml-2 text-xs text-gray-500">
                          (15%)
                        </span>
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        ${tax.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="text-base font-medium text-gray-900">
                        Order total
                      </dt>
                      <dd className="text-base font-medium text-gray-900">
                        ${total.toFixed(2)}
                      </dd>
                    </div>
                  </div>

                  {/* Place Order Button - only show when step is 'cart' */}
                  {step === "cart" && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={!cart?.items?.length || loading}
                        className={`w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          !cart?.items?.length || loading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {loading ? "Processing..." : "Place Order"}
                      </button>
                    </div>
                  )}

                  {/* Shipping Form */}
                  {step === "shipping" && (
                    <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Shipping Details
                      </h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (validateShipping()) {
                            setStep("review");
                          }
                        }}
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.firstName}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  firstName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.lastName}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  lastName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              id="email"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.email}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  email: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="address"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="address"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.address}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  address: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="city"
                              className="block text-sm font-medium text-gray-700"
                            >
                              City <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="city"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.city}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  city: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          {/* Add this after the city field */}
                          <div>
                            <label
                              htmlFor="state"
                              className="block text-sm font-medium text-gray-700"
                            >
                              State/Province
                            </label>
                            <input
                              type="text"
                              id="state"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.state}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  state: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="postalCode"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Postal Code{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="postalCode"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.postalCode}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  postalCode: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="country"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Country <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="country"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.country}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  country: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select a country</option>
                              <option value="United States">
                                United States
                              </option>
                              <option value="Canada">Canada</option>
                              <option value="United Kingdom">
                                United Kingdom
                              </option>
                              <option value="Australia">Australia</option>
                              <option value="India">India</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Phone (Optional)
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={shippingDetails.phone}
                              onChange={(e) =>
                                setShippingDetails({
                                  ...shippingDetails,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setStep("cart")}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Back to Cart
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Continue to Review
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Order Review */}
                  {step === "review" && (
                    <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Review Your Order
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Shipping Address
                          </h4>
                          <p className="mt-1 text-sm text-gray-700">
                            {shippingDetails.firstName}{" "}
                            {shippingDetails.lastName}
                            <br />
                            {shippingDetails.address}
                            <br />
                            {shippingDetails.city}, {shippingDetails.postalCode}
                            <br />
                            {shippingDetails.country}
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">Email:</span>{" "}
                            {shippingDetails.email}
                            {shippingDetails.phone && (
                              <span className="block">
                                <span className="font-medium">Phone:</span>{" "}
                                {shippingDetails.phone}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="font-medium text-gray-900">
                            Order Summary
                          </h4>
                          <div className="mt-2 space-y-2">
                            {cart.items.map((item) => (
                              <div
                                key={item._id || item.item._id}
                                className="flex justify-between"
                              >
                                <span className="text-sm text-gray-600">
                                  {item.name || item.item.name} ×{" "}
                                  {item.quantity}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Subtotal
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                ${subtotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Shipping
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {shipping === 0
                                  ? "Free"
                                  : `$${shipping.toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tax</span>
                              <span className="text-sm font-medium text-gray-900">
                                ${tax.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                              <span className="text-base font-medium text-gray-900">
                                Total
                              </span>
                              <span className="text-base font-medium text-gray-900">
                                ${total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setStep("shipping")}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Back to Shipping
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting}
                          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isSubmitting ? "Placing Order..." : "Confirm Order"}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === "cart" && (
                    <div className="mt-6 text-center text-sm">
                      <p>
                        or{" "}
                        <Link
                          to="/user/inventory"
                          className="font-medium text-blue-600 hover:text-blue-500"
                        >
                          Continue Shopping
                          <span aria-hidden="true"> &rarr;</span>
                        </Link>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
