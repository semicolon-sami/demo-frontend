"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type FileDescriptor = { name: string; path: string };
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

      const { data: folders } = await supabase.storage.from("photos").list("", { limit: 100 });
      const folderNames = (folders || []).map(f => f.name).filter(n => !!n && !n.includes("."));

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

  useEffect(() => {
    if (loading || photos.length < 2) return;
    const timer = setInterval(() => {
      setIndex(idx => (idx + 1) % photos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [photos, loading]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") onClose();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [onClose]);

  useEffect(() => {
    if (!showLightbox) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowLightbox(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);

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
        className="fixed bottom-6 right-4 z-50 shadow-2xl bg-white/30 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700 p-4 flex flex-col items-center justify-center transition-all"
        style={{ width: 180, minHeight: 120 }}
      >
        <span className="text-xs text-blue-700 dark:text-blue-200 font-light">Loading photos...</span>
        <div className="mt-2 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400 dark:border-blue-300" />
      </div>
    );
  }
  if (!photos.length) return null;

  return (
    <>
      <div
        className="fixed bottom-6 right-4 z-50 shadow-2xl bg-white/30 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700 p-2 flex flex-col items-center transition-all group"
        style={{
          width: 180,
          minHeight: 180,
        }}
      >
        <button
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 text-white shadow-[0_0_8px_#24eaffbb] hover:bg-pink-600 hover:scale-110 border border-white/20 flex items-center justify-center transition"
          onClick={onClose}
          title="Close"
          style={{ fontSize: 23 }}
        >
          ×
        </button>
        <img
          src={photos[index].url}
          alt={photos[index].name}
          className="w-full h-28 object-cover rounded-xl border border-white/30 shadow-lg cursor-pointer transition hover:scale-105"
          style={{ maxWidth: '160px' }}
          onClick={() => setShowLightbox(true)}
        />
        <div className="truncate mt-2 text-xs font-medium text-blue-700 dark:text-blue-300 text-center" title={photos[index].name}>
          {photos[index].name}
        </div>
        <div className="flex gap-2 mt-1 items-center">
          <button
            className="text-xl px-1 hover:text-pink-500 font-bold"
            style={{ lineHeight: 1 }}
            onClick={goPrev}
            tabIndex={-1}
            aria-label="Previous photo"
          >⟨</button>
          <span className="text-xs text-blue-400 dark:text-blue-300 bg-white/30 dark:bg-gray-900/30 rounded-full px-2">{index + 1}/{photos.length}</span>
          <button
            className="text-xl px-1 hover:text-pink-500 font-bold"
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
          className="fixed inset-0 bg-black/80 z- flex items-center justify-center fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div
            ref={lightboxRef}
            className="relative rounded-3xl bg-white/30 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 shadow-2xl p-6 transition-all"
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-400 text-white px-4 py-1 rounded-full text-lg shadow hover:scale-105 border border-white/20 backdrop-blur-lg"
              onClick={() => setShowLightbox(false)}
              title="Close"
            >×</button>
            <button
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/20 text-white px-2 py-1 rounded-full text-xl shadow"
              onClick={goPrev}
              title="Previous"
            >⟨</button>
            <img
              src={photos[index].url}
              alt={photos[index].name}
              className="max-w-[89vw] max-h-[68vh] rounded-xl border border-white/30 shadow-xl mx-auto bg-white/20 dark:bg-gray-900/50"
            />
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/20 text-white px-2 py-1 rounded-full text-xl shadow"
              onClick={goNext}
              title="Next"
            >⟩</button>
            <div className="text-center text-blue-700 dark:text-blue-200 mt-3 text-base font-semibold bg-white/20 dark:bg-gray-900/40 rounded-full px-4 py-2 inline-block shadow">
              {photos[index].name} <span className="text-xs text-blue-400 dark:text-blue-300 ml-2">{index + 1}/{photos.length}</span>
            </div>
          </div>
          <style>{`
            .fade-in { animation: fadeIn .2s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}
    </>
  );
}
