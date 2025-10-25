import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import { format } from 'date-fns';
import { 
  FaArrowLeft, 
  FaBox, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaCreditCard, 
  FaShippingFast, 
  FaStore,
  FaEdit,
  FaSpinner
} from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';

const OrderDetails = ({ adminView = false }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: <FaBox className="mr-2" /> },
    { value: 'processing', label: 'Processing', icon: <FaShippingFast className="mr-2" /> },
    { value: 'shipped', label: 'Shipped', icon: <FaShippingFast className="mr-2" /> },
    { value: 'delivered', label: 'Delivered', icon: <FaCheckCircle className="mr-2" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <FaStore className="mr-2" /> },
  ];

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error(error.message || 'Failed to load order details');
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          navigate(adminView ? '/admin/login' : '/login');
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);
  
  const handleStatusUpdate = async (newStatus) => {
    if (!adminView || !order) return;
    
    try {
      setUpdatingStatus(true);
      
      // Confirm before updating status
      const confirmMessage = `Are you sure you want to update the order status to "${newStatus}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      // Update the order status
      await updateOrderStatus(order._id, { status: newStatus });
      
      // Refresh the order data
      await fetchOrder();
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
      setStatusDropdownOpen(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing':
        return { 
          bg: 'bg-blue-50', 
          text: 'text-blue-800', 
          icon: <FaSpinner className="mr-2 animate-spin" />,
          buttonClass: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
        };
      case 'shipped':
        return { 
          bg: 'bg-purple-50', 
          text: 'text-purple-800', 
          icon: <FaShippingFast className="mr-2" />,
          buttonClass: 'bg-purple-100 hover:bg-purple-200 text-purple-800'
        };
      case 'delivered':
        return { 
          bg: 'bg-green-50', 
          text: 'text-green-800', 
          icon: <FaCheckCircle className="mr-2" />,
          buttonClass: 'bg-green-100 hover:bg-green-200 text-green-800'
        };
      case 'cancelled':
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-800', 
          icon: <FaStore className="mr-2" />,
          buttonClass: 'bg-red-100 hover:bg-red-200 text-red-800'
        };
      default: // pending
        return { 
          bg: 'bg-yellow-50', 
          text: 'text-yellow-800', 
          icon: <FaBox className="mr-2" />,
          buttonClass: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link 
            to={adminView ? '/admin/orders' : '/user/orders'} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaArrowLeft className="mr-2" />
            Back to {adminView ? 'Orders' : 'My Orders'}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.status);
  const statusBadge = getStatusBadge(order.status);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to={adminView ? '/admin/orders' : '/user/orders'} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> 
          {adminView ? 'Back to Orders' : 'Back to My Orders'}
        </Link>
      </div>
      
      {/* Order Status Banner */}
      <div className={`${statusBadge.bg} border-l-4 ${statusBadge.text.replace('text-', 'border-')} p-4 rounded-r-lg mb-6 flex justify-between items-center`}>
        <div className="flex items-center">
          {statusBadge.icon}
          <span className="font-medium">
            Order {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            {order.status === 'processing' && (
              <span className="ml-2 text-sm font-normal">(This may take a few minutes)</span>
            )}
          </span>
        </div>
        
        {adminView && (
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              disabled={updatingStatus}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${statusBadge.buttonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {updatingStatus ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" />
                  Update Status
                  <FiChevronDown className="ml-2" />
                </>
              )}
            </button>
            
            {statusDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusUpdate(option.value)}
                      disabled={updatingStatus || order.status === option.value}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${order.status === option.value ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {option.icon}
                      {option.label}
                      {order.status === option.value && (
                        <span className="ml-auto text-green-500">
                          <FaCheckCircle />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order #{order._id.substring(0, 8).toUpperCase()}</h1>
              <p className="text-gray-500 mt-1">
                Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.icon}
                {order.orderStatus || 'Processing'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex items-center py-4 border-b border-gray-100 last:border-0">
                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl?.startsWith('http') ? item.imageUrl : `http://localhost:5000${item.imageUrl}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <FaBox className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.price?.toFixed(2)}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)} total</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{order.shippingAddress?.fullName || 'N/A'}</p>
              <p className="text-gray-600">{order.shippingAddress?.address || 'N/A'}</p>
              <p className="text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p className="text-gray-600">{order.shippingAddress?.country}</p>
              <p className="text-gray-600 mt-2">
                <span className="font-medium">Phone:</span> {order.shippingAddress?.phone || 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.itemsPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>${order.shippingPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${order.taxPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${order.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              
              {order.paymentMethod && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-gray-600">
                    <FaCreditCard className="mr-2" />
                    <span className="font-medium">Payment Method:</span>
                  </div>
                  <div className="mt-1">
                    {order.paymentMethod === 'paypal' ? 'PayPal' : 
                     order.paymentMethod === 'stripe' ? 'Credit/Debit Card' : 
                     order.paymentMethod || 'N/A'}
                    {order.isPaid ? (
                      <span className="ml-2 text-green-600 text-sm">(Paid on {order.paidAt ? format(new Date(order.paidAt), 'MMM d, yyyy') : 'N/A'})</span>
                    ) : (
                      <span className="ml-2 text-yellow-600 text-sm">(Not Paid)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
