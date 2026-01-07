'use client'

import dynamic from 'next/dynamic'
const AdminReports = dynamic(() => import('@/views/admin/AdminReports'), { ssr: false })

export default function AdminReportsPage() {
    return <AdminReports />
}
