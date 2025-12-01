import React, { useState, useEffect } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  User, ArrowRightLeft, Building, Search, Briefcase, 
  Mail, Phone, MapPin, X, Filter 
} from "lucide-react";

export default function Employees() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [transferData, setTransferData] = useState({ 
    employeeId: "", 
    employeeName: "", 
    newBranchAdminId: "" 
  });

  const { show, hide } = useLoading();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await superAdminService.getAllBranches();
        setBranches(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranch) {
      setEmployees([]);
      return;
    }

    const fetchEmployees = async () => {
      try {
        show();
        const res = await superAdminService.getBranchEmployees(selectedBranch);
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        hide();
      }
    };

    fetchEmployees();
  }, [selectedBranch]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.newBranchAdminId) return alert("Please select a target branch");

    try {
      show();
      await superAdminService.transferEmployee({
        employeeId: transferData.employeeId,
        newBranchAdminId: transferData.newBranchAdminId
      });
      
      const res = await superAdminService.getBranchEmployees(selectedBranch);
      setEmployees(res.data.data || []);
      
      setShowModal(false);
      alert("Employee transferred successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    } finally {
      hide();
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentBranchName = branches.find(b => b._id === selectedBranch)?.branch_name || "Unknown Branch";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage employees across all branches.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row gap-4 items-center">
        
        <div className="relative w-full lg:w-1/3">
          <div className="absolute left-4 top-3.5 text-slate-400 pointer-events-none">
            <Building size={18} />
          </div>
          <select 
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-gray-50/50 text-slate-700 appearance-none cursor-pointer transition hover:border-blue-300"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Select a Branch to view...</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">
            <Filter size={14} />
          </div>
        </div>

        <div className="relative w-full lg:w-2/3">
          <div className="absolute left-4 top-3.5 text-slate-400 pointer-events-none">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search employees by name or email..." 
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] transition disabled:bg-gray-100 disabled:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedBranch}
          />
        </div>
      </div>

      {/* Content Area */}
      {selectedBranch ? (
        filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => (
              <div key={emp._id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                
                {/* Top Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl font-bold shadow-inner">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{emp.name}</h3>
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <Briefcase size={14} />
                        <span>{emp.position || "Employee"}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${emp.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3 py-4 border-t border-b border-slate-50 my-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail size={16} className="text-blue-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone size={16} className="text-blue-400" />
                    <span>{emp.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin size={16} className="text-blue-400" />
                    <span className="truncate">{currentBranchName}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => {
                      setTransferData({ 
                        employeeId: emp._id, 
                        employeeName: emp.name, 
                        newBranchAdminId: "" 
                      });
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No employees found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or select a different branch.</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
            <Building size={40} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Select a Branch</h2>
          <p className="text-slate-500 mt-2 text-center max-w-md">
            Please select a branch from the dropdown above to view and manage its employees list.
          </p>
        </div>
      )}

      {/* Modern Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn scale-100 relative overflow-hidden">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-blue-600" /> 
                Transfer Employee
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                You are about to transfer <strong className="text-slate-900">{transferData.employeeName}</strong>. 
                Please select the destination branch below.
              </p>

              <form onSubmit={handleTransfer}>
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination Branch</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <select 
                      required
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white appearance-none cursor-pointer transition hover:border-blue-300"
                      value={transferData.newBranchAdminId}
                      onChange={(e) => setTransferData({ ...transferData, newBranchAdminId: e.target.value })}
                    >
                      <option value="">Select Target Branch...</option>
                      {branches
                        .filter(b => b._id !== selectedBranch)
                        .map(b => (
                          <option key={b._id} value={b._id}>{b.branch_name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-medium transition shadow-lg shadow-blue-900/20">
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}