import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import {
    MessageSquare,
    Search,
    CheckCircle,
    Clock,
    Reply,
    Trash2,
    X,
    Send,
    Loader,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useLoading } from "../../contexts/LoaderContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const Messages = () => {
    const { t, i18n } = useTranslation();
    const { show, hide } = useLoading();
    const [messages, setMessages] = useState([]);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMessages, setTotalMessages] = useState(0);
    const limit = 10;

    // Reply Modal State
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [page, filter]); // Refetch on page or filter change

    const fetchMessages = async () => {
        try {
            show();
            // Construct query params
            const query = new URLSearchParams({
                page,
                limit,
                ...(filter !== 'all' && { status: filter })
            });

            const { data } = await apiClient.get(`/api/contact?${query}`);
            if (data.success) {
                setMessages(data.data);
                // Update pagination info if available
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalMessages(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            hide();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t("messages.confirmDelete"))) return;
        try {
            await apiClient.delete(`/api/contact/${id}`);
            setMessages(messages.filter((m) => m._id !== id));
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setSendingReply(true);
        try {
            await apiClient.post(`/api/contact/${selectedMessage._id}/reply`, {
                replyMessage,
            });

            // Update local state
            setMessages(messages.map(m =>
                m._id === selectedMessage._id ? { ...m, status: 'replied' } : m
            ));

            setSelectedMessage(null);
            setReplyMessage("");
        } catch (error) {
            console.error("Failed to send reply", error);
            alert(t("messages.replyFailed"));
        } finally {
            setSendingReply(false);
        }
    };

    const filteredMessages = messages.filter((msg) => {
        const matchesFilter = filter === "all" || msg.status === filter;
        const matchesSearch =
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case "replied": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "read": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "replied": return t("messages.status.replied");
            case "read": return t("messages.status.read");
            default: return t("messages.status.unread"); // Pending/Unread
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 lg:p-10 font-sans text-slate-800 dark:text-slate-200" dir={i18n.dir()}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        {t("messages.title")}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {t("messages.subtitle")}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex gap-2">
                    {['all', 'unread', 'replied'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? "bg-sky-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-50"
                                }`}
                        >
                            {t(`messages.filter.${f}`)}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t("messages.searchRequests")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-64"
                    />
                </div>
            </div>

            {/* Messages Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t("messages.table.sender")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t("messages.table.subject")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t("messages.table.date")}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t("messages.table.status")}
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t("messages.table.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>{t("messages.noMessages")}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <tr key={msg._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold uppercase">
                                                    {msg.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {msg.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{msg.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                {msg.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                                                {getStatusLabel(msg.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedMessage(msg)}
                                                    className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                    title={t("messages.actions.reply")}
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(msg._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t("messages.actions.delete")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {t("common.pagination.showing")} <span className="font-medium">{(page - 1) * limit + 1}</span> {t("common.pagination.to")} <span className="font-medium">{Math.min(page * limit, totalMessages)}</span> {t("common.pagination.of")} <span className="font-medium">{totalMessages}</span> {t("common.pagination.results")}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {t("messages.replyModal.title")}
                                </h3>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="text-slate-400 hover:text-slate-600 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">{t("messages.replyModal.to")}:</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{selectedMessage.name} &lt;{selectedMessage.email}&gt;</p>
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 mb-1">{t("messages.replyModal.originalMessage")}:</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 italic">
                                            "{selectedMessage.message}"
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t("messages.replyModal.yourReply")}
                                    </label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        rows="6"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                        placeholder={t("messages.replyModal.placeholder")}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 transition"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={handleReplySubmit}
                                    disabled={sendingReply || !replyMessage.trim()}
                                    className="px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingReply ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {t("messages.replyModal.send")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Messages;
