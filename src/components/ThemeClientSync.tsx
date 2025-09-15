"use client";
import React from "react";

export default function ThemeClientSync() {
  React.useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    let userPrefDark = false;
    if (stored) {
      userPrefDark = stored === "dark";
    } else {
      userPrefDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    if (userPrefDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
