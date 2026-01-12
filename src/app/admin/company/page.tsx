'use client'

import dynamic from 'next/dynamic'
const CompanyInfo = dynamic(() => import('@/views/admin/CompanyInfo'), { ssr: false })

export default function CompanyInfoPage() {
    return <CompanyInfo />
}
