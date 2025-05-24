'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import UploadForm from '@/components/UploadForm'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans px-6 py-10">
      <header className="flex justify-between items-center max-w-5xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight">🎬 Eclipzy Dashboard</h1>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-white/80">Logged in as <strong>{user.email}</strong></span>}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-md text-sm font-semibold shadow-md"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
        <h2 className="text-xl font-semibold mb-6 text-center text-white/90">Upload a Video or Paste a Link</h2>
        <UploadForm />
      </main>

      <footer className="text-center text-sm mt-16 text-white/40">
        &copy; {new Date().getFullYear()} Eclipzy. All rights reserved.
      </footer>
    </div>
  )
}
