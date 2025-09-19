// components/SongItem.tsx

import React from "react";
import { Song } from "@/types/types";

type SongItemProps = {
  song: Song;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
};

const SongItem: React.FC<SongItemProps> = ({
  song,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onDelete,
}) => (
  <li
    className="bg-white/30 dark:bg-gray-900/70 backdrop-blur-lg p-3 rounded-xl shadow-xl flex items-center justify-between border border-white/20 dark:border-gray-700 transition-all"
  >
    <div className="truncate max-w-xs">
      <div className="font-bold truncate text-blue-700 dark:text-blue-300">{song.name}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.path}</div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onPlay}
        className="px-2 py-1 rounded-full bg-blue-100/70 dark:bg-blue-900/40 shadow hover:scale-105 transition-all border border-blue-200 dark:border-blue-800"
      >
        ▶ Play
      </button>
      <button
        onClick={onToggleFavorite}
        className={`px-2 py-1 rounded-full font-bold shadow-lg transition-all border ${
          isFavorite
            ? "bg-yellow-400/80 text-yellow-800 dark:bg-yellow-300 dark:text-yellow-900 shadow-[0_0_12px_#ffd700]"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        }`}
        title="Toggle Favorite"
      >
        ★
      </button>
      <button
        onClick={onDelete}
        className="px-2 py-1 border rounded-full text-red-600 dark:text-red-300 bg-white/30 dark:bg-gray-900/60 shadow hover:bg-red-100/30 dark:hover:bg-red-300/30 transition-all"
      >
        🗑 Delete
      </button>
    </div>
  </li>
);

export default SongItem;
