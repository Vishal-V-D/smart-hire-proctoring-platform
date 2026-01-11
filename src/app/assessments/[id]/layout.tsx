"use client";

import SharedLayout from '@/components/SharedLayout';

export default function AssessmentDetailLayout({ children }: { children: React.ReactNode }) {
    return (
        <SharedLayout>
            {children}
        </SharedLayout>
    );
}
