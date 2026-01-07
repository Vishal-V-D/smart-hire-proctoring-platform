// src/app/admin/assessments/[id]/page.tsx
'use client'

import dynamic from 'next/dynamic'
const AdminAssessmentView = dynamic(() => import('@/views/admin/AdminAssessmentView'), { ssr: false })

export default function AdminAssessmentPage() {
    return <AdminAssessmentView />
}
