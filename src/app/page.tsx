'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Critical: Load immediately (hero section only)
import { AuthContext } from '@/components/AuthProviderClient'
import { useContext, useState, useEffect } from 'react'

// Lazy load heavy components with loading states
const LandingPageContent = dynamic(
  () => import('@/views/LandingPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }
)

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}
