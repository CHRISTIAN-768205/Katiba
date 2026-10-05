import React, { useState } from "react";
import { Settings as SettingsIcon, Loader2, Check, Bell, BellOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { updateProfile, changePassword } from "../api/client.js";

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-5">
      <h2 className="font-semibold text-sm mb-1">{title}</h2>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { lang, setLang } = useApp();

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Language + notifications (saved immediately on change, not behind the Save button)
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || "en");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    user?.emailNotificationsEnabled !== false
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const updated = await updateProfile({ name: name.trim() });
      updateUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLanguageChange(newLang) {
    setPreferredLanguage(newLang);
    setLang(newLang); // reflect immediately in the live UI, same as the topbar toggle
    setSavingPrefs(true);
    try {
      const updated = await updateProfile({ preferredLanguage: newLang });
      updateUser(updated);
    } catch {
      // non-critical - the UI already reflects the change locally either way
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleNotificationsToggle() {
    const next = !emailNotificationsEnabled;
    setEmailNotificationsEnabled(next);
    setSavingPrefs(true);
    try {
      const updated = await updateProfile({ emailNotificationsEnabled: next });
      updateUser(updated);
    } catch {
      setEmailNotificationsEnabled(!next); // revert on failure
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <SectionCard title="Profile">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
        <input
          value={user?.email || ""}
          disabled
          className="w-full mt-1 mb-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
        />
        <p className="text-[11px] text-gray-400 mb-3">Email can't be changed yet.</p>

        {profileError && <p className="text-sm text-red-600 mb-2">{profileError}</p>}
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || !name.trim()}
          className="flex items-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
        >
          {savingProfile ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : profileSaved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {profileSaved ? "Saved" : "Save Changes"}
        </button>
      </SectionCard>

      <SectionCard title="Language" description="Also changes the app's display language immediately.">
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange("en")}
            disabled={savingPrefs}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              preferredLanguage === "en"
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                : "border-gray-200 dark:border-gray-800 text-gray-500"
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange("sw")}
            disabled={savingPrefs}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              preferredLanguage === "sw"
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                : "border-gray-200 dark:border-gray-800 text-gray-500"
            }`}
          >
            Kiswahili
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Notifications"
        description="Turning this off stops all notification emails (new requests, accepted/declined, messages) - the in-app activity still updates normally either way."
      >
        <button
          onClick={handleNotificationsToggle}
          disabled={savingPrefs}
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm">
            {emailNotificationsEnabled ? (
              <Bell className="w-4 h-4 text-emerald-700" />
            ) : (
              <BellOff className="w-4 h-4 text-gray-400" />
            )}
            Email notifications
          </span>
          <span
            className={`relative w-10 h-6 rounded-full transition-colors ${
              emailNotificationsEnabled ? "bg-emerald-700" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                emailNotificationsEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </SectionCard>

      <SectionCard title="Change Password">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <p className="text-[11px] text-gray-400 mb-3">At least 8 characters.</p>

        {passwordError && <p className="text-sm text-red-600 mb-2">{passwordError}</p>}
        <button
          onClick={handleChangePassword}
          disabled={changingPassword || !currentPassword || !newPassword}
          className="flex items-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
        >
          {changingPassword ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : passwordSuccess ? (
            <Check className="w-4 h-4" />
          ) : null}
          {passwordSuccess ? "Password Updated" : "Update Password"}
        </button>
      </SectionCard>
    </main>
  );
}