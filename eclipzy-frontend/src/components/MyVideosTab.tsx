'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface MyVideosTabProps {
  user: User
}

export default function MyVideosTab({ user }: MyVideosTabProps) {
  const [videos, setVideos] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const videosPerPage = 6

  useEffect(() => {
    fetchVideos()
  }, [currentPage])

  const fetchVideos = async () => {
    const from = (currentPage - 1) * videosPerPage
    const to = from + videosPerPage - 1
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .range(from, to)
      .order('created_at', { ascending: false })
    console.log(data, error, user.id);
    if (!error && data) {
      setVideos(data)
    }
  }

  return (
    <div className="space-y-6">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg shadow-md"
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtube_url?.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`}
            alt="Thumbnail"
            className="w-32 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white/90 truncate">
              {video.title || 'Untitled Video'}
            </h3>
            <p className="text-sm text-white/60">Length: {video.duration || 'Unknown'}</p>
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
        >
          Previous
        </button>
        <span className="text-sm text-white/50">Page {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}
