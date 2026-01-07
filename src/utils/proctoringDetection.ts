/**
 * Proctoring Detection Utility
 * 
 * Combines object detection (COCO-SSD) with face detection (face-api.js)
 * for comprehensive proctoring monitoring.
 * 
 * Object Detection: Detects suspicious items like phones, laptops, books
 * Face Detection: Uses existing faceDetection.ts utilities
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

// ==================== TYPES ====================

export interface DetectedObject {
    class: string;
    score: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface ObjectDetectionResult {
    objects: DetectedObject[];
    suspiciousObjects: DetectedObject[];
    hasSuspiciousObjects: boolean;
    primarySuspicious: string | null; // The most confident suspicious object
}

export interface ObjectDetectionOptions {
    confidenceThreshold?: number;
    suspiciousClasses?: string[];
}

// ==================== CONSTANTS ====================

export const DEFAULT_SUSPICIOUS_CLASSES = [
    'cell phone',
    'laptop',
    'book',
    'tablet',
    'tv',
    'remote',
    'keyboard'
];

export const SUSPICIOUS_CLASS_LABELS: Record<string, string> = {
    'cell phone': '📱 Phone',
    'laptop': '💻 Laptop',
    'book': '📚 Book',
    'tablet': '📱 Tablet',
    'tv': '📺 Screen',
    'remote': '🎮 Remote',
    'keyboard': '⌨️ Keyboard'
};

// ==================== MODULE STATE ====================

let objectModel: cocoSsd.ObjectDetection | null = null;
let isModelLoading = false;
let modelLoadError: string | null = null;

// ==================== MODEL LOADING ====================

/**
 * Load the COCO-SSD object detection model
 * Uses lite_mobilenet_v2 for faster, lighter performance
 */
export async function loadObjectDetectionModel(): Promise<boolean> {
    if (objectModel) {
        console.log('✅ [OBJECT-MODEL] Already loaded');
        return true;
    }

    if (isModelLoading) {
        console.log('⏳ [OBJECT-MODEL] Loading in progress...');
        // Wait for loading to complete
        while (isModelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return objectModel !== null;
    }

    isModelLoading = true;
    modelLoadError = null;

    try {
        console.log('🔄 [OBJECT-MODEL] Loading COCO-SSD model...');
        const startTime = performance.now();

        // Import TensorFlow.js and ensure backend is ready
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        console.log(`✅ [OBJECT-MODEL] TensorFlow.js backend: ${tf.getBackend()}`);

        // Load COCO-SSD with lite model for better performance
        objectModel = await cocoSsd.load({
            base: 'lite_mobilenet_v2'
        });

        const loadTime = performance.now() - startTime;
        console.log(`✅ [OBJECT-MODEL] Loaded in ${loadTime.toFixed(0)}ms`);

        isModelLoading = false;
        return true;
    } catch (error) {
        console.error('❌ [OBJECT-MODEL] Failed to load:', error);
        modelLoadError = error instanceof Error ? error.message : String(error);
        isModelLoading = false;
        return false;
    }
}

/**
 * Check if object detection model is loaded
 */
export function isObjectModelLoaded(): boolean {
    return objectModel !== null;
}

/**
 * Get model loading error if any
 */
export function getModelLoadError(): string | null {
    return modelLoadError;
}

// ==================== OBJECT DETECTION ====================

/**
 * Detect objects in a video frame
 * Returns all detected objects and filters suspicious ones
 */
export async function detectObjects(
    videoElement: HTMLVideoElement,
    options: ObjectDetectionOptions = {}
): Promise<ObjectDetectionResult> {
    const {
        confidenceThreshold = 0.5,
        suspiciousClasses = DEFAULT_SUSPICIOUS_CLASSES
    } = options;

    // Empty result for error cases
    const emptyResult: ObjectDetectionResult = {
        objects: [],
        suspiciousObjects: [],
        hasSuspiciousObjects: false,
        primarySuspicious: null
    };

    // Check if model is loaded
    if (!objectModel) {
        console.warn('⚠️ [OBJECT-DETECT] Model not loaded');
        return emptyResult;
    }

    // Check video state
    if (!videoElement || videoElement.readyState < 2) {
        console.warn('⚠️ [OBJECT-DETECT] Video not ready');
        return emptyResult;
    }

    try {
        // Run detection
        const predictions = await objectModel.detect(videoElement);

        // Convert to our format
        const objects: DetectedObject[] = predictions.map(p => ({
            class: p.class,
            score: p.score,
            bbox: p.bbox as [number, number, number, number]
        }));

        // Filter suspicious objects above threshold
        const suspiciousObjects = objects.filter(obj =>
            suspiciousClasses.includes(obj.class) && obj.score >= confidenceThreshold
        );

        // Sort by confidence and get primary suspicious
        const sortedSuspicious = [...suspiciousObjects].sort((a, b) => b.score - a.score);
        const primarySuspicious = sortedSuspicious.length > 0
            ? SUSPICIOUS_CLASS_LABELS[sortedSuspicious[0].class] || sortedSuspicious[0].class
            : null;

        return {
            objects,
            suspiciousObjects,
            hasSuspiciousObjects: suspiciousObjects.length > 0,
            primarySuspicious
        };
    } catch (error) {
        console.error('❌ [OBJECT-DETECT] Detection error:', error);
        return emptyResult;
    }
}

// ==================== VIOLATION HELPERS ====================

export type ProctoringViolationType =
    | 'NO_FACE_DETECTED'
    | 'MULTIPLE_FACES'
    | 'FACE_MISMATCH'
    | 'AUDIO_NOISE_DETECTED'
    | 'SCREEN_BLACK_DETECTED'
    | 'UNWANTED_OBJECT_DETECTED';

export interface ViolationDetails {
    type: ProctoringViolationType;
    message: string;
    severity: 'warning' | 'error';
    metadata?: Record<string, unknown>;
}

/**
 * Create a violation details object with appropriate message
 */
export function createViolationDetails(
    type: ProctoringViolationType,
    metadata?: Record<string, unknown>
): ViolationDetails {
    const violationConfig: Record<ProctoringViolationType, { message: string; severity: 'warning' | 'error' }> = {
        'NO_FACE_DETECTED': {
            message: '⚠️ No Face Detected!',
            severity: 'warning'
        },
        'MULTIPLE_FACES': {
            message: `🚨 ${(metadata?.faceCount as number) || 'Multiple'} Faces Detected!`,
            severity: 'error'
        },
        'FACE_MISMATCH': {
            message: `❌ Face Mismatch (${Math.round(((metadata?.confidence as number) || 0) * 100)}%)`,
            severity: 'error'
        },
        'AUDIO_NOISE_DETECTED': {
            message: '🔊 Loud Audio Detected!',
            severity: 'warning'
        },
        'SCREEN_BLACK_DETECTED': {
            message: '⚫ Camera Blocked!',
            severity: 'warning'
        },
        'UNWANTED_OBJECT_DETECTED': {
            message: `📱 ${(metadata?.objectName as string) || 'Suspicious Object'} Detected!`,
            severity: 'error'
        }
    };

    const config = violationConfig[type];
    return {
        type,
        message: config.message,
        severity: config.severity,
        metadata
    };
}

/**
 * Get a user-friendly label for a detected object class
 */
export function getObjectLabel(objectClass: string): string {
    return SUSPICIOUS_CLASS_LABELS[objectClass] || objectClass;
}

// ==================== LOGGING HELPERS ====================

/**
 * Log object detection results in a formatted way
 */
export function logObjectDetection(
    detectionNumber: number,
    result: ObjectDetectionResult,
    detectionTimeMs: number
): void {
    console.log(`\n${'📦'.repeat(20)}`);
    console.log(`📦 [OBJECT-DETECT #${detectionNumber}]`);
    console.log(`   Total Objects: ${result.objects.length}`);

    if (result.objects.length > 0) {
        console.log(`   Detected: ${result.objects.map(o => `${o.class} (${Math.round(o.score * 100)}%)`).join(', ')}`);
    }

    if (result.hasSuspiciousObjects) {
        console.log(`   ⚠️ SUSPICIOUS: ${result.suspiciousObjects.map(o => `${o.class} (${Math.round(o.score * 100)}%)`).join(', ')}`);
    }

    console.log(`   ⏱️ Time: ${detectionTimeMs.toFixed(0)}ms`);
    console.log(`${'📦'.repeat(20)}\n`);
}
