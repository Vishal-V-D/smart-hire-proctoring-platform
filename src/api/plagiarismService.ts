// src/api/plagiarismService.ts

import axiosContestClient from "./axiosContestClient";

export type Strictness = "Low" | "Medium" | "High";
export type AISensitivity = "Low" | "Medium" | "High";

export interface PlagiarismReportConfig {
    includeSourceCode: boolean;
    includeMatches: boolean;
    includeAiAnalysis: boolean;
    includeVerdict: boolean;
}

export interface PlagiarismConfig {
    enabled?: boolean;
    strictness: Strictness;
    similarityThreshold: number;
    aiSensitivity: AISensitivity;
    reportConfig: PlagiarismReportConfig;
}

export interface PlagiarismStatusResponse {
    submissionId: string;
    assessmentId: string;
    status: "pending" | "processing" | "completed" | "failed";
    similarity: number;
    aiScore: number;
    detectedAt?: string;
    report?: {
        sourceCode?: string;
        matches?: Array<{
            source: string;
            percentage: number;
        }>;
        aiAnalysis?: string;
        verdict?: string;
    };
}

export interface WebhookPayload {
    submissionId: string;
    assessmentId: string;
    status: "completed" | "failed";
    similarity: number;
    aiScore: number;
    timestamp: string;
}

// Service class for plagiarism detection endpoints
class PlagiarismService {
    /**
     * ENDPOINT 1: Get Plagiarism Config
     * GET /api/assessments/:id/plagiarism-config
     */
    async getPlagiarismConfig(assessmentId: string): Promise<PlagiarismConfig> {
        try {
            const response = await axiosContestClient.get(
                `/api/assessments/${assessmentId}/plagiarism-config`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching plagiarism config:", error);
            throw error;
        }
    }

    /**
     * ENDPOINT 2: Save Plagiarism Config
     * PUT /api/assessments/:id/plagiarism-config
     */
    async savePlagiarismConfig(
        assessmentId: string,
        config: PlagiarismConfig
    ): Promise<PlagiarismConfig> {
        try {
            const response = await axiosContestClient.put(
                `/api/assessments/${assessmentId}/plagiarism-config`,
                config
            );
            return response.data;
        } catch (error) {
            console.error("Error saving plagiarism config:", error);
            throw error;
        }
    }

    /**
     * ENDPOINT 3: Reset Plagiarism Config to Defaults
     * POST /api/assessments/:id/plagiarism-config/reset
     */
    async resetPlagiarismConfig(assessmentId: string): Promise<PlagiarismConfig> {
        try {
            const response = await axiosContestClient.post(
                `/api/assessments/${assessmentId}/plagiarism-config/reset`
            );
            return response.data;
        } catch (error) {
            console.error("Error resetting plagiarism config:", error);
            throw error;
        }
    }

    /**
     * ENDPOINT 4: Check Plagiarism Status
     * GET /api/contestant/assessments/:id/submissions/:submissionId/plagiarism-status
     */
    async checkPlagiarismStatus(
        assessmentId: string,
        submissionId: string
    ): Promise<PlagiarismStatusResponse> {
        try {
            const response = await axiosContestClient.get(
                `/api/contestant/assessments/${assessmentId}/submissions/${submissionId}/plagiarism-status`
            );
            return response.data;
        } catch (error) {
            console.error("Error checking plagiarism status:", error);
            throw error;
        }
    }

    /**
     * ENDPOINT 5: Webhook Handler for Plagiarism Results
     * POST /api/contestant/assessments/webhook/plagiarism
     * NOTE: This endpoint does NOT require authentication
     * Call this only if you're setting up webhook for external plagiarism provider
     */
    async handlePlagiarismWebhook(payload: WebhookPayload): Promise<void> {
        try {
            // Note: Use a separate axios instance without auth for webhook
            const axiosNoAuth = axiosContestClient;
            await axiosNoAuth.post(
                `/api/contestant/assessments/webhook/plagiarism`,
                payload
            );
        } catch (error) {
            console.error("Error processing plagiarism webhook:", error);
            throw error;
        }
    }
}

// Export singleton instance
export default new PlagiarismService();
