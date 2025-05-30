'use client'

import { useEffect, useState, useRef } from 'react'

interface Props {
    videoRef: React.RefObject<HTMLVideoElement | null>  // <- allow null
}

export default function PlaybackTimeline({ videoRef }: Props) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const rangeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const update = () => setProgress(video.currentTime)
    const setDur = () => setDuration(video.duration)

    video.addEventListener('timeupdate', update)
    video.addEventListener('loadedmetadata', setDur)

    return () => {
      video.removeEventListener('timeupdate', update)
      video.removeEventListener('loadedmetadata', setDur)
    }
  }, [videoRef])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    setProgress(newTime)
  }

  return (
    <div className="w-full mt-4">
      <input
        ref={rangeRef}
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={progress}
        onChange={handleSeek}
        className="w-full accent-[#eb5353] h-2 rounded-lg bg-white/10 appearance-none cursor-pointer"
      />
      <div className="text-sm text-white/60 mt-1 text-right">
        {formatTime(progress)} / {formatTime(duration)}
      </div>
    </div>
  )
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}
