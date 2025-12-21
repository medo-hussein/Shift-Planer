import React, { useState } from "react";
import computer from "/images/home/computer.jpg";
import { Link } from "react-router";
import { PlayCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { t } = useTranslation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoUrl = "https://www.youtube.com/embed/YoAynDdkeCA?si=HG7Q47tEBZKp_es2"; 

  return (
    <div className="flex flex-col md:flex-row items-center w-full bg-linear-to-r from-sky-200 dark:from-slate-900 to-sky-50 dark:to-slate-800 px-6 md:px-12 py-10 md:py-20">

      {/* TEXT SECTION */}
      <div className="flex-1 mb-10 md:mb-0 md:pr-10">
        <h3 className="font-bold text-4xl md:text-5xl leading-tight text-gray-900 dark:text-white">
          {t("hero.title.line1")}{" "}
          <span className="text-sky-700 dark:text-sky-400">
            {t("hero.title.highlight")}
          </span>
        </h3>

        <p className="mt-5 text-gray-600 dark:text-slate-300 text-lg leading-relaxed">
          {t("hero.description")}
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex flex-wrap gap-4">

          {/* Primary CTA */}
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl font-medium bg-[#112D4E] dark:bg-sky-700 text-white hover:bg-[#0c2237] dark:hover:bg-sky-600 transition"
          >
            {t("hero.buttons.getStarted")}
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl font-medium border border-[#112D4E] dark:border-sky-400 text-[#112D4E] dark:text-sky-400 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            {t("hero.buttons.watchDemo")}
          </button>

        </div>
      </div>

      {/* IMAGE */}
      <div className="flex-1 flex justify-center">
        <img
          src={computer}
          alt={t("hero.imageAlt")}
          className="w-72 md:w-96 lg:w-[460px] rounded-2xl shadow-xl"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <X size={24} />
            </button>
            
            <div className="aspect-video w-full">
              <iframe
                src={videoUrl}
                title="Demo Video"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hero;