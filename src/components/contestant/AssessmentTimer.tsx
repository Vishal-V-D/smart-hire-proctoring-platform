import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { contestantService } from '@/api/contestantService';

interface AssessmentTimerProps {
    assessmentId: string;
    sectionId: string; // The ID of the current section to display time for
    onExpire?: () => void;
    variant?: 'default' | 'minimal';
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
    const syncTimer = async () => {
        setIsSyncing(true);
        try {
            const response = await contestantService.getAssessmentTimer(assessmentId);
            const data = response.data.data;

            // Find current section data
            const currentSectionData = data.sections?.find(s => s.sectionId === sectionId);

            if (currentSectionData) {
                // If section is found, use its data
                setTimeLeft(currentSectionData.timeLeft);
                setStatus(currentSectionData.status);

                // If expired, trigger callback
                if (currentSectionData.status === 'expired' || currentSectionData.timeLeft <= 0) {
                    if (onExpire) onExpire();
                }
            } else {
                // If specific section not found (maybe global mode?), fallback or handle gracefully
                // For now, if we are in section mode but can't find section, it might be an error or idle
                setStatus('idle');
            }

        } catch (error) {
            console.error("Failed to sync timer:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Initial Sync and Heartbeat
    useEffect(() => {
        if (!assessmentId || !sectionId) return;

        // Immediate sync
        syncTimer();

        // Heartbeat every 30 seconds
        const heartbeatInterval = setInterval(syncTimer, 30000);

        return () => clearInterval(heartbeatInterval);
    }, [assessmentId, sectionId]);

    // Local Countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || status !== 'running') return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, status]);

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
    const getStatusColor = () => {
        if (timeLeft === null) return 'text-gray-400';
        if (timeLeft < 60) return 'text-[#da1e28] animate-pulse'; // Critical (Red)
        if (timeLeft < 300) return 'text-[#f1c21b]'; // Warning (Yellow)
        return 'text-[#42be65]'; // Normal (Green)
    };

    if (status === 'loading' && timeLeft === null) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                <span className="text-xs font-mono opacity-50">Syncing...</span>
            </div>
        );
    }

    if (timeLeft === null) return null;

    return (
        <div className={`flex items-center gap-2 font-mono font-bold transition-colors duration-300 ${getStatusColor()} ${className}`}>
            {timeLeft < 300 ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span className="text-base tracking-widest">{formatTime(timeLeft)}</span>
        </div>
    );
}
