"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Song = { name: string; path: string; url: string };

export default function MusicPlayer() {
  const [folder, setFolder] = useState<string>(""); // '' = root/all, 'recent', 'old', 'favorites'
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    refreshAll();
    // refresh when folder changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  // fetch songs (supports folder and favorites view)
  async function fetchSongs() {
    setLoading(true);
    try {
      if (folder === "favorites") {
        // load favorite paths from table
        const { data: favRows, error: favErr } = await supabase.from("favorites").select("song_path");
        if (favErr) throw favErr;
        const paths: string[] = (favRows || []).map((r: any) => r.song_path);
        const signed = await Promise.all(
          paths.map(async (path) => {
            const { data } = await supabase.storage.from("songs").createSignedUrl(path, 60 * 60 * 24);
            return { name: path.split("/").pop() || path, path, url: data?.signedUrl || "" };
          })
        );
        setSongs(signed.filter((s) => s.url));
      } else {
        const listPath = folder || "";
        const { data: files, error } = await supabase.storage.from("songs").list(listPath, { limit: 100 });
        if (error) throw error;
        const signed = await Promise.all(
          files.map(async (f) => {
            const path = listPath ? `${listPath}/${f.name}` : f.name;
            const { data } = await supabase.storage.from("songs").createSignedUrl(path, 60 * 60 * 24);
            return { name: f.name, path, url: data?.signedUrl || "" };
          })
        );
        setSongs(signed.filter((s) => s.url));
      }
    } catch (err) {
      console.error("fetchSongs error", err);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFavorites() {
    try {
      const { data } = await supabase.from("favorites").select("song_path");
      setFavorites((data || []).map((d: any) => d.song_path));
    } catch (err) {
      console.error("fetchFavorites", err);
      setFavorites([]);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchSongs(), fetchFavorites()]);
  }

  // play controls
  function playIndex(i: number) {
    if (i < 0 || i >= songs.length) return;
    setCurrentIndex(i);
    const track = songs[i];
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => {});
    }
    // update media session metadata
    updateMediaSession(track, i);
  }

  function playNext() {
    if (!songs.length) return;
    const next = currentIndex === null ? 0 : (currentIndex + 1) % songs.length;
    playIndex(next);
  }

  function playPrev() {
    if (!songs.length) return;
    const prev = currentIndex === null ? 0 : (currentIndex - 1 + songs.length) % songs.length;
    playIndex(prev);
  }

  // upload
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dest = folder && folder !== "favorites" ? `${folder}/${file.name}` : file.name;
      const { error } = await supabase.storage.from("songs").upload(dest, file, { upsert: true });
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

  // delete
  async function handleDelete(i: number) {
    const song = songs[i];
    if (!song) return;
    if (!confirm(`Delete "${song.name}"?`)) return;
    try {
      const { error } = await supabase.storage.from("songs").remove([song.path]);
      if (error) throw error;
      // remove from favorites table too
      await supabase.from("favorites").delete().eq("song_path", song.path);
      // stop playing if it was current
      if (currentIndex === i) {
        audioRef.current?.pause();
        setCurrentIndex(null);
      }
      await refreshAll();
    } catch (err) {
      console.error("delete error", err);
      alert("Delete failed");
    }
  }

  // favorites toggle
  async function handleToggleFavorite(i: number) {
    const s = songs[i];
    if (!s) return;
    try {
      if (favorites.includes(s.path)) {
        await supabase.from("favorites").delete().eq("song_path", s.path);
      } else {
        await supabase.from("favorites").insert({ song_path: s.path, song_name: s.name });
      }
      await fetchFavorites();
    } catch (err) {
      console.error("fav error", err);
    }
  }

  // Media Session API
  function updateMediaSession(track: Song, index: number) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: "My Private Songs",
      album: folder || "Playlist",
      artwork: [{ src: "/music-icon.png", sizes: "512x512", type: "image/png" }],
    });

    try {
      navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler("previoustrack", playPrev);
      navigator.mediaSession.setActionHandler("nexttrack", playNext);
    } catch (err) {
      // some browsers may throw on unsupported handlers
    }
  }

  // set media session when currentIndex changes
  useEffect(() => {
    if (currentIndex !== null && songs[currentIndex]) {
      updateMediaSession(songs[currentIndex], currentIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🎵 My Private Songs</h1>
            <p className="text-sm text-gray-600">One-player, background play, favorites & upload</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="border p-1 rounded"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              <option value="">All / Root</option>
              <option value="recent">Recent</option>
              <option value="old">Old</option>
              <option value="favorites">Favorites</option>
            </select>

            <label className="bg-white border px-3 py-1 rounded cursor-pointer">
              {uploading ? "Uploading…" : "Add song"}
              <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
            </label>

            <button onClick={() => refreshAll()} className="px-3 py-1 border rounded">Refresh</button>
            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                // force reload to show login
                window.location.reload();
              }}
              className="px-3 py-1 border rounded"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Player controls */}
        <div className="mb-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Now playing</div>
                <div className="font-medium">
                  {currentIndex !== null ? songs[currentIndex]?.name ?? "—" : "No track selected"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={playPrev} className="px-3 py-1 border rounded">Prev</button>
                <button
                  onClick={() => {
                    if (currentIndex === null && songs.length) playIndex(0);
                    else if (audioRef.current) {
                      if (audioRef.current.paused) audioRef.current.play().catch(()=>{});
                      else audioRef.current.pause();
                    }
                  }}
                  className="px-3 py-1 border rounded"
                >
                  Play/Pause
                </button>
                <button onClick={playNext} className="px-3 py-1 border rounded">Next</button>
              </div>
            </div>
            {/* Hidden/visible audio element with safe src (avoid empty string) */}
            <div className="mt-3">
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={currentIndex !== null ? songs[currentIndex]?.url : undefined}
                onEnded={playNext}
              />
            </div>
          </div>
        </div>

        {/* Song list */}
        <div>
          {loading ? (
            <p>Loading songs…</p>
          ) : songs.length === 0 ? (
            <p>No songs found.</p>
          ) : (
            <ul className="space-y-3">
              {songs.map((s, i) => (
                <li key={s.path} className="bg-white p-3 rounded shadow flex items-center justify-between">
                  <div className="truncate max-w-xs">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate">{s.path}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => playIndex(i)} className="px-2 py-1 border rounded">Play</button>

                    <button
                      onClick={() => handleToggleFavorite(i)}
                      className={`px-2 py-1 rounded ${favorites.includes(s.path) ? "bg-yellow-400" : "bg-gray-200"}`}
                    >
                      ★
                    </button>

                    <button onClick={() => handleDelete(i)} className="px-2 py-1 border rounded text-red-600">Delete</button>
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
