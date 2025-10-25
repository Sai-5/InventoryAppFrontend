import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyOrders } from '../../services/orderService';
import { format } from 'date-fns';
import { FaBox, FaCalendarAlt, FaMoneyBillWave, FaSearch } from 'react-icons/fa';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error(error.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(searchLower) ||
      order.orderItems.some(item => 
        item.name.toLowerCase().includes(searchLower)
      ) ||
      order.orderStatus?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': {
        classes: 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500',
        icon: <FaBox className="mr-1.5 h-3.5 w-3.5" />
      },
      'processing': {
        classes: 'bg-blue-50 text-blue-800 border-l-4 border-blue-500',
        icon: <div className="animate-spin mr-1.5"><FaBox className="h-3.5 w-3.5" /></div>
      },
      'shipped': {
        classes: 'bg-purple-50 text-purple-800 border-l-4 border-purple-500',
        icon: <FaBox className="mr-1.5 h-3.5 w-3.5" />
      },
      'delivered': {
        classes: 'bg-green-50 text-green-800 border-l-4 border-green-500',
        icon: <FaBox className="mr-1.5 h-3.5 w-3.5" />
      },
      'cancelled': {
        classes: 'bg-red-50 text-red-800 border-l-4 border-red-500',
        icon: <FaBox className="mr-1.5 h-3.5 w-3.5" />
      }
    };

    const statusInfo = statusMap[status?.toLowerCase()] || {
      classes: 'bg-gray-100 text-gray-800 border-l-4 border-gray-500',
      icon: <FaBox className="mr-1.5 h-3.5 w-3.5" />
    };

    return statusInfo;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
        <div className="relative mt-4 md:mt-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaBox className="mx-auto text-gray-400 text-5xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h2>
          <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">Order #{order._id.substring(0, 8).toUpperCase()}</span>
                    <div className={`ml-3 px-3 py-1.5 text-xs rounded-r flex items-center ${getStatusBadge(order.status || order.orderStatus)?.classes}`}>
                      {getStatusBadge(order.status || order.orderStatus)?.icon}
                      <span className="capitalize">{order.status || order.orderStatus || 'Processing'}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <FaCalendarAlt className="mr-1" />
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">${order.totalPrice?.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{order.orderItems.length} items</div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {order.orderItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
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
                      </div>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <div className="text-center text-sm text-blue-600">
                      + {order.orderItems.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                <Link
                  to={`/user/orders/${order._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Order Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
