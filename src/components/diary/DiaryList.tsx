import React from "react";
import { DiaryEntry } from "@/supabase/diary";

type DiaryListProps = {
  entries: DiaryEntry[];
  onEntryClick?: (id: string) => void;
};

export default function DiaryList({ entries, onEntryClick }: DiaryListProps) {
  if (!entries.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        No diary entries found. Start by creating a new entry!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {entries.map((entry) => (
        <button
          key={entry.id}
          className="w-full text-left group rounded-lg shadow hover:shadow-lg transition-all bg-white dark:bg-gray-800 border p-4 flex gap-4 items-center cursor-pointer"
          onClick={() => onEntryClick?.(entry.id)}
        >
          {/* Thumbnail if any media */}
          {entry.media && entry.media.length > 0 && entry.media[0].type === "image" ? (
            <img
              src={entry.media[0].url}
              alt={entry.media[0].name}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-300 text-4xl">
              <span>📔</span>
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-xl text-blue-700 dark:text-blue-300 mb-1 group-hover:underline">
              {entry.title || "Untitled Entry"}
            </div>
            <div className="text-gray-500 text-sm mb-2">
              {new Date(entry.created_at).toLocaleDateString()}{" "}
              {entry.tags?.length > 0 && (
                <span>
                  •{" "}
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs px-2 py-0.5 mr-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <div className="text-gray-600 dark:text-gray-300 line-clamp-2">
              {getPreviewText(entry.content)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Helper: Basic text preview from TipTap JSON or fallback
function getPreviewText(content: any): string {
  if (!content) return "";
  // Try to extract first paragraph text if TipTap JSON
  if (content?.type === "doc" && Array.isArray(content.content)) {
    for (const node of content.content) {
      if (node.type === "paragraph" && typeof node.text === "string") {
        return node.text;
      }
      if (node.type === "paragraph" && Array.isArray(node.content)) {
        // For nodes with bold/italic, etc
        return node.content.map((sub: any) => sub.text).join(" ");
      }
    }
  }
  // Fallback: Stringify short
  if (typeof content === "string") return content.slice(0, 90);
  try {
    return JSON.stringify(content).slice(0, 90);
  } catch {
    return "";
  }
}
