'use client'

import { useState, useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface ObjectDetectionResult {
    objects: Array<{
        class: string;
        score: number;
        bbox: [number, number, number, number];
    }>;
    suspiciousObjects: string[];
    violations: Array<{
        type: string;
        metadata: any;
        timestamp: string;
    }>;
}

export interface UseObjectDetectionOptions {
    videoElement: HTMLVideoElement | null;
    enabled?: boolean;
    detectionInterval?: number;
    suspiciousClasses?: string[];
}

const DEFAULT_SUSPICIOUS_CLASSES = [
    'cell phone',
    'laptop',
    'book',
    'tablet',
    'tv',
    'monitor'
];

export const useObjectDetection = ({
    videoElement,
    enabled = true,
    detectionInterval = 3000, // Check every 3 seconds
    suspiciousClasses = DEFAULT_SUSPICIOUS_CLASSES
}: UseObjectDetectionOptions) => {
    const [modelLoaded, setModelLoaded] = useState(false);
    const [objects, setObjects] = useState<ObjectDetectionResult['objects']>([]);
    const [suspiciousObjects, setSuspiciousObjects] = useState<string[]>([]);
    const [violations, setViolations] = useState<ObjectDetectionResult['violations']>([]);

    const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastViolationTime = useRef<{ [key: string]: number }>({});

    // Load COCO-SSD model
    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log('🔄 [OBJECT-DETECTION] Loading COCO-SSD model...');
                const startTime = performance.now();

                // Import TensorFlow.js and set backend
                const tf = await import('@tensorflow/tfjs');
                await tf.ready();
                console.log(`✅ [OBJECT-DETECTION] TensorFlow.js backend: ${tf.getBackend()}`);

                const model = await cocoSsd.load({
                    base: 'lite_mobilenet_v2' // Faster, lighter model
                });

                modelRef.current = model;
                const loadTime = performance.now() - startTime;
                console.log(`✅ [OBJECT-DETECTION] Model loaded in ${loadTime.toFixed(0)}ms`);
                setModelLoaded(true);
            } catch (error) {
                console.error('❌ [OBJECT-DETECTION] Failed to load model:', error);
                console.error('   Error details:', error instanceof Error ? error.message : String(error));
                console.error('   Make sure @tensorflow/tfjs and @tensorflow-models/coco-ssd are installed');
            }
        };

        loadModel();
    }, []);

    // Add violation
    const addViolation = (type: string, metadata: any) => {
        const now = Date.now();
        const lastTime = lastViolationTime.current[type] || 0;

        // Throttle: 10 seconds per violation type
        if (now - lastTime < 10000) {
            console.log(`⏸️ [OBJECT-VIOLATION] Throttled: ${type}`);
            return;
        }

        lastViolationTime.current[type] = now;

        const violation = {
            type,
            metadata,
            timestamp: new Date().toISOString()
        };

        console.log(`🚨 [OBJECT-VIOLATION] Added:`, violation);
        setViolations(prev => [...prev, violation]);
    };

    // Detection loop
    useEffect(() => {
        if (!enabled || !modelLoaded || !modelRef.current || !videoElement) {
            console.log('⏸️ [OBJECT-DETECTION] Not ready:', {
                enabled,
                modelLoaded,
                hasModel: !!modelRef.current,
                hasVideo: !!videoElement
            });
            return;
        }

        console.log('🚀 [OBJECT-DETECTION] Starting loop...');
        let count = 0;

        const detect = async () => {
            if (!videoElement || videoElement.readyState !== 4 || !modelRef.current) {
                console.log(`⏸️ [OBJECT-DETECTION] Video not ready (readyState: ${videoElement?.readyState})`);
                return;
            }

            try {
                count++;
                console.log(`\n🔍 [OBJECT-DETECTION #${count}] ========== START ==========`);
                const startTime = performance.now();

                const predictions = await modelRef.current.detect(videoElement);

                setObjects(predictions.map(p => ({
                    class: p.class,
                    score: p.score,
                    bbox: p.bbox as [number, number, number, number]
                })));

                // Filter for suspicious objects
                const suspicious = predictions.filter(p =>
                    suspiciousClasses.includes(p.class) && p.score > 0.5
                );

                const suspiciousClassNames = suspicious.map(p => p.class);
                setSuspiciousObjects(suspiciousClassNames);

                if (predictions.length > 0) {
                    console.log(`📱 [OBJECT-DETECTION #${count}] Found ${predictions.length} objects:`,
                        predictions.map(p => `${p.class} (${(p.score * 100).toFixed(0)}%)`).join(', ')
                    );
                } else {
                    console.log(`📱 [OBJECT-DETECTION #${count}] No objects detected`);
                }

                if (suspicious.length > 0) {
                    console.warn(`⚠️ [OBJECT-DETECTION #${count}] SUSPICIOUS:`, suspiciousClassNames);

                    addViolation('UNWANTED_OBJECT_DETECTED', {
                        objects: suspicious.map(p => ({
                            class: p.class,
                            confidence: p.score
                        }))
                    });
                }

                const time = performance.now() - startTime;
                console.log(`⏱️ [OBJECT-DETECTION #${count}] Done in ${time.toFixed(0)}ms`);
                console.log(`🔍 [OBJECT-DETECTION #${count}] ========== END ==========\n`);

            } catch (error) {
                console.error(`❌ [OBJECT-DETECTION #${count}] Error:`, error);
                console.error(`   Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            }
        };

        // Run first detection immediately
        detect();
        detectionIntervalRef.current = setInterval(detect, detectionInterval);

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                console.log('🛑 [OBJECT-DETECTION] Stopped');
            }
        };
    }, [enabled, modelLoaded, videoElement, detectionInterval, suspiciousClasses]);

    return {
        modelLoaded,
        objects,
        suspiciousObjects,
        violations,
        clearViolations: () => setViolations([])
    };
};
