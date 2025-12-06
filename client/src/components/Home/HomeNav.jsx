import { Link } from "react-router";
import { Menu, LogIn, UserPlus, Moon, Sun, LayoutDashboard } from "lucide-react";
import { useContext, useState } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";

const HomeNav = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="w-full bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <img
              src={theme === "light" ? "/icons/lightLogo.png" : "/icons/darkLogo.png"}
              alt={t("nav.logoAlt")}
              className="lg:w-30 w-20"
            />
          </Link>
        </div>

        {/* Theme Button */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-slate-200 transition"
        >
          {theme === "light" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-[#112D4E] dark:bg-sky-700 text-white px-5 py-2 rounded-xl hover:bg-[#0c2237] dark:hover:bg-sky-600 transition font-medium shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1 text-[#112D4E] dark:text-sky-400 font-medium hover:text-[#0b1c2c] dark:hover:text-sky-300 transition"
              >
                <LogIn className="w-4 h-4" />
                {t("nav.login")}
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#112D4E] dark:bg-sky-700 text-white px-5 py-2 rounded-xl hover:bg-[#0c2237] dark:hover:bg-sky-600 transition font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                {t("nav.getStarted")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <Menu className="w-6 h-6 text-[#112D4E] dark:text-sky-400" />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t dark:border-slate-700 px-6 py-3 flex flex-col gap-3 animate-fadeIn">
          <Link
            to="/login"
            className="flex items-center gap-2 text-[#112D4E] dark:text-sky-400 font-medium"
            onClick={() => setOpen(false)}
          >
            <LogIn className="w-4 h-4" />
            {t("nav.login")}
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 bg-[#112D4E] dark:bg-sky-700 text-white px-5 py-2 rounded-xl"
            onClick={() => setOpen(false)}
          >
            <UserPlus className="w-4 h-4" />
            {t("nav.getStarted")}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default HomeNav;
