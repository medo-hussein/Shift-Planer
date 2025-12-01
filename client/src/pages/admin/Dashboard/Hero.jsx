import React from "react";
import { TrendingUp, Zap } from "lucide-react";

const Hero = () => {
  return (
    <header className="rounded-xl overflow-hidden shadow-md mb-6">
      <div
        className="h-36 sm:h-44 md:h-50 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('images/admin/dashboard-hero.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-[#396FA5]/90 to-[#6992BB]/60 p-4 sm:p-6 md:p-8 flex flex-col justify-center">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            Welcome back, John!
          </h1>
          <p className="text-xs sm:text-[16px] font-medium text-white mb-2">
            Here's what's happening with your team today
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs sm:text-sm text-white">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              15% increase in productivity this month
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              All shifts covered for this week
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
