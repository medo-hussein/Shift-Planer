import { useEffect, useState } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { 
  Plus, Mail, Phone, Building, User, 
  MoreVertical, Edit2, Trash2, Power, X,
  ChevronLeft, ChevronRight 
} from "lucide-react";
import {Alert} from "../../utils/alertService.js"
import { useTranslation } from "react-i18next";
import DashboardSkeleton from "../../utils/DashboardSkeleton.jsx";

export default function Teams() {
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    branch_name: "",
    phone: "",
    is_active: true
  });
  
  const { t, i18n } = useTranslation();

  // Fetch Branches with Pagination
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getAllBranches({ page, limit });
      setBranches(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [page]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await superAdminService.updateBranch(formData.id, {
          name: formData.name,
          branch_name: formData.branch_name,
          email: formData.email,
          phone: formData.phone,
          is_active: formData.is_active
        });
        Alert.success(t("teams.alerts.updateSuccess"));
      } else {
        await superAdminService.createBranchAdmin(formData);
        Alert.success(t("teams.alerts.createSuccess"));
      }
      
      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (err) {
      Alert.error(err.response?.data?.message || t("teams.alerts.operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const result = await Alert.confirm(t("teams.alerts.confirmDelete"));
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      await superAdminService.deleteBranch(id);
      if (branches.length === 1 && page > 1) {
        setPage(p => p - 1);
      } else {
        fetchBranches();
      }
      Alert.success(t("teams.alerts.deleteSuccess"));
    } catch (err) {
      Alert.error(t("teams.alerts.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (branch) => {
    try {
      setLoading(true);
      await superAdminService.updateBranch(branch._id, { is_active: !branch.is_active });
      Alert.success(branch.is_active 
        ? t("teams.alerts.deactivateSuccess") 
        : t("teams.alerts.activateSuccess")
      );
      fetchBranches();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      Alert.error(t("teams.alerts.statusUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const openEditModal = (branch) => {
    setFormData({
      id: branch._id,
      name: branch.name,
      email: branch.email,
      branch_name: branch.branch_name,
      phone: branch.phone,
      is_active: branch.is_active,
      password: ""
    });
    setIsEditing(true);
    setShowModal(true);
    setActiveMenu(null);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", branch_name: "", phone: "", is_active: true });
    setIsEditing(false);
  };
  
  if(loading) return <DashboardSkeleton />;

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen" onClick={() => setActiveMenu(null)}>
      
      {/* Header */}
      <div className="flex md:justify-between md:items-center md:flex-row mb-8 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("teams.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t("teams.subtitle")}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#112D4E] hover:bg-[#274b74] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm font-medium"
        >
          <Plus size={18} /> {t("teams.buttons.addBranch")}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length > 0 ? branches.map((branch) => (
          <div key={branch._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition relative group">
            
            {/* Action Menu */}
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === branch._id ? null : branch._id); }}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                aria-label={t("teams.actions.menu")}
              >
                <MoreVertical size={18} />
              </button>
              
              {/* Dropdown */}
              {activeMenu === branch._id && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 overflow-hidden animate-fadeIn z-20">
                  <button onClick={() => openEditModal(branch)} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                    <Edit2 size={14} /> {t("teams.actions.edit")}
                  </button>
                  <button onClick={() => handleToggleStatus(branch)} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                    <Power size={14} /> {branch.is_active ? t("teams.actions.deactivate") : t("teams.actions.activate")}
                  </button>
                  <button onClick={() => handleDelete(branch._id)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-600">
                    <Trash2 size={14} /> {t("teams.actions.delete")}
                  </button>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl text-white ${branch.is_active ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'}`}>
                <Building size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{branch.branch_name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${branch.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {branch.is_active ? t("teams.status.active") : t("teams.status.inactive")}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                <User size={16} className="text-slate-400 dark:text-slate-500" /> 
                <span className="font-medium">{branch.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                <Mail size={16} className="text-slate-400 dark:text-slate-500" /> {branch.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                <Phone size={16} className="text-slate-400 dark:text-slate-500" /> {branch.phone || t("teams.card.notAvailable")}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-medium text-slate-400 dark:text-slate-500">
                <span>{t("teams.card.joined")}: {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString(i18n.language) : t("teams.card.notAvailable")}</span>
                {branch.employee_count !== undefined && (
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                      {branch.employee_count} {t("teams.card.employees")}
                    </span>
                )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">
             {t("teams.noBranchesFound")}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label={t("teams.pagination.previous")}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("teams.pagination.page")} {page} {t("teams.pagination.of")} {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label={t("teams.pagination.next")}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-fadeIn scale-100 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
              aria-label={t("teams.modal.close")}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#112D4E] dark:text-slate-100 mb-6">
              {isEditing ? t("teams.modal.editTitle") : t("teams.modal.createTitle")}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {t("teams.form.branchName")}
                </label>
                <input required type="text" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#3F72AF] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {t("teams.form.adminName")}
                    </label>
                    <input required type="text" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#3F72AF] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {t("teams.form.phone")}
                    </label>
                    <input type="tel" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#3F72AF] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {t("teams.form.email")}
                </label>
                <input required type="email" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#3F72AF] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>

              {!isEditing && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {t("teams.form.password")}
                  </label>
                  <input required type="password" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#3F72AF] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition">
                  {t("teams.buttons.cancel")}
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#112D4E] text-white rounded-lg hover:bg-[#274b74] font-medium transition shadow-md">
                  {isEditing ? t("teams.buttons.saveChanges") : t("teams.buttons.createBranch")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}