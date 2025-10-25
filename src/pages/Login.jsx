import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from "../services/auth";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path and reason from location state
  const message = location.state?.message;
  const redirectReason = location.state?.redirectReason;

  let from = "/user/inventory"; // Default redirect
  if (location.state?.from) {
    from = typeof location.state.from === 'string' 
      ? location.state.from 
      : location.state.from?.pathname || "/user/inventory";
  }
  
  // Show message if redirected with one
  useEffect(() => {
    if (message) {
      toast[message.includes('error') ? 'error' : 'info'](message, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Clear the message from state to prevent showing it again on refresh
      const state = { ...location.state };
      delete state.message;
      navigate(location.pathname, { state, replace: true });
    }
  }, [message, location.state, location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      // Call the auth service to login
      const response = await authService.login({
        email: form.email,
        password: form.password
      });

      if (!response || !response.token) {
        throw new Error('No response or token received from server');
      }

      // Store the token in localStorage and cookie
      const isAdmin = response.user?.role === 'admin';
      const tokenKey = isAdmin ? 'adminJwtToken' : 'userJwtToken';
      
      // Store token in both localStorage and cookie
      localStorage.setItem(tokenKey, response.token);
      document.cookie = `${tokenKey}=${response.token}; Path=/; Secure; SameSite=Strict`;
      
      // Store user data in localStorage
      if (response.user) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          isAdmin: isAdmin
        };
        localStorage.setItem(isAdmin ? 'admin' : 'user', JSON.stringify(userData));
      }
      
      // Trigger a custom event to notify about auth changes
      window.dispatchEvent(new Event('storage'));
      
      toast.success("Login successful! Redirecting...", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Determine where to redirect
      let finalRedirectTo = from;
      
      // If no specific redirect was set, use default based on role
      if (!finalRedirectTo || finalRedirectTo === '/') {
        finalRedirectTo = isAdmin ? '/admin/dashboard' : '/user/inventory';
      }
      
      console.log('Login successful, isAdmin:', isAdmin, 'redirecting to:', finalRedirectTo);
      
      // If coming from checkout, ensure we go to placeorder
      const isCheckoutFlow = redirectReason === 'checkout' || 
                          location.state?.redirectReason === 'checkout' ||
                          sessionStorage.getItem('returnTo') === '/placeorder';
      
      if (isCheckoutFlow) {
        finalRedirectTo = '/placeorder';
        console.log('Checkout flow detected, redirecting to placeorder');
      }
      
      console.log('Login successful, redirecting to:', finalRedirectTo);
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        // Don't clear cart data if we're in checkout flow
        if (!isCheckoutFlow) {
          console.log('Not in checkout flow, clearing cart data');
          sessionStorage.removeItem('checkoutCart');
          sessionStorage.removeItem('returnTo');
          localStorage.removeItem('pendingCart');
        } else {
          console.log('In checkout flow, preserving cart data for restoration');
        }
        
        // Force a full page reload to ensure all context is properly initialized
        if (isCheckoutFlow) {
          window.location.href = finalRedirectTo;
        } else {
          navigate(finalRedirectTo, { 
            replace: true,
            state: { 
              from: location.state?.from,
              redirectReason: isCheckoutFlow ? 'checkout' : undefined
            }
          });
        }
      }, 1500);
      
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your internet connection.";
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-600">Sign in to access your account</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <a
                    href="#"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with Google</span>
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  </a>
                </div>

                <div>
                  <a
                    href="#"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with GitHub</span>
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.195 20 14.43 20 10.017 20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default LoginPage;
