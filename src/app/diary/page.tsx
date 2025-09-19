// /app/diary/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { getDiaryEntries, searchDiaryEntries, DiaryEntry } from "@/supabase/diary";
import DiaryList from "@/components/diary/DiaryList";
import DiarySearchBar from "@/components/diary/DiarySearchBar";
import { useRouter } from "next/navigation";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const result = search
          ? await searchDiaryEntries(search)
          : await getDiaryEntries();
        if (mounted) {
          setEntries(result);
          setError(null);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load diary entries.");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [search]);

  const handleEntryClick = (id: string) => {
    router.push(`/diary/${id}`);
  };

  const handleSearch = (term: string) => {
    setSearch(term);
  };

  return (
    <main className="max-w-2xl mx-auto py-6 px-3">
      <h1 className="text-3xl font-bold mb-4 text-center">My Diary</h1>

      <DiarySearchBar value={search} onSearch={handleSearch} />

      {loading && <div className="text-center py-10 animate-pulse text-blue-500">Loading diary entries...</div>}

      {error && !loading && (
        <div className="text-red-600 text-center py-4">
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-10 text-gray-400">No diary entries found.</div>
      )}

      {!loading && !error && entries.length > 0 && (
        <DiaryList entries={entries} onEntryClick={handleEntryClick} />
      )}

      {/* Add "New Entry" button for creating entries (will hook up later) */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push("/diary/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-lg shadow transition"
        >
          + New Entry
        </button>
      </div>
    </main>
  );
}
