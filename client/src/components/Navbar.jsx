import { useState } from "react";
import { Bell, Search, User, Menu, X } from "lucide-react";
import routes from "../routes/routesConfig";
import { NavLink } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Navbar({ role }) {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
  const { logout, userRole } = useAuth();
  const items = routes[role] || [];

  return (
    <div className="w-full shadow bg-white sticky top-0 z-50">
      {/* TOP NAVBAR */}
      <div className="w-full flex items-center justify-between px-4 md:px-10 py-3 border-b">
        {/* Left side: Hamburger + Website Name */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2"
            onClick={() => setOpenMobileMenu(!openMobileMenu)}
          >
            {openMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>

          <img src="logo.png" alt="Logo" className="lg:w-30 w-20" />
        </div>

        {/* Search (desktop only) */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-1/3">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none w-full"
          />
        </div>

        {/* Icons Right */}
        <div className="flex items-center gap-4 md:gap-6 relative">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setOpenNotificationMenu(!openNotificationMenu);
                setOpenProfileMenu(false);
              }}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {openNotificationMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-lg p-3 z-50">
                <p className="text-gray-500 text-sm text-center">
                  No notifications
                </p>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full"
              onClick={() => {
                setOpenProfileMenu(!openProfileMenu);
                setOpenNotificationMenu(false);
              }}
            >
              <User size={22} />
              <span className="hidden md:inline text-sm font-medium">
                Ahmed
              </span>
            </button>

            {openProfileMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50">
                <ul className="flex flex-col">
                  <li className="px-4 py-2 text-gray-800 font-semibold underline-offset-8 ">
                    {userRole}
                  </li>

                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600">
                    <button onClick={logout} className="cursor-pointer">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVBAR (DESKTOP) */}
      <nav className="hidden md:block w-full bg-[#1d2931] text-white md:px-7">
        <ul className="flex items-center gap-10 px-6 py-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 hover:text-[#BBE1FA] transition ${
                      isActive ? "text-[#BBE1FA] font-semibold" : ""
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* MOBILE MENU  */}
      {openMobileMenu && (
        <div className="md:hidden bg-[#1d2931] text-white px-6 py-3">
          <div className="flex flex-col gap-4">
            {/* Mobile Search */}
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-full mb-1">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none w-full text-gray-700"
              />
            </div>

            {/* Routes */}
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-sm flex items-center gap-3 py-2 border-b border-gray-600 hover:text-[#BBE1FA] transition ${
                      isActive ? "text-[#BBE1FA] font-semibold" : ""
                    }`
                  }
                  onClick={() => setOpenMobileMenu(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
