import React from "react";

type Media = {
  name: string;
  path: string;
  url: string;
  type: "image" | "video";
};

type MediaGridProps = {
  media: Media[];
  favorites: string[];
  onFavorite: (path: string) => void;
  onDelete: (path: string) => void;
  onClickMedia: (index: number) => void;
};

export default function MediaGrid({
  media,
  favorites,
  onFavorite,
  onDelete,
  onClickMedia,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {media.map((m, i) => (
        <div
          key={m.path}
          className="relative cursor-pointer group"
          onClick={() => onClickMedia(i)}
          tabIndex={0}
          aria-label={m.name}
        >
          {m.type === "image" ? (
            <img
              src={m.url}
              alt={m.name}
              className="w-full h-40 object-cover rounded shadow-sm group-hover:opacity-80 transition"
            />
          ) : (
            <video
              src={m.url}
              className="w-full h-40 object-cover rounded shadow-sm group-hover:opacity-80 transition"
            />
          )}
          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
            {m.name}
          </span>
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={e => {
                e.stopPropagation();
                onFavorite(m.path);
              }}
              className="px-1 bg-yellow-300 rounded"
              aria-label={favorites.includes(m.path) ? "Remove from favorites" : "Add to favorites"}
            >
              {favorites.includes(m.path) ? "⭐" : "☆"}
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(m.path);
              }}
              className="px-1 bg-red-500 text-white rounded"
              aria-label="Delete media"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
