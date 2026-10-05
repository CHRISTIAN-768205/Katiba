import nodemailer from "nodemailer";

let transporter = null;
let warnedNotConfigured = false;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

async function send({ to, subject, text, html, recipientUser }) {
  if (recipientUser && recipientUser.emailNotificationsEnabled === false) {
    return { sent: false, skipped: "recipient has email notifications turned off" };
  }
  const t = getTransporter();
  if (!t) {
    if (!warnedNotConfigured) {
      console.warn(
        "[email] SMTP_HOST is not set - notification emails will be skipped (in-app status still " +
          "updates correctly). See backend/.env.example."
      );
      warnedNotConfigured = true;
    }
    return { sent: false };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || '"Katiba AI" <no-reply@katiba.ai>', to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send:", err.message);
    return { sent: false };
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-KE", { dateStyle: "full", timeStyle: "short" });
}

// ============================================================
// Consultation lifecycle emails
// ============================================================

/**
 * Emails an advocate that a citizen has requested a consultation. If SMTP isn't configured,
 * this logs a warning and returns { sent: false } instead of throwing - a missing email
 * integration should never block the request itself from being created and shown in-app.
 */
export async function sendConsultationRequestEmail({ advocate, client, message, requestedDate }) {
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/lawyer/requests`;
  return send({
    to: advocate.email,
    recipientUser: advocate,
    subject: `New consultation request from ${client.name} - Katiba AI`,
    text: `${client.name} (${client.email}) has requested a consultation for ${formatDate(requestedDate)}.\n\nMessage:\n${message}\n\nView and respond: ${dashboardUrl}`,
    html: `
      <p><strong>${client.name}</strong> (${client.email}) has requested a consultation for <strong>${formatDate(requestedDate)}</strong>.</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
      <p><a href="${dashboardUrl}">View and respond in your dashboard</a></p>
    `,
  });
}

export async function sendRequestAcceptedEmail({ client, advocate, request }) {
  const historyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/requests`;
  return send({
    to: client.email,
    recipientUser: client,
    subject: `${advocate.name} accepted your consultation request - Katiba AI`,
    text: `Your consultation request has been accepted.\n\nWith: ${advocate.name}\nWhen: ${formatDate(request.confirmedDate)}\nDuration: ${request.durationMinutes} minutes\nType: ${request.consultationType}\n${request.locationOrLink ? `Location/Link: ${request.locationOrLink}\n` : ""}\nView details: ${historyUrl}`,
    html: `
      <p>Your consultation request has been <strong>accepted</strong>.</p>
      <ul>
        <li>With: ${advocate.name}</li>
        <li>When: ${formatDate(request.confirmedDate)}</li>
        <li>Duration: ${request.durationMinutes} minutes</li>
        <li>Type: ${request.consultationType}</li>
        ${request.locationOrLink ? `<li>Location/Link: ${request.locationOrLink}</li>` : ""}
      </ul>
      <p><a href="${historyUrl}">View in your dashboard</a></p>
    `,
  });
}

export async function sendRequestRejectedEmail({ client, advocate, request }) {
  return send({
    to: client.email,
    recipientUser: client,
    subject: `Your consultation request was declined - Katiba AI`,
    text: `Unfortunately, ${advocate.name} declined your consultation request.${request.rejectionReason ? `\n\nReason: ${request.rejectionReason}` : ""}\n\nYou can find another advocate in the Lawyer Directory.`,
    html: `
      <p>Unfortunately, <strong>${advocate.name}</strong> declined your consultation request.</p>
      ${request.rejectionReason ? `<p><strong>Reason:</strong> ${request.rejectionReason}</p>` : ""}
      <p>You can find another advocate in the Lawyer Directory.</p>
    `,
  });
}

export async function sendRescheduleProposedEmail({ client, advocate, request }) {
  const historyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/requests`;
  return send({
    to: client.email,
    recipientUser: client,
    subject: `${advocate.name} proposed a new time - Katiba AI`,
    text: `${advocate.name} can't make your requested time, but proposed an alternative:\n\n${formatDate(request.proposedDate)}${request.rescheduleNote ? `\n\nNote: ${request.rescheduleNote}` : ""}\n\nConfirm or decline: ${historyUrl}`,
    html: `
      <p><strong>${advocate.name}</strong> can't make your requested time, but proposed an alternative:</p>
      <p><strong>${formatDate(request.proposedDate)}</strong></p>
      ${request.rescheduleNote ? `<p><em>${request.rescheduleNote}</em></p>` : ""}
      <p><a href="${historyUrl}">Confirm or decline in your dashboard</a></p>
    `,
  });
}

export async function sendRescheduleConfirmedEmail({ advocate, client, request }) {
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/lawyer/requests`;
  return send({
    to: advocate.email,
    recipientUser: advocate,
    subject: `${client.name} confirmed the new time - Katiba AI`,
    text: `${client.name} confirmed the rescheduled consultation for ${formatDate(request.confirmedDate)}.\n\nView: ${dashboardUrl}`,
    html: `<p><strong>${client.name}</strong> confirmed the rescheduled consultation for <strong>${formatDate(request.confirmedDate)}</strong>.</p><p><a href="${dashboardUrl}">View in your dashboard</a></p>`,
  });
}

export async function sendRescheduleDeclinedEmail({ advocate, client, request }) {
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/lawyer/requests`;
  return send({
    to: advocate.email,
    recipientUser: advocate,
    subject: `${client.name} declined the proposed time - Katiba AI`,
    text: `${client.name} declined the rescheduled time you proposed. The request has been closed.\n\nView: ${dashboardUrl}`,
    html: `<p><strong>${client.name}</strong> declined the rescheduled time you proposed. The request has been closed.</p><p><a href="${dashboardUrl}">View in your dashboard</a></p>`,
  });
}

export async function sendNewMessageEmail({ recipient, sender, text }) {
  const inboxUrl =
    recipient.role === "advocate"
      ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/lawyer/messages`
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/messages`;
  const preview = text.length > 140 ? text.slice(0, 140).trim() + "…" : text;
  return send({
    to: recipient.email,
    recipientUser: recipient,
    subject: `New message from ${sender.name} - Katiba AI`,
    text: `${sender.name}: ${preview}\n\nReply: ${inboxUrl}`,
    html: `<p><strong>${sender.name}</strong>: ${preview}</p><p><a href="${inboxUrl}">Reply on Katiba AI</a></p>`,
  });
}

// ============================================================
// Professional verification (advocate / mediator)
// ============================================================

/**
 * Notifies the admin that a new advocate or mediator has registered and is awaiting
 * verification. The email contains one-click Approve / Reject links that are HMAC-signed
 * and expire in 7 days.
 *
 * NOTE: We deliberately do NOT pass recipientUser here. The recipient is the admin, not
 * the applicant, so the applicant's `emailNotificationsEnabled` preference must not apply.
 */
export async function sendVerificationRequestEmail({ applicant, approveUrl, rejectUrl }) {
  const isAdvocate = applicant.role === "advocate";
  const label = isAdvocate ? "Advocate" : "Mediator";

  const roleLines = isAdvocate
    ? `
        <li><strong>Bar Number:</strong> ${applicant.barNumber}</li>
        <li><strong>Law Firm:</strong> ${applicant.lawFirm}</li>
        <li><strong>Years of Experience:</strong> ${applicant.yearsOfExperience ?? 0}</li>
        <li><strong>Practice Areas:</strong> ${(applicant.practiceAreas || []).join(", ") || "—"}</li>
      `
    : `
        <li><strong>MAC Number:</strong> ${applicant.mediationNumber}</li>
        <li><strong>Profession:</strong> ${applicant.mediatorProfession}</li>
        <li><strong>Specialties:</strong> ${(applicant.mediationSpecialties || []).join(", ") || "—"}</li>
        <li><strong>Style:</strong> ${applicant.mediationStyle || "facilitative"}</li>
      `;

  const subject = `[Katiba AI] New ${label} awaiting verification - ${applicant.name}`;

  const text = `New ${label} registration awaiting verification.

Name: ${applicant.name}
Email: ${applicant.email}
Phone: ${applicant.phone || "—"}
${isAdvocate
  ? `Bar Number: ${applicant.barNumber}\nLaw Firm: ${applicant.lawFirm}`
  : `MAC Number: ${applicant.mediationNumber}\nProfession: ${applicant.mediatorProfession}`}
Bio: ${applicant.bio || "—"}

Approve: ${approveUrl}
Reject:  ${rejectUrl}

These links expire in 7 days.`;

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;color:#111827;">
      <h2 style="margin-bottom:4px;">New ${label} Registration</h2>
      <p style="color:#6b7280;margin-top:0;">Awaiting verification on Katiba AI</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:6px 0;"><strong>Name:</strong></td><td>${applicant.name}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td>${applicant.email}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Phone:</strong></td><td>${applicant.phone || "—"}</td></tr>
      </table>

      <ul style="padding-left:18px;">${roleLines}</ul>

      <p><strong>Bio:</strong><br/>${(applicant.bio || "—").replace(/\n/g, "<br/>")}</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>

      <p>
        <a href="${approveUrl}"
           style="background:#065f46;color:#fff;padding:10px 20px;border-radius:6px;
                  text-decoration:none;display:inline-block;margin-right:8px;font-weight:600;">
          ✓ Approve
        </a>
        <a href="${rejectUrl}"
           style="background:#991b1b;color:#fff;padding:10px 20px;border-radius:6px;
                  text-decoration:none;display:inline-block;font-weight:600;">
          ✗ Reject
        </a>
      </p>

      <p style="color:#6b7280;font-size:12px;">
        These links are unique and expire in 7 days. Each can only be used once.
      </p>
    </div>
  `;

  return send({
    to: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_FROM,
    subject,
    text,
    html,
  });
}

/**
 * Tells the applicant the outcome of their verification. Respects the applicant's
 * `emailNotificationsEnabled` preference via recipientUser — the in-app verification
 * status still updates regardless of whether this email is delivered.
 */
export async function sendVerificationResultEmail({ applicant, approved, reason }) {
  const label = applicant.role === "advocate" ? "Advocate" : "Mediator";
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

  if (approved) {
    const subject = `Katiba AI - Your ${label} account is verified`;
    const text = `Hi ${applicant.name},

Good news - your ${label} account on Katiba AI has been verified. Your profile is now
visible in the public directory and you can start receiving requests.

Sign in: ${dashboardUrl}`;
    const html = `
      <p>Hi <strong>${applicant.name}</strong>,</p>
      <p>Good news - your <strong>${label}</strong> account on Katiba AI has been
         <strong>verified</strong>. Your profile is now visible in the public directory
         and you can start receiving requests.</p>
      <p><a href="${dashboardUrl}">Sign in to Katiba AI</a></p>
    `;
    return send({ to: applicant.email, recipientUser: applicant, subject, text, html });
  }

  const subject = `Katiba AI - Verification update`;
  const text = `Hi ${applicant.name},

We were unable to verify your ${label} account at this time.
${reason ? `\nReason: ${reason}\n` : ""}
You may update your details and reapply.

Sign in: ${dashboardUrl}`;
  const html = `
    <p>Hi <strong>${applicant.name}</strong>,</p>
    <p>We were unable to verify your <strong>${label}</strong> account at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>You may update your details and reapply.</p>
    <p><a href="${dashboardUrl}">Sign in to Katiba AI</a></p>
  `;
  return send({ to: applicant.email, recipientUser: applicant, subject, text, html });
}