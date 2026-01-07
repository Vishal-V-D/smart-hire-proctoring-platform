import { useState, useEffect, useRef } from 'react';
import { contestService } from '../api/contestService';

export interface TimerState {
    hasStarted: boolean;
    hasExpired: boolean;
    remainingSeconds: number;
    totalDurationSeconds: number | null;
}

interface UseSecureContestTimerProps {
    contestId: string | undefined;
    onExpire?: () => void;
}

export const useSecureContestTimer = ({ contestId, onExpire }: UseSecureContestTimerProps) => {
    const [timerData, setTimerData] = useState<TimerState | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionFinished, setSessionFinished] = useState(false);

    // Initial load ref to prevent double-firing strict mode
    const loadedRef = useRef(false);

    // 1. Initialize Session & Timer
    useEffect(() => {
        if (!contestId || loadedRef.current) return;

        const initSession = async () => {
            loadedRef.current = true;
            try {
                // Attempt to start session
                await contestService.startContestSession(contestId).catch(err => {
                    // Ignore 400 (already active)
                    if (err.response?.status !== 400) {
                        console.error('⚠️ [TIMER] Failed to start session:', err);
                    }
                });

                setSessionStarted(true);

                // Fetch initial timer state
                const res = await contestService.getContestTimer(contestId);
                if (res.data) {
                    console.log('⏱️ [TIMER] Initial Data:', res.data);
                    setTimerData({
                        hasStarted: true,
                        hasExpired: res.data.hasExpired,
                        remainingSeconds: res.data.remainingSeconds,
                        totalDurationSeconds: res.data.totalDurationSeconds
                    });

                    if (res.data.hasExpired && onExpire) {
                        onExpire();
                    }
                }
            } catch (err) {
                console.error('❌ [TIMER] Init failed:', err);
            }
        };

        initSession();
    }, [contestId, onExpire]);

    // 2. Countdown Interval (Decrements remainingSeconds)
    useEffect(() => {
        if (!timerData || timerData.hasExpired || timerData.remainingSeconds <= 0) return;

        const interval = setInterval(() => {
            setTimerData(prev => {
                if (!prev) return null;
                const newRemaining = prev.remainingSeconds - 1;

                if (newRemaining <= 0) {
                    clearInterval(interval);
                    if (!prev.hasExpired && onExpire) {
                        // Trigger expiration callback once
                        onExpire();
                    }
                    return { ...prev, remainingSeconds: 0, hasExpired: true };
                }

                return { ...prev, remainingSeconds: newRemaining };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerData?.hasStarted, timerData?.hasExpired, onExpire]);

    // 3. Elapsed Time Interval (Increments generic elapsed counter)
    useEffect(() => {
        if (!sessionStarted || sessionFinished) return;
        const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
        return () => clearInterval(interval);
    }, [sessionStarted, sessionFinished]);

    return {
        timerData,
        elapsedTime,
        sessionStarted,
        sessionFinished,
        setSessionFinished,
        formatRemainingTime: (seconds: number) => {
            if (seconds <= 0) return '00:00:00';
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        getTimerColor: (seconds: number) => {
            if (seconds <= 60) return 'text-red-500 bg-red-500/10 border-red-500/50 animate-pulse';
            if (seconds <= 300) return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
            if (seconds <= 600) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
            return 'text-green-500 bg-green-500/10 border-green-500/50';
        }
    };
};
