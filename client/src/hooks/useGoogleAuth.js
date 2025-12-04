// Google Authentication Hook
// Handles Google Sign-In logic and state management
import { useState } from 'react';
import { googleAuthService } from '../api/services/googleAuthService';

// Global flag to prevent multiple simultaneous FedCM requests
let isGoogleAuthInProgress = false;

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);

  /**
   * Initialize Google Sign-In
   */
  const initializeGoogleSignIn = () => {
    if (window.google && !isInitialized) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        setIsInitialized(true);
        console.log('Google Sign-In initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        setError('Google Sign-In configuration error. Please check your OAuth settings.');
      }
    } else if (!window.google) {
      console.warn('Google SDK not loaded yet');
    }
  };

  /**
   * Handle Google Sign-In response
   */
  const handleGoogleSignIn = async (response) => {
    // Prevent multiple simultaneous requests
    if (isGoogleAuthInProgress) {
      console.log('Google authentication already in progress, ignoring duplicate request');
      return;
    }

    try {
      isGoogleAuthInProgress = true;
      setLoading(true);
      setError('');

      const result = await googleAuthService.signInWithGoogle(response.credential);

      if (result.data.success) {
        // Call success callback if provided
        if (successCallback) {
          successCallback(result.data);
        }
        return { success: true, data: result.data };
      } else {
        setError(result.data.message || 'Google sign-in failed');
        return { success: false, error: result.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Google sign-in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      isGoogleAuthInProgress = false;
    }
  };

  /**
   * Set success callback for Google Sign-In
   */
  const setSuccessHandler = (callback) => {
    setSuccessCallback(() => callback);
  };

  /**
   * Render Google Sign-In button
   */
  const renderGoogleSignInButton = (buttonElementId, options = {}) => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById(buttonElementId),
        {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 400,
          ...options
        }
      );
    }
  };

  /**
   * Link Google account to existing user
   */
  const linkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError('');

      // This would be called after successful Google Sign-In
      // Implementation depends on your flow
      const result = await googleAuthService.linkGoogleAccount(/* idToken */);

      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to link Google account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unlink Google account
   */
  const unlinkGoogleAccount = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await googleAuthService.unlinkGoogleAccount();

      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to unlink Google account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get Google authentication status
   */
  const getGoogleStatus = async () => {
    try {
      const result = await googleAuthService.getGoogleStatus();
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get Google status';
      return { success: false, error: errorMessage };
    }
  };

  return {
    loading,
    error,
    isInitialized,
    initializeGoogleSignIn,
    handleGoogleSignIn,
    setSuccessHandler,
    renderGoogleSignInButton,
    linkGoogleAccount,
    unlinkGoogleAccount,
    getGoogleStatus,
    clearError: () => setError('')
  };
};
