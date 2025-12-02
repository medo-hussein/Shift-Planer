import React, { useState } from "react";
import { X, Send, Megaphone } from "lucide-react";
import { notificationService } from "../api/services/notificationService";
import { useLoading } from "../contexts/LoaderContext";

export default function AnnouncementModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { show, hide } = useLoading();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      show();
      const res = await notificationService.sendAnnouncement({ title, message });
      alert(res.data.message);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send announcement");
    } finally {
      hide();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100">
        <div className="bg-[#112D4E] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-yellow-400" />
            <h3 className="font-bold text-lg">Broadcast Message</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100">
             This message will be sent as a notification to all your active team members instantly.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input 
              type="text" required maxLength={50}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF]"
              placeholder="e.g., Important Meeting"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
            <textarea 
              required rows={4}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] resize-none"
              placeholder="Type your announcement..."
              value={message} onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="w-full py-3 bg-[#112D4E] hover:bg-[#274b74] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md">
            <Send size={18} /> Send to Everyone
          </button>
        </form>
      </div>
    </div>
  );
}