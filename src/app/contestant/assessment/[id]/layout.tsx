'use client';

import React, { use, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AssessmentProvider, useAssessment } from '@/context/AssessmentContext';
import ProctoringOverlay from '@/components/contestant/ProctoringOverlay';

function AssessmentLayoutContent({ children }: { children: React.ReactNode }) {
    const { assessment, isLoading } = useAssessment();
    const pathname = usePathname();
    const [storedPhotoUrl, setStoredPhotoUrl] = useState<string | undefined>(undefined);
    const [isMounted, setIsMounted] = useState(false);

    const isCodingPage = pathname?.includes('/coding');
    const isTakePage = pathname?.includes('/take');
    const shouldShowProctoring = isCodingPage || isTakePage;

    // Handle client-side only localStorage access
    useEffect(() => {
        setIsMounted(true);
        const photoUrl = localStorage.getItem('storedPhotoUrl');
        if (photoUrl) {
            setStoredPhotoUrl(photoUrl);
        }
    }, []);

    // Don't render proctoring overlay until mounted and assessment is loaded
    const canRenderProctoring = isMounted && !isLoading && assessment?.proctoringSettings?.enabled && shouldShowProctoring;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* 
                Persistent Proctoring Overlay 
                - Only active on /take (MCQ) and /coding (Coding) pages
                - Hides camera UI on coding page (hideCamera={true}) but keeps processing in background
                - Always mounted when proctoring is enabled to maintain camera stream
            */}
            {canRenderProctoring && (
                <ProctoringOverlay
                    key="proctoring-overlay" // Stable key to prevent remounting
                    settings={assessment.proctoringSettings}
                    assessmentId={assessment.id}
                    hideCamera={isCodingPage}
                    storedPhotoUrl={storedPhotoUrl}
                />
            )}

            {/* Page Content */}
            <div className="flex-1 min-h-0 relative">
                {children}
            </div>
        </div>
    );
}

export default function AssessmentLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);

    return (
        <AssessmentProvider assessmentId={id}>
            <AssessmentLayoutContent>
                {children}
            </AssessmentLayoutContent>
        </AssessmentProvider>
    );
}
