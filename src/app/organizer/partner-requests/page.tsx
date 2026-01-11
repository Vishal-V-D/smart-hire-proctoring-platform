
import PartnerRequests from '@/views/organizer/PartnerRequests';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Partner Requests | SmartHire',
    description: 'Manage incoming company and user registration requests.',
};

export default function PartnerRequestsPage() {
    return <PartnerRequests />;
}
