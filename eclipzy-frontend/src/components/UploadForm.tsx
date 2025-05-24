'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

//   useEffect(() => {
//     const socket = new WebSocket('ws://localhost:4000')
//     socketRef.current = socket

//     socket.onmessage = (event) => {
//       const { type, progress, filePath } = JSON.parse(event.data)
//     console.log(progress);
//       if (type === 'progress') {
//         setProgress(progress)
//       } else if (type === 'done') {
//         setProgress(100)
//         setMessage(`Download complete! File: ${filePath}`)
//       }
//     }

//     socket.onerror = () => setMessage('WebSocket error occurred')
//     socket.onclose = () => console.log('WebSocket closed')

//     return () => socket.close()
//   }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setProgress(0)

    if (youtubeUrl) {
      const token = await supabase.auth.getSession()

       // ✅ Open WebSocket AFTER user submits
    const socket = new WebSocket('ws://localhost:4000')

    socket.onmessage = (event) => {
      const { type, progress, filePath } = JSON.parse(event.data)

      if (type === 'progress') {
        setProgress(progress)
      } else if (type === 'done') {
        setProgress(100)
        setMessage(`Download complete! File: ${filePath}`)
        socket.close()
      }
    }

    socket.onerror = () => {
      setMessage('WebSocket error occurred')
      socket.close()
    }

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl, token }),
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await res.json()
      if (!res.ok) {
        setMessage(result.error || 'Download failed.')
      } else {
        setMessage(result.message || 'Done')
      }
    } else if (file) {
      setMessage('File selected — upload logic not wired yet.')
    } else {
      setMessage('Please upload a file or paste a YouTube link.')
    }

    setSubmitting(false)
  }

  function extractVideoId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]{11})/
    )
    return match ? match[1] : null
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/10 border border-white/20 p-8 rounded-xl w-full max-w-md text-white"
    >
      <h2 className="text-2xl font-bold text-eclipse mb-4">Upload or Link</h2>

      <input
        type="file"
        accept="video/mp4"
        className="block w-full mb-4"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div className="text-center mb-4">or</div>

      <input
        type="url"
        placeholder="Paste a YouTube link"
        className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/60"
        value={youtubeUrl}
        onChange={async (e) => {
            const value = e.target.value
            setYoutubeUrl(value)
          
            const id = extractVideoId(value)
            setVideoId(id)
            setVideoTitle(null)
          
            if (id) {
              try {
                const res = await fetch(
                  `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
                )
                if (res.ok) {
                  const data = await res.json()
                  setVideoTitle(data.title)
                }
              } catch (err) {
                console.error('Failed to fetch video title')
              }
            }
          }}
      />
      {videoId && (
  <div className="mt-4">
     {videoTitle && (
      <p className="mt-2 text-white text-center text-sm font-semibold">
        {videoTitle}
      </p>
    )}
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt="Video thumbnail"
      className="w-full rounded-lg border border-white/20"
    />
   
  </div>
)}
     

{progress > 0 && (
  <div className="relative mt-4 w-full bg-white/20 rounded h-6 overflow-hidden">
    <div
      className="bg-green-500 h-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    ></div>
    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
      {Math.round(progress)}%
    </span>
  </div>
)}

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-6 bg-eclipse text-dark font-bold py-2 rounded hover:brightness-90"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>

      {message && <p className="text-sm mt-4 text-center">{message}</p>}
    </form>
  )
}
