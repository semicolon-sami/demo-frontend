// components/MusicPlayer.tsx

"use client";

import React, { useEffect } from "react";
import { useSongs } from "@/hooks/useSongs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { setupMediaSession } from "@/utils/MediaSessionUtils";
import SongList from "@/components/SongList";
import PlayerControls from "@/components/PlayerControls";
import FolderPicker from "@/components/FolderPicker";
import UploadButton from "@/components/UploadButton";
import MiniPhotoPopup from "@/components/MiniPhotoPopup";
import DarkModeToggle from "@/components/DarkModeToggle";

type MusicPlayerProps = {
  onOpenGallery?: () => void;
  onOpenSlideshow?: () => void;
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  onOpenGallery,
  onOpenSlideshow,
}) => {
  // Song/folder state management
  const {
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
    refreshAll,
  } = useSongs("");

  // Audio/Player state management
  const {
    audioRef,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
    playIndex,
    playNext,
    playPrev,
    handlePlayPause,
    handleEnded,
  } = useAudioPlayer(songs);

  // Mini popup photo
  const [showMiniPopup, setShowMiniPopup] = React.useState(true);

  // Initial fetch folders
  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line
  }, []);

  // Refresh songs & favorites when folder changes
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line
  }, [folder]);

  // Media session updates on song/track change or play
  useEffect(() => {
    if (
      currentIndex !== null &&
      songs[currentIndex] &&
      audioRef.current &&
      isPlaying
    ) {
      audioRef.current.src = songs[currentIndex].url;
      audioRef.current
        .play()
        .then(() => {
          setupMediaSession(
            songs[currentIndex],
            playIndex,
            playPrev,
            playNext,
            audioRef,
            currentIndex
          );
        })
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, [currentIndex, isPlaying]);

  // Handlers for UI actions
  const handleUpload = (file: File) => {
    uploadSong(file);
  };

  const handleDelete = (i: number) => {
    const song = songs[i];
    if (!song) return;
    if (!confirm(`Delete "${song.name}"?`)) return;
    deleteSong(song);
    if (currentIndex === i && audioRef.current) {
      audioRef.current.pause();
      setCurrentIndex(null);
      setIsPlaying(false);
    }
  };

  const handleToggleFavorite = async (i: number) => {
    const song = songs[i];
    if (!song) return;
    try {
      if (favorites.includes(song.path)) {
        await (await import("@/lib/supabase")).supabase
          .from("favorites")
          .delete()
          .eq("song_path", song.path);
      } else {
        await (await import("@/lib/supabase")).supabase
          .from("favorites")
          .insert({ song_path: song.path, song_name: song.name });
      }
      fetchFavorites();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-100 dark:from-[#181925] dark:to-[#1e2746] px-6 py-6 transition-all">
      {/* FLOATING MINI PHOTO POPUP */}
      {showMiniPopup && (
        <MiniPhotoPopup onClose={() => setShowMiniPopup(false)} />
      )}
      <div className="max-w-3xl mx-auto">
        {/* Header + folder picker row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 mb-2">
              🎵 My Private Songs
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Background play, one-player, favorites & upload
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FolderPicker
              folders={folders}
              currentFolder={folder}
              onChange={setFolder}
            />
            <UploadButton onUpload={handleUpload} uploading={uploading} />
            <DarkModeToggle />
            <button
              onClick={refreshAll}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:bg-blue-300/30 dark:hover:bg-blue-700/40"
            >
              Refresh
            </button>
            <button
              onClick={() =>
                onOpenGallery
                  ? onOpenGallery()
                  : window.open("/gallery", "_blank")
              }
              className="px-3 py-1 border rounded"
            >
              Gallery
            </button>
            <button
              onClick={onOpenSlideshow}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:bg-purple-200/40 dark:hover:bg-purple-500/30"
            >
              Slideshow Only
            </button>
            <button
              onClick={() => setShowMiniPopup(true)}
              className="px-3 py-1 rounded-lg bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all"
              disabled={showMiniPopup}
            >
              {showMiniPopup ? "Popup On" : "Show Photos"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="px-3 py-1 rounded-lg bg-white/50 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow transition-all hover:bg-red-100/40 dark:hover:bg-red-300/20"
            >
              Logout
            </button>
          </div>
        </div>

        <PlayerControls
          isShuffle={isShuffle}
          setIsShuffle={setIsShuffle}
          isRepeat={isRepeat}
          setIsRepeat={setIsRepeat}
          playPrev={playPrev}
          handlePlayPause={handlePlayPause}
          playNext={playNext}
        />

        {/* Player status and audio element */}
        <div className="mb-4">
          <div className="bg-white/40 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700 transition-all">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Now playing</div>
                <div className="font-semibold truncate max-w-xs text-blue-700 dark:text-blue-300">
                  {currentIndex !== null && songs.length
                    ? songs[currentIndex]?.name ?? "—"
                    : "No track selected"}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <audio
                ref={audioRef}
                controls
                className="w-full bg-white/30 dark:bg-gray-800/40 rounded-lg border border-white/20 dark:border-gray-700 shadow"
                src={
                  currentIndex !== null
                    ? songs[currentIndex]?.url
                    : undefined
                }
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            </div>
          </div>
        </div>

        {/* Song list */}
        <SongList
          songs={songs}
          favorites={favorites}
          loading={loading}
          onPlay={playIndex}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
