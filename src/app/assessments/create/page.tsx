"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AssessmentConfig, AssessmentSection } from './types';
import AssessmentSetup from './components/AssessmentSetup';
import AssessmentBuilder from './components/AssessmentBuilder';
import { assessmentService } from '@/api/assessmentService';
import { AuthContext } from '@/components/AuthProviderClient';
import { useContext } from 'react';
import { useSidebar } from '@/context/SidebarContext';

// --- MAIN PAGE COMPONENT ---

const NewAssessmentPage = () => {
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit'); // If present, we're editing
    const auth = useContext(AuthContext);
    const userRole = auth?.user?.role?.toUpperCase();
    const listPath = userRole === 'ADMIN' || userRole === 'COMPANY' || userRole === 'admin'
        ? '/admin/assessments'
        : '/organizer/assessments';

    // Collapse Sidebar automatically when entering Builder
    const { setCollapsed } = useSidebar();
    useEffect(() => {
        setCollapsed(true);
        // Optional: Expand when leaving? 
        // return () => setCollapsed(false); 
        // But the user might want it to stay collapsed or return to default. 
        // Usually better to leave it as user left it or reset if needed.
        // User said "close once done do that bro", which likely means "close IT", not "re-open".
    }, []);

    // --- STATE ---
    const [phase, setPhase] = useState<'setup' | 'builder'>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Global Data State
    const [config, setConfig] = useState<AssessmentConfig>({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        duration: 60,
        passPercentage: 60,
        timeMode: 'section',
        globalTime: 60,
        proctoring: {
            enabled: false,
            // Monitoring
            imageMonitoring: false,
            videoMonitoring: false,
            screenRecording: false,
            audioMonitoring: false,
            audioRecording: false,
            // AI
            objectDetection: false,
            personDetection: false,
            faceDetection: false,
            eyeTracking: false,
            noiseDetection: false,
            // Lockdown
            fullscreen: false,
            tabSwitchLimit: 0,
            disableCopyPaste: false,
            blockExternalMonitor: false,
            blockRightClick: false,
            // Verification
            verifyIDCard: false,
            verifyFace: false,
        },
        navigation: {
            allowPreviousNavigation: true,
            allowMarkForReview: true,
        }
    });

    const [sections, setSections] = useState<AssessmentSection[]>([]);

    // --- EFFECT: Fetch existing assessment if editing ---
    useEffect(() => {
        if (editId) {
            setIsEditMode(true);
            fetchAssessmentForEdit(editId);
        }
    }, [editId]);

    const fetchAssessmentForEdit = async (id: string) => {
        setIsLoading(true);
        try {
            console.log("📥 Fetching assessment for edit:", id);
            const response = await assessmentService.getAssessment(id);
            const assessment = response.data;
            console.log("✅ Loaded assessment:", assessment);

            // Populate config from assessment data
            setConfig({
                title: assessment.title || "",
                description: assessment.description || "",
                startDate: assessment.startDate ? new Date(assessment.startDate).toISOString().slice(0, 16) : "",
                endDate: assessment.endDate ? new Date(assessment.endDate).toISOString().slice(0, 16) : "",
                duration: assessment.duration || 60,
                passPercentage: assessment.passPercentage || 60,
                timeMode: assessment.timeMode || 'section',
                globalTime: assessment.globalTime || 60,
                proctoring: {
                    enabled: assessment.proctoringSettings?.enabled ?? false,
                    // Monitoring
                    imageMonitoring: assessment.proctoringSettings?.imageMonitoring ?? false,
                    videoMonitoring: assessment.proctoringSettings?.videoMonitoring ?? assessment.proctoringSettings?.camera ?? false,
                    screenRecording: assessment.proctoringSettings?.screenRecording ?? assessment.proctoringSettings?.screenRecord ?? false,
                    audioMonitoring: assessment.proctoringSettings?.audioMonitoring ?? assessment.proctoringSettings?.mic ?? false,
                    audioRecording: assessment.proctoringSettings?.audioRecording ?? false,
                    // AI
                    objectDetection: assessment.proctoringSettings?.objectDetection ?? false,
                    personDetection: assessment.proctoringSettings?.personDetection ?? assessment.proctoringSettings?.realtimeFaceDetection ?? false,
                    faceDetection: assessment.proctoringSettings?.faceDetection ?? false,
                    eyeTracking: assessment.proctoringSettings?.eyeTracking ?? false,
                    noiseDetection: assessment.proctoringSettings?.noiseDetection ?? false,
                    // Lockdown
                    fullscreen: assessment.proctoringSettings?.fullscreen ?? false,
                    tabSwitchLimit: assessment.proctoringSettings?.tabSwitchLimit ?? 0,
                    disableCopyPaste: assessment.proctoringSettings?.disableCopyPaste ?? false,
                    blockExternalMonitor: assessment.proctoringSettings?.blockExternalMonitor ?? false,
                    blockRightClick: assessment.proctoringSettings?.blockRightClick ?? false,
                    // Verification
                    verifyIDCard: assessment.proctoringSettings?.verifyIDCard ?? false,
                    verifyFace: assessment.proctoringSettings?.verifyFace ?? false,
                },
                navigation: {
                    allowPreviousNavigation: assessment.navigationSettings?.allowPreviousNavigation ?? true,
                    allowMarkForReview: assessment.navigationSettings?.allowMarkForReview ?? true,
                }
            });

            // Populate sections from assessment data
            if (assessment.sections && assessment.sections.length > 0) {
                const loadedSections: AssessmentSection[] = assessment.sections.map((s: any) => ({
                    id: s.id,
                    title: s.title || "",
                    description: s.description || "",
                    type: s.type || 'aptitude',
                    questionCount: s.questionCount || 0,
                    marksPerQuestion: s.marksPerQuestion || 1,
                    timeLimit: s.timeLimit || 30,
                    negativeMarking: s.negativeMarking || 0,
                    difficulty: s.difficulty || 'Medium',
                    themeColor: s.themeColor || '#6366f1',
                    enabledPatterns: s.enabledPatterns || [],
                    orderIndex: s.orderIndex || 0,
                    questions: (s.questions || []).map((q: any) => ({
                        id: q.id,
                        text: q.text || "",
                        image: q.image || undefined,
                        type: q.type || 'single_choice',
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        codeStub: q.codeStub || undefined,
                        marks: q.marks || 1,
                        orderIndex: q.orderIndex || 0,
                        problemId: q.problemId || undefined,
                        problemData: q.problemData || undefined,
                        sectionProblemId: q.sectionProblemId || undefined, // For test case configuration
                        testCaseConfig: q.testCaseConfig || undefined, // For test case configuration
                    }))
                }));
                setSections(loadedSections);
            }

        } catch (error) {
            console.error("❌ Failed to fetch assessment for edit:", error);
            alert("Failed to load assessment for editing. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- VALIDATION ---
    const validateAssessment = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Title validation
        if (!config.title || config.title.trim().length < 3) {
            errors.push('Assessment title must be at least 3 characters');
        }

        // Date validation
        if (!config.startDate) {
            errors.push('Start date is required');
        } else {
            const start = new Date(config.startDate);
            if (isNaN(start.getTime())) {
                errors.push('Invalid start date format');
            }
        }

        if (!config.endDate) {
            errors.push('End date is required');
        } else {
            const end = new Date(config.endDate);
            if (isNaN(end.getTime())) {
                errors.push('Invalid end date format');
            }
        }

        // Start date should be before end date
        if (config.startDate && config.endDate) {
            const start = new Date(config.startDate);
            const end = new Date(config.endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
                errors.push('End date must be after start date');
            }
        }

        // Duration validation (calculated from sections)
        const currentTotalDuration = sections.reduce((acc, s) => acc + (s.timeLimit || 0), 0);
        if (currentTotalDuration < 1) {
            errors.push('Total assessment duration must be at least 1 minute. Please add time to sections.');
        }

        // Sections validation
        if (sections.length === 0) {
            errors.push('At least one section is required');
        }

        return { valid: errors.length === 0, errors };
    };

    // --- SUBMIT ACTION ---
    const handlePublish = async () => {
        // Validate first
        const { valid, errors } = validateAssessment();

        if (!valid) {
            // Show validation errors as toasts
            const { showToast } = await import('@/utils/toast');
            errors.forEach((error, index) => {
                setTimeout(() => {
                    showToast(error, 'error');
                }, index * 300); // Stagger toasts
            });
            return;
        }

        try {
            console.log("📤 Publishing Assessment:", { config, sections, isEditMode });

            // Show loading toast
            const { showToast } = await import('@/utils/toast');
            showToast(isEditMode ? 'Updating assessment...' : 'Creating assessment...', 'info');

            // Transform sections to match backend API format
            const transformedSections = sections.map((section, index) => ({
                id: section.id, // Include ID for update
                title: section.title,
                description: section.description,
                type: section.type,
                questionCount: section.questionCount,
                marksPerQuestion: section.marksPerQuestion,
                timeLimit: section.timeLimit,
                negativeMarking: section.negativeMarking,
                difficulty: section.difficulty,
                enabledPatterns: section.enabledPatterns || [],
                themeColor: section.themeColor,
                orderIndex: index,
                questions: (section.questions || []).map((q, qIndex) => {
                    // marks = user-set in assessment builder, else section default
                    // IMPORTANT: When adding problems, do NOT copy problem's original marks
                    const marks = q.marks ?? section.marksPerQuestion;

                    // For coding questions, send only problemId and testCaseConfig
                    if (q.type === 'coding' && q.problemId) {
                        return {
                            id: q.id,
                            type: 'coding' as const,
                            problemId: q.problemId,
                            marks: marks,
                            orderIndex: qIndex,
                            testCaseConfig: q.testCaseConfig || undefined
                        };
                    }
                    // For MCQ and other types, send full data with ALL fields
                    return {
                        id: q.id,
                        text: q.text,
                        image: q.image || undefined,
                        type: q.type,
                        options: q.options || undefined,
                        correctAnswer: q.correctAnswer || undefined,
                        explanation: (q as any).explanation || undefined,
                        pseudocode: (q as any).pseudocode || undefined,  // ✅ CRITICAL: Include pseudocode
                        division: (q as any).division || undefined,
                        subdivision: (q as any).subdivision || undefined,
                        topic: (q as any).topic || undefined,
                        difficulty: (q as any).difficulty || undefined,
                        tags: (q as any).tags || undefined,
                        codeStub: q.codeStub || undefined,
                        marks: marks,
                        orderIndex: qIndex
                    };
                })
            }));

            // Prepare assessment data - ensure dates are properly formatted
            const assessmentData = {
                title: config.title.trim(),
                description: config.description?.trim() || '',
                startDate: new Date(config.startDate).toISOString(),
                endDate: new Date(config.endDate).toISOString(),
                duration: sections.reduce((acc, s) => acc + (s.timeLimit || 0), 0),
                passPercentage: config.passPercentage,
                timeMode: 'section' as const,
                globalTime: 0,
                proctoringSettings: config.proctoring,
                navigationSettings: config.navigation,
                sections: transformedSections
            };

            console.log("📦 Transformed Assessment Data:", assessmentData);

            let response;
            if (isEditMode && editId) {
                // UPDATE existing assessment
                response = await assessmentService.updateAssessment(editId, assessmentData);
                console.log("✅ Assessment updated successfully:", response.data);
                showToast('Assessment updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = `${listPath}/${editId}`; // Or just listPath if detail view differs
                }, 1000);
            } else {
                // CREATE new assessment
                response = await assessmentService.createAssessment(assessmentData);
                console.log("✅ Assessment created successfully:", response.data);
                showToast('Assessment created successfully!', 'success');
                // Navigate to assessment list page after creation
                console.log("📍 Navigating to assessment list page");
                setTimeout(() => {
                    window.location.href = listPath;
                }, 1000);
            }

        } catch (error: any) {
            console.error("❌ Failed to save assessment:", error);
            const { showToast } = await import('@/utils/toast');

            // Extract error message from response
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'An unexpected error occurred';

            showToast(errorMessage, 'error');
        }
    };

    // Loading state while fetching assessment for edit
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center w-full h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Loading assessment...</p>
                </div>
            </div>
        );
    }



    return (
        <div className={`flex-1 flex flex-col w-full h-screen bg-background overflow-hidden`}>
            {/* WIZARD PROGRESS HEADER - Optional, can be added if needed */}
            {/* <WizardSteps ... /> */}
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-indigo-500/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] bg-purple-500/5 rounded-full blur-[100px]" />
                <BackgroundShapes />
            </div>

            {/* MAIN CONTAINER */}
            <div className={`relative w-full h-full flex flex-col z-10 perspective-[1000px] ${phase === 'setup' ? 'px-0 md:px-4 py-6' : 'px-0'}`}>
                <AnimatePresence mode='wait'>
                    {phase === 'setup' ? (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full"
                        >
                            <AssessmentSetup
                                config={config}
                                setConfig={setConfig}
                                onNext={() => setPhase('builder')}
                                isEditMode={isEditMode}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="builder"
                            initial={{ opacity: 0, scale: 1.05, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, y: 20 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full"
                        >
                            <AssessmentBuilder
                                config={config}
                                sections={sections}
                                setSections={setSections}
                                onBack={() => setPhase('setup')}
                                onPublish={handlePublish}
                                isEditMode={isEditMode}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- BACKGROUND DECORATION ---
const BackgroundShapes = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.08, 0.05]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
            }}
            className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary rounded-full blur-[120px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.07, 0.05]
            }}
            transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
            }}
            className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px]"
        />
    </div>
);

export default NewAssessmentPage;