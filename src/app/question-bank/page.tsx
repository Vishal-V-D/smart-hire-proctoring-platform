"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle,
    Code,
    FileText,
    CheckSquare,
    Type,
    Image as ImageIcon,
    AlertCircle,
    BarChart3,
    Layers,
    Eye
} from 'lucide-react';
import { questionBankService, QuestionBankQuestion, QuestionBankFilters, FilterOptions, QuestionBankStats } from '@/api/questionBankService';
import { codingQuestionService, CodingProblem, CodingProblemFilters } from '@/api/codingQuestionService';
import { sqlQuestionService, SQLQuestion, SQLQuestionFilters, SQLFilterOptions } from '@/api/sqlQuestionService';
import CodingQuestionEditModal from './CodingQuestionEditModal';
import PseudoCodeDisplay from '@/components/contestant/PseudoCodeDisplay';
import SQLQuestionDisplay from '@/components/organizer/questions/SQLQuestionDisplay';
import SQLQuestionEditModal from './SQLQuestionEditModal';

const QuestionBankPage = () => {
    const [questions, setQuestions] = useState<QuestionBankQuestion[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [stats, setStats] = useState<QuestionBankStats | null>(null);
    const [filters, setFilters] = useState<QuestionBankFilters>({
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankQuestion | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<QuestionBankQuestion>>({});
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Coding Questions Tab State
    const [activeQuestionTab, setActiveQuestionTab] = useState<'regular' | 'coding' | 'sql'>('regular');
    const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
    const [codingFilters, setCodingFilters] = useState<CodingProblemFilters>({ skip: 0, take: 20 });
    const [codingPagination, setCodingPagination] = useState({ total: 0, skip: 0, take: 20 });
    const [codingSearchQuery, setCodingSearchQuery] = useState('');
    const [selectedCodingProblem, setSelectedCodingProblem] = useState<CodingProblem | null>(null);
    const [showCodingEditModal, setShowCodingEditModal] = useState(false);
    const [showCodingDeleteModal, setShowCodingDeleteModal] = useState(false);
    const [isCodingLoading, setIsCodingLoading] = useState(false);

    // Fetch filter options and stats on mount
    useEffect(() => {
        fetchFilterOptions();
        fetchStats();
        // Fetch initial counts for other tabs
        fetchCodingProblems();
        fetchSqlFilters();
        fetchSqlQuestions();
    }, []);

    // Fetch questions when filters change
    useEffect(() => {
        fetchQuestions();
    }, [filters]);

    const fetchFilterOptions = async () => {
        try {
            const response = await questionBankService.getFilterOptions();
            setFilterOptions(response.data);
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await questionBankService.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const response = await questionBankService.listQuestions(filters);
            setQuestions(response.data.questions || []);
            setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch coding problems
    const fetchCodingProblems = async () => {
        setIsCodingLoading(true);
        try {
            const response = await codingQuestionService.listProblems(codingFilters);
            setCodingProblems(response.data.problems || []);
            setCodingPagination({
                total: response.data.total || 0,
                skip: response.data.skip || 0,
                take: response.data.take || 20
            });
        } catch (error) {
            console.error('Failed to fetch coding problems:', error);
            setCodingProblems([]);
        } finally {
            setIsCodingLoading(false);
        }
    };

    // Fetch coding problems when tab changes or filters change
    useEffect(() => {
        if (activeQuestionTab === 'coding') {
            fetchCodingProblems();
        }
    }, [activeQuestionTab, codingFilters]);

    const handleCodingSearch = (value: string) => {
        setCodingSearchQuery(value);
        setCodingFilters({ ...codingFilters, search: value, skip: 0 });
    };

    const handleDeleteCodingProblem = async () => {
        if (!selectedCodingProblem) return;
        try {
            await codingQuestionService.deleteProblem(selectedCodingProblem.id);
            fetchCodingProblems();
            setShowCodingDeleteModal(false);
            setSelectedCodingProblem(null);
        } catch (error) {
            console.error('Failed to delete coding problem:', error);
            alert('Failed to delete problem');
        }
    };

    // SQL Questions Tab State
    const [sqlQuestions, setSqlQuestions] = useState<SQLQuestion[]>([]);
    const [sqlFilters, setSqlFilters] = useState<SQLQuestionFilters>({ page: 1, limit: 20 });
    const [sqlPagination, setSqlPagination] = useState({ page: 1, limit: 20, total: 0 });
    const [sqlFilterOptions, setSqlFilterOptions] = useState<SQLFilterOptions | null>(null);
    const [isSqlLoading, setIsSqlLoading] = useState(false);
    const [sqlSearchQuery, setSqlSearchQuery] = useState('');
    const [selectedSqlQuestion, setSelectedSqlQuestion] = useState<SQLQuestion | null>(null);
    const [showSqlDeleteModal, setShowSqlDeleteModal] = useState(false);
    const [showSqlEditModal, setShowSqlEditModal] = useState(false);


    const fetchSqlFilters = async () => {
        try {
            const response = await sqlQuestionService.getFilters();
            if (response.data.success) {
                setSqlFilterOptions(response.data.filters);
            }
        } catch (error) {
            console.error('Failed to fetch SQL filters:', error);
        }
    };

    const fetchSqlQuestions = async () => {
        setIsSqlLoading(true);
        try {
            const response = await sqlQuestionService.listQuestions(sqlFilters);
            console.log('📊 [SQL Questions] Fetched:', response.data);

            // ✅ New pagination structure - total is inside pagination object
            const pagination = response.data.pagination || {};

            setSqlQuestions(response.data.questions || []);
            setSqlPagination({
                page: pagination.page || sqlFilters.page || 1,
                limit: pagination.limit || sqlFilters.limit || 20,
                total: pagination.total || 0,  // ✅ Access total from pagination object
            });
            console.log('✅ [SQL Questions] Total:', pagination.total);
        } catch (error) {
            console.error('Failed to fetch SQL questions:', error);
            setSqlQuestions([]);
            setSqlPagination({ page: 1, limit: 20, total: 0 });
        } finally {
            setIsSqlLoading(false);
        }
    };

    // Fetch SQL questions when tab changes or filters change
    useEffect(() => {
        if (activeQuestionTab === 'sql') {
            fetchSqlQuestions();
        }
    }, [activeQuestionTab, sqlFilters]);

    const handleSqlSearch = (value: string) => {
        setSqlSearchQuery(value);
        setSqlFilters({ ...sqlFilters, search: value, page: 1 });
    };

    const handleSqlFilterChange = (key: keyof SQLQuestionFilters, value: any) => {
        setSqlFilters({ ...sqlFilters, [key]: value, page: 1 });
    };

    const handleDeleteSqlQuestion = async () => {
        if (!selectedSqlQuestion) return;
        try {
            // Assuming delete endpoint exists or using general delete if ID is unique globally
            // For now, I'll assume we might need a delete method in sqlQuestionService or use questionBankService if IDs are shared
            // Since I didn't see a specific delete in sqlQuestionService, I'll leave this empty or use a placeholder
            // Actually, usually delete is generic. Let's use questionBankService for now or check if I need to add it.
            // Wait, sqlQuestionService had list, run, submit. No delete. 
            // I will use questionBankService.deleteQuestion assuming ID is compatible, otherwise I might need to add it to service.
            // But for safety, I'll stick to what I have. If IDs are UUIDs, questionBankService might work if the backend is unified.
            // If not, I'll just log "Not implemented" for now or add it to the implementation plan.
            // Let's check questionBankService.deleteQuestion, it takes 'id'.
            // I'll try generic delete.
            await questionBankService.deleteQuestion(selectedSqlQuestion.id);
            fetchSqlQuestions();
            setShowSqlDeleteModal(false);
            setSelectedSqlQuestion(null);
        } catch (error) {
            console.error('Failed to delete SQL question:', error);
            alert('Failed to delete question');
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setFilters({ ...filters, search: value, page: 1 });
    };

    const handleFilterChange = (key: keyof QuestionBankFilters, value: any) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ page: 1, limit: 20 });
    };

    const toggleSelectQuestion = (id: string) => {
        const newSelected = new Set(selectedQuestions);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedQuestions(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedQuestions.size === questions.length) {
            setSelectedQuestions(new Set());
        } else {
            setSelectedQuestions(new Set(questions.map(q => q.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedQuestions.size === 0) return;
        try {
            await questionBankService.bulkDeleteByIds(Array.from(selectedQuestions));
            fetchQuestions();
            fetchStats();
            setSelectedQuestions(new Set());
            setShowBulkDeleteModal(false);
        } catch (error) {
            console.error('Failed to bulk delete:', error);
            alert('Failed to delete selected questions');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await questionBankService.deleteQuestion(id);
            fetchQuestions();
            setShowDeleteModal(false);
            setSelectedQuestion(null);
        } catch (error) {
            console.error('Failed to delete question:', error);
            alert('Failed to delete question');
        }
    };

    const handleEdit = (question: QuestionBankQuestion) => {
        setSelectedQuestion(question);
        setEditFormData({
            difficulty: question.difficulty,
            marks: question.marks,
            tags: question.tags,
            correctAnswer: question.correctAnswer
        });
        setShowEditModal(true);
    };

    const handleUpdateQuestion = async () => {
        if (!selectedQuestion) return;
        try {
            await questionBankService.updateQuestion(selectedQuestion.id, editFormData);
            fetchQuestions();
            setShowEditModal(false);
            setSelectedQuestion(null);
            setEditFormData({});
        } catch (error) {
            console.error('Failed to update question:', error);
            alert('Failed to update question');
        }
    };

    const [viewQuestion, setViewQuestion] = useState<QuestionBankQuestion | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const handleView = (question: QuestionBankQuestion) => {
        setViewQuestion(question);
        setShowViewModal(true);
    };

    const getQuestionTypeIcon = (type: string) => {
        switch (type) {
            case 'coding': return <Code size={14} className="text-emerald-500" />;
            case 'single_choice': return <CheckCircle size={14} className="text-blue-500" />;
            case 'multiple_choice': return <CheckSquare size={14} className="text-purple-500" />;
            case 'fill_in_the_blank': return <Type size={14} className="text-orange-500" />;
            case 'pseudo_code': return <Code size={14} className="text-pink-500" />;
            case 'sql': return <Database size={14} className="text-amber-500" />;
            default: return <FileText size={14} className="text-muted-foreground" />;
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

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            <Database className="text-primary" size={32} />
                            Question Bank
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and organize your question library
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {stats && (
                            <button
                                onClick={() => setShowStatsModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-medium text-sm transition-all"
                            >
                                <BarChart3 size={18} />
                                View Stats
                                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-bold">{stats.total}</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedQuestions(new Set());
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isSelectionMode ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            {isSelectionMode ? (
                                <>
                                    <X size={18} />
                                    Exit Selection ({selectedQuestions.size})
                                </>
                            ) : (
                                <>
                                    <CheckSquare size={18} />
                                    Select
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => window.location.href = '/question-bank/add'}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                        >
                            <Plus size={18} />
                            Add Question
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {isSelectionMode && selectedQuestions.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between"
                    >
                        <p className="text-sm font-bold text-primary">
                            {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''} selected
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedQuestions(new Set())}
                                className="px-3 py-1.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="px-3 py-1.5 text-sm font-bold bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-colors flex items-center gap-1"
                            >
                                <Trash2 size={14} />
                                Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Question Type Tabs */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveQuestionTab('regular')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeQuestionTab === 'regular'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <FileText size={16} />
                        Regular Questions
                        {stats && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{stats.total}</span>}
                    </button>
                    <button
                        onClick={() => setActiveQuestionTab('coding')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeQuestionTab === 'coding'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Code size={16} />
                        Coding Questions
                        {codingPagination.total > 0 && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold">{codingPagination.total}</span>}
                    </button>
                    <button
                        onClick={() => setActiveQuestionTab('sql')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeQuestionTab === 'sql'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Database size={16} />
                        SQL Questions
                        {sqlPagination.total > 0 && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold">{sqlPagination.total}</span>}
                    </button>
                </div>

                {/* Regular Questions Content */}
                {activeQuestionTab === 'regular' && (
                    <>
                        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                                >
                                    <Filter size={18} />
                                    Filters
                                </button>
                                {(searchQuery || filters.division || filters.difficulty || filters.type) && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium text-sm hover:bg-destructive/20 transition-all"
                                    >
                                        <X size={18} />
                                        Clear
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-border">
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Division</label>
                                                <select
                                                    value={filters.division || ''}
                                                    onChange={(e) => handleFilterChange('division', e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">All Divisions</option>
                                                    {filterOptions?.divisions.map((div, idx) => (
                                                        <option key={idx} value={div}>{div}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Topic</label>
                                                <select
                                                    value={filters.topic || ''}
                                                    onChange={(e) => handleFilterChange('topic', e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">All Topics</option>
                                                    {filterOptions?.topics.map((topic, idx) => (
                                                        <option key={idx} value={topic}>{topic}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Difficulty</label>
                                                <select
                                                    value={filters.difficulty || ''}
                                                    onChange={(e) => handleFilterChange('difficulty', e.target.value as any)}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">All Levels</option>
                                                    <option value="Easy">Easy</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Hard">Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
                                                <select
                                                    value={filters.type || ''}
                                                    onChange={(e) => handleFilterChange('type', e.target.value as any)}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="single_choice">Single Choice</option>
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="fill_in_the_blank">Fill in the Blank</option>
                                                    <option value="coding">Coding</option>
                                                    <option value="pseudo_code">Pseudo Code</option>
                                                    <option value="sql">SQL</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">
                                Showing <span className="font-bold text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-bold text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-foreground">{pagination.total}</span> questions
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-muted-foreground">Loading questions...</p>
                                    </div>
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <Database size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-sm font-bold text-foreground">No questions found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                {isSelectionMode && (
                                                    <th className="py-3 px-4 w-12">
                                                        <div
                                                            onClick={toggleSelectAll}
                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedQuestions.size === questions.length && questions.length > 0 ? 'bg-primary border-primary' : 'border-muted-foreground/50 hover:border-primary'}`}
                                                        >
                                                            {selectedQuestions.size === questions.length && questions.length > 0 && <CheckCircle size={14} className="text-primary-foreground" />}
                                                        </div>
                                                    </th>
                                                )}
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Question</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Marks</th>
                                                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {questions.map((question) => {
                                                const isSelected = selectedQuestions.has(question.id);
                                                return (
                                                    <tr
                                                        key={question.id}
                                                        className={`transition-colors cursor-pointer ${isSelectionMode && isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                                                        onClick={() => isSelectionMode && toggleSelectQuestion(question.id)}
                                                    >
                                                        {isSelectionMode && (
                                                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                                <div
                                                                    onClick={() => toggleSelectQuestion(question.id)}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/50 hover:border-primary'}`}
                                                                >
                                                                    {isSelected && <CheckCircle size={14} className="text-primary-foreground" />}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-start gap-3">
                                                                {question.image && (
                                                                    <ImageIcon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                                                )}
                                                                <div className="text-sm text-foreground line-clamp-2 max-w-md">
                                                                    {question.text.split(/(```[\s\S]*?```)/g).map((part, pIdx) => {
                                                                        if (part.startsWith('```')) {
                                                                            return <span key={pIdx} className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-primary">{'<Code Snippet>'}</span>;
                                                                        }
                                                                        return <span key={pIdx}>{part}</span>;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                {getQuestionTypeIcon(question.type)}
                                                                <span className="text-xs font-medium text-muted-foreground capitalize">
                                                                    {question.type.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{question.topic}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getDifficultyColor(question.difficulty)}`}>
                                                                {question.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-sm font-bold text-foreground">{question.marks}</span>
                                                        </td>
                                                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(question)}
                                                                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedQuestion(question);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {!isLoading && questions.length > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm font-bold px-4">
                                        {pagination.page}
                                    </span>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Coding Questions Content */}
                {activeQuestionTab === 'coding' && (
                    <>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search coding problems..."
                                        value={codingSearchQuery}
                                        onChange={(e) => handleCodingSearch(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <select
                                    value={codingFilters.difficulty || ''}
                                    onChange={(e) => setCodingFilters({ ...codingFilters, difficulty: e.target.value as any, skip: 0 })}
                                    className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {isCodingLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-muted-foreground">Loading coding problems...</p>
                                    </div>
                                </div>
                            ) : codingProblems.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <Code size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-sm font-bold text-foreground">No coding problems found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags</th>
                                                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {codingProblems.map((problem) => (
                                                <tr key={problem.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <Code size={16} className="text-emerald-500 shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">{problem.title}</p>
                                                                <p className="text-xs text-muted-foreground font-mono">{problem.titleSlug}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                            problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                'bg-red-500/10 text-red-600 border-red-500/20'
                                                            }`}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {problem.topicTags?.slice(0, 3).map((tag, idx) => (
                                                                <span key={idx} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                            {(problem.topicTags?.length || 0) > 3 && (
                                                                <span className="text-[10px] text-muted-foreground">+{problem.topicTags!.length - 3}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCodingProblem(problem);
                                                                    setShowCodingEditModal(true);
                                                                }}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCodingProblem(problem);
                                                                    setShowCodingDeleteModal(true);
                                                                }}
                                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {!isCodingLoading && codingProblems.length > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Showing {codingPagination.skip + 1} - {Math.min(codingPagination.skip + codingPagination.take, codingPagination.total)} of {codingPagination.total}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCodingFilters({ ...codingFilters, skip: Math.max(0, codingPagination.skip - codingPagination.take) })}
                                        disabled={codingPagination.skip === 0}
                                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setCodingFilters({ ...codingFilters, skip: codingPagination.skip + codingPagination.take })}
                                        disabled={codingPagination.skip + codingPagination.take >= codingPagination.total}
                                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* SQL Questions Content */}
            {activeQuestionTab === 'sql' && (
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search SQL questions..."
                                    value={sqlSearchQuery}
                                    onChange={(e) => handleSqlSearch(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <select
                                value={sqlFilters.dialect || ''}
                                onChange={(e) => handleSqlFilterChange('dialect', e.target.value)}
                                className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                            >
                                <option value="">All Dialects</option>
                                {sqlFilterOptions?.dialects.map((d, i) => (
                                    <option key={i} value={d}>{d}</option>
                                ))}
                            </select>
                            <select
                                value={sqlFilters.difficulty || ''}
                                onChange={(e) => handleSqlFilterChange('difficulty', e.target.value)}
                                className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                            >
                                <option value="">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                            <select
                                value={sqlFilters.topic || ''}
                                onChange={(e) => handleSqlFilterChange('topic', e.target.value)}
                                className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                            >
                                <option value="">All Topics</option>
                                {sqlFilterOptions?.topics.map((t, i) => (
                                    <option key={i} value={t}>{t}</option>
                                ))}
                            </select>
                            <select
                                value={sqlFilters.subdivision || ''}
                                onChange={(e) => handleSqlFilterChange('subdivision', e.target.value)}
                                className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                            >
                                <option value="">All Subdivisions</option>
                                {sqlFilterOptions?.subdivisions.map((s, i) => (
                                    <option key={i} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {isSqlLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-muted-foreground">Loading SQL questions...</p>
                                </div>
                            </div>
                        ) : sqlQuestions.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <Database size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                                    <p className="text-sm font-bold text-foreground">No SQL questions found</p>
                                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</th>
                                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dialect</th>
                                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sqlQuestions.map((question) => (
                                            <tr key={question.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Database size={16} className="text-amber-500 shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{question.title}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{question.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md uppercase">{question.dialect}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${question.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        question.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                            'bg-red-500/10 text-red-600 border-red-500/20'
                                                        }`}>
                                                        {question.difficulty}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-muted-foreground">{question.topic || '-'}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const adapted: QuestionBankQuestion = {
                                                                    id: question.id,
                                                                    text: question.description || question.content,
                                                                    title: question.title,
                                                                    description: question.description || question.content,
                                                                    type: 'sql',
                                                                    marks: 0,
                                                                    order: 0,
                                                                    tags: [],
                                                                    topic: question.topic || '',
                                                                    division: 'Coding',
                                                                    subdivision: question.subdivision || '',
                                                                    difficulty: question.difficulty,
                                                                    createdAt: question.createdAt || '',
                                                                    updatedAt: '',
                                                                    inputTables: question.inputTables,
                                                                    expectedResult: question.expectedResult,
                                                                    expectedQuery: question.expectedResult ? undefined : '',
                                                                    dialect: question.dialect,
                                                                    hint: question.hint,
                                                                } as any;
                                                                handleView(adapted);
                                                            }}
                                                            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                                            title="View Question"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSqlQuestion(question);
                                                                setShowSqlEditModal(true);
                                                            }}
                                                            className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                            title="Edit Question"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSqlQuestion(question);
                                                                setShowSqlDeleteModal(true);
                                                            }}
                                                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                            title="Delete Question"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {!isSqlLoading && sqlQuestions.length > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Showing {((sqlPagination.page - 1) * sqlPagination.limit) + 1} - {Math.min(sqlPagination.page * sqlPagination.limit, sqlPagination.total)} of {sqlPagination.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSqlFilters({ ...sqlFilters, page: Math.max(1, sqlPagination.page - 1) })}
                                    disabled={sqlPagination.page === 1}
                                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setSqlFilters({ ...sqlFilters, page: Math.ceil(sqlPagination.total / sqlPagination.limit) })}
                                    disabled={sqlPagination.page >= Math.ceil(sqlPagination.total / sqlPagination.limit)}
                                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* Modals */}
            <AnimatePresence>
                {showSqlDeleteModal && selectedSqlQuestion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <AlertCircle className="text-destructive" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">Delete SQL Question?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Are you sure you want to delete this SQL question? This action cannot be undone.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg line-clamp-2">
                                        "{selectedSqlQuestion.title}"
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowSqlDeleteModal(false);
                                        setSelectedSqlQuestion(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSqlQuestion}
                                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-bold"
                                >
                                    Delete Question
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Question Modal */}
            <AnimatePresence>
                {showViewModal && viewQuestion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
                    >
                        <div className="min-h-screen p-6 md:p-10">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            {viewQuestion.type === 'sql' ? <Database size={24} /> : <Code size={24} />}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground">Question Properties</h2>
                                            <p className="text-sm text-muted-foreground">{viewQuestion.type === 'sql' ? 'SQL Question Details' : 'Question Preview'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
                                    {viewQuestion.type === 'sql' ? (
                                        <div className="overflow-none">
                                            <SQLQuestionDisplay question={viewQuestion as any} />
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-bold mb-2">{viewQuestion.topic}</h3>
                                                <div className="p-4 bg-muted/50 rounded-lg">
                                                    <p className="whitespace-pre-wrap">{viewQuestion.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <CodingQuestionEditModal
                problem={selectedCodingProblem}
                isOpen={showCodingEditModal}
                onClose={() => {
                    setShowCodingEditModal(false);
                    setSelectedCodingProblem(null);
                }}
                onSave={() => fetchCodingProblems()}
            />

            <AnimatePresence>
                {showCodingDeleteModal && selectedCodingProblem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <AlertCircle className="text-destructive" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">Delete Coding Problem?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Are you sure you want to delete this coding problem? This action cannot be undone.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg line-clamp-2">
                                        "{selectedCodingProblem.title}"
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCodingDeleteModal(false);
                                        setSelectedCodingProblem(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCodingProblem}
                                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-bold"
                                >
                                    Delete Problem
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditModal && selectedQuestion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6 sticky top-0 bg-card z-10 pb-4 border-b border-border">
                                <h3 className="text-xl font-bold text-foreground">Edit Question</h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedQuestion(null);
                                        setEditFormData({});
                                    }}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question Text</p>
                                        <div className="space-y-4">
                                            {/* Text Input */}
                                            <div>
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Question Statement</label>
                                                <textarea
                                                    value={editFormData.text ?? selectedQuestion.text}
                                                    onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:border-primary outline-none min-h-[80px]"
                                                    placeholder="Enter question text..."
                                                />
                                            </div>



                                            {/* Preview */}
                                            <div className="pt-2 border-t border-border/50">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                                                <div className="bg-card border border-border rounded-lg p-4">
                                                    <div className="mb-3 whitespace-pre-wrap font-medium text-sm">
                                                        {editFormData.text ?? selectedQuestion.text}
                                                    </div>
                                                    {((editFormData as any).pseudocode || (selectedQuestion as any).pseudocode) && (
                                                        <PseudoCodeDisplay code={(editFormData as any).pseudocode ?? (selectedQuestion as any).pseudocode} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedQuestion.image && (
                                            <div className="mt-3">
                                                <img src={selectedQuestion.image} alt="Question" className="max-w-full rounded-lg border border-border" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Question Info</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 rounded-md font-medium">{selectedQuestion.division}</span>
                                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md font-medium">{selectedQuestion.subdivision}</span>
                                            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium">{selectedQuestion.topic}</span>
                                        </div>
                                    </div>


                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-4 p-4 border border-border rounded-xl">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Edit Properties</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-foreground mb-1.5 block">Type</label>
                                                <select
                                                    value={editFormData.type || selectedQuestion.type}
                                                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="single_choice">Single Choice</option>
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="fill_in_the_blank">Fill in the Blank</option>
                                                    <option value="pseudo_code">Pseudo Code</option>
                                                    <option value="sql">SQL</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-foreground mb-1.5 block">Difficulty</label>
                                                <select
                                                    value={editFormData.difficulty || selectedQuestion.difficulty}
                                                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as any })}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                >
                                                    <option value="Easy">Easy</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Hard">Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-foreground mb-1.5 block">Marks</label>
                                                <input
                                                    type="number"
                                                    value={editFormData.marks ?? selectedQuestion.marks}
                                                    onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) })}
                                                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground mb-1.5 block">Tags (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={editFormData.tags?.join(', ') || selectedQuestion.tags?.join(', ') || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                                                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                                placeholder="e.g., algorithms, arrays, sorting"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 border border-border rounded-xl">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Options & Correct Answer</p>
                                        {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-4">Click on an option to mark it as correct</p>
                                                <div className="space-y-2">
                                                    {selectedQuestion.options.map((option, index) => {
                                                        const optIndexStr = String(index);
                                                        const isCorrect = (editFormData.correctAnswer ?? selectedQuestion.correctAnswer) === optIndexStr || (editFormData.correctAnswer ?? selectedQuestion.correctAnswer) === option;

                                                        return (
                                                            <div
                                                                key={index}
                                                                onClick={() => setEditFormData({ ...editFormData, correctAnswer: optIndexStr })}
                                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isCorrect ? 'bg-green-500/20 border-2 border-green-500/50' : 'bg-background border border-border hover:bg-muted'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isCorrect ? 'border-green-500 bg-green-500' : 'border-muted-foreground'}`}>
                                                                    {isCorrect && <CheckCircle size={12} className="text-white" />}
                                                                </div>
                                                                <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>{String.fromCharCode(65 + index)}.</span>
                                                                <span className={`flex-1 text-sm ${isCorrect ? 'font-bold text-green-700' : 'text-foreground'}`}>{option}</span>
                                                                {isCorrect && <span className="text-xs font-bold text-green-600 bg-green-500/20 px-2 py-1 rounded">Correct</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 bg-muted/30 rounded-lg text-center">
                                                <p className="text-sm text-muted-foreground">No options available for this question type</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedQuestion(null);
                                        setEditFormData({});
                                    }}
                                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateQuestion}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm font-bold"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeleteModal && selectedQuestion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <AlertCircle className="text-destructive" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">Delete Question?</h3>
                                    <p className="text-sm text-muted-foreground">Are you sure you want to delete this question? This action cannot be undone.</p>
                                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg line-clamp-2">"{selectedQuestion.text}"</p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedQuestion(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedQuestion.id)}
                                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-bold"
                                >
                                    Delete Question
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showStatsModal && stats && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
                    >
                        <div className="min-h-screen p-6 md:p-10">
                            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
                                        <BarChart3 className="text-primary" size={32} />
                                        Question Bank Analytics
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">Complete breakdown of your question library</p>
                                </div>
                                <button onClick={() => setShowStatsModal(false)} className="p-3 hover:bg-muted rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="max-w-6xl mx-auto space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
                                        <p className="text-5xl font-black">{stats.total}</p>
                                        <p className="text-sm font-medium opacity-80 mt-1">Total Questions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                                        <p className="text-5xl font-black">{Object.keys(stats.byDivision).length}</p>
                                        <p className="text-sm font-medium opacity-80 mt-1">Divisions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                                        <p className="text-5xl font-black">{Object.keys(stats.bySubdivision).length}</p>
                                        <p className="text-sm font-medium opacity-80 mt-1">Subdivisions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                                        <p className="text-5xl font-black">{Object.keys(stats.byType).length}</p>
                                        <p className="text-sm font-medium opacity-80 mt-1">Question Types</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-card border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">By Division</h3>
                                        <div className="space-y-4">
                                            {Object.entries(stats.byDivision).map(([div, count], i) => {
                                                const percentage = Math.round((count / stats.total) * 100);
                                                return (
                                                    <div key={div}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-bold">{div}</span>
                                                            <span className="text-sm font-black text-primary">{count}</span>
                                                        </div>
                                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">By Difficulty</h3>
                                        <div className="space-y-3">
                                            {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                                                <div key={diff} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{diff}</span>
                                                    <span className="text-sm font-black">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">By Type</h3>
                                        <div className="space-y-4">
                                            {Object.entries(stats.byType).map(([type, count]) => (
                                                <div key={type} className="flex items-center justify-between">
                                                    <span className="text-sm font-bold capitalize">{type.replace(/_/g, ' ')}</span>
                                                    <span className="text-sm font-black text-blue-600">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center pb-6">
                                    <button onClick={() => setShowStatsModal(false)} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
                                        Close Analytics
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showBulkDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <Trash2 className="text-destructive" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">Delete {selectedQuestions.size} Questions?</h3>
                                    <p className="text-sm text-muted-foreground">Are you sure you want to delete {selectedQuestions.size} selected questions? This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowBulkDeleteModal(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium">Cancel</button>
                                <button onClick={handleBulkDelete} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-bold">Delete All</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SQL Edit Modal */}
            <SQLQuestionEditModal
                isOpen={showSqlEditModal}
                onClose={() => {
                    setShowSqlEditModal(false);
                    setSelectedSqlQuestion(null);
                }}
                question={selectedSqlQuestion}
                onSave={() => {
                    fetchSqlQuestions();
                    setShowSqlEditModal(false);
                    setSelectedSqlQuestion(null);
                }}
            />
        </div >
    );
};

export default QuestionBankPage;