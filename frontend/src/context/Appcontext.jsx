import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { translate } from "../i18n/translations.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("katiba-lang") || "en");
  const [dark, setDark] = useState(() => localStorage.getItem("katiba-dark") === "true");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("katiba-lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("katiba-dark", String(dark));
  }, [dark]);

  // Stable across renders unless lang actually changes, so components using t() don't re-render
  // needlessly when unrelated context values (like mobileNavOpen) change.
  const t = useMemo(() => (key) => translate(key, lang), [lang]);

  return (
    <AppContext.Provider value={{ lang, setLang, dark, setDark, mobileNavOpen, setMobileNavOpen, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}