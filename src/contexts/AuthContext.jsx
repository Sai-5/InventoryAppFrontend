import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCookie, removeCookie } from '../utils/cookies';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const userToken = getCookie('userJwtToken');
        const adminToken = getCookie('adminJwtToken') || localStorage.getItem('adminJwtToken');
        
        // Check admin token first
        if (adminToken) {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              if (userData.role === 'admin') {
                setCurrentUser(userData);
                setIsAdmin(true);
                // Ensure token is properly set in both cookie and localStorage
                localStorage.setItem('adminJwtToken', adminToken);
                document.cookie = `adminJwtToken=${adminToken}; Path=/; Secure; SameSite=Strict`;
                return;
              } else {
                // Not an admin, clear the token
                localStorage.removeItem('adminJwtToken');
                removeCookie('adminJwtToken');
              }
            } else {
              // Clear invalid token
              localStorage.removeItem('adminJwtToken');
              removeCookie('adminJwtToken');
            }
          } catch (err) {
            console.error('Error checking admin auth:', err);
            localStorage.removeItem('adminJwtToken');
            removeCookie('adminJwtToken');
          }
        }
        
        // Check regular user token if no valid admin token
        if (userToken) {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              setCurrentUser(userData);
              setIsAdmin(false);
            } else {
              // Clear invalid token
              removeCookie('userJwtToken');
            }
          } catch (err) {
            console.error('Error checking user auth:', err);
            removeCookie('userJwtToken');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        toast.error('Authentication check failed');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if the response has the expected structure
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }

      const userData = data.user;
      const isAdminUser = userData.role === 'admin';
      
      // Set the appropriate token based on user role
      if (isAdminUser) {
        localStorage.setItem('adminJwtToken', data.token);
        document.cookie = `adminJwtToken=${data.token}; Path=/; Secure; SameSite=Strict`;
        console.log('Admin token set in localStorage and cookie');
      } else {
        document.cookie = `userJwtToken=${data.token}; Path=/; Secure; SameSite=Strict`;
      }
      
      // Update the auth context
      setCurrentUser(userData);
      setIsAdmin(isAdminUser);
      
      console.log('Login successful, isAdmin:', isAdminUser);
      return { 
        success: true, 
        isAdmin: isAdminUser,
        user: userData,
        token: data.token 
      };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove all auth tokens
    removeCookie('userJwtToken');
    removeCookie('adminJwtToken');
    localStorage.removeItem('adminJwtToken');
    
    // Clear any cached user data
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    
    // Reset state
    setCurrentUser(null);
    setIsAdmin(false);
    
    // Notify user
    toast.success('Successfully logged out');
    
    // Redirect to login page after logout
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login';
    }
  };

  // Create the context value object
  const contextValue = {
    currentUser,
    isAdmin,
    loading,
    login,
    logout,
    setUser: setCurrentUser, // Expose setCurrentUser as setUser
    setCurrentUser // Also expose as setCurrentUser for backward compatibility
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
