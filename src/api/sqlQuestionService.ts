import axiosContestClient from "./axiosContestClient";

export type SQLQuestion = {
    id: string;
    title: string;
    slug: string;
    description?: string; // Description (backend returns description)
    content?: string; // Legacy support if needed, or remove
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dialect: 'mysql' | 'postgresql' | 'sql';
    topic?: string;
    subdivision?: string;
    starterCode?: string | null;
    inputTables?: string;   // JSON string of tables schema
    expectedResult?: string; // JSON string of expected output
    expectedQuery?: string;
    hint?: string;
    tags?: string[];
    explanation?: string | null;
    marks?: number;
    order?: number;
    sectionId?: string;
    division?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type SQLQuestionFilters = {
    dialect?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    topic?: string;
    subdivision?: string;
    division?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type SQLQuestionListResponse = {
    success: boolean;
    questions: SQLQuestion[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const API_BASE = '/sql'; // The user said /api/sql/questions, axiosContestClient usually prepends /api or similar base. 
// However, the user said URL: http://localhost:4000/api/sql/questions. 
// If axiosContestClient has baseURL http://localhost:4000/api, then we need '/sql/questions'.

export const sqlQuestionService = {
    listQuestions: (filters: SQLQuestionFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.dialect) params.append('dialect', filters.dialect);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.topic) params.append('topic', filters.topic);
        if (filters.subdivision) params.append('subdivision', filters.subdivision);
        if (filters.division) params.append('division', filters.division);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        return axiosContestClient.get<SQLQuestionListResponse>(`${API_BASE}/questions?${params.toString()}`);
    },

    // Link selected SQL questions to a section
    addQuestionsToSection: (sectionId: string, questionIds: string[]) => {
        return axiosContestClient.post(`/sections/${sectionId}/sql-questions`, { questionIds });
    },

    getFilters: () => {
        return axiosContestClient.get<SQLFiltersResponse>(`${API_BASE}/filters`);
    },

    // Run SQL Query (Test without submitting)
    runQuery: (data: { questionId: string; query: string }) => {
        return axiosContestClient.post<SQLRunResponse>(`${API_BASE}/run`, data);
    },

    // Submit SQL Query (Final submission with evaluation)
    submitQuery: (data: {
        questionId: string;
        query: string;
        sessionId?: string;
        assessmentId?: string;
        sectionId?: string;
    }) => {
        return axiosContestClient.post<SQLSubmitResponse>(`${API_BASE}/submit`, data);
    },

    // Update SQL Question
    updateQuestion: (id: string, data: Partial<SQLQuestion>) => {
        return axiosContestClient.put<SQLQuestion>(`${API_BASE}/question/${id}`, data);
    },

    // Delete SQL Question
    deleteQuestion: (id: string) => {
        return axiosContestClient.delete(`${API_BASE}/question/${id}`);
    }
};

// Response types for run/submit
export type SQLRunResponse = {
    success: boolean;
    result?: any[];
    output?: any[]; // Backend often returns 'output'
    executionTime: number;
    rowCount?: number; // Optional in new backend response?
    error?: string;
    message?: string; // Additional error/info message
    status?: string;
    statusCode?: number;
    rawOutput?: string;
};

export type SQLSubmitResponse = {
    success: boolean;
    isCorrect: boolean;
    score: number;
    userResult: any[];
    expectedResult: any[];
    feedback: string;
    executionTime: number;
    error?: string;
    message?: string; // Additional error/info message
};


export type SQLFilterOptions = {
    dialects: string[];
    difficulties: string[];
    topics: string[];
    subdivisions: string[];
};

export type SQLFiltersResponse = {
    success: boolean;
    filters: SQLFilterOptions;
};
