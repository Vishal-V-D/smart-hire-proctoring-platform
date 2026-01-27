'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Play, Send, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, CheckCircle, XCircle,
    Terminal, Database, Zap, AlertTriangle, Lock, BarChart2, Copy, RotateCcw, Loader2
} from 'lucide-react';
import Loader from '@/components/Loader';
import { contestantService } from '@/api/contestantService';
import { sqlQuestionService } from '@/api/sqlQuestionService';
import { codeService, type TestCaseResult, type RunCodeSummary, type SubmitCodeResponse } from '@/api/codeService';
import AssessmentTimer from '@/components/contestant/AssessmentTimer';
import { useAssessment } from '@/context/AssessmentContext';
import ProctoringMonitor from '@/components/contestant/ProctoringMonitor';
import { socketService } from '@/api/socketService';

// Dynamic import Monaco
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    { id: 'sqlite', name: 'SQLite' },
    { id: 'mysql', name: 'MySQL' },
    { id: 'postgresql', name: 'PostgreSQL' },
];

function SQLPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const assessmentId = params.id as string;
    // Section/Question indices from URL
    const sectionIndex = parseInt(searchParams.get('section') || '0');
    const questionIndex = parseInt(searchParams.get('question') || '0');
    const queryClient = useQueryClient();

    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // === React Query ===

    // 1. Assessment
    const { data: assessmentData } = useQuery({
        queryKey: ['assessment', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getAssessment(assessmentId);
            return res.data;
        },
        staleTime: 5 * 60 * 1000
    });

    // 2. Sections
    const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
        queryKey: ['sections', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getSections(assessmentId);
            return res.data;
        },
        staleTime: Infinity
    });

    const sections = sectionsData?.sections || [];
    const currentSection = sections[sectionIndex];
    const currentSectionId = currentSection?.id;

    // 3. Questions/Problems (Fetching for SQL Section)
    const { data: questionsRes, isLoading: questionsLoading } = useQuery({
        queryKey: ['questions', assessmentId, currentSectionId],
        queryFn: async () => {
            if (!currentSectionId) return { questions: [], problems: [] };
            const res = await contestantService.getQuestions(assessmentId, currentSectionId);
            return res.data;
        },
        // Enable if section exists 
        enabled: !!currentSectionId,
        staleTime: 5 * 60 * 1000
    });

    // Prefetching Next Section
    useEffect(() => {
        if (sections.length > 0 && sectionIndex < sections.length - 1) {
            const nextSec = sections[sectionIndex + 1];
            if (nextSec && nextSec.id) {
                queryClient.prefetchQuery({
                    queryKey: ['questions', assessmentId, nextSec.id],
                    queryFn: async () => {
                        const res = await contestantService.getQuestions(assessmentId, nextSec.id);
                        return res.data;
                    }
                });
            }
        }
    }, [sectionIndex, sections, assessmentId, queryClient]);

    // Handle SQL Problems
    const sqlQuestions = (questionsRes as any)?.sqlQuestions || [];
    const codingProblems = questionsRes?.problems || [];
    const standardQuestions = questionsRes?.questions || [];

    useEffect(() => {
        if (questionsRes) {
            console.log("🔥 [SQLPage] Full Questions Response:", questionsRes);
        }
        if (assessmentData) {
            console.log("🔥 [SQLPage] Full Assessment Data:", assessmentData);
        }
    }, [questionsRes, assessmentData]);

    const allSqlProblems = React.useMemo(() => [
        ...(sqlQuestions.length > 0 ? sqlQuestions : []),
        ...(codingProblems.length > 0 ? codingProblems : []),
        ...(standardQuestions.filter((q: any) => q.type === 'sql' || q.pseudocode === 'SQL Query' || (q as any).subdivision === 'SQL'))
    ], [sqlQuestions, codingProblems, standardQuestions]);

    const currentProblemItem = allSqlProblems[questionIndex];
    // Normalize: it might be a wrapper { problem: ... } or the problem itself
    const problem = currentProblemItem?.problem || currentProblemItem || null;

    useEffect(() => {
        if (problem) {
            console.log("🐛 [SQLPage] Problem Data:", problem);
            console.log("🐛 [SQLPage] Expected Result (Raw):", problem.expectedResult);
            console.log("🐛 [SQLPage] Expected Output (Raw):", problem.expectedOutput);
        }
    }, [problem]);

    // Navigation Handler
    const handleQuestionNavigate = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < allSqlProblems.length) {
            const params = new URLSearchParams(Array.from(searchParams.entries()));
            params.set('question', newIndex.toString());
            router.push(`/contestant/assessment/${assessmentId}/sql?${params.toString()}`);
        }
    };

    // Derived Loading
    const loading = sectionsLoading || (!!currentSectionId && questionsLoading);

    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('sql');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // SQL Specific State
    const [sqlResult, setSqlResult] = useState<{ rows: any[], columns: string[], executionTime: number, rowCount: number, status?: string } | null>(null);
    const [sqlError, setSqlError] = useState<string | null>(null);
    const [sqlCheckResult, setSqlCheckResult] = useState<{
        isCorrect: boolean;
        score: number;
        userResult: any[];
        expectedResult: any[];
        feedback: string;
        hiddenTotal?: number;
        hiddenPassed?: number;
        hiddenTestResults?: any[];
        testCasesStats?: {
            sample: { total: number; passed: number };
            hidden: { total: number; passed: number };
        };
    } | null>(null);

    const [activeTab, setActiveTab] = useState<'result' | 'expected'>('result');
    const [leftWidth, setLeftWidth] = useState(50);
    const [consoleHeight, setConsoleHeight] = useState(35);
    const [isResizingConsole, setIsResizingConsole] = useState(false);

    // Sync currentSectionIndex with URL
    const [currentSectionIndex, setCurrentSectionIndex] = useState(sectionIndex);
    const [lockedSectionIndices, setLockedSectionIndices] = useState<Set<number>>(new Set());
    const [showSectionWarning, setShowSectionWarning] = useState(false);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [isFinishingSection, setIsFinishingSection] = useState(false);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [isStateLoaded, setIsStateLoaded] = useState(false);
    // Track which problem's code is currently loaded in the editor
    const [loadedProblemId, setLoadedProblemId] = useState<string | null>(null);

    const { startSectionTimer } = useAssessment();
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Persistence Key
    const STORAGE_KEY = `assessment_progress_${assessmentId}`;

    useEffect(() => {
        setCurrentSectionIndex(sectionIndex);
    }, [sectionIndex]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.lockedSectionIndices) setLockedSectionIndices(new Set(parsed.lockedSectionIndices));
                if (parsed.answers) setAnswers(parsed.answers);
            } catch (e) {
                console.error("Failed to parse saved progress", e);
            }
        }
        const intentFlag = localStorage.getItem(`navigation_intent_${assessmentId}`);
        if (intentFlag === 'navigated_to_sql') {
            console.log("🎯 [SQLPage] Intentionally navigated here");
            localStorage.removeItem(`navigation_intent_${assessmentId}`);
        }
        setIsStateLoaded(true);
    }, [assessmentId]);

    useEffect(() => {
        if (loading || !isStateLoaded) return;
        const stateToSave = {
            currentSectionIndex,
            lockedSectionIndices: Array.from(lockedSectionIndices),
            answers
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [currentSectionIndex, lockedSectionIndices, loading, assessmentId, answers, isStateLoaded]);

    // Theme (Carbon colors)
    const bg = theme === 'dark' ? 'bg-[#161616]' : 'bg-[#f4f4f4]';
    const cardBg = theme === 'dark' ? 'bg-[#262626]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]';
    const textPrimary = theme === 'dark' ? 'text-[#f4f4f4]' : 'text-[#161616]';
    const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#6f6f6f]';

    useEffect(() => {
        const saved = localStorage.getItem('assessmentTheme') as 'light' | 'dark' | null;
        if (saved) setTheme(saved);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('assessmentTheme', theme);
    }, [theme]);

    const proctoringSettings = assessmentData?.assessment?.proctoringSettings;

    useEffect(() => {
        if (currentSectionId) {
            startSectionTimer(currentSectionId);
        }
    }, [currentSectionId, startSectionTimer]);

    useEffect(() => {
        if (assessmentId) {
            const { sessionToken } = contestantService.getSession();
            contestantService.getOrCreateSubmission(assessmentId, sessionToken || '').then(subRes => {
                if (subRes.data?.success && subRes.data?.submission?.id) {
                    setSubmissionId(subRes.data.submission.id);
                }
            });
        }
    }, [assessmentId]);

    // ========== WebSocket Integration for SQL Results ==========
    useEffect(() => {
        if (!problem?.id) return;

        console.log('🔌 [SQL WebSocket] Connecting to socket server...');
        const socket = socketService.connect();

        if (!socket) {
            console.error('❌ [SQL WebSocket] Failed to connect to socket server');
            return;
        }

        console.log('✅ [SQL WebSocket] Socket connected, setting up listeners for question:', problem.id);

        // Handler for SQL Run Results (Test execution)
        const handleSqlRunResult = (payload: any) => {
            console.log('\n🎯 ========== SQL RUN RESULT RECEIVED (WebSocket) ==========');
            console.log('📦 [SQL WebSocket] Full Payload:', JSON.stringify(payload, null, 2));
            console.log('📋 [SQL WebSocket] Question ID:', payload.questionId);
            console.log('👤 [SQL WebSocket] User ID:', payload.userId);
            console.log('✅ [SQL WebSocket] Success:', payload.result?.success);
            console.log('📊 [SQL WebSocket] Output (Rows):', payload.result?.output);
            console.log('📝 [SQL WebSocket] Raw Output:', payload.result?.rawOutput);
            console.log('⏱️ [SQL WebSocket] Execution Time:', payload.result?.executionTime, 'ms');
            console.log('❌ [SQL WebSocket] Error (if any):', payload.result?.error);
            console.log('🔢 [SQL WebSocket] Status Code:', payload.result?.statusCode);
            console.log('📌 [SQL WebSocket] Status:', payload.result?.status);
            console.log('🎯 ============================================================\n');

            // Only process if this result is for the current question
            if (payload.questionId !== problem.id) {
                console.warn('⚠️ [SQL WebSocket] Received result for different question, ignoring');
                return;
            }

            setIsRunning(false);

            // Handle success/failure
            if (!payload.result?.success) {
                console.warn('❌ [SQL WebSocket] Run Failed:', payload.result?.error);
                const errorMsg = payload.result?.error || payload.result?.rawOutput || 'Execution failed';
                setSqlError(errorMsg);
                setSqlResult(null);
                setActiveTab('result');
                if (consoleHeight < 5) setConsoleHeight(35);
                return;
            }

            // Handle success case
            const rows = payload.result.output || [];
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

            console.log('✅ [SQL WebSocket] Processing successful result');

            setSqlResult({
                rows,
                columns,
                executionTime: payload.result.executionTime || 0,
                rowCount: rows.length,
                status: payload.result.status || 'Success'
            });
            setSqlError(null);
            setActiveTab('result');

            if (consoleHeight < 5) setConsoleHeight(35);
        };

        // Handler for SQL Submit Results (Final submission with evaluation)
        const handleSqlSubmitResult = (payload: any) => {
            console.log('\n🎯 ========== SQL SUBMIT RESULT RECEIVED (WebSocket) ==========');
            console.log('📦 [SQL WebSocket] Full Payload:', JSON.stringify(payload, null, 2));
            console.log('📋 [SQL WebSocket] Question ID:', payload.questionId);
            console.log('👤 [SQL WebSocket] User ID:', payload.userId);
            console.log('✅ [SQL WebSocket] Success:', payload.result?.success);
            console.log('🎯 [SQL WebSocket] Is Correct:', payload.result?.isCorrect);
            console.log('💯 [SQL WebSocket] Score:', payload.result?.score);
            console.log('📊 [SQL WebSocket] User Result:', payload.result?.userResult);
            console.log('📊 [SQL WebSocket] Expected Result:', payload.result?.expectedResult || payload.result?.expectedOutput);
            console.log('💬 [SQL WebSocket] Feedback:', payload.result?.feedback);
            console.log('⏱️ [SQL WebSocket] Execution Time:', payload.result?.executionTime, 'ms');
            console.log('❌ [SQL WebSocket] Error (if any):', payload.result?.error);
            console.log('🔢 [SQL WebSocket] Status Code:', payload.result?.statusCode);
            console.log('📌 [SQL WebSocket] Status:', payload.result?.status);
            console.log('📝 [SQL WebSocket] Raw Output:', payload.result?.rawOutput);
            console.log('🎯 ===============================================================\n');

            // Only process if this result is for the current question
            if (payload.questionId !== problem.id) {
                console.warn('⚠️ [SQL WebSocket] Received result for different question, ignoring');
                return;
            }

            setIsSubmitting(false);

            // Handle error case (success === false OR error exists)
            if (!payload.result?.success || payload.result?.error) {
                console.error('❌ [SQL WebSocket] Error in submission:', payload.result?.error);
                console.error('❌ [SQL WebSocket] Status:', payload.result?.status);
                console.error('❌ [SQL WebSocket] Status Code:', payload.result?.statusCode);
                console.error('❌ [SQL WebSocket] Raw Output:', payload.result?.rawOutput);

                // Display the error message (already cleaned by backend) or raw output
                const errorMessage = payload.result?.error || payload.result?.message || payload.result?.rawOutput || 'Submission failed';
                setSqlError(errorMessage);
                setSqlCheckResult(null);
                setActiveTab('result');
                if (consoleHeight < 5) setConsoleHeight(35);
                return;
            }

            // Handle success case
            if (payload.result?.success) {
                console.log('✅ [SQL WebSocket] Processing successful submission');
                console.log('   - Is Correct:', payload.result.isCorrect);
                console.log('   - Score:', payload.result.score);

                setSqlCheckResult({
                    isCorrect: payload.result.isCorrect,
                    score: payload.result.score,
                    userResult: payload.result.userResult || payload.result.output || [],
                    expectedResult: payload.result.expectedResult || payload.result.expectedOutput || [],
                    feedback: payload.result.feedback || '',
                    hiddenTotal: payload.result.hiddenTotal,
                    hiddenPassed: payload.result.hiddenPassed,
                    hiddenTestResults: payload.result.hiddenTestResults,
                    testCasesStats: payload.result.testCasesStats
                });
                setSqlError(null);
                setActiveTab('result');

                if (consoleHeight < 5) setConsoleHeight(35);
            }
        };

        // Register event listeners
        socket.on('sql_run_result', handleSqlRunResult);
        socket.on('sql_submit_result', handleSqlSubmitResult);

        console.log('👂 [SQL WebSocket] Event listeners registered for sql_run_result and sql_submit_result');

        // Cleanup on unmount or question change
        return () => {
            console.log('🧹 [SQL WebSocket] Cleaning up event listeners');
            socket.off('sql_run_result', handleSqlRunResult);
            socket.off('sql_submit_result', handleSqlSubmitResult);
        };
    }, [problem?.id, consoleHeight]);

    // Question switching effect - properly handles state updates
    useEffect(() => {
        if (!problem?.id) return;

        console.log('🔄 [SQL] Loading Question', questionIndex + 1, '| Problem ID:', problem.id);

        // Clear previous results immediately
        setSqlResult(null);
        setSqlError(null);
        setSqlCheckResult(null);

        // Determine language
        let newLanguage = 'sqlite';
        if (problem.dialect) {
            const d = problem.dialect.toLowerCase();
            if (d.includes('postgres')) newLanguage = 'postgresql';
            else if (d.includes('mysql')) newLanguage = 'mysql';
            else if (d.includes('sqlite') || d === 'sql') newLanguage = 'sqlite';
        }
        setLanguage(newLanguage);

        // Load code - prioritize saved answers
        const savedAnswer = answers[problem.id]?.code;

        if (savedAnswer !== undefined && savedAnswer !== null) {
            setCode(savedAnswer);
            console.log('✅ Loaded saved answer');
        } else if (problem.starterCode) {
            const starter = typeof problem.starterCode === 'string'
                ? problem.starterCode
                : (problem.starterCode.sql || problem.starterCode[newLanguage] || '');
            setCode(starter);
            console.log('📝 Loaded starter code');
        } else {
            setCode('');
            console.log('⚪ No code to load');
        }

        // Mark as loaded for save protection
        setLoadedProblemId(problem.id);
    }, [problem?.id, questionIndex]); // Run when problem or question index changes

    // Helper function to convert backend errors to user-friendly messages
    const getFriendlyErrorMessage = (error: string): string => {
        const errorLower = error.toLowerCase();

        // Common error patterns and their friendly replacements
        if (errorLower.includes('question id') && errorLower.includes('required')) {
            return 'Oops! Something went wrong. Please try again.';
        }
        if (errorLower.includes('query') && errorLower.includes('required')) {
            return 'No query to run! ✍️ Write your SQL query first.';
        }
        if (errorLower.includes('syntax error')) {
            return 'Syntax error in your query! 🔍 Check your SQL syntax.';
        }
        if (errorLower.includes('does not exist') || errorLower.includes('not found')) {
            return error; // Keep specific "table/column not found" errors as they're helpful
        }
        if (errorLower.includes('permission denied') || errorLower.includes('unauthorized')) {
            return 'Permission denied! 🚫 You don\'t have access to perform this operation.';
        }
        if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
            return 'Query took too long! ⏱️ Try optimizing your query.';
        }

        // Return original error if no pattern matches
        return error;
    };

    const handleRun = async () => {
        if (!problem?.id) return;

        // Validate that user has written a query
        if (!code || code.trim().length === 0) {
            setSqlError('No query to run! ✍️ Write your SQL query first.');
            setSqlResult(null);
            setSqlCheckResult(null);
            setActiveTab('result');
            if (consoleHeight < 5) setConsoleHeight(35);
            return;
        }

        setIsRunning(true);
        setSqlResult(null);
        setSqlError(null);
        setSqlCheckResult(null);
        setActiveTab('result');

        try {
            const response = await sqlQuestionService.runQuery({
                questionId: problem.id,
                query: code,
                dialect: language
            });

            console.log('✅ [SQL RUN] Job Queued:', response.data);

            // Only handle immediate HTTP errors
            if (response.data.error) {
                console.warn('⚠️ [SQL RUN] Queue Error:', response.data.error);
                setSqlError(getFriendlyErrorMessage(response.data.error));
                setIsRunning(false); // Stop loading only on error
                return;
            }

            // Success means job queued - DO NOT update UI yet, wait for WebSocket
            if (!response.data.success) {
                console.warn('⚠️ [SQL RUN] Failed to queue job');
                setSqlError('Failed to queue execution job');
                setIsRunning(false);
            }

            // NOTE: isRunning remains TRUE here. It will be set to FALSE by the WebSocket handler.

        } catch (error: any) {
            console.error('❌ [SQL RUN ERROR] Request Failed:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to execute SQL';
            setSqlError(getFriendlyErrorMessage(errorMsg));
            setIsRunning(false); // Stop loading on catch
        }
    };

    const handleSubmit = async () => {
        if (!problem?.id) return;

        // Validate that user has written a query
        if (!code || code.trim().length === 0) {
            setSqlError('No query to submit! ✍️ Write your SQL query first.');
            setSqlResult(null);
            setSqlCheckResult(null);
            setActiveTab('result');
            if (consoleHeight < 5) setConsoleHeight(35);
            return;
        }

        setIsSubmitting(true);
        setSqlCheckResult(null);
        setSqlError(null);

        try {
            const response = await sqlQuestionService.submitQuery({
                questionId: problem.id,
                query: code,
                assessmentId: assessmentId,
                sectionId: sections[currentSectionIndex]?.id,
                dialect: language
            });

            console.log('✅ [SQL SUBMIT] Job Queued:', response.data);

            // Check if there's an error in the response
            if (response.data.error) {
                console.warn('⚠️ [SQL SUBMIT] Queue Error:', response.data.error);
                setSqlError(getFriendlyErrorMessage(response.data.error));
                setIsSubmitting(false);
                return;
            }

            if (!response.data.success) {
                console.warn('⚠️ [SQL SUBMIT] Failed to queue job');
                setSqlError('Failed to queue submission job');
                setIsSubmitting(false);
            }

            // NOTE: isSubmitting remains TRUE here. It will be set to FALSE by the WebSocket handler.

        } catch (error: any) {
            console.error('❌ [SQL SUBMIT ERROR] Request Failed:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to submit SQL';
            setSqlError(getFriendlyErrorMessage(errorMsg));
            setIsSubmitting(false);
        }
    };

    // Utility function to clear all assessment-related localStorage
    const clearAllAssessmentData = () => {
        console.log('🧹 [CLEANUP] Clearing all assessment data from localStorage');

        // Clear main storage key
        localStorage.removeItem(STORAGE_KEY);

        // Clear navigation intent flags
        localStorage.removeItem(`navigation_intent_${assessmentId}`);

        // Clear any theme settings related to assessment
        localStorage.removeItem('assessmentTheme');

        // Clear all keys that match the assessment ID pattern
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes(assessmentId) || key.includes('assessment_progress'))) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Removed:', key);
        });

        console.log('✅ [CLEANUP] All assessment data cleared');
    };

    const handleFinalSubmit = async (isAutoSubmit: boolean = false) => {
        if (submitting) return;

        setSubmitting(true);
        try {
            // Use useMemo-computed formatted answers
            const formattedAnswers: any[] = [];
            Object.values(answers).forEach((data: any) => {
                if (data.type === 'mcq') {
                    formattedAnswers.push({
                        sectionId: data.sectionId,
                        questionId: data.questionId,
                        selectedAnswer: data.answer
                    });
                } else if (data.type === 'coding' || data.type === 'sql') { // Handle both
                    formattedAnswers.push({
                        sectionId: data.sectionId,
                        problemId: data.problemId,
                        code: data.code,
                        language: data.language
                    });
                }
            });

            console.log('🚀 [SUBMIT] Sending final submission (SQL Page):', { answersCount: formattedAnswers.length });

            await contestantService.submitAssessment(assessmentId, {
                answers: formattedAnswers,
                isAutoSubmit: false
            });

            // Clear ALL assessment data from localStorage
            clearAllAssessmentData();

            router.push(`/contestant/assessment/${assessmentId}/complete`);
        } catch (err: any) {
            console.error('Failed to submit assessment:', err);
            alert(`Failed to submit: ${err.response?.data?.message || err.message}`);
            setSubmitting(false);
            setShowSubmitConfirm(false);
        }
    };

    // Memoized current answer for this problem
    const currentAnswer = useMemo(() => {
        if (!problem?.id || !sections[sectionIndex]?.id) return null;

        return {
            type: 'sql' as const,
            sectionId: sections[sectionIndex].id,
            problemId: problem.id,
            code,
            language
        };
    }, [problem?.id, sections, sectionIndex, code, language]);

    // Update local answers - ONLY if the code currently in state belongs to the current problem
    useEffect(() => {
        if (!currentAnswer || !problem?.id) return;

        // Prevent saving if we are in the middle of a switch (loadedProblemId mismatch)
        if (loadedProblemId !== problem.id) {
            console.warn('⚠️ [SQL] Skipping save - state mismatch (Switching?)');
            return;
        }

        // Only update if code is not empty (prevent saving empty state on load)
        if (code) {
            setAnswers(prev => ({
                ...prev,
                [problem.id]: currentAnswer
            }));
        }
    }, [currentAnswer, problem?.id, loadedProblemId, code]);

    const handleSectionFinish = async (isAutoSubmit: boolean = false) => {
        console.log("🏁 [SQLPage] Finishing Section:", currentSectionIndex);

        setIsFinishingSection(true);

        // Call complete section API
        if (currentSectionId) {
            try {
                console.log(`📤 [SQLPage] Completing section ${currentSectionId}...`);
                await contestantService.completeSection(assessmentId, currentSectionId);
                console.log(`✅ [SQLPage] Section ${currentSectionId} completed successfully`);
            } catch (error) {
                console.error(`❌ [SQLPage] Failed to complete section ${currentSectionId}:`, error);
                // We continue anyway to allow the user to proceed
            }
        }

        const newLocked = new Set(lockedSectionIndices).add(currentSectionIndex);
        setLockedSectionIndices(newLocked);
        setShowSectionWarning(false);

        const nextIndex = currentSectionIndex + 1;

        const stateToSave = {
            currentSectionIndex: nextIndex,
            lockedSectionIndices: Array.from(newLocked),
            answers
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

        if (nextIndex < sections.length) {
            const nextSection = sections[nextIndex];
            console.log("➡️ [SQLPage] Navigating to:", { nextIndex, type: nextSection.type, title: nextSection.title });

            // Check for SQL types more robustly
            const nextTitleContainsSql = nextSection.title?.toLowerCase().includes('sql');
            const nextDivisionIsSql = (nextSection as any).division?.toLowerCase() === 'sql';

            if (nextSection.type === 'coding') {
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_coding');
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${nextIndex}`);
            } else if (nextSection.type === 'sql' || nextTitleContainsSql || nextDivisionIsSql) {
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_sql');
                router.push(`/contestant/assessment/${assessmentId}/sql?section=${nextIndex}`);
            } else {
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_mcq');
                router.push(`/contestant/assessment/${assessmentId}/take?section=${nextIndex}`);
            }
        } else {
            await handleFinalSubmit(isAutoSubmit);
        }
    };

    if (loading) {
        return (
            <div className={`h-screen flex items-center justify-center ${bg}`}>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`h-screen flex flex-col items-center justify-center ${bg} ${textPrimary}`}>
                <div className="text-red-500 mb-4 text-lg font-medium">{error}</div>
                <button
                    onClick={() => router.push(`/contestant/assessment/${assessmentId}/take`)}
                    className="px-4 py-2 bg-[#0f62fe] text-white rounded-lg hover:bg-[#0353e9] transition-colors"
                >
                    Back to Assessment
                </button>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className={`h-screen flex flex-col items-center justify-center ${bg} ${textPrimary}`}>
                <div className="text-amber-500 mb-4 text-lg font-medium">No SQL problem data available</div>
                <p className="text-sm text-gray-500 mb-4">Section index: {sectionIndex}, Question index: {questionIndex}</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push(`/contestant/assessment/${assessmentId}/take`)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bg} ${textPrimary}`}>
            {/* Header */}
            <header className={`h-14 shrink-0 px-6 flex items-center justify-between ${cardBg} border-b ${cardBorder}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative flex items-center gap-2 flex-1 min-w-0">
                        {/* Stepper Implementation (Simplified version for brevity but functional) */}
                        <div className="flex items-center gap-1">
                            {sections.map((s: any, idx: number) => (
                                <div key={s.id} className={`w-2 h-2 rounded-full ${idx === currentSectionIndex ? 'bg-[#0f62fe] scale-125' : lockedSectionIndices.has(idx) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            ))}
                        </div>
                        <div className="h-4 w-px bg-current/20 mx-2" />
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-500" />
                            <span className="font-bold text-sm tracking-wide">SQL Challenge</span>
                            <div className="h-4 w-px bg-current/20 mx-2" />
                            <span className="text-sm font-medium opacity-80">{currentSection.title}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {currentSection?.id && (
                        <AssessmentTimer
                            assessmentId={assessmentId}
                            sectionId={currentSection.id}
                            onExpire={() => handleSectionFinish(true)}
                            className="text-sm font-bold bg-[#262626] px-3 py-1.5 rounded-lg border border-[#393939]"
                            disableAutoSync={true}
                        />
                    )}

                    {/* Reset Layout Button */}
                    <button
                        onClick={() => {
                            setLeftWidth(50);
                            setConsoleHeight(35);
                        }}
                        className={`p-2.5 rounded-xl transition-all group ${theme === 'dark' ? 'hover:bg-[#393939] bg-[#262626]' : 'hover:bg-[#e0e0e0] bg-[#f4f4f4]'}`}
                        title="Reset Layout"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                    </button>

                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-[#393939] bg-[#262626]' : 'hover:bg-[#e0e0e0] bg-[#f4f4f4]'}`}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {currentSectionIndex < sections.length - 1 ? (
                        <button
                            onClick={() => setShowSectionWarning(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] via-[#4589ff] to-[#6929c4] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                        >
                            Next Section <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#42be65] to-[#24a148] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                        >
                            Submit <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div
                    className={`${cardBg} border-r ${cardBorder} overflow-y-auto`}
                    style={{ width: `${leftWidth}%` }}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <Database size={20} className="text-[#0f62fe]" />
                                    {problem?.title || 'SQL Problem'}
                                </h2>
                                {/* Difficulty Badge */}
                                <div className="flex flex-wrap gap-2">
                                    {problem?.difficulty && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {problem.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {allSqlProblems.length > 1 && (
                                <div className={`flex items-center gap-1 shrink-0 p-1 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                    <button
                                        onClick={() => handleQuestionNavigate(questionIndex - 1)}
                                        disabled={questionIndex === 0}
                                        className={`p-2 rounded-md transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                    ><ChevronLeft size={20} /></button>

                                    <div className="flex flex-col items-center px-4 min-w-[4rem]">
                                        <span className="text-xl font-bold leading-none">{questionIndex + 1}</span>
                                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">of {allSqlProblems.length}</span>
                                    </div>

                                    <button
                                        onClick={() => handleQuestionNavigate(questionIndex + 1)}
                                        disabled={questionIndex === allSqlProblems.length - 1}
                                        className={`p-2 rounded-md transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                    ><ChevronRight size={20} /></button>
                                </div>
                            )}
                        </div>

                        {/* Problem Statement Header */}
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Problem Statement
                        </h3>
                        <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''} mb-8`}>
                            {problem?.description ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {problem.description}
                                </ReactMarkdown>
                            ) : (
                                <p className={`text-sm ${textSecondary}`}>No description available.</p>
                            )}
                        </div>

                        {/* Schema Information (Input Tables) */}
                        {problem?.inputTables && (() => {
                            try {
                                let tables = typeof problem.inputTables === 'string'
                                    ? JSON.parse(problem.inputTables)
                                    : problem.inputTables;

                                // Support single table object by wrapping in array for robust rendering
                                if (tables && !Array.isArray(tables) && typeof tables === 'object') {
                                    tables = [tables];
                                }

                                if (!Array.isArray(tables)) {
                                    return null;
                                }

                                return (
                                    <div className="mb-6">
                                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Database size={14} /> Schema Information
                                        </h3>
                                        <div className="space-y-4">
                                            {tables.map((t: any, idx: number) => {
                                                // Adapter for different table structures
                                                // 1. Standard format: { name: "...", columns: [...], rows: [...] }
                                                // 2. Schema format: { table_name: "...", info: "...", table: { header: [...], rows: [...] } }

                                                const tableName = t.name || t.table_name || `Table ${idx + 1}`;
                                                const tableInfo = t.info || '';

                                                let columns: string[] = t.columns || [];
                                                let rows: any[] = t.rows || [];

                                                if (t.table && t.table.header && t.table.rows) {
                                                    columns = t.table.header;
                                                    rows = t.table.rows;
                                                }

                                                return (
                                                    <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-white border-gray-200'}`}>
                                                        <div className={`px-4 py-2.5 border-b flex flex-col gap-1 ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                                            <div className="flex items-center gap-2 font-bold text-sm">
                                                                <Database size={14} className="text-emerald-500" />
                                                                <span className="font-semibold">{tableName}</span>
                                                                {rows && <span className="text-[10px] opacity-60 font-normal ml-auto">({rows.length} {rows.length === 1 ? 'row' : 'rows'})</span>}
                                                            </div>
                                                            {tableInfo && (
                                                                <div className={`text-xs opacity-70 font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {tableInfo}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead className={`${theme === 'dark' ? 'bg-[#262626]/70' : 'bg-gray-100'}`}>
                                                                    <tr>
                                                                        {columns.map((col: string, cIdx: number) => (
                                                                            <th key={cIdx} className={`px-4 py-2.5 text-left font-mono font-semibold border-b ${theme === 'dark' ? 'border-[#393939] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                                                                {col}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {rows.map((row: any, rIdx: number) => (
                                                                        <tr key={rIdx} className={`border-b last:border-0 ${theme === 'dark' ? 'border-[#393939] hover:bg-[#262626]' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                                            {columns.map((col: string, cIdx: number) => {
                                                                                // Handle both object-based (row[col]) and array-based (row[cIdx]) rows
                                                                                let cellValue: any;
                                                                                if (Array.isArray(row)) {
                                                                                    cellValue = row[cIdx];
                                                                                } else {
                                                                                    cellValue = row[col];
                                                                                }

                                                                                return (
                                                                                    <td key={cIdx} className={`px-4 py-2 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                                        {cellValue !== undefined ? String(cellValue) : '-'}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            } catch (e) {
                                console.error("❌ Failed to parse inputTables:", e, problem.inputTables);
                                return (
                                    <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                        <p className="text-sm font-medium">Failed to load schema information</p>
                                    </div>
                                );
                            }
                        })()}

                        {/* Sample Data (Parsed from Schema Setup) */}
                        {problem?.schemaSetup && (() => {
                            try {
                                const insertRegex = /INSERT INTO\s+([`'"]?(\w+)[`'"]?)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gmi;
                                const tables: any[] = [];
                                let match;
                                const regex = new RegExp(insertRegex);

                                while ((match = regex.exec(problem.schemaSetup)) !== null) {
                                    const tableName = match[2];
                                    const columns = match[3].split(',').map(c => c.trim().replace(/[`'"]/g, ''));
                                    const valuesBlock = match[4];

                                    const rows = valuesBlock.split(/\)\s*,\s*\(/).map(rowStr => {
                                        let cleanRow = rowStr.trim();
                                        if (cleanRow.startsWith('(')) cleanRow = cleanRow.substring(1);
                                        if (cleanRow.endsWith(')')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
                                        return cleanRow.split(',').map(v => {
                                            const val = v.trim();
                                            if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
                                            return val;
                                        });
                                    });

                                    tables.push({ name: tableName, columns, rows });
                                }

                                if (tables.length === 0) return null;

                                return (
                                    <div className="mb-6">
                                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Database size={14} /> Sample Data
                                        </h3>
                                        <div className="space-y-4">
                                            {tables.map((table: any, idx: number) => (
                                                <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-white border-gray-200'}`}>
                                                    <div className={`px-4 py-2.5 border-b flex flex-col gap-1 ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                                        <div className="flex items-center gap-2 font-bold text-sm">
                                                            <Database size={14} className="text-emerald-500" />
                                                            <span className="font-semibold">{table.name}</span>
                                                            {table.rows && <span className="text-[10px] opacity-60 font-normal ml-auto">({table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'})</span>}
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className={`${theme === 'dark' ? 'bg-[#262626]/70' : 'bg-gray-100'}`}>
                                                                <tr>
                                                                    {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                                        <th key={cIdx} className={`px-4 py-2.5 text-left font-mono font-semibold border-b ${theme === 'dark' ? 'border-[#393939] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                                                            {col}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {table.rows.map((row: any, rIdx: number) => (
                                                                    <tr key={rIdx} className={`border-b last:border-0 ${theme === 'dark' ? 'border-[#393939] hover:bg-[#262626]' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                                        {table.columns.map((col: string, cIdx: number) => {
                                                                            const cellValue = row[cIdx];
                                                                            return (
                                                                                <td key={cIdx} className={`px-4 py-2 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                                    {cellValue !== undefined ? String(cellValue) : '-'}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } catch (e) {
                                console.error("Failed to parse schemaSetup:", e);
                                return null;
                            }
                        })()}

                        {/* Expected Result */}
                        {(problem?.expectedResult || problem?.expectedOutput) && (() => {
                            try {
                                const raw = problem.expectedResult || problem.expectedOutput;
                                const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

                                let tablesToRender: any[] = [];

                                if (Array.isArray(data)) {
                                    if (data.length > 0) {
                                        const firstItem = data[0];
                                        // Check if it's an array of tables (has rows/columns keys)
                                        if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem) && 'rows' in firstItem && 'columns' in firstItem) {
                                            tablesToRender = data;
                                        } else {
                                            // Assume raw rows (Query Output)
                                            // 1. Array of Objects: keys are columns
                                            // 2. Array of Arrays: columns unknown (use indices or generic names)

                                            let columns: string[] = [];
                                            if (Array.isArray(firstItem)) {
                                                // Array of arrays - use indices? Or just don't show header?
                                                // Better: "Col 1", "Col 2"...
                                                columns = firstItem.map((_, i) => `Col ${i + 1}`);
                                            } else if (typeof firstItem === 'object') {
                                                columns = Object.keys(firstItem);
                                            }

                                            tablesToRender = [{
                                                name: 'Expected Output',
                                                columns: columns,
                                                rows: data
                                            }];
                                        }
                                    }
                                } else if (data && typeof data === 'object') {
                                    // Single Table Definition
                                    if ('rows' in data && 'columns' in data) {
                                        tablesToRender = [data];
                                    }
                                }

                                if (tablesToRender.length === 0) return null;

                                return (
                                    <div className="mb-6">
                                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Database size={14} /> Expected Result
                                        </h3>
                                        <div className="space-y-4">
                                            {tablesToRender.map((table: any, idx: number) => (
                                                <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-white border-gray-200'}`}>
                                                    <div className={`px-4 py-2.5 text-sm font-bold border-b flex items-center gap-2 ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                                        <Database size={14} className="text-blue-500" />
                                                        <span className="font-semibold">{table.name || 'Query Result'}</span>
                                                        {table.rows && <span className="text-[10px] opacity-60 font-normal ml-auto">({table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'})</span>}
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className={`${theme === 'dark' ? 'bg-[#262626]/70' : 'bg-gray-100'}`}>
                                                                <tr>
                                                                    {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                                        <th key={cIdx} className={`px-4 py-2.5 text-left font-mono font-semibold border-b ${theme === 'dark' ? 'border-[#393939] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                                                            {col}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {table.rows && table.rows.map((row: any, rIdx: number) => (
                                                                    <tr key={rIdx} className={`border-b last:border-0 ${theme === 'dark' ? 'border-[#393939] hover:bg-[#262626]' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                                        {table.columns && table.columns.map((col: string, cIdx: number) => {
                                                                            let cellValue: any;
                                                                            if (Array.isArray(row)) {
                                                                                cellValue = row[cIdx];
                                                                            } else {
                                                                                cellValue = row[col];
                                                                            }
                                                                            return (
                                                                                <td key={cIdx} className={`px-4 py-2 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                                    {cellValue !== undefined ? String(cellValue) : '-'}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } catch (e) {
                                console.error("❌ Failed to parse expectedResult:", e);
                                return (
                                    <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                        <p className="text-sm font-medium">Failed to load expected output</p>
                                    </div>
                                );
                            }
                        })()}

                        {/* Coding Problem Details (if applicable) */}
                        {problem?.inputFormat && (
                            <div className="mb-6">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 opacity-80 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Input Format</h3>
                                <div className={`text-sm opacity-90 whitespace-pre-wrap ${textSecondary}`}>{problem.inputFormat}</div>
                            </div>
                        )}
                        {problem?.outputFormat && (
                            <div className="mb-6">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 opacity-80 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Output Format</h3>
                                <div className={`text-sm opacity-90 whitespace-pre-wrap ${textSecondary}`}>{problem.outputFormat}</div>
                            </div>
                        )}
                        {problem?.constraints && (
                            <div className="mb-6">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 opacity-80 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Constraints</h3>
                                <div className={`text-sm font-mono p-3 rounded border whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-gray-50 border-gray-200'}`}>{problem.constraints}</div>
                            </div>
                        )}
                        {problem?.samples && (() => {
                            try {
                                const samples = typeof problem.samples === 'string' ? JSON.parse(problem.samples) : problem.samples;
                                if (Array.isArray(samples) && samples.length > 0) {
                                    return (
                                        <div className="mb-6">
                                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 opacity-80 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Zap size={14} /> Test Cases
                                            </h3>
                                            <div className="space-y-4">
                                                {samples.map((sample: any, idx: number) => (
                                                    <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-[#393939]' : 'border-gray-200'}`}>
                                                        <div className={`px-4 py-2 text-xs font-bold border-b opacity-70 flex justify-between ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-gray-100 border-gray-200'}`}>
                                                            <span>Case {idx + 1}</span>
                                                        </div>
                                                        <div className="p-3 space-y-3">
                                                            <div>
                                                                <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Input</div>
                                                                <div className={`p-2 rounded font-mono text-xs whitespace-pre-wrap ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>{sample.input}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Output</div>
                                                                <div className={`p-2 rounded font-mono text-xs whitespace-pre-wrap ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>{sample.output}</div>
                                                            </div>
                                                            {sample.explanation && (
                                                                <div>
                                                                    <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Explanation</div>
                                                                    <div className="text-xs opacity-80">{sample.explanation}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                            } catch (e) { console.error("Failed to parse samples", e); }
                            return null;
                        })()}

                    </div>
                </div>

                {/* Resizer */}
                <div
                    className={`w-1 cursor-col-resize hover:bg-[#0f62fe] transition-colors`}
                    onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startWidth = leftWidth;
                        const onMove = (e: MouseEvent) => {
                            const delta = e.clientX - startX;
                            const newWidth = Math.min(60, Math.max(25, startWidth + (delta / window.innerWidth) * 100));
                            setLeftWidth(newWidth);
                        };
                        const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    }}
                />

                {/* Right Panel - Editor & Results (NEW LAYOUT) */}
                <div className="flex-1 flex flex-col overflow-hidden relative">

                    {/* Main Content (Editor + Console) */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* Editor Section */}
                        <div className="flex flex-col relative" style={{ height: `${100 - consoleHeight}%` }}>
                            <div className={`h-10 shrink-0 flex items-center px-4 border-b ${cardBorder} ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fafafa]'}`}>
                                <span className="text-xs font-bold mr-2 text-gray-500">Language:</span>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className={`text-xs font-medium px-2 py-1 rounded border outline-none ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-[#f4f4f4]' : 'bg-white border-[#e0e0e0]'}`}
                                >
                                    {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 relative">
                                <Editor
                                    key={problem?.id}  // Force re-mount on question change
                                    height="100%"
                                    language={language}
                                    value={code}
                                    onChange={(v) => setCode(v || '')}
                                    theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                                    loading={
                                        <div className="h-full flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#0f62fe]" />
                                        </div>
                                    }
                                    beforeMount={(monaco) => {
                                        // Ensure theme is set before editor mounts
                                        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
                                    }}
                                    options={{
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                                        minimap: { enabled: false },
                                        automaticLayout: true,
                                        tabSize: 4,
                                        lineNumbers: 'on',
                                        contextmenu: !proctoringSettings?.blockRightClick,
                                        // Enhanced SQL syntax highlighting
                                        bracketPairColorization: { enabled: true },
                                        matchBrackets: 'always',
                                        autoClosingBrackets: 'always',
                                        autoClosingQuotes: 'always',
                                        formatOnPaste: true,
                                        formatOnType: true,
                                        suggest: {
                                            showKeywords: true,
                                            showSnippets: true,
                                        },
                                        quickSuggestions: {
                                            other: true,
                                            comments: false,
                                            strings: false
                                        },
                                        wordBasedSuggestions: 'currentDocument',
                                        // Better readability
                                        renderLineHighlight: 'all',
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                        padding: { top: 16, bottom: 16 },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Enhanced Console Resizer with Visual Feedback */}
                        <div
                            className={`h-1 cursor-row-resize transition-all relative group ${isResizingConsole
                                ? 'bg-[#0f62fe] h-1.5'
                                : 'bg-black/10 dark:bg-white/5 hover:bg-[#0f62fe]/50'
                                }`}
                            onMouseDown={(e) => {
                                setIsResizingConsole(true);
                                const startY = e.clientY;
                                const startHeight = consoleHeight;
                                const onMove = (e: MouseEvent) => {
                                    const delta = startY - e.clientY;
                                    const newHeight = Math.min(80, Math.max(20, startHeight + (delta / window.innerHeight) * 100));
                                    setConsoleHeight(newHeight);
                                };
                                const onUp = () => {
                                    setIsResizingConsole(false);
                                    document.removeEventListener('mousemove', onMove);
                                    document.removeEventListener('mouseup', onUp);
                                };
                                document.addEventListener('mousemove', onMove);
                                document.addEventListener('mouseup', onUp);
                            }}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                    <div className="w-8 h-0.5 bg-current rounded-full" />
                                    <div className="w-8 h-0.5 bg-current rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Console Panel */}
                        <div className={`${cardBg} flex flex-col border-t ${cardBorder}`} style={{ height: `${consoleHeight}%` }}>
                            {/* Console Header */}
                            <div className={`h-10 shrink-0 flex items-center justify-between px-4 border-b ${cardBorder} ${theme === 'dark' ? 'bg-[#262626]' : 'bg-gray-100'}`}>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                        <Terminal size={12} /> Execution Result
                                    </span>

                                    {/* Status Badge */}
                                    {sqlError ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">ERROR</span>
                                    ) : sqlCheckResult ? (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sqlCheckResult.isCorrect ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {sqlCheckResult.isCorrect ? 'PASSED' : 'WRONG ANSWER'}
                                        </span>
                                    ) : sqlResult ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">SUCCESS</span>
                                    ) : null}
                                </div>

                                {/* Close Button (Minimizes, doesn't close completely in this mode but we keep it for consistency or remove it) */}
                                <button
                                    onClick={() => {
                                        setSqlResult(null);
                                        setSqlCheckResult(null);
                                        setSqlError(null);
                                    }}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                                    title="Clear Console"
                                >
                                    <XCircle size={14} />
                                </button>
                            </div>

                            {/* Console Body - Scrollable */}
                            <div className={`flex-1 overflow-auto p-4 font-mono text-xs ${cardBg}`}>
                                {sqlError ? (
                                    <div className="text-red-500 whitespace-pre-wrap">{sqlError}</div>
                                ) : sqlCheckResult ? (
                                    <div className="space-y-4">
                                        {/* Feedback */}
                                        <div className={`p-3 rounded border ${sqlCheckResult.isCorrect ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                                            <p className="font-bold mb-1 text-sm">{sqlCheckResult.isCorrect ? 'Correct!' : 'Incorrect'}</p>
                                            <p className="opacity-90">{sqlCheckResult.feedback}</p>
                                        </div>

                                        {/* Test Cases Stats (New Structure) */}
                                        {sqlCheckResult.testCasesStats ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {/* Sample Cases */}
                                                <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                                            <Terminal size={12} /> Sample Cases
                                                        </span>
                                                        <span className={`text-xs font-bold ${sqlCheckResult.testCasesStats.sample.passed === sqlCheckResult.testCasesStats.sample.total ? 'text-green-500' : 'text-amber-500'}`}>
                                                            {sqlCheckResult.testCasesStats.sample.passed}/{sqlCheckResult.testCasesStats.sample.total} Passed
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${sqlCheckResult.testCasesStats.sample.passed === sqlCheckResult.testCasesStats.sample.total ? 'bg-green-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${((sqlCheckResult.testCasesStats.sample.passed || 0) / (sqlCheckResult.testCasesStats.sample.total || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Hidden Cases */}
                                                <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                                            <Lock size={12} /> Hidden Cases
                                                        </span>
                                                        <span className={`text-xs font-bold ${sqlCheckResult.testCasesStats.hidden.passed === sqlCheckResult.testCasesStats.hidden.total ? 'text-green-500' : 'text-amber-500'}`}>
                                                            {sqlCheckResult.testCasesStats.hidden.passed}/{sqlCheckResult.testCasesStats.hidden.total} Passed
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${sqlCheckResult.testCasesStats.hidden.passed === sqlCheckResult.testCasesStats.hidden.total ? 'bg-green-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${((sqlCheckResult.testCasesStats.hidden.passed || 0) / (sqlCheckResult.testCasesStats.hidden.total || 1)) * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Detailed Hidden Results (Dots) */}
                                                    {sqlCheckResult.hiddenTestResults && sqlCheckResult.hiddenTestResults.length > 0 && (
                                                        <div className="mt-3 grid grid-cols-5 gap-1">
                                                            {sqlCheckResult.hiddenTestResults.map((res: any, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    title={`Test Case ${res.index || idx + 1}: ${res.status}`}
                                                                    className={`h-1.5 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : sqlCheckResult.hiddenTotal !== undefined ? (
                                            /* Fallback for old Hidden Stats Only */
                                            <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                                        <Lock size={12} /> Hidden Test Cases
                                                    </span>
                                                    <span className={`text-xs font-bold ${sqlCheckResult.hiddenPassed === sqlCheckResult.hiddenTotal ? 'text-green-500' : 'text-amber-500'}`}>
                                                        {sqlCheckResult.hiddenPassed}/{sqlCheckResult.hiddenTotal} Passed
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${sqlCheckResult.hiddenPassed === sqlCheckResult.hiddenTotal ? 'bg-green-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${((sqlCheckResult.hiddenPassed || 0) / (sqlCheckResult.hiddenTotal || 1)) * 100}%` }}
                                                    />
                                                </div>

                                                {/* Detailed Hidden Results */}
                                                {sqlCheckResult.hiddenTestResults && sqlCheckResult.hiddenTestResults.length > 0 && (
                                                    <div className="mt-3 grid grid-cols-5 gap-1">
                                                        {sqlCheckResult.hiddenTestResults.map((res: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                title={`Test Case ${res.index || idx + 1}: ${res.status}`}
                                                                className={`h-1.5 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* User Result Table */}
                                        {sqlCheckResult.userResult && sqlCheckResult.userResult.length > 0 && (
                                            <div>
                                                <h4 className="font-bold opacity-70 mb-2">Your Output:</h4>
                                                <div className={`rounded border overflow-hidden ${theme === 'dark' ? 'border-[#393939]' : 'border-gray-200'}`}>
                                                    <table className="w-full text-left bg-transparent">
                                                        <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}>
                                                            <tr>
                                                                {Object.keys(sqlCheckResult.userResult[0]).map((col, i) => (
                                                                    <th key={i} className="px-3 py-2 border-b border-r last:border-r-0 border-current/10 opacity-70">{col}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sqlCheckResult.userResult.slice(0, 50).map((row: any, i: number) => (
                                                                <tr key={i} className="border-b last:border-0 border-current/5">
                                                                    {Object.values(row).map((val: any, j: number) => (
                                                                        <td key={j} className="px-3 py-1.5 border-r last:border-r-0 border-current/5 opacity-90 whitespace-nowrap">{String(val)}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : sqlResult ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] mb-2 font-medium">
                                            <div className="flex gap-3 opacity-60">
                                                <span>{sqlResult.rowCount} rows</span>
                                                <span>{sqlResult.executionTime}ms</span>
                                            </div>
                                            {sqlResult.status && (
                                                <span className={`${['Accepted', 'Passed', 'Success'].includes(sqlResult.status) ? 'text-green-500' : 'text-amber-500'} font-bold uppercase tracking-wider`}>
                                                    {sqlResult.status}
                                                </span>
                                            )}
                                        </div>
                                        {sqlResult.rows.length === 0 ? (
                                            <div className="italic opacity-50">Query returned no results.</div>
                                        ) : (
                                            <div className={`rounded border overflow-hidden ${['Accepted', 'Passed', 'Success'].includes(sqlResult.status || '')
                                                ? 'border-green-500/30 ring-2 ring-green-500/10'
                                                : theme === 'dark' ? 'border-[#393939]' : 'border-gray-200'
                                                }`}>
                                                <table className="w-full text-left bg-transparent">
                                                    <thead className={
                                                        ['Accepted', 'Passed', 'Success'].includes(sqlResult.status || '')
                                                            ? 'bg-green-500/10'
                                                            : theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                                                    }>
                                                        <tr>
                                                            {sqlResult.columns.map((col, i) => (
                                                                <th key={i} className={`px-3 py-2 border-b border-r last:border-r-0 border-current/10 font-bold ${['Accepted', 'Passed', 'Success'].includes(sqlResult.status || '')
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'opacity-70'
                                                                    }`}>{col}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sqlResult.rows.map((row, i) => (
                                                            <tr key={i} className={`border-b last:border-0 border-current/5 ${['Accepted', 'Passed', 'Success'].includes(sqlResult.status || '')
                                                                ? 'hover:bg-green-500/5'
                                                                : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                                                                }`}>
                                                                {sqlResult.columns.map((col, j) => (
                                                                    <td key={j} className="px-3 py-1.5 border-r last:border-r-0 border-current/5 opacity-90 whitespace-nowrap">{String(row[col])}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                                        <Terminal size={48} className="mb-4" />
                                        <p className="text-sm font-medium">Nothing to show yet! 🤷‍♂️</p>
                                        <p className="text-xs">Write your query and hit Run or Submit</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className={`h-16 shrink-0 flex items-center justify-between px-6 border-t ${cardBorder} ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                        <div className="flex items-center gap-4">
                            {/* Left side of footer (optional status info) */}
                            {(sqlResult || sqlCheckResult) && (
                                <span className={`text-xs flex items-center gap-2 ${sqlCheckResult?.isCorrect ? 'text-green-500' : 'text-gray-500'}`}>
                                    {sqlCheckResult?.isCorrect ? <CheckCircle size={14} /> : <div className="w-3 h-3 rounded-full bg-current opacity-50" />}
                                    {sqlCheckResult ? (sqlCheckResult.isCorrect ? 'Assessment Passed' : 'Assessment Failed') : 'Query Executed'}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRun}
                                disabled={isRunning || isSubmitting}
                                className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 border transition-all ${theme === 'dark' ? 'bg-[#262626] border-[#525252] text-white hover:bg-[#333]' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                            >
                                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Run Query
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isRunning || isSubmitting}
                                className="px-6 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals (Submit/Warning) reused structure logic */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className="max-w-md w-full rounded-2xl p-8 bg-card border border-border shadow-2xl transform transition-all scale-100 relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>

                        <div className="relative text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                                <Send className="w-7 h-7 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Ready to Submit?</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                You are about to submit your assessment. This action cannot be undone and will finalize your score.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 relative">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-border/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleFinalSubmit(false)}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit All</span>
                                        <ChevronRight className="w-4 h-4 opacity-70" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* {proctoringSettings && <ProctoringMonitor settings={proctoringSettings} />} - Handled by Layout */}

            {showSectionWarning && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className="max-w-md w-full rounded-2xl p-8 bg-card border border-border shadow-2xl transform transition-all scale-100 relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                        <div className="relative text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                <AlertTriangle className="w-7 h-7 text-indigo-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Finish Section?</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">
                                Are you sure you want to finish this section? You won't be able to return to these questions once you proceed.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 relative">
                            <button
                                onClick={() => setShowSectionWarning(false)}
                                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-all active:scale-[0.98] border border-transparent hover:border-border/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSectionFinish(false)}
                                disabled={isFinishingSection}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {isFinishingSection ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm & Next</span>
                                        <ChevronRight className="w-4 h-4 opacity-70" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const SQLPage = () => {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#161616]"><Loader2 className="w-10 h-10 animate-spin text-[#0f62fe]" /></div>}>
            <SQLPageContent />
        </Suspense>
    );
};

export default SQLPage;
