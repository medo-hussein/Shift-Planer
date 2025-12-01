import React, { useEffect, useState } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { useLoading } from "../../contexts/LoaderContext";
import { useAuth } from "../../contexts/AuthContext"; 
import { useNavigate } from "react-router";
import { 
  Building2, Users, Calendar, CheckCircle2, 
  RotateCcw, ArrowRight, Plus, FileText, 
  TrendingUp, Zap 
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { show, hide } = useLoading();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      show();
      const res = await superAdminService.getDashboardStats();
      setStats(res.data.data); 
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return null;

  const { overview, recent_branches } = stats;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-slate-800">
      
      {/* 1. Hero Section (The Blue Banner) */}
      <div className="relative rounded-3xl overflow-hidden bg-[#112D4E] shadow-lg mb-10 group">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0] || "Super Admin"}! 👋
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Here's what's happening with your branches today. You have <span className="font-bold text-white">{overview?.active_branches} active branches</span> running smoothly.
            </p>
            
            <div className="flex gap-4 mt-6">
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <span>System Health: 98%</span>
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm">
                  <Zap size={16} className="text-yellow-400" />
                  <span>All Services Online</span>
               </div>
            </div>
          </div>

          <button 
            onClick={fetchStats}
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 shadow-sm group-hover:rotate-180"
            title="Refresh Data"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Branches" 
          value={overview?.total_branches} 
          icon={<Building2 />} 
          color="blue"
        />
        <StatCard 
          title="Active Branches" 
          value={overview?.active_branches} 
          icon={<CheckCircle2 />} 
          color="emerald"
        />
        <StatCard 
          title="Total Employees" 
          value={overview?.total_employees} 
          icon={<Users />} 
          color="purple"
        />
        <StatCard 
          title="Total Shifts" 
          value={overview?.total_shifts} 
          icon={<Calendar />} 
          color="orange"
        />
      </div>

      {/* 3. Main Content Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Branches Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-bold text-slate-800">Recent Branches Joined</h2>
            <button 
              onClick={() => navigate('/teams')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all hover:gap-2"
            >
              View All Branches <ArrowRight size={16} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Branch Name</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recent_branches?.length > 0 ? (
                    recent_branches.map((branch) => (
                      <tr key={branch._id} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              {branch.branch_name.charAt(0)}
                            </div>
                            <div className="font-semibold text-slate-800">{branch.branch_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium">{branch.name}</span>
                            <span className="text-slate-400 text-xs">{branch.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                           {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            branch.is_active 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        No branches found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Summary */}
        <div className="space-y-6">
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/teams')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition group text-left"
              >
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                  <Plus size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Add New Branch</div>
                  <div className="text-xs text-slate-400">Onboard a new admin</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/time-off')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition group text-left"
              >
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">System Reports</div>
                  <div className="text-xs text-slate-400">View analytics</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mini Summary Card (Visual Balance) */}
          <div className="bg-[#1d2931] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Pro Tip 💡</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                You can transfer employees between branches easily from the "Transfer Employees" page.
              </p>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white/5 w-32 h-32 rounded-full blur-2xl"></div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Modern Stat Card Component ---
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
  };

  const selectedColor = colors[color] || colors.blue;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ring-4 ring-opacity-30 ${selectedColor}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        {/* Fake trend for UI appeal */}
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-500">
          Today
        </span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 mb-1">{value || 0}</h3>
        <p className="text-sm font-medium text-slate-400">{title}</p>
      </div>
    </div>
  );
}