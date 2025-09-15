"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FolderTabs from "@/components/FolderTabs";
import CreateFolder from "@/components/CreateFolder";
import UploadBox from "@/components/UploadBox";
import MediaGrid from "@/components/MediaGrid";
import Lightbox from "@/components/Lightbox";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Inline Media type for convenience
type Media = {
  name: string;
  path: string;
  url: string;
  type: "image" | "video";
};

export default function GalleryModal({ onClose }: { onClose: () => void }) {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [newFolderName, setNewFolderName] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [slideshowActive, setSlideshowActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const supabase = createClientComponentClient();

  // Detect folders
  const detectFolders = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase.storage.from("photos").list("", { limit: 100 });
    if (error) return [];
    return (data || []).map((f) => f.name).filter((n) => n && !n.includes("."));
  }, [supabase]);

  // List media in a folder
  const listMediaInFolder = useCallback(async (folderName: string) => {
    const listPath = folderName ? folderName : "";
    const { data: files, error } = await supabase.storage.from("photos").list(listPath, { limit: 200 });
    if (error) return [];
    const signed = await Promise.all(
      (files || []).map(async (f) => {
        if (!f.name || f.name.endsWith('/')) return null;
        const path = listPath ? `${listPath}/${f.name}` : f.name;
        const { data } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24);
        const type = f.name.match(/\.(mp4|mov|webm)$/i) ? "video" : "image";
        return data?.signedUrl ? { name: f.name, path, url: data.signedUrl, type } : null;
      })
    );
    return (signed.filter(Boolean) as Media[]);
  }, [supabase]);

  // Load media based on tab
  const loadMedia = useCallback(
    async (tab: string) => {
      setLoading(true);
      try {
        if (tab === "All") {
          const folderNames = await detectFolders();
          const all: Media[] = [];
          for (const f of folderNames) {
            const p = await listMediaInFolder(f);
            all.push(...p);
          }
          const rootFiles = await listMediaInFolder("");
          all.push(...rootFiles);
          setMedia(all);
        } else {
          const res = await listMediaInFolder(tab);
          setMedia(res);
        }
      } catch {
        setMedia([]);
      } finally {
        setLoading(false);
      }
    },
    [detectFolders, listMediaInFolder]
  );

  // Favorites
  const loadFavorites = useCallback(async () => {
    const { data, error } = await supabase.from("photo_favorites").select("path");
    if (error) {
      setFavorites([]);
      return;
    }
    setFavorites((data || []).map((row: { path: string }) => row.path));
  }, [supabase]);

  // Initial load
  useEffect(() => {
    (async () => {
      const detected = await detectFolders();
      setFolders(["All", ...detected]);
      await loadMedia("All");
      await loadFavorites();
    })();
    const channel = supabase
      .channel("photos-changes")
      .on("postgres_changes", { event: "*", schema: "storage", table: "objects" }, () => {
        loadMedia(activeTab);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, []);

  // Reload media on tab change
  useEffect(() => {
    loadMedia(activeTab);
    // eslint-disable-next-line
  }, [activeTab]);

  // Upload handler
  async function handleUpload(files: FileList | null) {
    if (!files) return;
    const folder = activeTab === "All" ? "" : activeTab;
    for (const file of Array.from(files)) {
      const filePath = folder ? `${folder}/${file.name}` : file.name;
      await supabase.storage.from("photos").upload(filePath, file, { upsert: true });
    }
    await loadMedia(activeTab);
  }

  // Create folder
  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const folderPath = `${newFolderName}/.keep`;
    await supabase.storage.from("photos").upload(folderPath, new Blob([""]), { upsert: true });
    setNewFolderName("");
    const detected = await detectFolders();
    setFolders((prev) =>
      prev.includes(newFolderName) ? prev : [...prev, newFolderName]
    );
    await loadMedia(activeTab);
  }

  // Delete & Favorite
  async function deleteMedia(path: string) {
    await supabase.storage.from("photos").remove([path]);
    setMedia((prev) => prev.filter((m) => m.path !== path));
  }
  async function toggleFavorite(path: string) {
    const isFav = favorites.includes(path);
    if (isFav) {
      await supabase.from("photo_favorites").delete().eq("path", path);
      setFavorites((prev) => prev.filter((f) => f !== path));
    } else {
      await supabase.from("photo_favorites").upsert([{ path }]);
      setFavorites((prev) => [...prev, path]);
    }
  }

  // Download
  function downloadMedia(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  // Lightbox controls
  function openLightbox(i: number) {
    setLightboxIndex(i);
    setIsLightboxOpen(true);
    setTimeout(() => {
      (document.getElementById("lightbox-close-btn") as HTMLButtonElement)?.focus?.();
    }, 16);
  }
  function closeLightbox() {
    setIsLightboxOpen(false);
    setSlideshowActive(false);
  }
  function next() {
    setLightboxIndex((i) => (i + 1) % media.length);
  }
  function prev() {
    setLightboxIndex((i) => (i - 1 + media.length) % media.length);
  }

  // Keyboard nav in lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLightboxOpen, media.length]);

  // Slideshow & music
  useEffect(() => {
    if (!slideshowActive || !isLightboxOpen) {
      audioRef.current?.pause();
      return;
    }
    const timer = setInterval(() => next(), 3500);
    audioRef.current?.play().catch(() => {});
    return () => clearInterval(timer);
  }, [slideshowActive, isLightboxOpen, media.length]);

  // GalleryModal fully upgraded UI:
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.90, y: 40 }}
        transition={{ duration: 0.24 }}
        className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center"
      >
        <div className="relative max-w-5xl w-full mx-auto
          rounded-2xl bg-white/30 dark:bg-gray-900/90
          backdrop-blur-xl border border-white/30 dark:border-gray-700
          shadow-2xl ring-2 ring-pink-400/30
          transition-all min-h-[70vh] max-h-[90vh] overflow-y-auto px-8 py-7"
        >
          {/* Neon close button */}
          <button
            className="absolute top-4 right-5 px-3 py-1 rounded-full
              bg-gradient-to-r from-pink-500 via-blue-500 to-purple-400
              text-white shadow-[0_0_14px_#24eaff99]
              hover:scale-105 transition border border-white/20 backdrop-blur-lg z-20"
            onClick={onClose}
          >
            Close ✕
          </button>
          {/* Modal header: neon gradient headline */}
          <h1 className="font-extrabold text-4xl md:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 mb-2">
            📷 My Gallery
          </h1>
          {/* Music for slideshow */}
          <audio ref={audioRef} src="/slideshow-music.mp3" loop style={{ display: "none" }} />
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              {/* FolderTabs neon accent */}
              <FolderTabs
                folders={folders}
                activeTab={activeTab}
                onTabClick={setActiveTab}
              />
            </div>
            {/* CreateFolder glassy input/button */}
            <CreateFolder
              value={newFolderName}
              onValueChange={setNewFolderName}
              onCreate={handleCreateFolder}
            />
            {/* UploadBox glassy input/button */}
            <UploadBox
              onUpload={handleUpload}
            />
            {/* Loader */}
            {loading ? (
              <div className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 w-full h-32 mb-3" />
            ) : (
              <div className="overflow-y-auto max-h-[60vh]">
                {/* MediaGrid glassy/neon upgrades via props or within it */}
                <MediaGrid
                  media={media}
                  favorites={favorites}
                  onFavorite={toggleFavorite}
                  onDelete={deleteMedia}
                  onClickMedia={openLightbox}
                />
              </div>
            )}
            {/* Lightbox glassy modal */}
            <Lightbox
              open={isLightboxOpen}
              media={media}
              index={lightboxIndex}
              onClose={closeLightbox}
              onPrev={prev}
              onNext={next}
              onFavorite={toggleFavorite}
              onDownload={downloadMedia}
              onToggleSlideshow={() => setSlideshowActive((s) => !s)}
              slideshowActive={slideshowActive}
              favorites={favorites}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
