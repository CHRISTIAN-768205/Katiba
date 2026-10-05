import React, { useEffect, useState, useRef } from "react";
import { FileText, Loader2, Upload, X, Download, Trash2, File } from "lucide-react";
import { getDocuments, getMyClients, uploadDocument, downloadDocument, deleteDocument } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  function load() {
    setLoading(true);
    setError(null);
    getDocuments()
      .then(setDocs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openUpload() {
    setShowUpload(true);
    setRecipientId("");
    setFile(null);
    setUploadError(null);
    setLoadingClients(true);
    getMyClients()
      .then(setClients)
      .catch((err) => setUploadError(err.message))
      .finally(() => setLoadingClients(false));
  }

  async function handleUpload() {
    if (!file || !recipientId) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadDocument(file, recipientId);
      setShowUpload(false);
      load();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    setDownloadingId(doc._id);
    try {
      await downloadDocument(doc._id, doc.originalName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc) {
    setDeletingId(doc._id);
    try {
      await deleteDocument(doc._id);
      setDocs((prev) => prev.filter((d) => d._id !== doc._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold">Documents</h1>
        </div>
        <button
          onClick={openUpload}
          className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-3.5 py-1.5 text-sm font-medium hover:bg-emerald-900"
        >
          <Upload className="w-4 h-4" /> Share Document
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        PDF, Word, or image files, up to 15MB. Only you and the recipient can access what's shared here.
      </p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-sm text-gray-400 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
          No documents shared yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((doc) => {
            const otherParty = user?.role === "advocate" ? doc.clientId : doc.advocateId;
            const iUploaded = doc.uploadedBy?._id === user?._id || doc.uploadedBy === user?._id;
            return (
              <div
                key={doc._id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{doc.originalName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatSize(doc.sizeBytes)} · Uploaded by {doc.uploadedBy?.name || "someone"} ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc._id}
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  aria-label="Download"
                >
                  {downloadingId === doc._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
                {iUploaded && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc._id}
                    className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    {deletingId === doc._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Share a document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Share with</label>
            {loadingClients ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
              </div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-gray-400 mt-1 mb-3">No clients yet.</p>
            ) : (
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full mt-1 mb-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 mb-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-3 py-6 text-center text-sm cursor-pointer hover:border-emerald-500"
            >
              {file ? (
                <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
              ) : (
                <span className="text-gray-400">Click to choose a file</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {uploadError && <p className="text-sm text-red-600 mb-2">{uploadError}</p>}
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !recipientId}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}