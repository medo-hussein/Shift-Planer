import { Link } from "react-router";
import { Menu, LogIn, UserPlus, Moon, Sun, LayoutDashboard, X,Search ,Phone} from "lucide-react";
import { useContext, useState } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";

const HomeNav = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="w-full bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={theme === "light" ? "/icons/lightLogo.png" : "/icons/darkLogo.png"}
            alt={t("nav.logoAlt")}
            className="lg:w-30 w-20"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-5">

          {/* Public Links */}
          <Link
            to="/about"
            className="text-slate-600 dark:text-slate-300 hover:text-[#112D4E] dark:hover:text-white transition font-medium"
          >
            {t("nav.about")}
          </Link>
          <Link
            to="/contact"
            className="text-slate-600 dark:text-slate-300 hover:text-[#112D4E] dark:hover:text-white transition font-medium"
          >
            {t("nav.contact")}
          </Link>

          <LanguageSwitcher />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2"></div>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-[#112D4E] dark:bg-sky-700 text-white px-5 py-2 rounded-xl hover:bg-[#0c2237] dark:hover:bg-sky-600 transition font-medium shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t("navDashboard")}
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

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {!open ? <Menu className="w-6 h-6 text-[#112D4E] dark:text-sky-400" /> : <X className="w-6 h-6 text-[#112D4E] dark:text-sky-400" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t dark:border-slate-700 px-6 py-4 flex flex-col gap-4 animate-fadeIn">
          
          <div className="flex justify-between">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {t("theme")}
            </button>
            <LanguageSwitcher />
          </div>


          {/* Mobile Links */}
          <Link
            to="/about"
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium hover:text-[#112D4E] dark:hover:text-white"
            onClick={() => setOpen(false)}
          >
            <Search className="w-5 h-5"/>
            {t("nav.about")}
          </Link>
          <Link
            to="/contact"
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium hover:text-[#112D4E] dark:hover:text-white"
            onClick={() => setOpen(false)}
          >
            <Phone className="w-5 h-5"/>
            {t("nav.contact")}
          </Link>

          {!isAuthenticated ? (
            <>
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
            </>
          ) : (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-[#112D4E] dark:bg-sky-700 text-white px-5 py-2 rounded-xl"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4" />
              {t("navDashboard")}
            </Link>
          )}

        </div>
      )
      }
    </nav >
  );
};

export default HomeNav;
