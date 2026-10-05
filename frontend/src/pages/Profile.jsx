import React, { useState } from "react";
import {
  User as UserIcon,
  Loader2,
  Check,
  BadgeCheck,
  Trash2,
  AlertTriangle,
  Gavel,
  Handshake,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile, deleteAccount } from "../api/client.js";

const PRACTICE_AREAS = [
  "Land Law",
  "Employment Law",
  "Family Law",
  "Criminal Law",
  "Corporate/Business Law",
  "Consumer Law",
  "Constitutional Law",
  "Other",
];

const MEDIATION_SPECIALTIES = [
  "Family & Divorce",
  "Land & Property",
  "Commercial Contracts",
  "Employment",
  "Construction & Engineering",
  "Insurance",
  "Banking & Finance",
  "Community & Neighbourhood",
  "Succession & Estates",
  "International Disputes",
  "Other",
];

const MEDIATION_STYLES = [
  { value: "facilitative", label: "Facilitative" },
  { value: "evaluative", label: "Evaluative" },
  { value: "transformative", label: "Transformative" },
  { value: "mixed", label: "Mixed" },
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const isAdvocate = user?.role === "advocate";
  const isMediator = user?.role === "mediator";

  // ---- Editable fields ----
  const [bio, setBio] = useState(user?.bio || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience ?? "");

  // Advocate-specific
  const [practiceAreas, setPracticeAreas] = useState(user?.practiceAreas || []);
  const [barNumber, setBarNumber] = useState(user?.barNumber || "");
  const [lawFirm, setLawFirm] = useState(user?.lawFirm || "");

  // Mediator-specific
  const [mediationNumber, setMediationNumber] = useState(user?.mediationNumber || "");
  const [mediatorProfession, setMediatorProfession] = useState(user?.mediatorProfession || "");
  const [mediationSpecialties, setMediationSpecialties] = useState(user?.mediationSpecialties || []);
  const [mediationStyle, setMediationStyle] = useState(user?.mediationStyle || "facilitative");
  const [feeMin, setFeeMin] = useState(user?.mediationFeeRange?.min ?? "");
  const [feeMax, setFeeMax] = useState(user?.mediationFeeRange?.max ?? "");

  // ---- UI state ----
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // ---- Delete modal state ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // ---- Toggle helpers ----
  function toggleIn(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  // ---- Save profile ----
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        bio: bio.trim(),
        yearsOfExperience: yearsOfExperience === "" ? null : Number(yearsOfExperience),
      };

      if (isAdvocate) {
        Object.assign(payload, {
          practiceAreas,
          barNumber: barNumber.trim() || null,
          lawFirm: lawFirm.trim() || null,
        });
      }

      if (isMediator) {
        Object.assign(payload, {
          mediationNumber: mediationNumber.trim() || null,
          mediatorProfession: mediatorProfession.trim() || null,
          mediationSpecialties,
          mediationStyle,
          mediationFeeRange: {
            min: feeMin === "" ? 0 : Number(feeMin),
            max: feeMax === "" ? 0 : Number(feeMax),
            currency: "KES",
          },
        });
      }

      const updated = await updateProfile(payload);
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete account ----
  async function handleDelete() {
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // Clear auth state and redirect
      logout();
      window.location.href = "/";
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const roleLabel = isAdvocate ? "Advocate" : isMediator ? "Mediator" : "Citizen";
  const RoleIcon = isAdvocate ? Gavel : isMediator ? Handshake : UserIcon;

  return (
    <main className="max-w-xl mx-auto p-4 sm:p-6 pb-16">
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-2 mb-1">
        <RoleIcon className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">{roleLabel} Profile</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {isAdvocate || isMediator
          ? "This is what citizens see on the directory — it's separate from your account settings."
          : "Your personal details on Katiba AI."}
      </p>

      {/* ---------- Identity card ---------- */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center text-lg font-semibold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold flex items-center gap-1.5">
            {user?.name}
            {user?.professionalVerified && (
              <BadgeCheck className="w-4 h-4 text-emerald-600" aria-label="Verified" />
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">{user?.email}</div>
        </div>
        <span className="text-[10px] uppercase tracking-wide font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-1 rounded-full">
          {roleLabel}
        </span>
      </div>

      {/* ---------- Verification notice ---------- */}
      {(isAdvocate || isMediator) && !user?.professionalVerified && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 mb-5">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Your account isn't verified yet. We're checking your{" "}
            {isAdvocate ? "Bar Number against the LSK Roll" : "MAC Number with the Mediation Accreditation Committee"}.
            Verification is a manual step for now. Your profile stays visible in the directory either way.
          </p>
        </div>
      )}

      {/* ---------- Bio ---------- */}
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bio</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="A short professional summary clients will see..."
        className="w-full mt-1 mb-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
      />
      <p className="text-[11px] text-gray-400 mb-4 text-right">{bio.length}/1000</p>

      {/* ---------- Advocate-only fields ---------- */}
      {isAdvocate && (
        <>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Practice areas
          </label>
          <div className="flex flex-wrap gap-2 mt-1.5 mb-4">
            {PRACTICE_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleIn(practiceAreas, setPracticeAreas, area)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                  practiceAreas.includes(area)
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-800 text-gray-500"
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                max={70}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Bar number
              </label>
              <input
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                placeholder="e.g. LSK/2020/12345"
                className="w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Law firm</label>
          <input
            value={lawFirm}
            onChange={(e) => setLawFirm(e.target.value)}
            placeholder="e.g. Wanjiru & Associates"
            className="w-full mt-1 mb-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </>
      )}

      {/* ---------- Mediator-only fields ---------- */}
      {isMediator && (
        <>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Mediation specialties
          </label>
          <div className="flex flex-wrap gap-2 mt-1.5 mb-4">
            {MEDIATION_SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleIn(mediationSpecialties, setMediationSpecialties, s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                  mediationSpecialties.includes(s)
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-800 text-gray-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                max={70}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                MAC number
              </label>
              <input
                value={mediationNumber}
                onChange={(e) => setMediationNumber(e.target.value)}
                placeholder="e.g. MAC/2021/0042"
                className="w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Profession</label>
          <input
            value={mediatorProfession}
            onChange={(e) => setMediatorProfession(e.target.value)}
            placeholder="e.g. Lawyer, Engineer, Accountant"
            className="w-full mt-1 mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          />

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Mediation style
          </label>
          <select
            value={mediationStyle}
            onChange={(e) => setMediationStyle(e.target.value)}
            className="w-full mt-1 mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {MEDIATION_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Fee range (KES)
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1 mb-5">
            <input
              type="number"
              min={0}
              value={feeMin}
              onChange={(e) => setFeeMin(e.target.value)}
              placeholder="Min"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="number"
              min={0}
              value={feeMax}
              onChange={(e) => setFeeMax(e.target.value)}
              placeholder="Max"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </>
      )}

      {/* ---------- Save button ---------- */}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : null}
        {saved ? "Saved" : "Save Profile"}
      </button>

      {/* ============================================================ */}
      {/* DANGER ZONE                                                  */}
      {/* ============================================================ */}
      <div className="mt-12 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">
              Danger Zone
            </h3>
            <p className="text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed mb-3">
              Deleting your account is permanent. It removes your profile, questions,
              consultations, cases, messages, documents, and reviews. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white px-4 py-2 text-xs font-medium hover:bg-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DELETE MODAL                                                 */}
      {/* ============================================================ */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false);
              setDeletePassword("");
              setDeleteConfirmText("");
              setDeleteError(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-bold">Delete your account</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              This will permanently delete{" "}
              <strong className="text-gray-700 dark:text-gray-200">{user?.email}</strong> and
              all data associated with it. This action cannot be reversed.
            </p>

            {/* Password confirmation */}
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Enter your password
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              disabled={deleting}
              autoComplete="current-password"
              className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Text confirmation */}
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deleting}
              placeholder="DELETE"
              className="w-full mt-1 mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />

            {deleteError && (
              <p className="text-xs text-red-600 mb-3">{deleteError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="rounded-full border border-gray-200 dark:border-gray-800 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !deletePassword || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white px-4 py-2 text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}