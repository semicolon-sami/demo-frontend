"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Song = {
  name: string;
  url: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      // 1. List all files in the bucket
      const { data: files, error } = await supabase.storage
        .from("songs")
        .list("", { limit: 100 });

      if (error) {
        console.error("List error:", error);
        setLoading(false);
        return;
      }

      if (!files || files.length === 0) {
        console.log("No files found in Supabase bucket");
        setLoading(false);
        return;
      }

      // 2. Get signed URLs for each file
      const signedSongs: Song[] = await Promise.all(
        files.map(async (file) => {
          const { data } = await supabase.storage
            .from("songs")
            .createSignedUrl(file.name, 60 * 60); // valid 1h

          return { name: file.name, url: data?.signedUrl || "" };
        })
      );

      setSongs(signedSongs);
      setLoading(false);
    }

    fetchSongs();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">🎵 My Private Songs</h1>

      {loading && <p>Loading songs...</p>}

      {!loading && songs.length === 0 && <p>No songs found.</p>}

      <ul className="space-y-4 w-full max-w-md">
        {songs.map((song) => (
          <li key={song.name} className="flex flex-col items-center">
            <p className="mb-2">{song.name}</p>
            <audio controls src={song.url} className="w-full" />
          </li>
        ))}
      </ul>
    </main>
  );
}
