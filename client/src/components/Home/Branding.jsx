import React, { use } from "react";
import Button from "../../utils/Button.jsx";
import { useTranslation } from "react-i18next";

const Branding = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full bg-linear-to-r from-sky-200 dark:from-sky-950 to-sky-100 dark:to-sky-900 py-20">
      <div className="text-center px-6 max-w-4xl mx-auto">
        {/* TITLE */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#112D4E] dark:text-sky-200 leading-tight">
          {t("ready to transform your workforce management")}
        </h2>

        {/* SUBTEXT */}
        <p className="mt-4 text-[#3F72AF] dark:text-sky-300 text-base md:text-lg">
    {t( "Join companies already using our platform to automate scheduling andimprove productivity")}
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex justify-center flex-wrap gap-4">
          <Button
            variant="primary"
            className="px-6 py-3 rounded-xl font-medium"
          >
           {t( "startFreeTrial")}
          </Button>

          <Button
            variant="outline"
            className="px-6 py-3 rounded-xl font-medium"
          >
           {t("scheduleDemo")}
          </Button>
        </div>

        {/* FOOTNOTE */}
        <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
         {t("noCreditCardRequired")}
        </p>
      </div>
    </section>
  );
};

export default Branding;
