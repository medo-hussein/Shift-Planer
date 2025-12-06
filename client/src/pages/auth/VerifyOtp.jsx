import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function VerifyOtp() {
  const { user, verifyOtp, resendOtp, status } = useAuth();
  const pendingEmail = localStorage.getItem("pendingEmail");

  const emailToUse = user?.email || pendingEmail;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") navigate("/dashboard");
    if (status === "unauthenticated") navigate("/login");
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp) return setError("Please enter the OTP");
    if (!emailToUse) return setError("No email found. Please register again.");

    setLoading(true);

    const result = await verifyOtp(emailToUse, otp);

    if (result.success) {
      setSuccess(result.message);
      localStorage.removeItem("pendingEmail");

      const selectedPlan = localStorage.getItem("selectedPlan");
      if (selectedPlan) {
        localStorage.removeItem("selectedPlan"); // Clear it
        setTimeout(() => navigate(`/dashboard/subscription?plan=${selectedPlan}`), 800);
      } else {
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    if (!emailToUse) return setError("No email found.");

    const result = await resendOtp(emailToUse);
    if (result.success) setSuccess(result.message);
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-[#e1e4eb] dark:border-slate-700">

        <div>
          <h2 className="text-center text-2xl font-extrabold text-[#112D4E] dark:text-sky-200">
            Verify Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-[#3F72AF] dark:text-sky-400">
            Enter the OTP sent to <span className="font-medium">
              {emailToUse}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#112D4E] dark:text-slate-300">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md bg-[#DBE2EF]/40 dark:bg-slate-800 text-[#112D4E] dark:text-slate-50 border-[#DBE2EF] dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3F72AF] placeholder-gray-500 dark:placeholder-slate-400"
              placeholder="Enter OTP"
            />
          </div>

          {error && <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400 text-center">{error}</div>}
          {success && <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-400 text-center">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-semibold rounded-md bg-[#19283a] dark:bg-sky-700 text-white hover:bg-[#274b74] dark:hover:bg-sky-600 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <p className="text-center text-sm text-[#3F72AF] dark:text-sky-400">
            Didn't receive OTP?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-[#112D4E] dark:text-sky-300 hover:text-[#3F72AF] dark:hover:text-sky-200"
            >
              Resend OTP
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
