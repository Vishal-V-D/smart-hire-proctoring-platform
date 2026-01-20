// src/api/questionBankService.ts

import axiosContestClient from "./axiosContestClient";

// ✅ ---------- TYPES ----------

export type QuestionBankQuestion = {
    id: string;
    text: string;
    image?: string;
    type: 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding' | 'sql';
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
    marks: number;
    order: number;
    tags: string[];
    topic: string;
    division: string;
    subdivision: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    section?: string | null;
    createdAt: string;
    updatedAt: string;
    // SQL Specific Fields
    inputTables?: string;   // JSON string
    expectedResult?: string; // JSON string
    expectedQuery?: string;
    hint?: string;
    dialect?: string;
    schemaSetup?: string;
};

export type FilterOptions = {
    divisions: string[];
    subdivisions: string[];
    topics: string[];
    tags: string[];
    difficulties: ('Easy' | 'Medium' | 'Hard')[];
    types: ('single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding' | 'sql')[];
};

export type QuestionBankFilters = {
    division?: string;
    subdivision?: string;
    subdivisions?: string[]; // Support for multiple subdivisions
    topic?: string;
    tags?: string[];
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    type?: 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding' | 'sql';
    search?: string;
    page?: number;
    limit?: number;
};

export type QuestionBankPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type QuestionBankResponse = {
    questions: QuestionBankQuestion[];
    pagination: QuestionBankPagination;
};

export type QuestionBankStats = {
    total: number;
    byDivision: Record<string, number>;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
    bySubdivision: Record<string, number>;
    byTopic: Record<string, number>;
};

export type BulkDeleteByIds = {
    ids: string[];
};

export type BulkDeleteByFilter = {
    filter: {
        division?: string;
        subdivision?: string;
        difficulty?: string;
        type?: string;
    };
};

export type BulkDeleteResponse = {
    deleted: number;
    message: string;
};

// ✅ ---------- API SERVICE ----------

const API_BASE = '/question-bank';

export const questionBankService = {
    // Get filter options for dropdowns (supports cascading based on division/subdivision)
    getFilterOptions: (division?: string, subdivision?: string) => {
        const params = new URLSearchParams();
        if (division) params.append('division', division);
        if (subdivision) params.append('subdivision', subdivision);
        const queryString = params.toString();
        return axiosContestClient.get<FilterOptions>(`${API_BASE}/filter-options${queryString ? `?${queryString}` : ''}`);
    },

    // Get question bank statistics
    getStats: () =>
        axiosContestClient.get<QuestionBankStats>(`${API_BASE}/stats`),

    // List questions with advanced filtering and pagination
    listQuestions: (filters: QuestionBankFilters = {}) => {
        const params = new URLSearchParams();

        if (filters.division) params.append('division', filters.division);
        if (filters.subdivision) params.append('subdivision', filters.subdivision);
        // Support multiple subdivisions - send as comma-separated
        if (filters.subdivisions?.length) params.append('subdivisions', filters.subdivisions.join(','));
        if (filters.topic) params.append('topic', filters.topic);
        if (filters.tags?.length) params.append('tags', filters.tags.join(','));
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.type) params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        return axiosContestClient.get<QuestionBankResponse>(`${API_BASE}?${params}`);
    },

    // Get a single question by ID
    getQuestion: (id: string) =>
        axiosContestClient.get<QuestionBankQuestion>(`${API_BASE}/${id}`),

    // Create a new question
    createQuestion: (data: Partial<QuestionBankQuestion>) =>
        axiosContestClient.post<QuestionBankQuestion>(`${API_BASE}`, data),

    // Update a question
    updateQuestion: (id: string, data: Partial<QuestionBankQuestion>) =>
        axiosContestClient.patch<QuestionBankQuestion>(`${API_BASE}/${id}`, data),

    // Delete a single question
    deleteQuestion: (id: string) =>
        axiosContestClient.delete(`${API_BASE}/${id}`),

    // Bulk delete questions by IDs
    bulkDeleteByIds: (ids: string[]) =>
        axiosContestClient.delete<BulkDeleteResponse>(`${API_BASE}/bulk`, { data: { ids } }),

    // Bulk delete questions by filter
    bulkDeleteByFilter: (filter: BulkDeleteByFilter['filter']) =>
        axiosContestClient.delete<BulkDeleteResponse>(`${API_BASE}/bulk`, { data: { filter } }),

    // Bulk upload questions from CSV (no images)
    uploadCSV: (file: File, division?: string, subdivision?: string, topic?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (division) formData.append('division', division);
        if (subdivision) formData.append('subdivision', subdivision);
        if (topic) formData.append('topic', topic);
        return axiosContestClient.post(`${API_BASE}/upload/csv`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Bulk upload questions from Excel (.xls, .xlsx)
    uploadExcel: (file: File, division?: string, subdivision?: string, topic?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (division) formData.append('division', division);
        if (subdivision) formData.append('subdivision', subdivision);
        if (topic) formData.append('topic', topic);
        return axiosContestClient.post(`${API_BASE}/upload/excel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Bulk upload questions from ZIP (with images)
    uploadZIP: (file: File, division?: string, subdivision?: string, topic?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (division) formData.append('division', division);
        if (subdivision) formData.append('subdivision', subdivision);
        if (topic) formData.append('topic', topic);
        return axiosContestClient.post(`${API_BASE}/upload/zip`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};
