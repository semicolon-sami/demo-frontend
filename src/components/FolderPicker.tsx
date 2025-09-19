// components/FolderPicker.tsx

import React from "react";

type FolderPickerProps = {
  folders: string[];
  currentFolder: string;
  onChange: (folder: string) => void;
};

const FolderPicker: React.FC<FolderPickerProps> = ({
  folders,
  currentFolder,
  onChange,
}) => (
  <select
    className="border border-white/20 dark:border-gray-700 p-1 rounded-lg bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg shadow transition-all"
    value={currentFolder}
    onChange={(e) => onChange(e.target.value)}
  >
    {folders.map((f) => (
      <option key={f} value={f}>
        {f}
      </option>
    ))}
    <option value="favorites">Favorites</option>
  </select>
);

export default FolderPicker;
