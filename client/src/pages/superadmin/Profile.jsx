import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import { useLoading } from "../../contexts/LoaderContext";

export default function Profile() {
  const fetchCompanyInfo = async () => {
    try {
      const res = await apiClient.get("api/companies/me");
      return res.data;
    } catch (err) {
      setError(err.message || "Failed to load company info");
    }
  };
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const { show, hide } = useLoading();

  useEffect(() => {
    show();
    fetchCompanyInfo().then((data) => {
      setCompany(data);
      hide();
    });
  }, []);
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600">
        {error}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600">
        Failed to load company info
      </div>
    );
  }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const statusColor = (active) =>
    active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

  return (
    <div className="bg-gray-50 p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-slate-100">
          {/* Header */}
          <div className="flex flex-col items-center justify-center md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-2xl font-bold shadow-sm">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt="logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (company.name || "U")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {company.name}
                </h1>
                <p className="text-base text-slate-500 mt-1">
                  {company.legalName || ""}
                </p>

                <div className="mt-4 flex items-center flex-wrap gap-3">
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColor(
                      company.active
                    )}`}
                  >
                    {company.active ? "Active" : "Inactive"}
                  </span>

                  <span className="text-sm px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                    Plan: {company.plan}
                  </span>

                  <span className="text-sm px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                    Billing: {company.billingCycle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-base text-slate-500 text-right">
                <div>Joined</div>
                <div className="font-semibold text-slate-900 text-lg">
                  {fmtDate(company.createdAt)}
                </div>
              </div>

              <button className="px-5 py-2.5 bg-sky-600 text-white text-base font-medium rounded-lg shadow hover:bg-sky-700">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Grid Sections */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Basic Info">
              <InfoRow label="Name" value={company.name} />
              <InfoRow label="Country" value={company.country} />
              <InfoRow label="Company size" value={company.size} />
              <InfoRow label="Industry" value={company.industry || "—"} />
            </Card>

            <Card title="Subscription">
              <InfoRow label="Status" value={company.subscription?.status} />
              <InfoRow
                label="Active"
                value={company.isSubscriptionActive ? "Yes" : "No"}
              />
              <InfoRow
                label="Cancel at end of period"
                value={company.subscription?.cancelAtPeriodEnd ? "Yes" : "No"}
              />
            </Card>

            <Card title="Settings">
              <InfoRow label="Timezone" value={company.settings?.timezone} />
              <InfoRow label="Currency" value={company.settings?.currency} />
              <InfoRow label="Language" value={company.settings?.language} />
              <InfoRow
                label="Date format"
                value={company.settings?.dateFormat}
              />
              <InfoRow
                label="Time format"
                value={company.settings?.timeFormat}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Components */

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="text-lg font-semibold text-slate-800 mb-4">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900 ml-4">
        {value ?? "—"}
      </div>
    </div>
  );
}
