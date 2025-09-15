'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [songs, setSongs] = useState<{ name: string; url: string }[]>([])

  useEffect(() => {
    const fetchSongs = async () => {
      // list files
      const { data: files, error } = await supabase.storage.from('songs').list()
      if (error) {
        console.error(error)
        return
      }

      // generate signed URLs
      const urls = await Promise.all(
        files.map(async (file) => {
          const { data } = await supabase.storage
            .from('songs')
            .createSignedUrl(file.name, 60 * 60) // 1 hour
          return { name: file.name, url: data?.signedUrl || '' }
        })
      )

      setSongs(urls)
    }

    fetchSongs()
  }, [])

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎵 My Private Songs</h1>
      <ul className="space-y-6">
        {songs.map((song) => (
          <li key={song.name} className="border rounded-lg p-4 shadow">
            <p className="font-medium">{song.name}</p>
            <audio controls preload="none" className="w-full mt-2">
              <source src={song.url} type="audio/mpeg" />
            </audio>
          </li>
        ))}
      </ul>
    </main>
  )
}
