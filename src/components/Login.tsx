"use client";
import { useState } from "react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_APP_PASSWORD) {
      onLogin();
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-6 rounded-lg w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">🔒 Login</h2>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />
        <button
          type="submit"
          className="w-full bg-purple-600 text-white rounded p-2 hover:bg-purple-700"
        >
          Login
        </button>
        {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  );
}
