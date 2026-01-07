'use client';

/**
 * useAIProctoring - React Hook for AI Proctoring
 * 
 * Easy integration of AI proctoring features into React components.
 * 
 * Usage:
 * ```tsx
 * const { 
 *   status, 
 *   violations, 
 *   startProctoring, 
 *   stopProctoring,
 *   verifyFace 
 * } = useAIProctoring({
 *   storedPhotoUrl: 'https://...',
 *   onViolation: (v) => console.log(v)
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AIProctoringService,
    ProctoringConfig,
    ProctoringStatus,
    ProctoringViolation,
    VerificationResult,
    getAIProctoringService
} from '@/services/AIProctoringService';

export interface UseAIProctoringOptions {
    // Required
    storedPhotoUrl?: string;

    // Optional config
    faceVerificationEnabled?: boolean;
    faceDetectionEnabled?: boolean;
    gazeTrackingEnabled?: boolean;
    objectDetectionEnabled?: boolean;
    verificationThreshold?: number;
    gazeDeviationThreshold?: number;

    // Callbacks
    onViolation?: (violation: ProctoringViolation) => void;
    onStatusChange?: (status: ProctoringStatus) => void;
    onVerificationResult?: (result: VerificationResult) => void;
    onError?: (error: Error) => void;

    // Auto-start when video is ready
    autoStart?: boolean;
}

export interface UseAIProctoringReturn {
    // State
    status: ProctoringStatus;
    violations: ProctoringViolation[];
    isInitialized: boolean;
    isRunning: boolean;
    isVerified: boolean;
    error: Error | null;

    // Actions
    initialize: () => Promise<boolean>;
    startProctoring: (videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement) => Promise<void>;
    stopProctoring: () => void;
    verifyFace: (imageUrl: string) => Promise<VerificationResult>;
    loadStoredPhoto: (photoUrl: string) => Promise<boolean>;
    captureSnapshot: () => string | null;
    clearViolations: () => void;

    // Refs for video/canvas
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useAIProctoring(options: UseAIProctoringOptions = {}): UseAIProctoringReturn {
    const {
        storedPhotoUrl,
        faceVerificationEnabled = true,
        faceDetectionEnabled = true,
        gazeTrackingEnabled = true,
        objectDetectionEnabled = false,
        verificationThreshold = 0.5,
        gazeDeviationThreshold = 0.4,
        onViolation,
        onStatusChange,
        onVerificationResult,
        onError,
        autoStart = false
    } = options;

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const serviceRef = useRef<AIProctoringService | null>(null);

    // State
    const [status, setStatus] = useState<ProctoringStatus>({
        isRunning: false,
        faceDetected: false,
        faceCount: 0,
        isVerified: false,
        gazeDirection: { yaw: 0, pitch: 0, roll: 0 },
        fps: 0
    });
    const [violations, setViolations] = useState<ProctoringViolation[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Keep latest options in a ref to avoid re-initializing when callbacks change
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Initialize service
    const initialize = useCallback(async (): Promise<boolean> => {
        try {
            const currentOptions = optionsRef.current;
            const config: Partial<ProctoringConfig> = {
                faceVerificationEnabled: currentOptions.faceVerificationEnabled,
                faceDetectionEnabled: currentOptions.faceDetectionEnabled,
                gazeTrackingEnabled: currentOptions.gazeTrackingEnabled,
                objectDetectionEnabled: currentOptions.objectDetectionEnabled,
                verificationThreshold: currentOptions.verificationThreshold,
                gazeDeviationThreshold: currentOptions.gazeDeviationThreshold,
                onViolation: (violation) => {
                    setViolations(prev => [...prev, violation]);
                    optionsRef.current.onViolation?.(violation);
                },
                onStatusChange: (newStatus) => {
                    setStatus(newStatus);
                    optionsRef.current.onStatusChange?.(newStatus);
                },
                onVerificationResult: (result) => {
                    optionsRef.current.onVerificationResult?.(result);
                }
            };

            const service = getAIProctoringService(config);
            serviceRef.current = service;

            const success = await service.initialize();
            setIsInitialized(success);

            if (success && currentOptions.storedPhotoUrl) {
                await service.loadStoredPhoto(currentOptions.storedPhotoUrl);
            }

            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to initialize proctoring');
            setError(error);
            optionsRef.current.onError?.(error);
            return false;
        }
    }, [
        // Only re-initialize if core config flags change, NOT callbacks
        options.faceVerificationEnabled,
        options.faceDetectionEnabled,
        options.gazeTrackingEnabled,
        options.objectDetectionEnabled,
        options.verificationThreshold,
        options.gazeDeviationThreshold,
        options.storedPhotoUrl
    ]);

    // Start proctoring
    const startProctoring = useCallback(async (
        videoElement: HTMLVideoElement,
        canvasElement?: HTMLCanvasElement
    ): Promise<void> => {
        console.log('🎬 useAIProctoring.startProctoring called', {
            hasVideoElement: !!videoElement,
            videoWidth: videoElement?.videoWidth,
            videoHeight: videoElement?.videoHeight,
            hasService: !!serviceRef.current
        });

        try {
            if (!serviceRef.current) {
                console.log('🔧 No service yet, initializing...');
                await initialize();
            }

            if (serviceRef.current) {
                console.log('▶️ Calling service.start()...');
                await serviceRef.current.start(videoElement, canvasElement);
            } else {
                console.error('❌ Service still null after initialization!');
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to start proctoring');
            console.error('❌ startProctoring error:', error);
            setError(error);
            optionsRef.current.onError?.(error);
        }
    }, [initialize]);

    // Stop proctoring
    const stopProctoring = useCallback((): void => {
        serviceRef.current?.stop();
    }, []);

    // Verify face
    const verifyFace = useCallback(async (imageUrl: string): Promise<VerificationResult> => {
        if (!serviceRef.current) {
            throw new Error('Proctoring service not initialized');
        }
        return serviceRef.current.verifyImage(imageUrl);
    }, []);

    // Load stored photo
    const loadStoredPhoto = useCallback(async (photoUrl: string): Promise<boolean> => {
        if (!serviceRef.current) {
            await initialize();
        }
        return serviceRef.current?.loadStoredPhoto(photoUrl) ?? false;
    }, [initialize]);

    // Capture snapshot
    const captureSnapshot = useCallback((): string | null => {
        return serviceRef.current?.captureSnapshot() ?? null;
    }, []);

    // Clear violations
    const clearViolations = useCallback((): void => {
        setViolations([]);
    }, []);

    // Auto-start effect
    useEffect(() => {
        if (autoStart && videoRef.current && !status.isRunning) {
            const video = videoRef.current;

            const handleCanPlay = () => {
                startProctoring(video, canvasRef.current ?? undefined);
            };

            if (video.readyState >= 3) {
                handleCanPlay();
            } else {
                video.addEventListener('canplay', handleCanPlay);
                return () => video.removeEventListener('canplay', handleCanPlay);
            }
        }
    }, [autoStart, startProctoring, status.isRunning]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            serviceRef.current?.stop();
        };
    }, []);

    return {
        status,
        violations,
        isInitialized,
        isRunning: status.isRunning,
        isVerified: status.isVerified,
        error,
        initialize,
        startProctoring,
        stopProctoring,
        verifyFace,
        loadStoredPhoto,
        captureSnapshot,
        clearViolations,
        videoRef,
        canvasRef
    };
}

export default useAIProctoring;
