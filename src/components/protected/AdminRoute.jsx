import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCookie } from '../../utils/cookies';

const AdminRoute = () => {
  const { currentUser, isAdmin: contextIsAdmin, loading, setUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // First check if we already have an admin user in context
        if (contextIsAdmin && currentUser?.role === 'admin') {
          console.log('Admin user already in context');
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Check for admin token in both cookies and localStorage
        const adminToken = getCookie('adminJwtToken') || localStorage.getItem('adminJwtToken');
        
        if (!adminToken) {
          console.log('No admin token found');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        try {
          console.log('Verifying admin token with backend...');
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log('Auth response status:', response.status);
          
          if (response.ok) {
            const responseData = await response.json();
            console.log('Response from /api/auth/me:', responseData);
            
            // Check if the response has the expected structure
            if (responseData.success && responseData.user) {
              const userData = responseData.user;
              console.log('User data from /api/auth/me:', userData);
              
              if (userData.role === 'admin') {
                console.log('Admin user verified:', userData);
                
                // Update the auth context with the admin user
                await setUser(userData);
                setIsAdmin(true);
                
                // Ensure the token is stored in both cookie and localStorage
                localStorage.setItem('adminJwtToken', adminToken);
                document.cookie = `adminJwtToken=${adminToken}; Path=/; Secure; SameSite=Strict`;
                
                // If we're not already on an admin route, redirect to dashboard
                if (!location.pathname.startsWith('/admin')) {
                  console.log('Redirecting to admin dashboard');
                  navigate('/admin/dashboard', { replace: true });
                }
                
                setIsLoading(false);
                return;
              } else {
                console.log('User is not an admin:', userData);
                throw new Error('User does not have admin privileges');
              }
            } else {
              console.log('Invalid response structure:', responseData);
              throw new Error('Invalid response from server');
            }
          } else {
            console.log('Failed to verify admin token, status:', response.status);
            throw new Error('Failed to verify admin token');
          }
        } catch (err) {
          console.error('Error verifying admin token:', err);
          localStorage.removeItem('adminJwtToken');
          document.cookie = 'adminJwtToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin authentication check failed:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [currentUser, contextIsAdmin, setUser, navigate, location.pathname]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ 
          from: location.pathname,
          message: 'Please log in to access the admin panel.'
        }} 
      />
    );
  }

  // If not an admin, show unauthorized
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If admin, render the admin routes
  return <Outlet />;
};

export default AdminRoute;
