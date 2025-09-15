// src/components/AuthGuard.tsx
"use client";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = "/login";
      } else {
        setChecked(true);
      }
    }
    check();
  }, []);

  if (!checked) return null; // or a loading spinner

  return <>{children}</>;
}
