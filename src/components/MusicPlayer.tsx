'use client'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Song = { name: string; path: string; url: string }

export default function MusicPlayer({ onLogout }: { onLogout: () => void }) {
  const [folder, setFolder] = useState('') // '' means root / All
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchSongs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder])

  async function fetchSongs() {
    setLoading(true)
    try {
      const { data: files, error } = await supabase.storage
        .from('songs')
        .list(folder || '', { limit: 500 })

      if (error) throw error
      if (!files) {
        setSongs([])
        setLoading(false)
        return
      }

      const signed = await Promise.all(
        files.map(async (f) => {
          const path = folder ? `${folder}/${f.name}` : f.name
          const { data } = await supabase.storage.from('songs').createSignedUrl(path, 60 * 60)
          return { name: f.name, path, url: data?.signedUrl || '' }
        })
      )

      setSongs(signed)
    } catch (err) {
      console.error('fetchSongs error', err)
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  function playIndex(i: number) {
    setCurrentIndex(i)
    const track = songs[i]
    if (audioRef.current && track) {
      audioRef.current.src = track.url
      audioRef.current.play().catch(() => {})
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = (folder ? `${folder}/${file.name}` : file.name).replaceAll('//', '/')
      const { error } = await supabase.storage.from('songs').upload(path, file, { upsert: true })
      if (error) throw error
      await fetchSongs()
      alert('Uploaded')
    } catch (err) {
      console.error(err)
      alert('Upload failed. Check storage policies.')
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  async function handleDelete(idx: number) {
    const name = songs[idx].name
    if (!confirm(`Delete ${name}?`)) return
    try {
      const { error } = await supabase.storage.from('songs').remove([songs[idx].path])
      if (error) throw error
      // If deleting current track, stop it
      if (currentIndex === idx) {
        audioRef.current?.pause()
        setCurrentIndex(null)
      }
      await fetchSongs()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  async function handleAddToFavorites(idx: number) {
    const item = songs[idx]
    const destPath = `favorites/${item.name}`
    try {
      // get temporary signed url & fetch file bytes
      const { data: sdata } = await supabase.storage.from('songs').createSignedUrl(item.path, 60 * 60)
      if (!sdata?.signedUrl) throw new Error('no signed url')
      const res = await fetch(sdata.signedUrl)
      const blob = await res.blob()
      const { error } = await supabase.storage.from('songs').upload(destPath, blob, { upsert: true })
      if (error) throw error
      alert('Added to favorites')
    } catch (err) {
      console.error(err)
      alert('Failed to add to favorites')
    }
  }

  async function handleMove(idx: number, destFolder: string) {
    if (!destFolder) return
    const item = songs[idx]
    const destPath = `${destFolder}/${item.name}`
    try {
      const { data: sdata } = await supabase.storage.from('songs').createSignedUrl(item.path, 60 * 60)
      if (!sdata?.signedUrl) throw new Error('no signed url')
      const res = await fetch(sdata.signedUrl)
      const blob = await res.blob()
      const { error: upErr } = await supabase.storage.from('songs').upload(destPath, blob, { upsert: true })
      if (upErr) throw upErr
      const { error: delErr } = await supabase.storage.from('songs').remove([item.path])
      if (delErr) throw delErr
      await fetchSongs()
      alert('Moved')
    } catch (err) {
      console.error(err)
      alert('Move failed')
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🎵 My Private Songs</h1>
          <div className="flex items-center gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="border p-1 rounded"
            >
              <option value="">All / Root</option>
              <option value="recent">Recent</option>
              <option value="old">Old</option>
              <option value="favorites">Favorites</option>
            </select>

            <label className="bg-white border px-3 py-1 rounded cursor-pointer">
              {uploading ? 'Uploading…' : 'Add song'}
              <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
            </label>

            <button onClick={fetchSongs} className="px-3 py-1 border rounded">Refresh</button>
            <button onClick={handleLogout} className="px-3 py-1 border rounded">Logout</button>
          </div>
        </div>

        <div className="mb-6">
          <audio ref={audioRef} controls className="w-full" />
          <div className="mt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                if (currentIndex !== null) {
                  const prev = Math.max(0, currentIndex - 1)
                  playIndex(prev)
                } else if (songs.length) playIndex(0)
              }}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>
            <button
              onClick={() => {
                if (currentIndex === null && songs.length) playIndex(0)
                else if (audioRef.current) {
                  if (audioRef.current.paused) audioRef.current.play().catch(() => {})
                  else audioRef.current.pause()
                }
              }}
              className="px-3 py-1 border rounded"
            >
              Play/Pause
            </button>
            <button
              onClick={() => {
                if (currentIndex !== null) {
                  const next = Math.min(songs.length - 1, currentIndex + 1)
                  playIndex(next)
                }
              }}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? <p>Loading…</p> : (
          <ul className="space-y-4">
            {songs.map((s, idx) => (
              <li key={s.path} className="p-4 bg-white rounded shadow flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => playIndex(idx)} className="px-2 py-1 border rounded">Play</button>
                    <button onClick={() => handleAddToFavorites(idx)} className="px-2 py-1 border rounded">Fav</button>

                    <select onChange={(e) => handleMove(idx, e.target.value)} defaultValue="">
                      <option value="">Move</option>
                      <option value="recent">Recent</option>
                      <option value="old">Old</option>
                      <option value="favorites">Favorites</option>
                    </select>

                    <button onClick={() => handleDelete(idx)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                  </div>
                </div>

                <audio controls src={s.url} className="w-full mt-2" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
