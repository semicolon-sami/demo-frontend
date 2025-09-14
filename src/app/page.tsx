"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    // Use environment variable for backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-2xl shadow-lg text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Demo Website Health Check 🚀
        </h1>
        <p className="text-lg text-gray-600">
          Frontend + Backend + Deployment status
        </p>
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg text-gray-700">
          {backendMessage}
        </div>
      </div>
    </main>
  );
}
