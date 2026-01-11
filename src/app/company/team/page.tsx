
import CompanyTeamManagement from '@/views/company/TeamManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Team Management | SmartHire',
    description: 'Manage your company team members.',
};

export default function TeamManagementPage() {
    return <CompanyTeamManagement />;
}
