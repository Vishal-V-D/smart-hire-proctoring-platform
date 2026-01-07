/**
 * WebcamOverlay Component
 * 
 * Unified proctoring overlay with:
 * - Face-api.js for face recognition AND counting
 * - Web Audio API for noise/audio detection
 * - Black screen/camera covered detection
 * - Violation reporting to backend
 */

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertTriangle, Volume2, Users, CheckCircle, EyeOff } from 'lucide-react';
import {
    loadFaceModels,
    createFaceDescriptor,
    detectAndRecognizeFaces,
    ViolationTracker,
    type FaceDetectionResult
} from '../utils/faceDetection';
import { useObjectDetection } from '../hooks/useObjectDetection';

interface WebcamOverlayProps {
    mediaStream: MediaStream | null;
    theme: 'dark' | 'light';
    violationCount: number;
    userPhotoUrl?: string;
    userId?: string;
    contestId?: string;
    onViolation?: (type: string, metadata?: any) => void;
    faceDetectionInterval?: number;
    audioCheckInterval?: number;
    noiseThreshold?: number;
    blackScreenThreshold?: number;
}

type ViolationType =
    | 'NO_FACE_DETECTED'
    | 'MULTIPLE_FACES'
    | 'FACE_MISMATCH'
    | 'AUDIO_NOISE_DETECTED'
    | 'SCREEN_BLACK_DETECTED'
    | 'UNWANTED_OBJECT_DETECTED';

export const WebcamOverlay: React.FC<WebcamOverlayProps> = ({
    mediaStream,
    theme: _theme,
    violationCount,
    userPhotoUrl,
    userId: _userId,
    contestId: _contestId,
    onViolation,
    faceDetectionInterval = 2000,
    audioCheckInterval = 1000,
    noiseThreshold = -25,
    blackScreenThreshold = 20
}) => {
    // ==================== REFS ====================
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const violationTracker = useRef(new ViolationTracker(5000));
    const detectionCountRef = useRef(0);

    // ==================== STATE ====================
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceStatus, setFaceStatus] = useState<FaceDetectionResult['status'] | 'loading'>('loading');
    const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
    const [matchConfidence, setMatchConfidence] = useState(0); // Used in confidence display
    const [faceCount, setFaceCount] = useState<number>(-1);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [audioLevel, setAudioLevel] = useState<number>(-100);
    const [isScreenBlack, setIsScreenBlack] = useState(false);

    // Object detection
    const {
        modelLoaded: objectModelLoaded,
        suspiciousObjects,
        violations: objectViolations
    } = useObjectDetection({
        videoElement: videoRef.current,
        enabled: true,
        detectionInterval: 3000
    });

    // UI State
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<'success' | 'warning' | 'error'>('success');

    // Dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({
        x: typeof window !== 'undefined' ? window.innerWidth - 200 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight - 180 : 0
    });

    // ==================== NOTIFICATION ====================
    const showNotif = useCallback((msg: string, type: 'success' | 'warning' | 'error') => {
        console.log(`🔔 [NOTIFY] ${type}: ${msg}`);
        setNotificationMessage(msg);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    }, []);

    // ==================== REPORT VIOLATION ====================
    const reportViolation = useCallback(async (type: ViolationType, metadata?: any) => {
        if (!violationTracker.current.shouldReport(type)) return;

        console.log(`\n${'🚨'.repeat(10)}`);
        console.log(`🚨 [VIOLATION] ${type}`, metadata);
        console.log(`${'🚨'.repeat(10)}\n`);

        if (onViolation) {
            try {
                await onViolation(type, { ...metadata, timestamp: new Date().toISOString() });
            } catch (error) {
                console.error(`❌ [VIOLATION] Failed:`, error);
            }
        }

        const msgs: Record<ViolationType, string> = {
            'NO_FACE_DETECTED': '⚠️ No Face!',
            'MULTIPLE_FACES': `🚨 ${metadata?.faceCount || 'Multiple'} Faces!`,
            'FACE_MISMATCH': '❌ Wrong Person!',
            'AUDIO_NOISE_DETECTED': '🔊 Loud Audio!',
            'SCREEN_BLACK_DETECTED': '⚫ Camera Blocked!',
            'UNWANTED_OBJECT_DETECTED': `📱 ${metadata?.objects?.map((o: any) => o.class).join(', ') || 'Suspicious Object'}!`
        };
        showNotif(msgs[type], type === 'MULTIPLE_FACES' || type === 'FACE_MISMATCH' ? 'error' : 'warning');
    }, [onViolation, showNotif]);

    // ==================== SCREEN BRIGHTNESS CHECK ====================
    const checkBrightness = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 100;
        canvas.height = 75;
        ctx.drawImage(video, 0, 0, 100, 75);

        const data = ctx.getImageData(0, 0, 100, 75).data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            brightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        const avg = brightness / (data.length / 4);
        const isBlack = avg < blackScreenThreshold;

        console.log(`📺 [SCREEN] Brightness: ${avg.toFixed(0)} | Black: ${isBlack ? '⚫' : '✅'}`);
        setIsScreenBlack(isBlack);

        if (isBlack) {
            reportViolation('SCREEN_BLACK_DETECTED', { brightness: avg });
        }
    }, [blackScreenThreshold, reportViolation]);

    // ==================== LOAD MODELS ====================
    useEffect(() => {
        const load = async () => {
            try {
                console.log('🔄 [MODELS] Loading face-api.js...');
                await loadFaceModels();
                setModelsLoaded(true);
                console.log('✅ [MODELS] Ready!');
                showNotif('✅ Face Detection Ready', 'success');
            } catch (error) {
                console.error('❌ [MODELS] Failed:', error);
                showNotif('❌ Detection Failed', 'error');
            }
        };
        load();
    }, [showNotif]);

    // ==================== LOAD REFERENCE PHOTO ====================
    useEffect(() => {
        if (!modelsLoaded || !userPhotoUrl) return;
        const load = async () => {
            try {
                console.log('🔄 [REF] Loading reference...');
                const desc = await createFaceDescriptor(userPhotoUrl);
                if (desc) {
                    setReferenceDescriptor(desc);
                    console.log('✅ [REF] Loaded!');
                    showNotif('✅ Reference Loaded', 'success');
                } else {
                    console.warn('⚠️ [REF] No face found');
                    showNotif('⚠️ No Face in Photo', 'warning');
                }
            } catch (error) {
                console.error('❌ [REF] Failed:', error);
            }
        };
        load();
    }, [modelsLoaded, userPhotoUrl, showNotif]);

    // ==================== SETUP VIDEO ====================
    useEffect(() => {
        if (!mediaStream || !videoRef.current) return;
        console.log('📹 [VIDEO] Setting up...');
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
            console.log(`📹 [VIDEO] Ready: ${video.videoWidth}x${video.videoHeight}`);
            video.play().then(() => setIsVideoReady(true));
        };
    }, [mediaStream]);

    // ==================== DETECTION LOOP ====================
    useEffect(() => {
        if (!modelsLoaded || !isVideoReady) {
            console.log(`⏸️ [DETECT] Waiting...`);
            return;
        }

        console.log(`🚀 [DETECT] Starting loop (${faceDetectionInterval}ms)`);

        const detect = async () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;

            try {
                detectionCountRef.current++;
                const num = detectionCountRef.current;

                // Face detection with face-api.js (use empty descriptor if none loaded)
                // Using lower thresholds for better low-light detection
                const result = await detectAndRecognizeFaces(video, referenceDescriptor || new Float32Array(128), {
                    inputSize: 320,           // Larger input for better accuracy
                    scoreThreshold: 0.3,      // Lower for low-light conditions
                    matchThreshold: 0.5       // Slightly more lenient matching
                });

                console.log(`\n${'='.repeat(40)}`);
                console.log(`👁️ [DETECT #${num}] Faces: ${result.faceCount} | Status: ${result.status}`);
                if (result.confidence > 0) console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
                console.log(`${'='.repeat(40)}\n`);

                setFaceCount(result.faceCount);
                setFaceStatus(result.status);
                setMatchConfidence(result.confidence);

                // Report violations
                if (result.status === 'no-face') {
                    reportViolation('NO_FACE_DETECTED', { faceCount: 0 });
                } else if (result.status === 'multiple') {
                    reportViolation('MULTIPLE_FACES', { faceCount: result.faceCount });
                } else if (result.status === 'mismatch') {
                    reportViolation('FACE_MISMATCH', { confidence: result.confidence });
                }

                // Check screen brightness
                checkBrightness();

            } catch (error) {
                console.error('❌ [DETECT] Error:', error);
            }
        };

        detect();
        const id = setInterval(detect, faceDetectionInterval);
        return () => clearInterval(id);
    }, [modelsLoaded, isVideoReady, referenceDescriptor, faceDetectionInterval, checkBrightness, reportViolation]);

    // ==================== AUDIO MONITORING ====================
    useEffect(() => {
        if (!mediaStream) return;

        let mounted = true;
        const init = async () => {
            try {
                console.log('🎤 [AUDIO] Initializing...');
                let stream = mediaStream;
                if (mediaStream.getAudioTracks().length === 0) {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                if (!mounted) return;
                const ctx = new AudioContext();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                ctx.createMediaStreamSource(stream).connect(analyser);
                audioContextRef.current = ctx;
                analyserRef.current = analyser;
                console.log('✅ [AUDIO] Ready!');
                showNotif('🎤 Audio Active', 'success');
            } catch (e) {
                console.error('❌ [AUDIO] Failed:', e);
            }
        };
        init();
        return () => {
            mounted = false;
            audioContextRef.current?.close();
        };
    }, [mediaStream, showNotif]);

    // ==================== AUDIO CHECK LOOP ====================
    useEffect(() => {
        if (!analyserRef.current) return;

        const check = () => {
            const a = analyserRef.current;
            if (!a) return;
            const data = new Uint8Array(a.frequencyBinCount);
            a.getByteFrequencyData(data);
            const avg = data.reduce((x, y) => x + y, 0) / data.length;
            const dB = avg > 0 ? 20 * Math.log10(avg / 255) : -100;
            setAudioLevel(dB);

            if (Math.random() < 0.15) {
                console.log(`🎤 [AUDIO] ${dB.toFixed(0)}dB`);
            }
            if (dB > noiseThreshold) {
                reportViolation('AUDIO_NOISE_DETECTED', { level: dB });
            }
        };

        const id = setInterval(check, audioCheckInterval);
        return () => clearInterval(id);
    }, [audioCheckInterval, noiseThreshold, reportViolation]);

    // ==================== OBJECT DETECTION VIOLATIONS ====================
    useEffect(() => {
        if (objectViolations.length === 0) return;

        // Report the latest object violation
        const latestViolation = objectViolations[objectViolations.length - 1];
        reportViolation('UNWANTED_OBJECT_DETECTED', latestViolation.metadata);
    }, [objectViolations, reportViolation]);

    // ==================== DRAG ====================
    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    useEffect(() => {
        if (!isDragging) return;
        const move = (e: MouseEvent) => setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
        const up = () => setIsDragging(false);
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    }, [isDragging, dragOffset]);

    useEffect(() => {
        const resize = () => { if (!isDragging) setPosition({ x: window.innerWidth - 200, y: window.innerHeight - 180 }); };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [isDragging]);

    // ==================== RENDER ====================
    if (!mediaStream) return null;

    // Border color logic: green by default, changes on violations
    const getBorderColor = () => {
        if (isScreenBlack) return 'border-orange-500';
        if (faceCount > 1 || faceStatus === 'mismatch') return 'border-red-500';
        if (faceCount === 0 || faceStatus === 'no-face') return 'border-yellow-500';
        return 'border-green-500'; // Default green
    };

    const getStatusBg = () => {
        if (isScreenBlack) return 'bg-orange-500';
        if (faceCount > 1 || faceStatus === 'mismatch') return 'bg-red-500';
        if (faceCount === 0 || faceStatus === 'no-face') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Small Square Overlay */}
            <div
                className={`fixed z-50 rounded-lg overflow-hidden shadow-xl border-3 ${getBorderColor()} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ left: position.x, top: position.y, width: 180, height: 160, borderWidth: 3 }}
                onMouseDown={onMouseDown}
            >
                <div className="relative w-full h-full bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Black screen overlay */}
                    {isScreenBlack && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="text-center">
                                <EyeOff className="w-8 h-8 text-orange-400 mx-auto animate-pulse" />
                                <p className="text-orange-400 text-[10px] font-bold mt-1">BLOCKED</p>
                            </div>
                        </div>
                    )}

                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded">
                                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                <Camera size={8} className="text-white" />
                                <span className="text-[8px] font-bold text-white">LIVE</span>
                            </div>

                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${faceCount === -1 ? 'bg-gray-500 text-white' :
                                faceCount === 1 ? 'bg-green-500 text-white' :
                                    faceCount === 0 ? 'bg-yellow-500 text-black' :
                                        'bg-red-500 text-white'
                                }`}>
                                <Users size={8} />
                                <span>{faceCount === -1 ? '..' : faceCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${getStatusBg()}`}>
                                {isScreenBlack ? <EyeOff size={8} className="text-white" /> :
                                    faceCount > 1 || faceStatus === 'mismatch' ? <AlertTriangle size={8} className="text-white" /> :
                                        <CheckCircle size={8} className="text-white" />}
                                <span className="text-[8px] font-bold text-white">
                                    {isScreenBlack ? 'BLOCKED' :
                                        faceStatus === 'match' ? `OK ${matchConfidence > 0 ? Math.round(matchConfidence * 100) + '%' : ''}` :
                                            faceStatus === 'no-face' ? 'NO FACE' :
                                                faceStatus === 'mismatch' ? 'WRONG' :
                                                    faceStatus === 'multiple' ? 'MULTI' : 'WAIT'}
                                </span>
                            </div>

                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${audioLevel > noiseThreshold ? 'bg-red-500' : 'bg-gray-600'}`}>
                                <Volume2 size={8} className="text-white" />
                                <span className="text-[7px] font-mono text-white">
                                    {audioLevel > -100 ? `${audioLevel.toFixed(0)}` : '--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {violationCount > 0 && (
                        <div className="absolute bottom-8 right-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-[8px] font-bold">
                            ⚠{violationCount}
                        </div>
                    )}

                    {/* Suspicious Objects Indicator */}
                    {suspiciousObjects.length > 0 && (
                        <div className="absolute top-8 left-1 right-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold text-center animate-pulse">
                            📱 {suspiciousObjects.join(', ').toUpperCase()}
                        </div>
                    )}

                    {/* Object Detection Status */}
                    {objectModelLoaded && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white px-1 py-0.5 rounded text-[6px] font-bold">
                            🤖 OBJ
                        </div>
                    )}
                </div>
            </div>

            {/* Notification */}
            {showNotification && (
                <div className="fixed top-16 right-4 z-[60] animate-in slide-in-from-right">
                    <div className={`px-3 py-2 rounded-lg shadow-xl border flex items-center gap-2 ${notificationType === 'success' ? 'bg-green-500 border-green-400 text-white' :
                        notificationType === 'warning' ? 'bg-yellow-500 border-yellow-400 text-black' :
                            'bg-red-500 border-red-400 text-white'
                        }`}>
                        <AlertTriangle size={14} />
                        <span className="text-xs font-medium">{notificationMessage}</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default WebcamOverlay;
