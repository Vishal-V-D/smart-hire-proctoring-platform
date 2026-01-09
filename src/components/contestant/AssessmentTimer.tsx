import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { contestantService } from '@/api/contestantService';

interface AssessmentTimerProps {
    assessmentId: string;
    sectionId: string; // The ID of the current section to display time for
    onExpire?: () => void;
    variant?: 'default' | 'minimal' | 'pill';
    className?: string;
}

export default function AssessmentTimer({
    assessmentId,
    sectionId,
    onExpire,
    variant = 'default',
    className = ''
}: AssessmentTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'expired' | 'completed' | 'loading'>('loading');
    const [isSyncing, setIsSyncing] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch and Sync Timer
    const syncTimer = async (retryCount = 0) => {
        if (retryCount === 0) setIsSyncing(true);
        try {
            const response = await contestantService.getAssessmentTimer(assessmentId);
            const data = response.data.data;

            // Find current section data
            const currentSectionData = data.sections?.find(s => s.sectionId === sectionId);

            if (currentSectionData) {
                // Check if we hit a race condition (backend hasn't started timer yet)
                if (currentSectionData.status === 'idle' && retryCount < 3) {
                    // Retry in 1s
                    setTimeout(() => syncTimer(retryCount + 1), 1000);
                    return;
                }

                // If section is found, use its data
                setTimeLeft(currentSectionData.timeLeft);
                setStatus(currentSectionData.status);

                // If expired, trigger callback
                if (currentSectionData.status === 'expired' || currentSectionData.timeLeft <= 0) {
                    if (onExpire) onExpire();
                }
            } else {
                // Section not found in timer data? Retry if new
                if (retryCount < 3) {
                    setTimeout(() => syncTimer(retryCount + 1), 1000);
                    return;
                }
                setStatus('idle');
            }

        } catch (error) {
            console.error("Failed to sync timer:", error);
        } finally {
            if (retryCount === 0) setIsSyncing(false);
        }
    };

    // Reset State on Section Change
    useEffect(() => {
        setTimeLeft(null);
        setStatus('loading');
    }, [sectionId]);

    // Initial Sync and Heartbeat
    useEffect(() => {
        if (!assessmentId || !sectionId) return;

        // Immediate sync
        syncTimer();

        // Heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => syncTimer(), 30000);

        return () => clearInterval(heartbeatInterval);
    }, [assessmentId, sectionId]);

    // Local Countdown
    useEffect(() => {
        if (status !== 'running') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Clear existing to be safe
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return null;

                if (prev <= 1) {
                    // Timer hit 0
                    if (timerRef.current) clearInterval(timerRef.current);

                    // Call expire callback immediately if not already called
                    setStatus('expired');
                    if (onExpire) {
                        console.log("⏰ Timer expired locally, triggering callback");
                        onExpire();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, onExpire]); // Only restart interval when status changes (not on every tick)

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
            // Critical (Red)
            return {
                color: 'text-[#da1e28]',
                bg: 'bg-[#da1e28]/10',
                border: 'border-[#da1e28]/20',
                animate: 'animate-pulse'
            };
        }
        if (timeLeft < 300) {
            // Warning (Yellow)
            return {
                color: 'text-[#f1c21b]',
                bg: 'bg-[#f1c21b]/10',
                border: 'border-[#f1c21b]/20',
                animate: ''
            };
        }

        // Normal (Orange as requested)
        return {
            color: 'text-[#ff832b]',
            bg: 'bg-[#ff832b]/10',
            border: 'border-[#ff832b]/20',
            animate: ''
        };
    };

    const styles = getStatusStyles();

    if (status === 'loading' && timeLeft === null) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="w-3 h-3 animate-spin opacity-50" />
                <span className="text-[10px] font-mono opacity-50">Sync...</span>
            </div>
        );
    }

    if (timeLeft === null) return null;

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
