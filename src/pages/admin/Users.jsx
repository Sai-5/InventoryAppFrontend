import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiUsers, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import userService from '../../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users with admin token...');
      const adminToken = localStorage.getItem('adminJwtToken');
      console.log('Admin token exists:', !!adminToken);
      
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }
      
      try {
        // Use the userService which now handles the admin token
        const data = await userService.getUsers();
        console.log('Users data received:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (data && data.data && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          console.warn('Unexpected response format:', data);
          setUsers([]);
        }
      } catch (apiError) {
        console.error('API Error:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status
        });
        
        if (apiError.response?.status === 401) {
          // Token might be expired, try to refresh
          try {
            console.log('Attempting to refresh token...');
            const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh-token', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (refreshResponse.ok) {
              const { token, user } = await refreshResponse.json();
              if (user.role === 'admin') {
                localStorage.setItem('adminJwtToken', token);
                console.log('Token refreshed, retrying...');
                // Retry fetching users
                await fetchUsers();
                return;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw new Error('Session expired. Please login again.');
          }
        }
        
        throw apiError;
      }
    } catch (err) {
      console.error('Error in fetchUsers:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load users';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        // Redirect to login if unauthorized
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, { role: newRole });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiUsers className="mr-2" /> User Management
          </h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-10 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      disabled={user.role === 'superadmin'}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user.role === 'superadmin'}
                      className={`text-red-600 hover:text-red-900 mr-4 ${
                        user.role === 'superadmin' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={user.role === 'superadmin' ? 'Cannot delete super admin' : 'Delete user'}
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;