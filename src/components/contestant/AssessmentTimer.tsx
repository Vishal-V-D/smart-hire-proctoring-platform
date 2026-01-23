import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { contestantService } from '@/api/contestantService';
import { useAssessment } from '@/context/AssessmentContext';

interface AssessmentTimerProps {
    assessmentId: string;
    sectionId: string; // The ID of the current section to display time for
    onExpire?: () => void;
    variant?: 'default' | 'minimal' | 'pill';
    className?: string;
    disableAutoSync?: boolean; // If true, relies on Context or parent updates only
}

export default function AssessmentTimer({
    assessmentId,
    sectionId,
    onExpire,
    variant = 'default',
    className = '',
    disableAutoSync = false
}: AssessmentTimerProps) {
    // Context State
    const { currentSectionTimer } = useAssessment();

    // Local State (Fallback)
    const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
    const [localStatus, setLocalStatus] = useState<'idle' | 'running' | 'paused' | 'expired' | 'completed' | 'loading'>('loading');
    const [isSyncing, setIsSyncing] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Determine if we should use context data
    // Use context if disableAutoSync is true OR if context matches our sectionId
    const isContextMatch = currentSectionTimer.sectionId === sectionId;
    const shouldUseContext = disableAutoSync || isContextMatch;

    // Derived State
    const timeLeft = shouldUseContext ? (isContextMatch ? currentSectionTimer.timeRemaining : null) : localTimeLeft;
    const status = shouldUseContext ? (isContextMatch ? currentSectionTimer.status : 'loading') : localStatus;

    // Trigger onExpire from Status Changes (Context or Local)
    // Use a ref to prevent duplicate calls if onExpire prop is unstable (re-created on render)
    const hasTriggeredExpire = useRef(false);

    useEffect(() => {
        if (status === 'expired') {
            if (!hasTriggeredExpire.current) {
                hasTriggeredExpire.current = true;
                if (onExpire) {
                    console.log("⏰ Timer expired, triggering callback");
                    onExpire();
                }
            }
        } else if (status !== 'loading' && status !== 'idle') {
            // Reset if we go back to running (e.g. section change)
            // But don't reset on 'loading' to avoid race conditions during transitions
            hasTriggeredExpire.current = false;
        }
    }, [status, onExpire]);

    // Fetch and Sync Timer (Local Mode Only)
    const syncTimer = async (retryCount = 0) => {
        if (shouldUseContext) return; // Guard

        if (retryCount === 0) setIsSyncing(true);
        try {
            const response = await contestantService.getAssessmentTimer(assessmentId, sectionId);
            const data = response.data.data;

            if (data) {
                const serverTimeLeft = data.timeLeft;

                // Drift check
                if (localTimeLeft === null) {
                    setLocalTimeLeft(serverTimeLeft);
                } else {
                    const drift = Math.abs(localTimeLeft - serverTimeLeft);
                    if (drift > 2) {
                        console.log(`⏱️ [Timer] Time drift detected (${drift}s). Syncing to server time.`);
                        setLocalTimeLeft(serverTimeLeft);
                    }
                }

                // If server says running but time is up, force expired
                if (data.status === 'running' && serverTimeLeft <= 0) {
                    setLocalStatus('expired');
                } else {
                    setLocalStatus(data.status);
                }
            } else {
                if (retryCount < 3) {
                    setTimeout(() => syncTimer(retryCount + 1), 1000);
                    return;
                }
                setLocalStatus('idle');
            }

        } catch (error) {
            console.error("Failed to sync timer:", error);
        } finally {
            if (retryCount === 0) setIsSyncing(false);
        }
    };

    // Reset State on Section Change
    useEffect(() => {
        if (!shouldUseContext) {
            setLocalTimeLeft(null);
            setLocalStatus('loading');
            hasTriggeredExpire.current = false;
        }
    }, [sectionId, shouldUseContext]);

    // Initial Sync and Heartbeat (Local Mode Only)
    useEffect(() => {
        if (!assessmentId || !sectionId || shouldUseContext) return;

        // Immediate sync
        syncTimer();

        // Heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => syncTimer(), 30000);

        return () => clearInterval(heartbeatInterval);
    }, [assessmentId, sectionId, shouldUseContext]);

    // Local Countdown (Local Mode Only)
    // When using Context, the Context handles the countdown and we just receive updates
    useEffect(() => {
        if (shouldUseContext) return;

        if (localStatus !== 'running') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setLocalTimeLeft(prev => {
                if (prev === null) return null;

                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setLocalStatus('expired');
                    // onExpire handled by effect
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [localStatus, shouldUseContext]);

    // Format time logic
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Determine colors
    const getStatusStyles = () => {
        if (timeLeft === null) return { color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-200' };

        if (timeLeft < 60) {
            // Critical
            return {
                color: 'text-[#da1e28]',
                bg: 'bg-[#da1e28]/10',
                border: 'border-[#da1e28]/20',
                animate: 'animate-pulse'
            };
        }
        if (timeLeft < 300) {
            // Warning
            return {
                color: 'text-[#f1c21b]',
                bg: 'bg-[#f1c21b]/10',
                border: 'border-[#f1c21b]/20',
                animate: ''
            };
        }

        // Normal
        return {
            color: 'text-[#ff832b]',
            bg: 'bg-[#ff832b]/10',
            border: 'border-[#ff832b]/20',
            animate: ''
        };
    };

    const styles = getStatusStyles();

    if ((status === 'loading' && timeLeft === null) || timeLeft === null) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="w-3 h-3 animate-spin opacity-50" />
                <span className="text-[10px] font-mono opacity-50">Sync...</span>
            </div>
        );
    }

    if (variant === 'pill') {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles.bg} ${styles.border} ${className}`}>
                <Clock className={`w-3.5 h-3.5 ${styles.color} ${styles.animate}`} />
                <span className={`font-mono font-extrabold text-sm ${styles.color}`}>{formatTime(timeLeft)}</span>
            </div>
        );
    }

    if (variant === 'minimal') {
        return (
            <span className={`font-mono font-bold ${styles.color} ${className}`}>
                {formatTime(timeLeft)}
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-2 font-mono font-bold transition-colors duration-300 ${styles.color} ${className}`}>
            {timeLeft < 300 ? <AlertTriangle className={`w-4 h-4 ${styles.animate}`} /> : <Clock className="w-4 h-4" />}
            <span className="text-base tracking-widest">{formatTime(timeLeft)}</span>
        </div>
    );
}
