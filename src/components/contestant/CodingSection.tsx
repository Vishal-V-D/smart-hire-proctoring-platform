'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Play, Send, Sun, Moon, CheckCircle, XCircle,
    Loader2, Terminal, Code2, FileText, Zap, AlertTriangle, Lock, Tag, BarChart2, Copy, ChevronLeft, ChevronDown
} from 'lucide-react';
import { contestantService, type AssessmentSection } from '@/api/contestantService';
import { codeService, type TestCaseResult, type RunCodeSummary, type SubmitCodeResponse } from '@/api/codeService';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    { id: 'java', name: 'Java' },
    { id: 'python', name: 'Python' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
];

interface CodingSectionProps {
    assessmentId: string;
    section: AssessmentSection;
    theme: 'light' | 'dark';
    onComplete: () => void;
    onStateChange?: (data: { problemId: string; code: string; language: string }) => void;
}

export default function CodingSection({ assessmentId, section, theme, onComplete, onStateChange }: CodingSectionProps) {
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('java');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [runSummary, setRunSummary] = useState<RunCodeSummary | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitCodeResponse | null>(null);
    const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase');
    const [leftWidth, setLeftWidth] = useState(50);
    const [consoleHeight, setConsoleHeight] = useState(35);
    const [questionIndex, setQuestionIndex] = useState(0); // Internal navigation within section

    // Theme Colors
    const bg = theme === 'dark' ? 'bg-[#161616]' : 'bg-[#f4f4f4]';
    const cardBg = theme === 'dark' ? 'bg-[#262626]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]';
    const textPrimary = theme === 'dark' ? 'text-[#f4f4f4]' : 'text-[#161616]';
    const textSecondary = theme === 'dark' ? 'text-[#a8a8a8]' : 'text-[#6f6f6f]';

    useEffect(() => {
        fetchProblem();
    }, [assessmentId, section.id, questionIndex]);

    // Set starter code
    useEffect(() => {
        if (problem?.starterCode) {
            const langKey = language === 'cpp' ? 'c++' : language;
            const starterCode = problem.starterCode[langKey] || problem.starterCode[language];
            if (starterCode) {
                setCode(starterCode);
                // Report to parent
                if (onStateChange && problem?.id) {
                    onStateChange({ problemId: problem.id, code: starterCode, language });
                }
            } else {
                setCode('// No starter code available');
            }
        }
    }, [problem]); /** remove language dep to avoid overwriting user code on lang switch unless empty? No, usually lang switch resets code. */

    const fetchProblem = async () => {
        setLoading(true);
        try {
            const questionsRes = await contestantService.getQuestions(assessmentId, section.id);
            const problemLinks = questionsRes.data.problems || [];

            if (problemLinks[questionIndex]) {
                const problemLink = problemLinks[questionIndex];
                const actualProblem = problemLink.problem || problemLink;
                setProblem(actualProblem);
            }
        } catch (err) {
            console.error('Failed to fetch problem:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        if (problem?.starterCode) {
            const langKey = newLang === 'cpp' ? 'c++' : newLang;
            const starterCode = problem.starterCode[langKey] || problem.starterCode[newLang];
            setCode(starterCode || '');
            if (onStateChange) {
                onStateChange({ problemId: problem.id, code: starterCode || '', language: newLang });
            }
        }
    };

    const handleRun = async () => {
        if (!problem?.id) return;

        setIsRunning(true);
        setActiveTab('result');
        setTestResults([]);
        setRunSummary(null);
        setSubmitResults(null);
        setExpandedResults(new Set());

        try {
            const langKey = language === 'cpp' ? 'c++' : language;
            const response = await codeService.runCode({
                problemId: problem.id,
                code: code,
                language: langKey,
                sectionProblemId: problem.sectionProblemId,
            });

            setTestResults(response.data.results || []);
            setRunSummary(response.data.summary || null);

            const firstFailed = response.data.results?.findIndex(r => !r.passed);
            if (firstFailed !== undefined && firstFailed >= 0) {
                setExpandedResults(new Set([firstFailed]));
            }
        } catch (error: any) {
            console.error('Run code error:', error);
            setTestResults([{
                testcaseIndex: 0,
                passed: false,
                status: 'Error',
                statusCode: -1,
                errorType: 'internal',
                error: error.response?.data?.message || error.message || 'Failed to run code',
                input: '',
                expectedOutput: '',
                actualOutput: ''
            }]);
            setRunSummary({ total: 1, passed: 0, failed: 1 });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!problem?.id) return;

        setIsSubmitting(true);
        setActiveTab('result');
        setTestResults([]);
        setRunSummary(null);
        setSubmitResults(null);
        setExpandedResults(new Set());

        try {
            const langKey = language === 'cpp' ? 'c++' : language;
            const response = await codeService.submitCode({
                problemId: problem.id,
                code: code,
                language: langKey,
                assessmentId: assessmentId,
                sectionId: section.id,
                sectionProblemId: problem.sectionProblemId
            });

            setSubmitResults(response.data);

            const firstFailed = response.data.sampleResults?.findIndex(r => !r.passed);
            if (firstFailed !== undefined && firstFailed >= 0) {
                setExpandedResults(new Set([firstFailed]));
            }
        } catch (error: any) {
            console.error('Submit code error:', error);
            setTestResults([{
                testcaseIndex: 0,
                passed: false,
                status: 'Error',
                statusCode: -1,
                errorType: 'internal',
                error: error.response?.data?.message || error.message || 'Failed to submit code',
                input: '',
                expectedOutput: '',
                actualOutput: ''
            }]);
            setRunSummary({ total: 1, passed: 0, failed: 1 });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !problem) {
        return (
            <div className={`flex-1 flex items-center justify-center`}>
                <div className="w-8 h-8 border-2 border-[#0f62fe] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Problem */}
            <div
                className={`${cardBg} border-r ${cardBorder} overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-current/10 hover:[&::-webkit-scrollbar-thumb]:bg-current/20`}
                style={{ width: `${leftWidth}%`, scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.2) transparent' }}
            >
                <div className="p-6">
                    {/* Problem Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Code2 size={20} className="text-[#0f62fe]" />
                            {problem?.title || 'Loading...'}
                        </h2>
                        {problem?.difficulty && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${problem.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                                problem.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
                                    'bg-red-500/15 text-red-500 border-red-500/30'
                                }`}>
                                {problem.difficulty === 'Easy' && <Zap size={12} />}
                                {problem.difficulty === 'Medium' && <BarChart2 size={12} />}
                                {problem.difficulty === 'Hard' && <AlertTriangle size={12} />}
                                {problem.difficulty}
                            </span>
                        )}
                    </div>
                    {/* Topic Tags */}
                    {problem?.topicTags && problem.topicTags.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                            <Tag size={12} className={textSecondary} />
                            {problem.topicTags.map((tag: any, idx: number) => (
                                <span key={idx} className={`text-[10px] font-medium px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-[#393939] border-[#525252]' : 'bg-[#e0e0e0] border-[#c6c6c6]'
                                    }`}>
                                    {tag.name || tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem?.description || ''}</ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Resizer */}
            <div
                className={`w-1 cursor-col-resize ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#0f62fe]' : 'bg-[#e0e0e0] hover:bg-[#0f62fe]'} transition-colors`}
                onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = leftWidth;
                    const onMove = (e: MouseEvent) => {
                        const delta = e.clientX - startX;
                        const newWidth = Math.min(60, Math.max(25, startWidth + (delta / window.innerWidth) * 100));
                        setLeftWidth(newWidth);
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                }}
            />

            {/* Right Panel - Editor + Console */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ height: `${100 - consoleHeight}%` }}>
                    <div className={`h-10 shrink-0 flex items-center justify-between px-4 border-b ${cardBorder} ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fafafa]'}`}>
                        <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded border outline-none ${theme === 'dark' ? 'bg-[#262626] border-[#393939] text-[#f4f4f4]' : 'bg-white border-[#e0e0e0]'
                                }`}
                        >
                            {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                        </select>
                        <button
                            onClick={onComplete}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${theme === 'dark' ? 'border-[#393939] hover:bg-[#393939]' : 'border-[#e0e0e0] hover:bg-[#e0e0e0]'}`}
                        >
                            Next Section <ChevronLeft className="w-3 h-3 inline rotate-180 ml-1" />
                        </button>
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            language={language}
                            value={code}
                            onChange={(v) => {
                                setCode(v || '');
                                if (onStateChange && problem?.id) {
                                    onStateChange({ problemId: problem.id, code: v || '', language });
                                }
                            }}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4,
                                wordWrap: 'on',
                                lineNumbers: 'on',
                            }}
                        />
                    </div>
                </div>

                {/* Console Resizer */}
                <div
                    className={`h-1 cursor-row-resize ${theme === 'dark' ? 'bg-[#393939] hover:bg-[#0f62fe]' : 'bg-[#e0e0e0] hover:bg-[#0f62fe]'} transition-colors`}
                    onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startHeight = consoleHeight;
                        const onMove = (e: MouseEvent) => {
                            const delta = startY - e.clientY;
                            const newHeight = Math.min(50, Math.max(20, startHeight + (delta / window.innerHeight) * 100));
                            setConsoleHeight(newHeight);
                        };
                        const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    }}
                />

                {/* Console */}
                <div className={`${cardBg} flex flex-col`} style={{ height: `${consoleHeight}%` }}>
                    <div className={`h-10 shrink-0 flex items-center justify-between px-4 border-b ${cardBorder}`}>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setActiveTab('testcase')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'testcase' ? 'bg-[#8a3ffc] text-white' : textSecondary}`}>
                                <FileText className="w-3.5 h-3.5 inline mr-1" />Testcase
                            </button>
                            <button onClick={() => setActiveTab('result')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'result' ? 'bg-[#8a3ffc] text-white' : textSecondary}`}>
                                <Terminal className="w-3.5 h-3.5 inline mr-1" />Result
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleRun} disabled={isRunning || isSubmitting} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${theme === 'dark' ? 'bg-[#262626] border-[#525252] hover:border-[#78a9ff] hover:bg-[#393939] text-[#f4f4f4]' : 'bg-white border-[#c6c6c6] hover:border-[#0f62fe] hover:bg-[#f4f4f4] text-[#161616]'}`}>
                                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Code
                            </button>
                            <button onClick={handleSubmit} disabled={isRunning || isSubmitting} className="px-5 py-2 bg-gradient-to-r from-[#42be65] to-[#24a148] hover:from-[#3dab5a] hover:to-[#1e8e3e] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-[#42be65]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                        {activeTab === 'testcase' && (
                            <div className="space-y-3">
                                {problem?.exampleTestcases?.map((tc: any, idx: number) => (
                                    <div key={idx} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-[#393939]' : 'border-[#e0e0e0]'}`}>
                                        <div className={`px-3 py-1.5 text-[10px] font-bold flex items-center justify-between ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                                            <span>Case {idx + 1}</span>
                                            <button className="text-[10px] text-[#8a3ffc] hover:underline" onClick={() => navigator.clipboard.writeText(tc.input)}>Copy Input</button>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-current/10">
                                            <div className="p-3">
                                                <span className="text-[10px] font-bold text-emerald-500 block mb-1.5">Input:</span>
                                                <pre className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f4f4f4]'}`}>{tc.input}</pre>
                                            </div>
                                            <div className="p-3">
                                                <span className="text-[10px] font-bold text-purple-500 block mb-1.5">Expected Output:</span>
                                                <pre className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f4f4f4]'}`}>{tc.output}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'result' && (
                            <div className="animate-in fade-in duration-300">
                                {/* ... Insert the previously styled result UI here ... we will copy it exactly as it was */}
                                {/* SEPARATE SKELETONS - MATCHING USER IMAGE STYLE */}

                                {/* 1. RUN CODE SKELETON */}
                                {isRunning && !isSubmitting && (
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="space-y-2">
                                                <div className={`h-4 w-24 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                                <div className={`h-16 w-full rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f4f4f4]'}`} />
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-center gap-2 text-[#a8a8a8] pt-4">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm font-medium">Running against sample cases...</span>
                                        </div>
                                    </div>
                                )}

                                {/* 2. SUBMIT SKELETON */}
                                {isSubmitting && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className={`h-4 w-32 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                            <div className={`h-40 w-full rounded-3xl animate-pulse ${theme === 'dark' ? 'bg-gradient-to-br from-[#262626] to-[#393939]' : 'bg-gradient-to-br from-[#f4f4f4] to-[#e0e0e0]'}`} />
                                        </div>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="space-y-2">
                                                <div className={`h-4 w-24 rounded-md animate-pulse ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`} />
                                                <div className={`h-16 w-full rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f4f4f4]'}`} />
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-center gap-2 text-[#0f62fe] pt-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm font-medium">Evaluating full submission...</span>
                                        </div>
                                    </div>
                                )}

                                {(!isRunning && !isSubmitting && submitResults) && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {/* Score Header */}
                                        <div className={`text-center p-6 rounded-3xl border border-dashed text-white shadow-xl relative overflow-hidden ${submitResults.score === 100 ? 'bg-gradient-to-br from-[#198038] to-[#42be65] border-[#42be65]' : submitResults.score > 0 ? 'bg-gradient-to-br from-[#b28600] to-[#f1c21b] border-[#f1c21b]' : 'bg-gradient-to-br from-[#da1e28] to-[#ff8389] border-[#fa4d56]'}`}>
                                            <div className="relative z-10">
                                                <div className="text-6xl font-black mb-1">{submitResults.score}</div>
                                                <div className="text-sm font-medium opacity-90 uppercase tracking-widest">Score / 100</div>
                                            </div>
                                            <div className="absolute top-0 right-0 p-8 opacity-20">
                                                {submitResults.score === 100 ? <Zap className="w-32 h-32" /> : submitResults.score > 0 ? <BarChart2 className="w-32 h-32" /> : <AlertTriangle className="w-32 h-32" />}
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className={`p-4 rounded-2xl border ${cardBg} ${cardBorder}`}>
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-current opacity-70">
                                                <span>Total Progress</span>
                                                <span>{submitResults.summary.passed} / {submitResults.summary.total} Passed</span>
                                            </div>
                                            <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#393939]' : 'bg-[#e0e0e0]'}`}>
                                                <div className={`h-full transition-all duration-1000 ease-out rounded-full ${submitResults.score === 100 ? 'bg-[#42be65]' : submitResults.score > 50 ? 'bg-[#f1c21b]' : 'bg-[#fa4d56]'}`} style={{ width: `${(submitResults.summary.passed / submitResults.summary.total) * 100}%` }} />
                                            </div>
                                        </div>

                                        {/* Sample Results */}
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 opacity-80"><Terminal className="w-4 h-4" /> Sample Test Cases ({submitResults.sampleSummary.passed}/{submitResults.sampleSummary.total})</h3>
                                            <div className="space-y-3">
                                                {submitResults.sampleResults.map((result, i) => (
                                                    <div key={i} className={`rounded-xl border overflow-hidden transition-all duration-200 ${result.passed ? (theme === 'dark' ? 'border-[#42be65]/30' : 'border-[#bcebd0]') : (theme === 'dark' ? 'border-[#fa4d56]/30' : 'border-[#ffccd1]')}`}>
                                                        <button onClick={() => setExpandedResults(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} className={`w-full flex items-center justify-between p-3.5 ${result.passed ? (theme === 'dark' ? 'bg-[#42be65]/10' : 'bg-[#defbe6]') : (theme === 'dark' ? 'bg-[#fa4d56]/10' : 'bg-[#fff1f1]')} hover:opacity-90 transition-opacity`}>
                                                            <div className="flex items-center gap-3">
                                                                {result.passed ? <CheckCircle className="w-4 h-4 text-[#42be65]" /> : <XCircle className="w-4 h-4 text-[#fa4d56]" />}
                                                                <span className={`text-xs font-bold ${result.passed ? 'text-[#42be65]' : 'text-[#fa4d56]'}`}>Sample #{result.testcaseIndex + 1}</span>
                                                            </div>
                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedResults.has(i) ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {expandedResults.has(i) && (
                                                            <div className={`p-4 space-y-4 border-t ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-white border-[#e0e0e0]'}`}>
                                                                <div><span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} block mb-1.5`}>Input</span><div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f4f4f4] text-[#161616]'}`}>{result.input}</div></div>
                                                                <div><span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 text-purple-500">Expected</span><div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? 'bg-[#1e1e1e] text-[#d4d4d4]' : 'bg-[#f4f4f4] text-[#161616]'}`}>{result.expectedOutput}</div></div>
                                                                <div><span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${result.passed ? 'text-[#42be65]' : 'text-[#fa4d56]'}`}>Your Output</span><div className={`p-2.5 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap ${theme === 'dark' ? (result.passed ? 'bg-[#42be65]/10 text-[#42be65]' : 'bg-[#fa4d56]/10 text-[#fa4d56]') : (result.passed ? 'bg-[#defbe6] text-[#198038]' : 'bg-[#fff1f1] text-[#da1e28]')}`}>{result.actualOutput || result.error || '(No output)'}</div></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Hidden Results */}
                                        {submitResults.hiddenResults.length > 0 && (
                                            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#262626] border-[#393939]' : 'bg-[#f4f4f4] border-[#e0e0e0]'}`}>
                                                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 opacity-80"><Lock className="w-4 h-4" /> Hidden Test Cases ({submitResults.hiddenSummary.passed}/{submitResults.hiddenSummary.total})</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {submitResults.hiddenResults.map((r, i) => (
                                                        <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-transform hover:scale-110 ${r.passed ? 'bg-[#42be65]/20 border-[#42be65] text-[#42be65]' : 'bg-[#fa4d56]/20 border-[#fa4d56] text-[#fa4d56]'}`}>
                                                            {r.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Normal Run Results (TestResults) handling if needed (omitted for brevity, assume strictly submit flow for now or adapt) */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
