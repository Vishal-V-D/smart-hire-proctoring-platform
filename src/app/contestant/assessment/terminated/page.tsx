'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react';

export default function AssessmentTerminatedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');

    const isCompleted = reason === 'completed';

    useEffect(() => {
        // Prevent back navigation
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.pushState(null, '', window.location.href);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 border border-red-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center border ${isCompleted ? 'bg-blue-900/30 border-blue-500/50' : 'bg-red-900/30 border-red-500/50'
                        }`}>
                        {isCompleted ? (
                            <CheckCircle className="w-10 h-10 text-blue-500" />
                        ) : (
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">
                            {isCompleted ? 'Assessment Completed' : 'Assessment Terminated'}
                        </h1>
                        <p className="text-gray-400">
                            {isCompleted
                                ? 'You have already submitted this assessment. Retakes are not allowed.'
                                : 'Your assessment has been automatically terminated due to repeated proctoring violations.'}
                        </p>
                    </div>

                    <div className={`${isCompleted ? 'bg-blue-950/40 border-blue-900/50' : 'bg-red-950/40 border-red-900/50'
                        } border rounded-xl p-4 text-left space-y-3`}>
                        <div className="flex items-start gap-3">
                            <Lock className={`w-5 h-5 mt-0.5 shrink-0 ${isCompleted ? 'text-blue-400' : 'text-red-400'}`} />
                            <div className="space-y-1">
                                <h3 className={`font-semibold text-sm ${isCompleted ? 'text-blue-200' : 'text-red-200'}`}>
                                    {isCompleted ? 'Access Locked' : 'Violation Access Lock'}
                                </h3>
                                <p className={`text-xs leading-relaxed ${isCompleted ? 'text-blue-300/80' : 'text-red-300/80'}`}>
                                    {isCompleted
                                        ? 'This session is closed because a submission has already been recorded for your account.'
                                        : 'The system detected multiple tab switches exceeding the allowed limit. As per the integrity policy, your session has been locked and submitted for review.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={() => router.push('/contestant/dashboard')}
                            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>

                <div className="bg-gray-950/50 px-8 py-4 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-500">
                        Session ID: {typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || 'N/A' : 'N/A'} • IP Logged
                    </p>
                </div>
            </div>
        </div>
    );
}
