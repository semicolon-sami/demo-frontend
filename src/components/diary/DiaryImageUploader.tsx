import React, { useRef, useState } from "react";
import { uploadDiaryMedia, DiaryMedia } from "@/supabase/diary";

type DiaryImageUploaderProps = {
  onUpload: (media: DiaryMedia) => void;
  accept?: string;
};

export default function DiaryImageUploader({
  onUpload,
  accept = "image/*,video/*",
}: DiaryImageUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadDiaryMedia(file);
      onUpload(media);
      fileInput.current!.value = ""; // Reset file input
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button
        onClick={() => fileInput.current?.click()}
        type="button"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded shadow"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "📷 Add Image/Video"}
      </button>
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  );
}
