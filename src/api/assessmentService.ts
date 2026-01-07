// src/api/assessmentService.ts

import axiosContestClient from "./axiosContestClient";

export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CreateAssessmentData = {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    duration: number;
    timeMode: 'section' | 'global';
    globalTime: number;
    proctoringSettings: {
        enabled: boolean;

        // Monitoring
        imageMonitoring: boolean;
        videoMonitoring: boolean;
        screenRecording: boolean;
        audioMonitoring: boolean;
        audioRecording: boolean;

        // AI Features
        objectDetection: boolean;
        personDetection: boolean;
        faceDetection: boolean;
        eyeTracking: boolean;
        noiseDetection: boolean;

        // Lockdown
        fullscreen: boolean;
        tabSwitchLimit: number;
        disableCopyPaste: boolean;
        blockExternalMonitor: boolean;
        blockRightClick: boolean;

        // Verification
        verifyIDCard: boolean;
        verifyFace: boolean;
    };
    sections: AssessmentSectionData[];
};

export type AssessmentSectionData = {
    title: string;
    description: string;
    type: 'aptitude' | 'technical' | 'coding' | 'subjective';
    questionCount: number;
    marksPerQuestion: number;
    timeLimit: number;
    negativeMarking: number;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
    enabledPatterns: string[];
    themeColor: string;
    orderIndex: number;
    questions: QuestionData[];
};

export type QuestionData = {
    id?: string; // For updates
    text?: string; // Optional for coding questions with problemId
    image?: string;
    type: 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding';
    options?: string[];
    correctAnswer?: string | string[];
    codeStub?: string;
    problemId?: string; // For coding questions from problem bank
    marks: number;
    orderIndex: number;
};

export type AssessmentListParams = {
    page?: number;
    limit?: number;
    status?: AssessmentStatus;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
};

// ========== VIOLATION TYPES ==========

export type ViolationType =
    | 'THIRD_EYE'           // 3rd Eye detection
    | 'SCREEN_COUNT'        // Multiple screens detected
    | 'FULLSCREEN_EXIT'     // Exited mandatory fullscreen
    | 'SAFE_BROWSER'        // Safe browser violation
    | 'DESKTOP_APPS'        // Desktop apps opened
    | 'WINDOW_SWAP'         // Window/tab switch
    | 'BLUETOOTH_AUDIO'     // Bluetooth/audio device detected
    | 'FALSE_FACE'          // Fake face detected
    | 'MULTIPLE_PEOPLE'     // Multiple people in frame
    | 'BLANK_FEED'          // Camera feed blank
    | 'LOOKING_AWAY'        // Not looking at screen
    | 'PROCTOR_FEED'        // Proctor feed sent to user
    | 'ROOM_SCAN'           // Room scan request
    | 'RESTRICTED_OBJECT';  // Prohibited object detected

export interface Violation {
    id: string;
    sessionId: string;
    type: ViolationType;
    timestamp: string;
    details?: string;
    screenshotUrl?: string;
    contestantId?: string;
    contestantName?: string;
}

export interface ViolationStats {
    total: number;
    byType: Partial<Record<ViolationType, number>>;
}

export interface ViolationsQueryParams {
    page?: number;
    limit?: number;
    types?: string; // Comma-separated violation types
    sessionId?: string;
    since?: string; // ISO timestamp
}

export const assessmentService = {
    // ========== ASSESSMENT ENDPOINTS ==========

    /**
     * Create a new assessment (with nested sections and questions)
     */
    createAssessment: (data: CreateAssessmentData) =>
        axiosContestClient.post("/assessments", data),

    /**
     * Get all assessments for the logged-in organizer
     */
    listAssessments: (params?: AssessmentListParams) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get(`/assessments${query ? `?${query}` : ''}`);
    },

    /**
     * Get a single assessment by ID
     */
    getAssessment: (id: string) =>
        axiosContestClient.get(`/assessments/${id}`),

    /**
     * Update an existing assessment
     */
    updateAssessment: (id: string, data: Partial<CreateAssessmentData>) =>
        axiosContestClient.patch(`/assessments/${id}`, data),

    /**
     * Delete an assessment
     */
    deleteAssessment: (id: string) =>
        axiosContestClient.delete(`/assessments/${id}`),

    /**
     * Publish an assessment (change status from DRAFT to PUBLISHED)
     */
    publishAssessment: (id: string) =>
        axiosContestClient.post(`/assessments/${id}/publish`),

    /**
     * Archive an assessment
     */
    archiveAssessment: (id: string) =>
        axiosContestClient.post(`/assessments/${id}/archive`),

    /**
     * Duplicate an assessment
     */
    duplicateAssessment: (id: string) =>
        axiosContestClient.post(`/assessments/${id}/duplicate`),

    // ========== SECTION ENDPOINTS ==========

    /**
     * Create a new section in an assessment
     */
    createSection: (assessmentId: string, data: AssessmentSectionData) =>
        axiosContestClient.post(`/assessments/${assessmentId}/sections`, data),

    /**
     * List all sections in an assessment
     */
    listSections: (assessmentId: string) =>
        axiosContestClient.get(`/assessments/${assessmentId}/sections`),

    /**
     * Update a section
     */
    updateSection: (sectionId: string, data: Partial<AssessmentSectionData>) =>
        axiosContestClient.patch(`/sections/${sectionId}`, data),

    /**
     * Delete a section
     */
    deleteSection: (sectionId: string) =>
        axiosContestClient.delete(`/sections/${sectionId}`),

    /**
     * Reorder sections
     */
    reorderSections: (assessmentId: string, sectionIds: string[]) =>
        axiosContestClient.put(`/assessments/${assessmentId}/sections/reorder`, { sectionIds }),

    // ========== QUESTION ENDPOINTS ==========

    /**
     * Create a new question in a section
     */
    createQuestion: (sectionId: string, data: QuestionData) =>
        axiosContestClient.post(`/sections/${sectionId}/questions`, data),

    /**
     * Bulk create questions in a section
     */
    bulkCreateQuestions: (sectionId: string, questions: QuestionData[]) =>
        axiosContestClient.post(`/sections/${sectionId}/questions/bulk`, { questions }),

    /**
     * List all questions in a section
     */
    listQuestions: (sectionId: string) =>
        axiosContestClient.get(`/sections/${sectionId}/questions`),

    /**
     * Update a question
     */
    updateQuestion: (questionId: string, data: Partial<QuestionData>) =>
        axiosContestClient.patch(`/questions/${questionId}`, data),

    /**
     * Delete a question
     */
    deleteQuestion: (questionId: string) =>
        axiosContestClient.delete(`/questions/${questionId}`),

    /**
     * Reorder questions in a section
     */
    reorderQuestions: (sectionId: string, questionIds: string[]) =>
        axiosContestClient.put(`/sections/${sectionId}/questions/reorder`, { questionIds }),

    // ========== SUBMISSION REPORTING ENDPOINTS (ORGANIZER) ==========

    /**
     * Get all submissions for an assessment
     */
    getSubmissions: (assessmentId: string, params?: { page?: number; limit?: number; status?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get<{
            success: boolean;
            submissions: SubmissionReport[];
            total: number;
            stats: SubmissionStats;
        }>(`/assessments/${assessmentId}/submissions${query ? `?${query}` : ''}`);
    },

    /**
     * Get detailed submission report for a specific submission
     */
    getSubmissionDetails: (assessmentId: string, submissionId: string) =>
        axiosContestClient.get<{
            success: boolean;
            submission: SubmissionDetailReport;
        }>(`/assessments/${assessmentId}/submissions/${submissionId}`),

    /**
     * Get submission statistics for an assessment
     */
    getSubmissionStats: (assessmentId: string) =>
        axiosContestClient.get<{
            success: boolean;
            stats: SubmissionStats;
        }>(`/assessments/${assessmentId}/submissions/stats`),

    /**
     * Export submissions as CSV
     */
    exportSubmissions: (assessmentId: string) =>
        axiosContestClient.get(`/assessments/${assessmentId}/submissions/export`, {
            responseType: 'blob'
        }),

    // ========== VIOLATIONS MONITORING ENDPOINTS (ADMIN) ==========

    /**
     * Get all violations for an assessment (paginated, filterable)
     * Query params: page, limit, types (comma-separated), sessionId, since
     */
    getViolations: (assessmentId: string, params?: ViolationsQueryParams) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get<{
            success: boolean;
            violations: Violation[];
            total: number;
            page: number;
            limit: number;
        }>(`/admin/assessments/${assessmentId}/violations${query ? `?${query}` : ''}`);
    },

    /**
     * Get violation statistics for an assessment
     */
    getViolationStats: (assessmentId: string) =>
        axiosContestClient.get<{
            success: boolean;
            stats: ViolationStats;
        }>(`/admin/assessments/${assessmentId}/violations/stats`),

    /**
     * Get realtime violation feed (for polling)
     * @param since - ISO timestamp to get violations after
     */
    getViolationsRealtime: (assessmentId: string, since?: string) => {
        const query = since ? `?since=${encodeURIComponent(since)}` : '';
        return axiosContestClient.get<{
            success: boolean;
            violations: Violation[];
            timestamp?: string;
            lastTimestamp?: string;
            serverTimestamp?: string;
            count?: number;
            assessmentId?: string;
        }>(`/admin/assessments/${assessmentId}/violations/realtime${query}`);
    },

    // ========== PARTICIPANT REPORTS ENDPOINTS (ADMIN) ==========

    /**
     * Get all participants with full report data
     * Query params: page, limit, status, sortBy, sortOrder, search
     */
    getParticipantReports: (assessmentId: string, params?: ReportsQueryParams) => {
        const query = new URLSearchParams(params as any).toString();
        return axiosContestClient.get<ReportsResponse>(
            `/admin/assessments/${assessmentId}/reports${query ? `?${query}` : ''}`
        );
    },

    /**
     * Get single participant detail report
     */
    getParticipantDetail: (assessmentId: string, participantId: string) =>
        axiosContestClient.get<{
            success: boolean;
            participant: ParticipantReport;
        }>(`/admin/assessments/${assessmentId}/reports/participants/${participantId}`),

    /**
     * Update participant verdict (admin edit)
     */
    updateParticipantVerdict: (assessmentId: string, participantId: string, verdict: UpdateVerdictPayload) =>
        axiosContestClient.patch<{
            success: boolean;
            verdict: ParticipantVerdict;
        }>(`/admin/assessments/${assessmentId}/reports/participants/${participantId}/verdict`, verdict),

    /**
     * Export reports as CSV/JSON
     */
    exportReports: (assessmentId: string, format: 'csv' | 'json' = 'csv') =>
        axiosContestClient.get(`/admin/assessments/${assessmentId}/reports/export`, {
            params: { format },
            responseType: 'blob'
        }),
};

// ========== SUBMISSION REPORT TYPES ==========

export interface SubmissionReport {
    id: string;
    contestantId: string;
    contestantName: string;
    contestantEmail: string;
    status: 'in_progress' | 'submitted' | 'graded';
    startedAt: string;
    submittedAt?: string;
    totalScore?: number;
    totalMarks: number;
    percentage?: number;
    timeTaken?: number; // in seconds
    answeredCount: number;
    totalQuestions: number;
}

export interface SubmissionDetailReport extends SubmissionReport {
    sections: SectionReport[];
}

export interface SectionReport {
    sectionId: string;
    sectionTitle: string;
    score: number;
    maxScore: number;
    answeredCount: number;
    totalQuestions: number;
    answers: AnswerReport[];
}

export interface AnswerReport {
    questionId: string;
    questionText: string;
    questionType: string;
    selectedAnswer: string | string[];
    correctAnswer?: string | string[];
    isCorrect?: boolean;
    marks: number;
    marksAwarded: number;
}

export interface SubmissionStats {
    totalParticipants: number;
    submitted: number;
    inProgress: number;
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
    passRate: number; // Percentage of participants scoring above passing threshold
}

// ========== PARTICIPANT REPORT TYPES (Admin Reports API) ==========

export interface ParticipantRegistration {
    fullName: string;
    email: string;
    college?: string;
    department?: string;
    registrationNumber?: string;
    cgpa?: number;
    resumeUrl?: string;
    idCardUrl?: string;
}

export interface ParticipantVerification {
    photoUrl?: string;
    photoThumbnailUrl?: string;
    faceDescriptor?: object;
}

export interface ParticipantSession {
    id: string;
    startedAt?: string;
    submittedAt?: string;
    totalTimeTaken?: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'submitted';
    proctoringConsent?: boolean;
    systemChecks?: {
        browser: boolean;
        camera: boolean;
        mic: boolean;
    };
}

export interface SectionScore {
    sectionId: string;
    sectionTitle: string;
    sectionType: 'mcq' | 'coding' | 'subjective';
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    correctAnswers?: number;
    wrongAnswers?: number;
    unattempted?: number;
    negativeMarks?: number;
    timeTaken?: number;
}

export interface ParticipantScores {
    totalScore: number;
    maxScore: number;
    percentage: number;
    rank?: number;
    sectionScores: SectionScore[];
    mcqScore?: number;
    mcqMaxScore?: number;
    codingScore?: number;
    codingMaxScore?: number;
}

export interface CodingProblemResult {
    problemId: string;
    problemTitle: string;
    language: string;
    code?: string;
    passedTests: number;
    totalTests: number;
    score: number;
    maxScore: number;
    status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compile_error' | 'pending';
    executionTime?: string;
    memoryUsed?: number;
    testCases?: any[];
    hiddenTestCases?: { passed: number; failed: number };
}

export interface ParticipantViolations {
    totalCount: number;
    byType: Partial<Record<string, number>>;
    details?: Array<{
        id: string;
        type: string;
        detectedAt: string;
        metadata?: object;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface ParticipantVerdict {
    status: 'passed' | 'failed' | 'disqualified' | 'pending';
    finalScore: number;
    adjustedScore?: number;
    violationPenalty?: number;
    notes?: string;
    evaluatedBy?: string;
    evaluatedAt?: string;
}

export interface PlagiarismReport {
    overallScore: number;
    isAiGenerated: boolean;
    aiConfidence: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    verdict: 'Clean' | 'Suspicious' | 'Plagiarized' | 'AI Generated';
}

export interface ParticipantReport {
    id: string;
    participantId: string;
    registration: ParticipantRegistration;
    verification?: ParticipantVerification;
    session: ParticipantSession;
    scores: ParticipantScores;
    codingProblems?: CodingProblemResult[];
    violations: ParticipantViolations;
    plagiarism?: PlagiarismReport | null;
    verdict: ParticipantVerdict;
    timestamps: {
        invitedAt?: string;
        acceptedAt?: string;
        startedAt?: string;
        submittedAt?: string;
        evaluatedAt?: string;
    };
    isAutoSubmitted?: boolean;
}

export interface ReportsResponse {
    success: boolean;
    assessmentId: string;
    assessmentTitle: string;
    stats: {
        totalParticipants: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        averageTimeTaken: number;
        passRate: number;
    };
    violationStats: {
        totalViolations: number;
        participantsWithViolations: number;
        byType: Partial<Record<string, number>>;
        highRiskCount: number;
    };
    participants: ParticipantReport[];
    total?: number;
    page?: number;
    limit?: number;
}

export interface ReportsQueryParams {
    page?: number;
    limit?: number;
    status?: 'in_progress' | 'submitted' | 'evaluated';
    sortBy?: 'totalScore' | 'submittedAt' | 'percentage';
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
}

export interface UpdateVerdictPayload {
    status: 'passed' | 'failed' | 'disqualified' | 'pending';
    adjustedScore?: number;
    violationPenalty?: number;
    notes?: string;
}
