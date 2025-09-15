"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  // Initial value - check localStorage OR system preference
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // On mount, set state using localStorage OR system theme
    const stored = window.localStorage.getItem("theme");
    let userPrefDark = false;

    if (stored) {
      userPrefDark = stored === "dark";
    } else {
      // Check system preference
      userPrefDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    setDark(userPrefDark);
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setDark((v) => !v)}
      className={`ml-3 px-3 py-2 rounded-xl shadow bg-white/70 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-800 text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-700 transition`}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
