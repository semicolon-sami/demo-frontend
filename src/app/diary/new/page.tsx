"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// You may need to adjust this import to your actual Supabase client API
import { createDiaryEntry } from "@/supabase/diary"; 

export default function NewDiaryEntryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createDiaryEntry({ title, content }); // You must define this in your Supabase code!
      router.push("/diary");
    } catch (e: any) {
      setError(e.message || "Failed to create diary entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">New Diary Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={6}
          placeholder="Write your diary entry..."
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="bg-gray-200 px-4 py-2 rounded"
            onClick={() => router.push("/diary")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>
    </main>
  );
}
