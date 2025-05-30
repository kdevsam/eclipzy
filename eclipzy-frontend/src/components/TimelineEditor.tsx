'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import VideoSelectionPanel from './VideoSelectionPanel'
import FullEditorView from './FullEditorView'

export interface Video {
  id: string
  title: string
  file_path: string
  youtube_url?: string
  duration?: string
}

export default function TimelineEditor() {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    const fetchUserVideos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        setVideos(data)
      }
    }

    fetchUserVideos()
  }, [])

  return (
    <div className="flex h-full w-full">
      {!selectedVideo ? (
        <VideoSelectionPanel
  videos={videos}
  selectedVideo={selectedVideo}
  onSelect={(video) => setSelectedVideo(video)} // ✅ this is what was missing
/>
      ) : (
        <FullEditorView
          video={selectedVideo}
          onBack={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}
