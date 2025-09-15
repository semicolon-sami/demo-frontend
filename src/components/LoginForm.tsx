'use client'
import { useState } from 'react'

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        onLogin()
      } else {
        setError('Wrong password')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">🔒 Login</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full p-2 border rounded mb-3"
        />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'Logging in…' : 'Login'}
        </button>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </form>
    </div>
  )
}
