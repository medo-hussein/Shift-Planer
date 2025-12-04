// Authentication Error Page
// Handles failed Google OAuth callback
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export default function AuthError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [message] = useState(() => {
    const errorMessage = searchParams.get('message') || 'Authentication failed';
    return decodeURIComponent(errorMessage);
  });

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-[#DBE2EF] text-center">
        {/* Error Icon */}
        <div className="text-red-600 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-[#112D4E] mb-4">Authentication Failed</h2>
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBackToLogin}
            className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-[#3F72AF] hover:bg-[#274b74] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3F72AF]"
          >
            Back to Login
          </button>
          
          <button
            onClick={() => window.location.href = 'https://accounts.google.com/o/oauth2/auth?client_id=' + import.meta.env.VITE_GOOGLE_CLIENT_ID + '&redirect_uri=' + encodeURIComponent(window.location.origin + '/api/auth/google/callback') + '&response_type=code&scope=openid%20email%20profile&access_type=offline'}
            className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-[#112D4E] border border-[#DBE2EF] bg-white hover:bg-[#F9F7F7] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3F72AF]"
          >
            Try Google Sign-In Again
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Make sure you're using a valid Google account</li>
            <li>• Check that your browser allows pop-ups from this site</li>
            <li>• Try clearing your browser cache and cookies</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
