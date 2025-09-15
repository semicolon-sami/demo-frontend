"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import MiniPhotoPopup from "@/components/MiniPhotoPopup";
import DarkModeToggle from "@/components/DarkModeToggle";

type Song = { name: string; path: string; url: string };
type FavoriteRow = { song_path: string; song_name?: string };

type MusicPlayerProps = {
  onOpenGallery?: () => void;
  onOpenSlideshow?: () => void;
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MusicPlayer({
  onOpenGallery,
  onOpenSlideshow
}: MusicPlayerProps) {
  const [folder, setFolder] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showMiniPopup, setShowMiniPopup] = useState(true);

  // Playback features
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    async function getFolders() {
      const { data } = await supabase.storage.from("songs").list("", { limit: 100 });
      const names = (data || [])
        .map(f => f.name)
        .filter(n => !!n && !n.includes("."));
      setFolders(["All/Root", ...names]);
    }
    getFolders();
  }, []);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line
  }, [folder]);

  async function fetchSongs() {
    setLoading(true);
    try {
      let songList: Song[] = [];
      if (folder === "favorites") {
        const { data: favRows } = await supabase
          .from("favorites")
          .select("song_path")
          .returns<FavoriteRow[]>();
        const paths = (favRows || []).map(r => r.song_path);
        const signed = await Promise.all(
          paths.map(async path => {
            const { data } = await supabase.storage
              .from("songs")
              .createSignedUrl(path, 60 * 60 * 24);
            return {
              name: path.split("/").pop() || path,
              path,
              url: data?.signedUrl ?? ""
            };
          })
        );
        songList = signed.filter(s => s.url);
      } else {
        const listPath = folder && folder !== "All/Root" ? folder : "";
        const { data: files } = await supabase.storage
          .from("songs")
          .list(listPath, { limit: 100 });
        const signed = await Promise.all(
          (files || []).filter(f => f.name)
            .map(async (f) => {
              const path = listPath ? `${listPath}/${f.name}` : f.name;
              const { data } = await supabase.storage
                .from("songs")
                .createSignedUrl(path, 60 * 60 * 24);
              return { name: f.name, path, url: data?.signedUrl ?? "" };
            })
        );
        songList = signed.filter(s => s.url);
      }
      setSongs(songList);
    } catch (err) {
      console.error("fetchSongs error", err);
      setSongs([]);
    } finally {
      setLoading(false);
      setCurrentIndex(null);
      setIsPlaying(false);
    }
  }

  async function fetchFavorites() {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("song_path")
        .returns<FavoriteRow[]>();
      setFavorites((data || []).map((d) => d.song_path));
    } catch (err) {
      console.error("fetchFavorites", err);
      setFavorites([]);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchSongs(), fetchFavorites()]);
  }

  // When currentIndex changes, always play!
  useEffect(() => {
    if (
      currentIndex !== null &&
      songs[currentIndex] &&
      audioRef.current &&
      isPlaying
    ) {
      audioRef.current.src = songs[currentIndex].url;
      audioRef.current
        .play()
        .then(() => updateMediaSession(songs[currentIndex]))
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, [currentIndex, isPlaying]); // isPlaying needed in dep

  function playIndex(i: number) {
    if (i < 0 || i >= songs.length) return;
    setCurrentIndex(i);
    setIsPlaying(true);
  }

  function playNext() {
    if (!songs.length) return;
    if (isShuffle) {
      let next;
      do {
        next = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && next === currentIndex);
      playIndex(next);
    } else {
      const next =
        currentIndex === null ? 0 : (currentIndex + 1) % songs.length;
      playIndex(next);
    }
  }

  function playPrev() {
    if (!songs.length) return;
    if (isShuffle) {
      let prev;
      do {
        prev = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && prev === currentIndex);
      playIndex(prev);
    } else {
      const prev =
        currentIndex === null
          ? songs.length - 1
          : (currentIndex - 1 + songs.length) % songs.length;
      playIndex(prev);
    }
  }

  // Play/Pause toggling
  function handlePlayPause() {
    if (currentIndex === null && songs.length) {
      playIndex(0);
    } else if (audioRef.current) {
      if (audioRef.current.paused) {
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }

  function handleEnded() {
    if (isRepeat && currentIndex !== null) {
      playIndex(currentIndex);
    } else {
      playNext();
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dest =
        folder && folder !== "All/Root" && folder !== "favorites"
          ? `${folder}/${file.name}`
          : file.name;
      const { error } = await supabase.storage
        .from("songs")
        .upload(dest, file, { upsert: true });
      if (error) throw error;
      await refreshAll();
    } catch (err) {
      console.error("upload error", err);
      alert("Upload failed. Check storage policies.");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  async function handleDelete(i: number) {
    const song = songs[i];
    if (!song) return;
    if (!confirm(`Delete "${song.name}"?`)) return;
    try {
      const { error } = await supabase.storage.from("songs").remove([song.path]);
      if (error) throw error;
      await supabase.from("favorites").delete().eq("song_path", song.path);
      if (currentIndex === i) {
        audioRef.current?.pause();
        setCurrentIndex(null);
        setIsPlaying(false);
      }
      await refreshAll();
    } catch (err) {
      console.error("delete error", err);
      alert("Delete failed");
    }
  }

  async function handleToggleFavorite(i: number) {
    const s = songs[i];
    if (!s) return;
    try {
      if (favorites.includes(s.path)) {
        await supabase.from("favorites").delete().eq("song_path", s.path);
      } else {
        await supabase
          .from("favorites")
          .insert({ song_path: s.path, song_name: s.name });
      }
      await fetchFavorites();
    } catch (err) {
      console.error("fav error", err);
    }
  }

  function updateMediaSession(track: Song) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.name,
      artist: "My Private Songs",
      album: folder || "Playlist",
      artwork: [{ src: "/music-icon.png", sizes: "512x512", type: "image/png" }]
    });
    try {
      navigator.mediaSession.setActionHandler("play", () => playIndex(currentIndex ?? 0));
      navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler("previoustrack", playPrev);
      navigator.mediaSession.setActionHandler("nexttrack", playNext);
    } catch { }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-100 dark:from-[#181925] dark:to-[#1e2746] px-6 py-6 transition-all">
      {/* FLOATING MINI PHOTO POPUP */}
      {showMiniPopup && (
        <MiniPhotoPopup onClose={() => setShowMiniPopup(false)} />
      )}
      <div className="max-w-3xl mx-auto">
        {/* Header + folder picker */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 mb-2">
              🎵 My Private Songs
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Background play, one-player, favorites & upload
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border border-white/20 dark:border-gray-700 p-1 rounded-lg bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg shadow transition-all"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="favorites">Favorites</option>
            </select>
            <label className="bg-white/30 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700 px-3 py-1 rounded-lg cursor-pointer shadow transition-all backdrop-blur-lg text-blue-800 dark:text-blue-300">
              {uploading ? "Uploading…" : "Add song"}
              <input
                type="file"
                accept="audio/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
            <DarkModeToggle />
            <button
              onClick={refreshAll}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:bg-blue-300/30 dark:hover:bg-blue-700/40"
            >
              Refresh
            </button>
            <button
              onClick={() => window.open("/gallery", "_blank")}
              className="px-3 py-1 border rounded"
            >
              Gallery
            </button>
            <button
              onClick={onOpenSlideshow}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:bg-purple-200/40 dark:hover:bg-purple-500/30"
            >
              Slideshow Only
            </button>
            <button
              onClick={() => setShowMiniPopup(true)}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all"
              disabled={showMiniPopup}
            >
              {showMiniPopup ? "Popup On" : "Show Photos"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="px-3 py-1 rounded-lg bg-white/50 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow transition-all hover:bg-red-100/40 dark:hover:bg-red-300/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Playback mode buttons */}
        <div className="mb-3 flex gap-3 items-center">
          <button
            onClick={() => setIsShuffle(s => !s)}
            className={`px-4 py-1 rounded-lg border shadow ${
              isShuffle
                ? "bg-blue-500 text-white ring-2 ring-blue-400"
                : "bg-white/30 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200"
            }`}
            title={isShuffle ? "Shuffle mode ON" : "Shuffle mode OFF"}
          >
            {isShuffle ? "🔀 Shuffle On" : "🔀 Shuffle Off"}
          </button>
          <button
            onClick={() => setIsRepeat(r => !r)}
            className={`px-4 py-1 rounded-lg border shadow ${
              isRepeat
                ? "bg-pink-500 text-white ring-2 ring-pink-400"
                : "bg-white/30 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200"
            }`}
            title={isRepeat ? "Repeat mode ON" : "Repeat mode OFF"}
          >
            {isRepeat ? "🔁 Repeat On" : "🔁 Repeat Off"}
          </button>
        </div>

        {/* Player controls */}
        <div className="mb-4">
          <div className="bg-white/40 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700 transition-all">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Now playing</div>
                <div className="font-semibold truncate max-w-xs text-blue-700 dark:text-blue-300">
                  {currentIndex !== null && songs.length
                    ? songs[currentIndex]?.name ?? "—"
                    : "No track selected"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={playPrev}
                  className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-105"
                >
                  ⏮ Prev
                </button>
                <button
                  onClick={handlePlayPause}
                  className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-110"
                >
                  ⏯ Play/Pause
                </button>
                <button
                  onClick={playNext}
                  className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-105"
                >
                  Next ⏭
                </button>
              </div>
            </div>
            <div className="mt-3">
              <audio
                ref={audioRef}
                controls
                className="w-full bg-white/30 dark:bg-gray-800/40 rounded-lg border border-white/20 dark:border-gray-700 shadow"
                src={currentIndex !== null ? songs[currentIndex]?.url : undefined}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            </div>
          </div>
        </div>
        {/* Song list */}
        <div>
          {loading ? (
            <div className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 w-full h-32 mb-3" />
          ) : songs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 py-6 text-center">No songs found.</p>
          ) : (
            <ul className="space-y-3">
              {songs.map((s, i) => (
                <li
                  key={s.path}
                  className="bg-white/30 dark:bg-gray-900/70 backdrop-blur-lg p-3 rounded-xl shadow-xl flex items-center justify-between border border-white/20 dark:border-gray-700 transition-all"
                >
                  <div className="truncate max-w-xs">
                    <div className="font-bold truncate text-blue-700 dark:text-blue-300">{s.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.path}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playIndex(i)}
                      className="px-2 py-1 rounded-full bg-blue-100/70 dark:bg-blue-900/40 shadow hover:scale-105 transition-all border border-blue-200 dark:border-blue-800"
                    >
                      ▶ Play
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(i)}
                      className={`px-2 py-1 rounded-full font-bold shadow-lg transition-all border ${
                        favorites.includes(s.path)
                          ? "bg-yellow-400/80 text-yellow-800 dark:bg-yellow-300 dark:text-yellow-900 shadow-[0_0_12px_#ffd700]"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      }`}
                      title="Toggle Favorite"
                    >
                      ★
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="px-2 py-1 border rounded-full text-red-600 dark:text-red-300 bg-white/30 dark:bg-gray-900/60 shadow hover:bg-red-100/30 dark:hover:bg-red-300/30 transition-all"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
