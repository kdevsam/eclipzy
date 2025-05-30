'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Video {
  id: string
  title: string
  file_path: string
  youtube_url?: string
  duration?: string
}

interface Props {
  onSelect: (video: Video) => void
  selectedVideoId: string | null
}

export default function VideoSelectionPanel({ onSelect, selectedVideoId }: Props) {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    const fetchVideos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        setVideos(data)
      }
    }

    fetchVideos()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select a Video</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((v) => {
          const videoId = v.youtube_url?.split('v=')[1]?.split('&')[0] || ''
          return (
            <div
              key={v.id}
              className={`bg-[#2a2a2a] border border-white/10 rounded-lg overflow-hidden shadow transition hover:brightness-110 cursor-pointer ${
                selectedVideoId === v.id ? 'ring-2 ring-[#eb5353]' : ''
              }`}
              onClick={() => onSelect(v)}
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Thumbnail"
                className="w-full h-32 object-cover"
              />
              <div className="p-4 space-y-1">
                <h3 className="text-white font-semibold truncate">{v.title || 'Untitled Video'}</h3>
                <p className="text-sm text-white/60">Duration: {v.duration || 'Unknown'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
