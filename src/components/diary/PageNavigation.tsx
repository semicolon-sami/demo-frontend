import React from "react";
import { useRouter } from "next/navigation";
import { DiaryEntry } from "@/supabase/diary";

type PageNavigationProps = {
  entries: DiaryEntry[];
  currentEntryId: string;
};

export default function PageNavigation({
  entries,
  currentEntryId,
}: PageNavigationProps) {
  const router = useRouter();
  const currentIdx = entries.findIndex((entry) => entry.id === currentEntryId);

  if (currentIdx === -1 || entries.length < 2) return null;

  const prev = currentIdx > 0 ? entries[currentIdx - 1] : null;
  const next = currentIdx < entries.length - 1 ? entries[currentIdx + 1] : null;

  return (
    <nav className="flex justify-between items-center mt-8 gap-2">
      <button
        disabled={!prev}
        className={`py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium transition hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-40`}
        onClick={() => prev && router.push(`/diary/${prev.id}`)}
      >
        ← Prev
      </button>
      <span className="mx-4 text-gray-500 dark:text-gray-400">
        Page {currentIdx + 1} of {entries.length}
      </span>
      <button
        disabled={!next}
        className={`py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium transition hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-40`}
        onClick={() => next && router.push(`/diary/${next.id}`)}
      >
        Next →
      </button>
    </nav>
  );
}
