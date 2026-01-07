import axiosSubmissionClient from "./axiosSubmissionClient";
import axiosContestClient from "./axiosContestClient";

export interface SubmissionResponse {
    id: string;
    status: string;
    language: string;
    code: string;
    points?: number;
    executionTime?: number;
    memoryUsed?: number;
    memory?: number; // Added for compatibility
    createdAt: string;
    problemId: string;
    contestId?: string;
    userId: string;
    username?: string;

    // Extended fields for run results and detailed feedback
    testResults?: Array<{
        status: string;
        input?: string;
        output?: string;
        expectedOutput?: string;
        error?: string;
        errorMessage?: string; // Backend error message field
        executionTime?: number;
        memoryUsed?: number;
    }>;
    passedTests?: number;
    totalTests?: number;
    verdict?: string;
    output?: string; // Console output or error message
    feedback?: string; // AI feedback from backend
}

export interface SubmissionCreate {
    problemId: string;
    contestId?: string;
    language: string;
    code: string;
}

// Leaderboard entry type
export interface LeaderboardEntry {
    userId: string;
    username?: string;
    points?: number;
    solved?: number;
    solvedProblems?: string[];
    rank?: number;
    lastSubmissionTime?: string;
    firstSolveTime?: string; // Added for leaderboard display
    language?: string; // Added for leaderboard display
    pointsAdjustment?: number; // Added for editing
    reason?: string; // Added for editing
}

// Dashboard metrics type
export interface DashboardMetrics {
    totalSubmissions?: number;
    totalParticipants?: number;
    averageScore?: number;
    problemStats?: Array<{
        problemId: string;
        problemTitle?: string;
        totalAttempts?: number;
        successRate?: number;
    }>;
    // Additional properties used in OrganizerSubmissions
    uniqueParticipants?: number;
    successRate?: string;
    averagePoints?: number;
    languageDistribution?: Array<{
        language: string;
        count: number;
    }>;
    topPerformers?: Array<{
        username: string;
        totalPoints: number;
        solved: number;
    }>;
}

export const submissionService = {
    createSubmission: (data: SubmissionCreate) =>
        axiosSubmissionClient.post("/submissions", data),

    getSubmission: (id: string) =>
        axiosSubmissionClient.get(`/submissions/${id}`),

    // Alias for getSubmission to maintain compatibility
    getSubmissionById: (id: string) =>
        axiosSubmissionClient.get(`/submissions/${id}`),

    getSubmissionsByProblem: (problemId: string, page = 1, limit = 20) =>
        axiosSubmissionClient.get(`/submissions/problem/${problemId}?page=${page}&limit=${limit}`),

    getMySubmissions: (page = 1, limit = 20) =>
        axiosSubmissionClient.get(`/submissions/me?page=${page}&limit=${limit}`),

    // Run code without submitting - uses Submission Service (port 5000)
    runCode: (data: any) =>
        axiosSubmissionClient.post("/submissions/run", data),

    // Leaderboard methods
    getContestLeaderboard: (contestId: string, page = 1, limit = 100) =>
        axiosSubmissionClient.get(`/submissions/contest/${contestId}/leaderboard?page=${page}&limit=${limit}`),

    editLeaderboardEntry: (contestId: string, userId: string, data: Partial<LeaderboardEntry>) =>
        axiosSubmissionClient.patch(`/submissions/contest/${contestId}/leaderboard/${userId}`, data),

    deleteLeaderboardEntry: (contestId: string, userId: string) =>
        axiosSubmissionClient.delete(`/submissions/contest/${contestId}/leaderboard/${userId}`),

    // Dashboard and analytics methods
    getDashboardMetrics: (contestId: string) =>
        axiosSubmissionClient.get(`/submissions/contest/${contestId}/metrics`),

    getAllSubmissions: (contestId: string, page = 1, limit = 50) =>
        axiosSubmissionClient.get(`/submissions/contest/${contestId}/all?page=${page}&limit=${limit}`),

    getUserProblemStats: (userId?: string) => {
        const url = userId ? `/submissions/user/${userId}/stats` : '/submissions/user/stats';
        return axiosSubmissionClient.get(url);
    },

    // 🎯 ------- SESSION TRACKING -------
    startAssessment: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/start`),

    finishAssessment: (contestId: string) =>
        axiosContestClient.post(`/contests/${contestId}/finish`),

    // 📊 ------- ADMIN DASHBOARD (EXTENDED) -------
    // These use contest service (port 4000), not submission service
    getUnifiedParticipants: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/unified-participants`),

    getSessionStats: (contestId: string) =>
        axiosContestClient.get(`/contests/${contestId}/admin/session-stats`),
};
