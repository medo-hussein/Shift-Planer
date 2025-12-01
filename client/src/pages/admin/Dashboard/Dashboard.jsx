import React from "react";
import Hero from "./Hero";
import Stats from "./Stats";
import Access from "./Access";
import Activity from "./Activity";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Hero />
      <Stats />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Quick Actions + Schedule preview */}
        <Access />

        {/* Right - Recent activity */}
        <Activity />
      </main>
    </div>
  );
}
