import React, { useEffect, useRef, useState } from 'react';
import { ProctoringSettings, contestantService } from '@/api/contestantService';
import { toast } from 'react-toastify';

interface ProctoringMonitorProps {
    settings: ProctoringSettings;
    onViolation?: (type: string, msg: string) => void;
}

export default function ProctoringMonitor({ settings, onViolation }: ProctoringMonitorProps) {
    const { sessionToken } = contestantService.getSession();
    const tabSwitches = useRef(0);
    const isFullscreen = useRef(false);

    // Warn state to prevent spamming violations
    const lastViolationTime = useRef<Record<string, number>>({});

    const reportViolation = async (type: any, message: string) => {
        // Debounce violation reporting (e.g. 5 seconds per type)
        const now = Date.now();
        if (lastViolationTime.current[type] && now - lastViolationTime.current[type] < 5000) {
            return;
        }
        lastViolationTime.current[type] = now;

        console.warn(`[PROCTORING] Violation: ${type} - ${message}`);

        if (onViolation) {
            onViolation(type, message);
        }

        // Show toast to user
        toast.error(message, {
            autoClose: 4000
        });

        if (sessionToken) {
            try {
                await contestantService.recordViolation(sessionToken, type, { message });
            } catch (err) {
                console.error("Failed to record violation", err);
            }
        }
    };

    // --- 1. Fullscreen Enforcement ---
    useEffect(() => {
        if (!settings.fullscreen) return;

        const checkFullscreen = () => {
            const isFull = !!document.fullscreenElement;
            isFullscreen.current = isFull;

            if (!isFull) {
                // Warning only initially? Or immediate violation?
                // Let's record violation but maybe not terminate immediately (that logic usually in parent)
                reportViolation('full_screen_exit', 'You exited fullscreen mode. Please return to fullscreen immediately.');
            }
        };

        document.addEventListener('fullscreenchange', checkFullscreen);

        // Initial check interval?
        const interval = setInterval(() => {
            if (!document.fullscreenElement && settings.fullscreen) {
                reportViolation('full_screen_exit', 'Fullscreen is required for this assessment.');
            }
        }, 5000);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            clearInterval(interval);
        };
    }, [settings.fullscreen]);

    // --- 2. Tab Switch / Window Blur ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabSwitches.current += 1;

                const limit = settings.tabSwitchLimit || 10;
                const remaining = limit - tabSwitches.current;

                if (remaining >= 0) {
                    reportViolation('tab_switch', `Warning: Tab switching is monitored. You have ${remaining} warnings left.`);
                } else {
                    reportViolation('tab_switch', `Critical: Tab switch limit exceeded.`);
                }
            }
        };

        const handleBlur = () => {
            // Often redundant with visibility change but catches window focus loss (e.g. opening another app)
            // We can treat it similar to tab switch or separate 'window_swap'
            reportViolation('window_swap', 'Focus lost: Please keep the assessment window active.');
        };

        if (settings.enabled) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [settings]);

    // --- 3. Copy/Paste Blocking ---
    useEffect(() => {
        if (!settings.disableCopyPaste) return;

        const preventAction = (e: Event) => {
            e.preventDefault();
            reportViolation('copy_paste', 'Copy/Paste is disabled for this assessment.');
        };

        window.addEventListener('copy', preventAction);
        window.addEventListener('paste', preventAction);
        window.addEventListener('cut', preventAction);

        return () => {
            window.removeEventListener('copy', preventAction);
            window.removeEventListener('paste', preventAction);
            window.removeEventListener('cut', preventAction);
        };
    }, [settings.disableCopyPaste]);

    // --- 4. Right Click Blocking ---
    useEffect(() => {
        if (!settings.blockRightClick) return;

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // Don't report violation for right click usually, just block it logic-wise. 
            // Or report strictly? Let's report.
            reportViolation('right_click', 'Right-click menu is disabled.');
        };

        window.addEventListener('contextmenu', preventContextMenu);

        return () => {
            window.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [settings.blockRightClick]);

    return (
        <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            {/* 
                We can add a subtle UI indicator here like "Proctoring Active"
                or a red dot if recording
            */}
            <div className="bg-background/80 backdrop-blur border border-border rounded-full px-3 py-1 flex items-center gap-2 shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Monitoring Active</span>
            </div>
        </div>
    );
}
