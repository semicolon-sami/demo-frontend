// src/app/music/page.tsx

"use client";
import AuthGuard from "@/components/login/AuthGuard";
import MusicPlayer from "@/components/MusicPlayer";

export default function MusicPage() {
  return (
    <AuthGuard>
      <MusicPlayer />
    </AuthGuard>
  );
}
