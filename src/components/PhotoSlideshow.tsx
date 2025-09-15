"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Photo = { name: string; path: string; url: string };

export default function PhotoSlideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos]);

  if (loading)
    return (
      <div className="flex items-center justify-center w-full h-72">
        <div className="animate-pulse rounded-2xl bg-white/30 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl w-96 h-64 flex items-center justify-center">
          <span className="text-lg text-gray-600 dark:text-gray-300">Loading photos…</span>
        </div>
      </div>
    );
  if (!photos.length)
    return (
      <div className="flex items-center justify-center w-full h-72">
        <div className="rounded-2xl bg-white/30 dark:bg-gray-900/70 backdrop-blur-xl shadow-xl w-96 h-64 flex items-center justify-center">
          <span className="text-lg text-gray-600 dark:text-gray-300">No photos found</span>
        </div>
      </div>
    );

  const currentPhoto = photos[index];

  // Animation variants with valid transition for Framer Motion
  const variants = {
    enter: { opacity: 0, scale: 0.96, x: 80 },
    center: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, scale: 0.95, x: -80, transition: { duration: 0.4 } }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-12">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.url}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="rounded-3xl bg-white/30 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/20 dark:border-gray-700 shadow-2xl ring-2 ring-pink-400/30 flex items-center justify-center h-64 transition-all"
            style={{ overflow: "hidden" }}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.name || "photo"}
              className="w-full h-64 object-cover rounded-3xl border border-white/30"
              loading="lazy"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
        {/* Neon accent: Floating caption bar */}
        <div className="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none">
          <span className="px-4 py-1 rounded-full font-mono text-xs font-semibold bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 text-white shadow-[0_0_12px_#24eaff99] border border-white/20">
            {currentPhoto.name}
          </span>
        </div>
      </div>
      {/* Slide counter with soft glass and neon */}
      <p className="text-center mt-4 text-sm font-semibold text-blue-700 dark:text-blue-200">
        <span className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg px-5 py-1 rounded-full shadow border border-blue-400/20">
          {index + 1} / {photos.length}
        </span>
      </p>
    </div>
  );
}
