import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiShoppingCart, FiClock, FiMail, FiHome, FiPackage, FiTruck, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get order data from location state or fetch it
  useEffect(() => {
    // Check if we have order data in location state
    if (location.state?.order) {
      setOrder(location.state.order);
      setLoading(false);
    } else if (location.state?.orderId) {
      // If only orderId is available, create a basic order object
      setOrder({
        _id: location.state.orderId,
        isPaid: location.state.isPaid || false,
        paymentMethod: location.state.paymentMethod || 'cash',
        totalPrice: location.state.order?.totalPrice || 0,
        createdAt: new Date().toISOString(),
        orderItems: location.state.orderItems || [],
        email: location.state.email || '',
      });
      setLoading(false);
    } else {
      // No order data available, redirect to home
      toast.error('No order information found');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-3 text-xl font-medium text-gray-900">Order Error</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiHome className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 shadow-lg mb-6 animate-bounce">
            <FiCheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Order Placed Successfully!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase! Your order has been received and is being processed with care.
          </p>
        </div>

        {/* Main Success Card */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Order Confirmation</h2>
                <p className="text-green-100 mt-1">Your order is on its way!</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full p-3">
                <FiPackage className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Order Details */}
          <div className="px-6 py-8">
            {/* Order Summary Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiInfo className="mr-2 h-5 w-5 text-blue-600" />
                Order Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded">
                      #{(order._id || '').slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-2xl text-green-600">
                      ${(order.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.paymentMethod || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Time:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium text-gray-900">
                      {order.orderItems?.length || 0} item(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-4 mb-8">
              {/* Confirmation Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiMail className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-semibold text-green-900">Confirmation Email Sent</h4>
                    <p className="text-green-700 text-sm mt-1">
                      {order.email ? (
                        <>A confirmation email has been sent to <span className="font-medium">{order.email}</span></>
                      ) : (
                        'A confirmation email has been sent to your registered email address'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiTruck className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Order Processing</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      Your order is currently being prepared. You'll receive tracking information once it ships.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Payment Message */}
              {order.paymentMethod === 'cash' && !order.isPaid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-yellow-900">Cash on Delivery</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Please prepare the exact amount of <span className="font-bold">${(order.totalPrice || 0).toFixed(2)}</span> for when your order arrives.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Link
                to="/orders"
                className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <FiPackage className="mr-2 h-5 w-5" />
                Track My Orders
              </Link>
              <Link
                to="/user/inventory"
                className="inline-flex items-center justify-center px-6 py-4 border border-gray-300 text-lg font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 shadow-lg"
              >
                <FiShoppingCart className="mr-2 h-5 w-5" />
                Continue Shopping
              </Link>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <span>We'll prepare your order with care</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-xs">2</span>
                  </div>
                  <span>You'll receive tracking information via email</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-xs">3</span>
                  </div>
                  <span>Your order will be delivered in 3-5 business days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Have questions about your order? Our support team is here to help!
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Email us at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500 font-medium">
                support@example.com
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Or call us at{' '}
              <a href="tel:+1-555-123-4567" className="text-blue-600 hover:text-blue-500 font-medium">
                (555) 123-4567
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
