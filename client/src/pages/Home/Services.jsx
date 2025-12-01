import { NotepadText, Clock, Plane, ChartSpline } from "lucide-react";

const servicesData = [
  {
    icon: NotepadText,
    title: "Smart Scheduling",
    desc: "AI-powered scheduling that automatically optimizes shifts based on availability, skills, and business needs.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Accurate time tracking with clock-in/out, break management, and automated overtime calculations.",
  },
  {
    icon: Plane,
    title: "Leave Management",
    desc: "Streamlined leave requests, approval workflows, and automatic balance tracking for all leave types.",
  },
  {
    icon: ChartSpline,
    title: "Reports & AI Insights",
    desc: "Comprehensive analytics and AI-generated insights that optimize workforce performance and reduce costs.",
  },
];

const Services = () => {
  return (
    <section className="py-20 bg-white">
      
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="font-bold text-3xl md:text-4xl leading-tight text-[#112D4E]">
          Everything You Need for Modern Workforce Management
        </h1>
        <p className="mt-4 text-gray-600 text-lg">
          Streamline operations, boost productivity, and make data-driven
          decisions with our comprehensive platform.
        </p>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 px-6 md:px-12">
        {servicesData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* ICON */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-sky-700 to-sky-800 flex items-center justify-center shadow-md">
                <Icon className="text-white" size={28} />
              </div>

              {/* TITLE */}
              <h1 className="mt-5 font-semibold text-xl text-[#112D4E]">
                {item.title}
              </h1>

              {/* DESC */}
              <p className="mt-2 text-gray-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Services;
