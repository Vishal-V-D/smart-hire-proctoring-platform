"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    FileText,
    CheckCircle,
    Clock,
    Calendar,
    Eye,
    Camera,
    Mic,
    Monitor,
    ChevronUp,
    ChevronDown,
    Code,
    Type,
    AlertCircle
} from 'lucide-react';
import CodingQuestionDisplay from '@/app/assessments/create/components/CodingQuestionDisplay';
import SQLQuestionDisplay from '@/components/organizer/questions/SQLQuestionDisplay';

// Helper functions for icons/colors
const getQuestionTypeIcon = (type: string) => {
    switch (type) {
        case 'coding': return <Code size={16} className="text-emerald-500" />;
        case 'single_choice': return <CheckCircle size={16} className="text-blue-500" />;
        case 'multiple_choice': return <CheckCircle size={16} className="text-purple-500" />;
        case 'fill_in_the_blank': return <Type size={16} className="text-orange-500" />;
        default: return <FileText size={16} className="text-muted-foreground" />;
    }
};

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case 'Easy': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        case 'Medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        case 'Hard': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        default: return 'bg-muted text-muted-foreground';
    }
};

// Types
type Question = {
    id: string;
    text: string;
    image?: string;
    type: string;
    options?: string[];
    correctAnswer?: string | string[];
    codeStub?: string;
    marks: number;
    orderIndex: number;
    problemId?: string;
    problemData?: any;
    problem?: any;
    negativeMarks?: number;
};

type Section = {
    id: string;
    title: string;
    description: string;
    type: string;
    questionCount: number;
    marksPerQuestion: number;
    timeLimit: number;
    negativeMarking: number;
    difficulty: string;
    themeColor: string;
    orderIndex: number;
    questions: Question[];
    problems?: any[];
    sqlQuestions?: any[];
};

interface OverviewTabProps {
    assessment: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ assessment }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        console.log('🔍 [OVERVIEW TAB] Data Loaded:', assessment?.title);
    }, [assessment]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const expandAll = () => setExpandedSections(new Set(assessment.sections.map((s: Section) => s.id)));
    const collapseAll = () => setExpandedSections(new Set());

    return (
        <div className="space-y-8 pb-10">

            {/* Dates & Timeline */}
            <div className="bg-card border border-border rounded-2xl p-1 overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-1 flex items-center gap-4 p-4 border-b md:border-b-0 md:border-r border-border hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Start Date</p>
                            <p className="text-sm font-semibold text-foreground">{new Date(assessment.startDate).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">End Date</p>
                            <p className="text-sm font-semibold text-foreground">{new Date(assessment.endDate).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proctoring Settings */}
            {assessment.proctoringSettings?.enabled && (
                <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={80} className="text-primary" />
                    </div>
                    <h2 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 animate-pulse" />
                        Active Proctoring Security
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { enabled: assessment.proctoringSettings.camera, label: 'Camera', icon: Camera },
                            { enabled: assessment.proctoringSettings.mic, label: 'Microphone', icon: Mic },
                            { enabled: assessment.proctoringSettings.fullscreen, label: 'Fullscreen', icon: Monitor },
                            { enabled: assessment.proctoringSettings.screenRecord, label: 'Screen Rec', icon: Monitor },
                        ].map((item, idx) => item.enabled && (
                            <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
                                <item.icon size={16} className="text-primary" />
                                <span className="text-xs font-bold text-primary/80">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sections & Questions */}
            <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-xl font-Inter text-foreground tracking-tight">Curriculum Breakdown</h2>
                        <p className="text-sm text-muted-foreground">Manage and review your assessment structure</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
                        <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all">
                            Expand All
                        </button>
                        <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all">
                            Collapse All
                        </button>
                    </div>
                </div>

                {assessment.sections?.map((section: Section, sectionIndex: number) => {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sectionIndex * 0.05 }}
                            className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary/30 bg-card shadow-lg' : 'border-border bg-card/50 hover:border-primary/20'
                                }`}
                        >
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full p-5 flex items-center justify-between transition-colors"
                            >
                                <div className="flex items-center gap-5">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-Inter text-lg text-white shadow-inner"
                                        style={{
                                            backgroundColor: section.themeColor || '#6366f1',
                                            boxShadow: `0 8px 16px -4px ${(section.themeColor || '#6366f1')}4D`
                                        }}
                                    >
                                        {sectionIndex + 1}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{section.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[400px]">{section.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:flex items-center gap-3">
                                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${getDifficultyColor(section.difficulty)}`}>
                                            {section.difficulty}
                                        </span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-Inter text-foreground">
                                                {section.type === 'coding' || (section.problems && section.problems.length > 0)
                                                    ? `${section.problems?.length || 0} Problems`
                                                    : section.sqlQuestions && section.sqlQuestions.length > 0
                                                        ? `${section.sqlQuestions.length} SQL Questions`
                                                        : `${section.questions?.length || 0} Questions`}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{section.timeLimit} Minutes</span>
                                            {section.negativeMarking > 0 && (
                                                <span className="text-[10px] font-bold text-red-500 uppercase mt-0.5">-{section.negativeMarking} Neg.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-0 bg-primary/10 text-primary' : 'rotate-0 bg-muted text-muted-foreground'}`}>
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="p-5 pt-0 space-y-4">
                                            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                                            <style jsx global>{`
                                                .markdown-content img {
                                                    max-width: 100% !important;
                                                    height: auto;
                                                    border-radius: 12px;
                                                    border: 1px solid hsl(var(--border));
                                                    margin: 1.5rem 0;
                                                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                                                }
                                            `}</style>

                                            {(!section.questions?.length && (!section.problems || section.problems.length === 0) && (!section.sqlQuestions || section.sqlQuestions.length === 0)) ? (
                                                <div className="flex flex-col items-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                                    <AlertCircle size={24} className="mb-2 opacity-20" />
                                                    <p className="text-sm font-medium">This section is currently empty</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {/* Coding Problems */}
                                                    {section.problems?.map((problemLink: any, pIndex: number) => {
                                                        const problem = problemLink.problem || problemLink;
                                                        const problemData = {
                                                            ...problem,
                                                            title: problem.title || `Coding Problem ${pIndex + 1}`,
                                                            content: problem.description || problem.content,
                                                            description: problem.description || problem.content,
                                                            difficulty: problem.difficulty || section.difficulty,
                                                            topicTags: problem.topicTags || [],
                                                            starterCode: problem.starterCode || {},
                                                            exampleTestcases: problem.exampleTestcases || [],
                                                            hiddenTestcases: problem.hiddenTestcases || []
                                                        };
                                                        return (
                                                            <div key={problem.id || pIndex} className="bg-muted/30 rounded-2xl p-1 border border-border/50">
                                                                <CodingQuestionDisplay
                                                                    problem={problemData}
                                                                    questionNumber={pIndex + 1}
                                                                    marks={problemLink.marks || section.marksPerQuestion || 10}
                                                                />
                                                            </div>
                                                        );
                                                    })}

                                                    {/* SQL Questions */}
                                                    {section.sqlQuestions?.map((sqlQuestion: any, sIndex: number) => (
                                                        <div key={sqlQuestion.id || sIndex} className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-amber-500/10 text-amber-600 rounded-lg font-Inter text-xs shrink-0 border border-amber-500/20">
                                                                    {sIndex + 1}
                                                                </div>
                                                                <span className="text-xs font-Inter text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase">
                                                                    SQL Question
                                                                </span>
                                                                <span className="text-xs font-Inter text-primary ml-auto bg-primary/10 px-2.5 py-1 rounded-full">
                                                                    {sqlQuestion.marks || section.marksPerQuestion || 0} MARKS
                                                                </span>
                                                            </div>
                                                            <div className="bg-card rounded-xl border border-border p-4">
                                                                <SQLQuestionDisplay question={sqlQuestion} />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Regular Questions */}
                                                    {section.questions && section.type !== 'coding' && section.questions.map((question: Question, qIndex: number) => (
                                                        <div key={question.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/20 transition-all">
                                                            <div className="flex items-start gap-4">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg font-Inter text-xs shrink-0 shadow-md">
                                                                    {qIndex + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border">
                                                                            {getQuestionTypeIcon(question.type)}
                                                                            <span className="text-[10px] font-bold uppercase tracking-tight">
                                                                                {question.type.replace(/_/g, ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs font-Inter text-primary ml-auto bg-primary/10 px-2.5 py-1 rounded-full">
                                                                            {question.marks} MARKS
                                                                        </span>
                                                                        {(question.negativeMarks || section.negativeMarking) > 0 && (
                                                                            <span className="text-xs font-Inter text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                                                                -{question.negativeMarks ?? section.negativeMarking} NEG
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-foreground font-semibold leading-relaxed mb-4">{question.text}</p>

                                                                    {question.image && (
                                                                        <div className="mb-4">
                                                                            <img
                                                                                src={question.image}
                                                                                alt="Question Context"
                                                                                className="h-32 w-auto object-contain rounded-lg border border-border shadow-sm bg-muted/20"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    if (e.currentTarget.parentElement) {
                                                                                        e.currentTarget.parentElement.style.display = 'none';
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Options List */}
                                                                    {question.options && question.options.length > 0 && (
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            {question.options.map((option: string, optIndex: number) => {
                                                                                const optIndexStr = String(optIndex);
                                                                                const isCorrect = question.correctAnswer === optIndexStr ||
                                                                                    question.correctAnswer === option ||
                                                                                    (Array.isArray(question.correctAnswer) && (
                                                                                        question.correctAnswer.includes(optIndexStr) ||
                                                                                        question.correctAnswer.includes(option)
                                                                                    ));
                                                                                return (
                                                                                    <div key={optIndex} className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm' : 'bg-muted/40 border-border/50 text-foreground'
                                                                                        }`}>
                                                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-lg font-bold text-[10px] ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                                                                                            }`}>
                                                                                            {String.fromCharCode(65 + optIndex)}
                                                                                        </div>
                                                                                        <span className="flex-1 font-medium">{option}</span>
                                                                                        {isCorrect && <CheckCircle size={14} className="shrink-0" />}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}

                                                                    {/* Code Snippet */}
                                                                    {question.codeStub && (
                                                                        <div className="mt-4 rounded-xl overflow-hidden border border-border shadow-inner">
                                                                            <div className="bg-muted px-4 py-1.5 border-b border-border flex items-center justify-between">
                                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Reference Code</span>
                                                                                <Code size={12} className="text-muted-foreground" />
                                                                            </div>
                                                                            <pre className="bg-[#1e1e1e] p-4 text-xs text-emerald-400 overflow-x-auto font-mono">
                                                                                <code>{question.codeStub}</code>
                                                                            </pre>
                                                                        </div>
                                                                    )}

                                                                    {/* Fill in the Blank */}
                                                                    {question.type === 'fill_in_the_blank' && question.correctAnswer && (
                                                                        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 border-dashed">
                                                                            <span className="text-xs font-bold text-muted-foreground">Expected Answer:</span>
                                                                            <span className="text-sm font-Inter text-emerald-600">{question.correctAnswer}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default OverviewTab;
