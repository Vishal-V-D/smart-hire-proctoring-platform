'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, AlertTriangle, Eye, EyeOff, Monitor,
    Copy, MousePointer2, Maximize2, X, Volume2, Brain, Scan
} from 'lucide-react';
import { contestantService, type ViolationType } from '@/api/contestantService';
import { useAIProctoring } from '@/hooks/useAIProctoring';

interface ProctoringSettings {
    enabled: boolean;
    imageMonitoring: boolean;
    videoMonitoring: boolean;
    screenRecording: boolean;
    audioMonitoring: boolean;
    objectDetection: boolean;
    personDetection: boolean;
    faceDetection: boolean;
    fullscreen: boolean;
    tabSwitchLimit: number;
    disableCopyPaste: boolean;
    blockRightClick: boolean;
}

interface Violation {
    type: ViolationType;
    timestamp: string;
    metadata?: any;
}

interface StoredViolation extends Violation { } // Assuming this is the new type for violations state

interface ProctoringOverlayProps {
    settings: ProctoringSettings;
    assessmentId: string;
    onViolation?: (type: ViolationType, metadata?: any) => void;
    hideCamera?: boolean; // New prop to optionally hide camera feed
    storedPhotoUrl?: string; // URL of stored photo for face verification
    enableAIProctoring?: boolean; // Enable AI-based proctoring
}

// ... imports

const ProctoringOverlay: React.FC<ProctoringOverlayProps> = ({
    settings,
    assessmentId,
    onViolation,
    hideCamera = false,
    storedPhotoUrl,
    enableAIProctoring = true
}) => {
    // State Definitions
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null); // Added missing ref
    const aiCanvasRef = useRef<HTMLCanvasElement>(null);

    // UI State
    const [showCamera, setShowCamera] = useState(true); // Added missing state
    const [videoPosition, setVideoPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [tabSwitchCount, setTabSwitchCount] = useState(0); // Added missing state
    const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null); // Added missing state
    const [showAIStatus, setShowAIStatus] = useState(false);

    // AI Proctoring Hook
    const [effectivePhotoUrl, setEffectivePhotoUrl] = useState(storedPhotoUrl);

    useEffect(() => {
        if (!effectivePhotoUrl) {
            const stored = localStorage.getItem('storedPhotoUrl');
            if (stored) {
                console.log('🔄 ProctoringOverlay: Loaded stored photo for verification:', stored);
                setEffectivePhotoUrl(stored);
            }
        }
    }, [effectivePhotoUrl]);

    const {
        status: aiStatus,
        violations: aiViolations,
        isInitialized: aiInitialized,
        startProctoring,
        stopProctoring,
        loadStoredPhoto
    } = useAIProctoring({
        storedPhotoUrl: effectivePhotoUrl,
        faceVerificationEnabled: settings?.faceDetection && !!effectivePhotoUrl,
        faceDetectionEnabled: settings?.faceDetection,
        gazeTrackingEnabled: settings?.faceDetection,
        objectDetectionEnabled: settings?.objectDetection,
        verificationThreshold: 0.5,
        gazeDeviationThreshold: 0.4,
        onViolation: (aiViolation) => {
            // Map AI violation to proctoring violation
            const violationMap: Record<string, ViolationType> = {
                'no_face': 'no_face',
                'multiple_faces': 'multiple_people',
                'face_mismatch': 'no_face',
                'looking_away': 'looking_away',
                'looking_down': 'looking_away',
                'looking_up': 'looking_away',
                'prohibited_object': 'prohibited_object',
                'face_covered': 'camera_blocked'
            };
            const mappedType = violationMap[aiViolation.type] || aiViolation.type as ViolationType;
            recordViolation(mappedType, aiViolation.metadata);
        }
    });

    // Callback ref to attach stream immediately when video element is created
    const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
            node.play().catch((err) => {
                console.log('Video play failed in setVideoRef:', err);
            });
        }
    }, []);

    // Violations
    const [violations, setViolations] = useState<StoredViolation[]>([]);
    const violationQueueRef = useRef<StoredViolation[]>([]); // Renamed to match usage
    const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const recordViolation = useCallback((type: ViolationType, metadata?: any) => {
        const violation: StoredViolation = {
            type,
            timestamp: new Date().toISOString(),
            metadata,
        };
        setViolations(prev => [...prev, violation]);
        violationQueueRef.current.push(violation);
        onViolation?.(type, metadata);

        // Show toast
        const messages: Record<ViolationType, string> = {
            'window_swap': '⚠️ Window switch detected',
            'tab_switch': '⚠️ Tab switch detected',
            'full_screen_exit': '⚠️ Fullscreen exit detected',
            'multiple_people': '⚠️ Multiple people detected',
            'no_face': '⚠️ Face not visible',
            'looking_away': '⚠️ Looking away from screen',
            'camera_blocked': '⚠️ Camera blocked',
            'mic_muted': '⚠️ Microphone muted',
            'prohibited_object': '⚠️ Prohibited object detected',
            'right_click': '⚠️ Right-click blocked',
            'copy_paste': '⚠️ Copy/Paste blocked'
        };

        setToast({ message: messages[type] || `⚠️ ${type}`, type: 'warning' });
        setTimeout(() => setToast(null), 3000);
    }, [onViolation]);

    // Send violations to backend
    const sendViolations = useCallback(async () => {
        if (violationQueueRef.current.length === 0) return;

        const batch = [...violationQueueRef.current];
        violationQueueRef.current = [];

        try {
            const sessionToken = sessionStorage.getItem('sessionToken') || '';
            for (const v of batch) {
                await contestantService.recordViolation(sessionToken, v.type, v.metadata);
            }
            console.log(`✅ Sent ${batch.length} violations to backend`);
        } catch (err) {
            console.error('❌ Failed to send violations:', err);
            // Re-queue on failure
            violationQueueRef.current.push(...batch);
        }
    }, []);

    // Initialize camera
    useEffect(() => {
        if (!settings?.videoMonitoring || !settings?.enabled) {
            console.log('Camera disabled: videoMonitoring=', settings?.videoMonitoring, 'enabled=', settings?.enabled);
            return;
        }

        console.log('Starting camera...');

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: settings.audioMonitoring || false
                });
                console.log('Camera stream obtained:', mediaStream);
                streamRef.current = mediaStream;
                setStream(mediaStream);

                // Attach to video element if available
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(e => console.log('Video play failed:', e));
                }
            } catch (err) {
                console.error('Camera access denied:', err);
                recordViolation('camera_blocked', { reason: 'access_denied' });
            }
        };

        startCamera();

        return () => {
            console.log('Stopping camera tracks...');
            streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        };
    }, [settings?.videoMonitoring, settings?.enabled, settings?.audioMonitoring, recordViolation]);

    // Ensure video element always has the stream attached when visibility changes
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(err => console.log('Video play error:', err));
        }
    }, [showCamera, stream, hideCamera]);

    // Start AI proctoring when video is FULLY ready (with valid dimensions)
    useEffect(() => {
        // Log all conditions for debugging
        console.log('🔍 AI Proctoring Check:', {
            enableAIProctoring,
            hasVideoRef: !!videoRef.current,
            hasStream: !!stream,
            faceDetection: settings?.faceDetection,
            objectDetection: settings?.objectDetection
        });

        if (!enableAIProctoring) {
            console.log('🔴 AI Proctoring disabled by prop');
            return;
        }

        if (!settings?.faceDetection && !settings?.objectDetection) {
            console.log('🔴 Both face and object detection disabled in settings');
            return;
        }

        if (!videoRef.current) {
            console.log('⏳ Waiting for video element...');
            return;
        }

        if (!stream) {
            console.log('⏳ Waiting for camera stream...');
            return;
        }

        const video = videoRef.current;

        // Function to start proctoring once video is ready
        const startWhenReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                console.log('🚀 Starting AI Proctoring with:', {
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    streamActive: stream.active
                });
                startProctoring(video, aiCanvasRef.current ?? undefined);
            } else {
                console.log('⏳ Video dimensions not ready yet, waiting for loadedmetadata...');
            }
        };

        // Check if video already has metadata loaded
        if (video.readyState >= 1 && video.videoWidth > 0) {
            startWhenReady();
        } else {
            // Wait for video metadata to load
            const handleLoadedMetadata = () => {
                console.log('📹 Video metadata loaded:', {
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight
                });
                startWhenReady();
            };

            video.addEventListener('loadedmetadata', handleLoadedMetadata);

            return () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                console.log('🛑 Stopping AI Proctoring (cleanup)');
                stopProctoring();
            };
        }

        return () => {
            console.log('🛑 Stopping AI Proctoring (cleanup)');
            stopProctoring();
        };
    }, [enableAIProctoring, stream, settings?.faceDetection, settings?.objectDetection, startProctoring, stopProctoring]);

    // Fullscreen detection
    useEffect(() => {
        if (!settings?.fullscreen || !settings?.enabled) {
            console.log("Proctoring: Fullscreen enforcement disabled or settings missing", settings);
            return;
        }

        console.log("Proctoring: Fullscreen enforcement INITIALIZED");

        // Auto-enter fullscreen attempt on mount
        const enterFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.log("Auto-fullscreen failed (likely needs user interaction):", err);
            }
        };
        enterFullscreen();

        // Aggressive Fullscreen: Setup listener on ANY click/keydown to force fullscreen if not active
        // This solves the "user permission" issue by using their natural interaction to trigger it
        const forceFullscreenOnInteraction = () => {
            if (settings.fullscreen && !document.fullscreenElement) {
                enterFullscreen();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('click', forceFullscreenOnInteraction);
            window.addEventListener('keydown', forceFullscreenOnInteraction);
        }

        const checkFullscreen = () => {
            // Robust check for different browsers
            const isFull = !!document.fullscreenElement ||
                !!(document as any).webkitFullscreenElement ||
                !!(document as any).mozFullScreenElement ||
                !!(document as any).msFullscreenElement;

            console.log(`Proctoring: Fullscreen Check -> Active: ${isFull}`);
            setIsFullScreen(isFull);

            // If strictly enforced, block interaction until full
            if (!isFull) {
                console.warn("Proctoring: Fullscreen violation detected!");
                recordViolation('full_screen_exit');
            }
        };

        const handleFullscreenChange = () => {
            console.log("Proctoring: Fullscreen change event fired");
            checkFullscreen();
        };

        // Listen for standard and vendor-prefixed events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Perform immediate check
        checkFullscreen();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            window.removeEventListener('click', forceFullscreenOnInteraction);
            window.removeEventListener('keydown', forceFullscreenOnInteraction);
        };
    }, [settings?.fullscreen, settings?.enabled, recordViolation]);

    // Tab switch detection
    useEffect(() => {
        if (!settings?.enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    recordViolation('tab_switch', { count: newCount });
                    return newCount;
                });
            }
        };

        const handleBlur = () => {
            recordViolation('window_swap');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [settings?.enabled, recordViolation]);

    // Copy/Paste blocking
    useEffect(() => {
        if (!settings?.disableCopyPaste || !settings?.enabled) return;

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            recordViolation('copy_paste', { action: 'copy' });
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            recordViolation('copy_paste', { action: 'paste' });
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            recordViolation('copy_paste', { action: 'cut' });
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
        };
    }, [settings?.disableCopyPaste, settings?.enabled, recordViolation]);

    // Right-click blocking
    useEffect(() => {
        if (!settings?.blockRightClick || !settings?.enabled) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            recordViolation('right_click');
        };

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [settings?.blockRightClick, settings?.enabled, recordViolation]);

    // Developer Tools & Inspector blocking
    useEffect(() => {
        if (!settings?.enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block F12
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
                recordViolation('prohibited_object', { reason: 'dev_tools_attempt' });
                return;
            }

            // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
            // Block Ctrl+U (View Source)
            if (e.ctrlKey && (e.shiftKey || e.key === 'u' || e.key === 'U')) {
                const key = e.key.toLowerCase();
                if (key === 'i' || key === 'j' || key === 'c' || key === 'u') {
                    e.preventDefault();
                    e.stopPropagation();
                    recordViolation('prohibited_object', { reason: 'dev_tools_attempt' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [settings?.enabled, recordViolation]);

    // Send violations every 5 seconds
    useEffect(() => {
        sendIntervalRef.current = setInterval(sendViolations, 5000);
        return () => {
            if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
        };
    }, [sendViolations]);

    // Fullscreen detection defined below...
    /* // ... */

    return (
        <>
            {/* 
                CORRECTED IMPLEMENTATION FOR PERSISTENCE:
                We render the video container ALWAYS.
                We control its VISIBILITY and POSITION based on `hideCamera`.
                If `hideCamera` is true, we move it off-screen or make it invisible, 
                BUT IT STAYS MOUNTED.
            */}
            {settings?.videoMonitoring && (
                <motion.div
                    drag={!hideCamera} // Only drag if visible
                    dragMomentum={false}
                    // If hidden, fix position off-screen or hidden. 
                    // Actually, if hideCamera is true, we just want it to disappear visually.
                    // We can use a highly transparent or hidden state.
                    initial={false}
                    animate={{
                        opacity: (hideCamera || (settings.fullscreen && !isFullScreen)) ? 0 : 1,
                        scale: (hideCamera || (settings.fullscreen && !isFullScreen)) ? 0.5 : 1,
                        x: (hideCamera) ? -9999 : 0 // Move away if hidden to prevent interaction
                    }}
                    transition={{ duration: 0.5 }}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                    className="fixed z-[9999] bottom-20 left-5 select-none"
                    style={{
                        touchAction: 'none',
                        pointerEvents: (hideCamera || (settings.fullscreen && !isFullScreen)) ? 'none' : 'auto'
                    }}
                >
                    <div className="relative">
                        <div className={`relative rounded-xl overflow-hidden shadow-2xl border-2 border-indigo-500/50 bg-gray-900 ${showCamera ? 'w-48 h-36' : 'w-12 h-12'} transition-all duration-300`}>
                            <video
                                ref={setVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`absolute inset-0 w-full h-full object-cover ${showCamera ? 'opacity-100' : 'opacity-0'}`}
                                style={{ transform: 'scaleX(-1)', backgroundColor: '#1a1a1a' }}
                                onLoadedMetadata={(e) => {
                                    const video = e.target as HTMLVideoElement;
                                    video.play().catch(() => { });
                                }}
                            />

                            {/* Only show controls if NOT hidden */}
                            {!hideCamera && (
                                <>
                                    {!showCamera && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                            <Camera className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                                            REC
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowCamera(!showCamera)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
                                    >
                                        {showCamera ? (
                                            <EyeOff className="w-3 h-3 text-white" />
                                        ) : (
                                            <Eye className="w-3 h-3 text-white" />
                                        )}
                                    </button>
                                </>
                            )}

                            {/* AI Status / Visualization */}
                            {/* We want aiCanvas to be present for drawing even if hidden, 
                                but if hidden we don't need to SEE it. 
                                However, useAIProctoring might draw to it. */}
                            <canvas
                                ref={aiCanvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
                            />

                            {/* AI Status Text - Only if visible */}
                            {enableAIProctoring && aiStatus.isRunning && showCamera && !hideCamera && (
                                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Brain className={`w-3 h-3 ${aiStatus.faceDetected ? 'text-green-400' : 'text-red-400'}`} />
                                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${aiStatus.faceCount > 1
                                                ? 'text-white bg-red-600 animate-pulse'
                                                : 'text-white bg-black/60'
                                                }`}>
                                                {aiStatus.faceDetected
                                                    ? `Faces: ${aiStatus.faceCount}`
                                                    : 'No Face'}
                                            </span>
                                        </div>
                                        {aiStatus.isVerified && (
                                            <span className="text-[9px] font-bold text-green-400 bg-black/60 px-1 py-0.5 rounded">
                                                ID ✓
                                            </span>
                                        )}
                                    </div>
                                    {aiStatus.faceCount > 1 && (
                                        <div className="text-[8px] text-center text-white bg-red-600/90 px-1 rounded animate-pulse">
                                            Multiple Faces Detected!
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Violation Counter - Only if visible */}
                        {violations.length > 0 && !hideCamera && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                            >
                                {violations.length}
                            </motion.div>
                        )}
                    </div>

                    {/* Stats - Hidden by default, only visible on hover (no black box when hidden) */}
                    {!hideCamera && (
                        <div className="hidden group-hover:block mt-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 border border-border text-xs space-y-1">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Tab Switches</span>
                                <span className={`font-bold ${tabSwitchCount > 2 ? 'text-red-500' : 'text-foreground'}`}>
                                    {tabSwitchCount}/{settings.tabSwitchLimit || '∞'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Violations</span>
                                <span className="font-bold text-amber-500">{violations.length}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Proctoring Status Bar (non-camera) */}



            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[101] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
                            } text-white font-medium`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Warning - Use isFullScreen state instead of direct document check for smoother UI */}
            {settings.fullscreen && !isFullScreen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[102] bg-background/95 backdrop-blur-sm flex items-center justify-center"
                >
                    <div className="text-center p-8 max-w-md">
                        <Maximize2 className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Fullscreen Required</h2>
                        <p className="text-muted-foreground mb-6">
                            This assessment requires fullscreen mode. Please click below to continue.
                        </p>
                        <button
                            onClick={() => document.documentElement.requestFullscreen()}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
                        >
                            Enter Fullscreen
                        </button>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default ProctoringOverlay;
