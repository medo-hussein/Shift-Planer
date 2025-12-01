import { Navigate } from "react-router";
import {useAuth} from "../contexts/AuthContext.jsx";

export default function OtpRoute({ children }) {
  const { loading, status } = useAuth();
  const pendingEmail = localStorage.getItem("pendingEmail");

  if (loading) return null;

  if (status === "pending_verification" || pendingEmail) {
    return children;
  }

  return <Navigate to="/login" replace />;
}