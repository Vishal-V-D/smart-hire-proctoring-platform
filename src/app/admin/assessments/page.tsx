'use client'

import dynamic from 'next/dynamic'
const AdminAssessmentsList = dynamic(() => import('@/views/admin/AdminAssessmentsList'), { ssr: false })

export default function AdminAssessmentsPage() {
    return <AdminAssessmentsList />
}
