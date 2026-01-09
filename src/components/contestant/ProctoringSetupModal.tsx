import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, Mic, Monitor, Chrome, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Loader2, X, Sparkles, Lock, Eye, Volume2, CameraIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { contestantService, SystemChecks, ProctoringSettings } from '@/api/contestantService';

interface ProctoringSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    assessmentId: string;
    settings?: ProctoringSettings;
}

// Step type definition
type SetupStep = 'browser' | 'camera' | 'screen' | 'consent';

export default function ProctoringSetupModal({ isOpen, onClose, onComplete, assessmentId, settings }: ProctoringSetupModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [consent, setConsent] = useState(false);
    const [currentStep, setCurrentStep] = useState<SetupStep>('browser');
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

    // Determine required checks based on settings
    const isCameraRequired = settings?.videoMonitoring ?? true;
    const isMicRequired = (settings?.audioMonitoring || settings?.audioRecording) ?? true;
    const isScreenRequired = true; // FORCE REQUIRED as per user request to ensure it shows
    const isFaceVerifyRequired = true; // FORCE REQUIRED as per user request to ensure button shows

    const [checks, setChecks] = useState<SystemChecks>({
        browser: false,
        camera: false,
        mic: false,
        screenShare: !isScreenRequired // If not required, mark as done
    });

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState(false);
    const [testingCamera, setTestingCamera] = useState(false);
    const [testingScreen, setTestingScreen] = useState(false);
    const [error, setError] = useState('');

    // Define steps in order
    const steps: SetupStep[] = ['browser', 'camera', 'screen', 'consent'];
    const currentStepIndex = steps.indexOf(currentStep);

    const setVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && stream) {
            node.srcObject = stream;
            const playPromise = node.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') console.error('Video play error:', err);
                });
            }
        }
    }, [stream]);

    // Photo verification state
    const [showPhotoCapture, setShowPhotoCapture] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoVerified, setPhotoVerified] = useState(false);
    const [verificationUrls, setVerificationUrls] = useState<{ storedPhotoUrl: string; livePhotoUrl: string } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Browser check on mount
    useEffect(() => {
        if (isOpen) {
            // Real browser compatibility check
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            const isEdge = /Edg/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

            // Accept Chrome, Edge, Firefox for WebRTC support
            const isCompatible = isChrome || isEdge || isFirefox;
            setChecks(prev => ({ ...prev, browser: isCompatible }));

            // Reset other checks
            setChecks(prev => ({
                ...prev,
                camera: false,
                mic: false,
                screenShare: !isScreenRequired
            }));
            setStream(null);
            setError('');
            setCurrentStep('browser'); // Reset to first step
            setPhotoVerified(false);
            setCapturedPhoto(null);
            setConsent(false);
        }

        return () => {
            // Cleanup stream on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    // Navigation functions
    const goToNextStep = () => {
        setError('');
        if (currentStepIndex < steps.length - 1) {
            setDirection(1);
            setCurrentStep(steps[currentStepIndex + 1]);
        }
    };

    const goToPrevStep = () => {
        setError('');
        if (currentStepIndex > 0) {
            setDirection(-1);
            setCurrentStep(steps[currentStepIndex - 1]);
        }
    };

    const canProceedToNext = (): boolean => {
        switch (currentStep) {
            case 'browser':
                return checks.browser;
            case 'camera':
                return checks.camera && (isMicRequired ? checks.mic : true) && photoVerified;
            case 'screen':
                return checks.screenShare;
            case 'consent':
                return consent;
            default:
                return false;
        }
    };

    // Video playback is handled by the callback ref setVideoRef
    // Redundant useEffect removed to prevent potential conflicts

    // Request camera and microphone access
    const requestCameraAccess = async () => {
        setTestingCamera(true);
        setError('');

        try {
            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Request real camera and mic permissions
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: isMicRequired
            });

            setStream(mediaStream);

            // Mark checks as passed
            setChecks(prev => ({
                ...prev,
                camera: true,
                mic: isMicRequired ? true : prev.mic
            }));

        } catch (err: any) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Camera/Microphone access denied. Please allow permissions in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera or microphone found. Please connect a device.');
            } else {
                setError('Failed to access camera/microphone. Please check your device.');
            }
        } finally {
            setTestingCamera(false);
        }
    };

    // Capture photo from video stream
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);

        // Set canvas to square dimensions
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate crop position for center square
        const offsetX = (video.videoWidth - size) / 2;
        const offsetY = (video.videoHeight - size) / 2;

        // Draw cropped square image (mirrored)
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

        const photoData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(photoData);
    };

    // Upload captured photo to backend
    const uploadPhoto = async () => {
        if (!capturedPhoto) return;

        setUploadingPhoto(true);
        setError('');

        try {
            const { sessionToken } = contestantService.getSession();
            const response = await contestantService.uploadVerificationPhoto({
                assessmentId,
                sessionId: sessionToken || '',
                photo: capturedPhoto
            });

            if (response.data.success) {
                setVerificationUrls({
                    storedPhotoUrl: response.data.data.storedPhotoUrl,
                    livePhotoUrl: response.data.data.livePhotoUrl
                });
                setPhotoVerified(true);
                setShowPhotoCapture(false);
                // setCapturedPhoto(null); // REMOVED: Keep captured photo visible
                console.log('✅ Photo verification complete:', response.data.data);
            }
        } catch (err: any) {
            console.error('Photo upload error:', err);
            setError('Failed to upload photo. Please try again.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedPhoto(null);
    };

    // Request screen share access
    const requestScreenAccess = async () => {
        setTestingScreen(true);
        setError('');

        try {
            // Configure to prefer entire screen selection
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'monitor', // Prefer entire screen
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 15 }
                },
                audio: false,
                // @ts-ignore - These are valid but TypeScript doesn't know them
                preferCurrentTab: false, // Don't suggest current tab
                selfBrowserSurface: 'exclude', // Hide current browser window
                surfaceSwitching: 'exclude', // Don't allow switching during share
                systemAudio: 'exclude' // Don't capture system audio
            });

            // Check if the user shared the entire screen
            const videoTrack = displayStream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();

            // @ts-ignore - displaySurface is not in the standard Type definition yet for all browsers
            const displaySurface = settings.displaySurface;

            if (displaySurface && displaySurface !== 'monitor') {
                // If they shared a window or tab, stop the stream and show error
                displayStream.getTracks().forEach(track => track.stop());
                setError('You must select "Entire Screen" to continue. Sharing a Window or Tab is not allowed.');
                return;
            }

            // We just verify access, then stop the stream
            // Actual screen recording happens in ProctoringOverlay
            displayStream.getTracks().forEach(track => track.stop());

            setChecks(prev => ({ ...prev, screenShare: true }));

        } catch (err: any) {
            console.error('Screen share error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Screen sharing was denied. Please select "Entire Screen" to continue.');
            } else {
                setError('Failed to access screen sharing. Please try again.');
            }
        } finally {
            setTestingScreen(false);
        }
    };

    const handleContinue = async () => {
        if (!consent) {
            setError('Please accept the proctoring consent to continue');
            return;
        }

        if (!checks.browser) {
            setError('Please use a compatible browser (Chrome, Edge, or Firefox)');
            return;
        }

        if (!checks.camera) {
            setError('Please enable camera access');
            return;
        }

        if (isMicRequired && !checks.mic) {
            setError('Please enable microphone access');
            return;
        }

        if (isScreenRequired && !checks.screenShare) {
            setError('Please enable screen sharing');
            return;
        }

        // Check face verification but support auto-upload on continue
        let finalVerificationUrls = verificationUrls;

        if (isFaceVerifyRequired && !photoVerified) {
            if (capturedPhoto) {
                // Auto-upload the photo if captured but not confirmed
                setLoading(true);
                try {
                    const { sessionToken } = contestantService.getSession();
                    const response = await contestantService.uploadVerificationPhoto({
                        assessmentId,
                        sessionId: sessionToken || '',
                        photo: capturedPhoto
                    });

                    if (response.data.success) {
                        finalVerificationUrls = {
                            storedPhotoUrl: response.data.data.storedPhotoUrl,
                            livePhotoUrl: response.data.data.livePhotoUrl
                        };
                        setVerificationUrls(finalVerificationUrls);
                        setPhotoVerified(true);
                        // We don't clear capturedPhoto here because we're proceeding anyway
                        console.log('✅ Auto-verified photo on continue');
                    } else {
                        throw new Error('Verification failed');
                    }
                } catch (err) {
                    console.error('Auto-upload failed:', err);
                    setError('Photo verification failed. Please try again.');
                    setLoading(false);
                    return;
                }
            } else {
                setError('Please captured a verification photo to continue');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const { sessionToken } = contestantService.getSession();
            if (!sessionToken) {
                throw new Error('Session not found');
            }

            // Record consent and system checks
            await contestantService.recordConsent(sessionToken);
            await contestantService.recordSystemCheck(sessionToken, checks);

            // Save verification URLs for AI Proctoring Service
            if (finalVerificationUrls?.storedPhotoUrl) {
                localStorage.setItem('storedPhotoUrl', finalVerificationUrls.storedPhotoUrl);
                console.log('✅ Stored photo URL saved to localStorage:', finalVerificationUrls.storedPhotoUrl);
            }
            if (finalVerificationUrls?.livePhotoUrl) {
                localStorage.setItem('livePhotoUrl', finalVerificationUrls.livePhotoUrl);
            }

            // Don't stop the stream - it will be used by ProctoringOverlay
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to save setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const allChecksPass = checks.browser && checks.camera && (isMicRequired ? checks.mic : true) && (isScreenRequired ? checks.screenShare : true);

    // Check if all requirements are met (including photo verification when required)
    const allRequirementsMet = allChecksPass && (!isFaceVerifyRequired || photoVerified) && consent;

    // Step info for display
    const stepInfo: Record<SetupStep, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
        browser: {
            title: 'Browser Check',
            subtitle: 'Verifying browser compatibility',
            icon: <Chrome className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-500'
        },
        camera: {
            title: 'Camera Check & Identity',
            subtitle: 'Enable camera and verify identity',
            icon: <Camera className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500'
        },
        screen: {
            title: 'Screen Sharing',
            subtitle: 'Share your entire screen',
            icon: <Monitor className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500'
        },

        consent: {
            title: 'Terms & Consent',
            subtitle: 'Review and accept the terms',
            icon: <Lock className="w-6 h-6" />,
            color: 'from-indigo-500 to-violet-500'
        }
    };

    // Card slide animation variants
    const cardVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
            rotateY: direction > 0 ? 15 : -15
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
            rotateY: direction < 0 ? 15 : -15
        })
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header with Progress */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Proctoring Setup</h2>
                                <p className="text-xs text-white/70">Step {currentStepIndex + 1} of {steps.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-white/70" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex ||
                                (step === 'browser' && checks.browser) ||
                                (step === 'camera' && checks.camera && photoVerified) ||
                                (step === 'screen' && checks.screenShare) ||
                                (step === 'consent' && consent);
                            const isCurrent = index === currentStepIndex;

                            return (
                                <React.Fragment key={step}>
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isCurrent ? 1.1 : 1,
                                            backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#ffffff' : 'rgba(255,255,255,0.3)'
                                        }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted ? 'text-white' : isCurrent ? 'text-purple-600' : 'text-white/70'
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                    </motion.div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-1 rounded-full transition-colors ${index < currentStepIndex ? 'bg-green-400' : 'bg-white/20'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Card Content Area */}
                <div className="relative overflow-hidden" style={{ minHeight: '400px' }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="p-6"
                        >
                            {/* Step Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stepInfo[currentStep].color} flex items-center justify-center text-white shadow-lg`}>
                                    {stepInfo[currentStep].icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{stepInfo[currentStep].title}</h3>
                                    <p className="text-sm text-gray-500">{stepInfo[currentStep].subtitle}</p>
                                </div>
                            </div>

                            {/* Step Content */}
                            {currentStep === 'browser' && (
                                <div className="space-y-4">
                                    <div className={`p-6 rounded-2xl border-2 transition-all ${checks.browser ? 'border-green-500 bg-green-50' : 'border-red-200 bg-red-50'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${checks.browser ? 'bg-green-500' : 'bg-red-400'
                                                }`}>
                                                <Chrome className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-lg ${checks.browser ? 'text-green-700' : 'text-red-700'}`}>
                                                    {checks.browser ? 'Browser Compatible!' : 'Incompatible Browser'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {checks.browser
                                                        ? 'Your browser supports all required features for proctoring.'
                                                        : 'Please use Chrome, Edge, or Firefox for the best experience.'}
                                                </p>
                                            </div>
                                            {checks.browser && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Supported browsers:</strong> Google Chrome, Microsoft Edge, Mozilla Firefox
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 'camera' && (
                                <div className="space-y-4">
                                    <div className={`relative rounded-2xl overflow-hidden border-2 transition-colors ${photoVerified ? 'border-green-500' : 'border-gray-200'
                                        }`}>
                                        {!checks.camera ? (
                                            <div className="w-full aspect-video bg-gray-100 flex flex-col items-center justify-center p-6">
                                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                                                    <Camera className="w-10 h-10 text-gray-400" />
                                                </div>
                                                <p className="text-gray-600 font-medium mb-2">Camera access required</p>
                                                <p className="text-gray-400 text-sm text-center mb-4">
                                                    Click the button below to enable your camera and microphone
                                                </p>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={requestCameraAccess}
                                                    disabled={testingCamera}
                                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {testingCamera ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Requesting Access...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-5 h-5" />
                                                            Enable Camera & Mic
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>
                                        ) : capturedPhoto ? (
                                            <div className="relative">
                                                <img
                                                    src={capturedPhoto}
                                                    alt="Captured"
                                                    className="w-full aspect-video object-cover"
                                                />
                                                <div className={`absolute inset-0 flex items-center justify-center gap-3 ${!photoVerified ? 'bg-black/40' : ''}`}>
                                                    {!photoVerified ? (
                                                        <>
                                                            <button
                                                                onClick={retakePhoto}
                                                                disabled={uploadingPhoto}
                                                                className="px-5 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-semibold shadow-lg hover:bg-gray-50 transition-all"
                                                            >
                                                                Retake
                                                            </button>
                                                            <button
                                                                onClick={uploadPhoto}
                                                                disabled={uploadingPhoto}
                                                                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                {uploadingPhoto ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Verifying...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Confirm Photo
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            Identity Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <video
                                                    ref={setVideoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="w-full aspect-video object-cover bg-black"
                                                    style={{ transform: 'scaleX(-1)' }}
                                                />
                                                <div className="absolute top-3 right-3 flex gap-2 z-10">
                                                    <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                        Camera Active
                                                    </span>
                                                    {checks.mic && (
                                                        <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                                                            <Mic className="w-3 h-3" />
                                                            Mic Active
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Corner brackets guide overlay - full square view */}
                                                <div className="absolute inset-4 pointer-events-none">
                                                    {/* Top-left corner */}
                                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white/80 rounded-tl-lg" />
                                                    {/* Top-right corner */}
                                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white/80 rounded-tr-lg" />
                                                    {/* Bottom-left corner */}
                                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white/80 rounded-bl-lg" />
                                                    {/* Bottom-right corner */}
                                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white/80 rounded-br-lg" />
                                                </div>
                                                <p className="absolute top-4 left-0 right-0 text-center text-white/90 text-sm font-medium drop-shadow-md bg-black/30 py-2">
                                                    Position yourself clearly in the frame
                                                </p>
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                    <button
                                                        onClick={capturePhoto}
                                                        className="px-6 py-2.5 bg-white/90 backdrop-blur text-purple-600 rounded-full font-bold shadow-lg hover:scale-105 hover:bg-white transition-all flex items-center gap-2"
                                                    >
                                                        <CameraIcon className="w-5 h-5" />
                                                        Capture Photo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            )}

                            {currentStep === 'screen' && (
                                <div className="space-y-3">
                                    {/* Instructional Image - Moved to Top */}
                                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm flex justify-center bg-white/50">
                                        <img
                                            src="/image.png"
                                            alt="How to share screen"
                                            className="max-w-full max-h-[25vh] w-auto object-contain"
                                        />
                                    </div>

                                    <div className={`p-3 rounded-xl border-2 transition-all ${checks.screenShare ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${checks.screenShare ? 'bg-green-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'
                                                }`}>
                                                <Monitor className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-base ${checks.screenShare ? 'text-green-700' : 'text-gray-900'}`}>
                                                    {checks.screenShare ? 'Screen Sharing Enabled!' : 'Share Your Screen'}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {checks.screenShare
                                                        ? 'Your screen is being monitored.'
                                                        : 'Select "Entire Screen" to continue.'}
                                                </p>
                                            </div>
                                            {checks.screenShare && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                        </div>
                                        {!checks.screenShare && (
                                            <div className="flex justify-center mt-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={requestScreenAccess}
                                                    disabled={testingScreen}
                                                    className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                                                >
                                                    {testingScreen ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Requesting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Monitor className="w-3 h-3" />
                                                            Enable Screen Sharing
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                        <p className="text-[11px] text-amber-800 leading-tight">
                                            <strong>Important:</strong> You must select the "Entire Screen" tab in the popup window.
                                        </p>
                                    </div>
                                </div>
                            )}



                            {currentStep === 'consent' && (
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield className="w-5 h-5 text-indigo-600" />
                                            <p className="font-bold text-indigo-900">Proctoring Terms</p>
                                        </div>
                                        <ul className="space-y-3 text-sm text-indigo-800">
                                            <li className="flex items-start gap-3">
                                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                                <span><strong>Violations lead to immediate disqualification.</strong></span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                                                <span>Video, audio, and screen are monitored continuously.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                                                <span>Tab switching, copy-pasting, and minimizing are blocked.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                                                <span>Multiple faces or absence from frame will be flagged.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                                                <span>You must remain in fullscreen mode throughout.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div
                                        onClick={() => setConsent(!consent)}
                                        className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${consent
                                            ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                                            : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <motion.div
                                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors duration-300 ${consent
                                                ? 'border-purple-600 bg-gradient-to-r from-purple-600 to-indigo-600'
                                                : 'border-gray-300 bg-white'
                                                }`}
                                        >
                                            <AnimatePresence>
                                                {consent && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                        <span className={`text-sm font-semibold flex-1 ${consent ? 'text-purple-700' : 'text-gray-600'}`}>
                                            I accept the terms and understand that any violation will result in disqualification.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer with Navigation */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between gap-4">
                        {/* Back Button */}
                        <button
                            onClick={goToPrevStep}
                            disabled={currentStepIndex === 0}
                            className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${currentStepIndex === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {/* Status Indicator */}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <div className={`w-2.5 h-2.5 rounded-full ${canProceedToNext() ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span>{canProceedToNext() ? 'Ready to continue' : 'Complete this step'}</span>
                        </div>

                        {/* Next / Start Button */}
                        {currentStepIndex < steps.length - 1 ? (
                            <motion.button
                                whileHover={canProceedToNext() ? { scale: 1.02 } : {}}
                                whileTap={canProceedToNext() ? { scale: 0.98 } : {}}
                                onClick={goToNextStep}
                                disabled={!canProceedToNext()}
                                className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${canProceedToNext()
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                Continue
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={allRequirementsMet && !loading ? { scale: 1.02 } : {}}
                                whileTap={allRequirementsMet && !loading ? { scale: 0.98 } : {}}
                                onClick={handleContinue}
                                disabled={loading || !allRequirementsMet}
                                className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 ${allRequirementsMet
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Start Assessment
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}