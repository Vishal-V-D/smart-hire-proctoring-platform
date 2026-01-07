'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
    Layers, CheckCircle, Flag, Cloud, CloudOff, Loader2, AlertCircle, ArrowRight
} from 'lucide-react';
import { contestantService, type AssessmentSection, type AssessmentQuestion, type SaveAnswerRequest } from '@/api/contestantService';

// Theme colors passed from parent or context could be better, but we'll stick to local for now or props.
// Ideally AttemptPage manages theme.

interface MCQSectionProps {
    assessmentId: string;
    section: AssessmentSection;
    theme: 'light' | 'dark';
    onComplete: () => void;
    onAnswerUpdate?: (questionId: string, answer: any) => void;
    isLastSection?: boolean;
    totalSections?: number;
    currentSectionNumber?: number;
    onNextSection?: () => void;
    onSubmitAll?: () => void;
}

type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'current';

export default function MCQSection({ assessmentId, section, theme, onComplete, onAnswerUpdate, isLastSection = false, totalSections = 1, currentSectionNumber = 1, onNextSection, onSubmitAll }: MCQSectionProps) {
    // Local state for this section
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationType, setConfirmationType] = useState<'next' | 'submit'>('next');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Settings (could come from props if unified)
    // For now fetch them or default them. 
    // We assume parent passed the *section*, but we need questions.

    // Theme Colors
    const bg = theme === 'dark' ? 'bg-[#161616]' : 'bg-[#f4f4f4]';
    const cardBg = theme === 'dark' ? 'bg-[#262626]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]';
    const textPrimary = theme === 'dark' ? 'text-[#f4f4f4]' : 'text-[#161616]';
    const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#6f6f6f]';

    useEffect(() => {
        fetchQuestionsAndAnswers();
    }, [assessmentId, section.id]);

    const fetchQuestionsAndAnswers = async () => {
        setLoading(true);
        try {
            // Fetch questions and saved answers in parallel
            const [questionsRes, answersRes] = await Promise.all([
                contestantService.getQuestions(assessmentId, section.id),
                contestantService.getSavedAnswers(assessmentId)
            ]);

            const fetchedQuestions = questionsRes.data.questions || [];
            setQuestions(fetchedQuestions);

            // Preload all question images so they appear instantly when clicking
            preloadQuestionImages(fetchedQuestions);

            // Load saved answers for this section
            if (answersRes.data.answers) {
                const sectionAnswers = answersRes.data.answers.filter(a => a.sectionId === section.id);
                const answersMap: Record<string, any> = {};
                sectionAnswers.forEach(a => {
                    answersMap[a.questionId] = a.answer;
                });
                if (Object.keys(answersMap).length > 0) {
                    setAnswers(answersMap);

                    // Report initial answers to parent
                    if (onAnswerUpdate) {
                        Object.entries(answersMap).forEach(([qid, ans]) => {
                            onAnswerUpdate(qid, ans);
                        });
                    }
                    console.log(`✅ Loaded ${Object.keys(answersMap).length} saved answers for section ${section.id}`);
                }
            }
        } catch (err) {
            console.error('Failed to fetch questions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Preload all question images for instant display
    const preloadQuestionImages = (questions: AssessmentQuestion[]) => {
        const imagesToPreload = questions
            .filter(q => q.image && q.image.trim() !== '' && q.image !== 'null' && q.image !== 'undefined')
            .map(q => q.image);

        if (imagesToPreload.length === 0) return;

        console.log(`🖼️ Preloading ${imagesToPreload.length} question images...`);

        imagesToPreload.forEach(imageUrl => {
            const img = new Image();
            img.src = imageUrl as string;
            // Optional: Log when preloaded
            img.onload = () => console.log(`✅ Preloaded: ${imageUrl?.substring(0, 50)}...`);
            img.onerror = () => console.warn(`⚠️ Failed to preload: ${imageUrl?.substring(0, 50)}...`);
        });
    };

    const currentQuestion = questions[currentQuestionIndex];

    // Helper to check if image has errored for a question
    const hasImageError = (questionId: string) => imageErrors.has(questionId);

    const handleImageError = (questionId: string) => {
        setImageErrors(prev => new Set([...prev, questionId]));
    };

    // Debounced save to backend
    const saveAnswerToBackend = useCallback(async (questionId: string, sectionId: string, answer: any) => {
        setSaveStatus('saving');
        try {
            await contestantService.saveAnswer(assessmentId, {
                questionId,
                sectionId,
                answer,
            });
            setSaveStatus('saved');
            // Reset to idle after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to save answer:', err);
            setSaveStatus('error');
        }
    }, [assessmentId]);

    const handleAnswer = (answer: any) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

        // Notify parent for bulk submission
        if (onAnswerUpdate) {
            onAnswerUpdate(currentQuestion.id, answer);
        }

        // Debounce save to backend (500ms delay)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveAnswerToBackend(currentQuestion.id, section.id, answer);
        }, 500);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Section complete
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleFlag = () => {
        if (!currentQuestion) return;
        setFlaggedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.has(currentQuestion.id) ? newSet.delete(currentQuestion.id) : newSet.add(currentQuestion.id);
            return newSet;
        });
    };

    const goToQuestion = (qIndex: number) => {
        setCurrentQuestionIndex(qIndex);
    };

    const getQuestionStatus = (questionId: string, qIndex: number): QuestionStatus => {
        if (qIndex === currentQuestionIndex) return 'current';
        if (flaggedQuestions.has(questionId)) return 'flagged';
        if (answers[questionId]) return 'answered';
        return 'unanswered';
    };

    const answeredCount = Object.keys(answers).length;
    const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    const handleFinishSection = () => {
        setConfirmationType(isLastSection ? 'submit' : 'next');
        setShowConfirmation(true);
    };

    const handleConfirmAction = () => {
        if (confirmationType === 'submit' && onSubmitAll) {
            onSubmitAll();
        } else if (confirmationType === 'next' && onNextSection) {
            onNextSection();
        }
        setShowConfirmation(false);
    };

    if (loading) {
        return (
            <div className={`flex-1 flex items-center justify-center`}>
                <div className="w-8 h-8 border-2 border-[#0f62fe] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Sidebar: Navigator - Clean and Professional */}
            <aside className={`w-80 shrink-0 flex flex-col border-r ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#393939]' : 'bg-[#fafafa] border-[#e0e0e0]'}`}>
                {/* Section Header - Minimal */}
                <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]'}`}>
                    <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-[#f4f4f4]' : 'text-[#161616]'}`}>
                        {section.title}
                    </h2>
                </div>

                {/* Progress Bar */}
                <div className="px-5 py-3 border-b border-inherit">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>Progress</span>
                        <span className="text-[10px] font-bold text-[#0f62fe]">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                        <motion.div animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-[#0f62fe] via-[#8a3ffc] to-[#42be65] rounded-full" />
                    </div>
                </div>

                {/* Answer Status Summary */}
                <div className="px-5 py-3 border-b border-inherit">
                    <h4 className={`text-[10px] font-bold mb-2.5 uppercase tracking-wider ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                        Status
                    </h4>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                                <div className="w-2 h-2 rounded-full bg-[#42be65]" />
                                Answered
                            </span>
                            <span className="font-bold text-[#42be65]">{Object.keys(answers).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                                <div className="w-2 h-2 rounded-full bg-[#f1c21b]" />
                                Flagged
                            </span>
                            <span className="font-bold text-[#f1c21b]">{flaggedQuestions.size}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                                <div className="w-2 h-2 rounded-full bg-[#da1e28]" />
                                Unanswered
                            </span>
                            <span className="font-bold text-[#da1e28]">{questions.length - Object.keys(answers).length}</span>
                        </div>
                    </div>
                </div>

                {/* Questions Navigator */}
                <div className="flex-1 p-5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#525252 transparent' }}>
                    <h4 className={`text-[10px] font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`}>
                        Questions
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                        {questions.map((q, qIndex) => {
                            const status = getQuestionStatus(q.id, qIndex);
                            return (
                                <motion.button
                                    key={q.id}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => goToQuestion(qIndex)}
                                    title={`Question ${qIndex + 1}: ${status}`}
                                    className={`aspect-square rounded-lg text-xs font-bold transition-all ${status === 'current' ? 'bg-gradient-to-br from-[#8a3ffc] to-[#6929c4] text-white shadow-lg shadow-[#8a3ffc]/40 ring-2 ring-[#8a3ffc]/50 ring-offset-1 ring-offset-[#262626]' :
                                        status === 'answered' ? 'bg-[#42be65]/20 text-[#42be65] border-2 border-[#42be65]/40' :
                                            status === 'flagged' ? 'bg-[#f1c21b]/20 text-[#f1c21b] border-2 border-[#f1c21b]/40' :
                                                `${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'} ${theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#525252]'}`
                                        }`}
                                >
                                    {qIndex + 1}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Main Question Content */}
            <main className="flex-1 flex flex-col min-h-0 p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${section.id}-${currentQuestionIndex}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex-1 flex flex-col ${cardBg} rounded-xl border ${cardBorder} overflow-hidden`}
                    >
                        {currentQuestion && (
                            <>
                                {/* Question Header */}
                                <div className={`px-5 py-3 border-b ${cardBorder} flex items-center justify-between shrink-0`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${theme === 'dark' ? 'bg-[#393939] text-white' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                                            {currentQuestionIndex + 1}
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${theme === 'dark' ? 'bg-[#393939] text-[#f4f4f4]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                                            {currentQuestion.type?.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`text-[10px] ${textSecondary}`}>{currentQuestion.marks} marks</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Save Status Indicator */}
                                        {saveStatus !== 'idle' && (
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${saveStatus === 'saving' ? 'bg-[#0f62fe]/10 text-[#0f62fe]' :
                                                saveStatus === 'saved' ? 'bg-[#42be65]/10 text-[#42be65]' :
                                                    'bg-[#da1e28]/10 text-[#da1e28]'
                                                }`}>
                                                {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                                                {saveStatus === 'saved' && <Cloud className="w-3 h-3" />}
                                                {saveStatus === 'error' && <CloudOff className="w-3 h-3" />}
                                                <span>
                                                    {saveStatus === 'saving' ? 'Saving...' :
                                                        saveStatus === 'saved' ? 'Saved' : 'Save failed'}
                                                </span>
                                            </div>
                                        )}
                                        <button onClick={handleFlag} className={`p-2 rounded-lg transition-all ${flaggedQuestions.has(currentQuestion.id) ? 'bg-[#f1c21b]/20 text-[#f1c21b]' : `hover:bg-[#393939] ${textSecondary}`}`}>
                                            <Flag className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Question Body */}
                                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                                    <h2 className="text-base font-medium mb-5 leading-relaxed">{currentQuestion.text}</h2>

                                    {currentQuestion.image &&
                                        currentQuestion.image.trim() !== '' &&
                                        currentQuestion.image !== 'null' &&
                                        currentQuestion.image !== 'undefined' &&
                                        !hasImageError(currentQuestion.id) && (
                                            <div className="mb-5">
                                                <img
                                                    key={currentQuestion.id + '-img'}
                                                    src={currentQuestion.image}
                                                    alt="Question"
                                                    loading="eager"
                                                    decoding="sync"
                                                    className="max-w-sm max-h-48 rounded-lg border border-inherit object-contain bg-black/5"
                                                    onError={() => handleImageError(currentQuestion.id)}
                                                />
                                            </div>
                                        )}

                                    {/* Single Choice */}
                                    {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, i) => (
                                                <motion.label key={i} whileHover={{ x: 3 }} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestion.id] === option ? 'border-[#42be65] bg-[#42be65]/10' : `${cardBorder} hover:border-[#42be65]/50`}`}>
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option ? 'border-[#42be65] bg-[#42be65]' : cardBorder}`}>
                                                        {answers[currentQuestion.id] === option && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium flex-1">{option}</span>
                                                    <input type="radio" name={currentQuestion.id} value={option} checked={answers[currentQuestion.id] === option} onChange={e => handleAnswer(e.target.value)} className="sr-only" />
                                                </motion.label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Multiple Choice */}
                                    {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, i) => (
                                                <motion.label key={i} whileHover={{ x: 3 }} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestion.id]?.includes(option) ? 'border-[#8a3ffc] bg-[#8a3ffc]/10' : `${cardBorder} hover:border-[#8a3ffc]/50`}`}>
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${answers[currentQuestion.id]?.includes(option) ? 'border-[#8a3ffc] bg-[#8a3ffc]' : cardBorder}`}>
                                                        {answers[currentQuestion.id]?.includes(option) && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium flex-1">{option}</span>
                                                    <input type="checkbox" value={option} checked={answers[currentQuestion.id]?.includes(option) || false}
                                                        onChange={e => {
                                                            const current = answers[currentQuestion.id] || [];
                                                            handleAnswer(e.target.checked ? [...current, option] : current.filter((a: string) => a !== option));
                                                        }} className="sr-only" />
                                                </motion.label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Text */}
                                    {currentQuestion.type === 'text' && (
                                        <textarea value={answers[currentQuestion.id] || ''} onChange={e => handleAnswer(e.target.value)} placeholder="Type answer..."
                                            className={`w-full h-32 p-3 rounded-lg border-2 resize-none outline-none ${cardBg} ${cardBorder} focus:border-[#0f62fe] text-sm`} />
                                    )}
                                </div>

                                {/* Navigation Footer */}
                                <div className={`px-5 py-4 border-t ${cardBorder} flex items-center justify-between shrink-0`}>
                                    <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 transition-all ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}>
                                        <ChevronLeft className="w-4 h-4" />Previous
                                    </button>

                                    <button onClick={handleFlag}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${currentQuestion && flaggedQuestions.has(currentQuestion.id)
                                            ? 'bg-[#f1c21b]/20 text-[#f1c21b] border-2 border-[#f1c21b]/40'
                                            : `${theme === 'dark' ? 'bg-[#393939] hover:bg-[#f1c21b]/20 hover:text-[#f1c21b]' : 'bg-[#e0e0e0] hover:bg-[#f1c21b]/20 hover:text-[#f1c21b]'}`
                                            }`}>
                                        {currentQuestion && flaggedQuestions.has(currentQuestion.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                        {currentQuestion && flaggedQuestions.has(currentQuestion.id) ? 'Marked' : 'Review'}
                                    </button>

                                    {currentQuestionIndex === questions.length - 1 ? (
                                        <button onClick={handleFinishSection}
                                            className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#6929c4] hover:opacity-90 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#0f62fe]/25 transition-all">
                                            Finish Section <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={handleNext}
                                            className="px-5 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#6929c4] hover:opacity-90 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#0f62fe]/25 transition-all">
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmation && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirmation(false)}
                            className="fixed inset-0 bg-black/50 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}
                        >
                            <div className={`${cardBg} rounded-xl border ${cardBorder} shadow-2xl max-w-sm w-full mx-4 pointer-events-auto overflow-hidden`}>
                                {/* Header */}
                                <div className={`px-6 py-4 border-b ${cardBorder} flex items-center gap-3`}>
                                    <AlertCircle className="w-5 h-5 text-[#f1c21b] flex-shrink-0" />
                                    <h3 className={`text-sm font-bold ${textPrimary}`}>
                                        {confirmationType === 'submit' ? 'Submit Assessment' : 'Continue to Next Section'}
                                    </h3>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-5">
                                    <p className={`text-sm mb-4 ${textSecondary}`}>
                                        You have solved <span className="font-bold text-[#42be65]">{answeredCount} of {questions.length}</span> questions.
                                    </p>
                                    <p className={`text-sm ${textSecondary}`}>
                                        {confirmationType === 'submit' 
                                            ? 'Are you sure you want to submit your assessment? You cannot change your answers after submission.'
                                            : `Move to the next section? You won't be able to edit this section's answers later.`
                                        }
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className={`px-6 py-4 border-t ${cardBorder} flex gap-3`}>
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#4c4c4c]' : 'bg-[#e0e0e0] hover:bg-[#c6c6c6]'}`}
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={handleConfirmAction}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0f62fe] to-[#6929c4] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        {confirmationType === 'submit' ? 'Submit' : 'Continue'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
