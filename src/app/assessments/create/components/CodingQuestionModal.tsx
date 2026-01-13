import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Upload, X, Code, Database, Search, Filter,
    ChevronLeft, ChevronRight, FileJson, Zap, Tag, BarChart2,
    AlertCircle, CheckCheck, Loader2
} from 'lucide-react';
import { Question } from '../types';
import {
    codingQuestionService,
    CodingProblem,
    CodingProblemFilters,
    TopicTag
} from '@/api/codingQuestionService';

interface CodingQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questions: Question | Question[]) => void;
}

const CodingQuestionModal: React.FC<CodingQuestionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'bank' | 'upload' | 'randomize'>('bank');
    const [randomCount, setRandomCount] = useState(5);
    const [randomDifficulty, setRandomDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
    const [randomTag, setRandomTag] = useState('');
    const [isRandomizing, setIsRandomizing] = useState(false);

    // ... existing state ...

    // ... existing useEffects ...

    // ... existing fetchTags, fetchProblems ...

    const handleRandomize = async () => {
        if (randomCount <= 0) return;
        setIsRandomizing(true);
        try {
            // Fetch a larger pool to randomize from
            const response = await codingQuestionService.listProblems({
                skip: 0,
                take: 100, // Fetch up to 100 to sample from
                difficulty: randomDifficulty || undefined,
                tags: randomTag ? [randomTag] : undefined
            });

            const pool = response.data.problems || [];

            if (pool.length === 0) {
                alert('No problems found matching your criteria.');
                setIsRandomizing(false);
                return;
            }

            // Shuffle
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, randomCount);

            // Import
            const importedQuestions: Question[] = selected.map(problem => ({
                id: crypto.randomUUID(),
                text: problem.title,
                type: 'coding' as const,
                codeStub: problem.starterCode?.python || problem.starterCode?.javascript || '',
                problemId: problem.id,
                problemData: problem
            }));

            onSave(importedQuestions);
            onClose();

        } catch (error) {
            console.error("Randomize failed:", error);
            alert("Failed to fetch random problems.");
        } finally {
            setIsRandomizing(false);
        }
    };

    // ... handleJsonFileUpload, handleJsonUpload, handleSave ...

    // ... getDifficultyColor ...

    // ... Render ...

    // In Tabs section:
    /*
        <button
            onClick={() => setActiveTab('randomize')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'randomize' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
        >
            <Zap size={16} /> Randomize
        </button>
    */

    // In Content section:
    /*
        {activeTab === 'randomize' && (
             <div className="p-8 max-w-2xl mx-auto space-y-8">
                 <div className="text-center space-y-2">
                     <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                         <Zap size={32} className="text-purple-600" />
                     </div>
                     <h3 className="text-xl font-bold">Random Problem Generator</h3>
                     <p className="text-muted-foreground">Automatically select problems based on your criteria</p>
                 </div>

                 <div className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                     <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Number of Problems</label>
                         <div className="flex items-center gap-4">
                             <input 
                                 type="range" 
                                 min="1" 
                                 max="20" 
                                 value={randomCount} 
                                 onChange={(e) => setRandomCount(parseInt(e.target.value))}
                                 className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                             />
                             <div className="w-12 h-10 border border-border rounded-lg flex items-center justify-center font-bold text-lg bg-background">
                                 {randomCount}
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Difficulty</label>
                             <select
                                 value={randomDifficulty}
                                 onChange={(e) => setRandomDifficulty(e.target.value as any)}
                                 className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-purple-500 transition-colors"
                             >
                                 <option value="">Any Difficulty</option>
                                 <option value="Easy">Easy</option>
                                 <option value="Medium">Medium</option>
                                 <option value="Hard">Hard</option>
                             </select>
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Topic Tag</label>
                             <select
                                 value={randomTag}
                                 onChange={(e) => setRandomTag(e.target.value)}
                                 className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-purple-500 transition-colors"
                             >
                                 <option value="">Any Topic</option>
                                 {availableTags.map(tag => (
                                     <option key={tag.slug} value={tag.slug}>{tag.name}</option>
                                 ))}
                             </select>
                         </div>
                     </div>

                     <button
                         onClick={handleRandomize}
                         disabled={isRandomizing}
                         className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                     >
                         {isRandomizing ? (
                             <>
                                 <Loader2 size={20} className="animate-spin" />
                                 Generating Selection...
                             </>
                         ) : (
                             <>
                                 <Zap size={20} fill="currentColor" />
                                 Generate & Add Problems
                             </>
                         )}
                     </button>
                 </div>
             </div>
        )}
    */

    // Problem Bank State
    const [problems, setProblems] = useState<CodingProblem[]>([]);
    const [availableTags, setAvailableTags] = useState<TopicTag[]>([]);
    const [filters, setFilters] = useState<CodingProblemFilters>({
        skip: 0,
        take: 20
    });
    const [totalProblems, setTotalProblems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());

    // JSON Upload State
    const [jsonContent, setJsonContent] = useState('');
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadedProblems, setUploadedProblems] = useState<CodingProblem[]>([]);

    const jsonFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedProblems(new Set());
            setUploadedProblems([]);
            setUploadStatus('idle');
            setJsonContent('');
            fetchProblems();
            fetchTags();
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeTab === 'bank' && isOpen) {
            fetchProblems();
        }
    }, [filters, activeTab, isOpen]);

    const fetchTags = async () => {
        try {
            console.log('🏷️ Fetching tags from backend...');
            const response = await codingQuestionService.getTags();

            console.log('✅ Tags response:', response.data);

            // Backend returns {success: true, tags: ["Array", "DP", ...]}
            // Convert string tags to TopicTag format
            if (response.data?.success && response.data?.tags) {
                const tagObjects = response.data.tags.map(tagName => ({
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-')
                }));

                console.log('📋 Converted tags:', tagObjects);
                setAvailableTags(tagObjects);
            } else {
                console.warn('⚠️ Unexpected tags response format:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching tags:', error);
            // Silently fail - we'll extract tags from loaded problems as fallback
            console.log('Will extract tags from loaded problems as fallback');
        }
    };

    // Extract unique tags from loaded problems as fallback when backend endpoint isn't available
    useEffect(() => {
        if (problems.length > 0 && availableTags.length === 0) {
            const tagsMap = new Map<string, { name: string; slug: string }>();
            problems.forEach(p => {
                p.topicTags?.forEach(tag => {
                    if (!tagsMap.has(tag.slug)) {
                        tagsMap.set(tag.slug, tag);
                    }
                });
            });
            if (tagsMap.size > 0) {
                setAvailableTags(Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
            }
        }
    }, [problems]);

    const fetchProblems = async () => {
        setIsLoading(true);
        try {
            const response = await codingQuestionService.listProblems(filters);
            setProblems(response.data.problems || []);
            setTotalProblems(response.data.total || 0);
        } catch (error) {
            console.error('Failed to fetch coding problems:', error);
            setProblems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setJsonContent(text);

            // Auto-upload
            await handleJsonUpload(text);
        } catch (error) {
            setUploadStatus('error');
            setUploadMessage('Failed to read file');
        }

        // Reset input
        if (jsonFileInputRef.current) {
            jsonFileInputRef.current.value = '';
        }
    };

    const handleJsonUpload = async (content?: string) => {
        const jsonToUpload = content || jsonContent;

        if (!jsonToUpload.trim()) {
            setUploadStatus('error');
            setUploadMessage('Please provide JSON content');
            return;
        }

        setUploadStatus('loading');
        setUploadMessage('');

        try {
            const data = JSON.parse(jsonToUpload);

            if (Array.isArray(data)) {
                const response = await codingQuestionService.uploadBulk(data);
                setUploadedProblems(response.data.problems);
                setUploadStatus('success');
                setUploadMessage(`Successfully uploaded ${response.data.created} coding problem(s)`);
            } else {
                const response = await codingQuestionService.uploadSingle(data);
                setUploadedProblems([response.data]);
                setUploadStatus('success');
                setUploadMessage('Successfully uploaded 1 coding problem');
            }

            // Refresh the problem bank
            fetchProblems();
        } catch (error: any) {
            setUploadStatus('error');
            if (error.message?.includes('JSON')) {
                setUploadMessage('Invalid JSON format. Please check your input.');
            } else {
                setUploadMessage(error.response?.data?.message || 'Upload failed. Please try again.');
            }
        }
    };

    const handleSave = () => {
        if (activeTab === 'bank') {
            // Import selected problems from bank
            const selected = problems.filter(p => selectedProblems.has(p.id));

            const importedQuestions: Question[] = selected.map(problem => ({
                id: crypto.randomUUID(),
                text: problem.title,
                type: 'coding' as const,
                // Do NOT set marks here - it will use section.marksPerQuestion by default
                // marks: undefined (uses section default in page.tsx)
                codeStub: problem.starterCode?.python || problem.starterCode?.javascript || '',
                // We store the problem ID for fetching full details later
                problemId: problem.id,
                problemData: problem // Store full problem data
            }));

            onSave(importedQuestions);
            setSelectedProblems(new Set());
            onClose();
        } else if (activeTab === 'upload' && uploadedProblems.length > 0) {
            // Import uploaded problems
            const importedQuestions: Question[] = uploadedProblems.map(problem => ({
                id: crypto.randomUUID(),
                text: problem.title,
                type: 'coding' as const,
                // Do NOT set marks here - it will use section.marksPerQuestion by default
                codeStub: problem.starterCode?.python || problem.starterCode?.javascript || '',
                problemId: problem.id,
                problemData: problem
            }));

            onSave(importedQuestions);
            setUploadedProblems([]);
            onClose();
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'Hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const currentPage = Math.floor((filters.skip || 0) / (filters.take || 20)) + 1;
    const totalPages = Math.ceil(totalProblems / (filters.take || 20));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-5xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Code size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Add Coding Problems</h3>
                            <p className="text-xs text-muted-foreground">Select problems from the bank or upload new ones via JSON</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border shrink-0">
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'bank' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Database size={16} /> Problem Bank
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <FileJson size={16} /> JSON Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('randomize')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'randomize' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Zap size={16} /> Randomize
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'randomize' && (
                        <div className="p-8 max-w-2xl mx-auto space-y-8">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold">Random Problem Generator</h3>
                                <p className="text-muted-foreground">Automatically select problems based on your criteria</p>
                            </div>

                            <div className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Number of Problems</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={randomCount}
                                            onChange={(e) => setRandomCount(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="w-12 h-10 border border-border rounded-lg flex items-center justify-center font-bold text-lg bg-background">
                                            {randomCount}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Difficulty</label>
                                        <select
                                            value={randomDifficulty}
                                            onChange={(e) => setRandomDifficulty(e.target.value as any)}
                                            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-purple-500 transition-colors"
                                        >
                                            <option value="">Any Difficulty</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Topic Tag</label>
                                        <select
                                            value={randomTag}
                                            onChange={(e) => setRandomTag(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-purple-500 transition-colors"
                                        >
                                            <option value="">Any Topic</option>
                                            {availableTags.map(tag => (
                                                <option key={tag.slug} value={tag.slug}>{tag.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRandomize}
                                    disabled={isRandomizing}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isRandomizing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Generating Selection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={20} fill="currentColor" />
                                            Generate & Add Problems
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'bank' ? (
                        <div className="space-y-4 h-full flex flex-col">
                            {/* Filters */}
                            <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                    <Filter size={14} /> Filters
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {/* Search */}
                                    <div className="col-span-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search problems by title..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setFilters({ ...filters, search: e.target.value, skip: 0 });
                                                }}
                                                className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Difficulty Filter */}
                                    <div>
                                        <select
                                            value={filters.difficulty || ''}
                                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as any || undefined, skip: 0 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            <option value="">All Difficulties</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Tags Filter */}
                                    <div>
                                        <select
                                            value={filters.tags?.[0] || ''}
                                            onChange={(e) => setFilters({
                                                ...filters,
                                                tags: e.target.value ? [e.target.value] : undefined,
                                                skip: 0
                                            })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-emerald-500 outline-none"
                                        >
                                            <option value="">All Tags</option>
                                            {availableTags.map((tag) => (
                                                <option key={tag.slug} value={tag.slug}>{tag.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Problems List */}
                            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground">Loading problems...</p>
                                        </div>
                                    </div>
                                ) : problems.length === 0 ? (
                                    <div className="flex items-center justify-center py-20 border-2 border-dashed border-border rounded-xl">
                                        <div className="text-center">
                                            <Code size={40} className="mx-auto text-muted-foreground/50 mb-3" />
                                            <p className="text-sm font-bold text-foreground">No coding problems found</p>
                                            <p className="text-xs text-muted-foreground mt-1">Upload new problems via JSON</p>
                                        </div>
                                    </div>
                                ) : (
                                    problems.map((problem) => {
                                        const isSelected = selectedProblems.has(problem.id);
                                        return (
                                            <div
                                                key={problem.id}
                                                onClick={() => {
                                                    const newSet = new Set(selectedProblems);
                                                    if (isSelected) {
                                                        newSet.delete(problem.id);
                                                    } else {
                                                        newSet.add(problem.id);
                                                    }
                                                    setSelectedProblems(newSet);
                                                }}
                                                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                                                    : 'border-border bg-card hover:border-emerald-500/50'
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-muted-foreground/30'
                                                        }`}>
                                                        {isSelected && <CheckCircle size={12} className="text-white" />}
                                                    </div>

                                                    {/* Problem Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-bold text-foreground line-clamp-1">
                                                                    {problem.title}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {problem.titleSlug}
                                                                </p>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(problem.difficulty)}`}>
                                                                {problem.difficulty}
                                                            </span>
                                                        </div>

                                                        {/* Tags */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {problem.topicTags?.slice(0, 4).map((tag, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] flex items-center gap-1">
                                                                    <Tag size={10} /> {tag.name}
                                                                </span>
                                                            ))}
                                                            {problem.topicTags?.length > 4 && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    +{problem.topicTags.length - 4} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pagination */}
                            {!isLoading && problems.length > 0 && (
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground">
                                        Showing {(filters.skip || 0) + 1} - {Math.min((filters.skip || 0) + (filters.take || 20), totalProblems)} of {totalProblems}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFilters({ ...filters, skip: Math.max(0, (filters.skip || 0) - (filters.take || 20)) })}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-bold px-3">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setFilters({ ...filters, skip: (filters.skip || 0) + (filters.take || 20) })}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center py-4">
                                <FileJson size={40} className="mx-auto text-emerald-500 mb-3" />
                                <h3 className="text-lg font-bold text-foreground mb-1">Upload Coding Problems via JSON</h3>
                                <p className="text-sm text-muted-foreground">Upload single or multiple problems in JSON format</p>
                            </div>

                            {/* Upload Status */}
                            <AnimatePresence mode="wait">
                                {uploadStatus !== 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`p-4 rounded-xl flex items-center gap-3 ${uploadStatus === 'loading' ? 'bg-blue-500/10 border border-blue-500/20' :
                                            uploadStatus === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                                                'bg-red-500/10 border border-red-500/20'
                                            }`}
                                    >
                                        {uploadStatus === 'loading' && <Loader2 size={20} className="text-blue-600 animate-spin" />}
                                        {uploadStatus === 'success' && <CheckCheck size={20} className="text-green-600" />}
                                        {uploadStatus === 'error' && <AlertCircle size={20} className="text-red-600" />}
                                        <span className={`text-sm font-medium ${uploadStatus === 'loading' ? 'text-blue-600' :
                                            uploadStatus === 'success' ? 'text-green-600' :
                                                'text-red-600'
                                            }`}>
                                            {uploadStatus === 'loading' ? 'Uploading...' : uploadMessage}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* File Upload */}
                            <div
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                                onClick={() => jsonFileInputRef.current?.click()}
                            >
                                <input
                                    ref={jsonFileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleJsonFileUpload}
                                    className="hidden"
                                />
                                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                                <p className="text-sm font-bold text-foreground">Click to upload JSON file</p>
                                <p className="text-xs text-muted-foreground mt-1">Supports single problem or array of problems</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground font-bold">OR PASTE JSON</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* JSON Editor */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">JSON Content</label>
                                <textarea
                                    value={jsonContent}
                                    onChange={(e) => setJsonContent(e.target.value)}
                                    placeholder='{\n  "QuestionTitle": "Two Sum",\n  "Difficulty": "Easy",\n  "Content": "Given an array...",\n  ...\n}'
                                    className="w-full bg-zinc-950 text-emerald-400 font-mono text-xs border border-border rounded-xl p-4 min-h-[200px] focus:border-emerald-500 outline-none custom-scrollbar"
                                    spellCheck={false}
                                />
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={() => handleJsonUpload()}
                                disabled={!jsonContent.trim() || uploadStatus === 'loading'}
                                className="w-full py-3.5 px-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadStatus === 'loading' ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        Upload & Parse JSON
                                    </>
                                )}
                            </button>

                            {/* JSON Format Reference */}
                            <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">JSON Format Reference</p>
                                <div className="text-xs font-mono text-muted-foreground bg-background/80 rounded-lg p-3 space-y-1">
                                    <div>• <span className="text-emerald-600">QuestionTitle</span> - Problem title (required)</div>
                                    <div>• <span className="text-emerald-600">TitleSlug</span> - URL-friendly slug</div>
                                    <div>• <span className="text-emerald-600">Content</span> - Problem description (markdown)</div>
                                    <div>• <span className="text-emerald-600">Difficulty</span> - Easy / Medium / Hard</div>
                                    <div>• <span className="text-emerald-600">TopicTags</span> - Array of {"{ name, slug }"}</div>
                                    <div>• <span className="text-emerald-600">StarterCode</span> - {"{ python, c++, java }"}</div>
                                    <div>• <span className="text-emerald-600">Solution</span> - {"{ python, c++, java }"}</div>
                                    <div>• <span className="text-emerald-600">ExampleTestcaseList</span> - Array of {"{ input, output }"}</div>
                                </div>
                            </div>

                            {/* Uploaded Problems Preview */}
                            {uploadedProblems.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Uploaded Problems ({uploadedProblems.length})
                                    </p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {uploadedProblems.map((problem) => (
                                            <div key={problem.id} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-3">
                                                <CheckCircle size={16} className="text-green-600 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{problem.title}</p>
                                                    <p className="text-xs text-muted-foreground">{problem.titleSlug}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border bg-muted/30 flex justify-between items-center gap-4 shrink-0">
                    <div>
                        {activeTab === 'bank' && selectedProblems.size > 0 && (
                            <span className="text-sm font-bold text-emerald-600">
                                {selectedProblems.size} problem{selectedProblems.size !== 1 ? 's' : ''} selected
                            </span>
                        )}
                        {activeTab === 'upload' && uploadedProblems.length > 0 && (
                            <span className="text-sm font-bold text-emerald-600">
                                {uploadedProblems.length} problem{uploadedProblems.length !== 1 ? 's' : ''} ready to add
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={(activeTab === 'bank' && selectedProblems.size === 0) || (activeTab === 'upload' && uploadedProblems.length === 0)}
                            className="px-8 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={16} />
                            {activeTab === 'bank' ? 'Add Selected Problems' : 'Add Uploaded Problems'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CodingQuestionModal;
