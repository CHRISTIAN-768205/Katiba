import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },

    // "citizen"  = ordinary user asking questions.
    // "advocate" = verified lawyer (Lawyer Directory / portal).
    // "mediator" = accredited mediator (Mediation Directory / portal).
    role: { type: String, enum: ["citizen", "advocate", "mediator"], default: "citizen" },
    preferredLanguage: { type: String, enum: ["en", "sw"], default: "en" },

    // Controls whether ANY notification email (new request, accepted, rejected, new message, etc.)
    // actually gets sent - checked at the top of every send*Email() function in emailService.js.
    emailNotificationsEnabled: { type: Boolean, default: true },

    // Shared contact field - used by both advocates and mediators for client callbacks.
    phone: { type: String, default: null, trim: true },

    // -------------------------------------------------------------------
    // Shared professional verification status.
    // Only relevant for role: "advocate" or "mediator" - left unverified
    // until an admin manually approves them against the LSK Roll or the
    // Mediation Accreditation Committee (MAC) register.
    // -------------------------------------------------------------------
    professionalVerified: { type: Boolean, default: false },
    verificationNotes: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Public profile fields - shown on both directories, not private like the fields above.
    bio: { type: String, default: "", maxlength: 1000 },

    // -------------------------------------------------------------------
    // Advocate-specific fields (role: "advocate")
    // -------------------------------------------------------------------
    // NOTE: This enum MUST stay in sync with PRACTICE_AREAS in
    // frontend/src/pages/Register.jsx. Any mismatch causes a 500 on register.
    practiceAreas: [
      {
        type: String,
        enum: [
          "Criminal Law",
          "Family Law",
          "Land & Property",
          "Employment",
          "Commercial",
          "Constitutional",
          "Human Rights",
          "Immigration",
          "Tax",
          "Environmental",
          "Succession",
          "Banking & Finance",
          "Other",
        ],
      },
    ],
    yearsOfExperience: { type: Number, default: null, min: 0, max: 70 },
    // Stored as entered, not yet verified against the LSK register - see
    // professionalVerified above for the actual trust signal shown to citizens.
    barNumber: { type: String, default: null, uppercase: true, trim: true },
    lawFirm: { type: String, default: null, trim: true },

    // -------------------------------------------------------------------
    // Mediator-specific fields (role: "mediator")
    // -------------------------------------------------------------------
    // MAC accreditation number, stored as entered (format: MAC/YYYY/NNNN).
    mediationNumber: { type: String, default: null, uppercase: true, trim: true },
    // The mediator's primary profession - e.g. Lawyer, Engineer, Accountant, Psychologist.
    mediatorProfession: { type: String, default: null, trim: true },
    mediationSpecialties: [
      {
        type: String,
        enum: [
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
        ],
      },
    ],
    mediationStyle: {
      type: String,
      enum: ["facilitative", "evaluative", "transformative", "mixed"],
      default: "facilitative",
    },
    mediationFeeRange: {
      min: { type: Number, default: 0, min: 0 },
      max: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: "KES" },
    },
  },
  { timestamps: true }
);

// Never send the hash back in API responses.
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);