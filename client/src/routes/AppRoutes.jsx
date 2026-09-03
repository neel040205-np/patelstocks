import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SecurityPinGuard from '../components/SecurityPinGuard';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ClientDashboard from '../pages/client/ClientDashboard';
import Portfolio from '../pages/client/Portfolio';
import ClientPayments from '../pages/client/ClientPayments';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Clients from '../pages/admin/Clients';
import ClientDetails from '../pages/admin/ClientDetails';
import ClientLayout from '../layouts/ClientLayout';
import AdminLayout from '../layouts/AdminLayout';

// Guard for protected routes (Enforces 4-Digit Security PIN)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If client tries to access admin routes, redirect to client dashboard
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'} replace />;
  }

  return <SecurityPinGuard>{children}</SecurityPinGuard>;
};

// Guard for login/signup pages (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected Client Routes */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientLayout>
              <ClientDashboard />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/portfolio"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientLayout>
              <Portfolio />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/payments"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientLayout>
              <ClientPayments />
            </ClientLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <Clients />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <ClientDetails />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback redirection */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
