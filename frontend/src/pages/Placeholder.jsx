import React from "react";
import { useNavigate } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";

export default function Placeholder({ title, description }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-24 px-6">
      <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
        <Construction className="w-7 h-7 text-amber-500" />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {description || "This page isn't built yet - it's next on the roadmap."}
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-2 flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
    </div>
  );
}