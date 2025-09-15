"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Photo = { name: string; path: string; url: string };

export default function PhotoSlideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);

  // Fetch photos from Supabase
  useEffect(() => {
  async function loadPhotos() {
    const { data, error } = await supabase.storage.from("photos").list("", {
      limit: 100,
      offset: 0,
    });

    if (error) {
      console.error(error);
      return;
    }

    const urls = data.map(file =>
      supabase.storage.from("photos").getPublicUrl(file.name).data.publicUrl
    );

    setPhotos(urls);
  }
  loadPhotos();
}, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!photos.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos]);

  if (!photos.length) return <p className="text-center text-gray-500">No photos found</p>;

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <img
        src={photos[index].url}
        alt={photos[index].name}
        className="w-full h-64 object-cover rounded shadow"
      />
      <p className="text-center text-sm text-gray-500 mt-2">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
