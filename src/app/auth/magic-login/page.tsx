// src/app/auth/magic-login/page.tsx
'use client'

import dynamic from 'next/dynamic'
const MagicLogin = dynamic(() => import('@/views/auth/MagicLogin'), { ssr: false })

export default function MagicLoginPage() {
    return <MagicLogin />
}
