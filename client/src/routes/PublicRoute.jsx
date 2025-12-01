import { Navigate } from "react-router";

// This component redirects to dashboard if user is already authenticated
export default function PublicRoute({ children, isAuthenticated }) {
  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not authenticated, show the public page
  return children;
}