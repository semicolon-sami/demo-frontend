"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDiaryEntry, DiaryEntry } from "@/supabase/diary";

export default function DiaryEntryPage() {
  const params = useParams();
  const router = useRouter();
  // Safely get `id` as a string
  const entryId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    setLoading(true);
    getDiaryEntry(entryId)
      .then((result) => {
        setEntry(result);
        setError(null);
      })
      .catch((err: any) => setError(err.message || "Failed to load entry."))
      .finally(() => setLoading(false));
  }, [entryId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!entry) return <div>No entry loaded.</div>;
  return (
    <main className="max-w-2xl mx-auto py-6 px-3">
      <button
        className="mb-6 text-blue-500 hover:underline"
        onClick={() => router.push("/diary")}
      >
        ← Back to Diary
      </button>
      <h1 className="text-3xl font-bold mb-2">{entry.title}</h1>
      <div className="text-gray-500 mb-4">
        {entry.created_at && new Date(entry.created_at).toLocaleString()}
      </div>
      <div className="whitespace-pre-line">{entry.content}</div>
    </main>
  );
}
