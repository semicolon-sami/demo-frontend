import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { DiaryMedia } from "@/supabase/diary";
import DiaryImageUploader from "./DiaryImageUploader";

type DiaryEntryEditorProps = {
  initialContent?: any; // Tiptap JSON or ''
  onChange?: (content: any) => void;
  media?: DiaryMedia[];
  onAddMedia?: (media: DiaryMedia) => void;
  editable?: boolean;
};

export default function DiaryEntryEditor({
  initialContent,
  onChange,
  media = [],
  onAddMedia,
  editable = true,
}: DiaryEntryEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: initialContent,
    editable,
    autofocus: true,
    onUpdate({ editor }) {
      onChange?.(editor.getJSON());
    },
  });

  // Handler for new uploads
  const handleMediaInsert = (media: DiaryMedia) => {
    if (!editor) return;
    // Insert as inline image (or extend for video support)
    if (media.type === "image") {
      editor.chain().focus().setImage({ src: media.url, alt: media.name }).run();
    } else if (media.type === "video") {
      // Insert videos as external blocks, or extend TipTap with custom extension for embedded video
      onAddMedia?.(media);
    }
    onAddMedia?.(media);
  };

  return (
    <div className="border rounded-xl bg-white dark:bg-gray-900 shadow-lg p-4 max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <DiaryImageUploader onUpload={handleMediaInsert} />
        {/* Add additional editor toolbar buttons here if desired */}
      </div>
      <EditorContent editor={editor} />
      {/* Show video previews if any */}
      {media
        .filter((m) => m.type === "video")
        .map((m) => (
          <div key={m.url} className="my-4">
            <video src={m.url} controls className="rounded-lg w-full max-h-96" />
          </div>
        ))}
    </div>
  );
}
