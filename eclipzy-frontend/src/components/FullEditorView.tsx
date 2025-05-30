'use client'

import { useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import PlaybackTimeline from './PlaybackTimeline'
import { Video } from './TimelineEditor'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

interface Props {
  video: Video
  onBack: () => void
}

export default function FullEditorView({ video, onBack }: Props) {
  const [options, setOptions] = useState({
    captions: true,
    captionPosition: 'bottom',
    captionStyle: 'default',
    portrait: false,
  })

  const [activePanel, setActivePanel] = useState<string | null>('Captions')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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

  const togglePanel = (panel: string) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  const handleOptionChange = (updated: Partial<typeof options>) => {
    setOptions((prev) => ({ ...prev, ...updated }))
  }

  return (
    <div className="flex space-x-6">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Editing: {video.title}</h2>
          <button
            onClick={onBack}
            className="text-sm bg-white/10 text-white px-4 py-1.5 rounded hover:bg-white/20"
          >
            Back to Videos
          </button>
        </div>

        <VideoPlayer
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          src={video.file_path}
          videoRef={videoRef}
        />

        <PlaybackTimeline videoRef={videoRef} />
      </div>

      <aside className="w-72 bg-[#2a2a2a] p-4 rounded-lg space-y-4 border border-white/10">
        {['Captions', 'Audio', 'Text', 'Style'].map((panel) => (
          <div key={panel} className="bg-[#1f1f1f] rounded-lg shadow">
            <button
              onClick={() => togglePanel(panel)}
              className={`w-full flex justify-between items-center px-4 py-3 font-semibold text-white bg-white/10 rounded-t-lg hover:bg-white/20 transition`}
            >
              {panel} Settings
              {activePanel === panel ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {activePanel === panel && panel === 'Captions' && (
              <div className="px-4 py-3 text-white space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.captions}
                    onChange={(e) => handleOptionChange({ captions: e.target.checked })}
                  />
                  Enable Captions
                </label>

                <label className="block">
                  Caption Position:
                  <select
                    value={options.captionPosition}
                    onChange={(e) => handleOptionChange({ captionPosition: e.target.value as any })}
                    className="w-full mt-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                  >
                    <option value="Top">Top</option>
                    <option value="Center">Center</option>
                    <option value="Bottom">Bottom</option>
                  </select>
                </label>

                <label className="block">
                  Caption Style:
                  <select
                    value={options.captionStyle}
                    onChange={(e) => handleOptionChange({ captionStyle: e.target.value as any })}
                    className="w-full mt-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                  >
                    <option value="Default">Default</option>
                    <option value="Bold">Bold</option>
                    <option value="Shadowed">Shadowed</option>
                  </select>
                </label>
              </div>
            )}

            {activePanel === panel && panel === 'Audio' && (
              <div className="px-4 py-3 text-white text-sm">Audio settings coming soon...</div>
            )}

            {activePanel === panel && panel === 'Text' && (
              <div className="px-4 py-3 text-white text-sm">Text overlay options coming soon...</div>
            )}

            {activePanel === panel && panel === 'Style' && (
              <div className="px-4 py-3 text-white text-sm">Styling options coming soon...</div>
            )}
          </div>
        ))}

        <button
          onClick={() => console.log('Generate')}
          className="w-full mt-4 bg-[#eb5353] hover:bg-[#ff6b6b] text-white font-bold px-4 py-2 rounded"
        >
          Generate Clips
        </button>
      </aside>
    </div>
  )
}
