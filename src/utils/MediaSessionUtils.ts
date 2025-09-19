// utils/MediaSessionUtils.ts

import { Song } from "@/types/types";

/**
 * Sets up the Media Session API so OS/Mobile controls (lock screen, notifications, etc) control the player
 */
export function setupMediaSession(
  track: Song,
  playIndex: (i: number) => void,
  playPrev: () => void,
  playNext: () => void,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  currentIndex: number | null
) {
  if (!("mediaSession" in navigator)) return;
  // @ts-ignore: window.MediaMetadata might not be typed
  navigator.mediaSession.metadata = new window.MediaMetadata({
    title: track.name,
    artist: "My Private Songs",
    album: "Playlist",
    artwork: [
      { src: "/music-icon.png", sizes: "512x512", type: "image/png" }
    ]
  });
  try {
    navigator.mediaSession.setActionHandler("play", () => playIndex(currentIndex ?? 0));
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
  } catch {
    // Some browsers may throw if handlers already set.
  }
}
