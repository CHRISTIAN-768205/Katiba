import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, Sun, Moon, Bell, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar({ onSearch }) {
  const { lang, setLang, dark, setDark, setMobileNavOpen, t } = useApp();
  const { user, isAuthenticated, logout } = useAuth();
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!q.trim() || searching) return;
    setSearching(true);
    try {
      await onSearch?.(q);
      setQ("");
    } finally {
      setSearching(false);
    }
  }

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
      <button
        className="lg:hidden text-gray-600 dark:text-gray-300"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <form className="flex-1 max-w-xl relative" onSubmit={handleSubmit}>
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("topbar.search")}
          disabled={searching}
          className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center rounded-full border border-gray-200 dark:border-gray-800 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={`px-3 py-1.5 ${lang === "en" ? "bg-emerald-800 text-white" : "text-gray-600 dark:text-gray-300"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("sw")}
            aria-pressed={lang === "sw"}
            className={`px-3 py-1.5 ${lang === "sw" ? "bg-emerald-800 text-white" : "text-gray-600 dark:text-gray-300"}`}
          >
            SW
          </button>
        </div>

        <button
          onClick={() => setDark(!dark)}
          className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center"
          aria-label={dark ? t("topbar.darkMode.toLight") : t("topbar.darkMode.toDark")}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          className="relative w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center"
          aria-label={t("topbar.notifications")}
        >
          <Bell className="w-4 h-4" />
        </button>

        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold">
                {initials || "?"}
              </div>
              <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1.5 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600 mt-0.5">{user.role}</div>
                </div>
                {user.role === "advocate" && (
                  <Link
                    to="/lawyer/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}