import React from "react";

type UploadBoxProps = {
  onUpload: (files: FileList | null) => void;
};

export default function UploadBox({ onUpload }: UploadBoxProps) {
  return (
    <div
      className="mb-6 border-2 border-dashed p-6 rounded text-center"
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => {
        e.preventDefault();
        onUpload(e.dataTransfer.files);
      }}
    >
      <p className="mb-2">Upload photos or videos</p>
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.webm"
        onChange={(e) => onUpload(e.target.files)}
      />
    </div>
  );
}
