import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from "lucide-react";
import HomeNav from "../components/Home/HomeNav";
import { useTranslation } from "react-i18next";
import Footer from "../components/Home/Footer";
import apiClient from "../api/apiClient";

const ContactUs = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/api/contact", formData);

      setLoading(false);
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", message: "" });

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setLoading(false);
      setError(t("contact.form.errorMessage") || "Failed to send message. Please try again.");
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t("contact.contactInfo.email.title"),
      value: t("contact.contactInfo.email.value"),
      link: t("contact.contactInfo.email.link"),
    },
    {
      icon: Phone,
      title: t("contact.contactInfo.phone.title"),
      value: t("contact.contactInfo.phone.value"),
      link: t("contact.contactInfo.phone.link"),
    },
    {
      icon: MapPin,
      title: t("contact.contactInfo.address.title"),
      value: t("contact.contactInfo.address.value"),
      link: null,
    },
  ];

  const businessHours = [
    { days: t("contact.businessHours.weekdays.days"), hours: t("contact.businessHours.weekdays.hours") },
    { days: t("contact.businessHours.weekends.days"), hours: t("contact.businessHours.weekends.hours") },
  ];

  return (
    <>
      <HomeNav />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* HERO SECTION */}
        <section className="bg-linear-to-r from-sky-200 to-sky-50 dark:from-gray-800 dark:to-gray-900 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-bold text-4xl md:text-5xl text-slate-900 dark:text-white mb-6">
              {t("contact.hero.title")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {t("contact.hero.description")}
            </p>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* CONTACT FORM */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-2xl md:text-3xl text-slate-900 dark:text-white mb-6">
                  {t("contact.form.title")}
                </h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-700 dark:text-green-300">
                      {t("contact.form.successMessage")}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("contact.form.name.label")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
                      placeholder={t("contact.form.name.placeholder")}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("contact.form.email.label")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
                      placeholder={t("contact.form.email.placeholder")}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("contact.form.phone.label")}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
                      placeholder={t("contact.form.phone.placeholder")}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("contact.form.message.label")}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-600 focus:border-transparent transition resize-none"
                      placeholder={t("contact.form.message.placeholder")}
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-slate-900 dark:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t("contact.form.sending")}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t("contact.form.submit")}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CONTACT INFO */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-bold text-2xl md:text-3xl text-slate-900 dark:text-white mb-6">
                    {t("contact.contactInfo.title")}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                    {t("contact.contactInfo.description")}
                  </p>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-r from-sky-700 to-sky-800 flex items-center justify-center shadow-md shrink-0">
                            <Icon className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                              {info.title}
                            </h3>
                            {info.link ? (
                              <a
                                href={info.link}
                                className="text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition"
                              >
                                {info.value}
                              </a>
                            ) : (
                              <p className="text-gray-600 dark:text-gray-300">
                                {info.value}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BUSINESS HOURS */}
                <div className="bg-linear-to-r from-sky-950 via-sky-900 to-sky-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-8 rounded-2xl">
                  <h3 className="font-bold text-xl text-white mb-4">
                    {t("contact.businessHours.title")}
                  </h3>
                  <div className="space-y-2 text-gray-200 dark:text-gray-300">
                    {businessHours.map((hours, index) => (
                      <p key={index}>
                        <span className="font-medium">{hours.days}: </span>
                        {hours.hours}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </div>
    </>
  );
};

export default ContactUs;