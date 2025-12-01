// client/src/api/services/authService.js
import apiClient from "../apiClient";

export const authService = {
  getProfile: () => apiClient.get("/api/auth/profile"),
  
  updateProfile: (data) => apiClient.put("/api/auth/profile", data),
};