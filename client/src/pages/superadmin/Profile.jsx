import React, { useEffect, useState } from "react";
import { authService } from "../../api/services/authService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  User, Mail, Phone, Shield, Calendar, 
  Clock, Camera, Save
} from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const { show, hide } = useLoading();

  // Fetch Data
  const fetchProfile = async () => {
    try {
      show();
      const res = await authService.getProfile();
      const data = res.data.data || res.data; 
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Data (Text)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      show();
      await authService.updateProfile(formData);
      setProfile({ ...profile, ...formData });
      alert("Profile updated successfully!");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      hide();
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
        show();
        const base64Image = reader.result;
        
        await authService.updateProfile({ ...formData, avatar: base64Image });
        
        setProfile({ ...profile, avatar: base64Image });
        
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        alert("Failed to upload image. Try a smaller file.");
      } finally {
        hide();
      }
    };
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1. Header Section */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-40 bg-linear-to-r from-[#112D4E] to-[#3F72AF]"></div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
              
              {/* Avatar & Camera Button */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-500 uppercase">
                      {profile.name?.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Hidden File Input */}
                <label className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-md text-slate-600 hover:text-blue-600 transition cursor-pointer hover:scale-110">
                  <Camera size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="flex-1 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    <Shield size={14} /> Super Admin
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. Left Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-slate-800 mb-4">Account Details</h3>
              <div className="space-y-4">
                <InfoRow icon={<Mail size={18} />} label="Email" value={profile.email} />
                <InfoRow icon={<Calendar size={18} />} label="Joined" 
                  value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : "N/A"} 
                />
                <InfoRow icon={<Clock size={18} />} label="Last Login" 
                  value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "Never"} 
                />
              </div>
            </div>
          </div>

          {/* 3. Main Content (Form Only - No Password Button) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Edit Profile</h3>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput 
                    label="Full Name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    icon={<User size={18} />}
                  />
                  <FormInput 
                    label="Phone Number" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    icon={<Phone size={18} />}
                    type="tel"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    className="bg-[#112D4E] hover:bg-[#274b74] text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, icon, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-3.5 text-slate-400">{icon}</div>
        <input 
          type={type}
          value={value} 
          onChange={onChange}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3F72AF] focus:border-transparent outline-none transition bg-gray-50/30 focus:bg-white"
        />
      </div>
    </div>
  );
}
