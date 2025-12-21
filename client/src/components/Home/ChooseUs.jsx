import React from "react";
import dudes from "/images/home/Hero.jpg";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChooseUs = () => {
  const { t } = useTranslation();

  const chooseUsData = [
    {
      titleKey: "chooseUs.items.reduceOverhead.title",
      descKey: "chooseUs.items.reduceOverhead.description",
    },
    {
      titleKey: "chooseUs.items.improveProductivity.title",
      descKey: "chooseUs.items.improveProductivity.description",
    },
    {
      titleKey: "chooseUs.items.optimizeScheduling.title",
      descKey: "chooseUs.items.optimizeScheduling.description",
    },
  ];

  return (
    <div className="bg-linear-to-r from-sky-950 dark:from-slate-950 via-sky-900 dark:via-slate-800 to-sky-800 dark:to-slate-700 flex flex-col lg:flex-row">
      {/* TEXT SECTION */}
      <div className="flex-1 p-6 md:p-12 mt-6 lg:mt-12">
        <h3 className="font-semibold text-3xl md:text-4xl text-white dark:text-sky-100 my-5">
          {t("chooseUs.title")}
        </h3>

        <div className="space-y-4 mt-6">
          {chooseUsData.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="bg-sky-200 dark:bg-sky-400/20 w-6 h-6 flex items-center justify-center rounded-full mt-1">
                <Check className="mt-0.5 text-sky-950 dark:text-sky-300" size={16} />
              </div>

              <div>
                <p className="text-white dark:text-sky-100 font-semibold">{t(item.titleKey)}</p>
                <p className="text-gray-300 dark:text-sky-200/70 text-sm mt-1">{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE SECTION */}
      <div className="flex-1 flex justify-center items-center py-6">
        <img
          src={dudes}
          alt={t("chooseUs.imageAlt")}
          className="w-64 md:w-80 lg:w-[450px] rounded-xl"
        />
      </div>
    </div>
  );
};

export default ChooseUs;