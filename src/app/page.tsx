"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Song = {
  name: string;
  url: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchSongs = async () => {
      // 1. List files in "songs" bucket
      const { data: files, error } = await supabase.storage.from("songs").list();
      if (error) {
        console.error("Error listing files:", error);
        return;
      }

      if (!files) return;

      // 2. For each file, generate signed URL
      const signedSongs: Song[] = await Promise.all(
        files.map(async (file) => {
          const { data: signedUrlData } = await supabase.storage
            .from("songs")
            .createSignedUrl(file.name, 60 * 60); // valid for 1 hr

          return {
            name: file.name,
            url: signedUrlData?.signedUrl || "",
          };
        })
      );

      setSongs(signedSongs);
    };

    fetchSongs();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🎵 My Private Songs</h1>
      {songs.length === 0 ? (
        <p>No songs found.</p>
      ) : (
        <ul className="space-y-4">
          {songs.map((song) => (
            <li key={song.name}>
              <p className="font-medium">{song.name}</p>
              <audio controls src={song.url} className="w-full mt-1" />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
