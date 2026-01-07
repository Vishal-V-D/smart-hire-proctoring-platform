// src/app/organizer/admins/page.tsx
'use client'

import dynamic from 'next/dynamic'
const AdminManagement = dynamic(() => import('@/views/organizer/AdminManagement'), { ssr: false })

export default function AdminManagementPage() {
    return <AdminManagement />
}
