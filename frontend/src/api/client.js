import axios from "axios";

const TOKEN_KEY = "katiba-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the logged-in user's token to every request automatically, if one exists.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize backend errors so every page can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error ||
      (err?.request ? "Couldn't reach Katiba AI. Check that the backend is running." : err.message);
    return Promise.reject(new Error(message));
  }
);

// ---- Auth ----

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}


export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

/** Update editable profile fields - name, preferredLanguage, emailNotificationsEnabled. Email is fixed. */
export async function updateProfile(updates) {
  const { data } = await api.patch("/auth/me", updates);
  return data.user;
}

/** Change password - requires the current one. */
export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.patch("/auth/password", { currentPassword, newPassword });
  return data;
}

export async function askQuestion(question, language = "en") {
  const { data } = await api.post("/ask", { question, language });
  return data; // { id, answer, urgency, articles }
}

export async function getRecentQuestions(limit = 5) {
  const { data } = await api.get("/history/recent", { params: { limit } });
  return data;
}

export async function getPopularQuestions(limit = 5) {
  const { data } = await api.get("/history/popular", { params: { limit } });
  return data;
}

/**
 * @param {{lawSource?: string}} filters - omit lawSource to get chapters across every law in the corpus.
 */
export async function getChapters(filters = {}) {
  const { data } = await api.get("/articles/meta/chapters", { params: filters });
  return data;
}

/** List of distinct laws in the corpus (Constitution, Penal Code, Employment Act, ...), with counts. */
export async function getLawSources() {
  const { data } = await api.get("/articles/meta/law-sources");
  return data;
}

/** List of distinct topic tags across every law source, with counts - powers the Topics browser. */
export async function getTags() {
  const { data } = await api.get("/articles/meta/tags");
  return data;
}

/**
 * Browse/filter articles - powers the /constitution browser.
 * @param {{chapter?: number, tag?: string, lawSource?: string}} filters
 */
export async function listArticles(filters = {}) {
  const { data } = await api.get("/articles", { params: filters });
  return data;
}

/**
 * @param {string|number} chapterNumber
 * @param {string|number} articleNumber
 * @param {string} [lawSource] - disambiguates when different laws share a chapter/article number.
 *   Optional, but recommended whenever you already know it (e.g. navigating from a citation).
 */
export async function getArticle(chapterNumber, articleNumber, lawSource) {
  const { data } = await api.get(`/articles/${chapterNumber}/${articleNumber}`, {
    params: lawSource ? { lawSource } : {},
  });
  return data;
}

// ---- Lawyer Directory / Consultation Requests ----

/** Public list of registered advocates. */
export async function getAdvocates() {
  const { data } = await api.get("/advocates");
  return data;
}

/** A single advocate's public profile + review stats. No auth required. */
export async function getAdvocateProfile(advocateId) {
  const { data } = await api.get(`/advocates/${advocateId}`);
  return data; // { advocate, reviews, averageRating, reviewCount }
}

/**
 * Send a consultation request to a specific advocate. Requires login.
 * @param {string} advocateId
 * @param {{message: string, requestedDate: string, durationMinutes?: number, consultationType?: "virtual"|"physical"}} details
 */
export async function sendConsultationRequest(advocateId, details) {
  const { data } = await api.post(`/advocates/${advocateId}/requests`, details);
  return data; // { request, emailSent }
}

/** The logged-in advocate's incoming requests. */
export async function getReceivedRequests(status) {
  const { data } = await api.get("/requests/received", { params: status ? { status } : {} });
  return data;
}

/** The logged-in user's own sent requests. */
export async function getSentRequests() {
  const { data } = await api.get("/requests/sent");
  return data;
}

/** The logged-in advocate's real clients, derived from accepted requests. */
export async function getMyClients() {
  const { data } = await api.get("/requests/clients");
  return data;
}

// --- Advocate actions on a request ---
export async function acceptRequest(requestId, locationOrLink) {
  const { data } = await api.patch(`/requests/${requestId}/accept`, { locationOrLink });
  return data;
}
export async function rejectRequest(requestId, rejectionReason) {
  const { data } = await api.patch(`/requests/${requestId}/reject`, { rejectionReason });
  return data;
}
export async function proposeReschedule(requestId, proposedDate, rescheduleNote) {
  const { data } = await api.patch(`/requests/${requestId}/reschedule`, { proposedDate, rescheduleNote });
  return data;
}
export async function completeRequest(requestId) {
  const { data } = await api.patch(`/requests/${requestId}/complete`);
  return data;
}

// --- Client actions on a request ---
export async function confirmReschedule(requestId) {
  const { data } = await api.patch(`/requests/${requestId}/confirm-reschedule`);
  return data;
}
export async function declineReschedule(requestId) {
  const { data } = await api.patch(`/requests/${requestId}/decline-reschedule`);
  return data;
}

// --- Either party ---
export async function cancelRequest(requestId) {
  const { data } = await api.patch(`/requests/${requestId}/cancel`);
  return data;
}

/** The logged-in advocate's calendar (upcoming/completed/cancelled consultations). */
export async function getMyCalendar(status) {
  const { data } = await api.get("/calendar/me", { params: status ? { status } : {} });
  return data;
}

// --- Cases ---

/** Advocate opens a new case for a real client (one they've accepted/completed a request with). */
export async function createCase({ clientId, title, practiceArea, description, originatingRequestId }) {
  const { data } = await api.post("/cases", { clientId, title, practiceArea, description, originatingRequestId });
  return data;
}

/** The logged-in advocate's own cases. */
export async function getMyCases(status) {
  const { data } = await api.get("/cases", { params: status ? { status } : {} });
  return data;
}

/** A citizen's read-only view of their own cases. */
export async function getMyCasesAsClient() {
  const { data } = await api.get("/cases/mine");
  return data;
}

/** Full case detail, including notes. Advocate owner only. */
export async function getCase(caseId) {
  const { data } = await api.get(`/cases/${caseId}`);
  return data;
}

/** Update a case's title/practiceArea/description/status. */
export async function updateCase(caseId, updates) {
  const { data } = await api.patch(`/cases/${caseId}`, updates);
  return data;
}

/** Add a timestamped note to a case. */
export async function addCaseNote(caseId, text) {
  const { data } = await api.post(`/cases/${caseId}/notes`, { text });
  return data;
}

// --- Messages ---

/** Send a message to a specific person (must be a real advocate<->client relationship). */
export async function sendMessage(recipientId, text) {
  const { data } = await api.post("/messages", { recipientId, text });
  return data;
}

/** Every conversation thread the current user is part of, with last message + unread count. */
export async function getThreads() {
  const { data } = await api.get("/messages/threads");
  return data;
}

/** Full message history with one specific person. */
export async function getThread(otherUserId) {
  const { data } = await api.get(`/messages/thread/${otherUserId}`);
  return data;
}

/** Marks every message from that person as read. */
export async function markThreadRead(otherUserId) {
  const { data } = await api.patch(`/messages/thread/${otherUserId}/read`);
  return data;
}

// --- Documents ---

/** Upload a document to share with a specific person, optionally attached to a case. */
export async function uploadDocument(file, recipientId, caseId) {
  const form = new FormData();
  form.append("file", file);
  form.append("recipientId", recipientId);
  if (caseId) form.append("caseId", caseId);
  const { data } = await api.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** List documents - pass { caseId } or { withUserId }, or omit for everything shared with you. */
export async function getDocuments(filters = {}) {
  const { data } = await api.get("/documents", { params: filters });
  return data;
}

/**
 * Downloads a document as a blob (so the auth token still applies, unlike a plain <a href>)
 * and triggers the browser's save dialog with the real filename.
 */
export async function downloadDocument(docId, filename) {
  const response = await api.get(`/documents/${docId}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Deletes a document. Only the original uploader can do this (enforced server-side too). */
export async function deleteDocument(docId) {
  await api.delete(`/documents/${docId}`);
}
// ---- AI Tools ----

/** Summarize a legal contract document text */
export async function summarizeContract(contractText) {
  const { data } = await api.post("/ai-tools/summarize-contract", { contractText });
  return data.summary; // returns the AI-generated summary
}

// --- Reviews ---

/** Client submits a review for one of their own completed consultations. */
export async function submitReview(requestId, rating, comment) {
  const { data } = await api.post("/reviews", { requestId, rating, comment });
  return data;
}

/** The logged-in advocate's own received reviews + average rating. */
export async function getMyReviews() {
  const { data } = await api.get("/reviews/mine");
  return data; // { reviews, average, count }
}

/** The logged-in client's completed consultations that don't have a review yet. */
export async function getPendingReviews() {
  const { data } = await api.get("/reviews/pending");
  return data;
}

/** Public reviews for a specific advocate. */
export async function getAdvocateReviews(advocateId) {
  const { data } = await api.get("/reviews", { params: { advocateId } });
  return data; // { reviews, average, count }
}

/** The logged-in advocate's real practice analytics - volume, acceptance rate, response time, etc. */
export async function getMyAnalytics() {
  const { data } = await api.get("/analytics/me");
  return data;
}
/**
 * Permanently deletes the logged-in user's account and all associated data.
 * Requires the current password for confirmation.
 */
export async function deleteAccount(password) {
  const { data } = await api.delete("/auth/me", { data: { password } });
  return data;
}

// @param {{name, email, password, role, ...roleSpecificFields}} payload **/
export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data; // { token, user }
}

/** Drafts a demand letter from structured inputs. Advocate only. */
export async function draftDemandLetter({ senderName, recipientName, facts, desiredOutcome, deadline }) {
  const { data } = await api.post("/ai-tools/draft-demand-letter", {
    senderName,
    recipientName,
    facts,
    desiredOutcome,
    deadline,
  });
  return data.letter;
}

// ---- Saved Answers ----

/** Save an AI answer to the user's bookmarks. */
export async function saveAnswer({ sourceId, question, answer, language, urgency, citedArticles, note }) {
  const { data } = await api.post("/saved", {
    sourceId, question, answer, language, urgency, citedArticles, note,
  });
  return data.saved;
}

/** List saved answers (paginated). */
export async function getSavedAnswers(page = 1, limit = 20) {
  const { data } = await api.get("/saved", { params: { page, limit } });
  return data; // { items, pagination }
}

/** Update a saved answer's note or tags. */
export async function updateSavedAnswer(id, updates) {
  const { data } = await api.patch(`/saved/${id}`, updates);
  return data.saved;
}

/** Delete a saved answer. */
export async function deleteSavedAnswer(id) {
  await api.delete(`/saved/${id}`);
}

export default api;