import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import routesConfig from "./routesConfig";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Navbar from "../components/Navbar.jsx";
import PageLoader from "../components/PageLoader.jsx";

// Lazy load auth pages too for better initial load
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/auth/login"));
const Register = lazy(() => import("../pages/auth/register"));
const ForgetPassword = lazy(() => import("../pages/auth/ForgetPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword.jsx"));
const VerifyOtp = lazy(() => import("../pages/auth/VerifyOtp.jsx"));
const AuthSuccess = lazy(() => import("../pages/auth/AuthSuccess.jsx"));
const AuthError = lazy(() => import("../pages/auth/AuthError.jsx"));
const PaymentForm = lazy(() => import("../pages/Payment.jsx"));

import OtpRoute from "./OtpRoute.jsx";
import ResetPasswordRoute from "./ResetPasswordRoute.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import CalendarModal from "../components/CalendarModal.jsx";
import About from "../pages/Aboutus.jsx";
import ContactUs from "../pages/Contactus.jsx";

export default function AppRouter() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <BrowserRouter>
      <RoutesWrapper />
    </BrowserRouter>
  );
}

function RoutesWrapper() {
  return <AppRoutes />;
}

function AppRoutes() {
  const { isAuthenticated, userRole, status } = useAuth();
  const roleRoutes = routesConfig[userRole] || [];

  return (
    <Suspense fallback={<PageLoader />}>
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

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />

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

        {/* Google Auth Routes */}
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/auth/error" element={<AuthError />} />

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
    </Suspense>
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

  if (!userRole) return null;

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

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}