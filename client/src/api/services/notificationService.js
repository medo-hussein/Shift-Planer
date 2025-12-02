import apiClient from "../apiClient";

export const notificationService = {
  getAll: () => apiClient.get("/api/notifications"),
  markRead: (ids = []) => apiClient.put("/api/notifications/read", { notificationIds: ids }),
  sendAnnouncement: (data) => apiClient.post("/api/notifications/announce", data),
};