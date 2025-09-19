// hooks/useAudioPlayer.ts

import { useRef, useState, useCallback } from "react";
import { Song } from "@/types/types";

export function useAudioPlayer(songs: Song[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Shuffle helper
  const playIndex = useCallback((i: number) => {
    if (i < 0 || i >= songs.length) return;
    setCurrentIndex(i);
    setIsPlaying(true);
  }, [songs.length]);

  // Play next track
  const playNext = useCallback(() => {
    if (!songs.length) return;
    if (isShuffle) {
      let next;
      do {
        next = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && next === currentIndex);
      playIndex(next);
    } else {
      const next =
        currentIndex === null ? 0 : (currentIndex + 1) % songs.length;
      playIndex(next);
    }
  }, [songs, currentIndex, isShuffle, playIndex]);

  // Play previous track
  const playPrev = useCallback(() => {
    if (!songs.length) return;
    if (isShuffle) {
      let prev;
      do {
        prev = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && prev === currentIndex);
      playIndex(prev);
    } else {
      const prev =
        currentIndex === null
          ? songs.length - 1
          : (currentIndex - 1 + songs.length) % songs.length;
      playIndex(prev);
    }
  }, [songs, currentIndex, isShuffle, playIndex]);

  // Play/Pause toggling
  const handlePlayPause = useCallback(() => {
    if (currentIndex === null && songs.length) {
      playIndex(0);
    } else if (audioRef.current) {
      if (audioRef.current.paused) {
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [currentIndex, songs.length, playIndex]);

  // Track ended logic
  const handleEnded = useCallback(() => {
    if (isRepeat && currentIndex !== null) {
      playIndex(currentIndex);
    } else {
      playNext();
    }
  }, [isRepeat, currentIndex, playIndex, playNext]);

  return {
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
    handleEnded
  };
}
