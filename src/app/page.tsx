"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [songs, setSongs] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const fetchSongs = async () => {
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

    if (isLoggedIn) fetchSongs();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return <MusicPlayer initialSongs={songs} />;
}
