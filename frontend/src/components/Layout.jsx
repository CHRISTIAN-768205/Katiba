import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { useApp } from "../context/AppContext.jsx";
import { askQuestion } from "../api/client.js";

export default function Layout() {
  const { lang, dark } = useApp();
  const navigate = useNavigate();

  // The global search bar in the topbar behaves like "ask", from anywhere in the app.
  async function handleGlobalSearch(q) {
    const result = await askQuestion(q, lang);
    navigate("/answer", { state: { question: q, ...result } });
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onSearch={handleGlobalSearch} />
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 py-3 px-4">
            <Shield className="w-3.5 h-3.5" />
            Katiba AI can make mistakes. Always verify important information.
          </footer>
        </div>
      </div>
    </div>
  );
}