import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function PublicRoute({ children }) {
  const { isAuthenticated, status, loading } = useAuth();

  // ❗ Prevent ALL redirects until auth finishes
  if (loading) return null;

  // ❗ If user just registered → force to OTP page
  if (status === "pending_verification") {
    if (window.location.pathname !== "/verify-otp") {
      return <Navigate to="/verify-otp" replace />;
    }
    return children; // allow OTP page
  }

  // ❗ If authenticated → dashboard (EXCEPT for Home page "/")
  if (isAuthenticated && window.location.pathname !== "/") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
