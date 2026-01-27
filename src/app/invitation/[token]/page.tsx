'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contestantService } from '@/api/contestantService';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '@/components/Loader';

export default function InvitationPage() {
    const router = useRouter();
    const params = useParams();
    const token = params?.token as string;

    const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                // Step 1: Verify Invitation
                console.log('🔍 [INVITATION] Verifying token...');
                const response = await contestantService.verifyInvitation(token);
                console.log('✅ [INVITATION] Verification response:', response.data);

                const data = response.data as any;
                // Handle both { success: true, data: {...} } and direct { email: ... } formats
                const payload = data.data || data;

                if (payload) {
                    // Extract data from various possible structures
                    const assessmentId = payload.assessmentId || payload.assessment?.id;
                    const email = payload.email || '';
                    const isValid = payload.valid !== false; // If valid field is present and false, it's invalid

                    if (assessmentId && isValid) {
                        console.log(`✅ [INVITATION] Token verified. Assessment: ${assessmentId}, Email: ${email || 'Not provided'}`);
                        // Redirect to verification page
                        // If email is missing, user will have to enter it manually
                        const queryParams = new URLSearchParams({
                            assessmentId: assessmentId,
                        });
                        if (email) queryParams.append('email', email);

                        router.push(`/contestant/verify?${queryParams.toString()}`);
                        return;
                    }
                }

                // If we get here, validation failed or format is unrecognized
                console.error('Invalid response payload:', payload);
                setStatus('error');
                setErrorMessage('Invalid invitation token or malformed response.');
            } catch (error: any) {
                console.error('Invitation verification failed:', error);
                setStatus('error');
                setErrorMessage(error.response?.data?.message || 'Failed to verify invitation. It may have expired or is invalid.');
            }
        };

        if (token) {
            verify();
        }
    }, [token, router]);

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg"
                >
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Invitation Error</h1>
                    <p className="text-muted-foreground mb-6">{errorMessage}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return <Loader fullscreen />;
}
