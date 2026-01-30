import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/navigation/BottomNav'
import TopHeader from '@/components/navigation/TopHeader'
import { AudioProvider } from '@/components/audio/AudioContext'
import GlobalPlayer from '@/components/audio/GlobalPlayer'
import InstallPrompt from '@/components/pwa/InstallPrompt'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).status === 'pending') {
    redirect('/waiting-room')
  }

  return (
    <AudioProvider>
      <div className="min-h-screen bg-sacred-charcoal pb-24">
        <TopHeader profile={profile as any} />
        <main className="pt-20">
          {children}
        </main>
        <GlobalPlayer />
        <InstallPrompt />
        <BottomNav />
      </div>
      {/* Adjust footer position for pages with bottom nav */}
      <style jsx global>{`
        footer { bottom: 4.5rem !important; }
      `}</style>
    </AudioProvider>
  )
}
