import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from "../../contexts/AuthContext.jsx";
import GoogleSignInButton from "../../components/GoogleSignInButton.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load Google SDK
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google SDK loaded');
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(form.email, form.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleGoogleSignInSuccess = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      // The authentication was successful and token/user data is handled by AuthContext
      navigate("/dashboard");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-[#DBE2EF] dark:border-slate-700">

        {/* Header */}
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-[#112D4E] dark:text-sky-200">
            Welcome Back to <span className="text-[#3F72AF] dark:text-sky-400">Tadbire</span>
          </h2>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#112D4E] dark:text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] dark:border-slate-600 rounded-md bg-[#F9F7F7] dark:bg-slate-800 text-[#112D4E] dark:text-slate-50 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF] sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#112D4E] dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] dark:border-slate-600 rounded-md bg-[#F9F7F7] dark:bg-slate-800 text-[#112D4E] dark:text-slate-50 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF] sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <div className="text-right">
            <Link
              to="/forget-password"
              className="text-sm font-medium text-[#3F72AF] dark:text-sky-400 hover:text-[#112D4E] dark:hover:text-sky-300"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#19283a] dark:bg-sky-700 hover:bg-[#274b74] dark:hover:bg-sky-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-[#3F72AF] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <GoogleSignInButton
              onSuccess={handleGoogleSignInSuccess}
              onError={handleGoogleSignInError}
              buttonId="google-signin-button"
              className="w-full"
              disabled={loading || googleLoading}
            />
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-[#3F72AF] dark:text-sky-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-[#112D4E] dark:text-sky-300 hover:text-[#3F72AF] dark:hover:text-sky-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
