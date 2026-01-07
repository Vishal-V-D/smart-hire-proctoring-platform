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

    // 2. Sections
    const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
        queryKey: ['sections', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getSections(assessmentId);
            return res.data;
        },
        staleTime: Infinity, // Sections structure unlikely to change during exam
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

    // Sync currentSectionIndex with URL when it changes
    useEffect(() => {
        setCurrentSectionIndex(urlSectionIndex);
        console.log("🔄 [TakePage] URL section changed:", urlSectionIndex);
    }, [urlSectionIndex]);

    // 3. Questions (Fetched per section)
    const currentSection = sections[currentSectionIndex];
    const currentSectionId = currentSection?.id;

    const { data: questionsRes, isLoading: questionsLoading } = useQuery({
        queryKey: ['questions', assessmentId, currentSectionId],
        queryFn: async () => {
            if (!currentSectionId) return { questions: [], problems: [] };
            const res = await contestantService.getQuestions(assessmentId, currentSectionId);
            return res.data;
        },
        enabled: !!currentSectionId && currentSection?.type !== 'coding',
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });

    const questions: AssessmentQuestion[] = questionsRes?.questions || [];
    const codingProblems = questionsRes?.problems || [];

    // Loading State
    const loading = sectionsLoading || (!!currentSectionId && currentSection?.type !== 'coding' && questionsLoading);

    // Prefetching Next Section
    useEffect(() => {
        if (sections.length > 0 && currentSectionIndex < sections.length - 1) {
            const nextSec = sections[currentSectionIndex + 1];
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

        console.log("✅ [TakePage] Staying on MCQ page for section:", sec.title);
    }, [currentSectionIndex, sections, sectionsLoading, assessmentId, router, startSectionTimer, isStateLoaded, lockedSectionIndices]);

    // Create Submission ID (Side Effect)
    useEffect(() => {
        if (assessmentId) {
            const { sessionToken } = contestantService.getSession();
            contestantService.getOrCreateSubmission(assessmentId, sessionToken || '').then(subRes => {
                if (subRes.data?.success && subRes.data?.submission) {
                    setSubmissionId(subRes.data.submission.id);
                }
            });
        }
    }, [assessmentId]);


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
                localStorage.setItem(`navigation_intent_${assessmentId}`, 'navigated_to_coding');
                console.log("➡️ [TakePage] Navigating to Coding Page:", nextSection.title);
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${nextIndex}`);
                return;
            } else {
                // Stay on MCQ Page, navigate to next section using URL
                console.log("📄 [TakePage] Moving to next MCQ section via URL:", nextSection.title);
                router.push(`/contestant/assessment/${assessmentId}/take?section=${nextIndex}`);
                setCurrentQuestionIndex(0);
            }
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
    const flaggedCount = Array.from(flaggedQuestions).filter(id => currentSectionQuestionIds.has(id)).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    const sectionDuration = currentSection?.duration || 60;

    useEffect(() => {
        // Redirection handled in handleConfirmSectionFinish or initial load
        // But if we load into a coding section from storage, we should redirect.
        if (!loading && sections.length > 0 && currentSectionIndex < sections.length) {
            const current = sections[currentSectionIndex];
            if (current.type === 'coding') {
                router.push(`/contestant/assessment/${assessmentId}/coding?section=${currentSectionIndex}`);
            }
        }
    }, [currentSectionIndex, sections, loading, assessmentId]);

    if (loading || !currentSection) {
        return (
            <div className={`h-screen flex items-center justify-center ${bg}`}>
                <div className="w-10 h-10 border-3 border-[#0f62fe] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bg} ${textPrimary}`}>
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
                                className="text-sm"
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
                <aside className={`w-80 shrink-0 flex flex-col border-r ${theme === 'dark' ? 'bg-[#262626]/80 border-[#393939]' : 'bg-white/80 border-[#e0e0e0]'} z-20`}>
                    {/* Sections List */}
                    <div className="p-4 border-b border-inherit max-h-[30vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#525252 transparent' }}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textSecondary}`}>Sections</h3>
                        <div className="space-y-2">
                            {sections.map((sec, idx) => {
                                const isCurrent = idx === currentSectionIndex;
                                const isLocked = lockedSectionIndices.has(idx);

                                return (
                                    <div key={sec.id} className={`
                                        flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-all
                                        ${isCurrent
                                            ? 'bg-[#0f62fe] text-white border-[#0f62fe] shadow-sm'
                                            : isLocked
                                                ? 'bg-[#42be65]/10 text-[#42be65] border-[#42be65]/20'
                                                : `${theme === 'dark' ? 'bg-[#393939]/30 text-gray-400 border-transparent hover:bg-[#393939]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`
                                        }
                                    `}>
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {isLocked ? (
                                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${isCurrent ? 'bg-white/20' : 'bg-current/10'}`}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <span className="truncate">{sec.title}</span>
                                        </div>
                                        {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-xl shadow-white" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigator Header */}
                    <div className="p-4 border-b border-inherit bg-inherit z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold">Question Palette</h3>
                            <span className={`text-xs font-medium ${textSecondary}`}>{currentQuestionIndex + 1} of {totalQuestions}</span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                            <motion.div animate={{ width: `${progressPercent}%` }} className="h-full bg-[#0f62fe] rounded-full" />
                        </div>
                    </div>

                    {/* Questions Grid */}
                    <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#525252 transparent' }}>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, qIndex) => {
                                const status = getQuestionStatus(q.id, qIndex);
                                const isDisabled = !navigationSettings.allowPreviousNavigation && qIndex < currentQuestionIndex;
                                return (
                                    <motion.button
                                        key={q.id}
                                        whileHover={{ scale: isDisabled ? 1 : 1.1 }}
                                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                                        onClick={() => goToQuestion(qIndex)}
                                        disabled={isDisabled}
                                        className={`aspect-square rounded-lg text-xs font-bold transition-all ${status === 'current' ? 'bg-gradient-to-br from-[#8a3ffc] to-[#6929c4] text-white shadow-lg shadow-[#8a3ffc]/40 ring-2 ring-[#8a3ffc]/50 ring-offset-1 ring-offset-[#262626]' :
                                            status === 'answered' ? 'bg-[#42be65]/20 text-[#42be65] border-2 border-[#42be65]/40' :
                                                status === 'flagged' ? 'bg-[#f1c21b]/20 text-[#f1c21b] border-2 border-[#f1c21b]/40' :
                                                    `${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'} ${textSecondary}`
                                            } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        {qIndex + 1}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className={`p-4 border-t border-inherit shrink-0 bg-inherit z-10`}>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-gradient-to-br from-[#8a3ffc] to-[#6929c4]" /><span className={textSecondary}>Current</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#42be65]/20 border border-[#42be65]/40" /><span className={textSecondary}>Answered</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#f1c21b]/20 border border-[#f1c21b]/40" /><span className={textSecondary}>Marked</span></div>
                            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-md ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} /><span className={textSecondary}>Unseen</span></div>
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
                                        <h2 className="text-base font-medium mb-5 leading-relaxed">{question.text}</h2>

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

                                        {/* Next */}
                                        <button onClick={handleNext} disabled={currentSectionIndex === sections.length - 1 && qIndex === questions.length - 1}
                                            className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#6929c4] hover:opacity-90 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#0f62fe]/25 disabled:opacity-40 transition-all">
                                            Next<ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </main>

                    {/* New Footer Panel */}
                    <footer className={`shrink-0 px-6 py-4 border-t ${cardBorder} flex items-center justify-end z-20 ${cardBg}`}>
                        {currentSectionIndex < sections.length - 1 ? (
                            <button
                                onClick={handleConfirmSectionFinish}
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className={`max-w-sm w-full rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
                            <div className="text-center mb-5">
                                <AlertTriangle className="w-12 h-12 text-[#f1c21b] mx-auto mb-3" />
                                <h2 className="text-lg font-bold mb-2">Finish Section?</h2>
                                <p className={`text-sm ${textSecondary} mb-4`}>
                                    You are about to move to the next section.
                                    <br /><br />
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
                                <button onClick={handleConfirmSectionFinish} className="flex-1 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-lg font-medium text-sm">
                                    Confirm & Proceed
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
