"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// For files returned from Supabase listing (no URL yet)
type FileDescriptor = { name: string; path: string };
// For files with signed URLs
type Photo = { name: string; path: string; url: string };

export default function MiniPhotoPopup({ onClose }: { onClose: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);

      // Get folder names
      const { data: folders } = await supabase.storage.from("photos").list("", { limit: 100 });
      const folderNames = (folders || []).map(f => f.name).filter(n => !!n && !n.includes("."));

      // List files from folders and root; do not attach URL yet
      async function getPhotoFiles(folder: string): Promise<FileDescriptor[]> {
        const { data: files } = await supabase.storage.from("photos").list(folder, { limit: 100 });
        return (files || []).filter(f =>
          f.name && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
        ).map(f => ({
          name: f.name,
          path: folder ? `${folder}/${f.name}` : f.name,
        }));
      }

      let fileList: FileDescriptor[] = [];
      for (const folder of folderNames) {
        fileList = fileList.concat(await getPhotoFiles(folder));
      }
      fileList = fileList.concat(await getPhotoFiles(""));

      // Now fetch signed URL for each, to turn into Photo[]
      const withUrls: (Photo | null)[] = await Promise.all(
        fileList.map(async f => {
          const { data } = await supabase.storage
            .from("photos")
            .createSignedUrl(f.path, 60 * 60);
          return data?.signedUrl
            ? { ...f, url: data.signedUrl }
            : null;
        })
      );

      const validPhotos: Photo[] = withUrls.filter((p): p is Photo => !!p && !!p.url);
      // Shuffle for random order
      for (let i = validPhotos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validPhotos[i], validPhotos[j]] = [validPhotos[j], validPhotos[i]];
      }
      setPhotos(validPhotos);
      setIndex(0);
      setLoading(false);
    }
    loadPhotos();
  }, []);

  // Auto-rotate after load ONLY if not loading and images exist
  useEffect(() => {
    if (loading || photos.length < 2) return;
    const timer = setInterval(() => {
      setIndex(idx => (idx + 1) % photos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [photos, loading]);

  // Auto-close on tab hide
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") onClose();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [onClose]);

  // Lightbox keyboard navigation and swipe
  useEffect(() => {
    if (!showLightbox) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowLightbox(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);

    // Simple touch swipe left/right (mobile)
    let startX = 0;
    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) startX = e.touches[0].clientX;
    }
    function handleTouchEnd(e: TouchEvent) {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - startX;
        if (deltaX > 40) goPrev();
        else if (deltaX < -40) goNext();
      }
    }
    const el = lightboxRef.current;
    el?.addEventListener("touchstart", handleTouchStart);
    el?.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKey);
      el?.removeEventListener("touchstart", handleTouchStart);
      el?.removeEventListener("touchend", handleTouchEnd);
    };
    // eslint-disable-next-line
  }, [showLightbox, index, photos.length]);

  function goPrev() {
    setIndex(i => (i - 1 + photos.length) % photos.length);
  }
  function goNext() {
    setIndex(i => (i + 1) % photos.length);
  }

  if (loading) {
    return (
      <div
        className="fixed bottom-6 right-4 z-50 shadow-lg bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center"
        style={{ width: 180, minHeight: 120, boxShadow: "0 6px 32px 0 rgba(0,0,0,0.20)" }}
      >
        <span className="text-xs text-gray-400">Loading photos...</span>
        <div className="mt-2 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400" />
      </div>
    );
  }
  if (!photos.length) return null;

  return (
    <>
      <div
        className="fixed bottom-6 right-4 z-50 shadow-lg bg-white rounded-xl border border-gray-200 p-2 flex flex-col items-center"
        style={{
          width: 180,
          minHeight: 180,
          boxShadow: "0 6px 32px 0 rgba(0,0,0,0.20)",
          transition: "opacity .2s"
        }}
      >
        <button
          className="absolute top-2 right-3 w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:text-red-500 flex items-center justify-center"
          onClick={onClose}
          title="Close"
          style={{ fontSize: 19 }}
        >
          ×
        </button>
        <img
          src={photos[index].url}
          alt={photos[index].name}
          className="w-full h-28 object-cover rounded cursor-pointer"
          style={{ objectFit: 'cover', maxWidth: '160px' }}
          onClick={() => setShowLightbox(true)}
        />
        <div className="truncate mt-2 text-xs text-gray-600 text-center" title={photos[index].name}>
          {photos[index].name}
        </div>
        <div className="flex gap-2 mt-1 items-center">
          <button
            className="text-xl px-1 hover:text-blue-500"
            style={{ lineHeight: 1 }}
            onClick={goPrev}
            tabIndex={-1}
            aria-label="Previous photo"
          >⟨</button>
          <span className="text-xs text-gray-400">{index + 1}/{photos.length}</span>
          <button
            className="text-xl px-1 hover:text-blue-500"
            style={{ lineHeight: 1 }}
            onClick={goNext}
            tabIndex={-1}
            aria-label="Next photo"
          >⟩</button>
        </div>
      </div>
      {/* Lightbox modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center touch-pan-x"
          style={{ animation: "fadeIn .2s" }}
          onClick={() => setShowLightbox(false)}
        >
          <div
            ref={lightboxRef}
            className="relative"
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 rounded-full text-lg shadow hover:bg-red-500"
              onClick={() => setShowLightbox(false)}
              title="Close"
            >×</button>
            <button
              className="absolute top-1 left-2 text-white bg-black/[.10] px-2 py-1 rounded-full text-xl shadow"
              style={{ top: "50%", transform: "translateY(-50%)" }}
              onClick={goPrev}
              title="Previous"
            >⟨</button>
            <img
              src={photos[index].url}
              alt={photos[index].name}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                borderRadius: "12px",
                boxShadow: "0 4px 32px #0009",
                background: "#222",
                display: "block",
                margin: "0 auto"
              }}
            />
            <button
              className="absolute top-1 right-10 text-white bg-black/[.10] px-2 py-1 rounded-full text-xl shadow"
              style={{ top: "50%", transform: "translateY(-50%)" }}
              onClick={goNext}
              title="Next"
            >⟩</button>
            <div className="text-center text-white mt-2 text-base font-medium">
              {photos[index].name} <span className="text-xs text-gray-300">{index+1}/{photos.length}</span>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}
    </>
  );
}
