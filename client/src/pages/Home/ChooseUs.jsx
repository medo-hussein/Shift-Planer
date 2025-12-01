import React from "react";
import dudes from "/images/home/dudes.jpg";
import { Check } from "lucide-react";

const chooseUsData = [
  {
    title: "Reduce Administrative Overhead",
    desc: "Automate repetitive HR tasks and focus on strategic initiatives",
  },
  {
    title: "Improve Employee Productivity",
    desc: "Tools and insights to help your team focus on what matters most",
  },
  {
    title: "Optimize Shift Scheduling",
    desc: "Automatically match shifts to availability, skills, and business needs",
  },
];

const ChooseUs = () => {
  return (
    <div className="bg-linear-to-r from-sky-950 via-sky-900 to-sky-800 flex flex-col lg:flex-row">
      {/* TEXT SECTION */}
      <div className="flex-1 p-6 md:p-12 mt-6 lg:mt-12">
        <h3 className="font-semibold text-3xl md:text-4xl text-white my-5">
          Why Choose Tadbir ?
        </h3>

        <div className="space-y-4 mt-6">
          {chooseUsData.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="bg-sky-200 w-6 h-6 flex items-center justify-center rounded-full mt-1">
                <Check className="mt-0.5 text-sky-950" size={16} />
              </div>

              <div>
                <p className="text-white font-semibold">{item.title}</p>
                <p className="text-gray-300 text-sm mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE SECTION */}
      <div className="flex-1 flex justify-center items-center py-6">
        <img
          src={dudes}
          alt="Team working"
          className="w-64 md:w-80 lg:w-[450px] rounded-xl"
        />
      </div>
    </div>
  );
};

export default ChooseUs;
