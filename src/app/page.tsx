"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [backendMessage, setBackendMessage] = useState("Loading...");
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    // ✅ Health check
    fetch(backendUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setBackendMessage(`✅ Backend says: "${data.message}"`);
        } else {
          setBackendMessage("⚠️ Unexpected response from backend");
        }
      })
      .catch((err) => {
        console.error(err);
        setBackendMessage("❌ Could not connect to backend");
      });

    // ✅ Supabase DB test
    fetch(`${backendUrl}/test-db`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setProfiles(data.data);
        } else {
          console.error(data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-2xl shadow-lg text-center space-y-4 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800">
          Demo Website Health Check 🚀
        </h1>
        <p className="text-lg text-gray-600">
          Frontend + Backend + Supabase status
        </p>

        {/* Backend status */}
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg text-gray-700">
          {backendMessage}
        </div>

        {/* Supabase data */}
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg text-gray-700">
          <h2 className="text-xl font-semibold mb-2">Supabase Profiles Table</h2>
          {profiles.length > 0 ? (
            <ul className="list-disc list-inside text-left">
              {profiles.map((profile) => (
                <li key={profile.id}>
                  {profile.name} (id: {profile.id})
                </li>
              ))}
            </ul>
          ) : (
            <p>No profiles found or DB not connected.</p>
          )}
        </div>
      </div>
    </main>
  );
}
