
import SetupPassword from '@/views/auth/SetupPassword';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Set Password | SmartHire',
    description: 'Set your account password.',
};

export default function SetupPasswordPage() {
    return <SetupPassword />;
}
