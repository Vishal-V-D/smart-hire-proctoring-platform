/**
 * Face Detection and Recognition Utility
 * 
 * Uses SSD MobileNet for better accuracy in low-light conditions
 * TinyFaceDetector as fallback for faster but less accurate detection
 */

import * as faceapi from 'face-api.js';

// Model URLs with fallback
export const MODEL_URLS = {
    primary: 'https://nmuvcmxqukorhtzahbtf.supabase.co/storage/v1/object/public/face-models',
    fallback: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
};

export interface FaceDetectionOptions {
    inputSize?: number;
    scoreThreshold?: number;
    matchThreshold?: number;
    useSsdMobilenet?: boolean;  // Use more accurate model
}

export interface FaceDetectionResult {
    faceCount: number;
    status: 'no-face' | 'match' | 'mismatch' | 'multiple';
    confidence: number;
    distance?: number;
    detectionScores?: number[];
}

let modelsLoaded = false;
let useSsdModel = true;

/**
 * Load face-api.js models with fallback
 * Loads SSD MobileNet for better accuracy + TinyFaceDetector as backup
 */
export async function loadFaceModels(): Promise<void> {
    if (modelsLoaded) {
        console.log('✅ [MODELS] Already loaded');
        return;
    }

    console.log('🔄 [MODELS] Loading face detection models...');
    const startTime = performance.now();

    let modelUrl = MODEL_URLS.primary;

    try {
        console.log('⏳ [MODELS] Loading from Supabase...');
        await Promise.all([
            // SSD MobileNet - more accurate, better in low light
            faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
            // TinyFaceDetector - faster, less accurate (backup)
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
            // Face landmarks
            faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
            // Face recognition
            faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
        ]);
        console.log('✅ [MODELS] Loaded from Supabase');
        useSsdModel = true;
    } catch (error) {
        console.warn('⚠️ [MODELS] Supabase failed, trying CDN...');
        modelUrl = MODEL_URLS.fallback;

        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
                faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
            ]);
            console.log('✅ [MODELS] Loaded from CDN');
            useSsdModel = true;
        } catch (fallbackError) {
            // Last resort - just TinyFaceDetector
            console.warn('⚠️ [MODELS] SSD failed, loading TinyFaceDetector only...');
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
            ]);
            useSsdModel = false;
        }
    }

    modelsLoaded = true;
    const loadTime = performance.now() - startTime;
    console.log(`✅ [MODELS] All models loaded in ${loadTime.toFixed(0)}ms`);
    console.log(`📊 [MODELS] Using: ${useSsdModel ? 'SSD MobileNet (accurate)' : 'TinyFaceDetector (fast)'}`);
}

/**
 * Create face descriptor from reference photo
 * Uses SSD MobileNet for better detection in varied lighting
 */
export async function createFaceDescriptor(imageUrl: string): Promise<Float32Array | null> {
    try {
        console.log('🔄 [DESCRIPTOR] Creating from:', imageUrl);

        const img = await faceapi.fetchImage(imageUrl);

        // Try SSD MobileNet first (better for photos)
        let detection = null;

        if (useSsdModel) {
            console.log('🔍 [DESCRIPTOR] Using SSD MobileNet...');
            detection = await faceapi
                .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({
                    minConfidence: 0.3  // Lower threshold for varied photos
                }))
                .withFaceLandmarks()
                .withFaceDescriptor();
        }

        // Fallback to TinyFaceDetector
        if (!detection) {
            console.log('🔍 [DESCRIPTOR] Trying TinyFaceDetector...');
            detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,      // Larger for better accuracy
                    scoreThreshold: 0.3  // Lower for varied conditions
                }))
                .withFaceLandmarks()
                .withFaceDescriptor();
        }

        if (detection) {
            console.log('✅ [DESCRIPTOR] Face found!');
            console.log(`📊 [DESCRIPTOR] Score: ${detection.detection.score.toFixed(2)}`);
            return detection.descriptor;
        } else {
            console.warn('⚠️ [DESCRIPTOR] No face found in image');
            return null;
        }
    } catch (error) {
        console.error('❌ [DESCRIPTOR] Failed:', error);
        return null;
    }
}

/**
 * Detect and recognize faces in video element
 * Uses SSD MobileNet for better low-light detection
 */
export async function detectAndRecognizeFaces(
    videoElement: HTMLVideoElement,
    referenceDescriptor: Float32Array,
    options: FaceDetectionOptions = {}
): Promise<FaceDetectionResult> {
    const {
        inputSize = 320,           // Larger input for better accuracy
        scoreThreshold = 0.3,      // Lower threshold for low light
        matchThreshold = 0.5       // Slightly more lenient matching
    } = options;

    try {
        let detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[] = [];

        // Try SSD MobileNet first (better accuracy, especially low light)
        if (useSsdModel) {
            try {
                detections = await faceapi
                    .detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options({
                        minConfidence: scoreThreshold
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length > 0) {
                    console.log(`🔍 [DETECT] SSD found ${detections.length} face(s)`);
                }
            } catch (ssdError) {
                console.warn('⚠️ [DETECT] SSD failed, trying TinyFaceDetector...');
            }
        }

        // Fallback to TinyFaceDetector if SSD found nothing or failed
        if (detections.length === 0) {
            detections = await faceapi
                .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
                    inputSize,
                    scoreThreshold: Math.max(scoreThreshold - 0.1, 0.2)  // Even lower for fallback
                }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length > 0) {
                console.log(`🔍 [DETECT] TinyFace found ${detections.length} face(s)`);
            }
        }

        const faceCount = detections.length;
        const detectionScores = detections.map(d => d.detection.score);

        // No face detected
        if (faceCount === 0) {
            console.log('⚠️ [DETECT] No face detected');
            return {
                faceCount: 0,
                status: 'no-face',
                confidence: 0,
                detectionScores: []
            };
        }

        // Multiple faces detected
        if (faceCount > 1) {
            console.log(`🚨 [DETECT] Multiple faces: ${faceCount}`);
            return {
                faceCount,
                status: 'multiple',
                confidence: 0,
                detectionScores
            };
        }

        // Single face - compare with reference
        const detection = detections[0];
        const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
        const similarity = Math.max(0, 1 - distance);

        console.log(`👤 [DETECT] Single face - Score: ${detection.detection.score.toFixed(2)}, Distance: ${distance.toFixed(3)}`);

        // Face mismatch (distance too high)
        if (distance > matchThreshold) {
            console.log(`❌ [DETECT] Mismatch - distance ${distance.toFixed(3)} > threshold ${matchThreshold}`);
            return {
                faceCount: 1,
                status: 'mismatch',
                confidence: similarity,
                distance,
                detectionScores
            };
        }

        // Face match!
        console.log(`✅ [DETECT] Match - similarity ${(similarity * 100).toFixed(0)}%`);
        return {
            faceCount: 1,
            status: 'match',
            confidence: similarity,
            distance,
            detectionScores
        };

    } catch (error) {
        console.error('❌ [DETECT] Error:', error);
        // Return no-face on error to avoid false violations
        return {
            faceCount: 0,
            status: 'no-face',
            confidence: 0
        };
    }
}

/**
 * Violation tracker with throttling
 */
export class ViolationTracker {
    private lastViolationTime: { [key: string]: number } = {};
    private throttleMs: number;

    constructor(throttleMs: number = 5000) {
        this.throttleMs = throttleMs;
    }

    shouldReport(violationType: string): boolean {
        const now = Date.now();
        const lastTime = this.lastViolationTime[violationType] || 0;

        if (now - lastTime < this.throttleMs) {
            console.log(`⏸️ [THROTTLE] ${violationType} (wait ${((this.throttleMs - (now - lastTime)) / 1000).toFixed(1)}s)`);
            return false;
        }

        this.lastViolationTime[violationType] = now;
        return true;
    }

    reset() {
        this.lastViolationTime = {};
    }
}

/**
 * Format detection result for logging
 */
export function formatDetectionLog(
    detectionNumber: number,
    result: FaceDetectionResult,
    detectionTime: number
): void {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`👁️ [DETECTION #${detectionNumber}] Faces: ${result.faceCount} | Status: ${result.status}`);

    if (result.confidence > 0) {
        console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    }
    if (result.detectionScores && result.detectionScores.length > 0) {
        console.log(`🎯 Detection scores: ${result.detectionScores.map(s => s.toFixed(2)).join(', ')}`);
    }
    console.log(`⏱️ Time: ${detectionTime.toFixed(0)}ms`);
    console.log(`${'='.repeat(50)}\n`);
}
