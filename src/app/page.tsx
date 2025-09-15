"use client";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";
import MusicPlayer from "@/components/MusicPlayer";
import GalleryModal from "@/components/GalleryModal";
import PhotoSlideshow from "@/components/PhotoSlideshow"; // adjust path if needed

export default function AppHome() {
  const [showGallery, setShowGallery] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-100 dark:from-[#181925] dark:to-[#1e2746] transition-all">
        <MusicPlayer
          onOpenGallery={() => setShowGallery(true)}
          onOpenSlideshow={() => setShowSlideshow(true)}
        />

        {/* Gallery Modal */}
        {showGallery && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade">
            <div className="relative max-w-5xl w-full
              rounded-2xl bg-white/30 dark:bg-gray-900/90
              backdrop-blur-xl border border-white/30 dark:border-gray-700
              shadow-2xl ring-2 ring-pink-400/30
              transition-all">
              <GalleryModal onClose={() => setShowGallery(false)} />
            </div>
          </div>
        )}

        {/* PhotoSlideshow Modal */}
        {showSlideshow && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade">
            <div className="relative max-w-3xl w-full p-7
              bg-white/30 dark:bg-gray-900/90
              rounded-2xl backdrop-blur-xl
              border border-white/30 dark:border-gray-700 shadow-2xl ring-2 ring-blue-400/30">
              <button
                className="absolute top-5 right-6 px-4 py-2 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-400
                  text-white rounded-full shadow-[0_0_10px_#24eaff99] hover:scale-110 border border-white/20 transition"
                onClick={() => setShowSlideshow(false)}
              >
                Close ✕
              </button>
              <PhotoSlideshow />
            </div>
          </div>
        )}
        <style>{`
          .animate-fade { animation: fadeIn .24s; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    </AuthGuard>
  );
}
