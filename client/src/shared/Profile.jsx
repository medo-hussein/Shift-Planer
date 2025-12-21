import { useEffect, useState } from "react";
import { authService } from "../api/services/authService";
import { dashboardService } from "../api/services/admin/dashboardService";
import LocationMapModal from "../components/admin/LocationMapModal";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Camera,
  Save,
  MapPin,
} from "lucide-react";
import { Alert } from "../utils/alertService.js";
import { useTranslation } from "react-i18next";
import DashboardSkeleton from "../utils/DashboardSkeleton.jsx";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  // Fetch Data
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await authService.getProfile();
      const data = res.data.data || res.data;
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Data (Text)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.updateProfile(formData);
      setProfile({ ...profile, ...formData });
      window.dispatchEvent(
        new CustomEvent("auth-update", { detail: { ...profile, ...formData } })
      );
      Alert.success(t("profile.alerts.updateSuccess"));
    } catch (err) {
      Alert.error(t("profile.alerts.updateFailed"));
    } finally {
      setLoading(false)
    }
  };

  // Save new location
  const handleSaveLocation = async (locationData) => {
    try {
      setLoading(true);
      await dashboardService.updateBranchLocation(locationData);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        branch_location: locationData
      }));
      
      Alert.success("Branch location updated successfully");
      setIsMapOpen(false);
    } catch (err) {
      console.error(err);
      Alert.error("Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Upload (Base64)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        setLoading(true);
        const base64Image = reader.result;

        await authService.updateProfile({ ...formData, avatar: base64Image });

        setProfile({ ...profile, avatar: base64Image });
      } catch (err) {
        Alert.error(t("profile.alerts.imageUploadFailed"));
      } finally {
        setLoading(false);
      }
    };
  };

  const getRoleTranslation = (role) => {
    switch (role) {
      case 'super_admin': return t("profile.roles.superAdmin");
      case 'branch_admin': return t("profile.roles.branchAdmin");
      case 'employee': return t("profile.roles.employee");
      default: return role.replace("_", " ").toUpperCase();
    }
  };
  
  if(loading) return <DashboardSkeleton />
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900 p-6 md:p-10 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 1. Header Section */}
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="h-40 bg-linear-to-r from-[#112D4E] to-[#3F72AF]"></div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
              {/* Avatar & Camera Button */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl overflow-hidden">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={t("profile.avatarAlt")}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-slate-500 dark:text-slate-400 uppercase">
                      {profile.name?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <label className="absolute bottom-2 right-2 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-md text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer hover:scale-110">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    aria-label={t("profile.buttons.uploadImage")}
                  />
                </label>
              </div>

              <div className="flex-1 mb-2 h-16">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {profile.name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    <Shield size={14} />{" "}
                    {getRoleTranslation(profile.role)}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                    {t("profile.status.active")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 2. Left Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
                {t("profile.accountDetails")}
              </h3>
              <div className="space-y-4">
                <InfoRow
                  icon={<Mail size={18} />}
                  label={t("profile.fields.email")}
                  value={profile.email}
                />
                <InfoRow
                  icon={<Calendar size={18} />}
                  label={t("profile.fields.joined")}
                  value={
                    profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(i18n.language)
                      : t("profile.fields.notAvailable")
                  }
                />
                <InfoRow
                  icon={<Clock size={18} />}
                  label={t("profile.fields.lastLogin")}
                  value={
                    profile.lastLogin
                      ? new Date(profile.lastLogin).toLocaleString(i18n.language)
                      : t("profile.fields.never")
                  }
                />
              </div>
            </div>

            {/* ✅ Location Settings Section - Visible only to Admin */}
            {profile.role === 'admin' && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
                  Location Settings (Geofencing)
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    {profile.branch_location?.lat 
                      ? "✅ Branch location is set. Employees can only clock in within the specified radius."
                      : "⚠️ Branch location not set. Please set it to enable geofencing attendance."}
                  </p>
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {profile.branch_location?.lat ? "Update Location" : "Set Location Now"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {t("profile.editProfile")}
                </h3>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label={t("profile.form.fullName")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    icon={<User size={18} />}
                  />
                  <FormInput
                    label={t("profile.form.phoneNumber")}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    icon={<Phone size={18} />}
                    type="tel"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-[#112D4E] hover:bg-[#274b74] text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  >
                    <Save size={18} /> {t("profile.buttons.saveChanges")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Map Modal */}
      <LocationMapModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentLocation={profile.branch_location}
        onSave={handleSaveLocation}
      />
    </div>
  );
}

// --- Helper Components ---

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
      <div className="text-slate-400 dark:text-slate-500">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-slate-700 dark:text-slate-300 font-medium">{value}</p>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, icon, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:text-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#3F72AF] focus:border-transparent outline-none transition bg-gray-50/30 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700"
        />
      </div>
    </div>
  );
}