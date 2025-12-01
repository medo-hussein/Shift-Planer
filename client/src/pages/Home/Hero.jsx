import React from "react";
import computer from "/images/home/computer.jpg";
import { Link } from "react-router";
import { PlayCircle } from "lucide-react";

const Hero = () => {
  return (
    <div className="flex flex-col md:flex-row items-center w-full bg-gradient-to-r from-sky-200 to-sky-50 px-6 md:px-12 py-10 md:py-20">

      {/* TEXT SECTION */}
      <div className="flex-1 mb-10 md:mb-0 md:pr-10">
        <h3 className="font-bold text-4xl md:text-5xl leading-tight text-gray-900">
          Smart Workforce <br />
          Management &{" "}
          <span className="text-sky-700">
            AI <br /> Scheduling System
          </span>
        </h3>

        <p className="mt-5 text-gray-600 text-lg leading-relaxed">
          Revolutionize your Area operations with intelligent scheduling,
          automated time tracking, and AI-powered insights that boost
          productivity.
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex flex-wrap gap-4">

          {/* Primary CTA */}
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl font-medium bg-[#112D4E] text-white"
          >
            Get Started Free
          </Link>

          {/* Outline CTA */}
          <Link
            to="#"
            className="px-6 py-3 rounded-xl font-medium border border-[#112D4E] text-[#112D4E] flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Watch Demo
          </Link>

        </div>
      </div>

      {/* IMAGE */}
      <div className="flex-1 flex justify-center">
        <img
          src={computer}
          alt="Workforce system"
          className="w-72 md:w-96 lg:w-[460px] rounded-2xl shadow-xl"
        />
      </div>
    </div>
  );
};

export default Hero;
