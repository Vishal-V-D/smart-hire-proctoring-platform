'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Play, Send, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, CheckCircle, XCircle,
    Loader2, Terminal, Database, Zap, AlertTriangle, Lock, BarChart2, Copy, RotateCcw
} from 'lucide-react';
import { contestantService } from '@/api/contestantService';
import { sqlQuestionService } from '@/api/sqlQuestionService';
import { codeService, type TestCaseResult, type RunCodeSummary, type SubmitCodeResponse } from '@/api/codeService';
import AssessmentTimer from '@/components/contestant/AssessmentTimer';
import { useAssessment } from '@/context/AssessmentContext';
import ProctoringMonitor from '@/components/contestant/ProctoringMonitor';

// Dynamic import Monaco
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    { id: 'sql', name: 'Standard SQL' },
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

    // Question switching effect - properly handles state updates
    useEffect(() => {
        if (!problem?.id) return;

        console.log('🔄 [SQL] Loading Question', questionIndex + 1, '| Problem ID:', problem.id);

        // Clear previous results immediately
        setSqlResult(null);
        setSqlError(null);
        setSqlCheckResult(null);

        // Determine language
        let newLanguage = 'sql';
        if (problem.dialect) {
            const d = problem.dialect.toLowerCase();
            if (d.includes('postgres')) newLanguage = 'postgresql';
            else if (d.includes('mysql')) newLanguage = 'mysql';
            else if (d.includes('sqlite')) newLanguage = 'sqlite';
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

    const handleRun = async () => {
        if (!problem?.id) return;

        setIsRunning(true);
        setSqlResult(null);
        setSqlError(null);
        setSqlCheckResult(null);
        setActiveTab('result');

        try {
            const response = await sqlQuestionService.runQuery({
                questionId: problem.id,
                query: code
            });

            if (response.data.success) {
                const rows = response.data.output || response.data.result || [];
                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                setSqlResult({
                    rows,
                    columns,
                    executionTime: response.data.executionTime,
                    rowCount: response.data.rowCount ?? rows.length,
                    status: response.data.status
                });
            } else {
                setSqlError(response.data.error || 'Execution failed');
            }
        } catch (error: any) {
            console.error('Run SQL error:', error);
            setSqlError(error.response?.data?.message || error.message || 'Failed to execute SQL');
        } finally {
            setIsRunning(false);
            if (consoleHeight < 5) setConsoleHeight(35);
        }
    };

    const handleSubmit = async () => {
        if (!problem?.id) return;

        setIsSubmitting(true);
        setSqlCheckResult(null);
        setSqlError(null);

        try {
            const response = await sqlQuestionService.submitQuery({
                questionId: problem.id,
                query: code,
                assessmentId: assessmentId,
                sectionId: sections[currentSectionIndex]?.id
            });

            if (response.data.success) {
                setSqlCheckResult({
                    isCorrect: response.data.isCorrect,
                    score: response.data.score,
                    userResult: response.data.userResult,
                    expectedResult: response.data.expectedResult,
                    feedback: response.data.feedback
                });
            } else {
                setSqlError(response.data.error || 'Submission failed');
            }
        } catch (error: any) {
            console.error('Submit SQL error:', error);
            setSqlError(error.response?.data?.message || error.message || 'Failed to submit SQL');
        } finally {
            setIsSubmitting(false);
            if (consoleHeight < 5) setConsoleHeight(35);
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
                <Loader2 className="w-10 h-10 animate-spin text-[#0f62fe]" />
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

                        <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''} mb-8`}>
                            {problem?.description ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {problem.description}
                                </ReactMarkdown>
                            ) : (
                                <p className={`text-sm ${textSecondary}`}>No description available.</p>
                            )}
                        </div>

                        {/* Input Tables - Database Schema */}
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
                                            <Database size={14} /> Input Table(s)
                                        </h3>
                                        <div className="space-y-4">
                                            {tables.map((table: any, idx: number) => (
                                                <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-white border-gray-200'}`}>
                                                    <div className={`px-4 py-2.5 text-sm font-bold border-b flex items-center gap-2 ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                                        <Database size={14} className="text-emerald-500" />
                                                        <span className="font-semibold">{table.name}</span>
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
                                                                        {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                                            <td key={cIdx} className={`px-4 py-2 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                                {row[col] !== undefined ? String(row[col]) : '-'}
                                                                            </td>
                                                                        ))}
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
                                console.error("❌ Failed to parse inputTables:", e, problem.inputTables);
                                return (
                                    <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                        <p className="text-sm font-medium">Failed to load input tables</p>
                                    </div>
                                );
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
                                        if (firstItem && typeof firstItem === 'object' && 'rows' in firstItem && 'columns' in firstItem) {
                                            tablesToRender = data;
                                        } else {
                                            // Assume raw rows (Query Output) - infer columns from first row
                                            const columns = firstItem ? Object.keys(firstItem) : [];
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
                                    // Or single wrapper object containing 'expectedResult'? 
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
                                                                        {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                                            <td key={cIdx} className={`px-4 py-2 font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                                {row[col] !== undefined ? String(row[col]) : '-'}
                                                                            </td>
                                                                        ))}
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
                                                <Zap size={14} /> Sample Cases
                                            </h3>
                                            <div className="space-y-4">
                                                {samples.map((sample: any, idx: number) => (
                                                    <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-[#393939]' : 'border-gray-200'}`}>
                                                        <div className={`px-4 py-2 text-xs font-bold border-b opacity-70 flex justify-between ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-gray-100 border-gray-200'}`}>
                                                            <span>Sample {idx + 1}</span>
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
                                            <p className="mt-2 text-[10px] opacity-70">Score: {sqlCheckResult.score}%</p>
                                        </div>

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
                                        <p className="text-sm font-medium">Ready to execute SQL query</p>
                                        <p className="text-xs">Click Run or Submit to see results</p>
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                        <div className="text-center mb-5">
                            <h2 className="text-lg font-bold">Submit Assessment?</h2>
                            {submitting && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Submitting your answers...
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                disabled={submitting}
                                className="flex-1 py-2 rounded bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleFinalSubmit(false)}
                                disabled={submitting}
                                className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit All'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* {proctoringSettings && <ProctoringMonitor settings={proctoringSettings} />} - Handled by Layout */}

            {showSectionWarning && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                        <h2 className="text-lg font-bold mb-2 text-center">Finish Section?</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSectionWarning(false)} className="flex-1 py-2 rounded bg-gray-600">Cancel</button>
                            <button onClick={() => handleSectionFinish(false)} className="flex-1 py-2 rounded bg-blue-600">Confirm</button>
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
