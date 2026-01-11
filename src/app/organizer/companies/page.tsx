import dynamic from 'next/dynamic';

const CompanyManagement = dynamic(() => import('@/views/organizer/CompanyManagement'), {
    loading: () => <div className="p-8 text-center">Loading...</div>
});

export default function CompaniesPage() {
    return <CompanyManagement />;
}
