'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Code2, Tag, Terminal, FileText, CheckCircle, AlertTriangle,
    ChevronDown, Copy, Check, Zap, BarChart2,
    Layers, Play, Hash
} from 'lucide-react';

// Types
export interface CodingProblemData {
    id?: string;
    title: string;
    titleSlug?: string;
    content?: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
    topicTags?: Array<{ name: string; slug: string }>;
    starterCode?: {
        python?: string;
        'c++'?: string;
        java?: string;
        javascript?: string;
    };
    solution?: {
        python?: string;
        'c++'?: string;
        java?: string;
        javascript?: string;
    };
    exampleTestcases?: Array<{ input: string; output: string }>;
    hiddenTestcases?: Array<{ input: string; output: string }>;
}

interface CodingQuestionDisplayProps {
    problem: CodingProblemData;
    questionNumber?: number;
    marks?: number;
    compact?: boolean;
    showSolution?: boolean;
}

const CodingQuestionDisplay: React.FC<CodingQuestionDisplayProps> = ({
    problem,
    questionNumber,
    marks = 10,
    compact = false,
    showSolution = false
}) => {
    const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');
    const [showTestCases, setShowTestCases] = useState(true);
    const [showCode, setShowCode] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);

    // Console log incoming data for debugging
    useEffect(() => {
        console.log('🔍 CodingQuestionDisplay - Incoming Problem Data:', {
            title: problem.title,
            titleSlug: problem.titleSlug,
            difficulty: problem.difficulty,
            hasContent: !!problem.content,
            hasDescription: !!problem.description,
            contentLength: problem.content?.length,
            descriptionLength: problem.description?.length,
            topicTags: problem.topicTags,
            exampleTestcases: problem.exampleTestcases,
            hiddenTestcasesCount: problem.hiddenTestcases?.length,
            starterCode: problem.starterCode,
            fullProblem: problem
        });
    }, [problem]);

    // Get the problem description - check both content and description fields
    const problemDescription = problem.content || problem.description || '';

    // Get difficulty styles
    const getDifficultyStyles = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
            case 'medium':
                return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
            case 'hard':
                return 'bg-red-500/15 text-red-500 border-red-500/30';
            default:
                return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
        }
    };

    // Copy code to clipboard
    const copyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // Get current code based on active tab
    const getCurrentCode = () => {
        const codeMap: Record<string, string | undefined> = {
            python: problem.starterCode?.python,
            cpp: problem.starterCode?.['c++'],
            java: problem.starterCode?.java,
            javascript: problem.starterCode?.javascript
        };
        return codeMap[activeCodeTab] || '';
    };

    const totalTestCases = (problem.exampleTestcases?.length || 0) + (problem.hiddenTestcases?.length || 0);

    return (
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">

            {/* ═══════════════════════════════════════════════════════════════════════════
                HEADER: Title, Difficulty, Tags, Marks
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-4 border-b border-border bg-muted/30">

                {/* Top Row: Number + Title + Difficulty + Marks */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Question Number */}
                        {questionNumber && (
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {questionNumber}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            {/* Problem Title */}
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-0.5">
                                <Code2 size={16} className="text-primary shrink-0" />
                                <span className="truncate">{problem.title}</span>
                            </h3>

                            {/* Slug / Path */}
                            {problem.titleSlug && (
                                <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                    <Hash size={11} />
                                    {problem.titleSlug}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Difficulty + Marks */}
                    <div className="flex items-center gap-2 shrink-0">
                        {problem.difficulty && (
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${getDifficultyStyles(problem.difficulty)}`}>
                                {problem.difficulty === 'Easy' && <Zap size={11} />}
                                {problem.difficulty === 'Medium' && <BarChart2 size={11} />}
                                {problem.difficulty === 'Hard' && <AlertTriangle size={11} />}
                                {problem.difficulty}
                            </span>
                        )}
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <CheckCircle size={11} />
                            {marks} pts
                        </span>
                    </div>
                </div>

                {/* Topic Tags */}
                {problem.topicTags && problem.topicTags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <Tag size={12} className="text-muted-foreground" />
                        {problem.topicTags.slice(0, 6).map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded border border-border"
                            >
                                {tag.name}
                            </span>
                        ))}
                        {problem.topicTags.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{problem.topicTags.length - 6} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                PROBLEM DESCRIPTION - Rendered with ReactMarkdown
            ═══════════════════════════════════════════════════════════════════════════ */}
            {problemDescription && (
                <div className="p-5 border-b border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={14} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">Problem Statement</span>
                    </div>

                    <div className="markdown-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border first:mt-0">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-lg font-bold text-foreground mt-5 mb-3">
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-base font-semibold text-foreground mt-4 mb-2">
                                        {children}
                                    </h3>
                                ),
                                p: ({ children }) => (
                                    <p className="text-sm text-foreground/90 my-3 leading-relaxed">
                                        {children}
                                    </p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside text-sm text-foreground/90 my-3 space-y-1.5 ml-2">
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal list-inside text-sm text-foreground/90 my-3 space-y-1.5 ml-2">
                                        {children}
                                    </ol>
                                ),
                                li: ({ children }) => (
                                    <li className="text-sm text-foreground/90 leading-relaxed">
                                        {children}
                                    </li>
                                ),
                                code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    if (isInline) {
                                        return (
                                            <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                    return (
                                        <code className="block bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg text-xs font-mono overflow-x-auto" {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                pre: ({ children }) => (
                                    <pre className="my-3 rounded-lg overflow-hidden">
                                        {children}
                                    </pre>
                                ),
                                strong: ({ children }) => (
                                    <strong className="font-semibold text-foreground">{children}</strong>
                                ),
                                em: ({ children }) => (
                                    <em className="italic text-foreground/90">{children}</em>
                                ),
                                hr: () => (
                                    <hr className="border-border my-5" />
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-primary/50 pl-4 my-3 italic text-foreground/80">
                                        {children}
                                    </blockquote>
                                ),
                            }}
                        >
                            {problemDescription}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                EXAMPLE TEST CASES - Show ALL examples
            ═══════════════════════════════════════════════════════════════════════════ */}
            {problem.exampleTestcases && problem.exampleTestcases.length > 0 && (
                <div className="p-5 border-b border-border">
                    {/* Header */}
                    <div
                        onClick={() => setShowTestCases(!showTestCases)}
                        className="flex items-center justify-between w-full text-left mb-4 cursor-pointer group"
                    >
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-primary" />
                            <span className="text-sm font-semibold text-foreground">Example Test Cases</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                                {problem.exampleTestcases.length} examples
                            </span>
                            {problem.hiddenTestcases && problem.hiddenTestcases.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                    +{problem.hiddenTestcases.length} hidden
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            size={14}
                            className={`text-muted-foreground transition-transform duration-200 ${showTestCases ? 'rotate-180' : ''}`}
                        />
                    </div>

                    <AnimatePresence>
                        {showTestCases && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 overflow-hidden"
                            >
                                {/* Show ALL test cases */}
                                {problem.exampleTestcases.map((tc, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-muted/30 rounded-lg border border-border overflow-hidden"
                                    >
                                        {/* Test Case Header */}
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                                            <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-semibold text-foreground">
                                                Example {idx + 1}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 divide-x divide-border">
                                            {/* Input */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Play size={12} className="text-emerald-500" />
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Input</span>
                                                </div>
                                                <pre className="text-sm font-mono text-foreground bg-background rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap break-all border border-border leading-relaxed">
                                                    {tc.input}
                                                </pre>
                                            </div>

                                            {/* Output */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle size={12} className="text-blue-500" />
                                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Expected Output</span>
                                                </div>
                                                <pre className="text-sm font-mono text-foreground bg-background rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap break-all border border-border leading-relaxed">
                                                    {tc.output}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Count Summary */}
                                {totalTestCases > problem.exampleTestcases.length && (
                                    <div className="flex items-center justify-center pt-2">
                                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                                            Total: <strong className="text-foreground">{totalTestCases}</strong> test cases ({problem.exampleTestcases.length} shown, {problem.hiddenTestcases?.length || 0} hidden)
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                STARTER CODE - With Language Tabs
            ═══════════════════════════════════════════════════════════════════════════ */}
            {problem.starterCode && Object.values(problem.starterCode).some(Boolean) && (
                <div className="p-5">
                    {/* Header */}
                    <div
                        onClick={() => setShowCode(!showCode)}
                        className="flex items-center justify-between w-full text-left mb-4 cursor-pointer group"
                    >
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-primary" />
                            <span className="text-sm font-semibold text-foreground">Starter Code</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                onClick={(e) => { e.stopPropagation(); copyCode(getCurrentCode()); }}
                                className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors border border-border cursor-pointer"
                            >
                                {copiedCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                {copiedCode ? 'Copied!' : 'Copy'}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-muted-foreground transition-transform duration-200 ${showCode ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showCode && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {/* Language Tabs */}
                                <div className="flex items-center gap-1 mb-3 pb-2 border-b border-border">
                                    {[
                                        { key: 'python', label: 'Python' },
                                        { key: 'cpp', label: 'C++' },
                                        { key: 'java', label: 'Java' },
                                        { key: 'javascript', label: 'JavaScript' }
                                    ].map(({ key, label }) => {
                                        const codeKey = key === 'cpp' ? 'c++' : key;
                                        const hasCode = problem.starterCode?.[codeKey as keyof typeof problem.starterCode];
                                        if (!hasCode) return null;

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setActiveCodeTab(key as any)}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${activeCodeTab === key
                                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Code Block - VS Code Style */}
                                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#3c3c3c]">
                                    {/* Editor Header */}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                        </div>
                                        <span className="text-xs font-mono text-[#858585]">
                                            solution.{activeCodeTab === 'cpp' ? 'cpp' : activeCodeTab === 'javascript' ? 'js' : activeCodeTab === 'java' ? 'java' : 'py'}
                                        </span>
                                    </div>

                                    {/* Code Content */}
                                    <pre className="p-4 text-sm font-mono text-[#d4d4d4] overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed">
                                        <code>{getCurrentCode()}</code>
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default CodingQuestionDisplay;
