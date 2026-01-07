// src/api/codeService.ts
// Service for code execution (Run & Submit) endpoints

import axiosContestClient from "./axiosContestClient";

// ========== TYPES ==========

export interface RunCodeRequest {
    problemId: string;
    code: string;
    language: string;
}

export interface SubmitCodeRequest {
    problemId: string;
    code: string;
    language: string;
    assessmentId?: string;
    sectionId?: string;
}

export interface TestCaseResult {
    testcaseIndex: number;
    passed: boolean;
    status: string;              // "Accepted", "Compilation Error", "Wrong Answer", etc.
    statusCode: number;          // Judge0 status: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compile Error
    errorType: 'compile' | 'runtime' | 'timeout' | 'memory_limit' | 'internal' | null;
    compileError?: string;       // Full compilation error message if statusCode=6
    runtimeError?: string;       // Runtime error (stderr) if any
    error?: string;              // Generic error message
    input: string;               // Testcase input
    expectedOutput: string;      // Expected output
    actualOutput: string;        // Actual output from user's code
    time?: string;               // Execution time like "0.05"
    memory?: number;             // Memory used in KB
    isHidden?: boolean;          // New field for separating sample/hidden
}

export interface RunCodeSummary {
    total: number;
    passed: number;
    failed: number;
}

export interface RunCodeResponse {
    success: boolean;
    results: TestCaseResult[];
    summary: RunCodeSummary;
}

export interface SubmitCodeResponse {
    success: boolean;
    score: number;
    maxScore: number;
    // Sample testcases
    sampleResults: TestCaseResult[];
    // Hidden testcases
    hiddenResults: TestCaseResult[];
    // Summaries
    summary: RunCodeSummary;
    sampleSummary: RunCodeSummary;
    hiddenSummary: RunCodeSummary;
    // Legacy support
    results?: TestCaseResult[];
    feedback?: string;
}

// ========== API SERVICE ==========

export const codeService = {
    /**
     * Run code against sample test cases only
     * POST /api/code/run
     */
    runCode: (data: RunCodeRequest) =>
        axiosContestClient.post<RunCodeResponse>('/code/run', data),


    /**
     * Submit code for full evaluation (sample + hidden test cases)
     * POST /api/code/submit
     */
    submitCode: (data: SubmitCodeRequest) =>
        axiosContestClient.post<SubmitCodeResponse>('/code/submit', data),
};

export default codeService;
