'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Split, Code2, Play, AlertTriangle,
    CheckCircle, XCircle, Terminal, Maximize2, Minimize2
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Services
import { codingQuestionService, CodingProblem } from '@/api/codingQuestionService';
import { codeService, TestCaseResult } from '@/api/codeService';

// Default starter templates
const defaultCodeStub = {
    python: `def solve():\n    # Write your code here\n    pass`,
    javascript: `function solve() {\n    // Write your code here\n}`,
    java: `class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}`,
    cpp: `class Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};`
};

export default function CodingPreviewPage({
    params
}: {
    params: Promise<{ id: string; problemId: string }>
}) {
    const { id: assessmentId, problemId } = use(params);
    const router = useRouter();

    // State
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [activeTab, setActiveTab] = useState<'console' | 'testcases'>('testcases');
    const [layout, setLayout] = useState<'split' | 'full'>('split');

    // Fetch Problem
    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                const response = await codingQuestionService.getProblem(problemId);
                const prob = response.data;
                setProblem(prob);

                // Initialize code with starter code if available
                const starter = prob.starterCode?.[language as keyof typeof prob.starterCode]
                    || defaultCodeStub[language as keyof typeof defaultCodeStub]
                    || '';
                setCode(starter);

            } catch (error) {
                console.error("Failed to fetch problem:", error);
            } finally {
                setLoading(false);
            }
        };

        if (problemId) {
            fetchProblem();
        }
    }, [problemId]);

    // Update code when language changes
    useEffect(() => {
        if (problem) {
            const starter = problem.starterCode?.[language as keyof typeof problem.starterCode]
                || defaultCodeStub[language as keyof typeof defaultCodeStub]
                || '';
            setCode(starter);
        }
    }, [language, problem]);

    // Handlers
    const handleRunCode = async () => {
        if (!problem) return;

        setIsRunning(true);
        setActiveTab('console'); // Switch to console view

        try {
            const response = await codeService.runCode({
                problemId: problem.id,
                code,
                language,
                // We're just testing the question logic, so sectionProblemId isn't strictly needed 
                // unless your backend requires it for context. Usually raw problemId is enough for preview.
            });

            if (response.data.success) {
                setTestResults(response.data.results);
            } else {
                // If the run itself failed (compile error usually returns success=true but with error results)
                console.error("Run failed:", response.data);
            }
        } catch (error) {
            console.error("Execution error:", error);
        } finally {
            setIsRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-bold">Problem Not Found</h2>
                <button onClick={() => router.back()} className="text-primary hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden no-shared-layout">
            <style jsx global>{`
                /* Hide sidebar for preview mode */
                aside { display: none !important; }
                main { width: 100% !important; margin-left: 0 !important; }
            `}</style>

            {/* 
                HEADER 
            */}
            <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/20 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Back to Assessment"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="font-bold text-sm flex items-center gap-2">
                            <Code2 size={16} className="text-primary" />
                            {problem.title}
                        </h1>
                        <span className="text-xs text-muted-foreground font-mono">Preview Mode</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-transparent text-sm border border-border rounded-md px-2 py-1.5 focus:border-primary outline-none"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>

                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-bold transition-all disabled:opacity-50"
                    >
                        {isRunning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play size={16} fill="currentColor" />
                        )}
                        Run Test
                    </button>
                </div>
            </div>

            {/* 
                MAIN CONTENT - SPLIT VIEW 
            */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Problem Description */}
                <div className="w-2/5 border-r border-border flex flex-col min-w-[300px]">
                    <div className="h-full overflow-y-auto p-6 scrollbar-thin">
                        <div className="flex items-center gap-2 mb-6">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border
                                ${problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                    problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                        'bg-red-500/10 text-red-600 border-red-500/20'
                                }`}>
                                {problem.difficulty}
                            </span>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {problem.content || "_No description available._"}
                            </ReactMarkdown>
                        </div>

                        {/* Examples */}
                        {problem.exampleTestcases && problem.exampleTestcases.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <h3 className="font-bold text-sm">Examples</h3>
                                {problem.exampleTestcases.map((ex, i) => (
                                    <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border text-sm">
                                        <div className="mb-2">
                                            <span className="font-semibold text-xs text-muted-foreground uppercase">Input:</span>
                                            <pre className="mt-1 bg-background p-2 rounded border border-border overflow-x-auto">{ex.input}</pre>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-xs text-muted-foreground uppercase">Output:</span>
                                            <pre className="mt-1 bg-background p-2 rounded border border-border overflow-x-auto">{ex.output}</pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Editor & Console */}
                <div className="w-3/5 flex flex-col min-w-[400px]">

                    {/* EDITOR */}
                    <div className="flex-1 min-h-0 relative">
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 }
                            }}
                        />
                    </div>

                    {/* CONSOLE / RESULTS */}
                    <div className="h-[250px] shrink-0 flex flex-col bg-muted/10 border-t border-border">
                        {/* Console Tabs */}
                        <div className="flex items-center gap-1 p-1 border-b border-border bg-muted/20">
                            <button
                                onClick={() => setActiveTab('testcases')}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === 'testcases' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                                Test Cases
                            </button>
                            <button
                                onClick={() => setActiveTab('console')}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === 'console' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                                Run Result
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'testcases' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground mb-4">
                                        These define the input/output expectations.
                                    </p>
                                    {problem.exampleTestcases?.map((tc, k) => (
                                        <div key={k} className="bg-background rounded border border-border p-3 text-xs font-mono space-y-2">
                                            <div>
                                                <span className="text-muted-foreground">In:</span> <span className="text-foreground">{tc.input}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Out:</span> <span className="text-foreground">{tc.output}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'console' && (
                                <div className="space-y-3">
                                    {!isRunning && testResults.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-60">
                                            <Terminal size={24} className="mb-2" />
                                            <p>Run your code to see results here</p>
                                        </div>
                                    )}

                                    {testResults.map((result, idx) => (
                                        <div key={idx} className={`border rounded-lg p-3 text-sm ${result.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-bold flex items-center gap-1.5 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    Test Case {idx + 1}
                                                </span>
                                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                                                    {result.time || '0.0s'}
                                                </span>
                                            </div>

                                            {result.compileError && (
                                                <div className="bg-background p-2 rounded border border-destructive/20 text-destructive font-mono text-xs whitespace-pre-wrap">
                                                    {result.compileError}
                                                </div>
                                            )}

                                            {!result.passed && !result.compileError && (
                                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                                                    <div className="bg-background p-2 rounded border border-border">
                                                        <span className="block text-muted-foreground mb-1">Expected:</span>
                                                        {result.expectedOutput}
                                                    </div>
                                                    <div className="bg-background p-2 rounded border border-border">
                                                        <span className="block text-muted-foreground mb-1">Actual:</span>
                                                        {result.actualOutput}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
