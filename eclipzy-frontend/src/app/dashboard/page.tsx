'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { FiLogOut, FiUser, FiCreditCard, FiChevronDown } from 'react-icons/fi'
import UploadForm from '@/components/UploadForm'
import MyVideosTab from '@/components/MyVideosTab'
import TimelineEditor from '@/components/TimelineEditor'

const SidebarTabs = ['Home', 'Upload', 'Editor', 'My Videos', 'Templates']

export default function VideoEditorLayout() {
  const [activeTab, setActiveTab] = useState('Home')
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-[#1f1f1f] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-[#2a2a2a] flex flex-col justify-between border-r border-white/10">
        <div>
          <div className="text-2xl font-bold  border-b border-white/10"><img src={'eclipzy.svg'} width={'100px'}></img></div>
          <nav className="mt-6 space-y-2 px-4">
            {SidebarTabs.map((tab) => (
              <button
                key={tab}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeTab === tab
                    ? 'bg-[#eb5353] text-dark font-semibold'
                    : 'text-white/70 hover:bg-white/10'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 pb-6">
          <button className="w-full text-left px-4 py-2 text-white/70 hover:bg-white/10 rounded-lg">
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{activeTab}</h1>
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-lg text-sm"
              >
                <FiUser className="text-white/60" />
                {user.email}
                <FiChevronDown className="text-white/60" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1f2937] rounded-lg shadow-lg border border-white/10 z-50">
                  <button
                    onClick={() => alert('Subscriptions')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    <FiCreditCard /> Subscriptions
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        
        {activeTab === 'Editor' && user && <TimelineEditor  />}

        {activeTab === 'Upload' && (
          <div className="border border-white/10 rounded-xl p-8 bg-white/5 backdrop-blur-md shadow-xl">
            <UploadForm />
          </div>
        )}

        {activeTab === 'My Videos' && user && <MyVideosTab user={user} />}
      </main>
    </div>
  )
}
