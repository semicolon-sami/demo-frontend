"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

const MENU_ITEMS = [
  {
    label: "Diary",
    icon: "📔",
    href: "/diary",
  },
  {
    label: "New",
    icon: "➕",
    href: "/diary/new",
  },
  {
    label: "Search",
    icon: "🔍",
    href: "/diary#search", // Could scroll to search bar
  },
  {
    label: "Profile",
    icon: "👤",
    href: "/diary#profile", // Show profile in diary main or open a modal
  },
];

export default function DiaryMobileMenu() {
  const router = useRouter();
  const pathname = usePathname();

  // Only show on small screens (using tailwind responsive classes)
  return (
    <nav className="fixed bottom-0 w-full block md:hidden z-30 shadow-lg bg-white dark:bg-gray-900 border-t border-blue-100 dark:border-blue-900">
      <div className="flex justify-around items-center h-16">
        {MENU_ITEMS.map((item) => {
          const isActive =
            item.href === pathname ||
            (item.href === "/diary" && pathname?.startsWith("/diary"));
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center text-xs py-1 px-2 transition font-medium ${
                isActive
                  ? "text-blue-600 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-800"
              }`}
              aria-label={item.label}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
