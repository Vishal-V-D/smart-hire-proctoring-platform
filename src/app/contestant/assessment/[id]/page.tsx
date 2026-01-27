"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Clock, Calendar, Users, CheckCircle2, Play, AlertCircle,
    Shield, Sparkles, ArrowRight, BookOpen, Timer, Award
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contestantService, type ContestantAssessment } from '@/api/contestantService';
import ProctoringSetupModal from '@/components/contestant/ProctoringSetupModal';
import Loader from '@/components/Loader';

export default function AssessmentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const assessmentId = params.id as string;

    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
    const [checkingRegistration, setCheckingRegistration] = useState(true);

    const queryClient = useQueryClient();

    // 1. Fetch Assessment Details (Cache it for use in next pages)
    const { data: assessmentRes, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['assessment', assessmentId],
        queryFn: async () => {
            const res = await contestantService.getAssessment(assessmentId);
            return res.data;
        },
        staleTime: 5 * 60 * 1000
    });

    const assessment = assessmentRes?.assessment || null;
    // Derive error string if needed, or handle in render
    const errorMessage = (queryError as any)?.response?.data?.message || (queryError as any)?.message || error;

    // 2. AGGRESSIVE Prefetching for Instant Start Experience
    useEffect(() => {
        if (assessmentId) {
            console.log('🚀 [Lobby] Starting aggressive prefetch...');

            // Prefetch Sections (used by Take/Coding/SQL pages)
            queryClient.prefetchQuery({
                queryKey: ['sections', assessmentId],
                queryFn: async () => {
                    const res = await contestantService.getSections(assessmentId);
                    return res.data;
                },
                staleTime: Infinity
            }).then((data) => {
                // Once sections are cached, prefetch the FIRST 3 sections' questions
                // This ensures instant loading for MCQ, Coding, and SQL sections
                const sections = (data as any)?.sections;
                if (sections && sections.length > 0) {
                    console.log(`🔮 [Lobby] Prefetching first ${Math.min(3, sections.length)} sections...`);

                    // Prefetch first 3 sections (or all if less than 3)
                    const sectionsToPreload = sections.slice(0, 3);

                    sectionsToPreload.forEach((section: any, index: number) => {
                        if (section?.id && section.type !== 'coding') {
                            // Prefetch MCQ/Technical/SQL questions
                            queryClient.prefetchQuery({
                                queryKey: ['questions', assessmentId, section.id],
                                queryFn: async () => {
                                    console.log(`📥 [Lobby] Prefetching section ${index + 1}: ${section.title} (${section.type})`);
                                    const res = await contestantService.getQuestions(assessmentId, section.id);
                                    return res.data;
                                },
                                staleTime: 5 * 60 * 1000
                            });
                        } else if (section?.type === 'coding') {
                            console.log(`⚡ [Lobby] Section ${index + 1} is coding type: ${section.title} (will load on-demand)`);
                        }
                    });

                    console.log('✅ [Lobby] Prefetch complete! Assessment ready for instant start.');
                }
            }).catch((err) => {
                console.error('❌ [Lobby] Prefetch failed:', err);
            });
        }
    }, [assessmentId, queryClient]);

    // 3. Check Registration Status
    useEffect(() => {
        const checkStatus = async () => {
            const session = contestantService.getSession();
            if (session.token && assessmentId) {
                try {
                    // Decode token to get email
                    const payload = JSON.parse(atob(session.token.split('.')[1]));
                    const email = payload.email;
                    if (email) {
                        const res = await contestantService.checkRegistrationStatus(assessmentId, email);
                        setIsRegistered(res.data.isRegistered);
                    }
                } catch (err) {
                    console.error('Failed to check registration status:', err);
                    // If check fails, we assume registered or let the start call handle it
                } finally {
                    setCheckingRegistration(false);
                }
            } else {
                setCheckingRegistration(false);
            }
        };
        checkStatus();
    }, [assessmentId]);

    const handleStartClick = () => {
        if (isRegistered === false) {
            const session = contestantService.getSession();
            const payload = session.token ? JSON.parse(atob(session.token.split('.')[1])) : {};
            const email = payload.email || '';
            router.push(`/contestant/register?assessmentId=${assessmentId}&email=${encodeURIComponent(email)}`);
            return;
        }
        setShowSetupModal(true);
    };

    const handleSetupComplete = async () => {
        setShowSetupModal(false);
        const { sessionToken } = contestantService.getSession();
        if (!sessionToken) {
            setError('Session expired. Please log in again.');
            return;
        }

        setStarting(true);
        setError('');

        try {
            await contestantService.startAssessment(assessmentId, sessionToken);
            router.push(`/contestant/assessment/${assessmentId}/take`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start assessment');
            setStarting(false);
        }
    };

    if (loading) {
        return <Loader fullscreen />;
    }

    if (!assessment) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#f8f7ff] via-[#f0eeff] to-[#e8e5ff]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white p-8 rounded-2xl shadow-xl"
                >
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Not Found</h2>
                    <p className="text-gray-500 text-sm">{error}</p>
                </motion.div>
            </div>
        );
    }

    const totalQuestions = assessment.sections.reduce((sum, section: any) =>
        sum + (section.questions?.length || 0) + (section.problems?.length || 0) + (section.sqlQuestions?.length || 0), 0);


    return (
        <div className="h-screen w-screen flex overflow-hidden">
            {/* Left Panel - 50% */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#e8e5ff] p-10 flex-col relative">
                {/* Abstract Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 left-[15%] w-40 h-40 rounded-full bg-gradient-to-br from-purple-300/40 to-indigo-300/30 blur-2xl"
                    />
                    <motion.div
                        animate={{ y: [0, 25, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-32 right-[20%] w-48 h-48 rounded-full bg-gradient-to-br from-blue-300/30 to-purple-300/20 blur-2xl"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[30%] right-[10%] w-64 h-64 border border-purple-200/40 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[20%] left-[10%] w-40 h-40 border border-indigo-200/30 rounded-2xl"
                    />
                </div>

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain" />
                    <span className="text-lg font-bold text-gray-800">SecureHire</span>
                </div>

                {/* Assessment Info - At Top */}
                <div className="relative z-10 mb-8">
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold mb-4 w-fit ${assessment.status === 'active'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {assessment.status === 'active' ? '● Active Assessment' : assessment.status}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{assessment.title}</h1>
                    <p className="text-gray-600 text-base max-w-md">{assessment.description}</p>
                </div>

                {/* Stats Grid - Push to bottom */}
                <div className="relative z-10 mt-auto">
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Timer className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-500">Duration</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{assessment.duration} <span className="text-sm font-normal text-gray-500">min</span></p>
                        </div>
                        <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-500">Questions</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-500">Sections</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{assessment.sections.length}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-500">Deadline</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{new Date(assessment.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Decorative Circles */}
                <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute bottom-20 right-16 w-20 h-20 rounded-full bg-purple-200/50"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
                    className="absolute top-1/3 right-24 w-12 h-12 rounded-full bg-indigo-200/40"
                />
            </div>

            {/* Right Panel - 50% */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}>
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
                            <span className="font-bold text-gray-800">SecureHire</span>
                        </div>
                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-3 ${assessment.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {assessment.status}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
                        <p className="text-gray-500">{assessment.description}</p>
                    </div>

                    {/* Sections Table */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            Assessment Sections
                        </h2>
                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100/70 text-left">
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">#</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Questions</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Duration</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Marks</th>
                                        <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[...assessment.sections]
                                        .sort((a: any, b: any) => {
                                            // Try multiple possible order fields
                                            const orderA = a.orderIndex ?? a.order ?? a.sortOrder ?? 0;
                                            const orderB = b.orderIndex ?? b.order ?? b.sortOrder ?? 0;
                                            return orderA - orderB;
                                        })
                                        .map((section: any, index: number) => {
                                            // Count all question types: MCQ, Coding Problems, and SQL Questions
                                            const mcqCount = section.questions?.length || 0;
                                            const codingCount = section.problems?.length || 0;
                                            const sqlCount = section.sqlQuestions?.length || 0;
                                            const questionCount = mcqCount + codingCount + sqlCount;

                                            const sectionTime = section.timeLimit || section.duration || 0;

                                            // Sum individual question/problem marks (user-assigned)
                                            const questionMarks = (section.questions || []).reduce((sum: number, q: any) =>
                                                sum + (Number(q.marks) || Number(section.marksPerQuestion) || 0), 0);
                                            const problemMarks = (section.problems || []).reduce((sum: number, p: any) =>
                                                sum + (Number(p.marks) || Number(section.marksPerQuestion) || 0), 0);
                                            const sqlMarks = (section.sqlQuestions || []).reduce((sum: number, sq: any) =>
                                                sum + (Number(sq.marks) || Number(section.marksPerQuestion) || 0), 0);
                                            const sectionMarks = questionMarks + problemMarks + sqlMarks;
                                            return (
                                                <tr key={section.id} className="hover:bg-white transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-white">{index + 1}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-gray-900">{section.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{section.description}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="text-lg font-bold text-gray-900">{questionCount}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="text-gray-700 font-medium">{sectionTime} min</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="text-purple-700 font-bold">{sectionMarks}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                                            {section.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-600" />
                            Important Instructions
                        </h2>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                            <ul className="space-y-3">
                                {[
                                    'Complete all sections within the given time limit',
                                    'You can navigate between questions within a section',
                                    'Your progress is auto-saved continuously',
                                    'Do not refresh or close the browser during assessment',
                                    'Ensure stable internet connection throughout'
                                ].map((instruction, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-amber-800">
                                        <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-gray-100 bg-white">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={!starting ? { scale: 1.01 } : {}}
                        whileTap={!starting ? { scale: 0.99 } : {}}
                        onClick={handleStartClick}
                        disabled={starting}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        {starting || checkingRegistration ? (
                            <div className="scale-50 h-6 w-12 flex items-center justify-center">
                                <Loader />
                            </div>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                {isRegistered === false ? 'Register for Assessment' : 'Start Assessment'}
                                <ArrowRight className="h-6 w-6" />
                            </>
                        )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span>Assessment data preloaded</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span>Timer starts after setup</span>
                        <span className="text-gray-300">•</span>
                        <span>Progress auto-saved</span>
                    </div>
                </div>
            </div>

            <ProctoringSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                onComplete={handleSetupComplete}
                assessmentId={assessmentId}
                settings={assessment.proctoringSettings}
            />
        </div>
    );
}
