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
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-[#DBE2EF]">

        {/* Header */}
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-[#112D4E]">
            Welcome Back to <span className="text-[#3F72AF]">Tadbire</span>
          </h2>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#112D4E]">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] rounded-md bg-[#F9F7F7] text-[#112D4E] placeholder-gray-400 focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF] sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#112D4E]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] rounded-md bg-[#F9F7F7] text-[#112D4E] placeholder-gray-400 focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF] sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <div className="text-right">
            <Link
              to="/forget-password"
              className="text-sm font-medium text-[#3F72AF] hover:text-[#112D4E]"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#19283a] hover:bg-[#274b74] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3F72AF] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
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
            <p className="text-sm text-[#3F72AF]">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-[#112D4E] hover:text-[#3F72AF]"
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
