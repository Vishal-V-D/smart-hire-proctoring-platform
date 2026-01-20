// src/api/codingQuestionService.ts

import axiosContestClient from "./axiosContestClient";

// ✅ ---------- TYPES ----------

export type TopicTag = {
    name: string;
    slug: string;
};

export type TestCase = {
    input: string;
    output: string;
};

export type LanguageCode = {
    python?: string;
    'c++'?: string;
    java?: string;
    javascript?: string;
    sql?: string;
    mysql?: string;
    postgresql?: string;
};

export type CodingProblem = {
    id: string;
    title: string;
    titleSlug: string;
    content: string;  // Markdown content
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicTags: TopicTag[];
    pythonFunctionName?: string;
    cppFunctionName?: string;
    javaFunctionName?: string;
    solution: LanguageCode;
    exampleTestcases: TestCase[];
    hiddenTestcases: TestCase[];
    driverCode: LanguageCode;
    starterCode: LanguageCode;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
};

export type CodingProblemUpload = {
    QuestionTitle: string;
    TitleSlug?: string;
    Content: string;
    Difficulty: 'Easy' | 'Medium' | 'Hard';
    TopicTags?: TopicTag[];
    pythonFunctionName?: string;
    CppFunctionName?: string;
    javaFunctionName?: string;
    Solution?: LanguageCode;
    ExampleTestcaseList?: TestCase[];
    HiddenTestcaseList?: TestCase[];
    DriverCode?: LanguageCode;
    StarterCode?: LanguageCode;
};

export type CodingProblemFilters = {
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    tags?: string[];  // Topic tag slugs
    search?: string;
    skip?: number;
    take?: number;
};

export type CodingProblemListResponse = {
    problems: CodingProblem[];
    total: number;
    skip: number;
    take: number;
};

export type TagsResponse = {
    success: boolean;
    tags: string[];
};

export type SectionProblem = {
    id: string;
    problemId: string;
    sectionId: string;
    marks: number;
    orderIndex: number;
    problem: CodingProblem;
};

// ✅ ---------- API SERVICE ----------

const API_BASE = '/coding-questions';

export const codingQuestionService = {
    // ========== UPLOAD ENDPOINTS ==========

    /**
     * Upload a single coding question via JSON
     */
    uploadSingle: (data: CodingProblemUpload) =>
        axiosContestClient.post<CodingProblem>(`${API_BASE}/upload/json`, data),

    /**
     * Bulk upload coding questions via JSON array
     */
    uploadBulk: (data: CodingProblemUpload[]) =>
        axiosContestClient.post<{ created: number; problems: CodingProblem[] }>(
            `${API_BASE}/upload/json/bulk`,
            data
        ),

    /**
     * Upload coding questions from a JSON file
     */
    uploadJsonFile: async (file: File): Promise<CodingProblem | CodingProblem[]> => {
        const text = await file.text();
        const data = JSON.parse(text);

        // Check if it's an array or single object
        if (Array.isArray(data)) {
            const response = await codingQuestionService.uploadBulk(data);
            return response.data.problems;
        } else {
            const response = await codingQuestionService.uploadSingle(data);
            return response.data;
        }
    },

    // ========== CRUD ENDPOINTS ==========

    /**
     * Get all available topic tags for filtering
     * Returns array of tag strings from backend
     */
    getTags: () =>
        axiosContestClient.get<TagsResponse>(`${API_BASE}/tags`),

    /**
     * List coding problems with filters
     */
    listProblems: (filters: CodingProblemFilters = {}) => {
        const params = new URLSearchParams();

        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.tags?.length) params.append('tags', filters.tags.join(','));
        if (filters.search) params.append('search', filters.search);
        if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
        if (filters.take !== undefined) params.append('take', filters.take.toString());

        return axiosContestClient.get<CodingProblemListResponse>(
            `${API_BASE}${params.toString() ? `?${params}` : ''}`
        );
    },

    /**
     * Get a coding problem by ID
     */
    getProblem: (id: string) =>
        axiosContestClient.get<CodingProblem>(`${API_BASE}/${id}`),

    /**
     * Get a coding problem by slug
     */
    getProblemBySlug: (slug: string) =>
        axiosContestClient.get<CodingProblem>(`${API_BASE}/slug/${slug}`),

    /**
     * Update a coding problem
     */
    updateProblem: (id: string, data: Partial<CodingProblemUpload>) =>
        axiosContestClient.put<CodingProblem>(`${API_BASE}/${id}`, data),

    /**
     * Delete a coding problem
     */
    deleteProblem: (id: string) =>
        axiosContestClient.delete(`${API_BASE}/${id}`),

    // ========== SECTION MANAGEMENT ==========

    /**
     * Get all problems in a section
     */
    getSectionProblems: (sectionId: string) =>
        axiosContestClient.get<SectionProblem[]>(
            `${API_BASE}/sections/${sectionId}/problems`
        ),

    /**
     * Add a problem to a section
     */
    addProblemToSection: (sectionId: string, problemId: string, marks: number = 10) =>
        axiosContestClient.post<SectionProblem>(
            `${API_BASE}/sections/${sectionId}/problems`,
            { problemId, marks }
        ),

    /**
     * Remove a problem from a section
     */
    removeProblemFromSection: (sectionId: string, problemId: string) =>
        axiosContestClient.delete(
            `${API_BASE}/sections/${sectionId}/problems/${problemId}`
        ),

    /**
     * Update problem marks in a section
     */
    updateSectionProblem: (sectionId: string, problemId: string, marks: number) =>
        axiosContestClient.patch(
            `${API_BASE}/sections/${sectionId}/problems/${problemId}`,
            { marks }
        ),
};
