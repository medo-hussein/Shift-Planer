// Google Authentication Service
// Handles all Google OAuth related API calls
import apiClient from '../apiClient';

export const googleAuthService = {
  /**
   * Get Google OAuth URL for authentication
   */
  getAuthUrl: () => apiClient.get('/api/auth/google/url'),

  /**
   * Sign in with Google using ID token (client-side flow)
   */
  signInWithGoogle: (idToken) => apiClient.post('/api/auth/google/signin', { idToken }),

  /**
   * Link Google account to existing user
   */
  linkGoogleAccount: (idToken) => apiClient.post('/api/auth/google/link', { idToken }),

  /**
   * Unlink Google account from user
   */
  unlinkGoogleAccount: () => apiClient.post('/api/auth/google/unlink'),

  /**
   * Get Google authentication status
   */
  getGoogleStatus: () => apiClient.get('/api/auth/google/status')
};
