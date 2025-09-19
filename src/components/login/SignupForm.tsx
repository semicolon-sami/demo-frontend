"use client";
import React, { useState } from "react";
import { FiUserPlus, FiMail, FiKey, FiEye, FiEyeOff } from "react-icons/fi";

export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Account created! You can now log in.");
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        setError(data.error || "Could not create account.");
      }
    } catch (err) {
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white dark:bg-blue-950 rounded-2xl border border-gray-200 dark:border-blue-800 p-8 flex flex-col gap-5 shadow-lg backdrop-blur"
      autoComplete="off"
    >
      <div className="flex items-center gap-2 mb-2">
        <FiUserPlus className="text-2xl text-purple-500" />
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-blue-100">
          Create an Account
        </h2>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 py-1 px-2 rounded text-sm text-center mb-2 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 py-1 px-2 rounded text-sm text-center mb-2 shadow-sm">
          {success}
        </div>
      )}
      <div>
        <label className="sr-only" htmlFor="signup-username">
          Username
        </label>
        <div className="flex items-center gap-2 border border-gray-200 dark:border-blue-800 rounded-md px-3 py-2">
          <FiUserPlus className="text-lg text-gray-400 dark:text-blue-400" />
          <input
            id="signup-username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            disabled={loading}
            placeholder="Username"
            className="w-full bg-transparent outline-none text-gray-800 dark:text-blue-100"
            value={username}
            onChange={e => setUsername(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
      <div>
        <label className="sr-only" htmlFor="signup-email">
          Email
        </label>
        <div className="flex items-center gap-2 border border-gray-200 dark:border-blue-800 rounded-md px-3 py-2">
          <FiMail className="text-lg text-gray-400 dark:text-blue-400" />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            placeholder="Email"
            className="w-full bg-transparent outline-none text-gray-800 dark:text-blue-100"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="sr-only" htmlFor="signup-password">
          Password
        </label>
        <div className="flex items-center gap-2 border border-gray-200 dark:border-blue-800 rounded-md px-3 py-2">
          <FiKey className="text-lg text-gray-400 dark:text-blue-400" />
          <input
            id="signup-password"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            disabled={loading}
            placeholder="Password"
            className="w-full bg-transparent outline-none text-gray-800 dark:text-blue-100"
            value={password}
            onChange={e => setPassword(e.target.value)}
            spellCheck={false}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={loading}
            onClick={() => setShowPwd((v) => !v)}
            className="ml-1 focus:outline-none"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? (
              <FiEyeOff className="text-lg text-gray-400 dark:text-blue-400" />
            ) : (
              <FiEye className="text-lg text-gray-400 dark:text-blue-400" />
            )}
          </button>
        </div>
      </div>
      <button
        disabled={!username || !email || !password || loading}
        className="mt-2 flex items-center justify-center gap-2 px-4 py-2 w-full rounded-lg bg-gradient-to-r from-blue-600 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all disabled:from-gray-400 disabled:to-gray-300"
        type="submit"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          "Sign up"
        )}
      </button>
      <div className="text-center text-gray-500 text-xs pt-2">
        Already have an account? <a className="text-blue-500 hover:underline" href="/login">Log in</a>
      </div>
    </form>
  );
}
