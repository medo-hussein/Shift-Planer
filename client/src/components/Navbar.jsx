import { useState, useEffect } from "react";
import { Bell, Search, User, Menu, X, Check, Megaphone } from "lucide-react"; // ✅ ضيف Megaphone
import routes from "../routes/routesConfig";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notificationService } from "../api/services/notificationService"; // ✅
import AnnouncementModal from "./AnnouncementModal"; // ✅

export default function Navbar({ role }) {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false); // ✅

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { logout, userRole } = useAuth();
  const items = routes[role] || [];
  const navigate = useNavigate();

  // جلب الإشعارات
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
    const interval = setInterval(fetchNotifications, 60000); // كل دقيقة
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead([notif._id]);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: true } : n));
      } catch (err) { console.error(err); }
    }
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="w-full shadow bg-white sticky top-0 z-50">
      <div className="w-full flex items-center justify-between px-4 md:px-10 py-3 border-b">
        
        {/* Left Side */}
        <div className="flex items-center gap-2">
          <button className="md:hidden p-2" onClick={() => setOpenMobileMenu(!openMobileMenu)}>
            {openMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <img src="/logo.png" alt="Logo" className="lg:w-30 w-20" />
        </div>

        {/* Search (Hidden for simplicity in this snippet) */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-1/3">
          <Search size={18} className="text-gray-500" />
          <input type="text" placeholder="Search..." className="bg-transparent outline-none w-full" />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-3 md:gap-5 relative">
          
          {/* ✅ زر الإذاعة للمدراء فقط */}
          {["super_admin", "admin"].includes(userRole) && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full text-slate-600 hover:text-[#112D4E] transition relative group"
              title="Broadcast Message"
            >
              <Megaphone size={22} />
            </button>
          )}

          {/* ✅ الإشعارات */}
          <div className="relative">
            <button
              onClick={() => { setOpenNotificationMenu(!openNotificationMenu); setOpenProfileMenu(false); }}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <Bell size={22} className={unreadCount > 0 ? "text-slate-800" : "text-gray-500"} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {openNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif._id} onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition flex gap-3 ${!notif.is_read ? "bg-blue-50/30" : ""}`}
                      >
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.is_read ? "bg-blue-500" : "bg-transparent"}`}></div>
                        <div>
                          <p className={`text-sm ${!notif.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu (Keep as is) */}
          <div className="relative">
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full"
              onClick={() => { setOpenProfileMenu(!openProfileMenu); setOpenNotificationMenu(false); }}>
              <User size={22} />
              <span className="hidden md:inline text-sm font-medium">Ahmed</span>
            </button>
            {openProfileMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50">
                <ul className="flex flex-col">
                  <li className="px-4 py-2 text-gray-800 font-semibold">{userRole}</li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"><button onClick={logout}>Logout</button></li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Nav (Desktop) */}
      <nav className="hidden md:block w-full bg-[#1d2931] text-white md:px-7">
        <ul className="flex items-center gap-10 px-6 py-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink to={item.path} className={({ isActive }) => `flex items-center gap-2 hover:text-[#BBE1FA] transition ${isActive ? "text-[#BBE1FA] font-semibold" : ""}`}>
                  <Icon size={18} /> {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile Menu (Keep as is) */}
      {openMobileMenu && (
        <div className="md:hidden bg-[#1d2931] text-white px-6 py-3">
           {/* ... (Same as existing code) ... */}
        </div>
      )}

      {/* ✅ عرض مودال الإرسال */}
      {showAnnouncementModal && (
        <AnnouncementModal onClose={() => setShowAnnouncementModal(false)} />
      )}
    </div>
  );
}