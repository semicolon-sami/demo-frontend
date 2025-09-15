"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import exifr from "exifr";
import {
  Heart,
  HeartOff,
  Trash2,
  Download,
  Play,
  Pause,
  SkipForward,
  Loader2,
} from "lucide-react";

type MediaFile = {
  name: string;
  url: string;
  folder: string;
  type: "image" | "video";
};

type Favorite = {
  id: string;
  file_name: string;
};

export default function GalleryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all photos & videos
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("photos").list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.error("Error listing media:", error);
      setLoading(false);
      return;
    }

    const all: MediaFile[] = [];
    for (const folder of data || []) {
      if (folder.name.includes(".")) continue; // skip files in root
      const { data: filesInFolder } = await supabase.storage
        .from("photos")
        .list(folder.name, { limit: 100, sortBy: { column: "name", order: "asc" } });

      filesInFolder?.forEach((f) => {
        const url = supabase.storage.from("photos").getPublicUrl(`${folder.name}/${f.name}`).data.publicUrl;
        all.push({
          name: f.name,
          url,
          folder: folder.name,
          type: f.name.match(/\.(mp4|mov|avi|webm)$/i) ? "video" : "image",
        });
      });
    }
    setFiles(all);
    setLoading(false);
  }, []);

  // 🔹 Fetch favorites
  const fetchFavorites = useCallback(async () => {
    const { data, error } = await supabase.from("photo_favorites").select("file_name");
    if (!error && data) setFavorites(data.map((d) => d.file_name));
  }, []);

  // 🔹 Load metadata when selecting
  useEffect(() => {
    if (selected?.type === "image") {
      exifr.parse(selected.url).then(setMetadata).catch(() => setMetadata(null));
    } else {
      setMetadata(null);
    }
  }, [selected]);

  // 🔹 Initial fetch
  useEffect(() => {
    fetchMedia();
    fetchFavorites();

    // Realtime updates
    const channel = supabase
      .channel("photos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "photo_favorites" }, fetchFavorites)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMedia, fetchFavorites]);

  // 🔹 Slideshow auto-play
  useEffect(() => {
    if (!slideshow || !files.length) return;
    const idx = files.findIndex((f) => f.url === selected?.url);
    const timer = setTimeout(() => {
      const nextIdx = (idx + 1) % files.length;
      setSelected(files[nextIdx]);
    }, 4000);
    return () => clearTimeout(timer);
  }, [slideshow, selected, files]);

  // 🔹 Toggle favorite
  const toggleFavorite = async (file: MediaFile) => {
    if (favorites.includes(file.name)) {
      await supabase.from("photo_favorites").delete().eq("file_name", file.name);
    } else {
      await supabase.from("photo_favorites").insert({ file_name: file.name });
    }
    fetchFavorites();
  };

  // 🔹 Delete file
  const deleteFile = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    await supabase.storage.from("photos").remove([`${file.folder}/${file.name}`]);
    fetchMedia();
    if (selected?.name === file.name) setSelected(null);
  };

  // 🔹 Download file
  const downloadFile = (file: MediaFile) => {
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left: Grid */}
      <div className="w-2/3 overflow-y-auto p-4 grid grid-cols-3 gap-3">
        {loading && (
          <div className="col-span-3 text-center text-gray-500">
            <Loader2 className="animate-spin inline-block" /> Loading...
          </div>
        )}
        {files.map((file) => (
          <div
            key={file.url}
            className={`cursor-pointer rounded overflow-hidden shadow hover:ring-4 ${
              selected?.url === file.url ? "ring-blue-500" : ""
            }`}
            onClick={() => setSelected(file)}
          >
            {file.type === "image" ? (
              <img src={file.url} alt={file.name} className="object-cover w-full h-40" />
            ) : (
              <video src={file.url} className="object-cover w-full h-40" />
            )}
          </div>
        ))}
      </div>

      {/* Right: Detail view */}
      <div className="w-1/3 bg-white border-l p-4 flex flex-col">
        {!selected ? (
          <div className="text-gray-500 text-center my-auto">Select a photo or video</div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              {selected.type === "image" ? (
                <img src={selected.url} alt={selected.name} className="max-h-[60vh] object-contain" />
              ) : (
                <video src={selected.url} controls className="max-h-[60vh]" />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 justify-center">
              <button onClick={() => toggleFavorite(selected)}>
                {favorites.includes(selected.name) ? (
                  <Heart className="text-red-500" />
                ) : (
                  <HeartOff />
                )}
              </button>
              <button onClick={() => deleteFile(selected)}>
                <Trash2 className="text-gray-700" />
              </button>
              <button onClick={() => downloadFile(selected)}>
                <Download />
              </button>
              <button onClick={() => setSlideshow((s) => !s)}>
                {slideshow ? <Pause /> : <Play />}
              </button>
              <button
                onClick={() => {
                  const idx = files.findIndex((f) => f.url === selected.url);
                  const nextIdx = (idx + 1) % files.length;
                  setSelected(files[nextIdx]);
                }}
              >
                <SkipForward />
              </button>
            </div>

            {/* Metadata */}
            {metadata && (
              <div className="mt-4 text-sm text-gray-600 max-h-40 overflow-y-auto border-t pt-2">
                <p><strong>Date:</strong> {metadata.DateTimeOriginal?.toString() || "Unknown"}</p>
                <p><strong>Camera:</strong> {metadata.Make} {metadata.Model}</p>
                <p><strong>Resolution:</strong> {metadata.ExifImageWidth}x{metadata.ExifImageHeight}</p>
                {metadata.GPSLatitude && (
                  <p>
                    <strong>Location:</strong> {metadata.GPSLatitude}, {metadata.GPSLongitude}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
