import React from "react";
import { NavLink } from "react-router-dom";
import {
  Scale,
  Home,
  BookOpen,
  Gavel,
  FolderOpen,
  Bot,
  Users,
  Bookmark,
  Info,
  ShieldCheck,
  X,
  MessageSquare,
  Inbox,
  Settings as SettingsIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

const navItems = [
  { to: "/", icon: Home, labelKey: "nav.home", subKey: "nav.home.sub", end: true },
  { to: "/constitution", icon: BookOpen, labelKey: "nav.constitution", subKey: "nav.constitution.sub" },
  { to: "/laws", icon: Scale, labelKey: "nav.laws", subKey: "nav.laws.sub" },
  { to: "/case-law", icon: Gavel, labelKey: "nav.caseLaw", subKey: "nav.caseLaw.sub" },
  { to: "/topics", icon: FolderOpen, labelKey: "nav.topics", subKey: "nav.topics.sub" },
  { to: "/ask", icon: Bot, labelKey: "nav.ask", subKey: "nav.ask.sub" },
  { to: "/lawyers", icon: Users, labelKey: "nav.lawyers", subKey: "nav.lawyers.sub" },
  { to: "/messages", icon: MessageSquare, labelKey: "nav.messages", subKey: "nav.messages.sub" },
  { to: "/requests", icon: Inbox, labelKey: "nav.myRequests", subKey: "nav.myRequests.sub" },
  { to: "/saved", icon: Bookmark, labelKey: "nav.saved", subKey: "nav.saved.sub" },
  { to: "/about", icon: Info, labelKey: "nav.about", subKey: "nav.about.sub" },
  { to: "/settings", icon: SettingsIcon, labelKey: "nav.settings", subKey: "nav.settings.sub" },
];

export default function Sidebar() {
  const { mobileNavOpen, setMobileNavOpen, t } = useApp();

  return (
    <>
      {/* Backdrop - mobile only, closes the drawer on tap outside */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0 flex flex-col bg-emerald-950 text-white p-5
        transform transition-transform duration-200 ease-out lg:translate-x-0
        ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">
                KATIBA <span className="text-amber-400">AI</span>
              </div>
              <div className="text-[11px] text-emerald-300 leading-tight">{t("sidebar.tagline")}</div>
            </div>
          </div>
          <button
            className="lg:hidden text-emerald-300 hover:text-white"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.labelKey}
              to={item.to}
              end={item.end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-950 font-semibold"
                    : "text-emerald-100 hover:bg-emerald-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                  <span className="flex flex-col">
                    <span className="text-sm leading-tight">{t(item.labelKey)}</span>
                    {item.subKey && (
                      <span
                        className={`text-[11px] leading-tight ${
                          isActive ? "text-emerald-700" : "text-emerald-400"
                        }`}
                      >
                        {t(item.subKey)}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-emerald-800 bg-emerald-900/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">{t("sidebar.mission.title")}</span>
          </div>
          <p className="text-xs text-emerald-200 leading-relaxed">{t("sidebar.mission.body")}</p>
        </div>
      </aside>
    </>
  );
}