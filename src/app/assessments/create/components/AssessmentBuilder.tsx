import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Check, Trash2, Plus, ArrowRight, CheckCircle, Clock, Shield, X, Edit3, Save, MoreVertical, GripVertical, Cloud, Sparkles, Code, FileText, CheckSquare, Type, Image as ImageIcon, ChevronUp, Settings } from 'lucide-react';
import { AssessmentConfig, AssessmentSection, Question, SectionType, QuestionType } from '../types';
import { ASSESSMENT_CATEGORIES, getSectionDefaults } from './utils';
import ManualQuestionModal from './ManualQuestionModal';
import CodingQuestionModal from './CodingQuestionModal';
import SQLQuestionModal from './SQLQuestionModal';
import CodingQuestionDisplay from './CodingQuestionDisplay';
import SQLQuestionDisplay from '@/components/organizer/questions/SQLQuestionDisplay';
import TestCaseConfigModal from './TestCaseConfigModal';
import PseudoCodeDisplay from '@/components/contestant/PseudoCodeDisplay';
import { AssessmentBuilderSidebar } from './AssessmentBuilderSidebar';
import AssessmentPreview from './AssessmentPreview';

interface AssessmentBuilderProps {
    config: AssessmentConfig;
    sections: AssessmentSection[];
    setSections: React.Dispatch<React.SetStateAction<AssessmentSection[]>>;
    onPublish: () => void;
    onSaveDraft?: () => void;
    onBack: () => void;
    isEditMode?: boolean;
}


const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({ config, sections, setSections, onPublish, onSaveDraft, onBack, isEditMode }) => {

    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<Record<string, string[]>>({});
    const [lastAddedSectionId, setLastAddedSectionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Scroll to new section
    React.useEffect(() => {
        if (lastAddedSectionId) {
            const element = document.getElementById(`section-${lastAddedSectionId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Reset after scroll to allow manual scrolling without interference
                setTimeout(() => setLastAddedSectionId(null), 1000);
            }
        }
    }, [lastAddedSectionId, sections]);

    // Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isCodingModalOpen, setIsCodingModalOpen] = useState(false);
    const [isSQLModalOpen, setIsSQLModalOpen] = useState(false);
    const [manualModalType, setManualModalType] = useState<SectionType>('aptitude');
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
    const [modalDivision, setModalDivision] = useState<string | undefined>(undefined);
    const [modalSubdivision, setModalSubdivision] = useState<string | undefined>(undefined);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Image modal state
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Expanded questions state (default empty = all collapsed)
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    // Test case config modal state
    const [isTestCaseConfigOpen, setIsTestCaseConfigOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    // --- ACTIONS ---
    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const toggleSubCategory = (catId: string, subId: string) => {
        setSelectedSubCategories(prev => {
            const current = prev[catId] || [];
            if (current.includes(subId)) {
                return { ...prev, [catId]: current.filter(s => s !== subId) }
            } else {
                return { ...prev, [catId]: [...current, subId] };
            }
        });
    };

    const toggleQuestionCollapse = (questionId: string) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const handleAddSection = (catId: string, type: SectionType) => {
        const subIds = selectedSubCategories[catId] || [];
        const defaults = getSectionDefaults(type);
        const categoryData = ASSESSMENT_CATEGORIES.find(c => c.id === catId);
        const categoryLabel = categoryData?.label || 'Custom';

        // Set Main Title (e.g. "MCQ Technical")
        let title = categoryLabel;

        // Set Subtype as Description
        let description = defaults.description;
        if (subIds.length > 0 && categoryData) {
            const labels = subIds.map(sid => categoryData.subCategories.find(s => s.id === sid)?.label).filter(Boolean);
            if (labels.length > 0) {
                // description = `${labels.join(', ')} - ${defaults.difficulty}`;
                // Keep description simple as requested ("subtype as small one below")
                description = labels.join(', ');
            }
        }

        const newSection: AssessmentSection = {
            ...defaults,
            id: crypto.randomUUID(),
            type,
            themeColor: categoryData?.color || 'gray',
            title: title,
            description: description,
            enabledPatterns: defaults.enabledPatterns,
            questions: []
        } as AssessmentSection;

        setSections([...sections, newSection]);
        setSelectedSubCategories(prev => ({ ...prev, [catId]: [] }));
        setLastAddedSectionId(newSection.id);
    };

    const updateSection = (id: string, updates: Partial<AssessmentSection>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const openAddQuestionModal = (sectionId: string, type: SectionType) => {
        setTargetSectionId(sectionId);
        setManualModalType(type);

        // For coding sections, use the dedicated CodingQuestionModal
        if (type === 'coding') {
            setIsCodingModalOpen(true);
            return;
        }

        // Special handling for SQL sections - Open specific SQL Modal
        // We need to check the section details to be sure, as the type might be 'technical'
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            if (section.title.toLowerCase().includes('sql') || section.description.toLowerCase().includes('sql')) {
                console.log('📍 Detected SQL Section - Opening SQL Modal');

                // Determine Division/Subdivision for SQL
                const division = 'Coding';
                let subdivision = 'SQL';

                // Try to extract more specific subdivision from description
                const descMatch = section.description.split(',')[0].trim();
                if (descMatch && !descMatch.toLowerCase().includes('sql')) {
                    // If description has something other than just "SQL" (e.g. "MySQL, Advanced"), use it?
                    // Actually, let's trust the description acts as subdivision often.
                    subdivision = descMatch;
                } else if (section.description.toLowerCase().includes('sql')) {
                    // If description says "SQL Questions", stick to "SQL" or extract if needed
                    subdivision = 'SQL';
                }

                setModalDivision(division);
                setModalSubdivision(subdivision);
                setTargetSectionId(sectionId);
                setIsSQLModalOpen(true);
                return;
            }
        }

        // Extract division and subdivision from section for context
        // const section = sections.find(s => s.id === sectionId); // checking... variable hoisted
        if (section) {
            console.log('📍 Section found:', section);
            console.log('📍 Section title:', section.title);
            console.log('📍 Section type:', section.type);

            // Map section type to division (capitalize first letter)
            let division: string | undefined;
            let subdivision: string | undefined;

            // Map section type to proper division name
            const sectionTypeToDivision: Record<SectionType, string> = {
                'aptitude': 'Aptitude',
                'technical': 'Technical',
                'coding': 'Coding',
                'subjective': 'Subjective',
                'sql': 'SQL'
            };

            division = sectionTypeToDivision[section.type] || section.type.charAt(0).toUpperCase() + section.type.slice(1);

            // Override for Pseudo Code and SQL based on Title
            if (section.title.includes('Pseudo Code')) {
                division = 'Pseudo Code';
            } else if (section.title.includes('SQL')) {
                division = 'SQL';
            }

            // Extract subdivision from Description first (new way), fall back to title (old way)
            // We assume the description contains the comma-separated subtypes
            if (section.description && section.description !== 'CS Fundamentals' && section.description !== 'Logical & Quant' && section.description !== 'DSA Problems') {
                // Take the first subtype if multiple
                subdivision = section.description.split(',')[0].trim();
            } else {
                // Fallback to title extraction
                const titleMatch = section.title.match(/^([^(]+)/);
                if (titleMatch) {
                    subdivision = titleMatch[1].trim();
                }
            }

            console.log('📍 Extracted division:', division);
            console.log('📍 Extracted subdivision:', subdivision);

            setModalDivision(division);
            setModalSubdivision(subdivision);
        }

        setIsManualModalOpen(true);
    };

    const handleSaveQuestion = (questionOrQuestions: Question | Question[]) => {
        if (!targetSectionId) return;

        const section = sections.find(s => s.id === targetSectionId);
        if (section) {
            const currentQuestions = section.questions || [];

            // Handle both single question and array of questions
            const questionsToAdd = Array.isArray(questionOrQuestions) ? questionOrQuestions : [questionOrQuestions];

            // Filter out duplicates based on question text       
            const existingTexts = new Set(currentQuestions.map(q => q.text.trim().toLowerCase()));
            const uniqueQuestions = questionsToAdd.filter(q => {
                const questionText = q.text.trim().toLowerCase();
                if (existingTexts.has(questionText)) {
                    console.log('⚠️ Skipping duplicate question:', q.text);
                    return false;
                }
                existingTexts.add(questionText);
                return true;
            });

            console.log(`✅ Adding ${uniqueQuestions.length} unique questions out of ${questionsToAdd.length} total`);

            const updatedQuestions = [...currentQuestions, ...uniqueQuestions];
            const newCount = Math.max(section.questionCount, updatedQuestions.length);

            updateSection(targetSectionId, {
                questions: updatedQuestions,
                questionCount: newCount
            });
        }
        setIsManualModalOpen(false);
        setIsCodingModalOpen(false);
        setIsSQLModalOpen(false);
    };

    const deleteQuestion = (sectionId: string, questionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            const updatedQuestions = (section.questions || []).filter(q => q.id !== questionId);
            updateSection(sectionId, {
                questions: updatedQuestions,
                questionCount: Math.max(section.questionCount, updatedQuestions.length)
            });
            // Remove from collapsed set if it was collapsed
            // Remove from expanded set if it was expanded
            setExpandedQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(questionId);
                return newSet;
            });
        }
    };

    const handleTestCaseConfigSave = (config: {
        method: 'all' | 'range' | 'indices';
        exampleRange?: { start: number; end: number } | null;
        hiddenRange?: { start: number; end: number } | null;
        exampleIndices?: number[] | null;
        hiddenIndices?: number[] | null;
    } | null) => {
        if (!selectedQuestion) return;

        // Find the section containing this question
        for (const section of sections) {
            const questionIndex = section.questions?.findIndex(q => q.id === selectedQuestion.id);
            if (questionIndex !== undefined && questionIndex !== -1) {
                const updatedQuestions = [...(section.questions || [])];
                updatedQuestions[questionIndex] = {
                    ...updatedQuestions[questionIndex],
                    testCaseConfig: config
                };
                updateSection(section.id, { questions: updatedQuestions });
                break;
            }
        }
    };


    // --- CALCULATIONS ---
    // Section Score = (questions added) × marksPerQuestion
    const calculateSectionMarks = (section: AssessmentSection) => {
        const count = section.questions?.length || 0;
        const marks = Number(section.marksPerQuestion) || 0;
        return count * marks;
    };

    const totalMarks = sections.reduce((acc, s) => acc + calculateSectionMarks(s), 0);
    const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    const totalTime = sections.reduce((acc, s) => acc + (Number(s.timeLimit) || 0), 0);

    // --- HELPER FOR COLORS ---
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'green': return {
                border: 'border-green-500/20',
                bg: 'bg-green-500/5',
                text: 'text-emerald-700 dark:text-emerald-400',
                badge: 'bg-emerald-500/10 text-emerald-600',
                input: 'focus:border-emerald-500 hover:bg-emerald-500/5'
            };
            case 'purple': return {
                border: 'border-purple-500/20',
                bg: 'bg-purple-500/5',
                text: 'text-purple-700 dark:text-purple-400',
                badge: 'bg-purple-500/10 text-purple-600',
                input: 'focus:border-purple-500 hover:bg-purple-500/5'
            };
            case 'blue': return {
                border: 'border-blue-500/20',
                bg: 'bg-blue-500/5',
                text: 'text-blue-700 dark:text-blue-400',
                badge: 'bg-blue-500/10 text-blue-600',
                input: 'focus:border-blue-500 hover:bg-blue-500/5'
            };
            case 'orange': return {
                border: 'border-orange-500/20',
                bg: 'bg-orange-500/5',
                text: 'text-orange-700 dark:text-orange-400',
                badge: 'bg-orange-500/10 text-orange-600',
                input: 'focus:border-orange-500 hover:bg-orange-500/5'
            };
            default: return {
                border: 'border-border',
                bg: 'bg-card',
                text: 'text-foreground',
                badge: 'bg-muted text-muted-foreground',
                input: 'focus:border-primary hover:bg-muted/50'
            };
        }
    };

    const getQuestionTypeIcon = (type: QuestionType) => {
        switch (type) {
            case 'coding': return <Code size={12} className="text-emerald-500" />;
            case 'single_choice': return <CheckCircle size={12} className="text-blue-500" />;
            case 'multiple_choice': return <CheckSquare size={12} className="text-purple-500" />;
            case 'fill_in_the_blank': return <Type size={12} className="text-orange-500" />;
            default: return <FileText size={12} className="text-muted-foreground" />;
        }
    };

    // --- PREVIEW MODE ---
    if (isPreviewMode) {
        return (
            <AssessmentPreview
                config={config}
                sections={sections}
                isEditMode={isEditMode || false}
                onBack={() => setIsPreviewMode(false)}
                onSaveDraft={onSaveDraft}
                onPublish={onPublish}
                onUpdateSection={updateSection as any}
                onDeleteSection={deleteSection}
            />
        );
    }

    // --- MAIN BUILDER VIEW ---
    return (
        <div className="fixed inset-0 z-[100] bg-background flex w-full h-full overflow-hidden">
            <ManualQuestionModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSave={handleSaveQuestion}
                type={manualModalType}
                division={modalDivision}
                subdivision={modalSubdivision}
            />

            <CodingQuestionModal
                isOpen={isCodingModalOpen}
                onClose={() => setIsCodingModalOpen(false)}
                onSave={handleSaveQuestion}
            />

            <SQLQuestionModal
                isOpen={isSQLModalOpen}
                onClose={() => setIsSQLModalOpen(false)}
                onSave={handleSaveQuestion}
                division={modalDivision}
                subdivision={modalSubdivision}
                sectionId={targetSectionId || ''}
            />

            <TestCaseConfigModal
                isOpen={isTestCaseConfigOpen}
                onClose={() => {
                    setIsTestCaseConfigOpen(false);
                    setSelectedQuestion(null);
                }}
                sectionProblemId={selectedQuestion?.sectionProblemId || null}
                problemTitle={selectedQuestion?.text || 'Coding Problem'}
                totalTestCases={selectedQuestion?.problemData?.testCases?.length || 0}
                problemData={selectedQuestion?.problemData}
                initialConfig={selectedQuestion?.testCaseConfig}
                onSaveLocal={handleTestCaseConfigSave}
            />

            {/* Floating Categories Panel */}
            {/* Floating Categories Panel */}
            <AssessmentBuilderSidebar
                sections={sections}
                setSections={setSections}
                setLastAddedSectionId={setLastAddedSectionId}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                selectedSubCategories={selectedSubCategories}
                toggleSubCategory={toggleSubCategory}
                handleAddSection={handleAddSection}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* RIGHT: Sections Editor - Now full width with left padding for floating panel */}
            <div className={`flex-1 flex flex-col bg-background/50 w-full overflow-hidden relative transition-all duration-300 ${isSidebarOpen ? 'pl-[380px]' : 'pl-6'}`}>
                {sections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center relative overflow-hidden">
                        {/* Subtle Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{
                            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }} />

                        {/* Ambient Glow */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                animate={{
                                    opacity: [0.03, 0.06, 0.03],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-3xl"
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 flex flex-col items-center max-w-xl"
                        >
                            {/* Minimalist Icon Stack */}
                            <div className="relative mb-12">
                                {/* Main Container */}
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative"
                                >
                                    {/* Stacked Cards Effect */}
                                    <div className="relative w-32 h-32">
                                        {/* Back Card */}
                                        <motion.div
                                            animate={{ rotate: [0, -3, 0] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl border border-border/40 backdrop-blur-sm translate-x-3 translate-y-3"
                                        />
                                        {/* Middle Card */}
                                        <motion.div
                                            animate={{ rotate: [0, 2, 0] }}
                                            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                            className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm translate-x-1.5 translate-y-1.5"
                                        />
                                        {/* Front Card */}
                                        <motion.div
                                            animate={{ rotate: [0, -1, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                                            className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl border border-border shadow-2xl shadow-primary/5 backdrop-blur-xl flex items-center justify-center"
                                        >
                                            <Layers size={52} className="text-foreground/80" strokeWidth={1.5} />
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* Floating Accent Dots */}
                                <motion.div
                                    animate={{
                                        x: [0, 8, 0],
                                        y: [0, -8, 0]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-primary/40 blur-[1px]"
                                />
                                <motion.div
                                    animate={{
                                        x: [0, -6, 0],
                                        y: [0, 6, 0]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    className="absolute -bottom-3 -left-3 w-2 h-2 rounded-full bg-primary/30 blur-[1px]"
                                />
                            </div>

                            {/* Text Content */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="space-y-4"
                            >
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                    No sections yet
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                    Create your first section to start building the assessment structure
                                </p>
                            </motion.div>

                            {/* Action Hint */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="mt-8 flex items-center gap-3 text-xs text-muted-foreground/60"
                            >
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/40">
                                    <Plus size={12} strokeWidth={2.5} />
                                    <span className="font-medium">Add Section</span>
                                </div>
                                <span>or select from sidebar</span>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pb-32 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                        {sections.map((section, idx) => {
                            const colors = getColorClasses(section.themeColor || 'gray');
                            return (
                                <motion.div
                                    id={`section-${section.id}`}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    key={section.id}
                                    onClick={() => {
                                        const el = document.getElementById(`section-${section.id}`);
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className={`border rounded-xl p-6 transition-all group relative bg-card ${colors.border}`}
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        {/* Section Index */}
                                        <div className="hidden md:flex flex-col items-center gap-2 pt-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${colors.badge}`}>
                                                {idx + 1}
                                            </div>
                                            <GripVertical size={16} className="text-muted-foreground/30 cursor-move hover:text-muted-foreground transition-colors" />
                                        </div>

                                        {/* Section Content */}
                                        <div className="flex-1 w-full space-y-6">
                                            {/* Header & Controls */}
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h4 className={`font-bold text-xl leading-tight ${colors.text} flex items-center gap-2`}>
                                                        {section.title}
                                                        {section.type === 'coding' && <Code size={16} className="text-muted-foreground/50" />}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted/30 px-2 py-1 rounded-md inline-block border border-border/50">
                                                        {section.description} • {section.difficulty} Difficulty
                                                    </p>
                                                </div>
                                                <button onClick={() => deleteSection(section.id)} className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Inline Edit Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Questions Added</label>
                                                    <div className="relative group/input">
                                                        <div className="w-full bg-muted/20 border border-border/60 rounded-xl py-3 px-4 text-sm font-bold flex items-center justify-center">
                                                            <span className={`text-lg ${colors.text}`}>{section.questions?.length || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Time (min)</label>
                                                    <div className="relative group/input">
                                                        <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className={`w-full bg-muted/20 border border-transparent rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all ${colors.input}`}
                                                            value={section.timeLimit}
                                                            onChange={(e) => updateSection(section.id, { timeLimit: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Marks / Q</label>
                                                    <div className="relative group/input">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className={`w-full bg-muted/20 border border-transparent rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all ${colors.input}`}
                                                            value={section.marksPerQuestion}
                                                            onChange={(e) => updateSection(section.id, { marksPerQuestion: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-xl flex flex-col justify-center items-center bg-card border border-border shadow-sm`}>
                                                    <span className={`text-2xl font-black ${colors.text}`}>{(section.questions?.length || 0) * section.marksPerQuestion}</span>
                                                    <span className="text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-widest">Section Score</span>
                                                </div>
                                            </div>

                                            {/* Questions List & Add Action */}
                                            <div className="bg-muted/10 rounded-2xl p-5 border border-border/50 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                                                        <Layers size={14} /> Specific Questions <span className="bg-muted px-2 py-0.5 rounded-md text-foreground">{section.questions?.length || 0}</span>
                                                    </h5>
                                                    <button
                                                        onClick={() => openAddQuestionModal(section.id, section.type)}
                                                        className={`text-xs font-bold ${colors.text} hover:opacity-100 opacity-90 flex items-center gap-2 bg-background px-3 py-2 rounded-lg transition-all border border-border hover:border-current shadow-sm`}
                                                    >
                                                        <Plus size={14} /> Add {section.type === 'coding' ? 'Coding Problem' : 'Question'}
                                                    </button>
                                                </div>

                                                {(section.questions || []).length > 0 ? (
                                                    <div className="space-y-2.5">
                                                        {section.questions.map((q, qIdx) => {
                                                            const isExpanded = expandedQuestions.has(q.id);
                                                            return (
                                                                <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden text-sm group/q hover:border-muted-foreground/30 transition-all cursor-default relative">
                                                                    {/* Question Header - Always Visible */}
                                                                    <div className="flex items-start gap-4 p-4">
                                                                        {/* Question Number */}
                                                                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-border">
                                                                            {qIdx + 1}
                                                                        </div>

                                                                        {/* Question Preview */}
                                                                        <div className="flex-1 min-w-0">
                                                                            {!isExpanded && (
                                                                                <div className="font-medium text-foreground/90 line-clamp-2">
                                                                                    {q.text || <span className="text-muted-foreground italic">No question text</span>}
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="text-xs font-bold px-2 py-0.5 bg-muted/50 border border-border/50 rounded-md uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                                                                                    {getQuestionTypeIcon(q.type)} {q.type.replace(/_/g, ' ')}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Buttons */}
                                                                        <div className="flex items-center gap-1">
                                                                            {/* Configure Button - For All Coding Questions */}
                                                                            {q.type === 'coding' && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedQuestion(q);
                                                                                        setIsTestCaseConfigOpen(true);
                                                                                    }}
                                                                                    className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                                                    title="Configure Test Cases"
                                                                                >
                                                                                    <Settings size={16} />
                                                                                </button>
                                                                            )}

                                                                            {/* Delete Button */}
                                                                            <button
                                                                                onClick={() => deleteQuestion(section.id, q.id)}
                                                                                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                                                title="Delete Question"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>

                                                                            {/* Collapse Toggle Button */}
                                                                            <button
                                                                                onClick={() => toggleQuestionCollapse(q.id)}
                                                                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                                                title={isExpanded ? "Collapse" : "Expand"}
                                                                            >
                                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Question Details - Collapsible */}
                                                                    {isExpanded && (
                                                                        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-2">
                                                                            <div className="pt-3">
                                                                                {/* Full Text Display for Non-Coding Questions */}
                                                                                {q.type !== 'coding' && (
                                                                                    <div className="mb-4">
                                                                                        <div className="text-sm text-foreground leading-relaxed space-y-4">
                                                                                            {(() => {
                                                                                                // Check for explicit pseudocode field (e.g. from backend)
                                                                                                if (q.pseudocode) {
                                                                                                    return (
                                                                                                        <>
                                                                                                            <div className="mb-3 whitespace-pre-wrap font-medium">{q.text}</div>
                                                                                                            <PseudoCodeDisplay code={q.pseudocode} />
                                                                                                        </>
                                                                                                    );
                                                                                                }

                                                                                                const isPseudoSection = section.title.toLowerCase().includes('pseudo');
                                                                                                const hasCodeBlock = q.text.includes('```');

                                                                                                // Fallback: If in pseudo section but no backticks, treat entire text as code (legacy behavior)
                                                                                                if (isPseudoSection && !hasCodeBlock) {
                                                                                                    return <PseudoCodeDisplay code={q.text} />;
                                                                                                }

                                                                                                // Standard markdown-like parsing
                                                                                                return q.text.split(/(```[\s\S]*?```)/g).map((part, pIdx) => {
                                                                                                    if (part.startsWith('```')) {
                                                                                                        const codeContent = part.replace(/^```\w*\n?|```$/g, '');
                                                                                                        return <PseudoCodeDisplay key={pIdx} code={codeContent} />;
                                                                                                    }
                                                                                                    return <span key={pIdx} className="whitespace-pre-wrap">{part}</span>;
                                                                                                });
                                                                                            })()}
                                                                                        </div>
                                                                                        {q.image && (
                                                                                            <div className="mt-3">
                                                                                                <img src={q.image} alt="Question" className="max-w-full rounded-lg border border-border" />
                                                                                            </div>
                                                                                        )}
                                                                                        {/* Options Display */}
                                                                                        {q.options && q.options.length > 0 && (
                                                                                            <div className="mt-4 space-y-2">
                                                                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Options</p>
                                                                                                {q.options.map((opt, oIdx) => (
                                                                                                    <div key={oIdx} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${String(q.correctAnswer) === String(oIdx) || q.correctAnswer === opt ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30 border border-transparent'}`}>
                                                                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${String(q.correctAnswer) === String(oIdx) || q.correctAnswer === opt ? 'bg-green-500 text-white border-green-500' : 'bg-muted border-muted-foreground/30 text-muted-foreground'}`}>
                                                                                                            {String.fromCharCode(65 + oIdx)}
                                                                                                        </div>
                                                                                                        <span className={`${String(q.correctAnswer) === String(oIdx) || q.correctAnswer === opt ? 'font-bold text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                                                                                                            {opt}
                                                                                                        </span>
                                                                                                        {(String(q.correctAnswer) === String(oIdx) || q.correctAnswer === opt) && (
                                                                                                            <CheckCircle size={12} className="text-green-500 ml-auto" />
                                                                                                        )}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Fill in the blank answer */}
                                                                                        {q.type === 'fill_in_the_blank' && q.correctAnswer && (
                                                                                            <div className="mt-4">
                                                                                                <div className="text-xs text-muted-foreground mb-1">Correct Answer:</div>
                                                                                                <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-semibold text-green-700 dark:text-green-400 inline-block">
                                                                                                    {String(q.correctAnswer)}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {/* SQL QUESTION - Use SQL display component */}
                                                                                {q.type === 'coding' && q.problemData && q.problemData.dialect && (
                                                                                    <SQLQuestionDisplay question={q.problemData} />
                                                                                )}

                                                                                {/* CODING QUESTION - Use modular display component (exclude SQL) */}
                                                                                {q.type === 'coding' && q.problemData && !q.problemData.dialect && (
                                                                                    <CodingQuestionDisplay
                                                                                        problem={q.problemData}
                                                                                        questionNumber={qIdx + 1}
                                                                                        marks={q.marks || section.marksPerQuestion}
                                                                                        compact={false}
                                                                                    />
                                                                                )}

                                                                                {/* CODING QUESTION - Fallback (no problemData, just codeStub) */}
                                                                                {q.type === 'coding' && !q.problemData && q.codeStub && (
                                                                                    <div className="bg-zinc-950 rounded-lg overflow-hidden border border-border/50">
                                                                                        <div className="flex items-center px-3 py-1.5 bg-zinc-800/50 border-b border-border/30">
                                                                                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Starter Code</span>
                                                                                        </div>
                                                                                        <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                                                                                            <code>{q.codeStub}</code>
                                                                                        </pre>
                                                                                    </div>
                                                                                )}



                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-xl text-xs text-muted-foreground/60 italic bg-muted/5">
                                                        No manual questions added yet. <br />Default content will be auto-generated based on selected tags.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div >
                )}

                {/* Main Footer */}
                {/* Main Footer - Floating Style */}
                <div className="absolute bottom-6 right-8 z-30 w-auto">
                    <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 flex items-center justify-between gap-4 ring-1 ring-black/5 dark:ring-white/5">
                        <button
                            onClick={onBack}
                            className="text-muted-foreground hover:text-foreground font-bold text-xs px-5 py-3 hover:bg-muted/50 rounded-xl transition-all"
                        >
                            Back to Setup
                        </button>

                        <div className="flex items-center gap-4 px-4 text-xs font-medium text-muted-foreground border-x border-border/20">
                            <span className="flex items-center gap-1.5"><Layers size={14} /> {sections.length} Sections</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {totalTime}m</span>
                            <span className="flex items-center gap-1.5"><span className="text-primary">★</span> {totalMarks} pts</span>
                        </div>

                        {onSaveDraft && (
                            <button
                                onClick={onSaveDraft}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2"
                                title="Save Draft to Server"
                            >
                                <Save size={16} />
                            </button>
                        )}

                        <button
                            onClick={() => setIsPreviewMode(true)}
                            disabled={sections.length === 0}
                            className={`bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none ${sections.length === 0 ? 'cursor-not-allowed' : 'active:scale-95'}`}
                        >
                            Review <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div >

            {/* Image Full View Modal */}
            <AnimatePresence>
                {
                    imageModalOpen && selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setImageModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-5xl max-h-[90vh] bg-background rounded-2xl overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setImageModalOpen(false)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                {/* Image */}
                                <img
                                    src={selectedImage || ''}
                                    alt="Question Full View"
                                    className="w-full h-full object-contain"
                                />
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default AssessmentBuilder;
