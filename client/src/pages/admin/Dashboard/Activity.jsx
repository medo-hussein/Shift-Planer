import React from "react";

const Activity = () => {
  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-md p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <ul className="space-y-3">
          {[
            {
              text: "Sarah Johnson clocked in for morning shift",
              time: "2 minutes ago",
              color: "bg-green-400",
            },
            {
              text: "Mike Davis requested time off for Dec 15-16",
              time: "1 hour ago",
              color: "bg-amber-400",
            },
            {
              text: "Weekend schedule published for next week",
              time: "3 hours ago",
              color: "bg-blue-400",
            },
            {
              text: "Alex Thompson worked 2 hours overtime",
              time: "5 hours ago",
              color: "bg-green-400",
            },
          ].map((a, i) => (
            <li
              key={i}
              className="bg-gray-50 p-3 rounded-md border border-gray-100"
            >
              <div className="flex items-start gap-3">
                <span className={`w-3 h-3 rounded-full mt-1 ${a.color}`}></span>
                <div>
                  <div className="text-sm text-gray-700">{a.text}</div>
                  <div className="text-xs text-gray-400">{a.time}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-md p-3 sm:p-4 shadow-sm border border-gray-200">
        <h4 className="font-medium mb-2">Small Summary</h4>
        <p className="text-xs text-gray-500">
          Quick link and stats about your team this week.
        </p>
      </div>
    </aside>
  );
};

export default Activity;
