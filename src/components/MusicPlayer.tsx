"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Song {
  name: string;
  url: string;
}

export default function MusicPlayer({ initialSongs }: { initialSongs: Song[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // ---------------- PLAYBACK ----------------
  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    if (audioRef.current) {
      audioRef.current.src = songs[index].url;
      audioRef.current.play();
    }
  };

  const playNext = () => {
    if (currentSongIndex === null) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
  };

  const playPrev = () => {
    if (currentSongIndex === null) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
  };

  // ---------------- FAVORITES ----------------
  const toggleFavorite = async (song: Song) => {
    if (favorites.includes(song.name)) {
      await supabase.from("favorites").delete().eq("song_name", song.name);
      setFavorites(favorites.filter((f) => f !== song.name));
    } else {
      await supabase.from("favorites").insert({ song_name: song.name });
      setFavorites([...favorites, song.name]);
    }
  };

  const fetchFavorites = async () => {
    const { data } = await supabase.from("favorites").select("song_name");
    if (data) {
      setFavorites(data.map((d) => d.song_name));
    }
  };

  // ---------------- UPLOAD ----------------
  const uploadSong = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploading(true);

    const { error } = await supabase.storage
      .from("songs")
      .upload(file.name, file, { upsert: true });

    setUploading(false);

    if (!error) {
      refreshSongs();
    } else {
      console.error(error);
    }
  };

  // ---------------- DELETE ----------------
  const deleteSong = async (song: Song) => {
    await supabase.storage.from("songs").remove([song.name]);
    await supabase.from("favorites").delete().eq("song_name", song.name);
    refreshSongs();
  };

  // ---------------- FETCH SONGS ----------------
  const refreshSongs = async () => {
    const { data, error } = await supabase.storage.from("songs").list("", {
      limit: 100,
      offset: 0,
    });

    if (error) return console.error(error);

    const signedUrls = await Promise.all(
      data.map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from("songs")
          .createSignedUrl(file.name, 60 * 60);
        return { name: file.name, url: urlData?.signedUrl || "" };
      })
    );

    setSongs(signedUrls);
  };

  // ---------------- MEDIA SESSION API ----------------
  useEffect(() => {
    if ("mediaSession" in navigator && currentSongIndex !== null) {
      const song = songs[currentSongIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name,
        artist: "My Private Songs",
        album: "Playlist",
        artwork: [
          { src: "/music-icon.png", sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () =>
        audioRef.current?.play()
      );
      navigator.mediaSession.setActionHandler("pause", () =>
        audioRef.current?.pause()
      );
      navigator.mediaSession.setActionHandler("previoustrack", playPrev);
      navigator.mediaSession.setActionHandler("nexttrack", playNext);
    }
  }, [currentSongIndex, songs]);

  // ---------------- INIT ----------------
  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🎵 My Private Songs</h1>

      {/* Upload */}
      <div className="mb-6">
        <input
          type="file"
          accept="audio/*"
          onChange={uploadSong}
          disabled={uploading}
          className="border p-2"
        />
        {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      </div>

      {/* Song List */}
      <ul className="space-y-4">
        {songs.map((s, i) => (
          <li
            key={s.url}
            className={`p-4 rounded-lg shadow flex items-center justify-between ${
              i === currentSongIndex ? "bg-purple-100" : "bg-white"
            }`}
          >
            <span>{s.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => playSong(i)}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                ▶ Play
              </button>
              <button
                onClick={() => toggleFavorite(s)}
                className={`px-3 py-1 rounded ${
                  favorites.includes(s.name)
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                ★ Fav
              </button>
              <button
                onClick={() => deleteSong(s)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                🗑 Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Global Player */}
      <audio
        ref={audioRef}
        controls
        autoPlay
        className="w-full mt-6"
        onEnded={playNext}
      />
    </div>
  );
}
