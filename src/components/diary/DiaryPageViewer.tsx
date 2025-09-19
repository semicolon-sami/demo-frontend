import React from "react";
import { DiaryEntry } from "@/supabase/diary";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

type DiaryPageViewerProps = {
  entry: DiaryEntry;
};

export default function DiaryPageViewer({ entry }: DiaryPageViewerProps) {
  // Use TipTap in "readonly display" mode for content
  const editor = useEditor({
    extensions: [StarterKit, Image],
    editable: false,
    content: entry.content,
  });

  return (
    <article className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-6">
      <header className="mb-2">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {entry.title || "Untitled Entry"}
        </h2>
        <div className="text-gray-500 text-sm mt-1">
          {new Date(entry.created_at).toLocaleString()}
        </div>
        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {entry.media &&
        entry.media.length > 0 &&
        entry.media.map((media, i) =>
          media.type === "image" ? (
            <img
              key={media.url}
              src={media.url}
              alt={media.name}
              className="my-4 w-full max-h-96 rounded-lg object-cover border"
            />
          ) : media.type === "video" ? (
            <video
              key={media.url}
              src={media.url}
              controls
              className="my-4 w-full rounded-lg object-cover border max-h-96"
            />
          ) : null
        )}

      <section className="prose lg:prose-xl dark:prose-invert my-6">
        {editor ? <EditorContent editor={editor} /> : <div>Loading...</div>}
      </section>
    </article>
  );
}
