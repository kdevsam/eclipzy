'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to <span className="text-eclipse">Eclipzy</span>
        </h1>
        <p className="text-lg text-white/80 mb-6">
          Eclipzy is your AI-powered video clipping platform. Instantly turn YouTube links or MP4 uploads into short-form content for TikTok and YouTube Shorts — complete with AI-generated titles, voiceovers, and filters.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-eclipse text-dark font-bold py-3 px-6 rounded-lg text-lg hover:brightness-90 transition"
        >
          Get Started Now
        </button>
      </div>
    </main>
  )
}
