import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Scale,
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  FileText,
  Star,
  BarChart2,
  Wallet,
  User,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Inbox,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/lawyer/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/lawyer/requests", icon: Inbox, label: "Requests" },
  { to: "/lawyer/clients", icon: Users, label: "Clients" },
  { to: "/lawyer/calendar", icon: Calendar, label: "Calendar" },
  { to: "/lawyer/cases", icon: Briefcase, label: "Cases" },
  { to: "/lawyer/messages", icon: MessageSquare, label: "Messages" },
  { to: "/lawyer/documents", icon: FileText, label: "Documents" },
  { to: "/lawyer/reviews", icon: Star, label: "Reviews" },
  { to: "/lawyer/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/lawyer/earnings", icon: Wallet, label: "Earnings" },
];

export default function AdvocateLayout() {
  const { dark, setDark } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-emerald-950 text-white p-5">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">
                KATIBA <span className="text-amber-400">AI</span>
              </div>
              <div className="text-[11px] text-emerald-300 leading-tight">AI Legal Assistant</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-950 font-semibold"
                      : "text-emerald-100 hover:bg-emerald-900"
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-1 pt-4 border-t border-emerald-900">
            <NavLink
              to="/lawyer/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? "bg-emerald-50 text-emerald-950 font-semibold" : "text-emerald-100 hover:bg-emerald-900"
                }`
              }
            >
              <User className="w-4.5 h-4.5" strokeWidth={1.8} /> Profile
            </NavLink>
            <NavLink
              to="/lawyer/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? "bg-emerald-50 text-emerald-950 font-semibold" : "text-emerald-100 hover:bg-emerald-900"
                }`
              }
            >
              <Settings className="w-4.5 h-4.5" strokeWidth={1.8} /> Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-emerald-100 hover:bg-emerald-900 text-left"
            >
              <LogOut className="w-4.5 h-4.5" strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 py-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients, cases, documents..."
                className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setDark(!dark)}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium leading-tight">{user?.name}</div>
                  <div className="text-[11px] text-gray-400 leading-tight capitalize">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </header>

          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}