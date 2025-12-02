import { Navigate, useLocation } from "react-router";

export default function ResetPasswordRoute({ children }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  // Only allow if token exists
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
