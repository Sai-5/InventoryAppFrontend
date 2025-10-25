import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCookie } from '../../utils/cookies';

const ProtectedRoute = () => {
  const { currentUser, loading, setUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for user token in cookies
        const userToken = getCookie('userJwtToken');
        
        if (userToken) {
          // If we have a token but no current user, set the user
          if (!currentUser) {
            // You might want to verify the token with your backend here
            // and set the user in the auth context
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // If token is invalid, clear it
              document.cookie = 'userJwtToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [currentUser, setUser]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, render the child routes
  // Otherwise, redirect to login page with the return url
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate 
      to="/login" 
      replace 
      state={{ 
        from: location.pathname,
        message: 'Please log in to access this page.'
      }} 
    />
  );
};

export default ProtectedRoute;
