import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { useLoading } from "../../contexts/LoaderContext";

export default function Teams() {
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const {show, hide, loading} = useLoading();

  const fetchCompanies = async () => {
    try {
      show();
      setError(null);

      const res = await apiClient.get(`/api/companies/all`);

      setCompanies(res.data.companies || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.message ||"Failed to load companies.");
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchCompanies(page);
  }, [page]);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Companies
        </h1>


        {/* Error */}
        {error && (
          <div className="text-center py-10 text-red-600">{error}</div>
        )}

        {/* Companies List */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((c) => (
              <div
                key={c._id}
                className="bg-white shadow rounded-xl p-6 border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-700">
                    {(c.name || "U").slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {c.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {c.legalName || "No legal name"}
                    </p>

                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        {c.plan} plan
                      </span>

                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                        {c.billingCycle}
                      </span>

                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          c.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-sm text-slate-600 space-y-1">
                  <div>
                    <span className="font-medium">Country:</span> {c.country}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {c.size}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {fmtDate(c.createdAt)}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex gap-4 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Employees:</span>{" "}
                    {c.stats?.employees}
                  </div>
                  <div>
                    <span className="font-medium">Admins:</span>{" "}
                    {c.stats?.admins}
                  </div>
                  <div>
                    <span className="font-medium">Users:</span>{" "}
                    {c.stats?.totalUsers}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex justify-center items-center mt-10 gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-lg font-medium text-slate-800">
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
