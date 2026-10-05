import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Loader2, User, Gavel, Handshake } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const PRACTICE_AREAS = [
  "Criminal Law", "Family Law", "Land & Property", "Employment",
  "Commercial", "Constitutional", "Human Rights", "Immigration",
  "Tax", "Environmental", "Succession", "Banking & Finance",
];

const MEDIATION_SPECIALTIES = [
  "Family & Divorce", "Land & Property", "Commercial Contracts",
  "Employment", "Construction & Engineering", "Insurance",
  "Banking & Finance", "Community & Neighbourhood",
  "Succession & Estates", "International Disputes",
];

const MEDIATION_STYLES = [
  { value: "facilitative", label: "Facilitative" },
  { value: "evaluative", label: "Evaluative" },
  { value: "transformative", label: "Transformative" },
  { value: "mixed", label: "Mixed" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // ---- Base fields ----
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("citizen");

  // ---- Advocate fields ----
  const [barNumber, setBarNumber] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [practiceAreas, setPracticeAreas] = useState([]);

  // ---- Mediator fields ----
  const [mediationNumber, setMediationNumber] = useState("");
  const [mediatorProfession, setMediatorProfession] = useState("");
  const [mediationSpecialties, setMediationSpecialties] = useState([]);
  const [mediationStyle, setMediationStyle] = useState("facilitative");
  const [feeMin, setFeeMin] = useState("");
  const [feeMax, setFeeMax] = useState("");

  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ---- Chip toggle helper ----
  function toggle(list, setList, value) {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Role-specific guards
    if (role === "advocate") {
      if (!barNumber.trim()) return setError("Bar number is required for advocates.");
      if (!lawFirm.trim()) return setError("Law firm is required for advocates.");
      if (!practiceAreas.length) return setError("Select at least one practice area.");
    }
    if (role === "mediator") {
      if (!mediationNumber.trim()) return setError("MAC number is required for mediators.");
      if (!mediatorProfession.trim()) return setError("Profession is required for mediators.");
      if (!mediationSpecialties.length) return setError("Select at least one specialty.");
    }

    setSubmitting(true);
    try {
      const payload = {
        name, email, password, role,
        phone: phone || undefined,
        bio: bio || undefined,

        ...(role === "advocate" && {
          barNumber: barNumber.trim().toUpperCase(),
          lawFirm: lawFirm.trim(),
          yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
          practiceAreas,
        }),

        ...(role === "mediator" && {
          mediationNumber: mediationNumber.trim().toUpperCase(),
          mediatorProfession: mediatorProfession.trim(),
          mediationSpecialties,
          mediationStyle,
          mediationFeeRange: {
            min: parseInt(feeMin, 10) || 0,
            max: parseInt(feeMax, 10) || 0,
            currency: "KES",
          },
        }),
      };

      const newUser = await register(payload);

      // Route based on role
      if (newUser.role === "advocate") {
        navigate("/lawyer/dashboard", { replace: true });
      } else if (newUser.role === "mediator") {
        navigate("/mediator/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-md bg-emerald-800 flex items-center justify-center">
            <Scale className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">
            KATIBA <span className="text-emerald-700">AI</span>
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
          <h1 className="text-lg font-bold mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Free, for every Kenyan.
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <RoleButton
              active={role === "citizen"}
              onClick={() => setRole("citizen")}
              icon={<User className="w-4 h-4" />}
              label="Citizen"
            />
            <RoleButton
              active={role === "advocate"}
              onClick={() => setRole("advocate")}
              icon={<Gavel className="w-4 h-4" />}
              label="Advocate"
            />
            <RoleButton
              active={role === "mediator"}
              onClick={() => setRole("mediator")}
              icon={<Handshake className="w-4 h-4" />}
              label="Mediator"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* ---- Base fields ---- */}
            <Field label="Full name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Password" hint="At least 8 characters.">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </Field>

            {/* ---- Advocate fields ---- */}
            {role === "advocate" && (
              <>
                <Field label="LSK Bar Number" hint="Format: LSK/YYYY/NNNNN">
                  <input
                    required
                    placeholder="LSK/2020/12345"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Law firm">
                  <input
                    required
                    value={lawFirm}
                    onChange={(e) => setLawFirm(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Years of experience">
                  <input
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Practice areas">
                  <ChipGroup
                    options={PRACTICE_AREAS}
                    selected={practiceAreas}
                    onToggle={(v) => toggle(practiceAreas, setPracticeAreas, v)}
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Short bio">
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input"
                  />
                </Field>

                <PendingNotice>
                  Your account starts <strong>unverified</strong>. Our team will
                  confirm your Bar Number against the LSK Roll before your profile
                  appears publicly.
                </PendingNotice>
              </>
            )}

            {/* ---- Mediator fields ---- */}
            {role === "mediator" && (
              <>
                <Field label="MAC Number" hint="Format: MAC/YYYY/NNNN">
                  <input
                    required
                    placeholder="MAC/2021/0042"
                    value={mediationNumber}
                    onChange={(e) => setMediationNumber(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Profession">
                  <input
                    required
                    placeholder="e.g. Lawyer, Engineer, Accountant"
                    value={mediatorProfession}
                    onChange={(e) => setMediatorProfession(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Mediation specialties">
                  <ChipGroup
                    options={MEDIATION_SPECIALTIES}
                    selected={mediationSpecialties}
                    onToggle={(v) => toggle(mediationSpecialties, setMediationSpecialties, v)}
                  />
                </Field>

                <Field label="Mediation style">
                  <select
                    value={mediationStyle}
                    onChange={(e) => setMediationStyle(e.target.value)}
                    className="input"
                  >
                    {MEDIATION_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Fee range (KES)" hint="Leave blank if pro bono only.">
                  <div className="flex gap-2">
                    <input
                      type="number" min="0" placeholder="Min"
                      value={feeMin} onChange={(e) => setFeeMin(e.target.value)}
                      className="input"
                    />
                    <input
                      type="number" min="0" placeholder="Max"
                      value={feeMax} onChange={(e) => setFeeMax(e.target.value)}
                      className="input"
                    />
                  </div>
                </Field>

                <Field label="Phone">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Short bio">
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input"
                  />
                </Field>

                <PendingNotice>
                  Your account starts <strong>unverified</strong>. Our team will
                  confirm your MAC Number with the Mediation Accreditation
                  Committee before your profile appears publicly.
                </PendingNotice>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald-700 dark:text-emerald-400">
            Log in
          </Link>
        </p>
      </div>

      {/* Local styles for shared input look */}
      <style>{`
        .input {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(229 231 235);
          background: transparent;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { box-shadow: 0 0 0 2px rgb(5 150 105); }
        .dark .input { border-color: rgb(31 41 55); }
      `}</style>
    </div>
  );
}

/* ---------- small local components ---------- */

function RoleButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
          : "border-gray-200 dark:border-gray-800 text-gray-500 hover:border-emerald-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 rounded-full border text-xs transition ${
              on
                ? "bg-emerald-800 text-white border-emerald-800"
                : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-emerald-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PendingNotice({ children }) {
  return (
    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}