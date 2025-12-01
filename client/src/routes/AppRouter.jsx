import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import routesConfig from "./routesConfig";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Navbar from "../components/Navbar.jsx";

import Home from "../pages/Home";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import ForgetPassword from "../pages/auth/ForgetPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import VerifyOtp from "../pages/auth/VerifyOtp.jsx";

import OtpRoute from "./OtpRoute.jsx";
import ResetPasswordRoute from "./ResetPasswordRoute.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AppRouter() {
  const { loading } = useAuth();

  // Wait for AuthContext to finish loading during refresh
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <RoutesWrapper />
    </BrowserRouter>
  );
}

function RoutesWrapper() {
  const { isAuthenticated, userRole, status } = useAuth();

  // Prevent empty navbar + missing routes after refresh
  if (isAuthenticated && !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading user...</div>
      </div>
    );
  }

  return <AppRoutes />;
}

function AppRoutes() {
  const { isAuthenticated, userRole, status } = useAuth();
  const roleRoutes = routesConfig[userRole] || [];

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Home />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/forget-password"
        element={
          <PublicRoute
            isAuthenticated={isAuthenticated}
            status={status}
            allowForgetPassword
          >
            <ForgetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <ResetPasswordRoute isAuthenticated={isAuthenticated}>
            <ResetPassword />
          </ResetPasswordRoute>
        }
      />

      <Route
        path="/verify-otp"
        element={
          <OtpRoute status={status}>
            <VerifyOtp />
          </OtpRoute>
        }
      />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <VerifiedRoute
              status={status}
              userRole={userRole}
              roleRoutes={roleRoutes}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function VerifiedRoute({ status }) {
  if (status === "pending_verification") {
    return <Navigate to="/verify-otp" replace />;
  }

  return <MainAppLayout />;
}

function MainAppLayout() {
  const { userRole } = useAuth();
  const roleRoutes = routesConfig[userRole] || [];

  if (!userRole) return null; // prevent navbar flicker

  return (
    <div>
      <Navbar role={userRole} />

      <div>
        <Routes>
          {roleRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.element />}
            />
          ))}

          {/* Fallback for unknown protected routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
