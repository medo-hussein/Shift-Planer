import { Navigate } from "react-router";

export default function ProtectedRoute({ 
  children,
  isAuthenticated
 }) {

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}