// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { FiShoppingCart, FiPackage, FiUsers, FiList, FiLogOut, FiHome } from 'react-icons/fi';

// const Header = () => {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const navigate = useNavigate();
  
//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   const isAuthenticated = !!localStorage.getItem('token');
//   const isAdmin = user?.role === 'admin';

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
    
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     navigate('/login');
//   };

//   // User navigation links
//   const userLinks = [
//     { name: 'Inventory', path: '/user/inventory', icon: <FiPackage className="mr-1" /> },
//     { name: 'Cart', path: '/user/cart', icon: <FiShoppingCart className="mr-1" /> },
//     { name: 'Orders', path: '/user/orders', icon: <FiList className="mr-1" /> },
//   ];

//   // Admin navigation links
//   const adminLinks = [
//     { name: 'Dashboard', path: '/admin/dashboard', icon: <FiHome className="mr-1" /> },
//     { name: 'Inventory', path: '/admin/inventory', icon: <FiPackage className="mr-1" /> },
//     { name: 'Users', path: '/admin/users', icon: <FiUsers className="mr-1" /> },
//     { name: 'Orders', path: '/admin/orders', icon: <FiList className="mr-1" /> },
//   ];

//   const navLinks = isAdmin ? adminLinks : (isAuthenticated ? userLinks : []);

//   return (
//     <header 
//       className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//         isScrolled ? 'shadow-lg' : ''
//       } bg-gradient-to-r from-blue-600 to-blue-700 text-white`}
//     >
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center">
//             <span className="text-2xl font-bold text-white">InventoryPro</span>
//           </Link>

//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex items-center space-x-1">
//             {isAuthenticated ? (
//               <>
//                 {navLinks.map((link) => (
//                   <Link
//                     key={link.path}
//                     to={link.path}
//                     className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 hover:bg-opacity-30 transition-colors duration-200 flex items-center"
//                   >
//                     {link.icon}
//                     {link.name}
//                   </Link>
//                 ))}
//                 <div className="ml-4 flex items-center">
//                   <span className="text-sm text-blue-100 mr-4">
//                     {isAdmin ? 'Admin' : 'User'}: {user.name || 'User'}
//                   </span>
//                   <button
//                     onClick={handleLogout}
//                     className="flex items-center text-sm text-white hover:text-red-200 transition-colors duration-200"
//                   >
//                     <FiLogOut className="mr-1" />
//                     Logout
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <div className="flex items-center space-x-4">
//                 <Link
//                   to="/login"
//                   className="px-4 py-2 text-sm font-medium text-white border-2 border-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-4 py-2 text-sm font-medium text-blue-700 bg-white rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-sm"
//                 >
//                   Register
//                 </Link>
//               </div>
//             )}
//           </nav>

//         </div>
//       </div>

//     </header>
//   );
// };

// export default Header;















// Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiUsers, FiList, FiLogOut, FiHome } from 'react-icons/fi';
import Cookies from 'js-cookie';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  
  const [user, setUser] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check for both admin and user authentication
  const isAuthenticated = () => {
    // Check localStorage first for admin, then fall back to cookies
    return !!localStorage.getItem('adminJwtToken') || 
           !!Cookies.get('adminJwtToken') || 
           !!Cookies.get('userJwtToken');
  };
  
  // Load user data from storage on component mount and when auth state changes
  useEffect(() => {
    const loadUserData = () => {
      try {
        let userData = null;
        let isAdminUser = false;
        
        // Check localStorage first for admin data
        const adminData = localStorage.getItem('admin');
        const adminToken = localStorage.getItem('adminJwtToken');
        
        if (adminData && adminToken) {
          try {
            userData = JSON.parse(adminData);
            isAdminUser = true;
            console.log('Admin user loaded from localStorage:', userData);
          } catch (e) {
            console.error('Error parsing admin data from localStorage:', e);
          }
        }
        
        // If not an admin, check for regular user
        if (!userData) {
          const userCookie = Cookies.get('user');
          const userToken = Cookies.get('userJwtToken');
          
          if (userCookie && userToken) {
            try {
              userData = JSON.parse(userCookie);
              isAdminUser = userData.role === 'admin';
              console.log('User loaded from cookies:', userData);
            } catch (e) {
              console.error('Error parsing user data from cookie:', e);
            }
          }
        }
        
        // Update state if we have user data
        if (userData) {
          setUser(userData);
          setIsAdmin(isAdminUser);
          
          // If user is admin but not on an admin route, redirect to admin dashboard
          if (isAdminUser && !window.location.pathname.startsWith('/admin')) {
            navigate('/admin/dashboard', { replace: true });
          }
          // If user is not admin but on an admin route, redirect to user inventory
          else if (!isAdminUser && window.location.pathname.startsWith('/admin')) {
            navigate('/user/inventory', { replace: true });
          }
        } else {
          // No user data found, clear any potential stale data
          setUser({});
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in auth check:', error);
      }
    };
    
    // Initial load
    loadUserData();
    
    // Set up an event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'adminJwtToken' || e.key === 'admin' || 
          e.key === 'userJwtToken' || e.key === 'user') {
        loadUserData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    // Clear all auth-related data from both localStorage and cookies
    const authItems = ['userJwtToken', 'adminJwtToken', 'user', 'admin'];
    
    // Clear from cookies
    authItems.forEach(item => Cookies.remove(item));
    
    // Clear from localStorage
    authItems.forEach(item => localStorage.removeItem(item));
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any remaining localStorage items (except for non-auth items if needed)
    // localStorage.clear(); // Uncomment this if you want to clear everything
    
    // Update local state
    setUser({});
    setIsAdmin(false);
    
    console.log('User logged out. Auth data cleared.');
    
    // Redirect to login page with a small delay to ensure cleanup completes
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // Navigation links configuration
  const navLinks = [
    // Admin-only links
    ...(isAdmin ? [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <FiHome className="icon" /> },
      { name: 'Inventory', path: '/admin/inventory', icon: <FiPackage className="icon" /> },
      { name: 'Users', path: '/admin/users', icon: <FiUsers className="icon" /> },
      { name: 'Orders', path: '/admin/orders', icon: <FiList className="icon" /> },
    ] : 
    // Regular user links
    isAuthenticated() ? [
      { name: 'Inventory', path: '/user/inventory', icon: <FiPackage className="icon" /> },
      { name: 'Cart', path: '/user/cart', icon: <FiShoppingCart className="icon" /> },
      { name: 'Orders', path: '/user/orders', icon: <FiList className="icon" /> },
    ] : []),
  ];
  
  // Debug log for navigation links
  useEffect(() => {
    console.log('Navigation links updated:', { 
      isAuthenticated, 
      isAdmin, 
      navLinks,
      userRole: user?.role 
    });
  }, [isAuthenticated, isAdmin, navLinks, user?.role]);

  return (
    <>
      {/* Inline CSS inside Header.jsx */}
      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #1e40af;
          color: white;
          z-index: 1000;
          transition: all 0.3s ease;
          height: 60px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header.scrolled {
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .header-container {
          max-width: 100%;
          margin: 0;
          padding: 0 1.5rem;
          height: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 22px;
          font-weight: bold;
          color: white;
          text-decoration: none;
          margin-right: auto; /* Pushes other content to the right */
        }
        .nav {
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 100%;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          color: white;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.2s ease;
          height: 100%;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .user-info {
          display: flex;
          align-items: center;
          margin-left: 1rem;
          gap: 0.5rem;
          height: 100%;
          padding: 0 0.5rem;
        }
        .username {
          font-size: 14px;
          color: #e0e7ff;
        }
        .logout-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .logout-btn:hover {
          color: #ffcccc;
        }
        .auth-buttons {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          height: 100%;
        }
        .login-btn {
          padding: 6px 12px;
          border: 2px solid white;
          border-radius: 6px;
          color: white;
          text-decoration: none;
          transition: 0.2s;
        }
        .login-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .register-btn {
          padding: 6px 12px;
          background: white;
          color: #1e40af;
          border-radius: 6px;
          text-decoration: none;
          transition: 0.2s;
        }
        .register-btn:hover {
          background: #f3f4f6;
        }
        .icon {
          margin-right: 4px;
        }
      `}</style>

      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo - Aligned to left corner */}
          <Link to="/" className="logo">
            InventoryPro
          </Link>

          {/* Navigation - Aligned to right */}
          <nav className="nav">
            {isAuthenticated() ? (
              <>
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="nav-link">
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
                <div className="user-info">
                  <span className="username">
                    {isAdmin ? '👑 Admin' : '👤 User'}: {user.name || 'User'}
                  </span>
                  <button onClick={handleLogout} className="logout-btn">
                    <FiLogOut className="icon" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-btn">Login</Link>
                <Link to="/register" className="register-btn">Register</Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;



