import React from "react";
import { Calendar, Clock, Check, Plus, X } from "lucide-react";

// Single-file React component using Tailwind CSS classes.
// Default export a component you can drop into a React + Tailwind project.
// Requires: lucide-react installed (npm i lucide-react)

export default function TimeOffDashboard() {
  const stats = [
    {
      title: "Pending Requests",
      value: 1,
      subtitle: "Awaiting approval",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Approved This Month",
      value: 12,
      subtitle: "+3 from last month",
      icon: Check,
      color: "text-green-500",
    },
    {
      title: "Total Days Off",
      value: 48,
      subtitle: "Across all employees",
      icon: Calendar,
      color: "text-blue-500",
    },
  ];

  const requests = [
    {
      id: 1,
      name: "Sarah Johnson",
      initials: "SJ",
      status: "pending",
      type: "vacation",
      dateRange: "2024-02-15 to 2024-02-22 (7 days)",
      note: "Family vacation to Hawaii",
    },
    {
      id: 2,
      name: "Mike Chen",
      initials: "MC",
      status: "approved",
      type: "sick",
      dateRange: "2024-01-25 to 2024-01-25 (1 days)",
      note: "Doctor's appointment\nNote: Hope you feel better soon!",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      initials: "ER",
      status: "approved",
      type: "personal",
      dateRange: "2024-03-01 to 2024-03-03 (3 days)",
      note: "Moving to new apartment",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Time Off Management
            </h1>
            <p className="text-slate-500">
              Manage employee time-off requests and approvals
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md shadow">
            <Plus size={16} />
            New Request
          </button>
        </header>

        {/* Top statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-lg shadow-sm p-6 border border-slate-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.title}</p>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {s.value}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{s.subtitle}</p>
                </div>
                <div className={s.color}>
                  <s.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Time Off Requests
            </h2>
            <div className="flex gap-2">
              <select className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <select className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                <option>All Types</option>
                <option>Vacation</option>
                <option>Sick Leave</option>
                <option>Personal</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="border border-slate-100 rounded-md p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                    {r.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-slate-800">{r.name}</div>

                      {/* Badges */}
                      <Badge text={r.status} variant={r.status} />
                      <Badge text={r.type} variant={r.type} />
                    </div>

                    <div className="text-sm text-slate-500 mt-2">
                      <Calendar size={14} className="inline-block mr-2 -mt-1" />
                      {r.dateRange}
                    </div>
                    <div className="text-sm text-slate-400 mt-2 whitespace-pre-line">
                      {r.note}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  {r.status === "pending" ? (
                    <>
                      <button className="px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50">
                        <X size={14} className="inline -mt-0.5 mr-1" /> Reject
                      </button>
                      <button className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                        <Check size={14} className="inline -mt-0.5 mr-1" />{" "}
                        Approve
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400">&nbsp;</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ text, variant }) {
// small mapping for simple visual variants
const map = {
pending: "bg-amber-100 text-amber-700",
approved: "bg-emerald-100 text-emerald-700",
rejected: "bg-red-200 text-red-700",
vacation: "bg-sky-100 text-sky-700",
sick: "bg-red-100 text-red-700",
personal: "bg-yellow-100 text-yellow-700",
other: "bg-purple-100 text-purple-700",
};
const classes = `${map[variant] || "bg-slate-100 text-slate-700"} text-xs px-2 py-1 rounded-full font-medium`;
return <span className={classes}>{text}</span>;
}