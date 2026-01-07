'use client'

import dynamic from 'next/dynamic'
const AdminSettings = dynamic(() => import('@/views/admin/AdminSettings'), { ssr: false })

export default function AdminSettingsPage() {
    return <AdminSettings />
}
