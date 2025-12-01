import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from "../../contexts/AuthContext.jsx";
import { validateRegister } from "../../utils/validation.js";

export default function Register() {
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Remove field error when user types
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccess("");

    // Run validation
    const errors = validateRegister(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return; // Stop submit
    }

    setLoading(true);

    const result = await register(
      form.companyName,
      form.name,
      form.email,
      form.password
    );

    if (result.success) {
      setSuccess(result.message || "Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } else {
      setGlobalError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-[#e1e4eb]">

        <div>
          <h2 className="text-center text-2xl font-extrabold text-[#112D4E]">
            Create your Tadbire account
          </h2>
          <p className="mt-2 text-center text-sm text-[#3F72AF]">
            Already a member?{' '}
            <Link to="/login" className="font-medium text-[#112D4E] hover:text-[#3F72AF]">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-4">
            {[
              { id: "companyName", label: "Company Name", type: "text" },
              { id: "name", label: "Full Name", type: "text" },
              { id: "email", label: "Email", type: "email" },
              { id: "password", label: "Password", type: "password" },
              { id: "confirmPassword", label: "Confirm Password", type: "password" }
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-[#112D4E]">
                  {field.label}
                </label>

                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={form[field.id]}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border rounded-md bg-[#DBE2EF]/40 text-[#112D4E]
                    ${fieldErrors[field.id] ? "border-red-500" : "border-[#DBE2EF]"}
                    focus:outline-none focus:ring-2 focus:ring-[#3F72AF]`}
                />

                {fieldErrors[field.id] && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors[field.id]}</p>
                )}
              </div>
            ))}
          </div>

          {globalError && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-700 text-center">
              {globalError}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-100 p-3 text-sm text-green-700 text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-semibold rounded-md bg-[#19283a] text-white hover:bg-[#274b74] transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-[#3F72AF]">
            Back to{' '}
            <Link to="/" className="font-medium text-[#112D4E] hover:text-[#3F72AF]">
              Tadbire Home
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}
