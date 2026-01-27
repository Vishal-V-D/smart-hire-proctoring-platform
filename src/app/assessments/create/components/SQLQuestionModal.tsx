import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Upload, X, Code, Database, Search, Filter,
    ChevronLeft, ChevronRight, FileJson, Zap, Tag,
    CheckCheck, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import Loader from '@/components/Loader';
import { Question } from '../types';
import { codingQuestionService, CodingProblem } from '@/api/codingQuestionService';
import { questionBankService, QuestionBankQuestion } from '@/api/questionBankService';
import { sqlQuestionService, SQLQuestion, SQLQuestionFilters, SQLFilterOptions } from '@/api/sqlQuestionService';

interface SQLQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questions: Question | Question[]) => void;
    division?: string;
    subdivision?: string;
    sectionId: string;
}

const SQLQuestionModal: React.FC<SQLQuestionModalProps> = ({ isOpen, onClose, onSave, division, subdivision, sectionId }) => {
    const [activeTab, setActiveTab] = useState<'bank' | 'upload' | 'randomize'>('bank');

    // --- SQL Bank State (New) ---
    const [sqlQuestions, setSqlQuestions] = useState<SQLQuestion[]>([]);
    const [sqlFilters, setSqlFilters] = useState<SQLQuestionFilters>({
        limit: 20,
        page: 1,
        dialect: '',
        difficulty: undefined,
        search: '',
        division: 'SQL'
    });
    const [sqlTotal, setSqlTotal] = useState(0);
    const [isLoadingSql, setIsLoadingSql] = useState(false);
    const [selectedSqlIds, setSelectedSqlIds] = useState<Set<string>>(new Set());
    const [filterOptions, setFilterOptions] = useState<SQLFilterOptions>({
        dialects: [],
        difficulties: [],
        topics: [],
        subdivisions: [],
        divisions: [],
        tags: []
    });

    // --- Randomize State ---
    const [randomCount, setRandomCount] = useState(5);
    const [randomDifficulty, setRandomDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
    const [isRandomizing, setIsRandomizing] = useState(false);

    // --- Upload State ---
    const [jsonContent, setJsonContent] = useState('');
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadedProblems, setUploadedProblems] = useState<CodingProblem[]>([]); // For JSON
    const [uploadedCSVProblems, setUploadedCSVProblems] = useState<QuestionBankQuestion[]>([]); // For CSV

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load & Reset
    useEffect(() => {
        if (isOpen) {
            setUploadedProblems([]);
            setUploadedCSVProblems([]);
            setSelectedSqlIds(new Set());
            setUploadStatus('idle');
            setJsonContent('');
            // Reset filters logic
            setSqlFilters(prev => ({ ...prev, page: 1, limit: 20 }));
            if (activeTab === 'bank') {
                fetchSqlQuestions();
            }
        }
    }, [isOpen]);

    // Fetch on filter change
    useEffect(() => {
        if (isOpen && activeTab === 'bank') {
            fetchFilters();
            fetchSqlQuestions();
        }
    }, [activeTab, sqlFilters.page, sqlFilters.dialect, sqlFilters.difficulty, sqlFilters.topic, sqlFilters.subdivision, sqlFilters.search]);

    const fetchFilters = async () => {
        // Prevent refetching if already populated? Or specific boolean? 
        // For now, it's cheap to fetch or we can check if empty.
        if (filterOptions.dialects.length > 0) return;

        try {
            const response = await sqlQuestionService.getFilters();
            if (response.data.success) {
                setFilterOptions(response.data.filters);
            }
        } catch (error) {
            console.error("Failed to fetch SQL filters", error);
        }
    };

    const fetchSqlQuestions = async () => {
        setIsLoadingSql(true);
        try {
            // Include division/subdivision context if needed, or stick to user filters
            // User requested explicit filter inputs, so we use sqlFilters.
            // We might want to enforce subdivision='SQL' if that's the context, or let user browse all.
            // Given "subdivision" prop is passed, let's use it as a default or hidden filter?
            // The prompt said "Method: GET /api/sql/questions ... like this know so add question bank section..."
            // I'll stick to the manual filters for now, but maybe pass subdivision if relevant.

            const filtersToUse = { ...sqlFilters };
            // Ensure division is set ("SQL" as default per new user request)
            if (!filtersToUse.division) filtersToUse.division = 'SQL';

            const response = await sqlQuestionService.listQuestions(filtersToUse);
            setSqlQuestions(response.data.questions || []);
            setSqlTotal(response.data.pagination?.total || 0);
        } catch (error) {
            console.error("Failed to fetch SQL questions:", error);
            // Fallback or empty state handled by UI
        } finally {
            setIsLoadingSql(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isSpreadsheet = file.name.toLowerCase().match(/\.(csv|xls|xlsx)$/);

        if (isSpreadsheet) {
            setUploadStatus('loading');
            setUploadMessage('Uploading Spreadsheet...');

            const isExcel = file.name.toLowerCase().match(/\.(xls|xlsx)$/);

            try {
                let response;

                if (isExcel) {
                    response = await questionBankService.uploadExcel(
                        file,
                        division || 'Technical',
                        subdivision || 'SQL',
                        subdivision || 'SQL' // topic
                    );
                } else {
                    response = await questionBankService.uploadCSV(
                        file,
                        division || 'Technical',
                        subdivision || 'SQL',
                        subdivision || 'SQL' // topic
                    );
                }

                setUploadStatus('success');
                setUploadMessage(`Spreadsheet Upload Successful. `);

                if (response.data && Array.isArray(response.data)) {
                    setUploadedCSVProblems(response.data);
                    setUploadMessage(`Successfully uploaded ${response.data.length} SQL problems from spreadsheet`);
                } else if (response.data && response.data.questions) {
                    setUploadedCSVProblems(response.data.questions);
                    setUploadMessage(`Successfully uploaded ${response.data.questions.length} SQL problems from spreadsheet`);
                } else {
                    setUploadMessage(`Spreadsheet Uploaded. ${response.data?.message || 'Check question bank.'}`);
                }

            } catch (error: any) {
                setUploadStatus('error');
                setUploadMessage(error.response?.data?.message || 'Spreadsheet Upload failed');
            }
        } else {
            // JSON Handling
            try {
                const text = await file.text();
                setJsonContent(text);
                await handleJsonUpload(text);
            } catch (error) {
                setUploadStatus('error');
                setUploadMessage('Failed to read file');
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
            let response;
            if (Array.isArray(data)) {
                response = await codingQuestionService.uploadBulk(data);
                setUploadedProblems(response.data.problems);
                setUploadMessage(`Successfully uploaded ${response.data.created} SQL problem(s)`);
            } else {
                response = await codingQuestionService.uploadSingle(data);
                setUploadedProblems([response.data]);
                setUploadMessage('Successfully uploaded 1 SQL problem');
            }
            setUploadStatus('success');
        } catch (error: any) {
            setUploadStatus('error');
            if (error.message?.includes('JSON')) {
                setUploadMessage('Invalid JSON format. Please check your input.');
            } else {
                setUploadMessage(error.response?.data?.message || 'Upload failed. Please try again.');
            }
        }
    };

    const handleRandomize = async () => {
        if (randomCount <= 0) return;
        setIsRandomizing(true);
        try {
            // Use questionBankService for randomization (legacy/generic bank)
            const response = await questionBankService.listQuestions({
                page: 1,
                limit: 100,
                division: division,
                subdivision: subdivision,
                difficulty: randomDifficulty || undefined,
            });

            const pool = response.data.questions || [];

            if (pool.length === 0) {
                alert('No SQL problems found in the generic bank matching your criteria.');
                setIsRandomizing(false);
                return;
            }

            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, randomCount);

            const importedQuestions: Question[] = selected.map(q => ({
                id: crypto.randomUUID(),
                text: q.text,
                type: 'coding',
                codeStub: '',
                problemId: q.id,
                pseudocode: 'SQL Query',
                problemData: {
                    ...q,
                    title: q.text,
                    content: q.text,
                    starterCode: { sql: '' },
                    topicTags: q.tags?.map(t => ({ name: t, slug: t })) || []
                } as any
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

    const handleSave = async () => {
        const questionsToSave: Question[] = [];

        // 1. JSON
        if (uploadedProblems.length > 0) {
            uploadedProblems.forEach(problem => {
                questionsToSave.push({
                    id: crypto.randomUUID(),
                    text: problem.title,
                    type: 'coding',
                    codeStub: problem.starterCode?.sql || problem.starterCode?.mysql || problem.starterCode?.postgresql || '',
                    problemId: problem.id,
                    problemData: problem,
                    pseudocode: 'SQL Query'
                });
            });
        }

        // 2. CSV
        if (uploadedCSVProblems.length > 0) {
            uploadedCSVProblems.forEach(q => {
                questionsToSave.push({
                    id: crypto.randomUUID(),
                    text: q.text,
                    type: 'coding',
                    codeStub: '',
                    problemId: q.id,
                    pseudocode: 'SQL Query',
                    problemData: {
                        ...q,
                        title: q.text,
                        content: q.text,
                        starterCode: { sql: '' },
                        topicTags: q.tags?.map(t => ({ name: t, slug: t })) || []
                    } as any
                });
            });
        }

        // 3. From SQL Bank
        if (selectedSqlIds.size > 0) {
            const selected = sqlQuestions.filter(q => selectedSqlIds.has(q.id));
            selected.forEach(q => {
                // Map SQLQuestion to Question
                // SQLQuestion: id, title, content, dialect, starterCode, difficulty
                questionsToSave.push({
                    id: crypto.randomUUID(),
                    text: q.title,
                    type: 'coding',
                    codeStub: q.starterCode || '',
                    problemId: q.id,
                    pseudocode: 'SQL Query',
                    problemData: {
                        id: q.id,
                        title: q.title,
                        content: q.content,
                        difficulty: q.difficulty,
                        dialect: q.dialect, // Important for editor
                        starterCode: { [q.dialect]: q.starterCode || '' },
                        inputTables: q.inputTables,
                        expectedResult: q.expectedResult,
                        hint: q.hint,
                        topicTags: q.topic ? [{ name: q.topic, slug: q.topic }] : [],
                        inputFormat: '',
                        outputFormat: '',
                        constraints: ''
                    } as any
                });
            });
        }

        if (questionsToSave.length > 0) {
            onSave(questionsToSave);
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

    const totalPages = Math.ceil(sqlTotal / (sqlFilters.limit || 20));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-4xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Database size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Add SQL Problems</h3>
                            <p className="text-xs text-muted-foreground">Select from bank, upload via CSV/JSON, or randomize</p>
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
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'bank' ? 'border-blue-500 text-blue-600 bg-blue-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Database size={16} /> Problem Bank
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'border-blue-500 text-blue-600 bg-blue-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Upload size={16} /> Upload (CSV/Excel/JSON)
                    </button>
                    <button
                        onClick={() => setActiveTab('randomize')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'randomize' ? 'border-blue-500 text-blue-600 bg-blue-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Zap size={16} /> Randomize
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                    {/* -- BANK TAB CONTENT -- */}
                    {activeTab === 'bank' && (
                        <div className="flex flex-col h-full space-y-4">
                            {/* Filter Bar */}
                            <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/50">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                    <Filter size={14} /> Filters
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="col-span-12 md:col-span-4 relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search title..."
                                            value={sqlFilters.search}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, search: e.target.value, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={sqlFilters.division || ''}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, division: e.target.value, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">All Divisions</option>
                                            {filterOptions.divisions?.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={sqlFilters.subdivision || ''}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, subdivision: e.target.value, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">All Subdivisions</option>
                                            {filterOptions.subdivisions?.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={sqlFilters.topic || ''}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, topic: e.target.value || undefined, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">All Topics</option>
                                            {filterOptions.topics?.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={sqlFilters.difficulty || ''}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, difficulty: e.target.value as any || undefined, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">All Difficulties</option>
                                            {filterOptions.difficulties?.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={sqlFilters.tags || ''}
                                            onChange={(e) => setSqlFilters({ ...sqlFilters, tags: e.target.value, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="">All Tags</option>
                                            {filterOptions.tags?.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>


                            {/* List of Questions */}
                            <div className="flex-1 min-h-[300px] space-y-2">
                                {isLoadingSql ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                        <Loader />
                                        <p className="text-sm font-medium mt-4">Loading questions...</p>
                                    </div>
                                ) : sqlQuestions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                        <Database size={32} className="opacity-20" />
                                        <p className="text-sm font-medium">No questions found matching your filters.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sqlQuestions.map(q => {
                                            const isSelected = selectedSqlIds.has(q.id);
                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => {
                                                        const newSet = new Set(selectedSqlIds);
                                                        if (isSelected) newSet.delete(q.id);
                                                        else newSet.add(q.id);
                                                        setSelectedSqlIds(newSet);
                                                    }}
                                                    className={`group p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${isSelected
                                                        ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                                                        : 'border-border bg-card hover:border-blue-500/30'
                                                        }`}
                                                >
                                                    <div className="flex gap-4">
                                                        <div className={`w-5 h-5 mt-1 rounded border overflow-hidden flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'border-muted-foreground/30 bg-background group-hover:border-blue-500/50'
                                                            }`}>
                                                            {isSelected && <CheckCircle size={14} className="text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <h4 className={`text-sm font-bold line-clamp-1 ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>{q.title}</h4>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 pr-4">{q.content}</p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(q.difficulty)}`}>
                                                                        {q.difficulty}
                                                                    </span>
                                                                    {q.dialect && (
                                                                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                            {q.dialect}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-3 overflow-hidden">
                                                                {q.topic && (
                                                                    <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded text-[10px] flex items-center gap-1 whitespace-nowrap border border-border/50">
                                                                        <Tag size={10} /> {q.topic}
                                                                    </span>
                                                                )}
                                                                {q.subdivision && (
                                                                    <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded text-[10px] flex items-center gap-1 whitespace-nowrap border border-border/50">
                                                                        <Filter size={10} /> {q.subdivision}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {sqlTotal > 0 && (
                                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                    <div className="text-xs text-muted-foreground">
                                        Showing {sqlQuestions.length} (Page {sqlFilters.page}) of {sqlTotal} total
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSqlFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                                            disabled={sqlFilters.page === 1}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => setSqlFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                            disabled={sqlFilters.page === totalPages || totalPages === 0}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {activeTab === 'upload' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center py-4">
                                <div className="flex justify-center gap-2 mb-3">
                                    <FileSpreadsheet size={40} className="text-green-500" />
                                    <FileJson size={40} className="text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1">Upload SQL Questions</h3>
                                <p className="text-sm text-muted-foreground">Support for CSV/Excel (bulk bank upload) and JSON (direct)</p>
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
                                        {uploadStatus === 'loading' && (
                                            <div className="scale-75 h-5 w-12 flex items-center justify-center">
                                                <Loader />
                                            </div>
                                        )}
                                        {uploadStatus === 'success' && <CheckCheck size={20} className="text-green-600" />}
                                        {uploadStatus === 'error' && <AlertCircle size={20} className="text-red-600" />}
                                        <span className={`text-sm font-medium ${uploadStatus === 'loading' ? 'text-blue-600' :
                                            uploadStatus === 'success' ? 'text-green-600' :
                                                'text-red-600'
                                            }`}>
                                            {uploadStatus === 'loading' ? 'Processing...' : uploadMessage}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* File Upload */}
                            <div
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.csv,.xls,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                                <p className="text-sm font-bold text-foreground">Click to upload CSV, Excel or JSON</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    CSV/Excel for Question Bank (auto-detects SQL)<br />
                                    JSON for Direct Import
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'randomize' && (
                        <div className="p-4 max-w-xl mx-auto space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap size={32} className="text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold">Random SQL Generator</h3>
                                <p className="text-muted-foreground">Fetch random SQL problems from the bank ({division}{subdivision ? ` - ${subdivision}` : ''})</p>
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
                                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="w-12 h-10 border border-border rounded-lg flex items-center justify-center font-bold text-lg bg-background">
                                            {randomCount}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Difficulty</label>
                                    <select
                                        value={randomDifficulty}
                                        onChange={(e) => setRandomDifficulty(e.target.value as any)}
                                        className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Any Difficulty</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleRandomize}
                                    disabled={isRandomizing}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isRandomizing ? (
                                        <div className="scale-75 h-5 w-12 flex items-center justify-center">
                                            <Loader />
                                        </div>
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
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        Cancel
                    </button>
                    {activeTab === 'upload' ? (
                        <button
                            onClick={handleSave}
                            disabled={uploadedProblems.length === 0 && uploadedCSVProblems.length === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Add {(uploadedProblems.length + uploadedCSVProblems.length) > 0 ? `${uploadedProblems.length + uploadedCSVProblems.length} Problems` : 'Problems'}
                        </button>
                    ) : activeTab === 'bank' ? (
                        <button
                            onClick={handleSave}
                            disabled={selectedSqlIds.size === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Add {selectedSqlIds.size > 0 ? `${selectedSqlIds.size} Selected Problems` : 'Problems'}
                        </button>
                    ) : null}
                </div>
            </motion.div>
        </div>
    );
};

export default SQLQuestionModal;
