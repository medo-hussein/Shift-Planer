import { NotepadText, Clock, Plane, ChartSpline } from "lucide-react";
import { useTranslation } from "react-i18next";

const Services = () => {
  const { t } = useTranslation();

  const servicesData = [
    {
      icon: NotepadText,
      titleKey: "services.items.smartScheduling.title",
      descKey: "services.items.smartScheduling.description",
    },
    {
      icon: Clock,
      titleKey: "services.items.timeTracking.title",
      descKey: "services.items.timeTracking.description",
    },
    {
      icon: Plane,
      titleKey: "services.items.leaveManagement.title",
      descKey: "services.items.leaveManagement.description",
    },
    {
      icon: ChartSpline,
      titleKey: "services.items.reportsAiInsights.title",
      descKey: "services.items.reportsAiInsights.description",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="font-bold text-3xl md:text-4xl leading-tight text-[#112D4E] dark:text-sky-100">
          {t("services.title")}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-slate-300 text-lg">
          {t("services.subtitle")}
        </p>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 px-6 md:px-12">
        {servicesData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* ICON */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-sky-700 to-sky-800 dark:from-sky-600 dark:to-sky-700 flex items-center justify-center shadow-md">
                <Icon className="text-white" size={28} />
              </div>

              {/* TITLE */}
              <h1 className="mt-5 font-semibold text-xl text-[#112D4E] dark:text-sky-100">
                {t(item.titleKey)}
              </h1>

              {/* DESC */}
              <p className="mt-2 text-gray-600 dark:text-slate-300 leading-relaxed">
                {t(item.descKey)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Services;