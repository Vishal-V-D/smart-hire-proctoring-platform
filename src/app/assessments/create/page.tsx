"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AssessmentConfig, AssessmentSection } from './types';
import AssessmentSetup from './components/AssessmentSetup';
import AssessmentBuilder from './components/AssessmentBuilder';
import { assessmentService } from '@/api/assessmentService';
import { AuthContext } from '@/components/AuthProviderClient';
import { useContext } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useLocalDraft } from '@/hooks/useLocalDraft';

// --- MAIN PAGE COMPONENT ---

const NewAssessmentPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit'); // If present, we're editing
    const isFresh = searchParams.get('fresh') === 'true';
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

    // Use Ref for ID to avoid stale closures
    const savedIdRef = React.useRef<string | null>(editId);

    // Refs for latest data to be accessible by interval
    const configRef = React.useRef(config);
    const sectionsRef = React.useRef(sections);

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Track intentional save to prevent browser warning
    const isIntentionalSaveRef = React.useRef(false);

    // Track last saved data to detect changes
    const lastSavedDataRef = React.useRef<{
        config: AssessmentConfig;
        sections: AssessmentSection[];
    } | null>(null);

    // Helper function to clear ALL assessment drafts from localStorage
    const clearAllAssessmentDrafts = () => {
        const keys = Object.keys(localStorage);
        const draftKeys = keys.filter(key => key.startsWith('assessment_draft_'));
        draftKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log('🧹 Cleared draft:', key);
        });
        console.log(`🧹 Cleared ${draftKeys.length} assessment draft(s) from localStorage`);
    };

    // Sync refs with state
    useEffect(() => {
        configRef.current = config;
        sectionsRef.current = sections;
        if (editId) {
            savedIdRef.current = editId;
        }
    }, [config, sections, editId]);

    // --- LOCAL DRAFT HOOK ---
    // Auto-save to LocalStorage (debounced) whenever config/sections change
    // Key uses editId if available, else 'new'
    const draftKey = `assessment_draft_${editId || 'new'}`;
    const { loadDraft, clearDraft, lastSaved: lastLocalSave } = useLocalDraft(draftKey, { config, sections }, !!(config.title && config.startDate && config.endDate), 500);

    // --- RESTORE DRAFT ON MOUNT ---
    useEffect(() => {
        // If "fresh" start is requested, clear the 'new' draft (if no editId) and don't restore
        if (isFresh && !editId) {
            console.log("🧹 Fresh start requested. Clearing stale draft.");
            clearDraft();

            // Remove 'fresh' from URL so subsequent refreshes work normally (restore user's work)
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('fresh');
            window.history.replaceState({}, '', newUrl.toString());
            return;
        }

        // Only attempt restore if we are NOT editing an existing published assessment (or we check timestamps)
        // For now, let's restore if we find a draft and we are in "create new" mode OR if the draft is for this specific ID.

        const draft = loadDraft();
        if (draft) {
            const { data, timestamp } = draft;

            // formatting helper
            const timeStr = new Date(timestamp).toLocaleTimeString();

            // Simple logic: If we are creating new (no editId), restore immediately.
            // If editing, maybe we should ask? For now, we'll restore if it seems valid.
            // We can check if config has title.
            if (data.config && data.sections) {
                console.log("📥 Restoring local draft from", timeStr);
                const shouldRestore = !editId || confirm(`Found a local unsaved draft from ${timeStr}. Restore it?`);

                if (shouldRestore) {
                    setConfig(data.config);
                    setSections(data.sections);
                    import('@/utils/toast').then(({ showToast }) => {
                        showToast(`Restored draft from ${timeStr}`, 'info');
                    });
                }
            }

        }
    }, [editId, isFresh]); // Run once on mount (or when ID changes)

    // Update last saved visual based on LocalStorage save
    useEffect(() => {
        if (lastLocalSave) {
            setLastSaved(lastLocalSave);
            setSaveStatus('saved');
            // Reset to idle after 2s
            const timer = setTimeout(() => setSaveStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [lastLocalSave]);

    // --- SAVE ON EXIT ---
    useEffect(() => {
        // Removing auto-save on unload to prevent backend spam.
        // LocalStorage handles crash recovery.
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isIntentionalSaveRef.current) return;
            // If dirty, browser will show generic warning if we set returnValue
            // We rely on LocalStorage which is already saved.
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // --- MANUAL SAVE DRAFT FUNCTION ---
    const saveProgressToBackend = async () => {
        // Read from REFS to get latest data
        const currentId = savedIdRef.current;
        const currentConfig = configRef.current;
        const currentSections = sectionsRef.current;

        if (currentConfig.title.trim().length < 3) {
            const { showToast } = await import('@/utils/toast');
            showToast("Please enter a title before saving.", 'warning');
            return;
        }

        if (isSaving) return;

        setIsSaving(true);
        setSaveStatus('saving');
        setSaveError(null);
        try {
            // Transform sections
            const transformedSections = currentSections.map((section, index) => {
                // Separate coding questions from regular questions
                const codingQuestions = (section.questions || []).filter(q => q.type === 'coding' && q.problemId);
                const regularQuestions = (section.questions || []).filter(q => !(q.type === 'coding' && q.problemId));

                return {
                    id: section.id,
                    title: section.title || "Untitled Section",
                    description: section.description || "",
                    type: section.type || 'aptitude',
                    questionCount: section.questionCount || 0,
                    marksPerQuestion: section.marksPerQuestion || 1,
                    timeLimit: section.timeLimit || 0,
                    negativeMarking: section.negativeMarking || 0,
                    difficulty: section.difficulty || 'Medium',
                    enabledPatterns: section.enabledPatterns || [],
                    themeColor: section.themeColor || '#6366f1',
                    orderIndex: index,

                    // All questions (including coding)
                    questions: (section.questions || []).map((q, qIndex) => {
                        const marks = q.marks ?? section.marksPerQuestion ?? 1;
                        return {
                            id: q.id,
                            text: q.text || "",
                            image: q.image || undefined,
                            type: q.type || 'single_choice',
                            options: q.options || [],
                            correctAnswer: q.correctAnswer || undefined,
                            explanation: (q as any).explanation || "",
                            pseudocode: (q as any).pseudocode || "",
                            division: (q as any).division || undefined,
                            subdivision: (q as any).subdivision || undefined,
                            topic: (q as any).topic || undefined,
                            difficulty: (q as any).difficulty || 'Medium',
                            tags: (q as any).tags || [],
                            codeStub: q.codeStub || undefined,
                            problemId: q.problemId || undefined,
                            marks: marks,
                            orderIndex: qIndex
                        };
                    }),

                    // Coding questions (sent separately as 'problems')
                    problems: codingQuestions.map((q, qIndex) => {
                        const marks = q.marks ?? section.marksPerQuestion ?? 1;
                        return {
                            id: q.sectionProblemId || undefined, // SectionProblem UUID for updates (preserve history)
                            problemId: q.problemId, // Required: UUID of the coding problem
                            marks: marks,
                            orderIndex: qIndex,
                            testCaseConfig: q.testCaseConfig || undefined
                        };
                    })
                };
            });

            const assessmentData = {
                title: currentConfig.title.trim(),
                description: currentConfig.description?.trim() || '',
                startDate: currentConfig.startDate ? new Date(currentConfig.startDate).toISOString() : new Date().toISOString(),
                endDate: currentConfig.endDate ? new Date(currentConfig.endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                duration: currentSections.reduce((acc, s) => acc + (s.timeLimit || 0), 0) || 60,
                passPercentage: currentConfig.passPercentage,
                timeMode: 'section' as const,
                globalTime: 0,
                proctoringSettings: currentConfig.proctoring,
                navigationSettings: currentConfig.navigation,
                sections: transformedSections
            };

            console.log('📤 [AUTO-SAVE] Sending assessment data:', {
                title: assessmentData.title,
                sectionsCount: transformedSections.length,
                sections: transformedSections.map(s => ({
                    title: s.title,
                    type: s.type,
                    questionsCount: s.questions.length,
                    problemsCount: s.problems?.length || 0
                }))
            });

            let response;
            if (currentId) {
                // UPDATE existing draft
                response = await assessmentService.updateAssessment(currentId, assessmentData);
                console.log('📝 Updated draft:', currentId);
            } else {
                // CREATE new draft
                response = await assessmentService.createAssessment(assessmentData);
                // Robust ID extraction
                const newId = response.data?.id || response.data?.assessment?.id || response.data?.data?.id;

                if (newId) {
                    savedIdRef.current = newId;
                    console.log('📝 Created new draft:', newId);

                    // Update URL silently so refresh doesn't duplicate
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('edit', newId);
                    window.history.replaceState({}, '', newUrl.toString());
                }
            }

            setSaveStatus('saved');
            // setLastSaved(new Date()); // Handled by LC hook mostly, but this confirms backend sync
            const { showToast } = await import('@/utils/toast');
            showToast("Draft saved to cloud!", 'success');

            // Clear local draft as we are in sync
            clearDraft();

            // Store snapshot of saved data for change detection
            lastSavedDataRef.current = {
                config: { ...currentConfig },
                sections: JSON.parse(JSON.stringify(currentSections))
            };
        } catch (error: any) {
            console.error('❌ Auto-save failed:', error);
            setSaveStatus('error');

            // Robust error message extraction
            let msg = 'Failed to save draft';

            if (error?.response?.data) {
                const data = error.response.data;
                if (data.message) {
                    msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                } else if (data.error) {
                    msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                } else if (typeof data === 'string') {
                    msg = data;
                }
            } else if (error.message) {
                msg = error.message;
            }

            setSaveError(msg);

            // Show toast for the error
            const { showToast } = await import('@/utils/toast');
            showToast(msg, 'error');

        } finally {
            setIsSaving(false);
        }
    };

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
                const loadedSections: AssessmentSection[] = assessment.sections.map((s: any) => {
                    // Map regular questions
                    const regularQuestions = (s.questions || []).map((q: any) => ({
                        id: q.id,
                        text: q.text || "",
                        image: q.image || undefined,
                        type: q.type || 'single_choice',
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation || "",
                        pseudocode: q.pseudocode || "",
                        division: q.division || undefined,
                        subdivision: q.subdivision || undefined,
                        topic: q.topic || undefined,
                        difficulty: q.difficulty || 'Medium',
                        tags: q.tags || [],
                        codeStub: q.codeStub || undefined,
                        marks: q.marks ?? 1,
                        orderIndex: q.orderIndex || 0,
                    }));

                    // Map coding problems (from separate 'problems' array)
                    const codingProblems = (s.problems || []).map((p: any) => ({
                        id: p.id, // This is the question ID in frontend
                        type: 'coding' as const,
                        text: p.problem?.title || p.problemData?.title || "Coding Problem",
                        problemId: p.problemId, // UUID of the coding problem
                        sectionProblemId: p.id, // SectionProblem UUID (for updates)
                        problemData: p.problem || p.problemData || undefined,
                        marks: p.marks ?? 1,
                        orderIndex: p.orderIndex || 0,
                        testCaseConfig: p.testCaseConfig || undefined,
                    }));

                    // Merge both arrays and sort by orderIndex
                    const allQuestions = [...regularQuestions, ...codingProblems].sort((a, b) => a.orderIndex - b.orderIndex);

                    return {
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
                        questions: allQuestions
                    };
                });
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
            // Mark this as intentional save to prevent browser warning
            isIntentionalSaveRef.current = true;

            console.log("📤 Publishing Assessment:", { config, sections, isEditMode });

            // Show loading toast
            const { showToast } = await import('@/utils/toast');

            // Determine if we are updating (either Edit Mode OR we have auto-saved already)
            const targetId = editId || savedIdRef.current;
            const isUpdating = !!targetId;

            showToast(isUpdating ? 'Updating assessment...' : 'Creating assessment...', 'info');

            // Transform sections to match backend API format
            const transformedSections = sections.map((section, index) => {
                // Separate coding questions for the 'problems' array (legacy/specific handling)
                const codingQuestions = (section.questions || []).filter(q => q.type === 'coding' && q.problemId);

                // IMPORTANT: For CREATION, we must pass coding questions in the main 'questions' array too
                // The backend likely expects them there to create the initial link.
                // We keep them in 'problems' as well for updates/metadata.
                const allQuestions = section.questions || [];

                return {
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

                    // All questions (including coding)
                    questions: allQuestions.map((q, qIndex) => {
                        const marks = q.marks ?? section.marksPerQuestion;
                        return {
                            id: q.id,
                            text: q.text,
                            image: q.image || undefined,
                            type: q.type,
                            options: q.options || undefined,
                            correctAnswer: q.correctAnswer || undefined,
                            explanation: (q as any).explanation || undefined,
                            pseudocode: (q as any).pseudocode || undefined,
                            division: (q as any).division || undefined,
                            subdivision: (q as any).subdivision || undefined,
                            topic: (q as any).topic || undefined,
                            difficulty: (q as any).difficulty || undefined,
                            tags: (q as any).tags || undefined,
                            codeStub: q.codeStub || undefined,
                            problemId: q.problemId || undefined, // Include problemId for coding questions
                            marks: marks,
                            orderIndex: qIndex
                        };
                    }),

                    // Coding questions (sent separately as 'problems' for testCaseConfig and update support)
                    problems: codingQuestions.map((q, qIndex) => {
                        const marks = q.marks ?? section.marksPerQuestion;
                        return {
                            id: q.sectionProblemId || undefined, // SectionProblem UUID for updates (preserve history)
                            problemId: q.problemId, // Required: UUID of the coding problem
                            marks: marks,
                            orderIndex: qIndex,
                            testCaseConfig: q.testCaseConfig || undefined
                        };
                    })
                };
            });

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
            if (isUpdating && targetId) {
                // UPDATE existing assessment (or draft)
                response = await assessmentService.updateAssessment(targetId, assessmentData);
                console.log("✅ Assessment updated successfully:", response.data);
                showToast('Assessment updated successfully!', 'success');

                // Clear ALL assessment drafts from localStorage
                clearAllAssessmentDrafts();

                setTimeout(() => {
                    // If true edit mode, maybe go to details? For now, list page is safe default for both flow.
                    // Or follow existing pattern:
                    window.location.href = listPath;
                }, 1000);
            } else {
                // CREATE new assessment (fallback)
                response = await assessmentService.createAssessment(assessmentData);
                console.log("✅ Assessment created successfully:", response.data);
                showToast('Assessment created successfully!', 'success');

                // Clear ALL assessment drafts from localStorage to prevent stale data
                clearAllAssessmentDrafts();

                // Navigate to assessment list page after creation
                console.log("📍 Navigating to assessment list page");
                setTimeout(() => {
                    window.location.href = listPath;
                }, 1000);
            }

        } catch (error: any) {
            console.error("❌ Failed to save assessment:", error);
            const { showToast } = await import('@/utils/toast');

            // Robust error message extraction
            let errorMessage = 'An unexpected error occurred';

            if (error?.response?.data) {
                const data = error.response.data;
                // Check if message is directly in data
                if (data.message) {
                    errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                } else if (data.error) {
                    // Sometimes error is the field
                    errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                } else if (typeof data === 'string') {
                    // Sometimes the body is just a string
                    errorMessage = data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

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

                {/* SAVE STATUS INDICATOR */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-sm text-xs font-medium text-muted-foreground transition-all hover:bg-background/90">
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 className="animate-spin text-primary" size={12} />
                            <span className="text-primary">Saving...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-600">Saved {lastSaved?.toLocaleTimeString()}</span>
                        </>
                    )}
                    {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 text-destructive" title={saveError || 'Save Failed'}>
                            <AlertCircle size={12} />
                            <span>{saveError || 'Save Failed'}</span>
                        </div>
                    )}
                    {saveStatus === 'idle' && !lastSaved && (
                        <span className="text-muted-foreground/50">Draft - Unsaved</span>
                    )}
                    {saveStatus === 'idle' && lastSaved && (
                        <span className="text-muted-foreground/70">Saved {lastSaved.toLocaleTimeString()}</span>
                    )}
                </div>

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
                                onSaveDraft={saveProgressToBackend}
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