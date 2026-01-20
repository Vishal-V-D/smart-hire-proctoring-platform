'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
    Sun, Moon, Clock, Send, Sparkles, Target, Loader2,
    Flag, Lock, Layers, Bookmark, BookmarkCheck
} from 'lucide-react';

import AssessmentTimer from '@/components/contestant/AssessmentTimer';
import { contestantService, type AssessmentSection, type AssessmentQuestion } from '@/api/contestantService';
import { useAssessment } from '@/context/AssessmentContext';
import PseudoCodeDisplay from '@/components/contestant/PseudoCodeDisplay';

type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'current';

export default function TakeAssessmentPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const assessmentId = params.id as string;
    const queryClient = useQueryClient();

    // Get section from URL or default to 0
    const urlSectionIndex = parseInt(searchParams?.get('section') || '0');

    // Theme
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // === React Query: Fetch Initial Data ===

    // 1. Assessment Details
    const { data: assessmentData } = useQuery({
        queryKey: ['assessment', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getAssessment(assessmentId);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // 2. Sections with Error Handling
    const { data: sectionsData, isLoading: sectionsLoading, error: sectionsError } = useQuery({
        queryKey: ['sections', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getSections(assessmentId);
            return res.data;
        },
        staleTime: Infinity, // Sections structure unlikely to change during exam
        retry: 3, // Retry 3 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });

    const sections = sectionsData?.sections || ([] as AssessmentSection[]);

    // Assessment State - Use URL section as source of truth
    const [currentSectionIndex, setCurrentSectionIndex] = useState(urlSectionIndex);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showSectionWarning, setShowSectionWarning] = useState(false);
    const [lockedSectionIndices, setLockedSectionIndices] = useState<Set<number>>(new Set());
    const [erroredImages, setErroredImages] = useState<Set<string>>(new Set());
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [isStateLoaded, setIsStateLoaded] = useState(false);
    const [isNavigatingToNextSection, setIsNavigatingToNextSection] = useState(false);

    // Sync currentSectionIndex with URL when it changes
    useEffect(() => {
        setCurrentSectionIndex(urlSectionIndex);
        console.log("🔄 [TakePage] URL section changed:", urlSectionIndex);
    }, [urlSectionIndex]);

    // 3. Questions (Fetched per section) with Error Handling
    const currentSection = sections[currentSectionIndex];
    const currentSectionId = currentSection?.id;

    const { data: questionsRes, isLoading: questionsLoading, error: questionsError } = useQuery({
        queryKey: ['questions', assessmentId, currentSectionId],
        queryFn: async () => {
            if (!currentSectionId) return { questions: [], problems: [] };
            const res = await contestantService.getQuestions(assessmentId, currentSectionId);
            return res.data;
        },
        enabled: !!currentSectionId && currentSection?.type !== 'coding',
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
        retry: 3, // Retry 3 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });

    const questions: AssessmentQuestion[] = questionsRes?.questions || [];
    const codingProblems = questionsRes?.problems || [];

    // Loading State
    const loading = sectionsLoading || (!!currentSectionId && currentSection?.type !== 'coding' && questionsLoading);

    // Enhanced Prefetching: Prefetch Next Section AND Next+1 Section for smoother transitions
    useEffect(() => {
        if (sections.length > 0) {
            // Prefetch next section
            if (currentSectionIndex < sections.length - 1) {
                const nextSec = sections[currentSectionIndex + 1];
                if (nextSec?.id && nextSec.type !== 'coding') {
                    queryClient.prefetchQuery({
                        queryKey: ['questions', assessmentId, nextSec.id],
                        queryFn: async () => {
                            console.log('🔮 [Prefetch] Prefetching next section:', nextSec.title);
                            const res = await contestantService.getQuestions(assessmentId, nextSec.id);
                            return res.data;
                        },
                        staleTime: 5 * 60 * 1000,
                    });
                }
            }

            // Prefetch next+1 section for even smoother experience
            if (currentSectionIndex < sections.length - 2) {
                const nextNextSec = sections[currentSectionIndex + 2];
                if (nextNextSec?.id && nextNextSec.type !== 'coding') {
                    queryClient.prefetchQuery({
                        queryKey: ['questions', assessmentId, nextNextSec.id],
                        queryFn: async () => {
                            console.log('🔮 [Prefetch] Prefetching next+1 section:', nextNextSec.title);
                            const res = await contestantService.getQuestions(assessmentId, nextNextSec.id);
                            return res.data;
                        },
                        staleTime: 5 * 60 * 1000,
                    });
                }
            }
        }
    }, [currentSectionIndex, sections, assessmentId, queryClient]);

    // Timer State from Context (persists across navigation/reload)
    const { startSectionTimer } = useAssessment();

    // Persistence Key
    const STORAGE_KEY = `assessment_progress_${assessmentId}`;

    // Load state from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.currentSectionIndex !== undefined) setCurrentSectionIndex(parsed.currentSectionIndex);
                if (parsed.lockedSectionIndices) setLockedSectionIndices(new Set(parsed.lockedSectionIndices));
                if (parsed.answers) setAnswers(parsed.answers);
            } catch (e) {
                console.error("Failed to parse saved progress", e);
            }
        }



        setIsStateLoaded(true);
    }, [assessmentId]);

    // Save state to local storage whenever it changes
    useEffect(() => {
        if (loading || !isStateLoaded) return; // Don't save initial empty state
        const stateToSave = {
            currentSectionIndex,
            lockedSectionIndices: Array.from(lockedSectionIndices),
            answers
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [currentSectionIndex, lockedSectionIndices, loading, assessmentId, answers, isStateLoaded]);

    // Settings (Derived from Query Data)
    const proctoringSettings = assessmentData?.assessment?.proctoringSettings;
    const navigationSettings = assessmentData?.assessment?.navigationSettings || {
        allowPreviousNavigation: true,
        allowMarkForReview: true
    };

    // Carbon Theme Colors
    const bg = theme === 'dark' ? 'bg-[#161616]' : 'bg-[#f4f4f4]';
    const cardBg = theme === 'dark' ? 'bg-[#262626]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]';
    const textPrimary = theme === 'dark' ? 'text-[#f4f4f4]' : 'text-[#161616]';
    const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#6f6f6f]';

    // Theme (effect hooks moved below)
    useEffect(() => {
        const saved = localStorage.getItem('assessmentTheme') as 'light' | 'dark' | null;
        if (saved) setTheme(saved);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('assessmentTheme', theme);
    }, [theme]);

    // Check section type and redirect if needed
    useEffect(() => {
        // Wait for BOTH sections to load AND state to be restored
        if (sectionsLoading || !isStateLoaded) {
            console.log("⏳ [TakePage] Waiting for data:", { sectionsLoading, isStateLoaded });
            return;
        }

        // Wait for sections array to be populated
        if (sections.length === 0) {
            console.log("⏳ [TakePage] Sections not loaded yet");
            return;
        }



        console.log("🔍 [TakePage] Checking Section Type for Redirect:", {
            index: currentSectionIndex,
            totalSections: sections.length,
            section: sections[currentSectionIndex],
            isLocked: lockedSectionIndices.has(currentSectionIndex)
        });

        // CLAMP index to valid bounds
        if (currentSectionIndex >= sections.length) {
            console.warn("⚠️ [TakePage] Index out of bounds, clamping");
            setCurrentSectionIndex(sections.length - 1);
            return;
        }

        // Get current section
        const sec = sections[currentSectionIndex];
        if (!sec) {
            console.error("❌ [TakePage] Section not found at index:", currentSectionIndex);
            return;
        }

        // 🏁 Trigger Section Start on Backend and sync timer
        if (sec.id) {
            startSectionTimer(sec.id);
        }

        // ✅ If section is locked (completed), DON'T redirect - user should stay here
        if (lockedSectionIndices.has(currentSectionIndex)) {
            console.log("🔒 [TakePage] Section is locked, staying here");
            return;
        }



        // If current section is coding type, redirect to coding page
        if (sec.type === 'coding') {
            console.warn("⚠️ [TakePage] Redirecting to Coding Page:", sec.title);
            router.push(`/contestant/assessment/${assessmentId}/coding?section=${currentSectionIndex}`);
            return;
        }

        // Check for SQL section - by type, title, division, or presence of sqlQuestions
        const hasSqlQuestions = sec.sqlQuestions && sec.sqlQuestions.length > 0;
        const titleContainsSql = sec.title?.toLowerCase().includes('sql');
        const divisionIsSql = (sec as any).division?.toLowerCase() === 'sql';

        if (sec.type === 'sql' || hasSqlQuestions || titleContainsSql || divisionIsSql) {
            console.warn("⚠️ [TakePage] Redirecting to SQL Page:", sec.title, { type: sec.type, hasSqlQuestions, titleContainsSql, divisionIsSql });
            router.push(`/contestant/assessment/${assessmentId}/sql?section=${currentSectionIndex}`);
            return;
        }


        console.log("✅ [TakePage] Staying on MCQ page for section:", sec.title);
    }, [currentSectionIndex, sections, sectionsLoading, assessmentId, router, startSectionTimer, isStateLoaded, lockedSectionIndices]);

    // Create Submission ID (Side Effect) & Handle 403 Forbidden (Already Completed)
    useEffect(() => {
        if (assessmentId) {
            const { sessionToken } = contestantService.getSession();
            contestantService.getOrCreateSubmission(assessmentId, sessionToken || '')
                .then(subRes => {
                    if (subRes.data?.success && subRes.data?.submission) {
                        setSubmissionId(subRes.data.submission.id);

                        // Auto-Resume Logic: If IN_PROGRESS, ensure we are on the right section
                        const submission = subRes.data.submission;
                        if (submission.status === 'in_progress' && submission.currentSectionId) {
                            // Find index of this section
                            const sectionIndex = sections.findIndex(s => s.id === submission.currentSectionId);
                            if (sectionIndex !== -1 && sectionIndex !== currentSectionIndex) {
                                console.log("🔄 [TakePage] Auto-Resuming to active section:", sectionIndex);
                                setCurrentSectionIndex(sectionIndex);
                            }
                        }
                    }
                })
                .catch((err: any) => {
                    console.error("❌ [TakePage] Submission Check Failed:", err);
                    if (err.response && err.response.status === 403) {
                        // 🚀 Redirect user immediately if already completed
                        console.warn("🚫 Assessment already completed. Redirecting...");
                        router.push('/contestant/assessment/terminated?reason=completed');
                    }
                });
        }
    }, [assessmentId, sections, currentSectionIndex]); // Added dependencies to allowing resume logic to work if sections loaded


    // Preload Section Images
    useEffect(() => {
        if (questions.length > 0) {
            questions.forEach(q => {
                if (q.image && q.image.trim() !== '' && q.image !== 'null' && q.image !== 'undefined') {
                    const img = new Image();
                    img.src = q.image;
                    img.onload = () => setLoadedImages(prev => new Set(prev).add(q.id));
                    img.onerror = () => setErroredImages(prev => new Set(prev).add(q.id));
                }
            });
        }
    }, [questions]);

    // Derived Current Items
    // const currentSection = sections[currentSectionIndex]; // Moving definition up
    const currentQuestion = questions[currentQuestionIndex];
    const currentProblem = codingProblems[currentQuestionIndex];

    const handleAnswer = (answer: any) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: {
                type: 'mcq',
                sectionId: currentSection?.id,
                questionId: currentQuestion.id,
                answer
            }
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (currentSectionIndex < sections.length - 1) {
            // End of section, show warning
            setIsNavigatingToNextSection(false); // Reset before showing modal
            setShowSectionWarning(true);
        }
    };

    const handleConfirmSectionFinish = () => {
        console.log("🏁 [TakePage] Finishing Section:", currentSectionIndex);

        const nextIndex = currentSectionIndex + 1;

        // Lock current section
        const newLocked = new Set(lockedSectionIndices).add(currentSectionIndex);
        setLockedSectionIndices(newLocked);
        setShowSectionWarning(false);

        // CRITICAL: Reset question index to 0 for the next section
        setCurrentQuestionIndex(0);
        setIsNavigatingToNextSection(true);

        // Check bounds
        if (nextIndex < sections.length) {
            const nextSection = sections[nextIndex];

            // Save state immediately before potential navigation
            const stateToSave = {
                currentSectionIndex: nextIndex,
                lockedSectionIndices: Array.from(newLocked),
                answers
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log("💾 [TakePage] Saved to localStorage:", { nextIndex, section: nextSection.title });

            if (nextSection.type === 'coding') {
                // Navigate to Coding Page with section parameter
                setIsNavigating(true);
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_coding');
                console.log("➡️ [TakePage] Navigating to Coding Page:", nextSection.title);
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${nextIndex}`);
                return;
            }

            // Check for SQL section - by type, title, or division
            const nextTitleContainsSql = nextSection.title?.toLowerCase().includes('sql');
            const nextDivisionIsSql = (nextSection as any).division?.toLowerCase() === 'sql';

            if (nextSection.type === 'sql' || nextTitleContainsSql || nextDivisionIsSql) {
                // Navigate to SQL Page with section parameter
                setIsNavigating(true);
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_sql');
                console.log("➡️ [TakePage] Navigating to SQL Page:", nextSection.title);
                router.push(`/contestant/assessment/${assessmentId}/sql?section=${nextIndex}`);
                return;
            }

            // Stay on MCQ Page, navigate to next section using URL
            setIsNavigating(true);
            console.log("📄 [TakePage] Moving to next MCQ section via URL:", nextSection.title);
            router.push(`/contestant/assessment/${assessmentId}/take?section=${nextIndex}`);
        } else {
            // Finished Assessment check
            setShowSubmitConfirm(true);
        }
    };


    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
        // Disabled returning to previous section
    };

    const handleFlag = () => {
        if (!currentQuestion) return;
        setFlaggedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.has(currentQuestion.id) ? newSet.delete(currentQuestion.id) : newSet.add(currentQuestion.id);
            return newSet;
        });
    };

    const [submitting, setSubmitting] = useState(false);
    const submittingRef = React.useRef(false);

    const handleSubmit = async () => {
        if (submittingRef.current) return;

        submittingRef.current = true;
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
        } finally {
            setSubmitting(false);
        }
    };

    const goToQuestion = (qIndex: number) => {
        if (!navigationSettings.allowPreviousNavigation && qIndex < currentQuestionIndex) return;
        setCurrentQuestionIndex(qIndex);
    };

    const getQuestionStatus = (questionId: string, qIndex: number): QuestionStatus => {
        if (qIndex === currentQuestionIndex) return 'current';
        if (flaggedQuestions.has(questionId)) return 'flagged';
        if (answers[questionId]) return 'answered';
        return 'unanswered';
    };

    // Count only answers for current section's questions
    const currentSectionQuestionIds = new Set(questions.map(q => q.id));
    const answeredCount = Object.keys(answers).filter(id => currentSectionQuestionIds.has(id)).length;
    const answeredCountInSection = answeredCount; // Alias for modal display
    const flaggedCount = Array.from(flaggedQuestions).filter(id => currentSectionQuestionIds.has(id)).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    const sectionDuration = currentSection?.duration || 60;

    useEffect(() => {
        // Reset navigation loaders when section index changes
        setIsNavigating(false);
        setIsNavigatingToNextSection(false); // Reset this too!

        // Redirection handled in handleConfirmSectionFinish or initial load
        // But if we load into a coding section from storage, we should redirect.
        if (!loading && sections.length > 0 && currentSectionIndex < sections.length) {
            const current = sections[currentSectionIndex];
            if (current.type === 'coding') {
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${currentSectionIndex}`);
            }
        }
    }, [currentSectionIndex, sections, loading, assessmentId]);

    const [isNavigating, setIsNavigating] = useState(false); // Helper for section transition loader

    // Error State Display
    if (sectionsError || questionsError) {
        return (
            <div className={`h-screen flex items-center justify-center ${bg}`}>
                <div className="max-w-md p-8 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <h2 className="text-xl font-bold text-red-500">Failed to Load Assessment</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        {sectionsError ? 'Could not load assessment sections. ' : 'Could not load questions. '}
                        Please check your internet connection and try again.
                    </p>
                    <button
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['sections', assessmentId] });
                            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
                            window.location.reload();
                        }}
                        className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading || !currentSection) {
        return (
            <div className={`h-screen flex items-center justify-center ${bg}`}>
                <div className="w-10 h-10 border-3 border-[#0f62fe] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bg} ${textPrimary} relative`}>
            {/* Enhanced Navigation Loader Overlay with Section Type Info */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[99999] bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="relative"
                        >
                            <div className="w-16 h-16 border-4 border-[#0f62fe]/30 border-t-[#0f62fe] rounded-full animate-spin" />
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-[#0f62fe]/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                        </motion.div>
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <span className="text-white font-bold text-base bg-black/60 px-5 py-2 rounded-full backdrop-blur-md shadow-lg">
                                Loading Section...
                            </span>
                            {isNavigatingToNextSection && currentSectionIndex < sections.length - 1 && (
                                <span className="text-white/80 text-sm bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                    {sections[currentSectionIndex + 1]?.title}
                                </span>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Standard Proctoring Overlay */}

            {/* Modern Header */}
            <header className={`h-14 shrink-0 px-5 flex items-center justify-between border-b backdrop-blur-xl ${theme === 'dark' ? 'bg-[#262626]/90 border-[#393939]' : 'bg-white/90 border-[#e0e0e0]'}`}>
                <div className="flex items-center gap-4">
                    {/* Header Logo or Info can go here if needed, cleaning up redundant sections */}
                </div>

                {/* Center Stats */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#42be65]/10 border border-[#42be65]/20">
                        <CheckCircle className="w-3.5 h-3.5 text-[#42be65]" />
                        <span className="text-xs font-bold text-[#42be65]">{answeredCount}/{totalQuestions}</span>
                        <span className={`text-[10px] ${textSecondary}`}>Answered</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f1c21b]/10 border border-[#f1c21b]/20">
                        <Bookmark className="w-3.5 h-3.5 text-[#f1c21b]" />
                        <span className="text-xs font-bold text-[#f1c21b]">{flaggedCount}</span>
                        <span className={`text-[10px] ${textSecondary}`}>Review</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fa4d56]/10 border border-[#fa4d56]/20">
                        <Target className="w-3.5 h-3.5 text-[#fa4d56]" />
                        <span className={`text-xs font-bold text-[#fa4d56]`}>{unansweredCount}</span>
                        <span className={`text-[10px] ${textSecondary}`}>Unanswered</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-mono text-sm font-bold">
                        {currentSection?.id && (
                            <AssessmentTimer
                                assessmentId={assessmentId}
                                sectionId={currentSection.id}
                                onExpire={() => setShowSubmitConfirm(true)}
                                variant="pill"
                                className="transform scale-105"
                            />
                        )}
                    </div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-[#393939]' : 'hover:bg-[#e0e0e0]'}`}>
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                </div>
            </header>

            {/* Main Content - KEEP ALIVE OPTIMIZATION */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Modern Navigator */}
                <aside className={`w-80 shrink-0 flex flex-col h-full border-r ${theme === 'dark' ? 'bg-[#262626]/80 border-[#393939]' : 'bg-white/80 border-[#e0e0e0]'} z-20 transition-colors duration-300 overflow-hidden`}>

                    {/* Combined List (Sections + Current Palette) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: theme === 'dark' ? '#393939 transparent' : '#e0e0e0 transparent' }}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Assessment Sections</h3>

                        {sections.map((sec, idx) => {
                            const isCurrent = idx === currentSectionIndex;
                            const isLocked = lockedSectionIndices.has(idx);

                            return (
                                <div key={sec.id} className={`rounded-xl border transition-all duration-300 overflow-hidden ${isCurrent
                                    ? `${theme === 'dark' ? 'bg-[#262626] border-[#0f62fe]' : 'bg-white border-[#0f62fe]'} shadow-lg ring-1 ring-[#0f62fe]/20`
                                    : `${theme === 'dark' ? 'border-[#393939] hover:bg-[#393939]/50' : 'border-[#e0e0e0] hover:bg-[#f4f4f4]'}`
                                    }`}>
                                    {/* Section Header */}
                                    <div
                                        className={`flex items-center justify-between px-4 py-3.5 select-none ${isCurrent ? 'bg-gradient-to-r from-[#0f62fe]/5 to-transparent' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isLocked ? (
                                                <div className="w-7 h-7 rounded-lg bg-[#42be65]/10 flex items-center justify-center">
                                                    <Lock className="w-3.5 h-3.5 text-[#42be65]" />
                                                </div>
                                            ) : (
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isCurrent
                                                    ? 'bg-[#0f62fe] text-white'
                                                    : `${theme === 'dark' ? 'bg-[#393939] text-[#a8a8a8]' : 'bg-[#e0e0e0] text-[#6f6f6f]'}`
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                    <span className={`text-sm font-bold truncate ${isCurrent ? (theme === 'dark' ? 'text-white' : 'text-[#161616]') : textSecondary
                                                        }`}>
                                                        {sec.title}
                                                    </span>
                                                    {isCurrent && (
                                                        <AssessmentTimer
                                                            assessmentId={assessmentId}
                                                            sectionId={sec.id}
                                                            variant="minimal"
                                                            className="text-xs shrink-0 bg-[#0f62fe]/10 px-1.5 py-0.5 rounded text-[#0f62fe]"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Question Palette (Only for Current Section) */}
                                    {isCurrent && !questionsLoading && (
                                        <div className={`px-3 pb-4 pt-1 animate-in slide-in-from-top-2`}>
                                            <div className={`h-px w-full mb-4 ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />

                                            {/* Progress Bar (Integrated) */}
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <span className={`text-[10px] font-bold ${textSecondary}`}>Section Progress</span>
                                                <span className={`text-[10px] font-mono ${textSecondary}`}>{answeredCount}/{totalQuestions}</span>
                                            </div>
                                            <div className={`h-1.5 rounded-full overflow-hidden mb-4 ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#f4f4f4]'}`}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="h-full bg-[#0f62fe]"
                                                />
                                            </div>

                                            {/* Grid */}
                                            <div className="grid grid-cols-5 gap-2">
                                                {questions.map((q, qIndex) => {
                                                    const status = getQuestionStatus(q.id, qIndex);
                                                    const isDisabled = !navigationSettings.allowPreviousNavigation && qIndex < currentQuestionIndex;

                                                    return (
                                                        <motion.button
                                                            key={q.id}
                                                            whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                                                            whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                                                            onClick={() => goToQuestion(qIndex)}
                                                            disabled={isDisabled}
                                                            className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${status === 'current' ? 'bg-[#0f62fe] text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400' :
                                                                status === 'answered' ? 'bg-[#42be65]/10 text-[#42be65] border border-[#42be65]/30' :
                                                                    status === 'flagged' ? 'bg-[#f1c21b]/10 text-[#f1c21b] border border-[#f1c21b]/30' :
                                                                        `${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c] text-[#a8a8a8]' : 'bg-[#f4f4f4] hover:bg-[#e0e0e0] text-[#6f6f6f]'}`
                                                                } ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                        >
                                                            {qIndex + 1}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className={`p-4 border-t ${theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]'} shrink-0 bg-inherit z-10`}>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#0f62fe]" /><span className={textSecondary}>Current</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#42be65]/20 border border-[#42be65]/40" /><span className={textSecondary}>Answered</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#f1c21b]/20 border border-[#f1c21b]/40" /><span className={textSecondary}>Marked</span></div>
                            <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} /><span className={textSecondary}>Not Visited</span></div>
                        </div>
                    </div>
                </aside>

                {/* Question Content - Refactored to map all questions but hide non-active ones */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <main className="flex-1 flex flex-col min-h-0 p-4 relative overflow-hidden">
                        {questions.map((question, qIndex) => {
                            const isActive = qIndex === currentQuestionIndex;
                            // Optimization: Only render close questions or just rely on CSS hiding?
                            // For input preservation, we must keep them in DOM.

                            return (
                                <div
                                    key={question.id}
                                    className={`absolute inset-4 flex flex-col ${cardBg} rounded-xl border ${cardBorder} overflow-hidden transition-opacity duration-300 ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                                        }`}
                                    style={{ visibility: isActive ? 'visible' : 'hidden' }}
                                >
                                    {/* Question Header */}
                                    <div className={`px-5 py-3 border-b ${cardBorder} flex items-center justify-between shrink-0`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${theme === 'dark' ? 'bg-[#393939] text-white' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                                                {qIndex + 1}
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${theme === 'dark' ? 'bg-[#393939] text-[#f4f4f4]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                                                {question.type?.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className={`text-[10px] ${textSecondary}`}>{question.marks} marks</span>
                                        </div>
                                        {navigationSettings.allowMarkForReview && (
                                            <button onClick={handleFlag} className={`p-2 rounded-lg transition-all ${flaggedQuestions.has(question.id) ? 'bg-[#f1c21b]/20 text-[#f1c21b]' : `hover:bg-[#393939] ${textSecondary}`
                                                }`}>
                                                <Flag className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Question Body */}
                                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#525252] hover:scrollbar-thumb-[#6f6f6f]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#525252 transparent' }}>
                                        <div className="text-base font-medium mb-5 leading-relaxed space-y-4">
                                            {(() => {
                                                const qAny = question as any;

                                                // DEBUG: Print raw question object from backend
                                                console.log('🔍 QUESTION FROM BACKEND:', question);

                                                // 1. Explicit Pseudocode field (New standard) - HIGHEST PRIORITY
                                                if (qAny.pseudocode) {
                                                    return (
                                                        <>
                                                            <div className="mb-3 whitespace-pre-wrap font-medium">{question.text}</div>
                                                            <PseudoCodeDisplay code={qAny.pseudocode} className="max-w-2xl max-h-[400px] overflow-auto border-opacity-50 shadow-sm" />
                                                        </>
                                                    );
                                                }

                                                // 2. Check if question type is pseudo_code
                                                if (question.type === 'pseudo_code') {
                                                    // Try to intelligently split prompt from code
                                                    const lines = question.text.split('\n');
                                                    let promptText = '';
                                                    let codeText = '';
                                                    let foundCodeStart = false;

                                                    // Look for code indicators
                                                    for (let i = 0; i < lines.length; i++) {
                                                        const line = lines[i];
                                                        // Check if this line starts code (contains assignment, keywords, etc)
                                                        if (!foundCodeStart && (
                                                            line.match(/^\s*(int|float|string|var|let|const|def|function|for|while|if|x\s*=|y\s*=|z\s*=)/i) ||
                                                            line.match(/^\s*\w+\s*=/) ||
                                                            line.trim().match(/^(BEGIN|START|ALGORITHM)/i)
                                                        )) {
                                                            foundCodeStart = true;
                                                            codeText = lines.slice(i).join('\n');
                                                            break;
                                                        } else if (!foundCodeStart) {
                                                            promptText += (promptText ? '\n' : '') + line;
                                                        }
                                                    }

                                                    // If we found a split, render separately
                                                    if (foundCodeStart && promptText && codeText) {
                                                        return (
                                                            <>
                                                                <div className="mb-4 whitespace-pre-wrap font-medium">{promptText.trim()}</div>
                                                                <PseudoCodeDisplay code={codeText.trim()} className="max-w-4xl max-h-[500px] overflow-auto border-opacity-50 shadow-sm" />
                                                            </>
                                                        );
                                                    }

                                                    // If no backticks and no split found, treat entire text as code
                                                    if (!question.text.includes('```')) {
                                                        return <PseudoCodeDisplay code={question.text} className="max-w-4xl max-h-[500px] overflow-auto border-opacity-50 shadow-sm" />;
                                                    }
                                                }

                                                // 3. Check if section title suggests pseudo code
                                                const isPseudoSection = currentSection?.title?.toLowerCase().includes('pseudo');
                                                const hasCodeBlock = question.text.includes('```');

                                                // If in pseudo section but no backticks, try to split prompt from code
                                                if (isPseudoSection && !hasCodeBlock) {
                                                    const lines = question.text.split('\n');
                                                    let promptText = '';
                                                    let codeText = '';
                                                    let foundCodeStart = false;

                                                    for (let i = 0; i < lines.length; i++) {
                                                        const line = lines[i];
                                                        if (!foundCodeStart && (
                                                            line.match(/^\s*(int|float|string|var|let|const|def|function|for|while|if|x\s*=|y\s*=|z\s*=)/i) ||
                                                            line.match(/^\s*\w+\s*=/) ||
                                                            line.trim().match(/^(BEGIN|START|ALGORITHM)/i)
                                                        )) {
                                                            foundCodeStart = true;
                                                            codeText = lines.slice(i).join('\n');
                                                            break;
                                                        } else if (!foundCodeStart) {
                                                            promptText += (promptText ? '\n' : '') + line;
                                                        }
                                                    }

                                                    if (foundCodeStart && promptText && codeText) {
                                                        return (
                                                            <>
                                                                <div className="mb-4 whitespace-pre-wrap font-medium">{promptText.trim()}</div>
                                                                <PseudoCodeDisplay code={codeText.trim()} className="max-w-4xl max-h-[500px] overflow-auto border-opacity-50 shadow-sm" />
                                                            </>
                                                        );
                                                    }

                                                    return <PseudoCodeDisplay code={question.text} className="max-w-4xl max-h-[500px] overflow-auto border-opacity-50 shadow-sm" />;
                                                }

                                                // 4. Fallback: Parse Markdown Backticks (Standard)
                                                return question.text.split(/(```[\s\S]*?```)/g).map((part, pIdx) => {
                                                    if (part.startsWith('```')) {
                                                        const codeContent = part.replace(/^```\w*\n?|```$/g, '');
                                                        return <PseudoCodeDisplay key={pIdx} code={codeContent} className="max-w-4xl max-h-[500px] overflow-auto border-opacity-50 shadow-sm" />;
                                                    }
                                                    return <span key={pIdx} className="whitespace-pre-wrap">{part}</span>;
                                                });
                                            })()}
                                        </div>

                                        {question.image &&
                                            question.image.trim() !== '' &&
                                            question.image !== 'null' &&
                                            question.image !== 'undefined' &&
                                            !erroredImages.has(question.id) && (
                                                <div className="relative mb-5 inline-block group">
                                                    {/* Loading Skeleton */}
                                                    {!loadedImages.has(question.id) && (
                                                        <div className="w-64 h-40 rounded-lg animate-pulse bg-current/10 flex items-center justify-center">
                                                            <Sparkles className="w-5 h-5 opacity-20" />
                                                        </div>
                                                    )}

                                                    <img
                                                        key={question.id}
                                                        src={question.image}
                                                        alt="Question Visual"
                                                        className={`max-w-sm max-h-48 rounded-lg border border-inherit object-contain bg-black/5 transition-all duration-500 shadow-sm group-hover:shadow-md ${loadedImages.has(question.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                                                            }`}
                                                        onLoad={() => setLoadedImages(prev => new Set(prev).add(question.id))}
                                                        onError={() => setErroredImages(prev => new Set(prev).add(question.id))}
                                                    />
                                                </div>
                                            )}

                                        {/* Single Choice */}
                                        {question.type === 'single_choice' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, i) => (
                                                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id]?.answer === option ? 'border-[#42be65] bg-[#42be65]/10' : `${cardBorder} hover:border-[#42be65]/50`
                                                        }`}>
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers[question.id]?.answer === option ? 'border-[#42be65] bg-[#42be65]' : cardBorder
                                                            }`}>
                                                            {answers[question.id]?.answer === option && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-sm font-medium flex-1">{option}</span>
                                                        <input type="radio" name={question.id} value={option} checked={answers[question.id]?.answer === option}
                                                            onChange={e => handleAnswer(e.target.value)} className="sr-only" />
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Multiple Choice */}
                                        {question.type === 'multiple_choice' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, i) => (
                                                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id]?.answer?.includes(option) ? 'border-[#8a3ffc] bg-[#8a3ffc]/10' : `${cardBorder} hover:border-[#8a3ffc]/50`
                                                        }`}>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${answers[question.id]?.answer?.includes(option) ? 'border-[#8a3ffc] bg-[#8a3ffc]' : cardBorder
                                                            }`}>
                                                            {answers[question.id]?.answer?.includes(option) && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                                        </div>
                                                        <span className="text-sm font-medium flex-1">{option}</span>
                                                        <input type="checkbox" value={option} checked={answers[question.id]?.answer?.includes(option) || false}
                                                            onChange={e => {
                                                                const current = answers[question.id]?.answer || [];
                                                                handleAnswer(e.target.checked ? [...current, option] : current.filter((a: string) => a !== option));
                                                            }} className="sr-only" />
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Text */}
                                        {question.type === 'text' && (
                                            <textarea
                                                value={answers[question.id]?.answer || ''}
                                                onChange={e => handleAnswer(e.target.value)}
                                                placeholder="Type answer..."
                                                className={`w-full h-32 p-3 rounded-lg border-2 resize-none outline-none ${cardBg} ${cardBorder} focus:border-[#0f62fe] text-sm`}
                                            />
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    <div className={`px-5 py-4 border-t ${cardBorder} flex items-center justify-between shrink-0`}>
                                        {/* Previous - Conditional */}
                                        {navigationSettings.allowPreviousNavigation ? (
                                            <button onClick={handlePrevious} disabled={currentSectionIndex === 0 && qIndex === 0}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 transition-all ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                                <ChevronLeft className="w-4 h-4" />Previous
                                            </button>
                                        ) : <div />}

                                        {/* Mark for Review - Conditional */}
                                        {navigationSettings.allowMarkForReview && (
                                            <button onClick={handleFlag}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${flaggedQuestions.has(question.id)
                                                    ? 'bg-[#f1c21b]/20 text-[#f1c21b] border-2 border-[#f1c21b]/40'
                                                    : `${theme === 'dark' ? 'bg-[#393939] hover:bg-[#f1c21b]/20 hover:text-[#f1c21b]' : 'bg-[#e0e0e0] hover:bg-[#f1c21b]/20 hover:text-[#f1c21b]'}`
                                                    }`}>
                                                {flaggedQuestions.has(question.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                                {flaggedQuestions.has(question.id) ? 'Marked' : 'Mark for Review'}
                                            </button>
                                        )}

                                        {/* Next - Hide if last question in section */}
                                        {qIndex < questions.length - 1 ? (
                                            <button onClick={handleNext}
                                                className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#6929c4] hover:opacity-90 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#0f62fe]/25 transition-all">
                                                Next<ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : <div />}
                                    </div>
                                </div>
                            );
                        })}
                    </main>

                    {/* New Footer Panel */}
                    <footer className={`shrink-0 px-6 py-4 border-t ${cardBorder} flex items-center justify-end z-20 ${cardBg}`}>
                        {currentSectionIndex < sections.length - 1 ? (
                            <button
                                onClick={() => {
                                    setIsNavigatingToNextSection(false); // Reset before showing modal
                                    setShowSectionWarning(true);
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#4589ff] hover:opacity-90 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#0f62fe]/25 transition-all"
                            >
                                Next Section <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#42be65] to-[#24a148] hover:opacity-90 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#42be65]/25 transition-all"
                            >
                                Submit Assessment <Send className="w-4 h-4" />
                            </button>
                        )}
                    </footer>
                </div>
            </div>

            {/* Submit Modal */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                            <div className="text-center mb-5">
                                <AlertTriangle className="w-12 h-12 text-[#f1c21b] mx-auto mb-3" />
                                <h2 className="text-lg font-bold mb-1">Submit Assessment?</h2>
                                <p className={`text-sm ${textSecondary}`}>
                                    Answered <b className="text-[#0f62fe]">{answeredCount}</b> of <b>{totalQuestions}</b>
                                </p>
                                {flaggedCount > 0 && <p className="text-[#f1c21b] text-sm">{flaggedCount} for review</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowSubmitConfirm(false)}
                                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                    Cancel
                                </button>
                                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Warning Modal */}
            <AnimatePresence>
                {showSectionWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                            <div className="text-center mb-5">
                                <AlertTriangle className="w-12 h-12 text-[#f1c21b] mx-auto mb-3" />
                                <h2 className="text-lg font-bold mb-2">Finish Section?</h2>
                                <p className={`text-sm ${textSecondary} mb-2`}>
                                    You have completed <b className="text-[#0f62fe]">{answeredCountInSection}</b> of <b>{questions.length}</b> questions in this section.
                                </p>
                                <p className={`text-sm ${textSecondary} mb-4`}>
                                    <span className="text-red-500 font-bold">Warning:</span> You CANNOT return to this section once you proceed.
                                </p>
                                <div className="text-xs bg-[#f1c21b]/10 text-[#f1c21b] p-3 rounded-lg border border-[#f1c21b]/20">
                                    Please ensure you have reviewed all answers in <b>{currentSection?.title}</b>.
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowSectionWarning(false)}
                                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                    Cancel
                                </button>
                                <button onClick={handleConfirmSectionFinish} disabled={isNavigatingToNextSection} className="flex-1 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                    {isNavigatingToNextSection ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Yes, Proceed'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
