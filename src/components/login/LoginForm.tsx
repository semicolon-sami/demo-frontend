"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff, FiUser, FiKey } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaTwitter } from "react-icons/fa6";
import Link from "next/link";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ loginInput: username, password }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for future social auth
  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    setTimeout(() => {
      setSocialLoading(null);
      alert(`Social login with ${provider} is coming soon!`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-300 via-purple-300 to-pink-200 dark:from-[#181925] dark:via-[#23253a] dark:to-[#3e2066] transition-all">
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-white bg-opacity-90 dark:bg-[#181925]/90 rounded-2xl shadow-2xl backdrop-blur border border-gray-200 dark:border-blue-900 p-8 sm:p-10 flex flex-col gap-5 animate-fade-in"
        autoComplete="off"
      >
        <div className="text-center mb-2">
          <div className="flex justify-center mb-2">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 via-pink-600 to-purple-600 shadow-lg">
              <FiKey className="text-3xl text-white" />
            </span>
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-pink-600 to-purple-600 text-transparent bg-clip-text mb-1">
            Welcome Back
          </h2>
          <p className="text-base text-gray-600 dark:text-blue-200 font-medium">
            Sign in to your private portal
          </p>
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 py-1 px-2 rounded text-sm text-center mb-2 shadow-sm">
            {error}
          </div>
        )}

        <div>
          <label className="sr-only" htmlFor="login-username">
            Username or Email
          </label>
          <div className="flex items-center gap-2 bg-white dark:bg-blue-950 border border-gray-200 dark:border-blue-800 rounded-md px-3 py-2 focus-within:ring-2 ring-blue-400 transition-all">
            <FiUser className="text-gray-400 dark:text-blue-400" />
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              placeholder="Username or Email"
              className="w-full bg-transparent outline-none text-gray-900 dark:text-blue-200 placeholder-gray-400 dark:placeholder-blue-400"
              value={username}
              disabled={loading}
              onChange={e => setUsername(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div>
          <label className="sr-only" htmlFor="login-password">
            Password
          </label>
          <div className="flex items-center gap-2 bg-white dark:bg-blue-950 border border-gray-200 dark:border-blue-800 rounded-md px-3 py-2 focus-within:ring-2 ring-pink-400 transition-all">
            <FiKey className="text-gray-400 dark:text-blue-400" />
            <input
              id="login-password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Password"
              className="w-full bg-transparent outline-none text-gray-900 dark:text-blue-200 placeholder-gray-400 dark:placeholder-blue-400"
              value={password}
              disabled={loading}
              minLength={4}
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
                <FiEyeOff className="text-xl text-gray-400 dark:text-blue-400" />
              ) : (
                <FiEye className="text-xl text-gray-400 dark:text-blue-400" />
              )}
            </button>
          </div>
        </div>

        <button
          disabled={!username || !password || loading || !!socialLoading}
          className="mt-2 flex items-center justify-center gap-2 px-4 py-2 w-full rounded-lg bg-gradient-to-r from-blue-600 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-95 transition-all duration-150 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
          type="submit"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Logging in...
            </>
          ) : (
            "Sign in"
          )}
        </button>

        {/* Social Buttons */}
        <div className="flex flex-col gap-2 mt-3">
          <button
            type="button"
            disabled={loading || !!socialLoading}
            onClick={() => handleSocialLogin("google")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 hover:border-blue-300 shadow-sm transition-all text-gray-600 dark:bg-blue-900 dark:text-blue-100 dark:hover:border-blue-500 font-semibold"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
            {socialLoading === "google" && (
              <svg className="animate-spin ml-2 h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            disabled={loading || !!socialLoading}
            onClick={() => handleSocialLogin("github")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-700 hover:to-gray-800 text-white font-semibold border-none transition-all"
          >
            <FaGithub className="text-xl" />
            Continue with GitHub
            {socialLoading === "github" && (
              <svg className="animate-spin ml-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            disabled={loading || !!socialLoading}
            onClick={() => handleSocialLogin("twitter")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-semibold border-none transition-all"
          >
            <FaTwitter className="text-lg" />
            Continue with Twitter
            {socialLoading === "twitter" && (
              <svg className="animate-spin ml-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper links */}
        <div className="flex justify-between items-center pt-3 text-sm">
          <Link href="/forgot-password" className="text-blue-500 hover:underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-purple-500 hover:underline font-semibold">
            Sign up
          </Link>
        </div>

        <div className="pt-4 text-gray-500 text-center text-xs">
          <span>
            Security first – All data is private to you.
          </span>
        </div>
      </form>

      {/* Optional: Glassmorphism floating visual */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-10 right-10 h-40 w-40 bg-gradient-to-tr from-blue-400/30 to-pink-400/20 blur-3xl rounded-full opacity-70 animate-float"></div>
      </div>
      <style jsx global>{`
        @keyframes animate-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.07); }
        }
        .animate-float {
          animation: animate-float 7s ease-in-out infinite alternate;
        }
        .animate-fade-in {
          animation: fadeIn .8s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px);}
          to   { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}
