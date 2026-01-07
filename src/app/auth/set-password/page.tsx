// src/app/auth/set-password/page.tsx
'use client'

import dynamic from 'next/dynamic'
const SetPassword = dynamic(() => import('@/views/auth/SetPassword'), { ssr: false })

export default function SetPasswordPage() {
    return <SetPassword />
}
