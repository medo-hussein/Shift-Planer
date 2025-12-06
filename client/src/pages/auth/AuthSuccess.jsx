// Authentication Success Page
// Handles successful Google OAuth callback
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AuthSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokenFromCallback } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        // Use AuthContext to set token and update user state
        setTokenFromCallback(token);
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => navigate('/dashboard'), 100);
        
      } catch (err) {
        setError('Authentication failed');
        console.error('Auth success error:', err);
      } finally {
        setLoading(false);
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate, setTokenFromCallback]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F72AF] dark:border-sky-400"></div>
          <p className="mt-4 text-[#112D4E] dark:text-sky-200">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-[#DBE2EF] dark:border-slate-700 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#112D4E] dark:text-sky-200 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-[#3F72AF] dark:bg-sky-700 text-white rounded-md hover:bg-[#274b74] dark:hover:bg-sky-600 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null; // Will redirect immediately
}
