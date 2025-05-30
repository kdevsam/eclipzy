'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-[#1f1f1f] via-[#2b2b2b] to-[#1f1f1f] flex items-center justify-center px-6 py-20 text-white font-sans">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl"
      >
        <h2 className="text-3xl font-extrabold text-center mb-6 text-white">Welcome to eClipzy</h2>
        <p className="text-sm text-center text-white/60 mb-8">Login to your account to start creating AI-powered clips</p>

        <input
          type="email"
          className="w-full mb-4 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-eclipse"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-eclipse"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-eclipse text-dark font-bold py-3 rounded hover:brightness-90 transition"
        >
          Login
        </button>

        <p className="mt-6 text-xs text-center text-white/40">
          &copy; {new Date().getFullYear()} eClipzy. All rights reserved.
        </p>
      </form>
    </div>
  )
}
