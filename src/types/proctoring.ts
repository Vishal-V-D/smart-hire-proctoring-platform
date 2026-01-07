// types/proctoring.ts

export interface ProctoringSettings {
    enableVideoProctoring: boolean;
    enableAudioMonitoring: boolean;
    enableCopyPasteDetection: boolean;
    enableTabSwitchDetection: boolean;
    enableScreenshotCapture: boolean;
    enableFaceRecognition: boolean;
    enableFullscreenMode: boolean;
    requireCameraAccess: boolean;
    requireMicrophoneAccess: boolean;
    screenshotIntervalSeconds: number | null;
}

export interface ProctoringResponse {
    proctoringEnabled: boolean;
    message?: string;
    settings?: ProctoringSettings;
}

export interface ViolationResponse {
    id?: string;
    skipped?: boolean;
    message?: string;
    violationType?: string;
    proctoringStatus?: Partial<ProctoringSettings>;
}

// Default proctoring settings (all enabled)
export const DEFAULT_PROCTORING_SETTINGS: ProctoringSettings = {
    enableVideoProctoring: true,
    enableAudioMonitoring: false,
    enableCopyPasteDetection: true,
    enableTabSwitchDetection: true,
    enableScreenshotCapture: true,
    enableFaceRecognition: true,
    enableFullscreenMode: true,
    requireCameraAccess: true,
    requireMicrophoneAccess: false,
    screenshotIntervalSeconds: 60,
};
