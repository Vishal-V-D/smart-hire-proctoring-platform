
import PartnerSignup from '@/views/auth/PartnerSignup';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Partner Registration | SmartHire',
    description: 'Register as a partner company to start using SmartHire.',
};

export default function PartnerSignupPage() {
    return <PartnerSignup />;
}
