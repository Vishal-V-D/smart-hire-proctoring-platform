import axiosContestClient from './axiosContestClient';

export interface TestCaseRange {
    start: number;
    end: number;
}

export interface TestCaseConfig {
    method: 'all' | 'range' | 'indices';
    exampleRange?: TestCaseRange | null;
    hiddenRange?: TestCaseRange | null;
    exampleIndices?: number[] | null;
    hiddenIndices?: number[] | null;
}

export const testCaseConfigService = {
    /**
     * Configure test cases for a section problem
     */
    async configureTestCases(sectionProblemId: string, config: TestCaseConfig | null): Promise<void> {
        await axiosContestClient.post(`/api/section-problems/${sectionProblemId}/testcase-config`, config);
    },

    /**
     * Get test case configuration for a section problem
     */
    async getTestCaseConfig(sectionProblemId: string): Promise<TestCaseConfig | null> {
        const response = await axiosContestClient.get<TestCaseConfig | null>(
            `/api/section-problems/${sectionProblemId}/testcase-config`
        );
        return response.data;
    }
};
