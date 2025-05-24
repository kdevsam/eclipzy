import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LoginForm from '@/components/Login'

export default async function LoginPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ✅ Redirect if already logged in
  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-dark text-white flex items-center justify-center">
      <LoginForm />
    </main>
  )
}
