"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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

export default function GalleryPage() {
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

  // List media in a folder (this was fixed)
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
      await supabase.from("photo_favorites").insert({ path }, { upsert: true });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <audio
        ref={audioRef}
        src="/slideshow-music.mp3"
        loop
        style={{ display: "none" }}
      />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📷 My Gallery</h1>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-3 py-1 border rounded"
          >
            Back
          </button>
        </div>
        <FolderTabs
          folders={folders}
          activeTab={activeTab}
          onTabClick={setActiveTab}
        />
        <CreateFolder
          value={newFolderName}
          onValueChange={setNewFolderName}
          onCreate={handleCreateFolder}
        />
        <UploadBox onUpload={handleUpload} />
        {loading ? (
          <p>Loading…</p>
        ) : (
          <MediaGrid
            media={media}
            favorites={favorites}
            onFavorite={toggleFavorite}
            onDelete={deleteMedia}
            onClickMedia={openLightbox}
          />
        )}
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
  );
}
