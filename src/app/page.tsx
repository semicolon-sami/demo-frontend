"use client";
import { useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";
import MusicPlayer from "@/components/MusicPlayer";

export default function Page() {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const j = await res.json();
        setAuth(Boolean(j.authenticated));
      } catch (err) {
        setAuth(false);
      }
    })();
  }, []);

  if (auth === null) return <div className="p-6">Checking auth…</div>;
  if (!auth) return <LoginForm onLogin={() => setAuth(true)} />;

  return <MusicPlayer />;
}
