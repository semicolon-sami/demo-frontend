// components/SongList.tsx

import React from "react";
import { Song } from "@/types/types";
import SongItem from "@/components/SongItem";

type SongListProps = {
  songs: Song[];
  favorites: string[];
  loading: boolean;
  onPlay: (i: number) => void;
  onToggleFavorite: (i: number) => void;
  onDelete: (i: number) => void;
};

const SongList: React.FC<SongListProps> = ({
  songs,
  favorites,
  loading,
  onPlay,
  onToggleFavorite,
  onDelete,
}) => {
  if (loading)
    return (
      <div className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 w-full h-32 mb-3" />
    );
  if (songs.length === 0)
    return (
      <p className="text-gray-600 dark:text-gray-300 py-6 text-center">No songs found.</p>
    );
  return (
    <ul className="space-y-3">
      {songs.map((s, i) => (
        <SongItem
          key={s.path}
          song={s}
          isFavorite={favorites.includes(s.path)}
          onPlay={() => onPlay(i)}
          onToggleFavorite={() => onToggleFavorite(i)}
          onDelete={() => onDelete(i)}
        />
      ))}
    </ul>
  );
};

export default SongList;
