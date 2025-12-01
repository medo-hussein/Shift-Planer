import React from "react";
import {
  Check,
  Brain,
  NotepadText,
  Clock,
  Umbrella,
  ChartSpline,
} from "lucide-react";
import computer from "../assets/computer.jpg";
import dudes from "../assets/dudes.jpg";
const Home = () => {
  return (
    <div>
      {/* start navbar */}
      <div className="flex flex-wrap items-center justify-between p-4">
        <div className="flex items-center gap-2 mt-3">
          <div className="icon">
            <Brain className="text-white" />
          </div>
          <h4 className="font-semibold ">ShiftMind</h4>
        </div>

        <div className="hidden md:flex gap-6">
          <p className="paragraph cursor-pointer">Features</p>
          <p className="paragraph cursor-pointer">About</p>
          <p className="paragraph cursor-pointer">Contact</p>
        </div>

        <div className="flex gap-4 mt-3 md:mt-0">
          <a href="" className="text-sky-400 mt-2">
            Login
          </a>
          <button className="btn">Get Started</button>
        </div>
      </div>

      {/* end navbar */}
      {/* start hero section */}
      <div className="flex flex-col md:flex-row bg-linear-to-r from-sky-200 to-stone-100 w-full">
        <div className="flex-1 m-4 p-5">
          <h3 className="font-semibold text-4xl">
            Smart Workforce <br /> Managemnt&{" "}
            <span className="text-sky-900">
              AI <br /> Scheduling System{" "}
            </span>
          </h3>

          <p className="mt-4">
            Revolutionize your HR operations with intelligent scheduling. <br />
            automated time tracking, and AI-powered insights that drive <br />
            productivity
          </p>
          <div className="mt-5 flex gap-4">
            <button className="btn">Get Started Free</button>
            <button className="btn2">Watch Demo</button>
          </div>
        </div>

        <div className="flex-2 flex justify-center items-center py-6">
          <img
            src={computer}
            alt=""
            className="w-64 md:w-80 lg:w-[450px] rounded-xl"
          />
        </div>
      </div>

      {/* end hero section */}
      {/* start our service */}
      <div className="text-center">
        <h1 className="font-semibold text-3xl mt-15 p-3">
          Everything You Need for Modern Workforce Managment
        </h1>
        <p className="paragraphs">
          {" "}
          Streamline opeartions,boost productivity,and make data-driven
          decisions with <br /> our comprehensive platform
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 p-5">
        <div>
          <div className="icon">
            <NotepadText className="text-white" />
          </div>
          <h1 className="mt-3 font-semibold text-lg">Smart Scheduling</h1>
          <p className="text-gray-500">
            Ai-powered scheduling that automaticly optimizes shift based on
            availability skills,and bussiness needs
          </p>
        </div>

        <div>
          <div className="icon">
            <Clock className="text-white" />
          </div>
          <h1 className="mt-3 font-semibold text-lg">Time Tracking </h1>
          <p className="paragraphs">
            Accurate time tracking with clock-in/out features,break
            Managemnt,and overtime calculations
          </p>
        </div>

        <div>
          <div className="icon">
            <Umbrella className="text-white" />
          </div>
          <h1 className="mt-3 font-semibold text-lg">Leave Managment</h1>
          <p className="paragraphs">
            Streamilined leave requests ,approval ,workflows ,and automatic
            balance tracking for all leave types
          </p>
        </div>

        <div>
          <div className="icon">
            <ChartSpline className="text-white" />
          </div>
          <h1 className="mt-3 font-semibold text-lg">Repores & AI insights</h1>
          <p className="paragraphs">
            comprehensive analytics and ai-generated insights to optimize
            workforce performance and costs!
          </p>
        </div>
      </div>

      {/* end our service */}
      {/* start why choose us  */}
      <div className="bg-sky-900 flex flex-col lg:flex-row ">
        <div className="flex-1 p-6 md:p-12 mt-6 lg:mt-12">
          <h3 className="font-semibold text-3xl md:text-4xl text-white mt-5">
            Why Choose ShiftMind
          </h3>

          <div className="space-y-4 mt-6">
            <div className="flex gap-4">
              <div className="bg-sky-200 w-6 h-6 flex items-center justify-center rounded-full">
                <Check className="mt-1 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  Reduce Administrative Overhead
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Automate Repetitive HR tasks and focus on strategic
                  initiatives
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-sky-200 w-6 h-6 flex items-center justify-center rounded-full ">
                <Check className="mt-1 text-white " />
              </div>
              <div>
                <p className="text-white font-semibold">
                  Improve Employee Productivity
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Tools and insights to help your team focus on what matters
                  most
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-sky-200 w-6 h-6 flex items-center justify-center rounded-full">
                <Check className="mt-1 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  Optimize Shift Scheduling
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Automatically match shifts to availability, skills, and
                  business needs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center py-6">
          <img
            src={dudes}
            alt="Team working"
            className="w-64 md:w-80 lg:w-[450px] rounded-xl"
          />
        </div>
      </div>

      {/* end why choose us  */}
      {/* start branding  */}
      <div className="bg-sky-200 h-80 pt-10">
        <div className="text-center">
          <h1 className="font-semibold text-3xl  p-3">
            Ready to Transform Your Workforce <br /> Managment?
          </h1>
          <p className="paragraphs">
            join thousands of companies already using ShifMind to optimize their
            opearations
          </p>
          <div className="mt-5 flex justify-center gap-4 mb-5">
            <button className="btn">Started Free Trial</button>
            <button className="btn2">Schdule Demo</button>
          </div>
        </div>
      </div>
      {/* end branding */}
{/* start footer  */}
<div className="bg-slate-900 text-white py-10 px-6 md:px-12">
  <div className="flex flex-col md:flex-row md:items-start gap-12">
    
    {/* Logo + Description */}
    <div className="flex flex-col items-start gap-3 md:w-1/4">
      <div className="flex items-center gap-3">
        <div className="icon">
          <Brain className="text-white" />
        </div>
        <h4 className="font-semibold text-lg md:text-xl">ShiftMind</h4>
      </div>
      <p className="text-gray-300 text-sm md:text-base">
        Smart workforce management and AI scheduling for modern businesses
      </p>
    </div>

    {/* Links */}
    <div className="flex justify-between gap-12 md:w-3/4">
      {/* Product */}
      <div>
        <h5 className="font-semibold mb-3">Product</h5>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">Features</p>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">Pricing</p>
        <p className="text-gray-400 hover:text-white cursor-pointer">Demo</p>
      </div>

      {/* Company */}
      <div>
        <h5 className="font-semibold mb-3">Company</h5>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">About</p>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">Contact</p>
        <p className="text-gray-400 hover:text-white cursor-pointer">Careers</p>
      </div>

      {/* Legal */}
      <div>
        <h5 className="font-semibold mb-3">Legal</h5>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">Terms</p>
        <p className="text-gray-400 hover:text-white cursor-pointer mb-1">Privacy</p>
        <p className="text-gray-400 hover:text-white cursor-pointer">Security</p>
      </div>
    </div>
    
  </div>
</div>



      {/* end Footer */}
    </div>
  );
};

export default Home;


