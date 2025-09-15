'use client'
import { useState } from 'react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/"; // or window.location.reload()
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 max-w-md mx-auto bg-white shadow rounded"
    >
      <h1 className="text-xl font-bold mb-4">🔒 Private Login</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Login
      </button>
    </form>
  )
}
