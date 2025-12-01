import React from "react";
import Button from "./Button";

const Branding = () => {
  return (
    <section className="w-full bg-gradient-to-r from-sky-200 to-sky-100 py-20">
      <div className="text-center px-6 max-w-4xl mx-auto">
        
        {/* TITLE */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#112D4E] leading-tight">
          Ready to Transform Your Workforce Management?
        </h2>

        {/* SUBTEXT */}
        <p className="mt-4 text-[#3F72AF] text-base md:text-lg">
          Join companies already using our platform to automate scheduling and improve productivity.
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex justify-center flex-wrap gap-4">
          <Button
            variant="primary"
            className="px-6 py-3 rounded-xl font-medium"
          >
            Start Free Trial
          </Button>

          <Button
            variant="outline"
            className="px-6 py-3 rounded-xl font-medium"
          >
            Schedule Demo
          </Button>
        </div>

        {/* FOOTNOTE */}
        <p className="mt-4 text-sm text-gray-600">
          No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default Branding;
