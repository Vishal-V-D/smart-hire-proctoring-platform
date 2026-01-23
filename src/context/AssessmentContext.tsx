'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contestantService } from '@/api/contestantService';

interface SectionTimer {
    sectionId: string;
    timeRemaining: number; // seconds (NOT minutes - easier for countdown)
    timeLimit: number; // seconds
    startedAt: string | null;
    status: 'in_progress' | 'completed' | 'expired';
}

interface AssessmentContextType {
    assessment: any | null;
    isLoading: boolean;
    error: any | null;
    refreshAssessment: () => Promise<void>;
    // Section Timer
    currentSectionTimer: SectionTimer;
    startSectionTimer: (sectionId: string) => Promise<void>;
    syncSectionTimer: (sectionId: string) => Promise<void>;
}

const defaultSectionTimer: SectionTimer = {
    sectionId: '',
    timeRemaining: 3600, // 1 hour in seconds
    timeLimit: 3600,
    startedAt: null,
    status: 'in_progress'
};

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider = ({ children, assessmentId }: { children: React.ReactNode, assessmentId: string }) => {
    // React Query for Assessment Data
    const {
        data: assessmentData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['assessment', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getAssessment(assessmentId);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2
    });

    const assessment = assessmentData?.assessment || null;

    // Timer State
    const [currentSectionTimer, setCurrentSectionTimer] = useState<SectionTimer>(defaultSectionTimer);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const refreshAssessment = async () => {
        await refetch();
    };

    // Sync section timer from backend (for page refresh/polling)
    const syncSectionTimer = useCallback(async (sectionId: string) => {
        try {
            console.log('⏱️ [Context] Syncing section timer for:', sectionId);

            const res = await contestantService.getAssessmentTimer(assessmentId, sectionId);
            if (res.data?.data) {
                const { timeLeft, status } = res.data.data;
                console.log('⏱️ [Context] Timer synced:', { timeLeft, status, sectionId });

                // Backend returns seconds directly now
                // Use current timeRemaining as fallback if backend doesn't provide timeLeft
                setCurrentSectionTimer(prev => {
                    const effectiveTimeRemaining = (timeLeft !== undefined && timeLeft !== null) ? timeLeft : prev.timeRemaining;

                    // Backend status 'running' maps to 'in_progress'
                    const isRunning = status === 'running';
                    const isExpired = status === 'expired' || (effectiveTimeRemaining <= 0 && isRunning);

                    // Drift check for Context
                    const currentLocalTime = prev.timeRemaining;
                    // Only update if we have a significant drift (> 2s) or if status changed
                    const drift = Math.abs(currentLocalTime - effectiveTimeRemaining);
                    const shouldUpdate = drift > 2 || prev.status !== status;

                    if (!shouldUpdate && isRunning) {
                        // Return previous state if valid and no drift
                        return prev;
                    }

                    console.log(`⏱️ [Context] Updating timer state (Drift: ${drift}s)`);

                    return {
                        ...prev,
                        sectionId: prev.sectionId || sectionId,
                        timeRemaining: Math.max(0, effectiveTimeRemaining), // Already in seconds
                        status: isExpired ? 'expired' : (status === 'completed' ? 'completed' : 'in_progress')
                    };
                });
            }
        } catch (err) {
            console.error('Timer sync failed:', err);
        }
    }, [assessmentId]);

    // Start section timer on backend and get time remaining
    const startSectionTimer = useCallback(async (sectionId: string) => {
        // Find section duration from loaded assessment data for immediate feedback
        const section = assessment?.sections?.find((s: any) => s.id === sectionId);
        // Default to 1 hour if not found, otherwise convert minutes to seconds
        // NOTE: AssessmentSection duration is typically in minutes
        const optimisticDuration = section?.duration ? section.duration * 60 : 3600;

        // Reset/Clear timer state immediately to prevent old status from triggering logic
        setCurrentSectionTimer({
            sectionId,
            timeRemaining: optimisticDuration,
            timeLimit: optimisticDuration,
            startedAt: null,
            status: 'in_progress'
        });

        // Parallel Fetch: Start Sync Immediately
        // This ensures that if the section is already running, we fetch the real time ASAP
        const syncPromise = syncSectionTimer(sectionId);

        try {
            console.log('⏱️ [Context] Starting section timer for:', sectionId);
            const res = await contestantService.startSection(assessmentId, sectionId);

            if (res.data?.data) {
                const { timeRemaining: serverTimeRemaining, timeLimit, startedAt } = res.data.data;
                console.log('⏱️ [Context] Section started response:', { serverTimeRemaining, timeLimit, startedAt });

                // If timeRemaining is not provided, fallback to timeLimit (fresh start)
                // If both are missing, use our optimistic duration
                const effectiveRemaining = (serverTimeRemaining !== undefined && serverTimeRemaining !== null)
                    ? serverTimeRemaining
                    : (timeLimit !== undefined && timeLimit !== null ? timeLimit : optimisticDuration);

                const effectiveLimit = timeLimit !== undefined && timeLimit !== null ? timeLimit : optimisticDuration;

                setCurrentSectionTimer({
                    sectionId,
                    timeRemaining: Math.max(0, effectiveRemaining), // Already in seconds
                    timeLimit: effectiveLimit, // Already in seconds
                    startedAt: startedAt || new Date().toISOString(),
                    status: 'in_progress'
                });
            }
        } catch (err: any) {
            console.error('Failed to start section timer:', err);
            // If section already started, await the sync that we already started
            if (err.response?.status === 400) {
                await syncPromise;
            }
        }
    }, [assessmentId, assessment, syncSectionTimer]);

    // Fetch assessment on mount - REMOVED (Handled by useQuery)
    // useEffect(() => {
    //     if (assessmentId) {
    //         fetchAssessment();
    //     }
    // }, [assessmentId]);

    // Local countdown (decrements every second)
    useEffect(() => {
        if (currentSectionTimer.status !== 'in_progress' || currentSectionTimer.timeRemaining <= 0) {
            return;
        }

        countdownRef.current = setInterval(() => {
            setCurrentSectionTimer(prev => {
                const newTime = Math.max(0, prev.timeRemaining - 1);
                if (newTime <= 0) {
                    return { ...prev, timeRemaining: 0, status: 'expired' };
                }
                return { ...prev, timeRemaining: newTime };
            });
        }, 1000);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [currentSectionTimer.status, currentSectionTimer.sectionId]);

    // Periodic sync with backend (every 5 seconds for real-time accuracy)
    useEffect(() => {
        if (!currentSectionTimer.sectionId || currentSectionTimer.status !== 'in_progress') {
            return;
        }

        // Initial sync on mount/change handled by startSectionTimer, but good to ensure
        const syncInterval = setInterval(() => {
            syncSectionTimer(currentSectionTimer.sectionId);
        }, 5000); // Sync every 5 seconds

        return () => clearInterval(syncInterval);
    }, [currentSectionTimer.sectionId, currentSectionTimer.status, syncSectionTimer]);

    return (
        <AssessmentContext.Provider value={{
            assessment,
            isLoading,
            error,
            refreshAssessment,
            currentSectionTimer,
            startSectionTimer,
            syncSectionTimer
        }}>
            {children}
        </AssessmentContext.Provider>
    );
};

export const useAssessment = () => {
    const context = useContext(AssessmentContext);
    if (!context) {
        throw new Error('useAssessment must be used within an AssessmentProvider');
    }
    return context;
};
