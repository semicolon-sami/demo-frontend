"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Photo = { name: string; path: string; url: string };

export default function PhotoSlideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch photos from Supabase
  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);
      const { data, error } = await supabase.storage.from("photos").list("", {
        limit: 100,
        offset: 0,
      });
      if (error || !data) {
        console.error("Failed to list photos:", error);
        setPhotos([]);
        setLoading(false);
        return;
      }

      // Get public URLs for each file with a name
      const photoObjs: Photo[] = data
        .filter(file => !!file.name && !file.name.endsWith("/"))
        .map(file => {
          const publicUrl = supabase.storage.from("photos").getPublicUrl(file.name)?.data?.publicUrl || "";
          return {
            name: file.name,
            path: file.id || file.name,
            url: publicUrl,
          };
        });

      setPhotos(photoObjs);
      setLoading(false);
    }
    loadPhotos();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos]);

  // If loading, show spinner/message
  if (loading)
    return <p className="text-center text-gray-500">Loading photos…</p>;

  if (!photos.length)
    return <p className="text-center text-gray-500">No photos found</p>;

  const currentPhoto = photos[index];

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <img
        src={currentPhoto.url}
        alt={currentPhoto.name || "photo"}
        className="w-full h-64 object-cover rounded shadow"
        loading="lazy"
      />
      <p className="text-center text-sm text-gray-500 mt-2">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
