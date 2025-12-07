import { useState, useEffect, useContext } from "react";
import { Bell, User, Menu, X, Check, Megaphone, Moon, Sun, Home } from "lucide-react";
import routes from "../routes/routesConfig";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notificationService } from "../api/services/notificationService";
import AnnouncementModal from "./AnnouncementModal";
import { ThemeContext } from "../contexts/ThemeContext.jsx";
import PlanBadge from "./Shared/PlanBadge";
import { useTranslation } from "react-i18next";


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
  const { t, i18n } = useTranslation();


  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

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
    <div className="w-full shadow bg-white dark:bg-slate-900 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-4 md:px-10 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2 dark:text-white"
            onClick={() => setOpenMobileMenu(!openMobileMenu)}
          >
            {openMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          {
            theme === "light" ? (
              <img src="/icons/lightLogo.png" alt="Logo" className="lg:w-30 w-20" />
            ) : (
              <img src="/icons/darkLogo.png" alt="Logo" className="lg:w-30 w-20" />
            )
          }
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-3 md:gap-5 relative">

          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="hidden md:block border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
            title={t("navbar.homeTitle")}
          >
            <Home className="w-6 h-6" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
          >
            {theme === "light" ? (
              <Moon className="w-6 h-6" />
            ) : (
              <Sun className="w-6 h-6" />
            )}
          </button>

          {["super_admin", "admin"].includes(userRole) && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
              title={t("navbar.broadcastTitle")}
            >
              <Megaphone size={22} />
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setOpenNotificationMenu(!openNotificationMenu);
                setOpenProfileMenu(false);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition relative group"
            >
              <Bell
                size={22}
                className={unreadCount > 0 ? "text-slate-600" : "text-gray-500"}
              />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {openNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-fadeIn">
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
                        className={`p-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition flex gap-3 ${!notif.is_read
                          ? "bg-blue-50/30 dark:bg-blue-900/30"
                          : ""
                          }`}
                      >
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.is_read ? "bg-blue-500" : "bg-transparent"
                            }`}
                        ></div>
                        <div>
                          <p
                            className={`text-sm ${!notif.is_read
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
          <div className="relative">
            <button
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-300"
              onClick={() => {
                setOpenProfileMenu(!openProfileMenu);
                setOpenNotificationMenu(false);
              }}
            >
              <div className="flex flex-col items-end md:items-center md:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <User size={22} />
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.name || t("navbar.profile")}
                  </span>
                </div>
                {/* Show Badge only for Super Admin */}
                {userRole === 'super_admin' && (
                  <div className="hidden md:block">
                    <PlanBadge planSlug={user?.plan_slug} planName={user?.plan_name} />
                  </div>
                )}
              </div>
            </button>
            {openProfileMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 shadow-lg rounded-lg z-50">
                <ul className="flex flex-col">
                  <li className="px-4 py-2 text-gray-800 dark:text-slate-200 font-semibold">
                    {userRole}
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-red-600 dark:text-red-400">
                    <button onClick={logout}>{t("navbar.logout")}</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block w-full bg-[#1d2931] dark:bg-black text-white md:px-7">
        <ul className="flex items-center gap-10 px-6 py-3">
          {items.filter(item => !item.hidden).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 hover:text-[#BBE1FA] transition ${isActive ? "text-[#BBE1FA] font-semibold" : ""
                    }`
                  }
                >
                  <Icon size={18} /> {t(item.translationKey || item.label)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>


      {/* Mobile Navigation */}
      {openMobileMenu && (
        <div className="md:hidden bg-[#1d2931] dark:bg-slate-900 text-white px-6 py-3">
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="mb-4 border border-slate-600 dark:border-slate-500 rounded-lg px-2 py-1 text-sm bg-slate-800 text-white"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>
          <ul className="flex flex-col gap-4">
            {items.filter(item => !item.hidden).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setOpenMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 hover:text-[#BBE1FA] transition py-2 ${isActive ? "text-[#BBE1FA] font-semibold" : ""
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