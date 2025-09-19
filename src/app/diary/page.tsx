"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDiaryEntries, DiaryEntry } from "@/supabase/diary";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getDiaryEntries()
      .then((result) => {
        setEntries(result);
        setError(null);
      })
      .catch((err) => setError(err.message || "Failed to load entries."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto py-6 px-3">
      <h1 className="text-3xl font-bold mb-4">My Diary</h1>
      <button
        className="mb-8 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        onClick={() => router.push("/diary/new")}
      >
        + New Entry
      </button>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {(!loading && entries.length === 0) && (
        <div className="text-gray-400">No diary entries yet.</div>
      )}
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className="mb-6">
            <button
              className="text-left w-full px-4 py-3 bg-gray-100 hover:bg-blue-50 rounded transition"
              onClick={() => router.push(`/diary/${entry.id}`)}
            >
              <div className="font-semibold text-lg">{entry.title}</div>
              <div className="text-gray-500 text-sm">{new Date(entry.created_at).toLocaleString()}</div>
              <div className="line-clamp-2 mt-1 text-gray-700">{typeof entry.content === "string" ? entry.content.slice(0, 120) : ""}</div>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
