import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Loader2, MessageCircle, ArrowRight } from "lucide-react";
import { getMyClients } from "../api/client.js";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyClients()
      .then((data) => !cancelled && setClients(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-emerald-700" />
        <h1 className="text-xl font-bold">Clients</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Everyone whose consultation request you've accepted at least once.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading clients…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 text-center py-12">{error}</p>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center py-16">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            No clients yet. Accept a consultation request and they'll show up here automatically.
          </p>
          <button
            onClick={() => navigate("/lawyer/requests")}
            className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900"
          >
            View Requests <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((c) => (
            <div
              key={c.clientId}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-semibold shrink-0">
                {c.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Mail className="w-3 h-3" /> {c.email}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 justify-end">
                  <MessageCircle className="w-3 h-3" />
                  {c.acceptedRequestCount} accepted request{c.acceptedRequestCount === 1 ? "" : "s"}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Client since {new Date(c.firstAcceptedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}