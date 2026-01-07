'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Code, CheckCircle, Clock, Zap, Brain, FileText, Target, Award, Loader2 } from 'lucide-react';
import type { SubmissionResponse } from '@/api/submissionService';
import { submissionService } from '@/api/submissionService';
import { toast } from 'react-toastify';

const SubmissionDetailView = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!id) return;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response = await submissionService.getSubmissionById(id) as any;
                setSubmission(response.data);
            } catch (error) {
                console.error("Failed to fetch submission:", error);
                toast.error("Failed to load submission details");
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-primary flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 text-theme-primary">
                    <Loader2 className="animate-spin text-theme-accent" size={48} />
                    <p className="font-semibold">Loading submission details...</p>
                </div>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-theme-primary flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-theme-primary mb-4">No Submission Data</h2>
                    <p className="text-theme-secondary mb-6">The requested submission could not be found.</p>
                    <button
                        onClick={() => router.back()}
                        className="button-theme text-theme-primary px-6 py-3 rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const formatCode = (code: string) => {
        if (!code) return 'Code not available';
        return code;
    };

    type FeedbackSections = {
        correctness?: string;
        testAnalysis?: string;
        timeComplexity?: string;
        spaceComplexity?: string;
        codeQuality?: string;
        fixes?: string;
        summary?: string;
    };

    const parseFeedback = (feedback: string): FeedbackSections => {
        const sections: FeedbackSections = {};

        // Extract sections 1-7
        const section1Match = feedback.match(/1\)\s*Correctness Summary\s*([\s\S]*?)(?=2\)|$)/i);
        const section2Match = feedback.match(/2\)\s*Test Case Analysis\s*([\s\S]*?)(?=3\)|$)/i);
        const section3Match = feedback.match(/3\)\s*Time Complexity\s*([\s\S]*?)(?=4\)|$)/i);
        const section4Match = feedback.match(/4\)\s*Space Complexity\s*([\s\S]*?)(?=5\)|$)/i);
        const section5Match = feedback.match(/5\)\s*Code Quality & Style\s*([\s\S]*?)(?=6\)|$)/i);
        const section6Match = feedback.match(/6\)\s*Fixes\s*([\s\S]*?)(?=7\)|$)/i);
        const section7Match = feedback.match(/7\)\s*Summary\s*([\s\S]*?)$/i);

        if (section1Match) sections.correctness = section1Match[1].trim();
        if (section2Match) sections.testAnalysis = section2Match[1].trim();
        if (section3Match) sections.timeComplexity = section3Match[1].trim();
        if (section4Match) sections.spaceComplexity = section4Match[1].trim();
        if (section5Match) sections.codeQuality = section5Match[1].trim();
        if (section6Match) sections.fixes = section6Match[1].trim();
        if (section7Match) sections.summary = section7Match[1].trim();

        return sections;
    };

    const formatCodeBlock = (text: string) => {
        const codeMatch = text.match(/```(\w+)?\n([\s\S]*?)```/);
        if (codeMatch) {
            const language = codeMatch[1] || 'python';
            const code = codeMatch[2].trim();
            return { language, code };
        }
        return null;
    };

    const aiFeedback = submission.feedback;
    const parsedFeedback = typeof aiFeedback === 'string' ? parseFeedback(aiFeedback) : null;
    const fixesCode = parsedFeedback?.fixes ? formatCodeBlock(parsedFeedback.fixes) : null;

    return (
        <div className="min-h-screen bg-theme-primary p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Submissions</span>
                    </button>
                    <h1 className="text-4xl font-bold text-theme-primary mb-2">Submission Details</h1>
                    <p className="text-theme-secondary">Comprehensive analysis and code review</p>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Info Card */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-purple-500/10">
                                    <User size={24} className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-theme-secondary">Username</p>
                                    <p className="text-lg font-bold text-theme-primary">{submission.username || submission.userId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Language Card */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-blue-500/10">
                                    <Code size={24} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-theme-secondary">Programming Language</p>
                                    <p className="text-lg font-bold text-blue-600">{submission.language}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-lg ${submission.status === 'ACCEPTED' ? 'bg-green-500/10' :
                                    submission.status === 'WRONG_ANSWER' ? 'bg-red-500/10' :
                                        'bg-yellow-500/10'
                                    }`}>
                                    <CheckCircle size={24} className={
                                        submission.status === 'ACCEPTED' ? 'text-green-500' :
                                            submission.status === 'WRONG_ANSWER' ? 'text-red-500' :
                                                'text-yellow-500'
                                    } />
                                </div>
                                <div>
                                    <p className="text-xs text-theme-secondary">Verdict</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${submission.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                                        submission.status === "WRONG_ANSWER" ? "bg-red-100 text-red-700" :
                                            submission.status === "TIME_LIMIT_EXCEEDED" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-orange-100 text-orange-700"
                                        }`}>
                                        {submission.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Points Card */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-orange-500/10">
                                    <Award size={24} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-theme-secondary">Score</p>
                                    <p className="text-3xl font-bold text-orange-600">{submission.points}</p>
                                    <p className="text-xs text-theme-secondary mt-1">points</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Detailed Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Test Results */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                                <CheckCircle size={24} className="text-green-500" />
                                Test Results & Performance
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-theme-tertiary rounded-lg p-4 text-center border border-theme">
                                    <p className="text-xs text-theme-secondary mb-1">Tests Passed</p>
                                    <p className="text-3xl font-bold text-green-500">{submission.passedTests}</p>
                                    <p className="text-xs text-theme-secondary">of {submission.totalTests}</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-4 text-center border border-theme">
                                    <p className="text-xs text-theme-secondary mb-1">Score</p>
                                    <p className="text-3xl font-bold text-purple-500">{submission.points}</p>
                                    <p className="text-xs text-theme-secondary">points</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-4 text-center border border-theme">
                                    <Clock size={16} className="mx-auto mb-1 text-blue-500" />
                                    <p className="text-xs text-theme-secondary mb-1">Execution Time</p>
                                    <p className="text-xl font-bold text-blue-500">{submission.executionTime || 'N/A'}</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-4 text-center border border-theme">
                                    <Zap size={16} className="mx-auto mb-1 text-yellow-500" />
                                    <p className="text-xs text-theme-secondary mb-1">Memory Used</p>
                                    <p className="text-xl font-bold text-yellow-500">{submission.memory || submission.memoryUsed || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Judge Feedback */}
                        {submission.feedback && typeof submission.feedback === 'string' && (
                            <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme border-l-4 border-l-blue-500">
                                <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">
                                    <FileText size={28} className="text-blue-500" />
                                    AI Critique
                                </h2>

                                {(() => {
                                    const fb = submission.feedback as string;

                                    // Extract each numbered section cleanly
                                    const extractSection = (start: number, end?: number): string | undefined => {
                                        const pattern = new RegExp(`${start}\\)[\\s\\S]*?${end ? `${end}\\)` : '$'}`, 'i');
                                        const match = fb.match(pattern);
                                        if (!match) return undefined;

                                        let text = match[0]
                                            // Remove section numbers like "1)" and next section's "2)"
                                            .replace(new RegExp(`^${start}\\)\\s*`, 'i'), '')
                                            .replace(new RegExp(`${end ? `${end}\\)$` : ''}`, 'i'), '')
                                            .trim();

                                        // Remove repeated section titles
                                        text = text.replace(/^(Correctness Summary|Test Case Analysis|Time Complexity|Space Complexity|Code Quality & Style|Fixes|Summary)\s*/gi, '');
                                        // Also remove any leftover trailing "1)" or "2)" accidentally captured inside text
                                        text = text.replace(/\b\d+\)\s*$/gm, '');

                                        const trimmed = text.trim();
                                        return trimmed.length > 0 ? trimmed : undefined;
                                    };

                                    // Extract all sections
                                    const sections = {
                                        correctness: extractSection(1, 2),
                                        test: extractSection(2, 3),
                                        time: extractSection(3, 4),
                                        space: extractSection(4, 5),
                                        quality: extractSection(5, 6),
                                        fixes: extractSection(6, 7),
                                        summary: extractSection(7),
                                    };

                                    // Parse code blocks if present
                                    const getCodeBlock = (text: string) => {
                                        const match = text.match(/```(\w+)?\n([\s\S]*?)```/);
                                        if (match) {
                                            return { lang: match[1] || 'python', code: match[2].trim() };
                                        }
                                        return null;
                                    };

                                    // Render one feedback section
                                    const renderSection = (title: string, color: string, text?: string, icon?: ReactNode) => {
                                        if (!text) return null;
                                        const codeBlock = getCodeBlock(text);
                                        const cleanText = text.replace(/```[\s\S]*?```/g, '').trim();

                                        return (
                                            <div key={title} className="bg-theme-tertiary rounded-lg p-4 border border-theme space-y-3">
                                                <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}>
                                                    {icon}
                                                    {title}
                                                </h3>

                                                {cleanText && (
                                                    <p className="text-theme-secondary whitespace-pre-wrap">{cleanText}</p>
                                                )}

                                                {codeBlock && (
                                                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                                                        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                                                            <span className="text-gray-400 text-xs font-mono">{codeBlock.lang}</span>
                                                        </div>
                                                        <pre className="p-4 overflow-x-auto text-green-400 text-sm font-mono leading-relaxed max-h-96">
                                                            <code>{codeBlock.code}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    };

                                    return (
                                        <div className="space-y-6">
                                            {renderSection('Correctness Summary', 'text-red-600', sections.correctness, <Target size={20} />)}
                                            {renderSection('Test Case Analysis', 'text-orange-600', sections.test, <CheckCircle size={20} />)}
                                            {renderSection('Time Complexity', 'text-purple-600', sections.time, <Clock size={20} />)}
                                            {renderSection('Space Complexity', 'text-blue-600', sections.space, <Zap size={20} />)}
                                            {renderSection('Code Quality & Style', 'text-violet-600', sections.quality, <Code size={20} />)}
                                            {renderSection('Fixes', 'text-green-600', sections.fixes, <CheckCircle size={20} />)}
                                            {renderSection('Summary', 'text-gray-700', sections.summary, <Award size={20} />)}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* AI Feedback - Parsed Sections (Alternative View matching original component structure) */}
                        {parsedFeedback && !submission.feedback && (
                            <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme border-l-4 border-l-purple-500">
                                <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">
                                    <Brain size={28} className="text-purple-500" />
                                    AI-Powered Analysis
                                </h2>

                                <div className="space-y-6">
                                    {/* Correctness Summary */}
                                    {parsedFeedback.correctness && (
                                        <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                                                <Target size={20} />
                                                Correctness Summary
                                            </h3>
                                            <p className="text-theme-secondary whitespace-pre-wrap">{parsedFeedback.correctness}</p>
                                        </div>
                                    )}

                                    {/* Test Case Analysis */}
                                    {parsedFeedback.testAnalysis && (
                                        <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                            <h3 className="text-lg font-bold text-orange-600 mb-2 flex items-center gap-2">
                                                <CheckCircle size={20} />
                                                Test Case Analysis
                                            </h3>
                                            <p className="text-theme-secondary whitespace-pre-wrap">{parsedFeedback.testAnalysis}</p>
                                        </div>
                                    )}

                                    {/* Complexity Analysis Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {parsedFeedback.timeComplexity && (
                                            <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                                <h3 className="text-lg font-bold text-purple-600 mb-2 flex items-center gap-2">
                                                    <Clock size={20} />
                                                    Time Complexity
                                                </h3>
                                                <p className="text-theme-secondary font-mono">{parsedFeedback.timeComplexity}</p>
                                            </div>
                                        )}
                                        {parsedFeedback.spaceComplexity && (
                                            <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                                <h3 className="text-lg font-bold text-blue-600 mb-2 flex items-center gap-2">
                                                    <Zap size={20} />
                                                    Space Complexity
                                                </h3>
                                                <p className="text-theme-secondary font-mono">{parsedFeedback.spaceComplexity}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Code Quality */}
                                    {parsedFeedback.codeQuality && (
                                        <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                            <h3 className="text-lg font-bold text-violet-600 mb-2 flex items-center gap-2">
                                                <Code size={20} />
                                                Code Quality & Style
                                            </h3>
                                            <p className="text-theme-secondary whitespace-pre-wrap">{parsedFeedback.codeQuality}</p>
                                        </div>
                                    )}

                                    {/* Fixes/Solution Code */}
                                    {fixesCode && (
                                        <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                            <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                                                <CheckCircle size={20} />
                                                Suggested Fix
                                            </h3>
                                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                                                <div className="bg-gray-800 px-4 py-2">
                                                    <span className="text-gray-400 text-xs font-mono">{fixesCode.language}</span>
                                                </div>
                                                <pre className="p-4 overflow-x-auto text-green-400 text-sm font-mono leading-relaxed max-h-96">
                                                    <code>{fixesCode.code}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    {parsedFeedback.summary && (
                                        <div className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                                            <h3 className="text-lg font-bold text-gray-700 mb-2">Summary</h3>
                                            <p className="text-theme-secondary whitespace-pre-wrap">{parsedFeedback.summary}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submitted Code */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                                <Code size={24} className="text-blue-500" />
                                Submitted Code
                            </h2>
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                                    <span className="text-gray-400 text-xs font-mono">{submission.language}</span>
                                    <span className="text-gray-500 text-xs">ID: {submission.id.substring(0, 12)}...</span>
                                </div>
                                <pre className="p-4 overflow-x-auto text-green-400 text-sm font-mono leading-relaxed max-h-96">
                                    <code>{formatCode(submission.code)}</code>
                                </pre>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-theme-secondary rounded-xl p-6 shadow-lg border border-theme">
                            <h2 className="text-lg font-bold text-theme-primary mb-4">Submission Metadata</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-theme-tertiary rounded-lg p-3 border border-theme">
                                    <span className="text-theme-secondary text-xs">Submission ID</span>
                                    <p className="font-mono text-theme-primary font-semibold">{submission.id}</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-3 border border-theme">
                                    <span className="text-theme-secondary text-xs">Problem ID</span>
                                    <p className="font-mono text-theme-primary font-semibold">{submission.problemId}</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-3 border border-theme">
                                    <span className="text-theme-secondary text-xs">Contest ID</span>
                                    <p className="font-mono text-theme-primary font-semibold">{submission.contestId || 'N/A'}</p>
                                </div>
                                <div className="bg-theme-tertiary rounded-lg p-3 border border-theme">
                                    <span className="text-theme-secondary text-xs">Submitted At</span>
                                    <p className="text-theme-primary font-semibold">{new Date(submission.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetailView;
