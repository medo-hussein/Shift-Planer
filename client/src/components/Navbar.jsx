import { useState, useEffect, useContext, useRef } from "react";
import {
  Bell,
  User,
  Menu,
  X,
  Check,
  Megaphone,
  Moon,
  Sun,
  Home,
} from "lucide-react";
import routes from "../routes/routesConfig";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notificationService } from "../api/services/notificationService";
import AnnouncementModal from "./AnnouncementModal";
import { ThemeContext } from "../contexts/ThemeContext.jsx";
import PlanBadge from "./Shared/PlanBadge";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ role }) {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout, userRole, user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const items = routes[role] || [];
  const navigate = useNavigate();
  const { t } = useTranslation();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setOpenNotificationMenu(false);
      }

      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead([notif._id]);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
      setOpenNotificationMenu(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="w-full shadow bg-white dark:bg-slate-900 sticky top-0 z-50 transition-colors animate-fadeIn"
      dir="ltr"
    >
      {/* Top Bar - Force LTR for layout consistency, but inner components handle RTL */}
      <div className="w-full flex items-center justify-between gap-4 px-4 md:px-10 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden dark:text-white"
            onClick={() => setOpenMobileMenu(!openMobileMenu)}
          >
            {openMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          {theme === "light" ? (
            <img
              src="/icons/lightLogo.png"
              alt="Logo"
              className="lg:w-32 w-28 object-contain"
            />
          ) : (
            <img
              src="/icons/darkLogo.png"
              alt="Logo"
              className="lg:w-32 w-28 object-contain"
            />
          )}
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 md:gap-4 relative">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => navigate("/")}
            className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
            title={t("navbar.homeTitle")}
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {["super_admin", "admin"].includes(userRole) && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
              title={t("navbar.broadcastTitle")}
            >
              <Megaphone size={20} />
            </button>
          )}

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenNotificationMenu((prev) => !prev);
                setOpenProfileMenu(false);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
            >
              <Bell
                size={20}
                className={unreadCount > 0 ? "text-slate-600" : "text-gray-500"}
              />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {openNotificationMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 md:w-80 w-72 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-fadeIn text-start"
              >
                <div className="p-3 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
                  <h3 className="font-semibold text-gray-700 dark:text-slate-200 text-sm">
                    {t("navbar.notifications")}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <Check size={12} /> {t("navbar.markAllRead")}
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition flex gap-3 ${
                          !notif.is_read
                            ? "bg-blue-50/30 dark:bg-blue-900/30"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            !notif.is_read ? "bg-blue-500" : "bg-transparent"
                          }`}
                        ></div>
                        <div>
                          <p
                            className={`text-sm ${
                              !notif.is_read
                                ? "font-semibold text-gray-800 dark:text-slate-100"
                                : "text-gray-600 dark:text-slate-400"
                            }`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{t("navbar.noNotifications")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div ref={profileRef} className="relative">
            <button
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
              onClick={(e) => {
                e.stopPropagation();
                setOpenProfileMenu((prev) => !prev);
                setOpenNotificationMenu(false);
              }}
            >
              <div className="flex flex-col items-end md:items-center md:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                    <User size={18} />
                  </div>
                  <span className="hidden md:inline text-sm font-medium pr-2">
                    {user?.name || t("navbar.profile")}
                  </span>
                </div>
                {/* Show Badge only for Super Admin */}
                {userRole === "super_admin" && (
                  <div className="hidden md:block">
                    <PlanBadge
                      planSlug={user?.plan_slug}
                      planName={user?.plan_name}
                    />
                  </div>
                )}
              </div>
            </button>
            {openProfileMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-slate-100 dark:border-slate-700 z-50 text-start overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <ul className="flex flex-col py-1">
                  <li className="px-4 py-2 text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    {userRole?.replace("_", " ")}
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer text-red-600 dark:text-red-400 transition flex items-center gap-2">
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2"
                    >
                      {t("navbar.logout")}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block w-full bg-[#1d2931] dark:bg-black text-white md:px-7 border-t border-slate-700/50">
        <ul className="flex items-center gap-8 px-6 py-3 overflow-x-auto">
          {items
            .filter((item) => !item.hidden)
            .map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="shrink-0">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 text-sm font-medium transition py-1 border-b-2 ${
                        isActive
                          ? "text-[#BBE1FA] border-[#BBE1FA]"
                          : "text-slate-300 border-transparent hover:text-white"
                      }`
                    }
                  >
                    <Icon size={16} /> {t(item.translationKey || item.label)}
                  </NavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Mobile Navigation */}
      {openMobileMenu && (
        <div className="md:hidden bg-[#1d2931] dark:bg-slate-900 text-white px-4 py-4 animate-slideDown">
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-2 py-2 text-slate-300 hover:text-[#BBE1FA] transition rounded-lg hover:bg-slate-800"
            >
              <Home className="w-5 h-5" />
              <span>{t("navbar.homeTitle")}</span>
            </button>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Navigation Links */}
          <ul className="flex flex-col gap-1">
            {items
              .filter((item) => !item.hidden)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setOpenMobileMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                          isActive
                            ? "text-[#BBE1FA] font-semibold bg-slate-800"
                            : "text-slate-300 hover:text-[#BBE1FA] hover:bg-slate-800"
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span>{t(item.translationKey || item.label)}</span>
                    </NavLink>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementModal onClose={() => setShowAnnouncementModal(false)} />
      )}
    </div>
  );
}
