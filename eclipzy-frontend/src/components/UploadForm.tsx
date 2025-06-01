'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [invalidUrl, setInvalidUrl] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close()
    }
  }, [])

  const handleYoutubeUrl = async (value: string) => {
    setYoutubeUrl(value)
    const id = extractVideoId(value)
    setVideoId(id)
    setVideoTitle(null)

    if (!id) {
      setInvalidUrl(true)
      return
    } else {
      setInvalidUrl(false)
    }

    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      )
      if (res.ok) {
        const data = await res.json()
        setVideoTitle(data.title)
      }
    } catch {
      console.warn('Could not fetch video title')
    }
  }

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&?/]{11})/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setProgress(0)
    setMessage('')

    const token = await supabase.auth.getSession()
    const socket = new WebSocket('ws://localhost:4000')
    socketRef.current = socket

    socket.onmessage = (event) => {
      const { type, progress, filePath } = JSON.parse(event.data)
      if (type === 'progress') {
        setProgress(progress)
      } else if (type === 'done') {
        setProgress(100)
        setMessage(`Download complete: ${filePath}`)
        socket.close()
      }
    }

    socket.onerror = () => {
      setMessage('WebSocket error occurred')
      socket.close()
    }

    if (youtubeUrl) {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl, token }),
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()
      setMessage(result?.message || 'Download complete.')
    } else if (file) {
      setMessage('File selected — upload logic not implemented yet.')
    } else {
      setMessage('Please upload a file or paste a link.')
    }

    setSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center h-[80vh] w-full max-w-3xl mx-auto text-white"
    >
      <div className="w-full max-w-xl space-y-6">
        <div className="relative bg-white/5 border border-white/20 rounded-2xl shadow-lg p-6">
          <input
            type="url"
            placeholder="Drop a video link"
            value={youtubeUrl}
            onChange={(e) => handleYoutubeUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60"
          />

          {invalidUrl && (
            <p className="text-red-500 text-sm mt-2 font-semibold">❌ Invalid YouTube link</p>
          )}

          {!videoId && (
            <div className="mt-4 border-2 border-dashed border-white/20 rounded-lg p-12 text-center bg-white/5">
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="text-purple-300 text-5xl mb-2">📁</div>
                <p className="text-white/80 font-semibold">Click to browse</p>
                <p className="text-white/50 text-sm mt-1">
                  or drag & drop — supported file types: video, audio
                </p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          {videoId && (
            <div className="mt-4 text-center">
              {videoTitle && <p className="mb-1 font-medium">{videoTitle}</p>}
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                className="w-full rounded-md border border-white/10"
              />
            </div>
          )}

          {progress > 0 && (
            <div className="relative mt-6 h-6 rounded-lg overflow-hidden bg-white/10">
              <div
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <div className="relative z-10 flex justify-center items-center h-full font-semibold text-sm">
                {progress}%
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || invalidUrl}
            className="mt-6 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Continue'}
          </button>

          {message && <p className="text-sm mt-4 text-center">{message}</p>}
        </div>
      </div>
    </form>
  )
}
