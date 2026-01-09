'use client';

/**
 * AI Proctoring Service
 * 
 * Industry-standard real-time proctoring using:
 * - face-api.js for face verification (comparing stored photo with live feed)
 * - MediaPipe for face detection, face mesh, and object detection
 * 
 * Features:
 * - Face verification (match live face with registered photo)
 * - Face detection (no face, multiple faces)
 * - Gaze tracking (looking away detection)
 * - Object detection (prohibited items)
 * - Real-time monitoring with callbacks
 */

import * as faceapi from 'face-api.js';
import { ObjectDetector, FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision';

// ========== TYPES ==========

export interface ProctoringConfig {
    // Face verification
    faceVerificationEnabled: boolean;
    storedPhotoUrl?: string;
    livePhotoUrl?: string;
    verificationThreshold: number; // 0.4 - 0.6 is typical (lower = stricter)

    // Face detection
    faceDetectionEnabled: boolean;
    multipleFaceThreshold: number; // Alert if > 1 face detected

    // Gaze tracking
    gazeTrackingEnabled: boolean;
    gazeDeviationThreshold: number; // Max degrees off-center before alert

    // Object detection
    objectDetectionEnabled: boolean;
    prohibitedObjects: string[]; // ['cell phone', 'book', 'laptop', etc.]

    // Audio monitoring
    audioMonitoringEnabled: boolean;
    noiseThreshold: number; // dB level considered too noisy (0-1 normalized)

    // Callbacks
    onViolation?: (violation: ProctoringViolation) => void;
    onStatusChange?: (status: ProctoringStatus) => void;
    onVerificationResult?: (result: VerificationResult) => void;
}

export interface ProctoringViolation {
    type: ViolationType;
    timestamp: Date;
    confidence: number;
    metadata?: Record<string, any>;
    screenshot?: string;
}

export type ViolationType =
    | 'no_face'
    | 'multiple_faces'
    | 'face_mismatch'
    | 'looking_away'
    | 'looking_down'
    | 'looking_up'
    | 'prohibited_object'
    | 'face_covered'
    | 'poor_lighting'
    | 'excessive_noise'
    | 'voice_detected';

export interface ProctoringStatus {
    isRunning: boolean;
    faceDetected: boolean;
    faceCount: number;
    isVerified: boolean;
    gazeDirection: GazeDirection;
    lastViolation?: ProctoringViolation;
    fps: number;
    audioLevel: number; // 0 to 100
}

export interface GazeDirection {
    yaw: number;   // Left/Right (-1 to 1)
    pitch: number; // Up/Down (-1 to 1)
    roll: number;  // Tilt
}

export interface VerificationResult {
    isMatch: boolean;
    confidence: number;
    distance: number;
    threshold: number;
}

export interface FaceDetectionResult {
    faceCount: number;
    faces: DetectedFace[];
    timestamp: Date;
}

export interface DetectedFace {
    boundingBox: { x: number; y: number; width: number; height: number };
    landmarks?: faceapi.FaceLandmarks68;
    descriptor?: Float32Array;
    expressions?: Record<string, number>;
    age?: number;
    gender?: string;
    gaze?: GazeDirection;
}

// ========== AI PROCTORING SERVICE CLASS ==========

export class AIProctoringService {
    private config: ProctoringConfig;
    private isInitialized: boolean = false;
    private isRunning: boolean = false;
    private videoElement: HTMLVideoElement | null = null;
    private canvasElement: HTMLCanvasElement | null = null;
    private loopTimeoutId: NodeJS.Timeout | number | null = null;
    private lastFrameTime: number = 0;
    private fps: number = 0;

    // Face-api.js
    private storedFaceDescriptor: Float32Array | null = null;
    private faceMatcher: faceapi.FaceMatcher | null = null;

    // MediaPipe Object Detection
    private objectDetector: ObjectDetector | null = null;
    private lastObjectDetectionTime: number = 0;

    // MediaPipe Face Detection (for better multiple face detection)
    private mediapipeFaceDetector: FaceDetector | null = null;

    // Audio Monitoring
    private audioContext: AudioContext | null = null;
    private audioAnalyser: AnalyserNode | null = null;
    private audioDataArray: Uint8Array | null = null;
    private mediaStream: MediaStream | null = null;
    private lastAudioCheckTime: number = 0;
    private audioNoiseLevel: number = 0;

    // Status
    private currentStatus: ProctoringStatus = {
        isRunning: false,
        faceDetected: false,
        faceCount: 0,
        isVerified: false,
        gazeDirection: { yaw: 0, pitch: 0, roll: 0 },
        fps: 0,
        audioLevel: 0
    };

    // Grace period counters - prevent false violations from momentary detection issues
    private noFaceCounter: number = 0;
    private readonly NO_FACE_GRACE_FRAMES = 10; // ~0.5 seconds at 20fps (Strict Mode)

    // Eye tracking grace period - prevent false "looking away" from natural eye movements
    private lookingAwayCounter: number = 0;
    private readonly LOOKING_AWAY_GRACE_FRAMES = 5; // ~0.25 seconds (Strict Mode)

    // Violation cooldowns to prevent spam
    private violationCooldowns: Map<ViolationType, number> = new Map();
    private readonly VIOLATION_COOLDOWN_MS = 3000; // 3 seconds between same violation type (Reduced for strictness)

    constructor(config: Partial<ProctoringConfig> = {}) {
        this.config = {
            faceVerificationEnabled: true,
            faceDetectionEnabled: true,
            gazeTrackingEnabled: true,
            objectDetectionEnabled: false,
            audioMonitoringEnabled: false,
            verificationThreshold: 0.4, // Stricter verification (was 0.5)
            multipleFaceThreshold: 1,
            gazeDeviationThreshold: 0.35,  // Stricter - limits head movement (was 0.55)
            noiseThreshold: 0.1, // 10% of max amplitude (was 0.15)
            prohibitedObjects: ['cell phone', 'mobile phone', 'book', 'laptop', 'tv', 'bottle', 'cup', 'headphones', 'earbuds', 'airpods', 'earphones', 'remote'],
            ...config
        };
    }

    // ========== INITIALIZATION ==========

    /**
     * Initialize the AI proctoring service
     * Loads all required ML models
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            console.log('⚡ AI Proctoring already initialized');
            return true;
        }

        try {
            console.log('🔄 Initializing AI Proctoring Service...');

            // 1. Load face-api.js models
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

            // 2. Load MediaPipe Object Detector (if enabled)
            let objectDetectorPromise = Promise.resolve(null);

            // We always load it if possible, but only run if enabled
            const loadObjectDetector = async () => {
                console.log('📦 Loading MediaPipe Object Detector...');
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
                );
                this.objectDetector = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
                        delegate: "CPU"  // Use CPU for broad compatibility (works on all systems)
                    },
                    scoreThreshold: 0.4,   // Lowered for better detection
                    maxResults: 5,         // Limit results for performance
                    runningMode: "VIDEO"
                });
                console.log('✅ MediaPipe Object Detector loaded');

                // Also load MediaPipe FaceDetector for better multi-face detection
                console.log('👥 Loading MediaPipe Face Detector...');
                this.mediapipeFaceDetector = await FaceDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                        delegate: "CPU"
                    },
                    runningMode: "VIDEO",
                    minDetectionConfidence: 0.75  // 75% confidence to strictly avoid ghost faces
                });
                console.log('✅ MediaPipe Face Detector loaded');
            };

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                loadObjectDetector()
            ]);

            console.log('✅ All AI models loaded');
            this.isInitialized = true;

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AI Proctoring:', error);
            // Even if one fails, we might still be able to proceed with partial functionality
            // But for now return false
            return false;
        }
    }

    /**
     * Load stored photo for face verification
     */
    async loadStoredPhoto(photoUrl: string): Promise<boolean> {
        try {
            console.log('📷 Loading stored photo for verification...');

            const img = await faceapi.fetchImage(photoUrl);
            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.error('❌ No face detected in stored photo');
                return false;
            }

            this.storedFaceDescriptor = detection.descriptor;
            this.faceMatcher = new faceapi.FaceMatcher([
                new faceapi.LabeledFaceDescriptors('registered', [detection.descriptor])
            ], this.config.verificationThreshold);

            console.log('✅ Stored photo loaded and face descriptor extracted');
            return true;
        } catch (error) {
            console.error('❌ Failed to load stored photo:', error);
            return false;
        }
    }

    // ========== MAIN PROCTORING LOOP ==========

    /**
     * Start real-time proctoring
     */
    async start(videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
        console.log('📹 AIProctoringService.start() called', {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            hasVideo: !!videoElement,
            videoReady: videoElement?.readyState,
            videoWidth: videoElement?.videoWidth,
            videoHeight: videoElement?.videoHeight
        });

        if (!this.isInitialized) {
            console.log('🔄 Initializing AI models first...');
            const success = await this.initialize();
            if (!success) {
                console.error('❌ Failed to initialize AI models, cannot start proctoring');
                return;
            }
        }

        if (this.isRunning) {
            console.log('⚠️ Proctoring already running, skipping start');
            return;
        }

        this.videoElement = videoElement;
        this.canvasElement = canvasElement || null;
        this.isRunning = true;
        this.updateStatus({ isRunning: true });

        // Initialize audio monitoring if enabled
        console.log('🎤 Audio Monitoring Config:', {
            audioMonitoringEnabled: this.config.audioMonitoringEnabled,
            noiseThreshold: this.config.noiseThreshold
        });
        if (this.config.audioMonitoringEnabled) {
            console.log('✅ Audio monitoring is ENABLED, initializing...');
            await this.initializeAudioMonitoring();
        } else {
            console.log('❌ Audio monitoring is DISABLED');
        }

        console.log('🚀 Starting real-time proctoring detection loop...');
        this.runDetectionLoop();
    }

    /**
     * Initialize audio monitoring for noise detection
     */
    private async initializeAudioMonitoring(): Promise<void> {
        try {
            console.log('🎤 Initializing audio monitoring...');

            // Get microphone stream
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create audio context and analyser
            this.audioContext = new AudioContext();
            this.audioAnalyser = this.audioContext.createAnalyser();
            this.audioAnalyser.fftSize = 256;
            this.audioAnalyser.smoothingTimeConstant = 0.8;

            // Connect microphone to analyser
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.audioAnalyser);

            // Create data array for audio levels
            const bufferLength = this.audioAnalyser.frequencyBinCount;
            this.audioDataArray = new Uint8Array(bufferLength);

            console.log('✅ Audio monitoring initialized');
        } catch (error) {
            console.warn('⚠️ Could not initialize audio monitoring:', error);
        }
    }

    /**
     * Stop proctoring
     */
    stop(): void {
        this.isRunning = false;
        if (this.loopTimeoutId) {
            clearTimeout(this.loopTimeoutId);
            this.loopTimeoutId = null;
        }

        // Clean up audio monitoring
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.audioAnalyser = null;
        this.audioDataArray = null;

        this.updateStatus({ isRunning: false });
        console.log('🛑 Proctoring stopped');
    }

    /**
     * Main detection loop - runs at ~15-30 FPS
     */
    private async runDetectionLoop(): Promise<void> {
        if (!this.isRunning) {
            console.log('⏹️ Detection loop exited: isRunning=false');
            return;
        }

        if (!this.videoElement) {
            console.log('⏹️ Detection loop exited: no video element');
            return;
        }

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;

        // Target ~20 FPS for performance
        if (deltaTime >= 50) { // 50ms = 20 FPS
            this.lastFrameTime = now;
            this.fps = Math.round(1000 / deltaTime);

            try {
                await this.processFrame();
            } catch (error) {
                console.error('❌ Frame processing error:', error);
            }
        }


        this.loopTimeoutId = setTimeout(() => this.runDetectionLoop(), 50);
    }

    /**
     * Process a single video frame
     */
    private async processFrame(): Promise<void> {
        // Skip frame if video not ready (but don't stop loop)
        if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
            // Only log occasionally to avoid spam
            if (Math.random() < 0.01) {
                console.log('⏸️ Skipping frame - video not ready');
            }
            return; // Just skip this frame, loop continues
        }

        // Check video has valid dimensions
        if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
            return; // Skip frame, video not fully loaded
        }

        // 1. Detect Faces using DUAL approach:
        // - MediaPipe FaceDetector: Better accuracy for counting faces (no false positives)
        // - face-api.js: For face verification, landmarks, and expressions

        let detections: faceapi.WithFaceExpressions<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>>[] = [];
        let faceCount = 0;
        let mediapipeFaceCount = 0;

        try {
            // Ensure video is ready for face detection
            if (this.videoElement.readyState >= 2) {
                const now = Date.now();

                // Use MediaPipe for accurate face COUNTING (better at avoiding false positives)
                if (this.mediapipeFaceDetector) {
                    try {
                        const mpResult = this.mediapipeFaceDetector.detectForVideo(this.videoElement, now);
                        mediapipeFaceCount = mpResult.detections?.length || 0;
                    } catch (mpError) {
                        if (Math.random() < 0.01) {
                            console.warn('⚠️ MediaPipe face detection error:', mpError);
                        }
                    }
                }

                // Use face-api.js for verification (but with higher threshold to avoid false positives)
                detections = await faceapi
                    .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 416,        // Balanced size for accuracy
                        scoreThreshold: 0.75   // Strict threshold (75%) to ignore background noise
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptors()
                    .withFaceExpressions();

                // Use the LOWER count to avoid false positives
                // MediaPipe is more accurate at counting, face-api gives more info
                const faceApiCount = detections.length;

                // If both agree, use that count. If they differ, use MediaPipe count
                // as it has higher confidence threshold
                if (mediapipeFaceCount > 0) {
                    faceCount = mediapipeFaceCount;
                } else {
                    faceCount = faceApiCount;
                }

                // Filter detections to match the agreed face count (remove lowest confidence)
                if (detections.length > faceCount && faceCount > 0) {
                    detections = detections
                        .sort((a, b) => b.detection.score - a.detection.score)
                        .slice(0, faceCount);
                }
            }
        } catch (faceError) {
            // Log error but don't crash - detection will retry next frame
            if (Math.random() < 0.01) { // Only log 1% of errors to avoid spam
                console.warn('⚠️ Face detection error:', faceError);
            }
        }

        // Log face detection results (throttled to every 2 seconds to avoid spam)
        if (this.fps > 0 && this.lastFrameTime % 2000 < 100) {
            console.log('👤 Face Detection:', {
                faceCount,
                mediapipeFaceCount,
                faceApiCount: detections.length,
                faceDetectionEnabled: this.config.faceDetectionEnabled,
                videoSize: `${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`
            });
        }

        // 2. Detect Objects - optimized for speed (every 100ms)
        let objectDetections: Detection[] = [];
        if (this.config.objectDetectionEnabled && this.objectDetector) {
            const now = Date.now();
            if (now - this.lastObjectDetectionTime > 100) { // 100ms = 10 detections/sec
                try {
                    // Ensure video is in a valid state for detection
                    if (this.videoElement.readyState >= 2 &&
                        this.videoElement.videoWidth > 0 &&
                        this.videoElement.videoHeight > 0) {
                        const result = this.objectDetector.detectForVideo(this.videoElement, now);
                        if (result && result.detections) {
                            objectDetections = result.detections;
                        }
                    }
                    this.lastObjectDetectionTime = now;

                    // Log object detections (only when found)
                    if (objectDetections.length > 0) {
                        console.log('📦 Objects:', objectDetections.map(d => d.categories?.[0]?.categoryName).join(', '));
                    }
                } catch (detectionError) {
                    // Log error but don't crash - detection will retry next frame
                    if (Math.random() < 0.01) { // Only log 1% of errors to avoid spam
                        console.warn('⚠️ Object detection error:', detectionError);
                    }
                }
            }
        }

        // Update status
        this.updateStatus({
            faceDetected: faceCount > 0,
            faceCount,
            fps: this.fps,
            audioLevel: Math.round(this.audioNoiseLevel * 100)
        });

        // 3. Check audio levels for noise detection
        // Log audio check status every 5 seconds
        if (this.lastFrameTime % 5000 < 100) {
            console.log('🔍 Audio Check Status:', {
                audioMonitoringEnabled: this.config.audioMonitoringEnabled,
                hasAnalyser: !!this.audioAnalyser,
                hasDataArray: !!this.audioDataArray,
                noiseThreshold: this.config.noiseThreshold
            });
        }

        if (this.config.audioMonitoringEnabled && this.audioAnalyser && this.audioDataArray) {
            const now = Date.now();
            if (now - this.lastAudioCheckTime > 500) { // Check every 500ms
                this.lastAudioCheckTime = now;

                // Get audio frequency data
                this.audioAnalyser.getByteFrequencyData(this.audioDataArray as Uint8Array<ArrayBuffer>);

                // Calculate average audio level (0-255)
                let sum = 0;
                for (let i = 0; i < this.audioDataArray.length; i++) {
                    sum += this.audioDataArray[i];
                }
                const avgLevel = sum / this.audioDataArray.length;
                this.audioNoiseLevel = avgLevel / 255; // Normalize to 0-1

                // Log audio level more frequently (every 2 seconds) for debugging
                if (this.lastFrameTime % 2000 < 100) {
                    console.log('🎤 [AUDIO] Current Level:', {
                        level: (this.audioNoiseLevel * 100).toFixed(1) + '%',
                        threshold: (this.config.noiseThreshold * 100) + '%',
                        exceedsThreshold: this.audioNoiseLevel > this.config.noiseThreshold,
                        willTrigger: this.audioNoiseLevel > this.config.noiseThreshold
                    });
                }

                // Check for excessive noise
                if (this.audioNoiseLevel > this.config.noiseThreshold) {
                    console.log('%c🔊 NOISE THRESHOLD EXCEEDED!', 'background: #ff0000; color: white; font-size: 14px; padding: 4px;', {
                        level: (this.audioNoiseLevel * 100).toFixed(1) + '%',
                        threshold: (this.config.noiseThreshold * 100) + '%'
                    });
                    this.triggerViolation('excessive_noise', this.audioNoiseLevel, {
                        level: this.audioNoiseLevel,
                        threshold: this.config.noiseThreshold,
                        message: `Noise level ${(this.audioNoiseLevel * 100).toFixed(0)}% exceeds threshold`
                    });
                }
            }
        } else if (this.config.audioMonitoringEnabled) {
            // Log why audio monitoring isn't working
            if (this.lastFrameTime % 5000 < 100) {
                console.warn('⚠️ Audio monitoring enabled but not working:', {
                    hasAnalyser: !!this.audioAnalyser,
                    hasDataArray: !!this.audioDataArray
                });
            }
        }

        // Draw detections on canvas if available
        if (this.canvasElement) {
            this.drawDetections(detections, objectDetections);
        }

        // Check for violations
        await this.checkViolations(detections, objectDetections, faceCount);
    }

    // ========== VIOLATION DETECTION ==========

    /**
     * Check for all types of violations
     */
    private async checkViolations(
        faceDetections: faceapi.WithFaceExpressions<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>>[],
        objectDetections: Detection[],
        authoritativeFaceCount: number
    ): Promise<void> {
        // Use the authoritative count derived from the best detector (MediaPipe)
        const faceCount = authoritativeFaceCount;

        // --- FACE CHECKS ---

        // No face detected - with grace period to prevent false positives
        if (faceCount === 0 && this.config.faceDetectionEnabled) {
            this.noFaceCounter++;
            // Only trigger violation after missing face for several consecutive frames
            if (this.noFaceCounter >= this.NO_FACE_GRACE_FRAMES) {
                this.triggerViolation('no_face', 1.0, {
                    message: 'No face detected in frame',
                    missedFrames: this.noFaceCounter
                });
            }
        } else {
            // Reset counter when face is detected
            this.noFaceCounter = 0;
        }

        // Multiple faces detected
        if (faceCount >= 2 && this.config.faceDetectionEnabled) {
            this.triggerViolation('multiple_faces', 1.0, {
                faceCount,
                message: `${faceCount} faces detected`
            });
        }

        // Single face - check verification and gaze
        // Only run these advanced checks if face-api actually successfully detected the face details
        if (faceCount === 1 && faceDetections.length > 0) {
            const detection = faceDetections[0];

            // Face verification
            if (this.config.faceVerificationEnabled && this.faceMatcher) {
                const match = this.faceMatcher.findBestMatch(detection.descriptor);
                const distance = match.distance;
                const isMatch = match.label === 'registered';

                this.updateStatus({ isVerified: isMatch });

                if (!isMatch && distance > this.config.verificationThreshold) {
                    this.triggerViolation('face_mismatch', distance, {
                        distance,
                        threshold: this.config.verificationThreshold
                    });
                }
            }

            // Gaze tracking using landmarks with enhanced eye tracking
            if (this.config.gazeTrackingEnabled && detection.landmarks) {
                const gaze = this.calculateGazeDirection(detection.landmarks);
                this.updateStatus({ gazeDirection: gaze });

                // Check if looking away (horizontal) - with grace period
                const isLookingAway = Math.abs(gaze.yaw) > this.config.gazeDeviationThreshold;
                const isLookingDown = gaze.pitch < -this.config.gazeDeviationThreshold;
                const isLookingUp = gaze.pitch > this.config.gazeDeviationThreshold;

                if (isLookingAway || isLookingDown || isLookingUp) {
                    this.lookingAwayCounter++;

                    // Only trigger violation after consistent deviation for multiple frames
                    if (this.lookingAwayCounter >= this.LOOKING_AWAY_GRACE_FRAMES) {
                        if (isLookingAway) {
                            this.triggerViolation('looking_away', Math.abs(gaze.yaw), {
                                direction: gaze.yaw > 0 ? 'right' : 'left',
                                deviation: gaze.yaw,
                                frames: this.lookingAwayCounter
                            });
                        }

                        if (isLookingDown) {
                            this.triggerViolation('looking_down', Math.abs(gaze.pitch), {
                                deviation: gaze.pitch,
                                frames: this.lookingAwayCounter
                            });
                        }

                        if (isLookingUp) {
                            this.triggerViolation('looking_up', gaze.pitch, {
                                deviation: gaze.pitch,
                                frames: this.lookingAwayCounter
                            });
                        }
                    }
                } else {
                    // Reset counter when looking at screen
                    this.lookingAwayCounter = 0;
                }
            }
        }

        // --- OBJECT DETECTION CHECKS ---

        if (this.config.objectDetectionEnabled && objectDetections.length > 0) {
            for (const detection of objectDetections) {
                if (detection.categories && detection.categories.length > 0) {
                    const category = detection.categories[0];
                    const objectName = category.categoryName.toLowerCase();
                    const confidence = category.score;

                    // Check if object is in prohibited list
                    // Use partial match, e.g. "cell phone" matches "cell" or "phone"
                    const isProhibited = this.config.prohibitedObjects.some(prohibited =>
                        objectName.includes(prohibited) || prohibited.includes(objectName)
                    );

                    // Exclude "person" since we detect faces separately
                    if (isProhibited && objectName !== 'person' && confidence > 0.5) {
                        this.triggerViolation('prohibited_object', confidence, {
                            object: objectName,
                            message: `Prohibited object detected: ${objectName}`
                        });
                    }
                }
            }
        }
    }

    /**
     * Calculate gaze direction from face landmarks using proper eye/pupil tracking
     * Uses 68-point face landmarks for detailed eye analysis
     */
    private calculateGazeDirection(landmarks: faceapi.FaceLandmarks68): GazeDirection {
        const positions = landmarks.positions;

        // ========== HEAD POSE ESTIMATION ==========
        // Get key facial points for head orientation
        const nose = positions[30];           // Nose tip
        const leftEyeOuter = positions[36];   // Left eye outer corner
        const leftEyeInner = positions[39];   // Left eye inner corner
        const rightEyeInner = positions[42];  // Right eye inner corner
        const rightEyeOuter = positions[45];  // Right eye outer corner
        const leftMouth = positions[48];      // Left mouth corner
        const rightMouth = positions[54];     // Right mouth corner

        // Calculate head yaw (left/right rotation)
        const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
        const eyeWidth = rightEyeOuter.x - leftEyeOuter.x;
        const headYaw = ((nose.x - eyeCenterX) / eyeWidth) * 2;

        // Calculate head pitch (up/down)
        const eyeCenterY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
        const eyeToMouthDist = ((leftMouth.y + rightMouth.y) / 2) - eyeCenterY;
        const noseToEyeDist = nose.y - eyeCenterY;
        const headPitch = ((noseToEyeDist / eyeToMouthDist) - 0.5) * 2;

        // Calculate head roll (tilt)
        const headRoll = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x);

        // ========== EYE/PUPIL TRACKING ==========
        // Left eye points: 36-41 (outer to inner, then bottom)
        // Right eye points: 42-47 (inner to outer, then bottom)

        // Left eye landmarks
        const leftEyePoints = {
            outer: positions[36],
            upperOuter: positions[37],
            upperInner: positions[38],
            inner: positions[39],
            lowerInner: positions[40],
            lowerOuter: positions[41]
        };

        // Right eye landmarks
        const rightEyePoints = {
            inner: positions[42],
            upperInner: positions[43],
            upperOuter: positions[44],
            outer: positions[45],
            lowerOuter: positions[46],
            lowerInner: positions[47]
        };

        // Calculate eye centers and approximate iris positions
        const leftEyeCenter = {
            x: (leftEyePoints.outer.x + leftEyePoints.inner.x) / 2,
            y: (leftEyePoints.upperInner.y + leftEyePoints.lowerInner.y) / 2
        };

        const rightEyeCenter = {
            x: (rightEyePoints.outer.x + rightEyePoints.inner.x) / 2,
            y: (rightEyePoints.upperInner.y + rightEyePoints.lowerInner.y) / 2
        };

        // Eye dimensions for normalization
        const leftEyeWidth = leftEyePoints.inner.x - leftEyePoints.outer.x;
        const rightEyeWidth = rightEyePoints.outer.x - rightEyePoints.inner.x;
        const leftEyeHeight = leftEyePoints.lowerInner.y - leftEyePoints.upperInner.y;
        const rightEyeHeight = rightEyePoints.lowerInner.y - rightEyePoints.upperInner.y;

        // Estimate pupil position based on eye aspect ratio and corner positions
        // The pupil tends to be slightly below center and varies with gaze
        // Use the average of upper and lower lid positions weighted toward center

        // Calculate Eye Aspect Ratio (EAR) - used for blink detection and eye openness
        const leftEAR = leftEyeHeight / Math.max(leftEyeWidth, 1);
        const rightEAR = rightEyeHeight / Math.max(rightEyeWidth, 1);
        const avgEAR = (leftEAR + rightEAR) / 2;

        // For gaze direction, we analyze the relative position of key eye landmarks
        // When looking left: inner corners of eyes shift relative to outer corners
        // When looking right: outer corners shift relative to inner corners

        // Horizontal gaze estimation based on eye shape asymmetry
        // Compare the position of eye center vs the geometric center
        const leftEyeGeometricCenter = (leftEyePoints.outer.x + leftEyePoints.inner.x) / 2;
        const rightEyeGeometricCenter = (rightEyePoints.inner.x + rightEyePoints.outer.x) / 2;

        // Calculate iris offset (approximated from lid positions)
        // When looking sideways, upper lid position shifts
        const leftUpperMidpoint = (leftEyePoints.upperOuter.x + leftEyePoints.upperInner.x) / 2;
        const rightUpperMidpoint = (rightEyePoints.upperOuter.x + rightEyePoints.upperInner.x) / 2;

        const leftIrisOffset = (leftUpperMidpoint - leftEyeGeometricCenter) / Math.max(leftEyeWidth, 1);
        const rightIrisOffset = (rightUpperMidpoint - rightEyeGeometricCenter) / Math.max(rightEyeWidth, 1);

        // Average iris offset gives horizontal gaze component
        const eyeGazeX = (leftIrisOffset + rightIrisOffset) / 2;

        // Vertical gaze estimation
        // When looking up/down, the ratio of upper to lower lid distance changes
        const leftUpperDist = leftEyeCenter.y - leftEyePoints.upperInner.y;
        const leftLowerDist = leftEyePoints.lowerInner.y - leftEyeCenter.y;
        const rightUpperDist = rightEyeCenter.y - rightEyePoints.upperInner.y;
        const rightLowerDist = rightEyePoints.lowerInner.y - rightEyeCenter.y;

        const leftVerticalRatio = leftUpperDist / Math.max(leftLowerDist, 1);
        const rightVerticalRatio = rightUpperDist / Math.max(rightLowerDist, 1);
        const avgVerticalRatio = (leftVerticalRatio + rightVerticalRatio) / 2;

        // Convert to gaze offset (-1 to 1 range)
        const eyeGazeY = (avgVerticalRatio - 1) * 0.5; // Centered around 1, scaled

        // ========== COMBINED GAZE CALCULATION ==========
        // Combine head pose with eye gaze for final direction
        // Weight: head pose has more influence on overall direction
        const headWeight = 0.6;
        const eyeWeight = 0.4;

        const finalYaw = (headYaw * headWeight) + (eyeGazeX * eyeWeight * 2);
        const finalPitch = (headPitch * headWeight) + (eyeGazeY * eyeWeight * 2);

        // Log gaze tracking occasionally for debugging
        if (this.lastFrameTime % 3000 < 100) {
            console.log('👁️ Eye Tracking:', {
                headYaw: headYaw.toFixed(2),
                headPitch: headPitch.toFixed(2),
                eyeGazeX: eyeGazeX.toFixed(2),
                eyeGazeY: eyeGazeY.toFixed(2),
                finalYaw: finalYaw.toFixed(2),
                finalPitch: finalPitch.toFixed(2),
                eyeAspectRatio: avgEAR.toFixed(2),
                threshold: this.config.gazeDeviationThreshold
            });
        }

        return {
            yaw: Math.max(-1, Math.min(1, finalYaw)),
            pitch: Math.max(-1, Math.min(1, finalPitch)),
            roll: headRoll
        };
    }

    /**
     * Trigger a violation with cooldown to prevent spam
     */
    private triggerViolation(type: ViolationType, confidence: number, metadata?: Record<string, any>): void {
        const now = Date.now();
        const lastViolation = this.violationCooldowns.get(type) || 0;

        // Use shorter cooldown for noise violations (2 seconds instead of 5)
        const cooldownMs = type === 'excessive_noise' ? 2000 : this.VIOLATION_COOLDOWN_MS;

        if (now - lastViolation < cooldownMs) {
            // Log cooldown blocks occasionally for debugging
            if (Math.random() < 0.05) {
                console.log(`⏳ Violation ${type} blocked by cooldown (${Math.round((cooldownMs - (now - lastViolation)) / 1000)}s remaining)`);
            }
            return; // Still in cooldown
        }

        this.violationCooldowns.set(type, now);

        const violation: ProctoringViolation = {
            type,
            timestamp: new Date(),
            confidence,
            metadata
        };

        console.log(`🚨 TRIGGERING VIOLATION: ${type}`, metadata);
        this.updateStatus({ lastViolation: violation });

        // Explicitly log the callback invocation
        if (this.config.onViolation) {
            console.log(`📞 Calling onViolation callback for: ${type}`);
            this.config.onViolation(violation);
        } else {
            console.warn(`⚠️ No onViolation callback configured for: ${type}`);
        }
    }

    // ========== VISUALIZATION ==========

    /**
     * Draw detections on canvas
     */
    private drawDetections(
        faceDetections: faceapi.WithFaceExpressions<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>>[],
        objectDetections: Detection[]
    ): void {
        if (!this.canvasElement || !this.videoElement) return;

        const displaySize = {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
        faceapi.matchDimensions(this.canvasElement, displaySize);

        const ctx = this.canvasElement.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Resize face detections to match display size
        const resizedFaceDetections = faceapi.resizeResults(faceDetections, displaySize);

        // --- DRAW FACES ---
        resizedFaceDetections.forEach((detection) => {
            const box = detection.detection.box;

            // Determine color based on verification status
            let color = '#22c55e'; // Green - verified
            if (this.faceMatcher) {
                const match = this.faceMatcher.findBestMatch(detection.descriptor);
                if (match.label !== 'registered') {
                    color = '#ef4444'; // Red - not verified
                }
            }

            // Draw box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Draw landmarks
            faceapi.draw.drawFaceLandmarks(this.canvasElement!, [detection]);
        });

        // --- DRAW OBJECTS ---
        // MediaPipe coordinates are 0-videoWidth/Height, but we need to ensure they match current canvas scale if different
        // Since we matched dimensions, it should be 1:1 if we use boundingBox directly?
        // MediaPipe uses `boundingBox` object

        objectDetections.forEach((detection) => {
            const bbox = detection.boundingBox;
            if (!bbox || !detection.categories || detection.categories.length === 0) return;

            const category = detection.categories[0];
            const objectName = category.categoryName;
            const confidence = Math.round(category.score * 100);

            // Ignore 'person' to avoid clutter over face detection
            if (objectName === 'person') return;

            // Color code prohibited items - Use Amber for ALL violations as requested
            const isProhibited = this.config.prohibitedObjects.some(p => objectName.toLowerCase().includes(p));

            // Use Amber (#fbbf24) for violations, or a neutral color/Amber for others if desired.
            // User said "use amber for all violations".
            const color = isProhibited ? '#fbbf24' : '#fbbf24';

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(bbox.originX, bbox.originY, bbox.width, bbox.height);

            // Label
            ctx.fillStyle = color;
            const text = `${objectName} ${confidence}%`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(bbox.originX, bbox.originY - 20, textWidth + 10, 20);
            ctx.fillStyle = '#000000'; // Black text on Amber background for contrast
            ctx.font = '12px sans-serif';
            ctx.fillText(text, bbox.originX + 5, bbox.originY - 5);
        });

        // Draw status info
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 80);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`Faces: ${faceDetections.length}`, 20, 30);
        ctx.fillText(`Objects: ${objectDetections.length}`, 20, 50);
        ctx.fillText(`FPS: ${this.fps}`, 20, 70);
    }

    // ========== UTILITY METHODS ==========

    private updateStatus(partial: Partial<ProctoringStatus>): void {
        this.currentStatus = { ...this.currentStatus, ...partial };
        this.config.onStatusChange?.(this.currentStatus);
    }

    getStatus(): ProctoringStatus {
        return { ...this.currentStatus };
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    updateConfig(config: Partial<ProctoringConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Take a snapshot for violation evidence
     */
    captureSnapshot(): string | null {
        if (!this.videoElement) return null;

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(this.videoElement, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Verify a single image against stored photo
     */
    async verifyImage(imageUrl: string): Promise<VerificationResult> {
        if (!this.storedFaceDescriptor) {
            throw new Error('No stored photo loaded for verification');
        }

        const img = await faceapi.fetchImage(imageUrl);
        const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return {
                isMatch: false,
                confidence: 0,
                distance: 1,
                threshold: this.config.verificationThreshold
            };
        }

        const distance = faceapi.euclideanDistance(this.storedFaceDescriptor, detection.descriptor);
        const isMatch = distance < this.config.verificationThreshold;

        return {
            isMatch,
            confidence: 1 - distance,
            distance,
            threshold: this.config.verificationThreshold
        };
    }
}

// ========== SINGLETON INSTANCE ==========

let proctoringServiceInstance: AIProctoringService | null = null;

export function getAIProctoringService(config?: Partial<ProctoringConfig>): AIProctoringService {
    if (!proctoringServiceInstance) {
        proctoringServiceInstance = new AIProctoringService(config);
    } else if (config) {
        proctoringServiceInstance.updateConfig(config);
    }
    return proctoringServiceInstance;
}

export function resetAIProctoringService(): void {
    if (proctoringServiceInstance) {
        proctoringServiceInstance.stop();
        proctoringServiceInstance = null;
    }
}

export default AIProctoringService;
