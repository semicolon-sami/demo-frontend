"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Pages that do NOT require authentication (lowercase paths)
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Allow access if on a public path
    if (PUBLIC_PATHS.includes(pathname?.toLowerCase() || "")) {
      setChecked(true);
      return;
    }
    // Otherwise, verify auth via API
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
  }, [pathname]);

  if (!checked) {
    // Show a loading spinner or skeleton page while checking auth
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-300 via-purple-300 to-pink-200 dark:from-[#181925] dark:via-[#23253a] dark:to-[#3e2066]">
        <svg className="animate-spin h-12 w-12 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
