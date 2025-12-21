import React, { useState } from "react";
import { X, Send, Megaphone } from "lucide-react";
import { notificationService } from "../api/services/notificationService";
import { useLoading } from "../contexts/LoaderContext";
import { useTranslation } from "react-i18next";
import { Alert } from "../utils/alertService"; 

export default function AnnouncementModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { show, hide } = useLoading();
  const { t } = useTranslation();

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
        return Alert.warning("Please fill all fields"); 
    }

    try {
      show();
      const res = await notificationService.sendAnnouncement({ title, message });
      
      Alert.success(res.data.message);
      
      onClose();
    } catch (err) {
      Alert.error(err.response?.data?.message || t("announcementModal.errors.failedToSend"));
    } finally {
      hide();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 dark:text-slate-100">
        <div className="bg-[#112D4E] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-yellow-400" />
            <h3 className="font-bold text-lg">{t("announcementModal.title")}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/20 rounded-full transition"
            aria-label={t("announcementModal.buttons.close")}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            {t("announcementModal.infoText")}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {t("announcementModal.form.titleLabel")}
            </label>
            <input 
              type="text" 
              required 
              maxLength={50}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              placeholder={t("announcementModal.form.titlePlaceholder")}
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {t("announcementModal.form.messageLabel")}
            </label>
            <textarea 
              required 
              rows={4}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              placeholder={t("announcementModal.form.messagePlaceholder")}
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#112D4E] hover:bg-[#274b74] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md"
          >
            <Send size={18} /> {t("announcementModal.buttons.send")}
          </button>
        </form>
      </div>
    </div>
  );
}
