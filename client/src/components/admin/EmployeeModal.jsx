import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Briefcase, Lock, Eye, EyeOff } from "lucide-react";

const EmployeeModal = ({ employee, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    position: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        password: "",
        phone: employee.phone || "",
        position: employee.position || ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        position: ""
      });
    }
  }, [employee]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

    if (!employee && !formData.password) newErrors.password = "Password is required";
    else if (!employee && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!formData.position.trim()) newErrors.position = "Position is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = { ...formData };
      if (employee && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      onSubmit(dataToSubmit);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <User className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {employee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {employee ? 'Update employee information' : 'Add a new team member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 max-h-[70vh] overflow-y-auto dark:bg-slate-800">
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 ${errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 disabled:dark:bg-slate-600 ${errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  disabled={!!employee}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {/* Password - Only for new employees */}
            {!employee && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 ${errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 ${errors.phone ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Position *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Manager, Cashier, Sales"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 ${errors.position ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                />
              </div>
              {errors.position && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.position}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700 mt-4 dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm"
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;