import React, { createContext, useState, useContext, useEffect } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      setAccessToken(token);
      console.log("token on reload:", localStorage.getItem("accessToken"));

      apiClient
        .get("/api/users/me")
        .then(({ data }) => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
          setAccessToken(null);
        })
        .finally(() => {
          setLoading(false);
        });

    } else {
      setLoading(false);
    }

  }, []);


  // Listen for refreshed user data (from interceptor)
  useEffect(() => {
    const handler = (e) => {
      setUser(e.detail);
    };

    window.addEventListener("auth-update", handler);
    return () => window.removeEventListener("auth-update", handler);
  }, []);

  // Register
  const register = async (companyName, name, email, password) => {
    try {
      const { data } = await apiClient.post("/api/auth/register", {
        companyName,
        name,
        email,
        password,
      });

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);

        return { success: true, message: data.message };
      }

      return { success: false, error: data.message || "Registration failed" };
    } catch (err) {
      const backendMessage = err.response?.data?.message || "";

      //  Handle duplicate key (company name or email already exists)
      if (backendMessage.includes("E11000")) {
        return {
          success: false,
          error: "This company name or email is already in use.",
        };
      }

      return {
        success: false,
        error: backendMessage || "Registration failed",
      };
    }
  };


  // Login
  const login = async (email, password) => {
    try {
      const { data } = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);

        return { success: true, message: data.message };
      }

      return { success: false, error: data.message || "Login failed" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  const value = {
    user,
    accessToken,
    register,
    login,
    logout,
    loading,
    isAuthenticated: !!accessToken,
    userRole: user?.role, // superAdmin | admin | employee
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
