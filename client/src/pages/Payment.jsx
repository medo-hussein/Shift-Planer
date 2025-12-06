import React, { useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

const PaymentForm = () => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { t } = useTranslation();

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace("/", "").length <= 4) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = () => {
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      alert(t("paymentForm.alerts.fillAllFields"));
      return;
    }

    setIsProcessing(true);

    console.log("Payment submitted:", {
      iframeId: 984693,
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
      saveCard,
    });

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert(t("paymentForm.alerts.paymentSuccess"));
    }, 2000);
  };

  // Detect card type
  const getCardType = () => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5")) return "mastercard";
    if (number.startsWith("9")) return "meeza";
    return null;
  };

  const getCardTypeLabel = (type) => {
    if (type === "visa") return "Visa";
    if (type === "mastercard") return "Mastercard";
    if (type === "meeza") return "Meeza";
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t("paymentForm.title")}
          </h1>
          <p className="text-slate-400">{t("paymentForm.subtitle")}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Visualization */}
            <div className="flex flex-col justify-center">
              <div className="relative">
                {/* Credit Card */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-2xl p-6 shadow-2xl transform transition-transform hover:scale-105 duration-300">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-10 bg-yellow-400/80 rounded-md"></div>
                    <CreditCard className="text-white/80" size={32} />
                  </div>

                  <div className="mb-6">
                    <div className="text-white/60 text-xs mb-1 uppercase tracking-wider">
                      {t("paymentForm.cardNumber")}
                    </div>
                    <div className="text-white text-xl font-mono tracking-wider">
                      {cardNumber || t("paymentForm.cardNumberPlaceholder")}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-white/60 text-xs mb-1 uppercase tracking-wider">
                        {t("paymentForm.cardHolder")}
                      </div>
                      <div className="text-white text-sm font-medium uppercase">
                        {cardHolder || t("paymentForm.cardHolderPlaceholder")}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 text-xs mb-1 uppercase tracking-wider">
                        {t("paymentForm.validThru")}
                      </div>
                      <div className="text-white text-sm font-mono">
                        {expiryDate || t("paymentForm.expiryPlaceholder")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-6 flex justify-center gap-4">
                  <div className="bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600 flex items-center justify-center">
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Cpath fill='%231434CB' d='M0 0h48v32H0z'/%3E%3Cpath fill='%23F79E1B' d='M19 8h10v16H19z'/%3E%3Cpath fill='%23EB001B' d='M20 16c0-3.3 1.5-6.2 3.8-8C21.7 6.3 19 5.5 16 5.5 10.2 5.5 5.5 10.2 5.5 16s4.7 10.5 10.5 10.5c3 0 5.7-.8 7.8-2.5-2.3-1.8-3.8-4.7-3.8-8z'/%3E%3Cpath fill='%23F79E1B' d='M42.5 16c0 5.8-4.7 10.5-10.5 10.5-3 0-5.7-.8-7.8-2.5 2.3-1.8 3.8-4.7 3.8-8s-1.5-6.2-3.8-8C26.3 6.3 29 5.5 32 5.5c5.8 0 10.5 4.7 10.5 10.5z'/%3E%3C/svg%3E"
                      alt={t("paymentForm.paymentMethods.mastercard")}
                      className="h-6"
                    />
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600 flex items-center justify-center">
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 32'%3E%3Cpath fill='%231A1F71' d='M0 0h48v32H0z'/%3E%3Cpath fill='%23F79E1B' d='M18.5 8.5l-4 15h-3l4-15h3zm13.5 9.7l1.5-4.2 1 4.2h-2.5zm3.5 5.3h2.5l-2.2-15h-2.5c-.6 0-1 .3-1.2.8l-4.3 14.2h3l.6-1.7h3.7l.4 1.7zm-8.7-4.9c0-4-5.5-4.2-5.5-6 0-.5.5-1.1 1.7-1.2.5 0 2 .1 3.5 1l.5-2.5c-.9-.3-2-.6-3.5-.6-3.3 0-5.6 1.8-5.6 4.3 0 1.9 1.7 2.9 3 3.5 1.3.7 1.8 1.1 1.8 1.7 0 .9-1.1 1.3-2.1 1.3-1.8 0-2.7-.5-3.5-.8l-.6 2.7c.8.4 2.3.7 3.8.7 3.5.1 5.5-1.7 5.5-4.1zm-13.3-10.1l-5 10.3-.5-2.7c-.9-3-3.8-6.3-7-7.9l2.7 12.8h3.3l4.9-12.5h-3.4z'/%3E%3Cpath fill='%23F79E1B' d='M9.5 8.5H3.7L3.6 9c4 1 6.6 3.4 7.7 6.3l-1.1-5.7c-.2-.5-.6-.8-1.2-1.1z'/%3E%3C/svg%3E"
                      alt={t("paymentForm.paymentMethods.visa")}
                      className="h-6"
                    />
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {t("paymentForm.paymentMethods.meeza")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div>
              <div className="space-y-5">
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t("paymentForm.form.cardNumber")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder={t("paymentForm.form.cardNumberPlaceholder")}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {getCardType() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                        <span className="text-xs text-slate-400">
                          {getCardTypeLabel(getCardType())}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Holder Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t("paymentForm.form.cardHolder")}
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) =>
                      setCardHolder(e.target.value.toUpperCase())
                    }
                    placeholder={t("paymentForm.form.cardHolderPlaceholder")}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                  />
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t("paymentForm.form.expiryDate")}
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder={t("paymentForm.form.expiryPlaceholder")}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t("paymentForm.form.cvv")}
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder={t("paymentForm.form.cvvPlaceholder")}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Save Card Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="saveCard"
                    className="ml-2 text-sm text-slate-300 cursor-pointer"
                  >
                    {t("paymentForm.form.saveCard")}
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label={t("paymentForm.buttons.completePayment")}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("paymentForm.buttons.processing")}
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      {t("paymentForm.buttons.completePayment")}
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Lock size={16} />
                  <span>{t("paymentForm.securityBadge")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>{t("paymentForm.footer")}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;