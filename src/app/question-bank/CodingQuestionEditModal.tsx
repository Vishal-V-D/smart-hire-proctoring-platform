'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    X, Save, Code2, FileText, Terminal, Layers,
    Eye, Edit, Plus, Trash2, ChevronDown, AlertTriangle,
    Zap, BarChart2, Tag
} from 'lucide-react';
import { codingQuestionService, CodingProblem, CodingProblemUpload, TopicTag, TestCase } from '@/api/codingQuestionService';

interface CodingQuestionEditModalProps {
    problem: CodingProblem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const CodingQuestionEditModal: React.FC<CodingQuestionEditModalProps> = ({
    problem,
    isOpen,
    onClose,
    onSave
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'testcases' | 'code'>('content');
    const [previewMode, setPreviewMode] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [titleSlug, setTitleSlug] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [topicTags, setTopicTags] = useState<TopicTag[]>([]);
    const [newTag, setNewTag] = useState('');
    const [exampleTestcases, setExampleTestcases] = useState<TestCase[]>([]);
    const [hiddenTestcases, setHiddenTestcases] = useState<TestCase[]>([]);
    const [starterCode, setStarterCode] = useState({
        python: '',
        'c++': '',
        java: '',
        javascript: ''
    });
    const [activeCodeLang, setActiveCodeLang] = useState<'python' | 'c++' | 'java' | 'javascript'>('python');

    // Initialize form when problem changes
    useEffect(() => {
        const loadProb = async () => {
            if (problem) {
                // Initialize with props first (fast render)
                setTitle(problem.title || '');
                setTitleSlug(problem.titleSlug || '');
                setContent(problem.content || (problem as any).description || '');
                setDifficulty(problem.difficulty || 'Medium');
                setTopicTags(problem.topicTags || []);
                setExampleTestcases(problem.exampleTestcases || []);
                setHiddenTestcases(problem.hiddenTestcases || []);
                setStarterCode({
                    python: problem.starterCode?.python || '',
                    'c++': problem.starterCode?.['c++'] || '',
                    java: problem.starterCode?.java || '',
                    javascript: problem.starterCode?.javascript || ''
                });

                // Fetch full details to ensure we have everything (especially content which might be heavy/missing in list)
                try {
                    const res = await codingQuestionService.getProblem(problem.id);
                    const fullProb = res.data;

                    if (fullProb) {
                        setTitle(fullProb.title || '');
                        setTitleSlug(fullProb.titleSlug || '');
                        // Handle content/description update
                        const richContent = fullProb.content || (fullProb as any).description;
                        if (richContent) setContent(richContent);
                        setDifficulty(fullProb.difficulty || 'Medium');
                        setTopicTags(fullProb.topicTags || []);
                        setExampleTestcases(fullProb.exampleTestcases || []);
                        setHiddenTestcases(fullProb.hiddenTestcases || []);
                        setStarterCode({
                            python: fullProb.starterCode?.python || '',
                            'c++': fullProb.starterCode?.['c++'] || '',
                            java: fullProb.starterCode?.java || '',
                            javascript: fullProb.starterCode?.javascript || ''
                        });
                    }
                } catch (err) {
                    console.error("Error fetching full problem details:", err);
                }
            }
        };

        loadProb();
    }, [problem]);

    const handleSave = async () => {
        if (!problem) return;
        setIsLoading(true);

        try {
            const updateData: Partial<CodingProblemUpload> = {
                QuestionTitle: title,
                TitleSlug: titleSlug,
                Content: content,
                Difficulty: difficulty,
                TopicTags: topicTags,
                ExampleTestcaseList: exampleTestcases,
                HiddenTestcaseList: hiddenTestcases,
                StarterCode: starterCode
            };

            await codingQuestionService.updateProblem(problem.id, updateData);
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to update coding question:', error);
            alert('Failed to save changes');
        } finally {
            setIsLoading(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !topicTags.find(t => t.name === newTag.trim())) {
            setTopicTags([...topicTags, { name: newTag.trim(), slug: newTag.trim().toLowerCase().replace(/\s+/g, '-') }]);
            setNewTag('');
        }
    };

    const removeTag = (slug: string) => {
        setTopicTags(topicTags.filter(t => t.slug !== slug));
    };

    const addTestcase = (type: 'example' | 'hidden') => {
        const newCase = { input: '', output: '' };
        if (type === 'example') {
            setExampleTestcases([...exampleTestcases, newCase]);
        } else {
            setHiddenTestcases([...hiddenTestcases, newCase]);
        }
    };

    const updateTestcase = (type: 'example' | 'hidden', index: number, field: 'input' | 'output', value: string) => {
        if (type === 'example') {
            const updated = [...exampleTestcases];
            updated[index] = { ...updated[index], [field]: value };
            setExampleTestcases(updated);
        } else {
            const updated = [...hiddenTestcases];
            updated[index] = { ...updated[index], [field]: value };
            setHiddenTestcases(updated);
        }
    };

    const removeTestcase = (type: 'example' | 'hidden', index: number) => {
        if (type === 'example') {
            setExampleTestcases(exampleTestcases.filter((_, i) => i !== index));
        } else {
            setHiddenTestcases(hiddenTestcases.filter((_, i) => i !== index));
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
            case 'Medium': return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
            case 'Hard': return 'bg-red-500/15 text-red-500 border-red-500/30';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    if (!isOpen || !problem) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <Code2 size={24} className="text-primary" />
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Edit Coding Question</h2>
                            <p className="text-sm text-muted-foreground">{problem.titleSlug}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Sidebar - Meta Info */}
                    <div className="w-72 border-r border-border p-4 space-y-4 overflow-y-auto">
                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Slug</label>
                            <input
                                type="text"
                                value={titleSlug}
                                onChange={(e) => setTitleSlug(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm font-mono focus:border-primary outline-none"
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Difficulty</label>
                            <div className="flex gap-2">
                                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setDifficulty(diff)}
                                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${difficulty === diff
                                            ? getDifficultyColor(diff)
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                            }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Topic Tags</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {topicTags.map((tag) => (
                                    <span
                                        key={tag.slug}
                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md flex items-center gap-1"
                                    >
                                        {tag.name}
                                        <button onClick={() => removeTag(tag.slug)} className="hover:text-destructive">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                    placeholder="Add tag..."
                                    className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2 text-xs focus:border-primary outline-none"
                                />
                                <button
                                    onClick={addTag}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                            <p>Example Tests: <span className="text-foreground font-bold">{exampleTestcases.length}</span></p>
                            <p>Hidden Tests: <span className="text-foreground font-bold">{hiddenTestcases.length}</span></p>
                        </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
                            {[
                                { id: 'content', label: 'Problem Description', icon: <FileText size={14} /> },
                                { id: 'testcases', label: 'Test Cases', icon: <Terminal size={14} /> },
                                { id: 'code', label: 'Starter Code', icon: <Layers size={14} /> }
                            ].map(({ id, label, icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === id
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}

                            {activeTab === 'content' && (
                                <button
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className={`ml-auto flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${previewMode ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Eye size={12} />
                                    {previewMode ? 'Edit' : 'Preview'}
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {/* Content Tab */}
                            {activeTab === 'content' && (
                                <div className="h-full flex">
                                    {previewMode ? (
                                        <div className="flex-1 p-6 overflow-y-auto">
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
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
                                                    {content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="w-full h-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
                                            placeholder="Write your problem description in Markdown..."
                                        />
                                    )}
                                </div>
                            )}

                            {/* Test Cases Tab */}
                            {activeTab === 'testcases' && (
                                <div className="h-full overflow-y-auto p-4 space-y-6">
                                    {/* Example Test Cases */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-foreground">Example Test Cases</h3>
                                            <button
                                                onClick={() => addTestcase('example')}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                                            >
                                                <Plus size={12} />
                                                Add Example
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {exampleTestcases.map((tc, idx) => (
                                                <div key={idx} className="bg-muted/30 border border-border rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-muted-foreground">Example {idx + 1}</span>
                                                        <button
                                                            onClick={() => removeTestcase('example', idx)}
                                                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Input</label>
                                                            <textarea
                                                                value={tc.input}
                                                                onChange={(e) => updateTestcase('example', idx, 'input', e.target.value)}
                                                                className="w-full h-20 bg-background border border-border rounded p-2 text-xs font-mono resize-none focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Output</label>
                                                            <textarea
                                                                value={tc.output}
                                                                onChange={(e) => updateTestcase('example', idx, 'output', e.target.value)}
                                                                className="w-full h-20 bg-background border border-border rounded p-2 text-xs font-mono resize-none focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hidden Test Cases */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-foreground">Hidden Test Cases</h3>
                                            <button
                                                onClick={() => addTestcase('hidden')}
                                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                                            >
                                                <Plus size={12} />
                                                Add Hidden
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {hiddenTestcases.map((tc, idx) => (
                                                <div key={idx} className="bg-muted/30 border border-border rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-muted-foreground">Hidden {idx + 1}</span>
                                                        <button
                                                            onClick={() => removeTestcase('hidden', idx)}
                                                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Input</label>
                                                            <textarea
                                                                value={tc.input}
                                                                onChange={(e) => updateTestcase('hidden', idx, 'input', e.target.value)}
                                                                className="w-full h-20 bg-background border border-border rounded p-2 text-xs font-mono resize-none focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Output</label>
                                                            <textarea
                                                                value={tc.output}
                                                                onChange={(e) => updateTestcase('hidden', idx, 'output', e.target.value)}
                                                                className="w-full h-20 bg-background border border-border rounded p-2 text-xs font-mono resize-none focus:border-primary outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Starter Code Tab */}
                            {activeTab === 'code' && (
                                <div className="h-full flex flex-col">
                                    {/* Language Tabs */}
                                    <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
                                        {(['python', 'c++', 'java', 'javascript'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setActiveCodeLang(lang)}
                                                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${activeCodeLang === lang
                                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                            >
                                                {lang === 'c++' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Code Editor */}
                                    <div className="flex-1 bg-[#1e1e1e]">
                                        <textarea
                                            value={starterCode[activeCodeLang]}
                                            onChange={(e) => setStarterCode({ ...starterCode, [activeCodeLang]: e.target.value })}
                                            className="w-full h-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm resize-none focus:outline-none"
                                            placeholder={`// ${activeCodeLang} starter code...`}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CodingQuestionEditModal;
