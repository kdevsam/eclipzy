'use client'

import React, { RefObject, useEffect, useState } from 'react'
import { FaPlay, FaPause } from 'react-icons/fa'

interface Word {
  start: number
  end: number
  word: string
}

interface Segment {
  start: number
  end: number
  text: string
  words?: Word[]
}

interface VideoPlayerProps {
  src: string
  videoRef: RefObject<HTMLVideoElement | null>
  isPlaying: boolean
  togglePlayback: () => void
  captionPosition?: 'Top' | 'Center' | 'Bottom'
  showCaptions: boolean
  captionFontSize?: number
  captionStyle?: 'Rapid' | 'Smart'
  captionHighlight?: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  videoRef,
  isPlaying,
  togglePlayback,
  captionPosition = 'Bottom',
  showCaptions = true,
  captionFontSize = 16,
  captionStyle = 'Rapid',
  captionHighlight = false,
}) => {
  const [segments, setSegments] = useState<Segment[]>([])
  const [currentCaption, setCurrentCaption] = useState<{
    phrase: string
    words: Word[]
    currentWord: string
  } | null>(null)

  useEffect(() => {
    const jsonPath = src.split('/').pop()?.replace('.mp4', '.json')
    if (!jsonPath) return

    fetch(`/api/transcript?file=${jsonPath}`)
      .then(res => res.json())
      .then(data => setSegments(data.segments || []))
      .catch(err => console.error('Failed to load transcript', err))
  }, [src])

  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video) return

      const currentTime = Math.round(video.currentTime * 1000) / 1000
      const words = segments.flatMap(seg => seg.words || [])

      if (captionStyle === 'Rapid') {
        const word = words.find(w => currentTime >= w.start && currentTime < w.end)
        if (word) {
          setCurrentCaption({
            phrase: word.word,
            words: [word],
            currentWord: word.word
          })
        }
      }

      if (captionStyle === 'Smart') {
        if (
          currentCaption &&
          currentTime >= currentCaption.words[0].start &&
          currentTime <= currentCaption.words[currentCaption.words.length - 1].end
        ) {
          const active = currentCaption.words.find(
            w => currentTime >= w.start && currentTime < w.end
          )
          setCurrentCaption(prev =>
            prev ? { ...prev, currentWord: active?.word.trim() || '' } : null
          )
          return
        }

        const idx = words.findIndex(w => currentTime >= w.start && currentTime < w.end)
        if (idx === -1) {
          setCurrentCaption(null)
          return
        }

        const buffer: Word[] = []
        let i = idx
        while (i < words.length && buffer.length < 4) {
          const w = words[i]
          buffer.push(w)
          const next = words[i + 1]
          if (!next || next.start - w.end > 0.5 || /[.?!]$/.test(w.word)) break
          i++
        }

        const phrase = buffer.map(w => w.word).join(' ').trim()
        const currentWord =
          buffer.find(w => currentTime >= w.start && currentTime < w.end)?.word.trim() || ''

        setCurrentCaption({
          phrase,
          words: buffer,
          currentWord
        })
      }
    }, 50)

    return () => clearInterval(interval)
  }, [segments, videoRef, captionStyle, currentCaption])

  const getCaptionClasses = () => {
    return {
      Top: 'top-4',
      Center: 'top-1/2 transform -translate-y-1/2',
      Bottom: 'bottom-8'
    }[captionPosition] || 'bottom-8'
  }

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

      {showCaptions && currentCaption && (
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 text-white font-semibold rounded-md px-2 py-1 ${getCaptionClasses()}`}
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: `${captionFontSize}px`,
            maxWidth: '90%',
            textAlign: 'center',
            textShadow: '2px 2px rgb(0, 0, 0)',
            lineHeight: 1.5
          }}
        >
          {currentCaption.words?.map((w, i) => {
            const normalize = (word: string) =>
              word.replace(/[.,!?]/g, '').replace(/\s/g, '').toLowerCase()

            const isActive =
              captionHighlight &&
              normalize(w.word) === normalize(currentCaption.currentWord)

            return (
              <span
                key={i}
                className={`transition-all duration-100 ${
                  isActive
                    ? 'text-yellow-400 font-bold'
                    : 'text-white/90'
                }`}
              >
                {w.word + ' '}
              </span>
            )
          })}
        </div>
      )}

      <button
        onClick={togglePlayback}
        className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition duration-200"
      >
        {isPlaying ? (
          <FaPause className="text-white/10 text-4xl" />
        ) : (
          <FaPlay className="text-white/80 text-4xl" />
        )}
      </button>
    </div>
  )
}

export default VideoPlayer
