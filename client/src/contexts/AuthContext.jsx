import { createContext, useState, useContext, useEffect } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("unauthenticated");
  // unauthenticated | pending_verification | authenticated

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const pendingEmail = localStorage.getItem("pendingEmail");

    // Case 1 — pending registration (OTP)
    if (pendingEmail && !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("pending_verification");
      setLoading(false);
      return;
    }

    // Case 2 — not logged in
    if (!token) {
      setLoading(false);
      return;
    }

    // Case 3 — logged in: we MUST fetch user before loading=false
    setLoading(true);
    apiClient.defaults.headers.Authorization = `Bearer ${token}`;

    apiClient
      .get("/api/auth/profile")
      .then(({ data }) => {
        setUser(data);
        setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        setStatus("unauthenticated");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Listen for auth-update fired by interceptor
  useEffect(() => {
    function handleAuthUpdate(e) {
      if (e.detail) {
        setUser(e.detail);
        setStatus("authenticated");

        // Remove pendingEmail when user becomes verified/authenticated
        localStorage.removeItem("pendingEmail");
      }
    }

    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, []);

  // Register → pending verification
  const register = async (companyName, name, email, password) => {
    try {
      const { data } = await apiClient.post("/api/auth/register-super-admin", {
        companyName,
        name,
        email,
        password,
      });

      if (data.success) {
        setUser(data.data);
        setStatus("pending_verification");
        localStorage.setItem("pendingEmail", email);
        return { success: true, message: data.message };
      }

      return { success: false, error: data.message || "Registration failed" };
    } catch (err) {
      const backendMessage = err.response?.data?.message || "";
      if (backendMessage.includes("E11000")) {
        return { success: false, error: "Company name or email already in use." };
      }
      return { success: false, error: backendMessage || "Registration failed" };
    }
  };

  // OTP verification
  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await apiClient.post("/api/auth/verify-email", { email, otp });

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        setAccessToken(data.accessToken);
        apiClient.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        setUser(data.user);
        setStatus("authenticated");

        // Remove pending email after success
        localStorage.removeItem("pendingEmail");

        return { success: true, message: "Account verified!" };
      }

      return { success: false, error: data.message || "OTP verification failed" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "OTP verification failed",
      };
    }
  };

  // Resend OTP
  const resendOtp = async (email) => {
    try {
      const { data } = await apiClient.post("/api/auth/resend-verification", { email });
      return { success: true, message: data.message || "OTP sent!" };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to resend OTP",
      };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const { data } = await apiClient.post("/api/auth/login", { email, password });

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        setAccessToken(data.accessToken);
        apiClient.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        setUser(data.user);
        setStatus("authenticated");

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

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        status,
        register,
        verifyOtp,
        resendOtp,
        login,
        logout,
        loading,
        isAuthenticated: status === "authenticated",
        userRole: user?.role,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
