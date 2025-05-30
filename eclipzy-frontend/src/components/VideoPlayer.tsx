'use client'

import React, { RefObject } from 'react'
import { FaPlay, FaPause } from 'react-icons/fa'


interface VideoPlayerProps {
  src: string
  videoRef: RefObject<HTMLVideoElement | null>  // <- allow null
  isPlaying: boolean
  togglePlayback: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, videoRef, isPlaying, togglePlayback }: VideoPlayerProps) => {
  return (
   <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] bg-black rounded-xl overflow-hidden shadow-lg">
      <video
        className="w-full h-full object-contain"
        ref={videoRef}
        src={`http://localhost:4000/video/${src.split('/').pop()}`}
        controls={false}
        disablePictureInPicture
       
        controlsList="nodownload"
      />
       <button
        onClick={togglePlayback}
        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition"
      >
        {isPlaying ? (
          <FaPause className="text-white text-4xl" />
        ) : (
          <FaPlay className="text-white text-4xl" />
        )}
      </button>
    </div>
  )
}

export default VideoPlayer
