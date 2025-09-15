import React from "react";

type CreateFolderProps = {
  value: string;
  onValueChange: (val: string) => void;
  onCreate: () => void;
};

export default function CreateFolder({ value, onValueChange, onCreate }: CreateFolderProps) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="New folder name"
        className="px-2 py-1 border rounded"
      />
      <button
        onClick={onCreate}
        className="px-3 py-1 bg-green-500 text-white rounded"
      >
        Create
      </button>
    </div>
  );
}
