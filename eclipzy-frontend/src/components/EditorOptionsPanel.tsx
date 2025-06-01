'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { EditorOptions } from './types'
import { useState } from 'react'

interface Props {
  options: EditorOptions
  onChange: (updated: Partial<EditorOptions>) => void
  onGenerate: () => void
  generating: boolean
}

export default function EditorOptionsPanel({
  options,
  onChange,
  onGenerate,
  generating
}: Props) {
  const [activePanel, setActivePanel] = useState<string | null>('Captions')

  const togglePanel = (panel: string) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  return (
    <aside className="w-80 sticky top-10 h-fit bg-[#2a2a2a] p-4 rounded-lg space-y-4 border border-white/10">
      {['Captions', 'Transcription', 'Audio', 'Text', 'Style'].map((panel) => (
        <div key={panel} className="bg-[#1f1f1f] rounded-lg shadow">
          <button
            onClick={() => togglePanel(panel)}
            className={`w-full flex justify-between items-center px-4 py-3 font-semibold text-white rounded-t-lg transition ${
              activePanel === panel
                ? 'bg-[#eb5353] hover:bg-[#ff6b6b]'
                : 'bg-white/10 hover:bg-white/20'
            }`}
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
                  onChange={(e) => onChange({ captions: e.target.checked })}
                />
                Enable Captions
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.captionHighlight}
                  onChange={(e) =>
                    onChange({ captionHighlight: e.target.checked })
                  }
                />
                Highlight Active Word
              </label>

              <div>
                <label className="block mb-1">
                  Font Size: {options.captionFontSize}px
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={options.captionFontSize}
                    onChange={(e) =>
                      onChange({
                        captionFontSize: parseInt(e.target.value, 10)
                      })
                    }
                    className="w-full accent-[#eb5353]"
                  />
                  <input
                    type="number"
                    min={8}
                    max={32}
                    value={options.captionFontSize}
                    onChange={(e) =>
                      onChange({
                        captionFontSize: parseInt(e.target.value, 10)
                      })
                    }
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>

              <label className="block">
                Caption Position:
                <select
                  value={options.captionPosition}
                  onChange={(e) =>
                    onChange({
                      captionPosition:
                        e.target.value as EditorOptions['captionPosition']
                    })
                  }
                  className="w-full mt-1 bg-[#1f1f1f] text-white border border-white/20 rounded px-2 py-1 focus:outline-none focus:ring-2 ring-[#eb5353]"
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
                  onChange={(e) =>
                    onChange({
                      captionStyle:
                        e.target.value as EditorOptions['captionStyle']
                    })
                  }
                  className="w-full mt-1 bg-[#1f1f1f] text-white border border-white/20 rounded px-2 py-1 focus:outline-none focus:ring-2 ring-[#eb5353]"
                >
                  <option value="Rapid">Rapid</option>
                  <option value="Smart">Smart</option>
                </select>
              </label>
            </div>
          )}

          {activePanel === panel && panel === 'Transcription' && (
            <div className="px-4 py-3 text-white text-sm">
              Transcription options coming soon...
            </div>
          )}
          {activePanel === panel && panel === 'Audio' && (
            <div className="px-4 py-3 text-white text-sm">
              Audio settings coming soon...
            </div>
          )}
          {activePanel === panel && panel === 'Text' && (
            <div className="px-4 py-3 text-white text-sm">
              Text overlay options coming soon...
            </div>
          )}
          {activePanel === panel && panel === 'Style' && (
            <div className="px-4 py-3 text-white text-sm">
              Styling options coming soon...
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full mt-4 bg-[#eb5353] hover:bg-[#ff6b6b] text-white font-bold px-4 py-2 rounded disabled:opacity-50"
      >
        {generating ? 'Generating Clips...' : 'Generate Clips'}
      </button>

    </aside>
  )
}
