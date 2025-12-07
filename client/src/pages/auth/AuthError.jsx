// Authentication Error Page
// Handles failed Google OAuth callback
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function AuthError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [message] = useState(() => {
    const errorMessage = searchParams.get('message') || t('authError.defaultMessage');
    return decodeURIComponent(errorMessage);
  });

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-[#DBE2EF] dark:border-slate-700 text-center">
        {/* Error Icon */}
        <div className="text-red-600 dark:text-red-400 mb-6">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-[#112D4E] dark:text-sky-200 mb-4">
          {t('authError.title')}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-8">{message}</p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBackToLogin}
            className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-[#3F72AF] dark:bg-sky-700 hover:bg-[#274b74] dark:hover:bg-sky-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-[#3F72AF]"
          >
            {t('authError.backToLogin')}
          </button>
          
          <button
            onClick={() => window.location.href = 'https://accounts.google.com/o/oauth2/auth?client_id=' + import.meta.env.VITE_GOOGLE_CLIENT_ID + '&redirect_uri=' + encodeURIComponent(window.location.origin + '/api/auth/google/callback') + '&response_type=code&scope=openid%20email%20profile&access_type=offline'}
            className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-[#112D4E] dark:text-sky-300 border border-[#DBE2EF] dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-[#F9F7F7] dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-[#3F72AF]"
          >
            {t('authError.tryAgain')}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            {t('authError.needHelp')}
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• {t('authError.helpTips.validAccount')}</li>
            <li>• {t('authError.helpTips.popups')}</li>
            <li>• {t('authError.helpTips.clearCache')}</li>
            <li>• {t('authError.helpTips.contactSupport')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}