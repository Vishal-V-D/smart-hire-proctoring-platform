'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Play, Send, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, Clock, CheckCircle, XCircle,
    Terminal, Code2, FileText, Zap, AlertTriangle, Lock, Tag, BarChart2, Copy, Loader2
} from 'lucide-react';
import Loader from '@/components/Loader';
import { contestantService } from '@/api/contestantService';
import { codeService, type TestCaseResult, type RunCodeSummary, type SubmitCodeResponse } from '@/api/codeService';
import AssessmentTimer from '@/components/contestant/AssessmentTimer';
import { useAssessment } from '@/context/AssessmentContext';

// Dynamic import Monaco
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    { id: 'java', name: 'Java' },
    { id: 'python', name: 'Python' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },

];

function CodingPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const assessmentId = params.id as string;
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

    // 3. Questions/Problems
    const { data: questionsRes, isLoading: questionsLoading } = useQuery({
        queryKey: ['questions', assessmentId, currentSectionId],
        queryFn: async () => {
            if (!currentSectionId) return { questions: [], problems: [] };
            const res = await contestantService.getQuestions(assessmentId, currentSectionId);
            return res.data;
        },
        enabled: !!currentSectionId && currentSection?.type === 'coding',
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

    const problems = questionsRes?.problems || [];
    // Ensure we safely access the problem
    const problemLink = problems[questionIndex];
    const problem = problemLink?.problem || problemLink || null;

    // Navigation Handler
    const handleQuestionNavigate = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < problems.length) {
            const params = new URLSearchParams(Array.from(searchParams.entries()));
            params.set('question', newIndex.toString());
            router.push(`?${params.toString()}`);
        }
    };

    // Derived Loading
    const loading = sectionsLoading || (!!currentSectionId && questionsLoading);

    // const [problem, setProblem] = useState<any>(null); // REPLACED
    // const [loading, setLoading] = useState(true);      // REPLACED
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('java');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [runSummary, setRunSummary] = useState<RunCodeSummary | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitCodeResponse | null>(null);
    const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase');
    // const [sections, setSections] = useState<any[]>([]); // REMOVED
    // const [proctoringSettings, setProctoringSettings] = useState<any>(null); // REMOVED
    const [leftWidth, setLeftWidth] = useState(50);
    const [consoleHeight, setConsoleHeight] = useState(35);
    // Use URL sectionIndex as the source of truth for current section
    const [currentSectionIndex, setCurrentSectionIndex] = useState(sectionIndex);
    const [lockedSectionIndices, setLockedSectionIndices] = useState<Set<number>>(new Set());
    const [showSectionWarning, setShowSectionWarning] = useState(false);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [isFinishingSection, setIsFinishingSection] = useState(false);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [isStateLoaded, setIsStateLoaded] = useState(false);
    const [sectionScrollPosition, setSectionScrollPosition] = useState(0);

    // Timer State removed
    const { startSectionTimer } = useAssessment();
    // const currentSection = sections[currentSectionIndex]; // REMOVED - Defined above
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Persistence Key
    const STORAGE_KEY = `assessment_progress_${assessmentId}`;

    // Sync currentSectionIndex with URL sectionIndex when it changes
    useEffect(() => {
        setCurrentSectionIndex(sectionIndex);
    }, [sectionIndex]);

    // Load locked sections and answers from local storage on mount (but NOT currentSectionIndex - use URL)
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Don't override currentSectionIndex - use URL as source of truth
                if (parsed.lockedSectionIndices) setLockedSectionIndices(new Set(parsed.lockedSectionIndices));
                if (parsed.answers) setAnswers(parsed.answers);
            } catch (e) {
                console.error("Failed to parse saved progress", e);
            }
        }

        // Check and clear navigation intent flag if present
        const intentFlag = localStorage.getItem(`navigation_intent_${assessmentId}`);
        if (intentFlag === 'navigated_to_coding') {
            console.log("🎯 [CodingPage] Intentionally navigated here from MCQ");
            localStorage.removeItem(`navigation_intent_${assessmentId}`);
        }

        setIsStateLoaded(true);
    }, [assessmentId]);

    // Save state to local storage whenever it changes
    useEffect(() => {
        if (loading || !isStateLoaded) return;
        const stateToSave = {
            currentSectionIndex,
            lockedSectionIndices: Array.from(lockedSectionIndices),
            answers
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [currentSectionIndex, lockedSectionIndices, loading, assessmentId, answers, isStateLoaded]);

    // Carbon colors
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


    // Derived Settings
    const proctoringSettings = assessmentData?.assessment?.proctoringSettings;

    // Start Timer Effect
    useEffect(() => {
        if (currentSectionId) {
            startSectionTimer(currentSectionId);
        }
    }, [currentSectionId, startSectionTimer]);

    // Create Submission Effect
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

    // Set starter code when problem loads
    useEffect(() => {
        if (problem?.starterCode) {
            const langKey = language === 'cpp' ? 'c++' : language;
            const starterCode = problem.starterCode[langKey] || problem.starterCode[language];
            if (starterCode) {
                setCode(starterCode);
            }
        }
    }, [problem]); // Removed implicit dependency on other state

    // Removed fetchProblem function and effect

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        // Use problem's starter code if available
        if (problem?.starterCode) {
            const langKey = newLang === 'cpp' ? 'c++' : newLang;
            const starterCode = problem.starterCode[langKey] || problem.starterCode[newLang];
            setCode(starterCode || '');
        }
    };

    const handleRun = async () => {
        if (!problem?.id) return;

        setIsRunning(true);
        setActiveTab('result');
        setTestResults([]);
        setRunSummary(null);
        setSubmitResults(null);
        setExpandedResults(new Set());

        try {
            const langKey = language === 'cpp' ? 'c++' : language;
            const response = await codeService.runCode({
                problemId: problem.id,
                code: code,
                language: langKey,
                sectionProblemId: problem.sectionProblemId,
            });

            setTestResults(response.data.results || []);
            setRunSummary(response.data.summary || null);

            // Auto-expand first failed testcase
            const firstFailed = response.data.results?.findIndex(r => !r.passed);
            if (firstFailed !== undefined && firstFailed >= 0) {
                setExpandedResults(new Set([firstFailed]));
            }
        } catch (error: any) {
            console.error('Run code error:', error);
            setTestResults([{
                testcaseIndex: 0,
                passed: false,
                status: 'Error',
                statusCode: -1,
                errorType: 'internal',
                error: error.response?.data?.message || error.message || 'Failed to run code',
                input: '',
                expectedOutput: '',
                actualOutput: ''
            }]);
            setRunSummary({ total: 1, passed: 0, failed: 1 });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!problem?.id) return;

        setIsSubmitting(true);
        setActiveTab('result');
        setTestResults([]);
        setRunSummary(null);
        setSubmitResults(null);
        setExpandedResults(new Set());

        try {
            const langKey = language === 'cpp' ? 'c++' : language;
            const response = await codeService.submitCode({
                problemId: problem.id,
                code: code,
                language: langKey,
                assessmentId: assessmentId,
                sectionId: sections[currentSectionIndex]?.id,
                sectionProblemId: problem.sectionProblemId,
            });

            setSubmitResults(response.data);

            // Auto-expand first failed sample testcase
            const firstFailed = response.data.sampleResults?.findIndex(r => !r.passed);
            if (firstFailed !== undefined && firstFailed >= 0) {
                setExpandedResults(new Set([firstFailed]));
            }
        } catch (error: any) {
            console.error('Submit code error:', error);
            // Fallback for error - treat as a failed run
            setTestResults([{
                testcaseIndex: 0,
                passed: false,
                status: 'Error',
                statusCode: -1,
                errorType: 'internal',
                error: error.response?.data?.message || error.message || 'Failed to submit code',
                input: '',
                expectedOutput: '',
                actualOutput: ''
            }]);
            setRunSummary({ total: 1, passed: 0, failed: 1 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalSubmit = async (isAutoSubmit: boolean = false) => {
        if (submitting) return;

        setSubmitting(true);
        try {
            // Format answers for the bulk endpoint
            const formattedAnswers: any[] = [];

            Object.values(answers).forEach((data: any) => {
                if (data.type === 'mcq') {
                    formattedAnswers.push({
                        sectionId: data.sectionId,
                        questionId: data.questionId,
                        selectedAnswer: data.answer
                    });
                } else if (data.type === 'coding') {
                    formattedAnswers.push({
                        sectionId: data.sectionId,
                        problemId: data.problemId,
                        code: data.code,
                        language: data.language
                    });
                }
            });

            console.log('🚀 [SUBMIT] Sending final submission:', { answersCount: formattedAnswers.length });

            // Use the /submit endpoint directly - it handles submission creation internally
            await contestantService.submitAssessment(assessmentId, {
                answers: formattedAnswers,
                isAutoSubmit: false
            });

            // Clear local storage progress
            localStorage.removeItem(STORAGE_KEY);
            // Navigate to complete page
            router.push(`/contestant/assessment/${assessmentId}/complete`);
        } catch (err: any) {
            console.error('Failed to submit assessment:', err);
            alert(`Failed to submit: ${err.response?.data?.message || err.message}`);
            setSubmitting(false);
            setShowSubmitConfirm(false); // Close modal on error
        }
    };

    // Update local answers when code changes
    useEffect(() => {
        if (problem?.id && code && sections[sectionIndex]?.id) {
            setAnswers(prev => ({
                ...prev,
                [problem.id]: {
                    type: 'coding',
                    sectionId: sections[sectionIndex].id,
                    problemId: problem.id,
                    code,
                    language
                }
            }));
        }
    }, [code, language, problem?.id, sectionIndex, sections]);

    const handleSectionFinish = async (isAutoSubmit: boolean = false) => {
        console.log("🏁 [CodingPage] Finishing Section:", currentSectionIndex);

        setIsFinishingSection(true);

        // Call complete section API
        if (currentSectionId) {
            try {
                console.log(`📤 [CodingPage] Completing section ${currentSectionId}...`);
                await contestantService.completeSection(assessmentId, currentSectionId);
                console.log(`✅ [CodingPage] Section ${currentSectionId} completed successfully`);
            } catch (error) {
                console.error(`❌ [CodingPage] Failed to complete section ${currentSectionId}:`, error);
                // We continue anyway to allow the user to proceed
            }
        }

        // Lock current section
        const newLocked = new Set(lockedSectionIndices).add(currentSectionIndex);
        setLockedSectionIndices(newLocked);
        setShowSectionWarning(false);

        const nextIndex = currentSectionIndex + 1;

        // Save state to localStorage BEFORE navigation to ensure take page can read it
        const stateToSave = {
            currentSectionIndex: nextIndex,
            lockedSectionIndices: Array.from(newLocked),
            answers
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        console.log("💾 [CodingPage] Saved to localStorage:", { nextIndex, section: sections[nextIndex]?.title });

        // DON'T update currentSectionIndex here - we're navigating away
        // and it could trigger auto-save with wrong value
        // The next page will load the correct index from localStorage

        // Check against `sections` from React Query (already loaded)
        if (nextIndex < sections.length) {
            const nextSection = sections[nextIndex];
            console.log("➡️ [CodingPage] Navigating to:", { nextIndex, type: nextSection.type, title: nextSection.title });

            if (nextSection.type === 'coding') {
                // Stay on coding page but refresh/update params
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${nextIndex}`);
            } else if (nextSection.type === 'sql') {
                // Navigate to SQL page
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_sql');
                console.log("➡️ [CodingPage] Navigating to SQL Page:", nextSection.title);
                router.push(`/contestant/assessment/${assessmentId}/sql?section=${nextIndex}`);
            } else {
                // Go back to MCQ page - set navigation intent flag and include section parameter
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_mcq');
                console.log("🎯 [CodingPage] Set navigation intent flag for MCQ page");
                router.push(`/contestant/assessment/${assessmentId}/take?section=${nextIndex}`);
            }
        } else {
            // Finished
            await handleFinalSubmit(isAutoSubmit);
        }
    };

    // const goBack = () => router.push(`/contestant/assessment/${assessmentId}/take`);

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
                <div className="text-amber-500 mb-4 text-lg font-medium">No problem data available</div>
                <p className="text-sm text-gray-500 mb-4">Section index: {sectionIndex}, Question index: {questionIndex}</p>
                <button
                    onClick={() => router.push(`/contestant/assessment/${assessmentId}/take`)}
                    className="px-4 py-2 bg-[#0f62fe] text-white rounded-lg hover:bg-[#0353e9] transition-colors"
                >
                    Back to Assessment
                </button>
            </div>
        );
    }

    {/* Main Content */ }
    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bg} ${textPrimary}`}>

            {/* Header */}
            <header className={`h-14 shrink-0 px-6 flex items-center justify-between ${cardBg} border-b ${cardBorder}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Section Stepper - Modern Pill Design with Overflow */}
                    <div className="relative flex items-center gap-2 flex-1 min-w-0">
                        {/* Left Arrow - Show when sections > 5 and can scroll left */}
                        {sections.length > 5 && sectionScrollPosition > 0 && (
                            <button
                                onClick={() => {
                                    const container = document.getElementById('section-stepper-container');
                                    if (container) {
                                        container.scrollBy({ left: -200, behavior: 'smooth' });
                                    }
                                }}
                                className={`shrink-0 p-1.5 rounded-lg transition-all z-10 ${theme === 'dark'
                                    ? 'bg-[#262626] hover:bg-[#393939] border border-[#393939]'
                                    : 'bg-white hover:bg-[#f4f4f4] border border-[#e0e0e0]'
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}

                        {/* Scrollable Container */}
                        <div
                            id="section-stepper-container"
                            className={`flex items-center gap-0.5 p-1 rounded-xl overflow-x-auto scrollbar-hide ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f4f4f4]'
                                }`}
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}
                            onScroll={(e) => {
                                const target = e.target as HTMLDivElement;
                                setSectionScrollPosition(target.scrollLeft);
                            }}
                        >
                            {sections.map((sec, idx) => {
                                const isCurrent = idx === currentSectionIndex;
                                const isLocked = lockedSectionIndices.has(idx);

                                return (
                                    <div key={sec.id} className="flex items-center shrink-0">
                                        <div
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-default whitespace-nowrap
                                                ${isCurrent
                                                    ? 'bg-gradient-to-r from-[#0f62fe] to-[#6929c4] text-white shadow-md shadow-[#0f62fe]/20'
                                                    : isLocked
                                                        ? 'bg-gradient-to-r from-[#42be65] to-[#24a148] text-white'
                                                        : `${theme === 'dark' ? 'text-[#8d8d8d] hover:bg-[#393939]' : 'text-[#6f6f6f] hover:bg-[#e0e0e0]'}`
                                                }
                                            `}
                                        >
                                            {isLocked ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{idx + 1}</span>}
                                            <span className="truncate max-w-[120px]">{sec.title}</span>
                                        </div>
                                        {idx < sections.length - 1 && (
                                            <div className={`w-6 h-[2px] mx-0.5 rounded-full ${isLocked ? 'bg-[#42be65]' : theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Arrow - Show when sections > 5 and can scroll right */}
                        {sections.length > 5 && (
                            <button
                                onClick={() => {
                                    const container = document.getElementById('section-stepper-container');
                                    if (container) {
                                        container.scrollBy({ left: 200, behavior: 'smooth' });
                                    }
                                }}
                                className={`shrink-0 p-1.5 rounded-lg transition-all z-10 ${theme === 'dark'
                                    ? 'bg-[#262626] hover:bg-[#393939] border border-[#393939]'
                                    : 'bg-white hover:bg-[#f4f4f4] border border-[#e0e0e0]'
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {/* Timer */}
                    {currentSection?.id && (
                        <AssessmentTimer
                            assessmentId={assessmentId}
                            sectionId={currentSection.id}
                            onExpire={() => {
                                console.log("⌛ Section Timer Expired!");
                                handleSectionFinish(true);
                            }}
                            className="text-sm font-bold bg-[#262626] px-3 py-1.5 rounded-lg border border-[#393939]"
                            disableAutoSync={true}
                        />
                    )}
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-[#393939] bg-[#262626]' : 'hover:bg-[#e0e0e0] bg-[#f4f4f4]'}`}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    {/* Navigation Buttons */}
                    {currentSectionIndex < sections.length - 1 ? (
                        <button
                            onClick={() => setShowSectionWarning(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] via-[#4589ff] to-[#6929c4] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#0f62fe]/30 transition-all hover:shadow-[#0f62fe]/40 active:scale-[0.98]"
                        >
                            Next Section <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#42be65] to-[#24a148] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#42be65]/30 transition-all hover:shadow-[#42be65]/40 active:scale-[0.98]"
                        >
                            Submit Assessment <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Problem */}
                <div
                    className={`${cardBg} border-r ${cardBorder} overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-current/10 hover:[&::-webkit-scrollbar-thumb]:bg-current/20`}
                    style={{ width: `${leftWidth}%`, scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.2) transparent' }}
                >
                    <div className="p-6">
                        {/* Problem Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Code2 size={20} className="text-[#0f62fe]" />
                                    {problem?.title || 'Loading...'}
                                </h2>

                                {problems.length > 1 && (
                                    <div className={`flex items-center rounded-lg p-1 border shadow-sm ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#333]' : 'bg-white border-[#e0e0e0]'}`}>
                                        <button
                                            onClick={() => handleQuestionNavigate(questionIndex - 1)}
                                            disabled={questionIndex === 0}
                                            className={`p-1.5 rounded-md transition-colors ${questionIndex === 0
                                                ? 'opacity-30 cursor-not-allowed'
                                                : theme === 'dark' ? 'hover:bg-[#333] active:bg-[#444] text-white' : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                                                }`}
                                            title="Previous Question"
                                        >
                                            <ChevronLeft size={14} strokeWidth={2.5} />
                                        </button>
                                        <div className={`text-[11px] font-bold tracking-wider px-2.5 min-w-[50px] text-center select-none ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm`}>{questionIndex + 1}</span>
                                            <span className="mx-1 opacity-50">/</span>
                                            <span className="opacity-80">{problems.length}</span>
                                        </div>
                                        <button
                                            onClick={() => handleQuestionNavigate(questionIndex + 1)}
                                            disabled={questionIndex === problems.length - 1}
                                            className={`p-1.5 rounded-md transition-colors ${questionIndex === problems.length - 1
                                                ? 'opacity-30 cursor-not-allowed'
                                                : theme === 'dark' ? 'hover:bg-[#333] active:bg-[#444] text-white' : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                                                }`}
                                            title="Next Question"
                                        >
                                            <ChevronRight size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {problem?.difficulty && (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${problem.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                                    problem.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                                        'bg-red-500/15 text-red-500 border-red-500/30'
                                    }`}>
                                    {problem.difficulty === 'Easy' && <Zap size={12} />}
                                    {problem.difficulty === 'Medium' && <BarChart2 size={12} />}
                                    {problem.difficulty === 'Hard' && <AlertTriangle size={12} />}
                                    {problem.difficulty}
                                </span>
                            )}
                        </div>



                        {/* Problem Description - Rendered with Markdown */}
                        <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                            {problem?.description ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-current/20">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                                        p: ({ children }) => <p className="text-sm leading-relaxed my-3">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-outside text-sm my-3 space-y-1.5 ml-5 pl-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-outside text-sm my-3 space-y-1.5 ml-5 pl-1">{children}</ol>,
                                        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                                        code: ({ className, children, ...props }) => {
                                            const isInline = !className;
                                            if (isInline) {
                                                return <code className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${theme === 'dark' ? 'bg-[#393939] text-[#ff9f43]' : 'bg-[#f4f4f4] text-[#0072c3]'}`} {...props}>{children}</code>;
                                            }
                                            return <code className={`block p-4 rounded-lg text-xs font-mono overflow-x-auto ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f4f4f4] text-[#161616]'}`} {...props}>{children}</code>;
                                        },
                                        pre: ({ children }) => <pre className="my-3 rounded-lg overflow-hidden">{children}</pre>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        hr: () => <hr className={`my-5 ${theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]'}`} />,
                                    }}
                                >
                                    {problem.description}
                                </ReactMarkdown>
                            ) : (
                                <p className={`text-sm ${textSecondary}`}>No description available.</p>
                            )}


                        </div>
                    </div>
                </div>

                {/* Resizer */}
                <div
                    className={`w-1 cursor-col-resize ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#0f62fe]' : 'bg-[#e0e0e0] hover:bg-[#0f62fe]'} transition-colors`}
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

                {/* Right Panel - Editor + Console */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden" style={{ height: `${100 - consoleHeight}%` }}>
                        {/* Editor Header */}
                        <div className={`h-10 shrink-0 flex items-center px-4 border-b ${cardBorder} ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fafafa]'}`}>
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded border outline-none ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-[#f4f4f4]' : 'bg-white border-[#e0e0e0]'
                                    }`}
                            >
                                {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                            </select>
                        </div>

                        {/* Monaco */}
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                onChange={(v) => setCode(v || '')}
                                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                onMount={(editor, monaco) => {
                                    if (proctoringSettings?.disableCopyPaste) {
                                        editor.onKeyDown((e) => {
                                            // Block Ctrl+C (Copy), Ctrl+V (Paste), Ctrl+X (Cut)
                                            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
                                            const isCopy = isCtrlOrCmd && e.code === 'KeyC';
                                            const isPaste = isCtrlOrCmd && e.code === 'KeyV';
                                            const isCut = isCtrlOrCmd && e.code === 'KeyX';

                                            if (isCopy || isPaste || isCut) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        });
                                        // Also block context menu if set (redundant with options but good for safety)
                                    }
                                }}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 4,
                                    wordWrap: 'on',
                                    lineNumbers: 'on',
                                    contextmenu: !proctoringSettings?.blockRightClick,
                                }}
                            />
                        </div>
                    </div>

                    {/* Console Resizer */}
                    <div
                        className={`h-1 cursor-row-resize ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#0f62fe]' : 'bg-[#e0e0e0] hover:bg-[#0f62fe]'} transition-colors`}
                        onMouseDown={(e) => {
                            const startY = e.clientY;
                            const startHeight = consoleHeight;
                            const onMove = (e: MouseEvent) => {
                                const delta = startY - e.clientY;
                                const newHeight = Math.min(50, Math.max(20, startHeight + (delta / window.innerHeight) * 100));
                                setConsoleHeight(newHeight);
                            };
                            const onUp = () => {
                                document.removeEventListener('mousemove', onMove);
                                document.removeEventListener('mouseup', onUp);
                            };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                        }}
                    />

                    {/* Console */}
                    <div className={`${cardBg} flex flex-col`} style={{ height: `${consoleHeight}%` }}>
                        {/* Console Header */}
                        <div className={`h-10 shrink-0 flex items-center justify-between px-4 border-b ${cardBorder}`}>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setActiveTab('testcase')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'testcase' ? 'bg-[#8a3ffc] text-white' : textSecondary
                                        }`}
                                >
                                    <FileText className="w-3.5 h-3.5 inline mr-1" />Testcase
                                </button>
                                <button
                                    onClick={() => setActiveTab('result')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'result' ? 'bg-[#8a3ffc] text-white' : textSecondary
                                        }`}
                                >
                                    <Terminal className="w-3.5 h-3.5 inline mr-1" />Result
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning || isSubmitting}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${theme === 'dark'
                                        ? 'bg-[#262626] border-[#525252] hover:border-[#78a9ff] hover:bg-[#393939] text-[#f4f4f4]'
                                        : 'bg-white border-[#c6c6c6] hover:border-[#0f62fe] hover:bg-[#f4f4f4] text-[#161616]'
                                        }`}
                                >
                                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Run Code
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isRunning || isSubmitting}
                                    className="px-5 py-2 bg-gradient-to-r from-[#42be65] to-[#24a148] hover:from-[#3dab5a] hover:to-[#1e8e3e] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-[#42be65]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit
                                </button>
                            </div>
                        </div>

                        {/* Console Content */}
                        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-current/10 hover:[&::-webkit-scrollbar-thumb]:bg-current/20" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.2) transparent' }}>
                            {activeTab === 'testcase' && (
                                <div className="space-y-3">
                                    {/* Sample Test Cases from Problem */}
                                    {problem?.exampleTestcases && problem.exampleTestcases.length > 0 ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`text-xs font-semibold ${textSecondary}`}>
                                                    Sample Test Cases ({problem.exampleTestcases.length})
                                                </span>
                                            </div>
                                            {problem.exampleTestcases.map((tc: any, idx: number) => (
                                                <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]'}`}>
                                                    <div className={`px-3 py-1.5 text-[10px] font-bold flex items-center justify-between ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                                                        <span>Case {idx + 1}</span>
                                                        <button
                                                            className="text-[10px] text-[#8a3ffc] hover:underline"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tc.input);
                                                            }}
                                                        >
                                                            Copy Input
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 divide-x divide-current/10">
                                                        <div className="p-3">
                                                            <span className="text-[10px] font-bold text-emerald-500 block mb-1.5">Input:</span>
                                                            <pre className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f4f4f4]'}`}>{tc.input}</pre>
                                                        </div>
                                                        <div className="p-3">
                                                            <span className="text-[10px] font-bold text-purple-500 block mb-1.5">Expected Output:</span>
                                                            <pre className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f4f4f4]'}`}>{tc.output}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Custom Input */}
                                            <div className="mt-4">
                                                <span className={`text-xs font-semibold ${textSecondary} block mb-2`}>Custom Input:</span>
                                                <textarea
                                                    placeholder="Enter custom input to test..."
                                                    className={`w-full h-24 p-3 rounded-lg border resize-none text-sm font-mono ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939] placeholder-[#6f6f6f]' : 'bg-white border-[#e0e0e0]'}`}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className={`text-sm ${textSecondary}`}>No sample test cases available.</p>
                                            <textarea
                                                placeholder="Enter custom input..."
                                                className={`w-full h-32 mt-3 p-3 rounded-lg border resize-none text-sm font-mono ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939] placeholder-[#6f6f6f]' : 'bg-white border-[#e0e0e0]'}`}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'result' && (
                                <div className="animate-in fade-in duration-300">
                                    {/* SEPARATE SKELETONS - MATCHING USER IMAGE STYLE */}

                                    {/* 1. RUN CODE SKELETON */}
                                    {isRunning && !isSubmitting && (
                                        <div className="space-y-6">
                                            {/* Repeated Pattern: Small Header + Large Block */}
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="space-y-2">
                                                    {/* Small Header Bar (approx 20% width) */}
                                                    <div className={`h-4 w-24 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                                    {/* Large Content Block (Full width) */}
                                                    <div className={`h-16 w-full rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f4f4f4]'
                                                        }`} />
                                                </div>
                                            ))}

                                            <div className="flex items-center justify-center gap-2 text-[#a8a8a8] pt-4">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-sm font-medium">Running against sample cases...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. SUBMIT SKELETON */}
                                    {isSubmitting && (
                                        <div className="space-y-6">
                                            {/* Score Header Skeleton (Special for Submit) */}
                                            <div className="space-y-2">
                                                <div className={`h-4 w-32 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                                <div className={`h-40 w-full rounded-3xl animate-pulse ${theme === 'dark' ? 'bg-gradient-to-br from-[#262626] to-[#393939]' : 'bg-gradient-to-br from-[#f4f4f4] to-[#e0e0e0]'
                                                    }`} />
                                            </div>

                                            {/* Repeated Pattern for Results */}
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="space-y-2">
                                                    <div className={`h-4 w-24 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                                    <div className={`h-16 w-full rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f4f4f4]'
                                                        }`} />
                                                </div>
                                            ))}

                                            <div className="flex items-center justify-center gap-2 text-[#0f62fe] pt-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-sm font-medium">Evaluating full submission...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBMIT RESULTS (New UI) */}
                                    {!isRunning && !isSubmitting && submitResults && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                                            {/* 1. Score & Status Header */}
                                            <div className={`text-center p-6 rounded-3xl border border-dashed text-white shadow-xl relative overflow-hidden ${submitResults.score === 100
                                                ? 'bg-gradient-to-br from-[#198038] to-[#42be65] border-[#42be65]'
                                                : submitResults.score > 0
                                                    ? 'bg-gradient-to-br from-[#b28600] to-[#f1c21b] border-[#f1c21b]'
                                                    : 'bg-gradient-to-br from-[#da1e28] to-[#ff8389] border-[#fa4d56]'
                                                }`}>
                                                <div className="relative z-10">
                                                    <div className="text-6xl font-Inter mb-1">{submitResults.score}</div>
                                                    <div className="text-sm font-medium opacity-90 uppercase tracking-widest">Score / 100</div>
                                                </div>

                                                {/* Background decorative elements */}
                                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                                    {submitResults.score === 100 ? (
                                                        <Zap className="w-32 h-32" />
                                                    ) : submitResults.score > 0 ? (
                                                        <BarChart2 className="w-32 h-32" />
                                                    ) : (
                                                        <AlertTriangle className="w-32 h-32" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2. Progress Bar */}
                                            <div className={`p-4 rounded-2xl border ${cardBg} ${cardBorder}`}>
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-current opacity-70">
                                                    <span>Total Progress</span>
                                                    <span>{submitResults.summary.passed} / {submitResults.summary.total} Passed</span>
                                                </div>
                                                <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                                                    <div
                                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${submitResults.score === 100 ? 'bg-[#42be65]' :
                                                            submitResults.score > 50 ? 'bg-[#f1c21b]' : 'bg-[#fa4d56]'
                                                            }`}
                                                        style={{ width: `${(submitResults.summary.passed / submitResults.summary.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* 3. Sample Test Cases (Expandable) */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 opacity-80">
                                                    <Terminal className="w-4 h-4" /> Sample Test Cases ({submitResults.sampleSummary.passed}/{submitResults.sampleSummary.total})
                                                </h3>
                                                <div className="space-y-3">
                                                    {submitResults.sampleResults.map((result, i) => {
                                                        const isExpanded = expandedResults.has(i);
                                                        const statusColor = result.passed ? 'text-[#42be65]' : 'text-[#fa4d56]';
                                                        const borderColor = result.passed
                                                            ? (theme === 'dark' ? 'border-[#42be65]/30' : 'border-[#bcebd0]')
                                                            : (theme === 'dark' ? 'border-[#fa4d56]/30' : 'border-[#ffccd1]');
                                                        const bgHeader = result.passed
                                                            ? (theme === 'dark' ? 'bg-[#42be65]/10' : 'bg-[#defbe6]')
                                                            : (theme === 'dark' ? 'bg-[#fa4d56]/10' : 'bg-[#fff1f1]');

                                                        return (
                                                            <div key={i} className={`rounded-xl border overflow-hidden transition-all duration-200 ${borderColor}`}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newExpanded = new Set(expandedResults);
                                                                        if (newExpanded.has(i)) newExpanded.delete(i);
                                                                        else newExpanded.add(i);
                                                                        setExpandedResults(newExpanded);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between p-3.5 ${bgHeader} hover:opacity-90 transition-opacity`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {result.passed ? <CheckCircle className={`w-4 h-4 ${statusColor}`} /> : <XCircle className={`w-4 h-4 ${statusColor}`} />}
                                                                        <span className={`text-xs font-bold ${statusColor}`}>Sample #{result.testcaseIndex + 1}</span>
                                                                    </div>
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                                {isExpanded && (
                                                                    <div className={`p-4 space-y-4 border-t ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-white border-[#e0e0e0]'}`}>
                                                                        {/* Input/Output Details */}
                                                                        <div>
                                                                            <div className="flex items-center justify-between mb-1.5">
                                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Input</span>
                                                                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(result.input); }} className="text-[10px] flex items-center gap-1 hover:text-[#0f62fe] transition-colors"><Copy className="w-3 h-3" /> Copy</button>
                                                                            </div>
                                                                            <div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f4f4f4] text-[#161616]'}`}>{result.input}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 text-purple-500">Expected Output</span>
                                                                            <div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f4f4f4] text-[#161616]'}`}>{result.expectedOutput}</div>
                                                                        </div>
                                                                        <div>
                                                                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${result.passed ? 'text-[#42be65]' : 'text-[#fa4d56]'}`}>Your Output</span>
                                                                            <div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? (result.passed ? 'bg-[#42be65]/10 text-[#42be65]' : 'bg-[#fa4d56]/10 text-[#fa4d56]') : (result.passed ? 'bg-[#defbe6] text-[#198038]' : 'bg-[#fff1f1] text-[#da1e28]')}`}>{result.actualOutput || (result.runtimeError ? `Runtime Error: ${result.runtimeError}` : result.error || '(No output)')}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* 4. Hidden Test Cases (Icons Only) */}
                                            {submitResults.hiddenResults.length > 0 && (
                                                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-[#f4f4f4] border-[#e0e0e0]'}`}>
                                                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 opacity-80">
                                                        <Lock className="w-4 h-4" /> Hidden Test Cases ({submitResults.hiddenSummary.passed}/{submitResults.hiddenSummary.total})
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {submitResults.hiddenResults.map((result, i) => (
                                                            <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-transform hover:scale-110 ${result.passed
                                                                ? 'bg-[#42be65]/20 border-[#42be65] text-[#42be65]'
                                                                : 'bg-[#fa4d56]/20 border-[#fa4d56] text-[#fa4d56]'
                                                                }`} title={`Hidden Case #${result.testcaseIndex + 1}: ${result.passed ? 'Passed' : 'Failed'}`}>
                                                                {result.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* RUN RESULTS (Legacy List UI) */}
                                    {!isRunning && !isSubmitting && !submitResults && testResults.length > 0 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* (Same Run Code UI as before) */}
                                            {(() => {
                                                const hasError = testResults.some(r => r.statusCode === 6 || r.errorType === 'compile');
                                                const allPassed = testResults.every(r => r.passed);

                                                return (
                                                    <>
                                                        {/* Simple Run Summary */}
                                                        <div className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${hasError ? (theme === 'dark' ? 'bg-[#fa4d56]/10 border-[#fa4d56]/30 text-[#ff8389]' : 'bg-[#fff1f1] border-[#ffccd1] text-[#da1e28]') :
                                                            allPassed ? (theme === 'dark' ? 'bg-[#24a148]/10 border-[#24a148]/30 text-[#42be65]' : 'bg-[#defbe6] border-[#bcebd0] text-[#198038]') :
                                                                (theme === 'dark' ? 'bg-[#f1c21b]/10 border-[#f1c21b]/30 text-[#f1c21b]' : 'bg-[#fffcf0] border-[#fddc69] text-[#b28600]')
                                                            }`}>
                                                            <div className="flex items-center gap-3">
                                                                {hasError ? <AlertTriangle className="w-5 h-5" /> : allPassed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                                <span className="font-bold text-sm">
                                                                    {hasError ? 'Compilation Error' : allPassed ? 'All Sample Cases Passed' : 'Some Cases Failed'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Compilation Error Details */}
                                                        {hasError && (
                                                            <div className={`p-4 rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-[#fa4d56]/10 border-[#fa4d56]/30' : 'bg-[#fff1f1] border-[#ffccd1]'}`}>
                                                                <pre className={`text-xs font-mono p-3 rounded overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#ff8389]' : 'bg-white text-[#da1e28] border border-[#ffccd1]'}`}>
                                                                    {testResults.find(r => r.compileError)?.compileError || testResults[0].error || 'Unknown error'}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {/* Individual Sample Cases */}
                                                        {!hasError && (
                                                            <div className="space-y-3">
                                                                {testResults.map((result, i) => {
                                                                    const isExpanded = expandedResults.has(i);
                                                                    const statusColor = result.passed ? 'text-[#42be65]' : 'text-[#fa4d56]';
                                                                    const borderColor = result.passed
                                                                        ? (theme === 'dark' ? 'border-[#42be65]/30' : 'border-[#bcebd0]')
                                                                        : (theme === 'dark' ? 'border-[#fa4d56]/30' : 'border-[#ffccd1]');
                                                                    return (
                                                                        <div key={i} className={`rounded-xl border overflow-hidden transition-all duration-200 ${borderColor}`}>
                                                                            <button onClick={() => {
                                                                                const n = new Set(expandedResults);
                                                                                if (n.has(i)) n.delete(i); else n.add(i);
                                                                                setExpandedResults(n);
                                                                            }} className={`w-full flex items-center justify-between p-3.5 hover:opacity-90 ${theme === 'dark' ? 'bg-[#262626]' : 'bg-white'}`}>
                                                                                <div className="flex items-center gap-3">
                                                                                    {result.passed ? <CheckCircle className={`w-4 h-4 ${statusColor}`} /> : <XCircle className={`w-4 h-4 ${statusColor}`} />}
                                                                                    <span className={`text-xs font-bold ${statusColor}`}>Case {result.testcaseIndex + 1}</span>
                                                                                </div>
                                                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                            </button>
                                                                            {isExpanded && (
                                                                                <div className={`p-4 space-y-4 border-t ${theme === 'dark' ? 'bg-[#1e1e1e] border-[#393939]' : 'bg-[#f4f4f4] border-[#e0e0e0]'}`}>
                                                                                    <div>
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70">Input</span>
                                                                                        <div className={`p-2 rounded font-mono text-xs ${cardBg}`}>{result.input}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-purple-500">Expected</span>
                                                                                        <div className={`p-2 rounded font-mono text-xs ${cardBg}`}>{result.expectedOutput}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${statusColor}`}>Output</span>
                                                                                        <div className={`p-2 rounded font-mono text-xs ${cardBg}`}>{result.actualOutput}</div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {!isRunning && !isSubmitting && !submitResults && testResults.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-60">
                                            <Code2 className="w-12 h-12 mb-4 opacity-50" />
                                            <p className="text-sm font-medium">Ready to run code</p>
                                            <p className="text-xs mt-1 max-w-[200px]">Click "Run" to test with sample cases or "Submit" for full evaluation.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                        <div className="text-center mb-5">
                            <AlertTriangle className="w-12 h-12 text-[#f1c21b] mx-auto mb-3" />
                            <h2 className="text-lg font-bold mb-1">Submit Assessment?</h2>
                            <p className="text-xs text-gray-500 mb-4">
                                You are about to submit your assessment. This action cannot be undone.
                            </p>
                            <div className="flex flex-col gap-2 text-sm bg-black/5 p-3 rounded-lg dark:bg-white/5">
                                <div className="flex justify-between">
                                    <span>Total Sections:</span>
                                    <span className="font-bold">{sections.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Coding Problems:</span>
                                    <span className="font-bold">1</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSubmitConfirm(false)}
                                className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                Cancel
                            </button>
                            <button onClick={() => handleFinalSubmit(false)} disabled={submitting} className="flex-1 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Warning Modal */}
            {showSectionWarning && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                    <div className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                        <div className="text-center mb-5">
                            <AlertTriangle className="w-12 h-12 text-[#f1c21b] mx-auto mb-3" />
                            <h2 className="text-lg font-bold mb-2">Finish Section?</h2>
                            <p className={`text-sm ${textSecondary} mb-4`}>
                                You are about to move to the next section.
                                <br /><br />
                                <span className="text-red-500 font-bold">Warning:</span> You CANNOT return to this problem once you proceed.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSectionWarning(false)}
                                className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSectionFinish(false)}
                                disabled={submitting || isFinishingSection}
                                className="flex-1 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                            >
                                {submitting || isFinishingSection ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CodingPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#161616]"><Loader2 className="w-10 h-10 animate-spin text-[#0f62fe]" /></div>}>
            <CodingPageContent />
        </Suspense>
    );
}
