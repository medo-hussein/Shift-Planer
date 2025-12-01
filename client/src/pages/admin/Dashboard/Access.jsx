import React from "react";
import { User, Clock2, Clipboard } from 'lucide-react';
const Access = () => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white rounded-md p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-xl mb-4">Quick Actions</h3>
        <div className="space-y-3">

          <div className="rounded-md border border-gray-100 p-3 sm:p-4 bg-gray-50 flex items-center justify-start gap-4">
            <User />
            <div>
              <div className="text-sm font-medium">Add Employee</div>
              <div className="text-xs text-gray-500 mt-1">
                Onboard new team member
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-100 p-3 sm:p-4 bg-gray-50 flex items-center justify-start gap-4">
            <Clock2 />
            <div>
              <div className="text-sm font-medium">View Time Cards</div>
              <div className="text-xs text-gray-500 mt-1">
                Review employee hours
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-100 p-3 sm:p-4 bg-gray-50 flex items-center justify-start gap-4">
            <Clipboard />
            <div>
              <div className="text-sm font-medium">Generate Report</div>
              <div className="text-xs text-gray-500 mt-1">Export analytics</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-4">Upcoming Schedule Preview</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[720px] grid grid-cols-7 gap-3 text-xs sm:text-sm">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, idx) => (
              <div
                key={d}
                className="bg-white border border-gray-200 rounded-md p-2"
              >
                <div className="text-center font-medium text-sm mb-2">{d}</div>
                <div className="space-y-2">
                  <div
                    className={`text-white text-center rounded-md py-1 text-xs sm:text-sm ${
                      idx < 5 ? "bg-blue-600" : "bg-amber-400"
                    }`}
                  >
                    Morning: 3 staff
                  </div>
                  <div
                    className={`text-white text-center rounded-md py-1 text-xs sm:text-sm ${
                      idx < 5 ? "bg-blue-500" : "bg-amber-400"
                    }`}
                  >
                    Evening: 2 staff
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Access;
