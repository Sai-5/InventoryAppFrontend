import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import ItemDetailsPage from './pages/ItemDetails';
import AdminDashboard from './pages/Dashboard';
import AddEditItem from './pages/AddEditItem';
import AdminInventory from './pages/InventoryPage';
import NewItem from './pages/admin/NewItem';
import AdminOrders from './pages/admin/AdminOrders';
import Cart from './components/Cart';
import OrderSuccess from './pages/OrderSuccess';
import NotFoundPage from './pages/NotFound';
import AdminUsers from './pages/admin/Users';
import UserInventory from './pages/user/InventoryItems';
import UserOrders from './pages/user/UserOrders';
import OrderDetails from './pages/user/OrderDetails';

// Protected Route Components
import ProtectedRoute from './components/protected/ProtectedRoute';
import AdminRoute from './components/protected/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="unauthorized" element={<Unauthorized />} />
            <Route path="items/:id" element={<ItemDetailsPage />} />
            
            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="user">
                <Route path="cart" element={<Cart />} />
                <Route path="orders" element={<UserOrders />} />
                <Route path="orders/:orderId" element={<OrderDetails />} />
                <Route path="inventory" element={<UserInventory />} />
              </Route>
              <Route path="order/success/:orderId?" element={<OrderSuccess />} />
            </Route>
            
            {/* Admin Protected Routes */}
            <Route element={<AdminRoute />}>
              <Route path="admin">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="inventory">
                  <Route index element={<AdminInventory />} />
                  <Route path="new" element={<NewItem />} />
                  <Route path=":id" element={<ItemDetailsPage />} />
                  <Route path=":id/edit" element={<AddEditItem mode="edit" />} />
                </Route>
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:orderId" element={<OrderDetails adminView={true} />} />
              </Route>
            </Route>
            
            {/* 404 - Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
