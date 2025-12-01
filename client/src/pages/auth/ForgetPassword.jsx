import { useState } from "react";
import { Link } from "react-router";
import apiClient from "../../api/apiClient.js";
import { validateForgetPassword } from "../../utils/validation.js";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // run validation first
    const errors = validateForgetPassword(email);
    if (errors.email) {
      setError(errors.email);
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.post("/api/auth/forget-password", { email });
      setMessage("A reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-[#DBE2EF] space-y-6">

        <h2 className="text-center text-3xl font-extrabold text-[#112D4E]">
          Forgot Password
        </h2>
        <p className="text-center text-sm text-[#3F72AF]">
          Enter your email and check your mail please ?
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>

          <div>
            <label className="block text-sm font-medium text-[#112D4E]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] rounded-md bg-[#F9F7F7] text-[#112D4E] focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF]"
              placeholder="Enter your email"
            />
          </div>

          {/* Success */}
          {message && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-[#19283a] text-white hover:bg-[#274b74] transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center text-sm text-[#3F72AF]">
            Remember your password?{" "}
            <Link to="/login" className="font-medium text-[#112D4E] hover:text-[#3F72AF]">
              Sign in
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}
