import NotificationsView from '@/views/NotificationsView';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notifications | SmartHire',
    description: 'View your notifications and alerts.',
};

export default function NotificationsPage() {
    return <NotificationsView />;
}
