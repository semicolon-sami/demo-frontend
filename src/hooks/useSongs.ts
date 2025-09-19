// hooks/useSongs.ts

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Song, FavoriteRow } from "@/types/types";

export function useSongs(initialFolder: string = "") {
  const [folder, setFolder] = useState<string>(initialFolder);
  const [folders, setFolders] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch available folders once
  const fetchFolders = useCallback(async () => {
    const { data } = await supabase.storage.from("songs").list("", { limit: 100 });
    const names = (data || [])
      .map(f => f.name)
      .filter(n => !!n && !n.includes("."));
    setFolders(["All/Root", ...names]);
  }, []);

  // Fetch favorites list
  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("song_path")
        .returns<FavoriteRow[]>();
      setFavorites((data || []).map(d => d.song_path));
    } catch (err) {
      setFavorites([]);
    }
  }, []);

  // Fetch songs for current folder or favorites
  const fetchSongs = useCallback(async () => {
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
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  // Upload a song to storage
  const uploadSong = useCallback(
    async (file: File) => {
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
        await fetchSongs();
      } finally {
        setUploading(false);
      }
    },
    [folder, fetchSongs]
  );

  // Delete a song from storage
  const deleteSong = useCallback(
    async (song: Song) => {
      try {
        await supabase.storage.from("songs").remove([song.path]);
        await supabase.from("favorites").delete().eq("song_path", song.path);
        await fetchSongs();
        await fetchFavorites();
      } catch {
        // Handle error if needed
      }
    },
    [fetchSongs, fetchFavorites]
  );

  // Refresh both songs and favorites
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchSongs(), fetchFavorites()]);
  }, [fetchSongs, fetchFavorites]);

  return {
    folder,
    setFolder,
    folders,
    fetchFolders,
    songs,
    favorites,
    loading,
    uploading,
    fetchSongs,
    fetchFavorites,
    uploadSong,
    deleteSong,
    refreshAll
  };
}
