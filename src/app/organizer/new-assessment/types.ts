import { LucideIcon } from "lucide-react";

export type Step = 'details' | 'settings' | 'questions' | 'preview';

export type SectionType = 'aptitude' | 'technical' | 'coding' | 'subjective';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Adaptive';

export interface AssessmentConfig {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    duration: number;
    timeMode: 'section' | 'global';
    globalTime: number;
    proctoring: ProctoringSettings;
    navigation: NavigationSettings;
    plagiarism?: {
        enabled: boolean;
        config: PlagiarismConfig;
    };
    // Additional Date/Time styling will be handled in component
}

export interface NavigationSettings {
    allowPreviousNavigation: boolean;
    allowMarkForReview: boolean;
}

export interface ProctoringSettings {
    enabled: boolean;

    // Monitoring Flags
    imageMonitoring: boolean;
    videoMonitoring: boolean;
    screenRecording: boolean;
    audioMonitoring: boolean;
    audioRecording: boolean;

    // AI Features
    objectDetection: boolean;
    personDetection: boolean;
    faceDetection: boolean;
    eyeTracking: boolean;
    noiseDetection: boolean;

    // Lockdown Flags
    fullscreen: boolean;
    tabSwitchLimit: number;
    disableCopyPaste: boolean;
    blockExternalMonitor: boolean;
    blockRightClick: boolean;

    // Verification
    verifyIDCard: boolean;
    verifyFace: boolean;
}

export interface PlagiarismConfig {
    enabled?: boolean;
    strictness: 'Low' | 'Medium' | 'High';
    similarityThreshold: number;
    aiSensitivity: 'Low' | 'Medium' | 'High';
    reportConfig: {
        includeSourceCode: boolean;
        includeMatches: boolean;
        includeAiAnalysis: boolean;
        includeVerdict: boolean;
    };
}
// Additional Date/Time styling will be handled in component


// Define Question Types
export type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding';

export interface Question {
    id: string;
    text: string;
    image?: string;
    type: QuestionType;
    options?: string[];
    correctAnswer?: string | string[]; // Single (string) or Multiple (string[]) or Fill-in (string)
    codeStub?: string; // For Coding questions
    marks?: number;
    // For coding problems linked from problem bank
    problemId?: string;
    problemData?: any; // Full CodingProblem data
}

export interface AssessmentSection {
    id: string;
    type: SectionType;
    title: string;
    description: string;
    emoji?: string;
    questionCount: number; // Can be auto-calculated or manual override
    questions: Question[]; // Store manual questions
    marksPerQuestion: number;
    timeLimit: number;
    negativeMarking: number;
    difficulty: Difficulty;
    enabledPatterns: string[];
    themeColor: string; // Store the category color (e.g. 'green', 'purple')
}

export interface SubCategory {
    id: string;
    label: string;
    icon: any;
    description: string;
}

export interface AssessmentCategory {
    id: string;
    label: string;
    icon: any;
    color: string;
    gradient: string;
    subCategories: SubCategory[];
    sectionType: SectionType;
    // Pre-defined Tailwind classes
    expandedBorder: string;
    expandedBg: string;
    expandedShadow: string;
    selectedBorder: string;
    selectedBg: string;
    checkboxBorder: string;
    checkboxBg: string;
    badgeBg: string;
    badgeText: string;
}
