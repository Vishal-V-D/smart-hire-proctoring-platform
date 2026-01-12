// src/api/contestService.ts

import axiosContestClient from "./axiosContestClient";

// ✅ ---------- TYPES ----------

export type ContestantRegistrationData = {
    username: string;
    email: string;
    password: string;
};

export type OrganizerRegistrationData = {
    username: string;
    email: string;
    password: string;
    organizationName?: string;
};

export type LoginData = {
    email: string;
    password: string;
    rememberMe?: boolean;
};

export type ContestData = {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    durationMinutes?: number;
};

export type ContestUpdateData = Partial<ContestData>;

export type ExampleData = {
    input: string;
    output: string;
    explanation: string;
    imageUrl?: string; // Image URL for this example
};

// 🆕 NEW: Status Details for Invitations
export type StatusDetails = {
    isPending: boolean;
    isAccepted: boolean;
    isRegistered: boolean;
    isStarted: boolean;
    isFinished: boolean;
    registeredAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
};

// 🆕 NEW: Invitation Interface
export type Invitation = {
    id: string;
    contestId: string;
    email: string;
    inviteToken: string;
    isAccepted: boolean;
    acceptedAt: string | null;
    acceptedByUserId: string | null;
    invitedAt: string;
    // Relation
    acceptedByUser: {
        id: string;
        username: string;
        email: string;
    } | null;
    // NEW: Status summary
    status: "PENDING" | "ACCEPTED" | "REGISTERED" | "STARTED" | "FINISHED";
    // NEW: Detailed status breakdown
    statusDetails: StatusDetails;
    createdAt?: string; // Backwards compatibility if needed
};

export type ProblemData = {
    id?: string; // Added for API responses
    title: string;
    description: string;
    difficulty?: string;
    constraints?: string;
    inputFormat?: string;
    outputFormat?: string;
    additionalInfo?: string;
    timeLimit?: number; // Added for completeness in form usage
    memoryLimit?: number; // Added for completeness in form usage
    accessType: "PUBLIC" | "PRIVATE"; // ✅ matches backend enum
    testcases?: TestCaseData[]; // For Judge0 execution
    examples?: ExampleData[]; // 🆕 NEW: For display with images
    imageUrl?: string; // 🆕 NEW: Overall problem image URL
    // Additional fields for problem list display
    status?: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED' | string;
    points?: number;
    solved?: number;
    totalAttempts?: number;
};

export type TestCaseData = {
    id?: string; // Added for API responses
    input: string;
    expectedOutput: string;
    isHidden: boolean; // ✅ fixed (backend uses this)
};

// ✅ ---------- API SERVICE ----------

export const contestService = {
    // ------- AUTH -------
    registerOrganizer: (data: OrganizerRegistrationData) =>
        axiosContestClient.post("/auth/signup/organizer", data),

    registerContestant: (data: ContestantRegistrationData) =>
        axiosContestClient.post("/auth/signup/contestant", data),

    login: (data: LoginData) =>
        axiosContestClient.post("/auth/login", data),

    logout: () =>
        axiosContestClient.post("/auth/logout"),

    getMe: () =>
        axiosContestClient.get("/auth/me"),

    verifyEmail: (token: string) =>
        axiosContestClient.get(`/auth/verify-email?token=${token}`),

    updateProfile: (data: { username?: string; organizationName?: string; avatarUrl?: string }) =>
        axiosContestClient.put("/auth/profile", data),

    magicLogin: (token: string) =>
        axiosContestClient.post("/auth/magic-login", { token }),

    requestPasswordReset: (email: string) =>
        axiosContestClient.post("/auth/password-reset/request", { email }),

    confirmPasswordReset: (data: { token: string; newPassword: string }) =>
        axiosContestClient.post("/auth/password-reset/confirm", data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        axiosContestClient.post("/auth/change-password", data),

    setPassword: (data: { newPassword: string }) =>
        axiosContestClient.post("/auth/set-password", data),

    // ------- CONTESTS -------
    createContest: (data: ContestData) =>
        axiosContestClient.post("/contests", data),

    listContests: (search?: string, page = 1, limit = 10) => {
        let query = `?page=${page}&limit=${limit}`;
        if (search) query += `&search=${search}`;
        return axiosContestClient.get(`/contests${query}`);
    },

    getContestById: (id: string) =>
        axiosContestClient.get(`/contests/${id}`),

    deleteContest: (id: string) =>
        axiosContestClient.delete(`/contests/${id}`),
    // ------- CONTESTS -------

    updateContest: (id: string, data: ContestUpdateData) =>
        axiosContestClient.put(`/contests/${id}`, data), // ✅ Update contest




    addProblemToContest: (contestId: string, problemId: string) =>
        axiosContestClient.post(`/contests/${contestId}/problems`, { problemId }),

    removeContestProblem: (cpId: string) =>
        axiosContestClient.delete(`/contests/problems/${cpId}`),

    registerForContest: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/register`),

    startContest: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/start`),

    finishContest: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/finish`),

    submitAll: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/submit-all`, {}),

    getCreatedContests: () =>
        axiosContestClient.get("contests/me/created"),

    getRegisteredContests: () =>
        axiosContestClient.get("/contests/me/registered"),

    // ------- PROBLEMS -------
    createProblem: (data: FormData) =>
        axiosContestClient.post("/problems", data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),

    listProblems: (organizerId?: string, page = 1, limit = 10) => {
        let query = `/problems?page=${page}&limit=${limit}`;
        if (organizerId) query += `&organizerId=${organizerId}`;
        return axiosContestClient.get(query);
    },

    getProblem: (id: string) =>
        axiosContestClient.get(`/problems/${id}`),

    updateProblem: (id: string, data: Partial<ProblemData>) =>
        axiosContestClient.put(`/problems/${id}`, data),

    deleteProblem: (id: string) =>
        axiosContestClient.delete(`/problems/${id}`),

    addTestcaseToProblem: (id: string, data: TestCaseData) =>
        axiosContestClient.post(`/problems/${id}/testcases`, data),

    // ------- DASHBOARD/METRICS (Added for dynamic dashboard) -------
    getOrganizerMetrics: () =>
        axiosContestClient.get("/organizer/metrics"),

    getRecentSubmissions: (limit = 5) =>
        axiosContestClient.get(`/submissions/latest?limit=${limit}`),

    // ------- HEALTH -------
    healthCheck: () =>
        axiosContestClient.get("/health"),

    // 💌 ------- INVITE SYSTEM -------
    sendInvite: (contestId: string, email: string) =>
        axiosContestClient.post(`/contests/${contestId}/invite`, { email }),

    sendBulkInvites: (contestId: string, emails: string[]) =>
        axiosContestClient.post(`/contests/${contestId}/invite/bulk`, { emails }),

    getInvitations: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/invitations`),

    revokeInvitation: (invitationId: string) =>
        axiosContestClient.delete(`/invitations/${invitationId}`),

    validateInviteToken: (token: string) =>
        axiosContestClient.get(`/invitations/${token}/validate`),

    acceptInvite: (token: string, data?: any) => {
        const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        return axiosContestClient.post(`/invitations/${token}/accept`, data, config);
    },

    // 🛠️ ------- CONTEST MANAGEMENT (EXTENDED) -------


    generateShareableLink: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/share-link`),

    getContestByShareCode: (code: string) =>
        axiosContestClient.get(`/contests/join/${code}`),

    // 📝 ------- REGISTRATION SYSTEM -------
    registerWithPhoto: (contestId: string, data: FormData) =>
        axiosContestClient.post(`/contests/${contestId}/register`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    checkRegistration: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/check-registration`),

    getUserRegistration: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/registration/${userId}`),

    // 👁️ ------- MONITORING SYSTEM -------
    reportViolation: (contestId: string, data: { type: string, problemId?: string, metadata?: any }) =>
        axiosContestClient.post(`/contests/${contestId}/violations`, data),

    uploadMonitoringPhoto: (contestId: string, photoBlob: Blob) => {
        const formData = new FormData();
        formData.append('photo', photoBlob);
        return axiosContestClient.post(`/contests/${contestId}/monitoring-photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    getUserViolations: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/users/${userId}/violations`),

    getUserFlags: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/users/${userId}/flags`),

    // 🚀 ------- SUBMISSION & PLAGIARISM -------
    // (Existing submit endpoint might need update or use this one)
    submitCode: (contestId: string, data: any) =>
        axiosContestClient.post(`/contests/${contestId}/submit`, data),

    getUserSubmissions: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/users/${userId}/submissions`),

    getPlagiarismResults: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/users/${userId}/plagiarism`),

    // 📊 ------- ADMIN DASHBOARD -------
    getLiveParticipants: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/participants`),

    getRealTimeViolations: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/violations`),

    getContestStatistics: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/statistics`),

    getInvitedUsers: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/invited-users`),

    getDashboardData: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/dashboard`),

    // 📄 ------- REPORTS -------
    generateUserReport: (contestId: string, userId: string) =>
        axiosContestClient.post(`/contests/${contestId}/users/${userId}/generate-report`),

    getUserReportData: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contests/${contestId}/users/${userId}/report`),

    generateBulkReports: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/generate-all-reports`),

    getMyReport: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/my-report`),

    // 📊 GET ALL CONTEST RESULTS (for organizer reports tab)
    getContestResults: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/results`),

    registerForContestWithData: (contestId: string, data: any) =>
        axiosContestClient.post(`/contests/${contestId}/register`, data),


    // 🔗 ------- SHAREABLE LINK -------
    joinViaShareableLink: (code: string) =>
        axiosContestClient.get(`/contest-registration/join/${code}`),

    // 📸 ------- FACE RECOGNITION -------
    uploadUserPhoto: (formData: FormData) =>
        axiosContestClient.post('/users/upload-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    getUserPhoto: (userId: string) =>
        axiosContestClient.get(`/users/${userId}/photo`),

    getContestRegistrationPhoto: (contestId: string, userId: string) =>
        axiosContestClient.get(`/contest-registration/${contestId}/registration/${userId}/photo`),

    // 🔒 ------- PROCTORING SETTINGS -------
    getProctoringSettings: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/proctoring`),

    reportFaceViolation: (contestId: string, data: {
        userId: string;
        violationType: 'NO_FACE_DETECTED' | 'MULTIPLE_FACES' | 'FACE_MISMATCH' | 'FACE_RECOGNITION_FAILED' | 'AUDIO_NOISE_DETECTED' | 'SCREEN_BLACK_DETECTED' | 'UNWANTED_OBJECT_DETECTED';
        metadata?: any;
    }) =>
        // Backend expects 'type' field, not 'violationType'
        axiosContestClient.post(`/contests/${contestId}/violations`, {
            type: data.violationType,
            userId: data.userId,
            metadata: data.metadata
        }),

};
