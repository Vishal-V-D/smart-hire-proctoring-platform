'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Camera, Mic, Monitor, Chrome, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { contestantService } from '@/api/contestantService';

export default function SetupPage() {
    const router = useRouter();
    const params = useParams();
    const assessmentId = params.id as string;
    const videoRef = useRef<HTMLVideoElement>(null);

    const [consent, setConsent] = useState(false);
    const [checks, setChecks] = useState({
        browser: false,
        camera: false,
        mic: false,
        screenShare: false
    });
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check browser compatibility
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        setChecks(prev => ({ ...prev, browser: isChrome }));

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const testCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setChecks(prev => ({ ...prev, camera: true, mic: true }));
        } catch (err) {
            setError('Failed to access camera/microphone. Please grant permissions.');
        }
    };

    const testScreenShare = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            displayStream.getTracks().forEach(track => track.stop());
            setChecks(prev => ({ ...prev, screenShare: true }));
        } catch (err) {
            setError('Failed to access screen sharing. Please grant permissions.');
        }
    };

    const handleContinue = async () => {
        if (!consent) {
            setError('Please accept the proctoring consent to continue');
            return;
        }

        if (!checks.browser || !checks.camera || !checks.mic) {
            setError('Please complete all required system checks');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { sessionToken } = contestantService.getSession();
            if (!sessionToken) {
                throw new Error('Session not found');
            }

            // Record consent
            await contestantService.recordConsent(sessionToken);

            // Record system checks
            await contestantService.recordSystemCheck(sessionToken, checks);

            // Redirect to assessment details
            router.push(`/contestant/assessment/${assessmentId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to save setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const allChecksPass = checks.browser && checks.camera && checks.mic;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Proctoring Setup</h1>
                    <p className="text-muted-foreground">
                        Complete the system checks and accept proctoring consent
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Checks */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
                        <h2 className="text-xl font-bold text-foreground">System Checks</h2>

                        <div className="space-y-4">
                            {/* Browser Check */}
                            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${checks.browser ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                                <div className="flex items-center gap-3">
                                    <Chrome className={`h-6 w-6 ${checks.browser ? 'text-green-500' : 'text-amber-500'}`} />
                                    <div>
                                        <p className="font-semibold text-foreground">Browser Compatibility</p>
                                        <p className="text-xs text-muted-foreground">Chrome recommended</p>
                                    </div>
                                </div>
                                {checks.browser ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                                )}
                            </div>

                            {/* Camera/Mic Check */}
                            <div className={`p-4 rounded-lg border-2 ${checks.camera ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Camera className={`h-6 w-6 ${checks.camera ? 'text-green-500' : 'text-muted-foreground'}`} />
                                        <div>
                                            <p className="font-semibold text-foreground">Camera & Microphone</p>
                                            <p className="text-xs text-muted-foreground">Required for proctoring</p>
                                        </div>
                                    </div>
                                    {checks.camera ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <button
                                            onClick={testCamera}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90"
                                        >
                                            Test Now
                                        </button>
                                    )}
                                </div>

                                {stream && (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        className="w-full rounded-lg border border-border"
                                    />
                                )}
                            </div>

                            {/* Screen Share Check */}
                            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${checks.screenShare ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                                <div className="flex items-center gap-3">
                                    <Monitor className={`h-6 w-6 ${checks.screenShare ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="font-semibold text-foreground">Screen Sharing</p>
                                        <p className="text-xs text-muted-foreground">Optional but recommended</p>
                                    </div>
                                </div>
                                {checks.screenShare ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <button
                                        onClick={testScreenShare}
                                        className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/80"
                                    >
                                        Test Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Consent */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
                        <h2 className="text-xl font-bold text-foreground">Proctoring Consent</h2>

                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>By proceeding, you agree to:</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>Allow video and audio recording during the assessment</li>
                                <li>Share your screen for monitoring purposes</li>
                                <li>Not use any unauthorized materials or assistance</li>
                                <li>Complete the assessment in one sitting</li>
                                <li>Not navigate away from the assessment window</li>
                            </ul>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Important
                                </p>
                                <p className="text-xs mt-2">
                                    Any suspicious activity may result in disqualification. Ensure you're in a quiet, well-lit environment.
                                </p>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-sm text-foreground font-medium">
                                I have read and accept the proctoring terms and conditions
                            </span>
                        </label>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            disabled={loading || !consent || !allChecksPass}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Continue to Assessment
                                    <ArrowRight className="h-6 w-6" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
