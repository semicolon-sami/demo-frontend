import React from "react";

type FolderTabsProps = {
  folders: string[];
  activeTab: string;
  onTabClick: (tab: string) => void;
};

export default function FolderTabs({ folders, activeTab, onTabClick }: FolderTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {folders.map((f) => (
        <button
          key={f}
          onClick={() => onTabClick(f)}
          className={`px-3 py-1 rounded ${activeTab === f ? "bg-purple-600 text-white" : "bg-white border"}`}
          style={{ minWidth: 70 }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
