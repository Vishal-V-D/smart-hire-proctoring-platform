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

    // Start section timer on backend and get time remaining
    const startSectionTimer = useCallback(async (sectionId: string) => {
        // Reset/Clear timer state immediately to prevent old status from triggering logic
        setCurrentSectionTimer({
            sectionId,
            timeRemaining: 3600, // Temporary safe value
            timeLimit: 3600,
            startedAt: null,
            status: 'in_progress'
        });

        try {
            console.log('⏱️ [Context] Starting section timer for:', sectionId);
            const res = await contestantService.startSection(assessmentId, sectionId);

            if (res.data?.data) {
                const { timeRemaining: serverTimeRemaining, timeLimit, startedAt } = res.data.data;
                console.log('⏱️ [Context] Section started response:', { serverTimeRemaining, timeLimit, startedAt });

                // If timeRemaining is not provided, fallback to timeLimit (fresh start)
                // If both are missing, default to 60 minutes
                const effectiveRemaining = (serverTimeRemaining !== undefined && serverTimeRemaining !== null)
                    ? serverTimeRemaining
                    : (timeLimit !== undefined && timeLimit !== null ? timeLimit : 60);

                const effectiveLimit = timeLimit !== undefined && timeLimit !== null ? timeLimit : 60;

                setCurrentSectionTimer({
                    sectionId,
                    timeRemaining: Math.max(0, effectiveRemaining * 60), // Convert minutes to seconds
                    timeLimit: effectiveLimit * 60,
                    startedAt: startedAt || new Date().toISOString(),
                    status: 'in_progress'
                });
            }
        } catch (err: any) {
            console.error('Failed to start section timer:', err);
            // If section already started, try to sync instead
            if (err.response?.status === 400) {
                await syncSectionTimer(sectionId);
            }
        }
    }, [assessmentId]);

    // Sync section timer from backend (for page refresh/polling)
    const syncSectionTimer = useCallback(async (sectionId: string) => {
        try {
            console.log('⏱️ [Context] Syncing section timer for:', sectionId);

            const res = await contestantService.getAssessmentTimer(assessmentId);
            if (res.data?.data) {
                const data = res.data.data as any; // Cast to any to avoid type errors for now
                const { globalTimeRemaining, status, timeMode } = data;
                console.log('⏱️ [Context] Timer synced:', { globalTimeRemaining, status, timeMode });

                // If the backend returns explicit null/undefined for time but status is running/in_progress,
                // we should be careful not to set it to 0.
                const effectiveTime = (globalTimeRemaining !== undefined && globalTimeRemaining !== null)
                    ? globalTimeRemaining
                    : 0;

                // Backend status 'running' maps to 'in_progress'
                const isRunning = status === 'running' || status === 'in_progress';
                const isExpired = status === 'expired' || (effectiveTime <= 0 && isRunning);

                setCurrentSectionTimer(prev => ({
                    ...prev,
                    sectionId: prev.sectionId || sectionId,
                    timeRemaining: Math.max(0, effectiveTime * 60), // Convert to seconds
                    status: isExpired ? 'expired' : 'in_progress'
                }));
            }
        } catch (err) {
            console.error('Timer sync failed:', err);
        }
    }, [assessmentId]);

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

    // Periodic sync with backend (every 60 seconds to not overload)
    useEffect(() => {
        if (!currentSectionTimer.sectionId || currentSectionTimer.status !== 'in_progress') {
            return;
        }

        const syncInterval = setInterval(() => {
            syncSectionTimer(currentSectionTimer.sectionId);
        }, 60000); // Sync every 60 seconds

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
