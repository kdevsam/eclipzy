'use client'

import { useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import PlaybackTimeline from './PlaybackTimeline'
import { Video } from './TimelineEditor'
import EditorOptionsPanel from './EditorOptionsPanel'
import { EditorOptions } from './types'

interface Props {
  video: Video
  onBack: () => void
}

export default function FullEditorView({ video, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [options, setOptions] = useState<EditorOptions>({
    captions: true,
    captionPosition: 'Bottom',
    captionStyle: 'Rapid', // Default to "Rapid"
    portraitMode: true,
    captionFontSize: 21,
    captionHighlight: true
  
  })

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleOptionChange = (updated: Partial<EditorOptions>) => {
    setOptions((prev) => ({ ...prev, ...updated }))
  }

  const handleGenerate = async () => {
    console.log('Generate clicked with options:', options, video)
    const res = await fetch('/api/segment', {
        method: 'POST',
        body: JSON.stringify({ filePath:  video.file_path}),
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json();
      console.log(result);

  }

  return (
    <div className="flex w-full">
      <div className="flex-1 space-y-6 pr-8">
        {/* <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-sm bg-white/10 text-white px-4 py-1.5 rounded hover:bg-white/20"
          >
            Back to Videos
          </button>
        </div> */}

        <h2 className="text-2xl font-bold text-center justify-center">{video.title}</h2>

        <VideoPlayer
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          src={video.file_path}
          videoRef={videoRef}
          captionPosition={options.captionPosition}
          showCaptions={options.captions}
          captionFontSize={options.captionFontSize}
          captionStyle={options.captionStyle}
          captionHighlight={options.captionHighlight}
        />

        <PlaybackTimeline videoRef={videoRef} />
      </div>

      <EditorOptionsPanel
        options={options}
        onChange={handleOptionChange}
        onGenerate={handleGenerate}
        generating={false}
      />
    </div>
  )
}
