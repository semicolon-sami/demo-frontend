// components/UploadButton.tsx

import React, { ChangeEvent } from "react";

type UploadButtonProps = {
  onUpload: (file: File) => void;
  uploading: boolean;
};

const UploadButton: React.FC<UploadButtonProps> = ({ onUpload, uploading }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset file input so uploading the same file again will trigger the event
    e.currentTarget.value = "";
  };

  return (
    <label className="bg-white/30 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700 px-3 py-1 rounded-lg cursor-pointer shadow transition-all backdrop-blur-lg text-blue-800 dark:text-blue-300">
      {uploading ? "Uploading…" : "Add song"}
      <input
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
};

export default UploadButton;
