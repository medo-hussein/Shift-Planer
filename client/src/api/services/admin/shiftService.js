import apiClient from "../../apiClient";

const BASE = "/api/shifts";

export const shiftService = {
  // Get all shifts for the admin's branch
  getBranchShifts: (params) => apiClient.get(`${BASE}/branch`, { params }),

  // Create a single shift (admin)
  createShift: (data) => apiClient.post(`${BASE}`, data),

  // Create multiple shifts in bulk
  createBulkShifts: (data) => apiClient.post(`${BASE}/bulk`, data),

  // Generate shifts using AI
  generateFromAI: (command) => apiClient.post(`${BASE}/ai-generate`, { command }),

  // Update a shift by id
  updateShift: (id, data) => apiClient.put(`${BASE}/${id}`, data),

  // Delete a shift by id
  deleteShift: (id) => apiClient.delete(`${BASE}/${id}`),

  // Employee endpoints (convenience)
  getMyShifts: () => apiClient.get(`${BASE}/me`),
  getTodayShifts: () => apiClient.get(`${BASE}/today`),
};

export default shiftService;