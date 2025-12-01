import React from "react";
import { User, Play, Pause, Download, Funnel, Pencil, Eye } from "lucide-react";

import { useState } from "react";

export default function TimeTracking() {
  const [open, setOpen] = useState(false);
  const [isLive, setisLive] = useState(true);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 ">
        {/* Header */}
        <div className="flex justify-around items-start mb-4 gap-5 ">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Time Tracking
            </h1>
            <p className="text-gray-600 mb-6">
              Monitor employee clock in/out and manage time cards
            </p>
          </div>

          <div className="flex  items-end gap-2">
            <button className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-1 shadow-sm">
              <Download className="w-4" />
              Export{" "}
            </button>
            <button className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-1 shadow-sm">
              <Funnel className="w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full mb-6">
          <button
            className={`flex-1 py-2 rounded-l-lg font-medium transition-all cursor-pointer  ${
              isLive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
            }`}
            onClick={() => setisLive(true)}
          >
            Live Time Clock
          </button>
          <button
            className={`flex-1 py-2 rounded-r-lg font-medium transition-all cursor-pointer  ${
              !isLive
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-600"
            }`}
            onClick={() => setisLive(false)}
          >
            Time Cards
          </button>
        </div>

        {/* working */}
        {isLive ? (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex">
              <User />
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Currently Working (3)
              </h2>
            </div>

            <div className="space-y-4">
              {/* Card  */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                    SJ
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Sarah Johnson</p>
                    <p className="text-gray-500 text-sm">Manager</p>
                    <p className="text-gray-500 text-sm">Downtown Store</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <p className="text-gray-700 text-sm">Start Time</p>
                    <p className="font-semibold text-gray-800">09:00 AM</p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-700 text-sm">Hours Today</p>
                    <p className="font-semibold text-gray-800 text-left">
                      4.5h
                    </p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Working
                  </span>
                  <button className="dashboardBtn">
                    <Pause className="w-4" />
                    Start Break
                  </button>
                </div>
              </div>

              {/* Card */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                    SJ
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Sarah Johnson</p>
                    <p className="text-gray-500 text-sm">Manager</p>
                    <p className="text-gray-500 text-sm">Downtown Store</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <p className="text-gray-700 text-sm">Start Time</p>
                    <p className="font-semibold text-gray-800">09:00 AM</p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-700 text-sm">Hours Today</p>
                    <p className="font-semibold text-gray-800 text-left">
                      4.5h
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                    On Break
                  </span>
                  <button className="dashboardBtn">
                    <Play className="w-4" />
                    End break
                  </button>
                </div>
              </div>

              {/* Card  */}
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                    SJ
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Sarah Johnson</p>
                    <p className="text-gray-500 text-sm">Manager</p>
                    <p className="text-gray-500 text-sm">Downtown Store</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <p className="text-gray-700 text-sm">Start Time</p>
                    <p className="font-semibold text-gray-800">09:00 AM</p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-700 text-sm">Hours Today</p>
                    <p className="font-semibold text-gray-800 text-left">
                      4.5h
                    </p>
                  </div>
                  <span className="bg-green-300 text-teal-900 px-3 py-1 rounded-full text-sm font-medium">
                    Break Completed
                  </span>
                  <button className="dashboardBtn">
                    <Pause className="w-4" />
                    Start Break
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 bg-white shadow-sm rounded-lg p-6">
            <div className="bg-white p-6 rounded-xl shadow-sm ">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Time Card Management
              </h2>

              {/* filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                <select className="dashboardBtn">
                  <option>Sarah Johnson</option>
                </select>
                <select className="dashboardBtn">
                  <option>This Month</option>
                </select>
                <select className="dashboardBtn">
                  <option>All Status</option>
                </select>
              </div>

              {/* card */}
              <div className="card">
                <div>
                  <div className="flex gap-3 items-center mb-1">
                    <h3 className="font-semibold text-gray-800">
                      Sarah Johnson
                    </h3>
                    <span className="bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full">
                      approved
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    2024-01-15 • Downtown Store
                  </p>
                  <p className="text-gray-600 text-sm">
                    09:00 AM - 05:30 PM (8h)
                  </p>
                </div>

                <button
                  onClick={() => setOpen(true)}
                  className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-1 shadow-sm"
                >
                  <Eye className="w-4" />
                  View
                </button>
              </div>
              {/* card */}
              <div className="card">
                <div>
                  <div className="flex gap-3 items-center mb-1">
                    <h3 className="font-semibold text-gray-800">
                      Sarahssas Johnson
                    </h3>
                    <span className="bg-gray-300 text-xs px-2 py-1 rounded-full">
                      pending
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    2024-01-15 • Downtown Store
                  </p>
                  <p className="text-gray-600 text-sm">
                    09:00 AM - 05:30 PM (8h)
                  </p>
                </div>
                <div className="flex gap-5">
                  <button
                    onClick={() => setOpen(true)}
                    className="dashboardBtn"
                  >
                    <Eye className="w-4" />
                    View
                  </button>
                  <button className="bg-indigo-500 px-3 py-1 rounded-md text-gray-100 hover:bg-sky-600 flex items-center gap-1 shadow-sm">
                    Approved
                  </button>
                </div>
              </div>
            </div>

            {/* el view */}
            {open && (
              <div className="fixed inset-0  bg-opacity-25 flex items-center justify-center z-50">
                <div className="fixed inset-0  bg-black bg-opacity-25 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-6 w-[600px] shadow-lg relative">
                    <button
                      onClick={() => setOpen(false)}
                      className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>
                    <h2 className="text-lg font-semibold mb-4">
                      Time Card Details
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          Employee Information
                        </h3>
                        <p className="text-sm text-gray-700">
                          Name: Sarah Johnson
                        </p>
                        <p className="text-sm text-gray-700">
                          Date: 2024-01-15
                        </p>
                        <p className="text-sm text-gray-700">
                          Location: Downtown Store
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          Time Information
                        </h3>
                        <p className="text-sm text-gray-700">
                          Clock In: 09:00 AM
                        </p>
                        <p className="text-sm text-gray-700">
                          Clock Out: 05:30 PM
                        </p>
                        <p className="text-sm text-gray-700">
                          Break Duration: 30 min
                        </p>
                        <p className="text-sm text-gray-700">Total Hours: 8h</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Notes
                      </h3>
                      <div className="bg-blue-100 p-3 rounded-md text-sm text-gray-800">
                        Worked overtime for inventory
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button className="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-100 flex items-center gap-2">
                        <Pencil className="w-4"/>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* time cards */}
    </>
  );
}
