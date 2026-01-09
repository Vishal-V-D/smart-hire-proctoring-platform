"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
    Send, AlertTriangle, Maximize, Play, CheckCircle2,
    Clock, ChevronLeft, ChevronRight, Terminal, FileText,
    Code, Loader2, XCircle, AlertCircle, LayoutList,
    History, Cpu, Sun, Moon, RotateCcw, Trophy
} from "lucide-react";
import { contestService } from "../../api/contestService";
import { submissionService, type SubmissionResponse } from "../../api/submissionService";
import { showToast } from "../../utils/toast";
import { WebcamOverlay } from "../../components/WebcamOverlay";
import { getUserId } from "../../utils/userUtils";
import { ProctoringSettings, DEFAULT_PROCTORING_SETTINGS } from "../../types/proctoring";
import { useSecureContestTimer } from "../../hooks/useSecureContestTimer";

// ==================== TYPES ====================
interface TestCase {
    input: string;
    output?: string;
    expectedOutput?: string;
    isHidden?: boolean;
    explanation?: string;
}

interface Example {
    input: string;
    output: string;
    explanation?: string;
    imageUrl?: string;
}

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'EASY' | 'MEDIUM' | 'HARD';
    testcases?: TestCase[];
    testCases?: TestCase[]; // Handle both casing
    examples?: Example[];
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    additionalInfo?: string;
    timeLimit?: number;
    memoryLimit?: number;
    imageUrl?: string;
}

interface SecureContestPageProps {
    contestId?: string;
    violationCount?: number;
    setViolationCount?: React.Dispatch<React.SetStateAction<number>>;
    mediaStream?: MediaStream | null;
    proctoringSettings?: ProctoringSettings;
    onSubmit?: () => void;
}

// ==================== STYLES ====================
const globalStyles = `
    body.secure-mode #main-navbar,
    body.secure-mode nav,
    body.secure-mode .navbar,
    body.secure-mode header:not(.secure-header) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
    }
    body.secure-mode { padding-top: 0 !important; margin-top: 0 !important; }
    
    /* Custom Scrollbar */
    .modern-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .modern-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .modern-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 3px; }
    .modern-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.8); }
    
    /* Smooth transitions for content loading */
    .content-fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .animate-pulse-slow {
        animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
`;

// ==================== CONSTANTS ====================
const LANGUAGES = [
    { id: 'python', name: 'Python 3' },
    { id: 'cpp', name: 'C++' },
    { id: 'java', name: 'Java' },
    { id: 'javascript', name: 'JavaScript' },
];

const CODE_TEMPLATES: Record<string, string> = {
    python: `# Your solution here\n\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
    javascript: `// Your solution here\n\n`,
};

// ==================== MAIN COMPONENT ====================
export default function SecureContestPage({
    contestId,
    violationCount = 0,
    setViolationCount,
    mediaStream,
    proctoringSettings = DEFAULT_PROCTORING_SETTINGS,
    onSubmit
}: SecureContestPageProps) {
    console.log('🔍 [SecureContestPage] Props:', { contestId, violationCount, proctoringSettings });
    const router = useRouter();
    const navigate = (path: string) => router.push(path);

    // Core state
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<any>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Theme state
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Session state
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    // Removed local sessionFinished state; using hook's sessionFinished
    const [elapsedTime, setElapsedTime] = useState(0);

    // Editor state
    const [language, setLanguage] = useState('python');
    const [codeByProblem, setCodeByProblem] = useState<Record<string, Record<string, string>>>({});

    // Execution state
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);

    // UI state
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(35);

    // Restore layout function
    const restoreLayout = useCallback(() => {
        setLeftPanelWidth(50);
        setBottomPanelHeight(35);
        showToast("Layout restored", "success");
    }, []);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [showFullscreenViolation, setShowFullscreenViolation] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    // Tabs State
    const [descTab, setDescTab] = useState<"Description" | "Submissions">("Description");
    const [testTab, setTestTab] = useState<"TestCases" | "TestResults">("TestCases");
    const [activeTestCaseId, setActiveTestCaseId] = useState(0);

    // Submissions History State
    const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Face Recognition State
    const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');

    // Auth Status State
    const [showLoginRequired, setShowLoginRequired] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const editorRef = useRef<any>(null);

    const currentProblem = problems[currentProblemIndex];

    // Fetch user photo for face recognition
    useEffect(() => {
        const fetchUserPhoto = async () => {
            try {
                const userId = getUserId();

                console.log('📸 [USER-PHOTO] Fetching photo...', {
                    userId,
                    contestId
                });

                if (!userId) {
                    console.error('❌ [USER-PHOTO] No userId found');
                    return;
                }

                if (!contestId) {
                    console.error('❌ [USER-PHOTO] No contestId provided');
                    return;
                }

                const response = await contestService.getContestRegistrationPhoto(contestId, userId);
                const photoUrl = response.data.photoUrl || response.data.optimizedUrl;
                setUserPhotoUrl(photoUrl);
                console.log('✅ [USER-PHOTO] Photo URL loaded:', photoUrl);
            } catch (error) {
                console.error('❌ [USER-PHOTO] Failed to fetch:', error);
                if (error instanceof Error) {
                    console.error('📋 [USER-PHOTO] Error details:', error.message);
                }
            }
        };

        fetchUserPhoto();
    }, [contestId]);

    // ==================== LOAD DATA ====================
    useEffect(() => {
        const loadContestData = async () => {
            if (!contestId) return;
            try {
                setLoading(true);
                const res = await contestService.getContestById(contestId);
                const contestData = res.data;
                setContest(contestData);

                // Fetch Leaderboard Config
                try {
                    const lbConfig = await contestService.getLeaderboardConfig(contestId);
                    if (lbConfig.data) {
                        setShowLeaderboard(lbConfig.data.showSecureLeaderboard);
                    }
                } catch (e) {
                    console.warn("Failed to fetch leaderboard config", e);
                }

                const problemList = (contestData.contestProblems || []).map((cp: any) => cp.problem || cp);

                // Fetch full details for all problems in parallel to get test cases immediately
                const fullProblemsPromises = problemList.map(async (problem: Problem) => {
                    try {
                        // Check if problem already has test cases
                        const hasTestCases = (problem.testcases?.length || 0) > 0 || (problem.testCases?.length || 0) > 0;

                        if (!hasTestCases && problem.id) {
                            const fullProblemRes = await contestService.getProblem(problem.id);
                            return { ...problem, ...fullProblemRes.data };
                        }
                        return problem;
                    } catch (err) {
                        console.error(`Failed to fetch full details for problem ${problem.id}:`, err);
                        return problem; // Return original problem if fetch fails
                    }
                });

                const fullProblems = await Promise.all(fullProblemsPromises);
                setProblems(fullProblems);

                // Load saved code
                const savedCode = localStorage.getItem(`secure_code_${contestId}`);
                if (savedCode) try { setCodeByProblem(JSON.parse(savedCode)); } catch { }
            } catch (err) {
                console.error("Failed to load contest:", err);
                showToast("Failed to load contest data", "error");
            } finally {
                setLoading(false);
            }
        };
        loadContestData();
    }, [contestId]);

    // Added: Fetch individual problem details if missing when selected
    useEffect(() => {
        const ensureProblemDetails = async () => {
            if (!problems[currentProblemIndex]) return;
            const current = problems[currentProblemIndex];

            // If problem has no description/test cases but has an ID, fetch it
            const isMissingDetails = !current.description || (!current.testcases && !current.testCases);

            if (isMissingDetails && current.id) {
                console.log(`⚠️ [PROBLEM-FETCH] Problem ${current.id} missing details, fetching...`);
                try {
                    const res = await contestService.getProblem(current.id);
                    if (res.data) {
                        const updatedProblem = { ...current, ...res.data };
                        console.log(`✅ [PROBLEM-FETCH] Fetched details for ${current.id}`);

                        setProblems(prev => {
                            const newProblems = [...prev];
                            newProblems[currentProblemIndex] = updatedProblem;
                            return newProblems;
                        });
                    }
                } catch (err) {
                    console.error(`❌ [PROBLEM-FETCH] Failed to fetch problem ${current.id}:`, err);
                }
            }
        };

        ensureProblemDetails();
    }, [currentProblemIndex, problems[currentProblemIndex]?.id]);


    // ==================== TIMER HOOK ====================
    // Ref to hold the auto-submit handler to avoid circular dependency
    const onExpireRef = useRef<() => void>(() => { });

    // Stable onExpire callback passed to hook
    const onExpireStable = useCallback(() => {
        onExpireRef.current();
    }, []);

    // Use Custom Hook
    const {
        timerData,
        elapsedTime: hookElapsedTime,
        sessionStarted: hookSessionStarted,
        sessionFinished,
        setSessionFinished,
        formatRemainingTime,
        getTimerColor
    } = useSecureContestTimer({
        contestId,
        onExpire: onExpireStable
    });

    // Auto-submit handler (defined after hook to access sessionFinished)
    const handleAutoSubmit = useCallback(async () => {
        if (sessionFinished) {
            return;
        }

        setShowAutoSubmitModal(true);

        // Don't auto-submit if we just finished manually (race condition guard)
        if (sessionFinished) return;

        try {
            await contestService.submitAll(contestId as string);
        } catch (err) {
            console.error("Auto-submit failed:", err);
        }
    }, [contestId, sessionFinished]);

    // Update ref when handler changes
    useEffect(() => {
        onExpireRef.current = handleAutoSubmit;
    }, [handleAutoSubmit]);

    // Sync hook state to local state
    useEffect(() => {
        setSessionStarted(hookSessionStarted);
    }, [hookSessionStarted]);

    useEffect(() => {
        setElapsedTime(hookElapsedTime);
    }, [hookElapsedTime]);

    // Manual Finish handler
    const handleFinishContest = async () => {
        if (!contestId) return;
        try {
            await contestService.finishContest(contestId);
            setSessionFinished(true);
            navigate('/');
            showToast("Contest finished successfully", "success");
        } catch (err) {
            console.error("Finish failed:", err);
            showToast("Failed to finish contest", "error");
        }
    };


    // Auth Check
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await contestService.getMe();
                const user = response.data;
                console.log('🔐 [AUTH-CHECK] User authenticated:', user?.username, 'Role:', user?.role);
                setCurrentUser(user);
                setShowLoginRequired(false);
            } catch (error: any) {
                console.error('❌ [AUTH-CHECK] Auth check failed:', error.response?.status, error.response?.data?.message);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.warn('⚠️ [AUTH-CHECK] User not authenticated - showing login prompt');
                    setShowLoginRequired(true);
                }
            }
        };

        // Check immediately on mount
        checkAuthStatus();

        // Then check every 30 seconds
        const authCheckInterval = setInterval(checkAuthStatus, 30000);

        return () => clearInterval(authCheckInterval);
    }, []);

    // Handle login redirect
    const handleLoginRedirect = () => {
        sessionStorage.removeItem('secureContestMode');
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    };

    // Format elapsed time as HH:MM:SS or MM:SS
    const formatElapsedTime = useCallback((seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Load submissions when switching to Submissions tab
    useEffect(() => {
        if (descTab === "Submissions" && currentProblem?.id) {
            setLoadingSubmissions(true);
            submissionService.getSubmissionsByProblem(currentProblem.id, 1, 20)
                .then(res => {
                    const data = res.data.submissions || (res.data as any).data || [];
                    setSubmissions(Array.isArray(data) ? data : []);
                })
                .catch(err => console.error("Failed to fetch submissions:", err))
                .finally(() => setLoadingSubmissions(false));
        }
    }, [descTab, currentProblem?.id]);

    // Switch to TestResults tab on run/submit
    useEffect(() => {
        if (isRunning || isSubmitting || submissionResult) {
            setTestTab("TestResults");
        }
    }, [isRunning, isSubmitting, submissionResult]);

    // Reset tabs on problem change
    useEffect(() => {
        setDescTab("Description");
        setTestTab("TestCases");
        setActiveTestCaseId(0);
        setSubmissionResult(null);
    }, [currentProblemIndex]);

    // ==================== SECURITY SETUP ====================
    useEffect(() => {
        document.body.classList.add('secure-mode');
        sessionStorage.setItem('secureContestMode', 'true');
        const style = document.createElement('style');
        style.id = 'secure-styles';
        style.textContent = globalStyles;
        document.head.appendChild(style);
        return () => {
            document.body.classList.remove('secure-mode');
            document.getElementById('secure-styles')?.remove();
        };
    }, []);

    useEffect(() => {
        if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(console.error);
        }
    }, [mediaStream]);

    // Violation Handler
    const handleViolation = useCallback((message: string, type: string) => {
        showToast(message, "error");
        setViolationCount?.(prev => prev + 1);
        contestId && contestService.reportViolation(contestId, {
            type, metadata: { message, timestamp: Date.now() }
        }).catch(console.error);
    }, [contestId, setViolationCount]);

    // Fullscreen monitoring - ONLY if enabled
    // Fullscreen & Focus monitoring - STRICT MODE
    useEffect(() => {
        // Skip only if strictly disabled (default is enabled for secure contest)
        if (proctoringSettings.enableFullscreenMode === false) {
            console.log('🔓 [PROCTORING] Fullscreen mode is disabled');
            return;
        }

        const handleFsChange = () => {
            const nowFs = !!document.fullscreenElement;
            setIsFullscreen(nowFs);
            if (!nowFs) {
                setShowFullscreenViolation(true);
                handleViolation("⚠️ Exited secure fullscreen environment!", 'FULLSCREEN_EXIT');
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setShowFullscreenViolation(true);
                handleViolation("⚠️ Tab switch/hidden detected!", 'TAB_SWITCH');
            }
        };

        // Also block when window loses focus (alt-tab)
        const handleBlur = () => {
            if (document.fullscreenElement) {
                // only trigger if we expect to be in fullscreen
                // might be redundant with visibilitychange but ensures strictness
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [proctoringSettings.enableFullscreenMode, handleViolation]);

    // Security event blocking - conditional based on proctoring settings
    useEffect(() => {
        console.log('🔐 [SECURITY] Setting up event blockers:', {
            copyPasteEnabled: proctoringSettings.enableCopyPasteDetection
        });

        const blockEvent = (e: Event, msg: string, type: string) => {
            e.preventDefault();
            e.stopPropagation();
            handleViolation(msg, type);
            return false;
        };

        // DevTools and Escape blocking - always on
        const onKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            // DevTools blocking - always on for security
            if (e.key === 'F12' || (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (ctrl && key === 'u')) {
                return blockEvent(e, "⚠️ DevTools blocked!", 'DEVTOOLS');
            }

            // Escape key prevention - always on
            if (e.key === 'Escape') {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('keydown', onKeyDown, true);

        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [handleViolation]);

    // Copy/Paste blocking - ONLY if enabled in proctoring settings
    useEffect(() => {
        // Skip adding listeners if copy/paste detection is disabled
        if (!proctoringSettings.enableCopyPasteDetection) {
            console.log(' [SECURITY] Copy/paste detection DISABLED - not adding blockers');
            return;
        }

        console.log('🔒 [SECURITY] Copy/paste detection ENABLED - adding blockers');

        const blockCopyPaste = (e: Event, msg: string) => {
            e.preventDefault();
            e.stopPropagation();
            handleViolation(msg, 'CLIPBOARD');
            return false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            if (ctrl && ['c', 'v', 'x'].includes(key)) {
                return blockCopyPaste(e, `⚠️ ${key.toUpperCase()} blocked!`);
            }
        };

        const onCopy = (e: Event) => blockCopyPaste(e, "⚠️ Copy blocked!");
        const onPaste = (e: Event) => blockCopyPaste(e, "⚠️ Paste blocked!");
        const onCut = (e: Event) => blockCopyPaste(e, "⚠️ Cut blocked!");
        const onContext = (e: Event) => blockCopyPaste(e, "⚠️ Right-click blocked!");

        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('copy', onCopy, true);
        document.addEventListener('paste', onPaste, true);
        document.addEventListener('cut', onCut, true);
        document.addEventListener('contextmenu', onContext, true);

        return () => {
            console.log('🔐 [SECURITY] Removing copy/paste blockers');
            document.removeEventListener('keydown', onKeyDown, true);
            document.removeEventListener('copy', onCopy, true);
            document.removeEventListener('paste', onPaste, true);
            document.removeEventListener('cut', onCut, true);
            document.removeEventListener('contextmenu', onContext, true);
        };
    }, [handleViolation, proctoringSettings.enableCopyPasteDetection]);

    // ==================== CODE MANAGEMENT ====================
    const getCurrentCode = useCallback(() => {
        if (!currentProblem) return CODE_TEMPLATES[language] || '';
        return codeByProblem[currentProblem.id]?.[language] || CODE_TEMPLATES[language] || '';
    }, [currentProblem, language, codeByProblem]);

    const handleCodeChange = useCallback((value: string | undefined) => {
        if (!currentProblem || !value) return;
        setCodeByProblem(prev => {
            const updated = { ...prev, [currentProblem.id]: { ...(prev[currentProblem.id] || {}), [language]: value } };
            localStorage.setItem(`secure_code_${contestId}`, JSON.stringify(updated));
            return updated;
        });
    }, [currentProblem, language, contestId]);

    // ==================== RUN & SUBMIT ====================
    const handleRun = async () => {
        if (!currentProblem?.id || isRunning || isSubmitting) return;
        setIsRunning(true);
        setTestTab('TestResults');
        setSubmissionResult(null);
        try {
            const response = await submissionService.runCode({
                problemId: currentProblem.id,
                language: language,
                code: getCurrentCode(),
            });
            const result = response.data?.result || response.data;
            setSubmissionResult({
                id: 'run-' + Date.now(),
                status: result.status || 'COMPLETED',
                passedTests: result.passedTests,
                totalTests: result.totalTests,
                executionTime: result.executionTime,
                memoryUsed: result.memoryUsed,
                output: result.output,
                testResults: result.testResults,
            } as any);
        } catch (error: any) {
            console.error("Run failed:", error);
            showToast("Run failed: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!currentProblem?.id || isRunning || isSubmitting) return;
        setIsSubmitting(true);
        setTestTab('TestResults');
        setSubmissionResult(null);
        try {
            const response = await submissionService.createSubmission({
                problemId: currentProblem.id,
                language: language,
                code: getCurrentCode(),
                contestId: contestId || 'practice',
            });
            const submissionId = response.data?.id || response.data?.submissionId;
            if (submissionId) await pollSubmitStatus(submissionId);
        } catch (error: any) {
            console.error("Submit failed:", error);
            showToast("Submission failed: " + (error.message || "Unknown error"), "error");
            setIsSubmitting(false);
        }
    };

    // Handle finishing the entire assessment
    const handleFinishAssessment = async () => {
        if (!contestId || sessionFinished) {
            console.log('⚠️ [SUBMIT-ALL] Skipped:', { contestId, sessionFinished });
            return;
        }

        setIsSubmitting(true);
        console.log('🚀 [SUBMIT-ALL] Starting submission...');
        console.log('📝 [SUBMIT-ALL] Contest ID:', contestId);

        // ✅ Check if token exists before making the API call
        let token = localStorage.getItem('token');
        console.log('🔐 [SUBMIT-ALL] Token from localStorage:', token ? `✓ (${token.substring(0, 20)}...)` : '✗ MISSING');

        // Try to get from cookies if not in localStorage
        if (!token) {
            const Cookies = await import('js-cookie');
            const cookieToken = Cookies.default.get('token');
            console.log('🍪 [SUBMIT-ALL] Token from cookies:', cookieToken ? `✓ (${cookieToken.substring(0, 20)}...)` : '✗ MISSING');

            if (cookieToken) {
                token = cookieToken;
                localStorage.setItem('token', cookieToken);
                console.log('✅ [SUBMIT-ALL] Synced token from cookies to localStorage');
            }
        }

        if (!token) {
            console.error('❌ [SUBMIT-ALL] No auth token found! Cannot submit.');
            showToast("Session expired. Please login again to submit.", "error");
            // Don't trigger logout, just show error
            return;
        }

        try {
            // ✅ Call SUBMIT-ALL endpoint (evaluates all submissions + finishes session)
            console.log('📤 [SUBMIT-ALL] Calling: POST /api/contests/' + contestId + '/submit-all');
            const response = await contestService.submitAll(contestId);
            console.log('✅ [SUBMIT-ALL] Response received:', response);
            console.log('✅ [SUBMIT-ALL] Response data:', response.data);

            const result = response.data;

            // Update localStorage with session completion data
            const sessionKey = `contest_session_${contestId}`;
            const savedSession = localStorage.getItem(sessionKey);
            if (savedSession) {
                const session = JSON.parse(savedSession);
                session.finishedAt = result.session?.finishedAt || new Date().toISOString();
                session.isActive = false;
                session.scoring = result.scoring;
                localStorage.setItem(sessionKey, JSON.stringify(session));
                console.log('💾 [SUBMIT-ALL] Session updated in localStorage:', session);
            }

            setSessionFinished(true);

            // Store result data and show result modal
            setResultData(result);
            setShowResultModal(true);
            console.log('🎉 [SUBMIT-ALL] Assessment submitted successfully!');
            console.log('📊 [SUBMIT-ALL] Result:', result);

        } catch (error: any) {
            console.error('❌ [SUBMIT-ALL] Failed to finish assessment');
            console.error('❌ [SUBMIT-ALL] Error:', error);
            console.error('❌ [SUBMIT-ALL] Error response:', error.response);
            console.error('❌ [SUBMIT-ALL] Error response data:', error.response?.data);
            console.error('❌ [SUBMIT-ALL] Error status:', error.response?.status);
            console.error('❌ [SUBMIT-ALL] Error message:', error.response?.data?.message || error.message);

            const errorMsg = error.response?.data?.message || error.message;

            // ✅ Handle "Contest already submitted" - redirect to feedback
            if (errorMsg?.toLowerCase().includes('already submitted')) {
                console.log('📝 [SUBMIT-ALL] Contest already submitted - redirecting to feedback');
                showToast("Contest already submitted! Redirecting to feedback...", "info");
                setSessionFinished(true);
                sessionStorage.removeItem('secureContestMode');

                // Mark session as finished in localStorage
                const sessionKey = `contest_session_${contestId}`;
                const savedSession = localStorage.getItem(sessionKey);
                if (savedSession) {
                    const session = JSON.parse(savedSession);
                    session.finishedAt = new Date().toISOString();
                    session.isActive = false;
                    localStorage.setItem(sessionKey, JSON.stringify(session));
                }

                // Redirect to feedback page
                setTimeout(() => navigate('/feedback'), 1000);
                return;
            }

            // Show error but don't trigger page redirect during secure contest
            if (error.response?.status === 403 || error.response?.status === 401) {
                showToast("Auth error: " + errorMsg + ". Try refreshing the page.", "error");
            } else {
                showToast("Failed to submit assessment: " + errorMsg, "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle navigation to feedback page after viewing results
    const handleGoToFeedback = () => {
        setShowResultModal(false);
        sessionStorage.removeItem('secureContestMode');

        // Call custom onSubmit if provided, otherwise default behavior
        if (onSubmit) {
            onSubmit();
        } else {
            navigate('/feedback');
        }
    };

    const pollSubmitStatus = async (submissionId: string) => {
        const maxPolls = 60;
        let polls = 0;
        const poll = async () => {
            try {
                const response = await submissionService.getSubmissionById(submissionId);

                const result = response.data;
                if (result.status !== "PENDING" && result.status !== "RUNNING") {
                    setSubmissionResult(result);
                    setIsSubmitting(false);
                    if (result.status === 'AC' || result.status === 'ACCEPTED') showToast("✓ Accepted!", "success");
                } else if (polls >= maxPolls) {
                    setIsSubmitting(false);
                    showToast("Submission is still processing. Check history later.", "info");
                    return;
                } else {
                    polls++;
                    setTimeout(poll, 2000);
                }
            } catch (err) {
                console.error("Poll error:", err);
                setIsSubmitting(false);
            }
        };
        poll();
    };

    // ==================== RENDER HELPERS ====================
    const getDifficultyColor = (diff: string) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AC': case 'ACCEPTED': return 'text-green-400';
            case 'WA': case 'WRONG_ANSWER': return 'text-red-400';
            case 'TLE': case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-400';
            case 'MLE': case 'MEMORY_LIMIT_EXCEEDED': return 'text-yellow-400';
            case 'RE': case 'RUNTIME_ERROR': return 'text-orange-400';
            case 'CE': case 'COMPILATION_ERROR': return 'text-orange-400';
            case 'PENDING': case 'RUNNING': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    // Colors
    const bgMain = theme === 'dark' ? 'bg-[#0f111a]' : 'bg-gray-50';
    const bgSec = theme === 'dark' ? 'bg-[#1a1d2d]' : 'bg-white';
    const borderCol = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
    const textMain = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    const textSec = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    if (loading) {
        return (
            <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
                    <p className={textSec}>Preparing secure environment...</p>
                </div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className={`min-h-screen ${bgMain} flex items-center justify-center p-4`}>
                <div className={`${bgSec} p-8 rounded-xl border ${borderCol} max-w-md w-full text-center space-y-4`}>
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className={`text-2xl font-bold ${textMain}`}>Connection Failed</h2>
                    <p className={textSec}>Unable to load assessment securely. Please check your connection.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors border border-cyan-500/20"
                    >
                        Retry Connection
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className={`block w-full px-6 py-2 ${textSec} hover:text-white transition-colors`}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ==================== RENDER ====================
    return (
        <div className={`flex flex-col h-screen ${bgMain} ${textMain} overflow-hidden font-sans select-none`}>
            {/* SECURITY OVERLAY - Always on top */}
            <div className="fixed inset-0 pointer-events-none z-50 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />

            {/* HEADER */}
            <header className={`secure-header h-12 ${bgSec} border-b ${borderCol} flex items-center justify-between px-4 shrink-0 transition-colors duration-200 z-40`}>
                {/* Left: Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Code className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-lg hidden sm:block">
                            Quantum<span className="text-cyan-500">Judge</span>
                        </span>
                    </div>
                    <div className={`h-6 w-px ${borderCol} mx-2`} />
                    <div className="flex items-center gap-2 max-w-md overflow-hidden">
                        <h1 className="font-medium truncate" title={contest.title}>{contest.title}</h1>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bgMain} ${borderCol} border ${textSec}`}>
                            Secure Mode
                        </span>
                    </div>
                </div>

                {/* Center: Timer & Progress */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                    {/* Problems Nav */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentProblemIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentProblemIndex === 0}
                            className={`p-1 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors ${textSec}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className={`text-sm font-mono ${textSec}`}>
                            {currentProblemIndex + 1} / {problems.length}
                        </span>
                        <button
                            onClick={() => setCurrentProblemIndex(prev => Math.min(problems.length - 1, prev + 1))}
                            disabled={currentProblemIndex === problems.length - 1}
                            className={`p-1 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors ${textSec}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${timerData?.remainingSeconds !== undefined && timerData.remainingSeconds < 300 ? 'bg-red-500/10 border-red-500/30 animate-pulse' : `${bgMain} ${borderCol}`}`}>
                        {/* Always show elapsed time */}
                        <div className="flex items-center gap-2 text-sm font-mono text-cyan-400" title="Time Elapsed">
                            <Clock className="w-4 h-4" />
                            <span>{formatElapsedTime(elapsedTime)}</span>
                        </div>

                        {/* Show remaining time if available (for timed contests) */}
                        {timerData?.remainingSeconds !== undefined && (
                            <>
                                <div className={`w-px h-4 ${borderCol}`} />
                                <div className={`flex items-center gap-2 text-sm font-mono ${getTimerColor(timerData.remainingSeconds)}`} title="Time Remaining">
                                    <History className="w-4 h-4" />
                                    <span>{formatRemainingTime(timerData.remainingSeconds)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        className={`p-2 rounded-lg hover:bg-gray-800 transition-colors relative group ${textSec}`}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Finish Button */}
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-medium rounded-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Finish Assessment
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT: Description Panel */}
                <div
                    className={`border-r ${borderCol} flex flex-col ${bgMain} overflow-hidden transition-colors duration-200 relative z-10`}
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    {/* Tabs */}
                    <div className={`flex items-center border-b ${borderCol} ${bgSec}`}>
                        <button
                            onClick={() => setDescTab("Description")}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${descTab === "Description" ? 'border-cyan-500 text-cyan-400' : 'border-transparent ' + textSec + ' hover:' + textMain}`}
                        >
                            <FileText className="w-4 h-4" />
                            Description
                        </button>
                        <button
                            onClick={() => setDescTab("Submissions")}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${descTab === "Submissions" ? 'border-cyan-500 text-cyan-400' : 'border-transparent ' + textSec + ' hover:' + textMain}`}
                        >
                            <History className="w-4 h-4" />
                            Submissions
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto modern-scrollbar p-6">
                        {descTab === "Description" && currentProblem ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Problem Header */}
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <h2 className={`text-2xl font-bold ${textMain}`}>{currentProblemIndex + 1}. {currentProblem.title}</h2>
                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getDifficultyColor(currentProblem.difficulty)}`}>
                                            {currentProblem.difficulty}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Cpu className="w-3.5 h-3.5" />
                                            Time: {currentProblem.timeLimit || 1.0}s
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <LayoutList className="w-3.5 h-3.5" />
                                            Memory: {currentProblem.memoryLimit || 256}MB
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div
                                        className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none text-sm leading-relaxed ${textSec}`}
                                        dangerouslySetInnerHTML={{ __html: currentProblem.description }}
                                    />

                                    {currentProblem.imageUrl && (
                                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-700/50">
                                            <img src={currentProblem.imageUrl} alt="Problem Illustration" className="w-full h-auto" />
                                        </div>
                                    )}
                                </div>

                                {/* Examples */}
                                {currentProblem.examples && currentProblem.examples.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className={`text-sm font-semibold uppercase tracking-wider ${textSec}`}>Examples</h3>
                                        <div className="grid gap-4">
                                            {currentProblem.examples.map((ex, i) => (
                                                <div key={i} className={`rounded-lg border ${borderCol} overflow-hidden bg-gray-900/30`}>
                                                    <div className="grid md:grid-cols-2 gap-px bg-gray-800/50">
                                                        <div className="p-3 space-y-1.5 bg-[#0f111a]">
                                                            <span className="text-xs uppercase text-gray-500 font-semibold">Input</span>
                                                            <pre className={`text-sm font-mono ${textMain} whitespace-pre-wrap`}>{ex.input}</pre>
                                                        </div>
                                                        <div className="p-3 space-y-1.5 bg-[#0f111a]">
                                                            <span className="text-xs uppercase text-gray-500 font-semibold">Output</span>
                                                            <pre className={`text-sm font-mono ${textMain} whitespace-pre-wrap`}>{ex.output}</pre>
                                                        </div>
                                                    </div>
                                                    {ex.explanation && (
                                                        <div className="p-3 border-t border-gray-800/50 bg-gray-900/20">
                                                            <span className="text-xs uppercase text-gray-500 font-semibold block mb-1">Explanation</span>
                                                            <p className={`text-sm ${textSec}`}>{ex.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Constraints & Format */}
                                <div className="grid gap-6 md:grid-cols-2">
                                    {currentProblem.constraints && (
                                        <div className="space-y-2">
                                            <h3 className={`text-sm font-semibold uppercase tracking-wider ${textSec}`}>Constraints</h3>
                                            <div
                                                className={`text-sm ${textSec} space-y-1`}
                                                dangerouslySetInnerHTML={{ __html: currentProblem.constraints }}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {currentProblem.inputFormat && (
                                            <div className="space-y-2">
                                                <h3 className={`text-sm font-semibold uppercase tracking-wider ${textSec}`}>Input Format</h3>
                                                <div className={`text-sm ${textSec}`} dangerouslySetInnerHTML={{ __html: currentProblem.inputFormat }} />
                                            </div>
                                        )}
                                        {currentProblem.outputFormat && (
                                            <div className="space-y-2">
                                                <h3 className={`text-sm font-semibold uppercase tracking-wider ${textSec}`}>Output Format</h3>
                                                <div className={`text-sm ${textSec}`} dangerouslySetInnerHTML={{ __html: currentProblem.outputFormat }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : descTab === "Submissions" ? (
                            <div className="space-y-4">
                                <h3 className={`text-lg font-bold ${textMain}`}>Your Submissions</h3>
                                {loadingSubmissions ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className={`text-center py-12 ${textSec} border-2 border-dashed ${borderCol} rounded-xl bg-gray-900/20`}>
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No submissions recorded yet for this problem.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {submissions.map((sub, idx) => (
                                            <div key={sub.id || idx} className={`p-4 rounded-lg border ${borderCol} ${bgSec} hover:border-gray-700 transition-colors`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`font-mono font-bold ${getStatusColor(sub.status)}`}>{sub.status}</span>
                                                    <span className="text-xs text-gray-500">{new Date(sub.createdAt || new Date()).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                                                    <span>Details:</span>
                                                    {sub.executionTime !== undefined && <span>{sub.executionTime}s</span>}
                                                    {sub.memoryUsed !== undefined && <span>{sub.memoryUsed}KB</span>}
                                                    {sub.language && <span className="uppercase">{sub.language}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-12 text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Resizer */}
                <div
                    className="w-1 bg-gray-800 hover:bg-cyan-500 cursor-col-resize transition-colors z-20 flex flex-col justify-center items-center group"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = leftPanelWidth;
                        const onMouseMove = (ev: MouseEvent) => {
                            const delta = ev.pageX - startX;
                            const newWidth = Math.min(80, Math.max(20, startWidth + (delta / window.innerWidth) * 100));
                            setLeftPanelWidth(newWidth);
                        };
                        const onMouseUp = () => {
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                        };
                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                    }}
                >
                    <div className="h-8 w-1 bg-gray-600 rounded-full group-hover:bg-cyan-300 transition-colors" />
                </div>

                {/* RIGHT: Editor + TestCases */}
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {/* Editor Header */}
                    <div className={`h-10 border-b ${borderCol} ${bgSec} flex items-center justify-between px-3 shrink-0`}>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSec}`}>Code Editor</span>
                            <div className="h-4 w-px bg-gray-700" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className={`bg-transparent text-sm ${textMain} outline-none cursor-pointer hover:text-cyan-400 transition-colors uppercase font-mono`}
                                disabled={isRunning || isSubmitting || sessionFinished}
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.id} value={lang.id} className="bg-[#1a1d2d] text-gray-300">
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={restoreLayout}
                                className={`p-1.5 rounded hover:bg-gray-700/50 ${textSec} hover:text-cyan-400 transition-colors`}
                                title="Reset Layout"
                            >
                                <LayoutList className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCodeByProblem(prev => ({ ...prev, [currentProblem.id]: { ...prev[currentProblem.id], [language]: CODE_TEMPLATES[language] } }))}
                                className={`p-1.5 rounded hover:bg-gray-700/50 ${textSec} hover:text-red-400 transition-colors`}
                                title="Reset Code"
                                disabled={isRunning || isSubmitting || sessionFinished}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ height: `${100 - bottomPanelHeight}%` }}>
                        <Editor
                            height="100%"
                            language={language === 'c' || language === 'cpp' ? 'cpp' : language}
                            value={getCurrentCode()}
                            onChange={handleCodeChange}
                            theme={theme === "dark" ? "vs-dark" : "light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                fontLigatures: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16 },
                                smoothScrolling: true,
                                cursorBlinking: "smooth",
                                cursorSmoothCaretAnimation: "on",
                                readOnly: isSubmitting || sessionFinished,
                            }}
                        />

                        {/* Status Overlay */}
                        {(isSubmitting || isRunning) && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                                <div className={`${bgSec} p-6 rounded-xl border ${borderCol} shadow-2xl flex flex-col items-center gap-4`}>
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
                                        <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        <Code className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className={`font-bold text-lg ${textMain}`}>
                                            {isSubmitting ? "Submitting Solution..." : "Running Tests..."}
                                        </h3>
                                        <p className={`text-sm ${textSec} mt-1`}>
                                            Checking your code against test cases
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Horizontal Resizer */}
                    <div
                        className="h-1 bg-gray-800 hover:bg-cyan-500 cursor-row-resize transition-colors z-20 flex justify-center items-center group"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startY = e.pageY;
                            const startHeight = bottomPanelHeight;
                            const onMouseMove = (ev: MouseEvent) => {
                                const delta = startY - ev.pageY; // Drag up increases height
                                const newHeight = Math.min(80, Math.max(10, startHeight + (delta / window.innerHeight) * 100));
                                setBottomPanelHeight(newHeight);
                            };
                            const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                        }}
                    >
                        <div className="w-12 h-1 bg-gray-600 rounded-full group-hover:bg-cyan-300 transition-colors" />
                    </div>

                    {/* Bottom: Test Cases Panel */}
                    <div className={`${bgMain} border-t ${borderCol} flex flex-col overflow-hidden transition-colors duration-200 relative z-10`} style={{ height: `${bottomPanelHeight}%` }}>
                        <div className={`flex items-center justify-between border-b ${borderCol} ${bgSec} px-2`}>
                            <div className="flex">
                                <button
                                    onClick={() => setTestTab("TestCases")}
                                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${testTab === "TestCases" ? 'border-cyan-500 text-cyan-400' : 'border-transparent ' + textSec + ' hover:' + textMain}`}
                                >
                                    Test Cases
                                </button>
                                <button
                                    onClick={() => setTestTab("TestResults")}
                                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${testTab === "TestResults" ? 'border-cyan-500 text-cyan-400' : 'border-transparent ' + textSec + ' hover:' + textMain}`}
                                >
                                    Test Results
                                </button>
                            </div>
                            <div className="flex items-center gap-2 py-1">
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning || isSubmitting || sessionFinished}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 hover:border-gray-600"
                                >
                                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    Run Code
                                </button>
                                <div className="h-4 w-px bg-gray-700" />
                                <button
                                    onClick={handleSubmitCode}
                                    disabled={isRunning || isSubmitting || sessionFinished}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Submit
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-4">
                            {testTab === "TestCases" ? (
                                <div className="h-full flex gap-4">
                                    {/* Sidebar */}
                                    <div className="w-32 flex flex-col gap-2 overflow-y-auto pr-2 border-r border-gray-800/50">
                                        {(currentProblem?.testcases || currentProblem?.testCases || []).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveTestCaseId(i)}
                                                className={`px-3 py-2 text-xs font-mono text-left rounded-lg transition-all ${activeTestCaseId === i ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:bg-gray-800'}`}
                                            >
                                                Case {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        {(currentProblem?.testcases || currentProblem?.testCases) && (currentProblem.testcases?.length || 0) > 0 ? (
                                            <div className="space-y-4 max-w-2xl">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase text-gray-500">Input</label>
                                                    <div className={`p-3 rounded-lg border ${borderCol} bg-[#0f111a] font-mono text-sm ${textMain}`}>
                                                        <pre className="whitespace-pre-wrap">{(currentProblem.testcases || currentProblem.testCases || [])[activeTestCaseId]?.input}</pre>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase text-gray-500">Expected Output</label>
                                                    <div className={`p-3 rounded-lg border ${borderCol} bg-[#0f111a] font-mono text-sm ${textMain}`}>
                                                        <pre className="whitespace-pre-wrap">{(currentProblem.testcases || currentProblem.testCases || [])[activeTestCaseId]?.output || (currentProblem.testcases || currentProblem.testCases || [])[activeTestCaseId]?.expectedOutput}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                                                No test cases available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto">
                                    {submissionResult ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            {/* Summary */}
                                            <div className={`p-4 rounded-xl border ${submissionResult.status === 'AC' || submissionResult.status === 'ACCEPTED' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                <div className="flex items-center gap-3 mb-2">
                                                    {submissionResult.status === 'AC' || submissionResult.status === 'ACCEPTED' ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <span className={`text-lg font-bold font-mono ${getStatusColor(submissionResult.status)}`}>
                                                        {submissionResult.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-6 text-xs font-mono text-gray-500">
                                                    <span>Time: {submissionResult.executionTime}s</span>
                                                    <span>Memory: {submissionResult.memoryUsed}KB</span>
                                                    <span>Passed: {submissionResult.passedTests}/{submissionResult.totalTests}</span>
                                                </div>
                                            </div>

                                            {/* Failed Cases Detail */}
                                            {submissionResult.testResults && submissionResult.testResults.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className={`text-sm font-bold uppercase tracking-wider ${textSec}`}>Test Case Details</h4>
                                                    <div className="grid gap-3">
                                                        {submissionResult.testResults.map((tr, i) => (
                                                            <div key={i} className={`p-3 rounded-lg border ${borderCol} bg-[#0f111a]`}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`text-xs font-mono font-bold ${tr.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>Case {i + 1}: {tr.status}</span>
                                                                    <span className="text-xs text-gray-500 font-mono">{tr.executionTime}s</span>
                                                                </div>
                                                                {tr.status !== 'PASSED' && (
                                                                    <div className="grid md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-800/50">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] uppercase text-gray-500 font-semibold">Your Output</span>
                                                                            <pre className="text-xs font-mono text-red-300/80 bg-red-900/10 p-2 rounded border border-red-500/10 whitespace-pre-wrap">{tr.output}</pre>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] uppercase text-gray-500 font-semibold">Expected</span>
                                                                            <pre className="text-xs font-mono text-green-300/80 bg-green-900/10 p-2 rounded border border-green-500/10 whitespace-pre-wrap">{tr.expectedOutput}</pre>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Output or Error */}
                                            {submissionResult.output && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase text-gray-500">Output</label>
                                                    <div className={`p-3 rounded-lg border ${borderCol} bg-[#0f111a] font-mono text-sm ${textMain}`}>
                                                        <pre className="whitespace-pre-wrap">{submissionResult.output}</pre>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50">
                                            <Terminal className="w-12 h-12" />
                                            <p className="text-sm">Run code to see results</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* UNIFIED WEBCAM OVERLAY */}
            {(proctoringSettings.enableVideoProctoring || proctoringSettings.enableFaceRecognition) && (
                <WebcamOverlay
                    mediaStream={mediaStream || null}
                    theme={theme}
                    violationCount={violationCount}
                    userPhotoUrl={userPhotoUrl}
                    userId={getUserId() || undefined}
                    contestId={contestId}
                    // Proctoring Settings (passed down for internal logic)


                    // Event callback for violations detected by the overlay
                    onViolation={async (type, metadata) => {
                        console.warn(`[WEBCAM-OVERLAY] Violation detected: ${type}`, metadata);
                        // Report to parent state to show toast contextually if needed
                        handleViolation(`⚠️ ${metadata.message || type}`, type);

                        // Report to backend? handleViolation already does this via contestService.reportViolation
                        // But if face recognition needs specific endpoint:
                        if (type === 'FACE_A_MISMATCH' || type === 'NO_FACE' || type === 'MULTIPLE_FACES') {
                            // Optionally specific handling
                            // handleViolation does generic reporting
                        }
                    }}
                />
            )}

            {/* MODALS */}

            {/* 1. Confirm Finish Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`${bgSec} rounded-2xl p-6 max-w-md w-full border ${borderCol} shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className={`text-xl font-bold ${textMain}`}>Finish Assessment?</h3>
                            <p className={textSec}>
                                Are you sure you want to correct and submit all answers? This will end your session and you cannot return.
                            </p>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border ${borderCol} ${textMain} hover:bg-gray-800 transition-colors font-medium`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubmitModal(false);
                                        handleFinishAssessment();
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 transition-all font-medium"
                                >
                                    Confirm Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Auto-Submit Warning Modal (Optional - but good UX) */}
            {showAutoSubmitModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className={`${bgSec} rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl`}>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2 animate-pulse">
                                <Clock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className={`text-xl font-bold ${textMain}`}>Time Expired!</h3>
                            <p className={textSec}>
                                Your assessment time has ended. Your answers are being automatically submitted.
                            </p>
                            <div className="flex justify-center pt-2">
                                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Result Modal (Modified to handle flow correctly) */}
            {showResultModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`${bgMain} rounded-2xl p-8 max-w-lg w-full border ${borderCol} shadow-2xl relative overflow-hidden`}>
                        {/* Background Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />

                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-green-900/30 animate-in zoom-in duration-300">
                                <Trophy className="w-10 h-10 text-white" />
                            </div>

                            <div className="space-y-2">
                                <h2 className={`text-2xl font-bold ${textMain}`}>Assessment Complete!</h2>
                                <p className={textSec}>
                                    Your secure session has ended successfully.
                                </p>
                            </div>

                            {/* Score Display (Optional - if result contains instant scoring) */}
                            {resultData?.scoring && (
                                <div className="py-4 border-y border-gray-800/50">
                                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                        {Math.round(resultData.scoring.finalScore || 0)}%
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Score</p>
                                </div>
                            )}

                            <div className="grid gap-3 pt-4">
                                {showLeaderboard ? (
                                    <button
                                        onClick={() => {
                                            setShowResultModal(false);
                                            sessionStorage.removeItem('secureContestMode');
                                            navigate(`/contestant/contest/${contestId}/leaderboard`);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]"
                                    >
                                        View Leaderboard
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGoToFeedback}
                                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]"
                                    >
                                        Share Feedback
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        sessionStorage.removeItem('secureContestMode');
                                        navigate('/');
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${borderCol} ${textSec} hover:text-white hover:bg-gray-800 transition-all`}
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Login Required Modal */}
            {/* 5. STRICT Blocking Modal for Violations */}
            {showFullscreenViolation && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                    <div className="max-w-xl w-full bg-[#1a1d2d] border-2 border-red-500 rounded-3xl p-8 shadow-2xl shadow-red-900/50 relative overflow-hidden">
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_infinite]">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">
                                    Access Locked
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    You have exited the secure assessment environment.
                                    <br />
                                    <span className="text-red-400 font-bold">This is a recorded violation.</span>
                                </p>
                            </div>

                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-left">
                                <h4 className="text-red-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Violation Protocol
                                </h4>
                                <ul className="text-gray-400 text-sm space-y-2 list-disc pl-4">
                                    <li>Assessment timer continues running in background.</li>
                                    <li>Your screen is being monitored.</li>
                                    <li>Leaving this window again may result in <span className="text-white font-bold">immediate disqualification</span>.</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => {
                                    // Try to request fullscreen again
                                    const elem = document.documentElement;
                                    if (elem.requestFullscreen) {
                                        elem.requestFullscreen().catch(err => {
                                            console.error("Error attempting to enable full-screen mode:", err);
                                        });
                                    }
                                    setIsFullscreen(true);
                                    setShowFullscreenViolation(false);
                                }}
                                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-lg hover:shadow-red-500/30 transition-all uppercase tracking-widest active:scale-95"
                            >
                                Return to Assessment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLoginRequired && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className={`${bgSec} rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl text-center space-y-6`}>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${textMain} mb-2`}>Session Expired</h3>
                            <p className={textSec}>
                                Your authentication session has expired. Please log in again to continue your assessment.
                            </p>
                        </div>
                        <button
                            onClick={handleLoginRedirect}
                            className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg shadow-red-900/20 transition-all font-mono"
                        >
                            LOG IN AGAIN
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}


