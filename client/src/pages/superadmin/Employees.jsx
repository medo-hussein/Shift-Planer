import React, { useState, useEffect } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  ArrowRightLeft, Building, Search, Briefcase, 
  Mail, Phone, MapPin, X, MoreVertical,
  Edit2, Trash2, Plus,
} from "lucide-react";
import {Alert} from "../../utils/alertService.js";
import { useTranslation } from "react-i18next";

export default function Employees() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [modalType, setModalType] = useState(null); // 'transfer' | 'create' | 'edit'
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    position: "",
    branch_admin_id: "" // Important for creation
  });

  const [transferData, setTransferData] = useState({ 
    employeeId: "", 
    employeeName: "", 
    newBranchAdminId: "" 
  });

  const { show, hide } = useLoading();
  const { t } = useTranslation();

  // 1. Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await superAdminService.getAllBranches({ limit: 100 }); // Get all for dropdowns
        setBranches(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchBranches();
  }, []);

  // 2. Fetch Employees when Branch Selected
  const fetchEmployees = async () => {
    if (!selectedBranch) return;
    try {
      show();
      const res = await superAdminService.getBranchEmployees(selectedBranch);
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    if (selectedBranch) fetchEmployees();
    else setEmployees([]);
  }, [selectedBranch]);

  // --- Handlers ---

  // Delete
  const handleDelete = async (id) => {
    const confirmREsult = await Alert.confirm(t("employees.alerts.confirmDelete"))
    if(!confirmREsult.isConfirmed) return;
    
    try {
      show();
      await superAdminService.deleteEmployee(id);
      Alert.success(t("employees.alerts.deleteSuccess"));
      fetchEmployees();
    } catch (err) {
      Alert.error(t("employees.alerts.deleteFailed"));
    } finally {
      hide();
    }
  };

  // Create / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      show();
      if (modalType === 'edit') {
        await superAdminService.updateEmployee(formData.id, formData);
        Alert.success(t("employees.alerts.updateSuccess"));
      } else if (modalType === 'create') {
        // Ensure branch is selected
        const branchId = formData.branch_admin_id || selectedBranch;
        if (!branchId) return Alert.warning(t("employees.alerts.selectBranchWarning"));
        
        await superAdminService.createEmployee({ ...formData, branch_admin_id: branchId });
        Alert.success(t("employees.alerts.createSuccess"));
      }
      setModalType(null);
      fetchEmployees();
    } catch (err) {
      Alert.error(err.response?.data?.message || t("employees.alerts.operationFailed"));
    } finally {
      hide();
    }
  };

  // Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      show();
      await superAdminService.transferEmployee({
        employeeId: transferData.employeeId,
        newBranchAdminId: transferData.newBranchAdminId
      });
      setModalType(null);
      fetchEmployees();
      Alert.success(t("employees.alerts.transferSuccess"));
    } catch (err) {
      Alert.error(err.response?.data?.message || t("employees.alerts.transferFailed"));
    } finally {
      hide();
    }
  };

  // Open Modals
  const openEdit = (emp) => {
    setFormData({
      id: emp._id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      position: emp.position || "",
      branch_admin_id: emp.branch_admin_id?._id // Keep original branch
    });
    setModalType('edit');
    setActiveMenu(null);
  };

  const openCreate = () => {
    setFormData({
      id: "", name: "", email: "", password: "", phone: "", position: "", 
      branch_admin_id: selectedBranch // Default to currently viewed branch
    });
    setModalType('create');
  };

  const openTransfer = (emp) => {
    setTransferData({ 
      employeeId: emp._id, 
      employeeName: emp.name, 
      newBranchAdminId: "" 
    });
    setModalType('transfer');
    setActiveMenu(null);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentBranchName = branches.find(b => b._id === selectedBranch)?.branch_name || t("employees.unknownBranch");

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen" onClick={() => setActiveMenu(null)}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("employees.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t("employees.subtitle")}</p>
        </div>
        
        {/* ✅ New Add Button */}
        <button 
          onClick={openCreate}
          disabled={!selectedBranch}
          className="bg-[#112D4E] hover:bg-[#274b74] disabled:bg-slate-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm font-medium"
        >
          <Plus size={18} /> {t("employees.buttons.addEmployee")}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-1/3">
          <Building className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <select 
            className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-gray-50/50 dark:bg-slate-700 text-slate-700 dark:text-slate-100 cursor-pointer"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">{t("employees.selectBranch.placeholder")}</option>
            {branches.map(branch => <option key={branch._id} value={branch._id}>{branch.branch_name}</option>)}
          </select>
        </div>
        <div className="relative w-full lg:w-2/3">
          <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder={t("employees.search.placeholder")}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] disabled:bg-gray-100 dark:disabled:bg-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!selectedBranch}
          />
        </div>
      </div>

      {/* Content */}
      {selectedBranch ? (
        filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => (
              <div key={emp._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition relative group">
                
                {/* Action Menu */}
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === emp._id ? null : emp._id); }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition"
                    aria-label={t("employees.actions.menu")}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeMenu === emp._id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-20 overflow-hidden animate-fadeIn">
                      <button onClick={() => openEdit(emp)} className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                        <Edit2 size={14} /> {t("employees.actions.edit")}
                      </button>
                      <button onClick={() => openTransfer(emp)} className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
                        <ArrowRightLeft size={14} /> {t("employees.actions.transfer")}
                      </button>
                      <button onClick={() => handleDelete(emp._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-600">
                        <Trash2 size={14} /> {t("employees.actions.delete")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xl font-bold">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{emp.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <Briefcase size={14} /> <span>{emp.position || t("employees.card.defaultPosition")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-slate-50 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Mail size={16} className="text-blue-400"/> {emp.email}</div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Phone size={16} className="text-blue-400"/> {emp.phone || t("employees.card.notAvailable")}</div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><MapPin size={16} className="text-blue-400"/> {currentBranchName}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-dashed dark:border-slate-700">
            {t("employees.noEmployeesFound")}
          </div>
        )
      ) : (
        <div className="py-32 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Building size={40} className="mx-auto text-blue-400 mb-4 animate-bounce-slow" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("employees.selectBranch.title")}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t("employees.selectBranch.description")}</p>
        </div>
      )}

      {/* --- Modals --- */}

      {/* 1. Create / Edit Modal */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-fadeIn relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-[#112D4E] dark:text-slate-100">
                {modalType === 'edit' ? t("employees.modal.editTitle") : t("employees.modal.createTitle")}
              </h2>
              <button onClick={() => setModalType(null)} aria-label={t("employees.modal.close")}>
                <X size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {t("employees.form.name")}
                  </label>
                  <input required type="text" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {t("employees.form.position")}
                  </label>
                  <input type="text" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t("employees.form.email")}
                </label>
                <input required type="email" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>

              {/* Show branch select only if adding, otherwise it's locked to current employee's branch */}
              {modalType === 'create' && (
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                     {t("employees.form.assignToBranch")}
                   </label>
                   <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                     value={formData.branch_admin_id} onChange={(e) => setFormData({...formData, branch_admin_id: e.target.value})}>
                     <option value="">{t("employees.form.selectBranch")}</option>
                     {branches.map(b => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
                   </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                     {t("employees.form.phone")}
                   </label>
                   <input type="tel" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                     {modalType === 'edit' ? t("employees.form.newPasswordOptional") : t("employees.form.password")}
                   </label>
                   <input required={modalType === 'create'} type="password" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-bold mt-4 shadow-md">
                {modalType === 'edit' ? t("employees.buttons.saveChanges") : t("employees.buttons.createAccount")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Transfer Modal */}
      {modalType === 'transfer' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex gap-2 items-center">
                <ArrowRightLeft size={18}/> {t("employees.transferModal.title")}
              </h3>
              <button onClick={() => setModalType(null)} aria-label={t("employees.modal.close")}>
                <X size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {t("employees.transferModal.description")} <strong>{transferData.employeeName}</strong>:
              </p>
              <select className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 mb-4"
                value={transferData.newBranchAdminId} onChange={(e) => setTransferData({...transferData, newBranchAdminId: e.target.value})}>
                <option value="">{t("employees.transferModal.selectTargetBranch")}</option>
                {branches.filter(b => b._id !== selectedBranch).map(b => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
              </select>
              <button onClick={handleTransfer} className="w-full py-3 bg-[#112D4E] text-white rounded-xl font-bold shadow-md">
                {t("employees.transferModal.confirmTransfer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}