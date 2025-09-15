"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

  const supabaseClient = createClientComponentClient();

  // Detect folders
  const detectFolders = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase.storage.from("photos").list("", { limit: 100 });
    if (error) return [];
    return (data || []).map((f) => f.name).filter((n) => n && !n.includes("."));
  }, []);

  // List media in a folder (no metadata)
  const listMediaInFolder = useCallback(async (folderName: string) => {
    const listPath = folderName ? folderName : "";
    const { data: files, error } = await supabase.storage.from("photos").list(listPath, { limit: 200 });
    if (error) return [];
    const signed: Media[] = await Promise.all(
      (files || []).map(async (f) => {
        // Skip folders
        if (!f.name || f.name.endsWith('/')) return null;
        const path = listPath ? `${listPath}/${f.name}` : f.name;
        const { data } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24);
        const type = f.name.match(/\.(mp4|mov|webm)$/i) ? "video" : "image";
        return data?.signedUrl ? { name: f.name, path, url: data.signedUrl, type } : null;
      })
    );
    return signed.filter(Boolean) as Media[];
  }, []);

  // Load media based on tab
  const loadMedia = useCallback(
    async (tab: string) => {
      setLoading(true);
      try {
        if (tab === "All") {
          const folderNames = await detectFolders();
          let all: Media[] = [];
          // Images/videos in all folders
          for (const f of folderNames) {
            const p = await listMediaInFolder(f);
            all.push(...p);
          }
          // Plus any images/videos in bucket root
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
  }, []);

  // On first load, load folders and media for "All" (do NOT setActiveTab after first mount)
  useEffect(() => {
    (async () => {
      const detected = await detectFolders();
      setFolders(["All", ...detected]);
      await loadMedia("All");
      await loadFavorites();
    })();
    const channel = supabaseClient
      .channel("photos-changes")
      .on("postgres_changes", { event: "*", schema: "storage", table: "objects" }, () => {
        loadMedia(activeTab);
      })
      .subscribe();
    return () => {
      supabaseClient.removeChannel(channel);
    };
    // only run once (no activeTab dependency here!)
    // eslint-disable-next-line
  }, []);

  // Whenever activeTab changes (by user click), reload only the tab the user requested
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
  async function createFolder() {
    if (!newFolderName.trim()) return;
    const folderPath = `${newFolderName}/.keep`;
    await supabase.storage.from("photos").upload(folderPath, new Blob([""]), { upsert: true });
    setNewFolderName("");
    const detected = await detectFolders();
    setFolders((prev) =>
      prev.includes(newFolderName) ? prev : [...prev, newFolderName]
    );
    // stay on the current tab
    await loadMedia(activeTab);
  }

  // Delete
  async function deleteMedia(path: string) {
    await supabase.storage.from("photos").remove([path]);
    setMedia((prev) => prev.filter((m) => m.path !== path));
  }

  // Toggle favorite
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
        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setActiveTab(f)}
              className={`px-3 py-1 rounded ${activeTab === f ? "bg-purple-600 text-white" : "bg-white border"
                }`}
              style={{ minWidth: 70 }}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Create folder */}
        <div className="mb-4 flex gap-2">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            className="px-2 py-1 border rounded"
          />
          <button
            onClick={createFolder}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Create
          </button>
        </div>
        {/* Upload */}
        <div
          className="mb-6 border-2 border-dashed p-6 rounded text-center"
          onDragOver={e => {
            e.preventDefault();
          }}
          onDrop={e => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
        >
          <p className="mb-2">Upload photos or videos</p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.webm"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
        {/* Grid */}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {media.map((m, i) => (
              <div
                key={m.path}
                className="relative cursor-pointer group"
                onClick={() => openLightbox(i)}
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
                      toggleFavorite(m.path);
                    }}
                    className="px-1 bg-yellow-300 rounded"
                    aria-label={favorites.includes(m.path) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.includes(m.path) ? "⭐" : "☆"}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteMedia(m.path);
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
        )}
        {/* Lightbox */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            {/* Navigation buttons */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 text-3xl shadow hover:bg-purple-600"
              aria-label="Previous"
              tabIndex={0}
              style={{ zIndex: 1001 }}
            >
              ◀
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white rounded-full p-3 text-3xl shadow hover:bg-purple-600"
              aria-label="Next"
              tabIndex={0}
              style={{ zIndex: 1001 }}
            >
              ▶
            </button>
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-4xl font-bold bg-black/70 rounded-full px-4 py-2 shadow-lg z-50"
              aria-label="Close lightbox"
              tabIndex={0}
              id="lightbox-close-btn"
              style={{ zIndex: 1002 }}
            >
              ✕
            </button>
            <div className="flex flex-col items-center w-full max-w-4xl">
              {/* Favorite/Download/Slideshow */}
              <div className="mb-4 flex gap-3 justify-center">
                <button
                  onClick={() => toggleFavorite(media[lightboxIndex].path)}
                  className="text-2xl"
                  aria-label={favorites.includes(media[lightboxIndex].path) ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorites.includes(media[lightboxIndex].path) ? "⭐" : "☆"}
                </button>
                <button
                  onClick={() => downloadMedia(media[lightboxIndex].url, media[lightboxIndex].name)}
                  className="text-xl"
                  aria-label="Download"
                >
                  ⬇
                </button>
                <button
                  onClick={() => setSlideshowActive(s => !s)}
                  className="text-xl"
                  aria-label="Toggle slideshow"
                >
                  {slideshowActive ? "⏸" : "▶"}
                </button>
              </div>
              {media[lightboxIndex].type === "image" ? (
                <img
                  src={media[lightboxIndex].url}
                  alt={media[lightboxIndex].name}
                  className="max-h-[80vh] max-w-[90vw] object-contain bg-black rounded shadow-lg"
                  style={{ boxShadow: "0 4px 32px #0009" }}
                />
              ) : (
                <video
                  src={media[lightboxIndex].url}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-[90vw] object-contain bg-black rounded shadow-lg"
                  style={{ boxShadow: "0 4px 32px #0009" }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
