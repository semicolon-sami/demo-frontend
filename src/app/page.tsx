"use client";
import { useState } from "react";
import MusicPlayer from "@/components/MusicPlayer";
import GalleryModal from "@/components/GalleryModal";
import PhotoSlideshow from "@/components/PhotoSlideshow"; // adjust path if needed

export default function AppHome() {
  const [showGallery, setShowGallery] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);

  return (
    <div>
      <MusicPlayer
        onOpenGallery={() => setShowGallery(true)}
        onOpenSlideshow={() => setShowSlideshow(true)}
      />
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full">
            <GalleryModal onClose={() => setShowGallery(false)} />
          </div>
        </div>
      )}
      {/* PhotoSlideshow Modal */}
      {showSlideshow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6">
            <button
              className="absolute top-3 right-4 px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => setShowSlideshow(false)}
            >
              Close ✕
            </button>
            <PhotoSlideshow />
          </div>
        </div>
      )}
    </div>
  );
}
