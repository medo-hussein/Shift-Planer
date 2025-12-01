import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import routesConfig from "./routesConfig";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Home from "../pages/Home/Home";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import { useAuth } from "../contexts/AuthContext.jsx";
import ForgetPassword from "../pages/auth/ForgetPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import Navbar from "../components/Navbar.jsx";

export default function AppRouter() {
  const { isAuthenticated, userRole, loading } = useAuth();
  const roleRoutes = routesConfig[userRole] || [];

  if (loading || (isAuthenticated && !userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Home />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Register />
          </PublicRoute>
        } />

        <Route path="/forget-password" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <ForgetPassword />
          </PublicRoute>
        } />

        <Route path="/reset-password" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <ResetPassword />
          </PublicRoute>
        } />


        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

        {/* Main Protected Layout */}
        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainAppLayout userRole={userRole} roleRoutes={roleRoutes} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function MainAppLayout({ userRole, roleRoutes }) {
  return (
    <div className="">
      <Navbar role={userRole} />
      <div className="">
        <Routes>
          {roleRoutes.map(route => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.element />}
            />
          ))}
          {/* Redirect any unknown protected routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}