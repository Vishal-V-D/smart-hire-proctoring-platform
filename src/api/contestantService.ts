// src/api/contestantService.ts

import axiosContestClient from "./axiosContestClient";

// ========== TYPES ==========

export type OTPSendRequest = {
    email: string;
    assessmentId: string;
};

export type OTPVerifyRequest = {
    email: string;
    otp: string;
    assessmentId: string;
};

export type RegistrationData = {
    email: string;
    fullName: string;
    college: string;
    department: string;
    registrationNumber: string;
    cgpa: number;
    resumeUrl: string;
    idCardUrl: string;
    assessmentId: string;
    invitationId: string;
};

export type SystemChecks = {
    browser: boolean;
    camera: boolean;
    mic: boolean;
    screenShare: boolean;
};

export type ContestantAssessment = {
    id: string;
    title: string;
    description: string;
    duration: number;
    startDate: string;
    endDate: string;
    status: string;
    sections: any[];
    proctoringSettings: ProctoringSettings;
    navigationSettings?: {
        allowPreviousNavigation: boolean;
        allowMarkForReview: boolean;
    };
};

export type AssessmentSection = {
    id: string;
    title: string;
    description: string;
    duration: number;
    type: string;
    orderIndex: number;
    questions?: any[];
    problems?: any[];
    sqlQuestions?: any[];
};

export type AssessmentQuestion = {
    id: string;
    text: string;
    type: string;
    options?: string[];
    image?: string;
    marks: number;
    difficulty: string;
    // Note: correctAnswer is HIDDEN for contestants
};

// ========== API SERVICE ==========

const API_BASE = '/contestant';

export const contestantService = {
    // ========== INVITATION ENDPOINTS ==========

    /**
     * Verify invitation token (Step 1)
     */
    verifyInvitation: (token: string) =>
        axiosContestClient.post<{ success: boolean; data: { email: string; assessmentId: string } }>(
            `/invitations/verify`,
            { token }
        ),

    // ========== OTP ENDPOINTS ==========

    /**
     * Send OTP to email (Step 2)
     */
    sendOTP: (data: OTPSendRequest) =>
        axiosContestClient.post(`${API_BASE}/otp/send`, data),

    /**
     * Verify OTP code (Step 3)
     */
    verifyOTP: (data: OTPVerifyRequest) =>
        axiosContestClient.post(`${API_BASE}/otp/verify`, data),

    // ========== REGISTRATION ENDPOINTS ==========

    /**
     * Upload resume file
     */
    uploadResume: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosContestClient.post<{ url: string }>(`${API_BASE}/upload/resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Upload ID card file
     */
    uploadIdCard: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosContestClient.post<{ url: string }>(`${API_BASE}/upload/id-card`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    /**
     * Submit registration form (Step 4)
     */
    register: (data: RegistrationData) =>
        axiosContestClient.post<{
            success: boolean;
            user: any;
            profile: any;
            sessionToken: string;
            token: string; // JWT
        }>(`${API_BASE}/register`, data),

    /**
     * Check if user is already registered for this contest
     * GET /contestant/registration/:contestId/check
     */
    checkRegistrationStatus: (assessmentId: string, email: string) =>
        axiosContestClient.get<{ success: boolean; isRegistered: boolean }>(
            `/contest/registration/${assessmentId}/check`,
            { params: { email } }
        ),

    // ========== SESSION ENDPOINTS ==========

    /**
     * Validate session token
     */
    validateSession: (sessionToken: string) =>
        axiosContestClient.get(`${API_BASE}/session/validate`, {
            params: { sessionToken }
        }),

    /**
     * Record proctoring consent
     */
    recordConsent: (sessionToken: string) =>
        axiosContestClient.post(`${API_BASE}/session/consent`, { sessionToken }),

    /**
     * Record system checks
     */
    recordSystemCheck: (sessionToken: string, checks: SystemChecks) =>
        axiosContestClient.post(`${API_BASE}/session/system-check`, {
            sessionToken,
            checks
        }),

    // ========== ASSESSMENT VIEWING ==========

    /**
     * Get my invited assessments
     */
    getMyAssessments: () =>
        axiosContestClient.get<{ success: boolean; assessments: ContestantAssessment[] }>(
            `${API_BASE}/assessments`
        ),

    /**
     * Get assessment details
     */
    getAssessment: (id: string) =>
        axiosContestClient.get<{ success: boolean; assessment: ContestantAssessment }>(
            `${API_BASE}/assessments/${id}`
        ),

    /**
     * Get assessment sections
     */
    getSections: (assessmentId: string) =>
        axiosContestClient.get<{ success: boolean; sections: AssessmentSection[] }>(
            `${API_BASE}/assessments/${assessmentId}/sections`
        ),

    /**
     * Get section questions (correctAnswer is hidden)
     */
    getQuestions: (assessmentId: string, sectionId: string) =>
        axiosContestClient.get<{
            success: boolean;
            questions: AssessmentQuestion[];
            problems: any[];
        }>(`${API_BASE}/assessments/${assessmentId}/sections/${sectionId}/questions`),

    // ========== ASSESSMENT TAKING ==========

    /**
     * Start assessment - begins timing
     * POST /contestant/assessments/:id/start
     */
    startAssessment: (assessmentId: string, sessionToken: string) =>
        axiosContestClient.post<{
            success: boolean;
            message: string;
            data: {
                submissionId: string;
                assessmentId: string;
                startedAt: string;
                maxScore: number;
                sections: Array<{
                    id: string;
                    title: string;
                    timeLimit: number;
                    type: string;
                }>;
            };
        }>(`${API_BASE}/assessments/${assessmentId}/start`, { sessionToken }),

    /**
     * Get overall assessment timer (global time remaining)
     * GET /contestant/assessments/:id/timer
     */
    getAssessmentTimer: (assessmentId: string, sectionId?: string) =>
        axiosContestClient.get<{
            success: boolean;
            data: {
                timeLeft: number;    // Seconds remaining
                timeUsed: number;    // Seconds used
                totalTime: number;   // Total limit in seconds
                status: 'running' | 'completed' | 'expired';
            };
        }>(`${API_BASE}/assessments/${assessmentId}/timer`, {
            params: sectionId ? { sectionId } : undefined
        }),

    /**
     * Start section timer (for section-timed assessments)
     * POST /contestant/assessments/:id/sections/:sectionId/start
     */
    startSection: (assessmentId: string, sectionId: string, submissionId?: string) =>
        axiosContestClient.post<{
            success: boolean;
            message: string;
            data: {
                sectionId: string;
                sectionTitle: string;
                timeLimit: number;  // seconds
                timeSpent: number;  // seconds
                timeRemaining: number;  // seconds
                startedAt: string;
            };
        }>(`${API_BASE}/assessments/${assessmentId}/sections/${sectionId}/start`,
            submissionId ? { submissionId } : {}),

    /**
     * Get section timer
     * GET /contestant/assessments/:id/sections/:sectionId/timer
     */
    getSectionTimer: (assessmentId: string, sectionId: string) =>
        axiosContestClient.get<{
            success: boolean;
            data: {
                sectionId: string;
                timeLimit: number;  // minutes
                timeSpent: number;  // minutes
                timeRemaining: number;  // minutes
                startedAt: string;
                status: 'in_progress' | 'completed' | 'expired';
            };
        }>(`${API_BASE}/assessments/${assessmentId}/sections/${sectionId}/timer`),

    /**
     * Complete a section (stop timer)
     * POST /contestant/assessments/:id/sections/:sectionId/complete
     */
    completeSection: (assessmentId: string, sectionId: string) =>
        axiosContestClient.post<{ success: boolean; message: string }>(
            `${API_BASE}/assessments/${assessmentId}/sections/${sectionId}/complete`
        ),


    // ========== SESSION MANAGEMENT ==========

    /**
     * Store tokens (JWT in localStorage, Session in sessionStorage)
     */
    /**
     * Store tokens (JWT in localStorage, Session in sessionStorage)
     * Also sets cookie for middleware validation
     */
    storeSession: (sessionToken: string, jwtToken: string, assessmentId: string) => {
        // Store JWT for API access
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('contestant_token', jwtToken); // Backup/Alternate

        // Store Session Token for Exam Lifecycle (Session Storage)
        sessionStorage.setItem('sessionToken', sessionToken);
        sessionStorage.setItem('assessmentId', assessmentId);

        // Set Cookie for Middleware (Server-side checks)
        // Max-age: 24 hours (86400 seconds)
        document.cookie = `token=${jwtToken}; path=/; max-age=86400; SameSite=Lax`;
    },

    /**
     * Get tokens
     */
    getSession: (): { sessionToken: string | null; token: string | null; assessmentId: string | null } => {
        return {
            sessionToken: sessionStorage.getItem('sessionToken'),
            token: localStorage.getItem('token'),
            assessmentId: sessionStorage.getItem('assessmentId')
        };
    },

    /**
     * Clear all session data
     */
    clearSession: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('contestant_token');
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('assessmentId');

        // Clear cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    },

    // ========== MONITORING ==========

    /**
     * Record a proctoring violation
     */
    recordViolation: (sessionToken: string, type: ViolationType, metadata?: any) =>
        axiosContestClient.post(`${API_BASE}/monitor/violation`, {
            sessionToken,
            type,
            metadata,
            timestamp: new Date().toISOString()
        }),

    // ========== SUBMISSION ENDPOINTS ==========

    /**
     * Get or create active submission for an assessment
     * POST /contestant/assessments/:id/submission
     */
    getOrCreateSubmission: (assessmentId: string, sessionId: string) =>
        axiosContestClient.post<{
            success: boolean;
            submission: AssessmentSubmission;
            isNew: boolean;
        }>(`${API_BASE}/assessments/${assessmentId}/submission`, { sessionId }),

    /**
     * Save answer during test (auto-save)
     * POST /contestant/assessments/:id/answers
     */
    saveAnswer: (assessmentId: string, data: SaveAnswerRequest) =>
        axiosContestClient.post<{
            success: boolean;
            answerId: string;
        }>(`${API_BASE}/assessments/${assessmentId}/answers`, data),

    /**
     * Get saved answers for resume functionality
     * GET /contestant/assessments/:id/answers
     */
    getSavedAnswers: (assessmentId: string) =>
        axiosContestClient.get<{
            success: boolean;
            answers: SavedAnswer[];
        }>(`${API_BASE}/assessments/${assessmentId}/answers`),

    /**
     * Submit assessment (final submission - Submit All button)
     * POST /contestant/assessments/:id/submit
     */
    submitAssessment: (assessmentId: string, data?: BulkSubmitRequest) =>
        axiosContestClient.post<{
            success: boolean;
            submission: AssessmentSubmission;
            message: string;
        }>(`${API_BASE}/assessments/${assessmentId}/submit`, data),

    // ========== PHOTO VERIFICATION ENDPOINTS ==========

    /**
     * Upload live photo for verification
     * POST /api/contestant/verify/photo
     */
    uploadVerificationPhoto: (data: { assessmentId: string; sessionId: string; photo: string }) =>
        axiosContestClient.post<{
            success: boolean;
            data: {
                storedPhotoUrl: string;
                livePhotoUrl: string;
                sessionId: string;
                timestamp: string;
                message: string;
            };
        }>('/contestant/verify/photo', data),
};

// Violation Types
export type ViolationType =
    | 'window_swap'
    | 'tab_switch'
    | 'full_screen_exit'
    | 'multiple_people'
    | 'no_face'
    | 'looking_away'
    | 'camera_blocked'
    | 'mic_muted'
    | 'prohibited_object'
    | 'right_click'
    | 'copy_paste'
    | 'excessive_noise';

export interface ProctoringSettings {
    enabled: boolean;
    imageMonitoring: boolean;
    videoMonitoring: boolean;
    screenRecording: boolean;
    audioMonitoring: boolean;
    audioRecording: boolean;
    objectDetection: boolean;
    personDetection: boolean;
    faceDetection: boolean;
    eyeTracking: boolean;
    noiseDetection: boolean;
    fullscreen: boolean;
    tabSwitchLimit: number;
    disableCopyPaste: boolean;
    blockExternalMonitor: boolean;
    blockRightClick: boolean;
    verifyIDCard: boolean;
    verifyFace: boolean;
}

// ========== SUBMISSION TYPES ==========

export interface AssessmentSubmission {
    id: string;
    assessmentId: string;
    contestantId: string;
    status: 'in_progress' | 'submitted' | 'graded';
    startedAt: string;
    submittedAt?: string;
    totalScore?: number;
    totalMarks?: number;
    percentage?: number;
    timeTaken?: number; // in seconds
    currentSectionId?: string;
}

export interface SaveAnswerRequest {
    questionId: string;
    sectionId: string;
    answer: string | string[]; // string for single choice/text, string[] for multiple choice
    timeSpent?: number; // time spent on this question in seconds
}

export interface SavedAnswer {
    id: string;
    questionId: string;
    sectionId: string;
    answer: string | string[];
    savedAt: string;
    timeSpent?: number;
}

export interface BulkSubmitRequest {
    submissionId?: string;
    isAutoSubmit?: boolean;
    answers: BulkAnswerItem[];
}

export interface BulkAnswerItem {
    sectionId: string;
    questionId?: string; // For MCQ
    selectedAnswer?: string | string[]; // For MCQ
    problemId?: string; // For Coding
    code?: string; // For Coding
    language?: string; // For Coding
}
