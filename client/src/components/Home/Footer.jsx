import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = [
    {
      title: t("footer.product"),
      links: [t("footer.features"), t("footer.pricing"), t("footer.demo")],
    },
    {
      title: t("footer.company"),
      links: [t("footer.about"), t("footer.contact"), t("footer.careers")],
    },
    {
      title: t("footer.legal"),
      links: [t("footer.terms"), t("footer.privacy"), t("footer.security")],
    },
  ];

  return (
    <footer className="bg-slate-900 text-white py-14 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start gap-12">
        {/* LOGO & DESCRIPTION */}
        <div className="flex flex-col items-start gap-4 md:w-1/3">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-xl">Tadbir</h4>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">
            {t("footer.description")}
          </p>
        </div>

        {/* DYNAMIC LINK SECTIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:w-2/3">
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h5 className="font-semibold mb-4 text-lg">{section.title}</h5>

              <ul className="space-y-2">
                {section.links.map((link, idx) => (
                  <li
                    key={idx}
                    className="text-gray-400 hover:text-white cursor-pointer transition"
                  >
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM TEXT */}
      <div className="text-center text-gray-500 mt-10 text-sm">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
};

export default Footer;
