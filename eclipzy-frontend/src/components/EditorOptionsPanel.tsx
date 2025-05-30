'use client'

import { useState } from 'react'
import { EditorOptions } from './EditorOptionsPanel'

interface Props {
  options: EditorOptions
  onChange: (options: EditorOptions) => void
  onGenerate: () => void
  generating: boolean
}

const optionTabs = ['Captions', 'Layout'] as const

type OptionTab = typeof optionTabs[number]

export default function EditorOptionsPanel({ options, onChange, onGenerate, generating }: Props) {
  const [activeTab, setActiveTab] = useState<OptionTab>('Captions')

  return (
    <div className="flex gap-4 mt-6">
      {/* Sidebar Navigation */}
      <div className="flex flex-col gap-2 text-white w-32">
        {optionTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-[#eb5353] text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Panel */}
      <div className="flex-1 bg-[#1f1f1f] p-6 rounded-xl shadow-lg border border-white/10 space-y-4">
        {activeTab === 'Captions' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Captions Settings</h2>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={options.captions}
                onChange={(e) => onChange({ ...options, captions: e.target.checked })}
              />
              Enable Captions
            </label>

            <div className="mb-4">
              <label className="block mb-1 text-sm text-white/70">Caption Position:</label>
              <select
                value={options.captionPosition}
                onChange={(e) =>
                  onChange({ ...options, captionPosition: e.target.value as EditorOptions['captionPosition'] })
                }
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              >
                <option value="Top">Top</option>
                <option value="Center">Center</option>
                <option value="Bottom">Bottom</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'Layout' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Layout Options</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.portraitMode}
                onChange={(e) => onChange({ ...options, portraitMode: e.target.checked })}
              />
              Portrait Mode
            </label>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={generating}
          className="mt-4 bg-[#eb5353] hover:bg-[#ff6b6b] text-white font-bold px-4 py-2 rounded disabled:opacity-50"
        >
          {generating ? 'Generating Clips...' : 'Generate Clips'}
        </button>
      </div>
    </div>
  )
}
