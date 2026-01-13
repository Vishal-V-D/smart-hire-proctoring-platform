
import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Layers, Plus, ChevronDown, Check, LayoutTemplate, Box, ChevronLeft, ChevronRight, GripVertical, Trash2, Briefcase, Code, Database, Sparkles, Brain, Server, Terminal, FileCode2, Pen, CheckCircle2, X, Hash, Dices, Cloud, Copy, Clock } from 'lucide-react';
import { AssessmentConfig, AssessmentSection, SectionType } from '../types';
import { ASSESSMENT_CATEGORIES } from './utils';
import { getSectionDefaults } from './utils';
import { questionBankService } from '@/api/questionBankService';

interface AssessmentBuilderSidebarProps {
    sections: AssessmentSection[];
    setSections: React.Dispatch<React.SetStateAction<AssessmentSection[]>>;
    setLastAddedSectionId: React.Dispatch<React.SetStateAction<string | null>>;
    expandedCategories: string[];
    toggleCategory: (id: string) => void;
    selectedSubCategories: Record<string, string[]>;
    toggleSubCategory: (catId: string, subId: string) => void;
    handleAddSection: (catId: string, type: SectionType) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

// Predefined layouts for quick start
const PREDEFINED_LAYOUTS = [
    {
        id: 'sde_1',
        title: 'SDE 1 Hiring',
        icon: Code,
        description: 'Standard loop for entry-level devs',
        sections: [
            { type: 'aptitude', title: 'Aptitude & Logical', count: 10, time: 15 },
            { type: 'technical', title: 'CS Fundamentals', count: 10, time: 15 },
            { type: 'coding', title: 'DSA Problem (Easy)', count: 1, time: 20 },
            { type: 'coding', title: 'DSA Problem (Medium)', count: 1, time: 30 },
        ]
    },
    {
        id: 'internship',
        title: 'Internship Drive',
        icon: Briefcase,
        description: 'Balanced mix for campus hiring',
        sections: [
            { type: 'aptitude', title: 'General Aptitude', count: 15, time: 20 },
            { type: 'technical', title: 'Basics of Programming', count: 15, time: 20 },
            { type: 'coding', title: 'Basic Coding Problem', count: 1, time: 30 },
            { type: 'subjective', title: 'Essay / Culture Fit', count: 1, time: 15 },
        ]
    },
    {
        id: 'aptitude_focused',
        title: 'Aptitude & Logic',
        icon: Brain,
        description: 'Non-technical screening round',
        sections: [
            { type: 'aptitude', title: 'Quantitative Ability', count: 15, time: 20 },
            { type: 'aptitude', title: 'Logical Reasoning', count: 15, time: 20 },
            { type: 'aptitude', title: 'Verbal Ability', count: 10, time: 15 },
        ]
    },
    {
        id: 'technical_core',
        title: 'Technical Core',
        icon: Server,
        description: 'CS concepts, OS, DBMS, Networks',
        sections: [
            { type: 'technical', title: 'OS & Architecture', count: 10, time: 15 },
            { type: 'technical', title: 'DBMS & SQL', count: 10, time: 15 },
            { type: 'technical', title: 'Computer Networks', count: 10, time: 15 },
            { type: 'technical', title: 'OOPs & Design', count: 10, time: 15 },
        ]
    },
    {
        id: 'dsa_sprint',
        title: 'DSA Sprint',
        icon: Terminal,
        description: 'Pure coding assessment',
        sections: [
            { type: 'technical', title: 'DSA Theory MCQ', count: 10, time: 15 },
            { type: 'coding', title: 'Problem 1 (Easy)', count: 1, time: 20 },
            { type: 'coding', title: 'Problem 2 (Medium)', count: 1, time: 40 },
            { type: 'coding', title: 'Problem 3 (Hard)', count: 1, time: 60 },
        ]
    },
    {
        id: 'pseudocode',
        title: 'Pseudocode',
        icon: FileCode2,
        description: 'Debugging and Logic flow',
        sections: [
            { type: 'technical', title: 'Output Prediction', count: 10, time: 20 },
            { type: 'technical', title: 'Debugging Logic', count: 10, time: 20 },
        ]
    },
    {
        id: 'full_stack',
        title: 'Full Stack Dev',
        icon: Layers,
        description: 'End-to-end capabilities',
        sections: [
            { type: 'technical', title: 'Frontend (React/Angular)', count: 10, time: 15 },
            { type: 'technical', title: 'Backend (Node/Django)', count: 10, time: 15 },
            { type: 'technical', title: 'Database Design', count: 5, time: 10 },
            { type: 'coding', title: 'Full Stack Problem', count: 1, time: 45 },
        ]
    },
    {
        id: 'frontend_specialist',
        title: 'Frontend React',
        icon: Box,
        description: 'React, CSS, and UI/UX',
        sections: [
            { type: 'technical', title: 'React Core & Hooks', count: 15, time: 20 },
            { type: 'technical', title: 'CSS & Responsive Design', count: 10, time: 15 },
            { type: 'coding', title: 'Frontend Logic (JS/TS)', count: 1, time: 30 },
            { type: 'coding', title: 'UI Component Build', count: 1, time: 45 }
        ]
    },
    {
        id: 'backend_expert',
        title: 'Backend Systems',
        icon: Server,
        description: 'API, DB, and Scalability',
        sections: [
            { type: 'technical', title: 'System Design', count: 10, time: 20 },
            { type: 'technical', title: 'Database Optimization', count: 10, time: 15 },
            { type: 'technical', title: 'API Security', count: 5, time: 10 },
            { type: 'coding', title: 'Backend Logic / API', count: 1, time: 45 }
        ]
    },
    {
        id: 'data_science',
        title: 'Data Science',
        icon: Brain,
        description: 'Python, SQL, Statistics',
        sections: [
            { type: 'technical', title: 'Statistics & Probability', count: 15, time: 20 },
            { type: 'technical', title: 'SQL & Data Modeling', count: 10, time: 20 },
            { type: 'technical', title: 'Machine Learning Basics', count: 10, time: 15 },
            { type: 'coding', title: 'Python Data Manipulation', count: 1, time: 30 }
        ]
    },
    {
        id: 'devops_eng',
        title: 'DevOps Engineer',
        icon: Cloud,
        description: 'CI/CD, Cloud, Docker',
        sections: [
            { type: 'technical', title: 'Linux & Networking', count: 10, time: 15 },
            { type: 'technical', title: 'Containerization (Docker)', count: 10, time: 15 },
            { type: 'technical', title: 'CI/CD Pipelines', count: 10, time: 15 },
            { type: 'technical', title: 'Cloud Architecture (AWS)', count: 10, time: 20 }
        ]
    },
    {
        id: 'qa_automation',
        title: 'QA Automation',
        icon: CheckCircle2,
        description: 'Testing frameworks & Scripts',
        sections: [
            { type: 'technical', title: 'Testing Fundamentals', count: 15, time: 20 },
            { type: 'technical', title: 'Selenium/Cypress', count: 10, time: 15 },
            { type: 'coding', title: 'Test Scripting', count: 1, time: 30 }
        ]
    }
];

export const AssessmentBuilderSidebar: React.FC<AssessmentBuilderSidebarProps> = ({
    sections,
    setSections,
    setLastAddedSectionId,
    expandedCategories,
    toggleCategory,
    selectedSubCategories,
    toggleSubCategory,
    handleAddSection,
    isOpen,
    setIsOpen,
}) => {
    const [activeTab, setActiveTab] = useState<'library' | 'layouts' | 'structure'>('library');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [showRandomModal, setShowRandomModal] = useState(false);
    const [randomConfig, setRandomConfig] = useState({ sections: 3, questions: 10 });

    const scrollToSection = (id: string) => {
        const element = document.getElementById(`section-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleDeleteSection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSections(sections.filter(s => s.id !== id));
    };

    const handleUpdateSectionTitle = (id: string, newTitle: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
        setEditingSectionId(null);
    };

    const handleRandomGenerate = () => {
        setShowRandomModal(true);
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const executeRandomGeneration = async () => {
        const { sections: sectionCount, questions: questionCount } = randomConfig;

        if (sectionCount <= 0 || questionCount <= 0) return;

        setIsGenerating(true);

        try {
            const newSections: AssessmentSection[] = [];
            const types: SectionType[] = ['aptitude', 'technical', 'coding'];
            const themeColors = ['blue', 'purple', 'green', 'orange', 'red', 'gray'];

            // Fetch a large pool of questions once to avoid too many requests, or fetch per section?
            // Fetching a larger pool is better for randomness.
            const response = await questionBankService.listQuestions({
                limit: 100, // Fetch a large pool
                page: 1
            });

            const allQuestions = response.data.questions || [];

            if (allQuestions.length === 0) {
                alert("No questions found in the Question Bank to generate from.");
                setIsGenerating(false);
                return;
            }

            // Group questions by topic/subtype for better variety
            const questionsByTopic = new Map<string, any[]>();
            allQuestions.forEach(q => {
                const qAny = q as any; // Cast to any to access dynamic properties
                const key = qAny.topic || qAny.subType || q.type || 'general';
                if (!questionsByTopic.has(key)) {
                    questionsByTopic.set(key, []);
                }
                questionsByTopic.get(key)!.push(q);
            });

            // Get unique topics and shuffle them
            const uniqueTopics = Array.from(questionsByTopic.keys()).sort(() => 0.5 - Math.random());
            let topicIndex = 0;

            // To ensure variety, shuffle the types array initially so we cycle through them
            let typeCycle = [...types].sort(() => 0.5 - Math.random());
            let typeIndex = 0;

            for (let i = 0; i < sectionCount; i++) {
                // Cycle through types to ensure variety
                if (typeIndex >= typeCycle.length) {
                    typeCycle = [...types].sort(() => 0.5 - Math.random());
                    typeIndex = 0;
                }
                const randomType = typeCycle[typeIndex++];
                const defaults = getSectionDefaults(randomType);

                // Get a unique topic for this section
                if (topicIndex >= uniqueTopics.length) {
                    topicIndex = 0;
                }
                const currentTopic = uniqueTopics[topicIndex++];
                const topicQuestions = questionsByTopic.get(currentTopic) || [];

                // Shuffle and pick questions from this topic
                const shuffledTopicQuestions = [...topicQuestions].sort(() => 0.5 - Math.random());
                const sectionQuestions: any[] = [];

                for (let q = 0; q < Math.min(questionCount, shuffledTopicQuestions.length); q++) {
                    const qData = shuffledTopicQuestions[q];
                    const { id: _origId, ...qFields } = qData;

                    sectionQuestions.push({
                        id: crypto.randomUUID(),
                        ...qFields
                    });
                }

                // If we don't have enough questions from this topic, fill from other questions
                if (sectionQuestions.length < questionCount) {
                    const remainingQuestions = allQuestions
                        .filter(q => !sectionQuestions.some(sq => sq.text === q.text))
                        .sort(() => 0.5 - Math.random());

                    for (let q = sectionQuestions.length; q < questionCount && q < remainingQuestions.length; q++) {
                        const qData = remainingQuestions[q - sectionQuestions.length];
                        const { id: _origId, ...qFields } = qData;
                        sectionQuestions.push({
                            id: crypto.randomUUID(),
                            ...qFields
                        });
                    }
                }

                // Determine Title from Content
                let meaningfulTitle = currentTopic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                // If it's a generic title, try to get more specific from first question
                if (meaningfulTitle.toLowerCase() === 'general' || meaningfulTitle.toLowerCase() === randomType) {
                    const firstQ = sectionQuestions[0];
                    if (firstQ) {
                        if (firstQ.topic) meaningfulTitle = firstQ.topic;
                        else if (firstQ.subType) meaningfulTitle = firstQ.subType;
                        else if (firstQ.tags && Array.isArray(firstQ.tags) && firstQ.tags.length > 0) meaningfulTitle = firstQ.tags[0];
                    }
                    meaningfulTitle = meaningfulTitle.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                }

                newSections.push({
                    ...defaults,
                    id: crypto.randomUUID(),
                    type: randomType,
                    title: meaningfulTitle,
                    questionCount: sectionQuestions.length,
                    timeLimit: defaults.timeLimit,
                    questions: sectionQuestions,
                    enabledPatterns: defaults.enabledPatterns,
                    themeColor: themeColors[i % themeColors.length] as any
                } as AssessmentSection);
            }

            setSections(newSections);
            setLastAddedSectionId(newSections[0].id);
            setShowRandomModal(false);
            setActiveTab('structure');
        } catch (error) {
            console.error("Failed to generate random sections:", error);
            alert("Failed to access Question Bank. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBasicGenerate = () => {
        const basicConfig = [
            { type: 'aptitude', title: 'Quantitative Aptitude', count: 10, time: 15 },
            { type: 'technical', title: 'Pseudo Code', count: 10, time: 15 },
            { type: 'technical', title: 'Operating Systems', count: 10, time: 15 },
            { type: 'coding', title: 'DSA - Arrays', count: 1, time: 30 },
        ];

        const newSections: AssessmentSection[] = basicConfig.map(config => {
            const defaults = getSectionDefaults(config.type as SectionType);
            return {
                ...defaults,
                id: crypto.randomUUID(),
                type: config.type as SectionType,
                title: config.title,
                questionCount: config.count,
                timeLimit: config.time,
                questions: [], // Skeleton only, no questions
                enabledPatterns: defaults.enabledPatterns
            } as AssessmentSection;
        });

        setSections(newSections);
        setLastAddedSectionId(newSections[0].id);
        setActiveTab('structure'); // Switch to structure view to show the result
    };
    /*

        const newSections: AssessmentSection[] = [];
        const types: SectionType[] = ['aptitude', 'technical', 'coding'];

        for (let i = 0; i < sectionCount; i++) {
            const randomType = types[Math.floor(Math.random() * types.length)];
            const defaults = getSectionDefaults(randomType);

            // Randomize title slightly
            const titles = {
                aptitude: ['Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability'],
                technical: ['Core CS Concepts', 'Technical Knowledge', 'System Design'],
                coding: ['Coding Challenge', 'Algorithm Problem', 'Data Structures']
            };
            const randomTitle = titles[randomType as keyof typeof titles]?.[Math.floor(Math.random() * titles[randomType as keyof typeof titles].length)] || defaults.title;

            newSections.push({
                ...defaults,
                id: crypto.randomUUID(),
                type: randomType,
                title: `${randomTitle} ${i + 1}`,
                questionCount: questionCount,
                timeLimit: defaults.timeLimit,
                questions: [],
                enabledPatterns: defaults.enabledPatterns
            } as AssessmentSection);
        }

    */

    const applyLayout = (layout: typeof PREDEFINED_LAYOUTS[0]) => {
        if (confirm(`Apply "${layout.title}" layout? This will replace current sections.`)) {
            const newSections = layout.sections.map(s => {
                const defaults = getSectionDefaults(s.type as SectionType);
                return {
                    ...defaults,
                    id: crypto.randomUUID(),
                    type: s.type as SectionType,
                    title: s.title,
                    questionCount: s.count,
                    timeLimit: s.time,
                    questions: [],
                    enabledPatterns: defaults.enabledPatterns
                } as AssessmentSection;
            });
            setSections(newSections);
            setLastAddedSectionId(newSections[0].id);
        }
    };

    // If closed, show just the toggle button
    if (!isOpen) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 left-4 z-30"
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-2 px-3 py-2 bg-primary/10 backdrop-blur-md border border-primary/20 shadow-lg rounded-r-full rounded-tl-full rounded-bl-lg text-primary hover:bg-primary/20 transition-all font-bold text-xs"
                >
                    <Layers size={16} />
                    <span className="w-0 overflow-hidden group-hover:w-auto transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100">Open Builder</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.19, 1.0, 0.22, 1.0] }}
            className="absolute top-4 left-4 z-30 w-[340px] h-[calc(100vh-2rem)]"
        >
            <div className="relative h-full bg-card backdrop-blur-3xl border border-primary/20 flex flex-col shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
                {/* Primary Mesh Gradient Background */}
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

                {/* Modern Header */}
                <div className="px-5 py-4 border-b border-primary/10 flex items-center justify-between relative z-10 bg-primary/5">
                    <div className="flex items-center gap-3">

                        <div>
                            <h2 className="text-base font-bold text-primary tracking-tight leading-none">
                                Assessment Builder
                            </h2>
                            <p className="text-[10px] uppercase tracking-widest text-primary/60 font-bold mt-1">Configuration</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary/60 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-3 pt-3 relative z-10">
                    <div className="flex p-1 bg-muted/50 rounded-xl border border-primary/10">
                        {[
                            { id: 'library', label: 'Library', icon: Layers },
                            { id: 'layouts', label: 'Layouts', icon: LayoutTemplate },
                            { id: 'structure', label: 'Outline', icon: Briefcase }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                                    }`}
                            >
                                <tab.icon size={13} strokeWidth={2.5} />
                                <span className={activeTab === tab.id ? 'text-primary-foreground' : ''}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative z-10">
                    <AnimatePresence>
                        {showRandomModal && (
                            <motion.div
                                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                className="absolute inset-0 z-50 bg-background/60 flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                    className="w-full bg-card/90 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl overflow-hidden"
                                >
                                    <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-primary" />
                                            <h3 className="text-sm font-bold text-foreground">Random Magic</h3>
                                        </div>
                                        <button
                                            onClick={() => setShowRandomModal(false)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Hash size={12} /> Sections
                                            </label>
                                            <div className="flex items-center gap-2 bg-background/50 border border-primary/10 rounded-lg p-1">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={randomConfig.sections}
                                                    onChange={(e) => setRandomConfig(prev => ({ ...prev, sections: parseInt(e.target.value) }))}
                                                    className="flex-1 h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary ml-2"
                                                />
                                                <span className="w-8 text-center text-xs font-bold text-primary">{randomConfig.sections}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Dices size={12} /> Questions / Section
                                            </label>
                                            <div className="flex items-center gap-2 bg-background/50 border border-primary/10 rounded-lg p-1">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="30"
                                                    value={randomConfig.questions}
                                                    onChange={(e) => setRandomConfig(prev => ({ ...prev, questions: parseInt(e.target.value) }))}
                                                    className="flex-1 h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary ml-2"
                                                />
                                                <span className="w-8 text-center text-xs font-bold text-primary">{randomConfig.questions}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={executeRandomGeneration}
                                                disabled={isGenerating}
                                                className="w-full py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} fill="currentColor" />
                                                        Generate Magic
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {activeTab === 'library' && (
                            <motion.div
                                key="library"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col"
                            >
                                {/* Quick Add Button Area */}
                                <div className="p-4 pb-2">
                                    <button
                                        onClick={() => {
                                            const newId = Date.now().toString();
                                            handleAddSection('custom', 'technical'); // Just a trigger, actual logic handled inside or simplified here if needed
                                            setSections(prev => [...prev, {
                                                ...getSectionDefaults('technical'),
                                                id: newId,
                                                title: "New Custom Section",
                                                description: "Custom configuration",
                                                type: "technical",
                                                questionCount: 5,
                                                timeLimit: 15,
                                                marksPerQuestion: 2,
                                                difficulty: "Medium",
                                                themeColor: "blue",
                                                questions: [],
                                                enabledPatterns: []
                                            }]);
                                            setLastAddedSectionId(newId);
                                            // Auto-enter edit mode for the new section
                                            setTimeout(() => {
                                                setActiveTab('structure');
                                                setEditingSectionId(newId);
                                            }, 100);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Plus size={14} strokeWidth={3} />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-xs font-bold text-foreground">Create Empty Section</span>
                                            <span className="block text-[10px] text-muted-foreground">Start from scratch</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar pr-2">
                                    <div className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1 mt-2 mb-1">Categories</div>
                                    {ASSESSMENT_CATEGORIES.map(category => (
                                        <div key={category.id} className="group">
                                            <div className={`rounded-xl transition-all duration-300 overflow-hidden border ${expandedCategories.includes(category.id) ? 'bg-muted/20 border-border/40 pb-2 shadow-sm' : 'bg-card border-border/20 hover:border-foreground/20 hover:shadow-sm'}`}>
                                                <button
                                                    onClick={() => toggleCategory(category.id)}
                                                    className="w-full p-3 flex items-center justify-between text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg transition-colors ${expandedCategories.includes(category.id) ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                                                            <category.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <span className={`block text-xs font-bold ${expandedCategories.includes(category.id) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{category.label}</span>
                                                            <span className="block text-[10px] text-muted-foreground opacity-70">Tap to expand</span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={14} className={`transition-transform duration-300 text-muted-foreground/60 ${expandedCategories.includes(category.id) ? 'rotate-180 text-foreground' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {expandedCategories.includes(category.id) && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="px-3 pb-1 space-y-1 border-t border-border/10 pt-2 mt-1">
                                                                {category.subCategories.map(sub => {
                                                                    const isSelected = selectedSubCategories[category.id]?.includes(sub.id);
                                                                    return (
                                                                        <div key={sub.id} onClick={() => toggleSubCategory(category.id, sub.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-foreground/5 border border-foreground/10' : 'hover:bg-muted/50 border border-transparent'}`}>
                                                                            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${isSelected ? 'bg-foreground border-foreground text-background' : 'border-border bg-card'}`}>
                                                                                {isSelected && <Check size={10} strokeWidth={4} />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`text-[11px] font-bold leading-none mb-1 ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>{sub.label}</div>
                                                                                <div className="text-[9px] text-muted-foreground/70 leading-tight">{sub.description}</div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {selectedSubCategories[category.id]?.length > 0 && (
                                                                    <button
                                                                        onClick={() => handleAddSection(category.id, category.sectionType)}
                                                                        className="w-full py-2.5 mt-2 rounded-lg text-[10px] uppercase font-black flex items-center justify-center gap-2 text-background bg-foreground hover:opacity-90 transition-all shadow-md active:scale-[0.98] tracking-widest"
                                                                    >
                                                                        <Plus size={12} strokeWidth={3} /> Add Selection
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'layouts' && (
                            <motion.div
                                key="layouts"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto p-4 custom-scrollbar"
                            >
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Sparkles size={14} className="text-indigo-500" /> Quick Start
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                            Select a role below to auto-generate a complete assessment structure optimized for that position.
                                        </p>
                                    </div>

                                    {/* GENERATION BUTTONS GRID */}
                                    <div className="flex flex-col gap-4 mb-6">
                                        {/* BASIC LAYOUT (First) */}
                                        <button
                                            onClick={handleBasicGenerate}
                                            disabled={isGenerating}
                                            className="w-full text-left p-4 rounded-xl border-none shadow-lg transition-all group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500 text-white active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                                            <div className="absolute -right-4 -bottom-4 text-white/20 rotate-12">
                                                <LayoutTemplate size={60} strokeWidth={1.5} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
                                                    <LayoutTemplate size={18} />
                                                </div>
                                                <div className="font-bold text-sm">Basic Layout</div>
                                                <div className="text-[10px] text-white/80 mt-1 font-medium">Standard template (Structure Only)</div>
                                            </div>
                                        </button>

                                        {/* RANDOM MAGIC (Second) */}
                                        <button
                                            onClick={handleRandomGenerate}
                                            disabled={isGenerating}
                                            className="w-full text-left p-4 rounded-xl border-none shadow-lg transition-all group relative overflow-hidden bg-gradient-to-br from-pink-600 to-rose-500 text-white active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                                            <div className="absolute -right-4 -bottom-4 text-white/20 rotate-12">
                                                <Sparkles size={60} strokeWidth={1.5} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
                                                    {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={18} />}
                                                </div>
                                                <div className="font-bold text-sm">Random Magic</div>
                                                <div className="text-[10px] text-white/80 mt-1 font-medium">Auto-generate mix</div>
                                            </div>
                                        </button>
                                    </div>

                                    {PREDEFINED_LAYOUTS.map(layout => (
                                        <button
                                            key={layout.id}
                                            onClick={() => applyLayout(layout)}
                                            className="w-full text-left p-4 rounded-2xl border border-border/60 bg-card hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <layout.icon size={48} className="text-foreground" />
                                            </div>
                                            <div className="relative z-10 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-foreground/5 flex items-center justify-center transition-colors">
                                                    <layout.icon size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">{layout.title}</h4>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{layout.description}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-[9px] font-bold bg-muted/60 px-2 py-1 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                                                            {layout.sections.length} Sections
                                                        </span>
                                                        <span className="text-[9px] font-bold bg-muted/60 px-2 py-1 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                                                            ~{layout.sections.reduce((acc, s) => acc + s.time, 0)} mins
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'structure' && (
                            <motion.div
                                key="structure"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full overflow-y-auto p-4 custom-scrollbar"
                            >
                                {sections.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5">
                                        <Box size={32} className="text-muted-foreground/20 mb-3" />
                                        <h4 className="text-xs font-bold text-foreground">Empty Structure</h4>
                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px]">Add sections from the Library or Layouts to build your assessment.</p>
                                        <button
                                            onClick={() => setActiveTab('library')}
                                            className="mt-4 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            Go to Library
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <h4 className="text-[10px] font-black uppercase text-foreground/50 tracking-widest">Sections ({sections.length})</h4>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to clear all sections?")) {
                                                        setSections([]);
                                                    }
                                                }}
                                                className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                                            >
                                                <Trash2 size={10} /> Clear All
                                            </button>
                                        </div>
                                        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-3 pb-10">
                                            {sections.map((section, idx) => (
                                                <Reorder.Item
                                                    key={section.id}
                                                    value={section}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    whileDrag={{
                                                        scale: 1.02,
                                                        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                                                        zIndex: 50
                                                    }}
                                                    className="bg-card border border-border/50 rounded-lg p-2.5 flex flex-col gap-2 group hover:border-primary/30 hover:bg-card/80 transition-all duration-200 select-none cursor-grab active:cursor-grabbing"
                                                    style={{
                                                        borderLeft: `3px solid var(--${section.themeColor || 'primary'}-500, ${section.themeColor || '#888'})`
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex items-center justify-center w-6 h-6 text-muted-foreground/30 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors">
                                                            <GripVertical size={16} />
                                                        </div>

                                                        <div className="flex-1 min-w-0" onClick={() => scrollToSection(section.id)}>
                                                            {editingSectionId === section.id ? (
                                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        defaultValue={section.title}
                                                                        onBlur={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleUpdateSectionTitle(section.id, (e.target as HTMLInputElement).value);
                                                                            }
                                                                        }}
                                                                        className="w-full text-xs font-bold bg-background border border-primary/50 rounded px-2 py-1 outline-none text-foreground"
                                                                    />
                                                                    <button
                                                                        onClick={() => setEditingSectionId(null)}
                                                                        className="text-green-500 hover:text-green-600"
                                                                    >
                                                                        <CheckCircle2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center min-w-[20px] shadow-sm border border-border/10"
                                                                            style={{
                                                                                backgroundColor: `var(--${section.themeColor || 'gray'}-500)`,
                                                                                color: '#fff',
                                                                                opacity: 0.9
                                                                            }}
                                                                        >
                                                                            {idx + 1}
                                                                        </span>
                                                                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{section.title}</h4>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingSectionId(section.id);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                                                                        >
                                                                            <Pen size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[9px] text-muted-foreground truncate opacity-70 border border-border px-1 rounded uppercase tracking-wider bg-muted/20">{section.type}</span>
                                                                        <span className="text-[9px] text-muted-foreground truncate opacity-70 font-mono">{section.questionCount} Qs • {section.timeLimit}m</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded Options - Always visible mostly or on hover */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/40 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">

                                                        {/* Color Theme Selector */}
                                                        <div className="flex gap-1.5 pl-1">
                                                            {['blue', 'purple', 'green', 'orange', 'red', 'gray'].map(color => (
                                                                <button
                                                                    key={color}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSections(sections.map(s => s.id === section.id ? { ...s, themeColor: color } : s));
                                                                    }}
                                                                    className={`w-2.5 h-2.5 rounded-full border transition-all hover:scale-125 ${section.themeColor === color ? 'ring-1 ring-offset-1 ring-offset-card ring-foreground scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                                    title={`Set theme to ${color}`}
                                                                    style={{ backgroundColor: `var(--${color}-500, ${color})` }}
                                                                />
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center gap-0.5">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Use confirm for now, later could be a modal
                                                                    const count = parseInt(prompt("New Question Count:", section.questionCount.toString()) || section.questionCount.toString());
                                                                    if (!isNaN(count)) {
                                                                        setSections(sections.map(s => s.id === section.id ? { ...s, questionCount: count } : s));
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                                                                title="Edit Question Count"
                                                            >
                                                                <Hash size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const time = parseInt(prompt("New Time Limit (mins):", section.timeLimit.toString()) || section.timeLimit.toString());
                                                                    if (!isNaN(time)) {
                                                                        setSections(sections.map(s => s.id === section.id ? { ...s, timeLimit: time } : s));
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                                                                title="Edit Time Limit"
                                                            >
                                                                <Clock size={12} />
                                                            </button>
                                                            <div className="w-px h-3 bg-border mx-1" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Duplicate
                                                                    const newSection = { ...section, id: crypto.randomUUID(), title: section.title + ' (Copy)' };
                                                                    const index = sections.findIndex(s => s.id === section.id);
                                                                    const newSections = [...sections];
                                                                    newSections.splice(index + 1, 0, newSection as AssessmentSection);
                                                                    setSections(newSections);
                                                                }}
                                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                                                                title="Duplicate Section"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteSection(section.id, e)}
                                                                className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                                                                title="Delete Section"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>
                                )}
                            </motion.div >
                        )}
                    </AnimatePresence >
                </div >
            </div >
        </motion.div >
    );
};
