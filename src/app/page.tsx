// src/app/page.tsx

"use client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-100 dark:from-gray-900 dark:to-blue-950 transition-all">
      <h1 className="mb-8 text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
        🎉 Welcome!
      </h1>
      <p className="mb-8 text-lg text-blue-700 dark:text-blue-200 font-medium">
        This is your private music, gallery, and diary portal. Choose what you want to do!
      </p>
      <div className="flex gap-8">
        <button
          className="px-8 py-3 rounded-full font-bold bg-blue-500 text-white shadow-lg text-lg hover:scale-105 transition"
          onClick={() => router.push("/music")}
        >
          Go to Music Player
        </button>
        <button
          className="px-8 py-3 rounded-full font-bold bg-pink-500 text-white shadow-lg text-lg hover:scale-105 transition"
          onClick={() => window.open("/gallery", "_blank")}
        >
          View Gallery (new tab)
        </button>
        {/* Example future navigation: */}
        <button
          className="px-8 py-3 rounded-full font-bold bg-purple-500 text-white shadow-lg text-lg hover:scale-105 transition"
          onClick={() => router.push("/biography")}
        >
          My Biography
        </button>
        <button
          className="px-8 py-3 rounded-full font-bold bg-green-500 text-white shadow-lg text-lg hover:scale-105 transition"
          onClick={() => router.push("/future-plans")}
        >
          Future Plans
        </button>
      </div>
    </main>
  );
}
