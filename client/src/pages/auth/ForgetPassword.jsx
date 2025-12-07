import { useState } from "react";
import { Link } from "react-router";
import apiClient from "../../api/apiClient.js";
import { validateForgetPassword } from "../../utils/validation.js";
import { useTranslation } from "react-i18next";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { t } = useTranslation();

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
      setMessage(t("forgetPassword.successMessage"));
    } catch (err) {
      setError(err.response?.data?.message || t("forgetPassword.defaultError"));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] dark:bg-slate-950 py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-[#DBE2EF] dark:border-slate-700 space-y-6">

        <h2 className="text-center text-3xl font-extrabold text-[#112D4E] dark:text-sky-200">
          {t("forgetPassword.title")}
        </h2>
        <p className="text-center text-sm text-[#3F72AF] dark:text-sky-400">
          {t("forgetPassword.subtitle")}
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>

          <div>
            <label className="block text-sm font-medium text-[#112D4E] dark:text-slate-300">
              {t("forgetPassword.emailLabel")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-[#DBE2EF] dark:border-slate-600 rounded-md bg-[#F9F7F7] dark:bg-slate-800 text-[#112D4E] dark:text-slate-50 focus:outline-none focus:ring-[#3F72AF] focus:border-[#3F72AF] placeholder-gray-500 dark:placeholder-slate-400"
              placeholder={t("forgetPassword.emailPlaceholder")}
            />
          </div>

          {/* Success */}
          {message && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-800 dark:text-green-400">{message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-[#19283a] dark:bg-sky-700 text-white hover:bg-[#274b74] dark:hover:bg-sky-600 transition disabled:opacity-50"
          >
            {loading ? t("forgetPassword.sending") : t("forgetPassword.sendButton")}
          </button>

          <p className="text-center text-sm text-[#3F72AF] dark:text-sky-400">
            {t("forgetPassword.rememberPassword")}{" "}
            <Link to="/login" className="font-medium text-[#112D4E] dark:text-sky-300 hover:text-[#3F72AF] dark:hover:text-sky-200">
              {t("forgetPassword.signIn")}
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}