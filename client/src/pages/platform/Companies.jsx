import React, { useEffect, useState } from "react";
import { platformService } from "../../api/services/platformService";
import { useLoading } from "../../contexts/LoaderContext";
import { useToast } from "../../hooks/useToast";
import {
    Search, MoreVertical, Shield, ShieldOff,
    Building2, Calendar, CreditCard, Users
} from "lucide-react";

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const { show, hide } = useLoading();
    const { addToast } = useToast();

    const fetchCompanies = async () => {
        try {
            show();
            const res = await platformService.getAllCompanies();
            setCompanies(res.data.data);
            setFilteredCompanies(res.data.data);
        } catch (err) {
            console.error("Error fetching companies:", err);
            addToast("Failed to load companies", "error");
        } finally {
            hide();
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        const filtered = companies.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            (c.subscription?.plan_name || "").toLowerCase().includes(lower)
        );
        setFilteredCompanies(filtered);
    }, [search, companies]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await platformService.toggleCompanyStatus(id);
            addToast(`Company ${currentStatus ? 'deactivated' : 'activated'} successfully`, "success");

            // Update local state
            setCompanies(prev => prev.map(c =>
                c._id === id ? { ...c, isActive: !c.isActive } : c
            ));
        } catch (err) {
            console.error("Error toggling status:", err);
            addToast(err.response?.data?.message || "Failed to update status", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans text-slate-800">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
                    <p className="text-slate-500 mt-1">Manage registered companies and their subscriptions.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div key={company._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                    {company.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{company.name}</h3>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Calendar size={12} />
                                        Joined {new Date(company.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => handleToggleStatus(company._id, company.isActive)}
                                    className={`p-2 rounded-lg transition ${company.isActive
                                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                        : "text-red-600 bg-red-50 hover:bg-red-100"
                                        }`}
                                    title={company.isActive ? "Deactivate Company" : "Activate Company"}
                                >
                                    {company.isActive ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-50 pt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <CreditCard size={16} /> Plan
                                </span>
                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                    {company.subscription?.plan_name || "Free"}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Building2 size={16} /> Branches
                                </span>
                                <span className="font-medium text-slate-700">
                                    Max {company.subscription?.maxBranches || 1}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Users size={16} /> Employees
                                </span>
                                <span className="font-medium text-slate-700">
                                    Max {company.subscription?.maxUsers || 5}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${company.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                }`}>
                                {company.isActive ? "Active" : "Suspended"}
                            </span>

                            {company.subscription?.expiresAt && (
                                <span className="text-xs text-slate-400">
                                    Exp: {new Date(company.subscription.expiresAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            {filteredCompanies.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">No companies found</h3>
                    <p className="text-slate-500">Try adjusting your search terms.</p>
                </div>
            )}
        </div>
    );
}

function ShieldCheck({ size }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
