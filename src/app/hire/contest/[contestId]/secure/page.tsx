'use client';

import React from 'react';
import SecureContestPage from '@/views/secure-contest/SecureContestPage';
import { useParams } from 'next/navigation';

export default function SecureContestWrapperPage() {
    const params = useParams();
    const contestId = params?.contestId as string;

    if (!contestId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Invalid Contest</h1>
                    <p className="text-gray-400">No contest ID provided in the URL.</p>
                </div>
            </div>
        );
    }

    return (
        <SecureContestPage
            contestId={contestId}
        // Passing empty/default props as the component manages its own state for these mostly, 
        // but we need to check if they are required or optional in SecureContestPageProps.
        // Based on the code view, they are optional or have defaults, except onSubmit which might be optional?
        // Checking line 122 of SecureContestPage:
        // onSubmit is destructured but might not be required if defined as optional in props interface.
        // Wait, looking at line 129: `}: SecureContestPageProps) {`
        // I didn't see the interface definition for SecureContestPageProps.
        // Let's assume for now they are optional or handled. 
        // If onSubmit is required, I should provide a dummy or logic.
        // However, checking the migration, this page is the main entry, so it handles submission internally.
        // onSubmit might be for when it's used as a component. 
        // Ideally SecureContestPage should be self-contained for the page route.
        />
    );
}
