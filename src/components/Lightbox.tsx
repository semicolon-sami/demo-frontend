import React from "react";

type Media = {
  name: string;
  path: string;
  url: string;
  type: "image" | "video";
};

type LightboxProps = {
  open: boolean;
  media: Media[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFavorite: (path: string) => void;
  onDownload: (url: string, name: string) => void;
  onToggleSlideshow: () => void;
  slideshowActive: boolean;
  favorites: string[];
};

export default function Lightbox({
  open, media, index,
  onClose, onPrev, onNext,
  onFavorite, onDownload, onToggleSlideshow,
  slideshowActive, favorites
}: LightboxProps) {
  if (!open || !media[index]) return null;
  const m = media[index];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button
        onClick={onPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 text-3xl shadow hover:bg-purple-600"
        aria-label="Previous"
        tabIndex={0}
        style={{ zIndex: 1001 }}
      >◀</button>
      <button
        onClick={onNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 text-3xl shadow hover:bg-purple-600"
        aria-label="Next"
        tabIndex={0}
        style={{ zIndex: 1001 }}
      >▶</button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl font-bold bg-black/70 rounded-full px-4 py-2 shadow-lg z-50"
        aria-label="Close lightbox"
        tabIndex={0}
        id="lightbox-close-btn"
        style={{ zIndex: 1002 }}
      >✕</button>
      <div className="flex flex-col items-center w-full max-w-4xl">
        <div className="mb-4 flex gap-3 justify-center">
          <button onClick={() => onFavorite(m.path)} className="text-2xl" aria-label={favorites.includes(m.path) ? "Remove from favorites" : "Add to favorites"}>
            {favorites.includes(m.path) ? "⭐" : "☆"}
          </button>
          <button onClick={() => onDownload(m.url, m.name)} className="text-xl" aria-label="Download">⬇</button>
          <button onClick={onToggleSlideshow} className="text-xl" aria-label="Toggle slideshow">{slideshowActive ? "⏸" : "▶"}</button>
        </div>
        {m.type === "image" ? (
          <img
            src={m.url}
            alt={m.name}
            className="max-h-[80vh] max-w-[90vw] object-contain bg-black rounded shadow-lg"
            style={{ boxShadow: "0 4px 32px #0009" }}
          />
        ) : (
          <video
            src={m.url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-[90vw] object-contain bg-black rounded shadow-lg"
            style={{ boxShadow: "0 4px 32px #0009" }}
          />
        )}
      </div>
    </div>
  );
}
