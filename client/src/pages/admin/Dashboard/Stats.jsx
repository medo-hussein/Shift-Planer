import React from "react";
import { Users, Calendar, Clock, FileText } from "lucide-react";

const Stats = () => {
  const cards = [
    { title: "Total Employees", value: "24", icon: <Users />, color: "text-blue-900" },
    { title: "Active Shifts Today", value: "12", icon: <Calendar />, color: "text-green-600" },
    { title: "Hours This Week", value: "840", icon: <Clock />, color: "text-blue-600" },
    { title: "Pending Requests", value: "3", icon: <FileText />, color: "text-yellow-600" },
  ];
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-md px-4 py-6 shadow-sm border border-gray-200 flex items-center justify-start gap-4"
        >
          <div className={`hidden sm:flex items-center justify-center w-10 h-10 ${card.color} bg-gray-100 rounded-lg`}>
            {card.icon}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-500">{card.title}</div>
            <div className="text-lg sm:text-xl font-semibold mt-1 text-gray-800">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Stats;
