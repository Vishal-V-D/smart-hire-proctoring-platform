import React, { useState, useMemo } from 'react';
import {
    FileText, RefreshCw, Search, Filter, X, ChevronRight, Edit2, Trash2,
    CheckCircle, AlertTriangle, Clock, TrendingUp, Code, Award, Shield,
    ChevronDown, ChevronUp, AlertOctagon, User, Building, Hash,
    MoreHorizontal
} from 'lucide-react';

// --- Types ---

interface ResultData {
    id: string;
    totalBaseScore: number;
    violationPenalty: number;
    suggestedPenalty: number;
    finalScore: number;
    plagiarismScore: number;
    suspiciousScore: number;
    aiScore: number;
    isAiGenerated: boolean;
    isSuspicious: boolean;
    durationSeconds: number;
    totalProblems: number;
    totalProblemsSolved: number;
    registrationDetails: {
        name: string;
        email: string;
        college: string;
        department: string;
        rollNumber: string;
        photoUrl?: string;
    };
    resultDetails: {
        problemResults: Array<{
            problemTitle: string;
            difficulty: string;
            status: string;
            baseScore: number;
            testCasesTotal: number;
            testCasesPassed: number;
        }>;
        violationDetails: {
            tabSwitchCount: number;
            totalViolations: number;
            externalPasteCount: number;
        };
        plagiarismSummary: any[];
    };
    timeMetrics: {
        usedSeconds: number;
        allocatedSeconds: number;
        percentageUsed: number;
        wasExpired: boolean;
    };
    violationReport: {
        flags: Record<string, number>;
        score: number;
    };
    allocatedDurationSeconds: number;
}

interface AdvancedResultsTableProps {
    results: ResultData[];
    loading: boolean;
    onRefresh: () => void;
    onEditResult: (result: ResultData) => void;
    onDeleteResult: (id: string) => void;
    onApplyPenalty: (id: string, penalty: number) => void;
}

type SortKey = 'name' | 'score' | 'plagiarism' | 'ai' | 'violations' | 'time' | 'college';
type SortDirection = 'asc' | 'desc';

interface FilterState {
    minScore: string;
    maxScore: string;
    minPlagiarism: string;
    college: string;
    department: string;
    isSuspicious: boolean | null;
}

// --- Helper Functions ---

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
};

// --- Components ---

export default function AdvancedResultsTable({
    results = [],
    loading,
    onRefresh,
    onEditResult,
    onDeleteResult,
    onApplyPenalty
}: AdvancedResultsTableProps) {
    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'score',
        direction: 'desc'
    });

    // Filtering State
    const [filters, setFilters] = useState<FilterState>({
        minScore: '',
        maxScore: '',
        minPlagiarism: '',
        college: '',
        department: '',
        isSuspicious: null
    });

    // --- Computed Logic ---

    // 1. Filter Data
    const filteredData = useMemo(() => {
        return results.filter(item => {
            // Text Search
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch =
                item.registrationDetails.name.toLowerCase().includes(lowerSearch) ||
                item.registrationDetails.email.toLowerCase().includes(lowerSearch) ||
                item.registrationDetails.rollNumber.toLowerCase().includes(lowerSearch);

            if (!matchesSearch) return false;

            // Advanced Filters
            if (filters.minScore && item.finalScore < Number(filters.minScore)) return false;
            if (filters.maxScore && item.finalScore > Number(filters.maxScore)) return false;
            if (filters.minPlagiarism && item.plagiarismScore < Number(filters.minPlagiarism)) return false;
            if (filters.college && !item.registrationDetails.college.toLowerCase().includes(filters.college.toLowerCase())) return false;
            if (filters.department && !item.registrationDetails.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
            if (filters.isSuspicious === true && !item.isSuspicious) return false;

            return true;
        });
    }, [results, searchTerm, filters]);

    // 2. Sort Data
    const sortedData = useMemo(() => {
        const data = [...filteredData];
        data.sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            switch (sortConfig.key) {
                case 'name':
                    aValue = a.registrationDetails.name;
                    bValue = b.registrationDetails.name;
                    break;
                case 'score':
                    aValue = a.finalScore;
                    bValue = b.finalScore;
                    break;
                case 'plagiarism':
                    aValue = a.plagiarismScore;
                    bValue = b.plagiarismScore;
                    break;
                case 'ai':
                    aValue = a.aiScore;
                    bValue = b.aiScore;
                    break;
                case 'violations':
                    aValue = a.resultDetails.violationDetails.totalViolations;
                    bValue = b.resultDetails.violationDetails.totalViolations;
                    break;
                case 'time':
                    aValue = a.durationSeconds;
                    bValue = b.durationSeconds;
                    break;
                case 'college':
                    aValue = a.registrationDetails.college;
                    bValue = b.registrationDetails.college;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [filteredData, sortConfig]);

    // --- Handlers ---

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const toggleRowExpand = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const clearFilters = () => {
        setFilters({
            minScore: '',
            maxScore: '',
            minPlagiarism: '',
            college: '',
            department: '',
            isSuspicious: null
        });
        setSearchTerm('');
        setShowFilterModal(false);
    };

    // --- Render Helpers ---

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortConfig.key !== colKey) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={16} className="text-cyan-500" />
            : <ChevronDown size={16} className="text-cyan-500" />;
    };

    return (
        <div className="space-y-6 font-sans text-gray-200">

            {/* Main Table Container */}
            <div className="bg-gray-900 rounded-[24px] shadow-xl border border-gray-800 overflow-hidden">

                {/* Toolbar */}
                <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900/50">
                    <h3 className="text-lg font-bold text-white">Participant Results</h3>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border
                                    ${Object.values(filters).some(x => x)
                                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800/50'}`}
                            >
                                <Filter size={16} />
                                Filters
                            </button>
                            <button
                                onClick={onRefresh}
                                disabled={loading}
                                className="p-2 bg-gray-950 border border-gray-800 text-gray-400 rounded-xl hover:text-white hover:bg-gray-800/50 transition"
                                title="Refresh Results"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-separate border-spacing-y-1 px-4">
                        <thead className="text-xs text-gray-500 uppercase bg-transparent">
                            <tr>
                                <th className="w-10 px-4 py-3"></th>
                                <th onClick={() => handleSort('name')} className="px-4 py-3 cursor-pointer group hover:text-white transition">
                                    <div className="flex items-center gap-1">User Details <SortIcon colKey="name" /></div>
                                </th>
                                <th onClick={() => handleSort('score')} className="px-4 py-3 cursor-pointer group hover:text-white transition text-center">
                                    <div className="flex items-center justify-center gap-1">Score <SortIcon colKey="score" /></div>
                                </th>
                                <th onClick={() => handleSort('plagiarism')} className="px-4 py-3 cursor-pointer group hover:text-white transition text-center">
                                    <div className="flex items-center justify-center gap-1">Integrity <SortIcon colKey="plagiarism" /></div>
                                </th>
                                <th onClick={() => handleSort('violations')} className="px-4 py-3 cursor-pointer group hover:text-white transition text-center">
                                    <div className="flex items-center justify-center gap-1">Violations <SortIcon colKey="violations" /></div>
                                </th>
                                <th onClick={() => handleSort('time')} className="px-4 py-3 cursor-pointer group hover:text-white transition text-center">
                                    <div className="flex items-center justify-center gap-1">Time <SortIcon colKey="time" /></div>
                                </th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="pb-4">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center text-gray-500">Loading results...</td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center text-gray-500">No results found matching your filters.</td>
                                </tr>
                            ) : (
                                sortedData.map((result) => (
                                    <React.Fragment key={result.id}>
                                        <tr className={`relative group transition rounded-2xl ${expandedRows.has(result.id) ? 'bg-gray-800/50' : 'bg-transparent hover:bg-gray-800/30'}`}>
                                            {/* Expand Icon */}
                                            <td className="px-4 py-3 text-center rounded-l-2xl">
                                                <button
                                                    onClick={() => toggleRowExpand(result.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700/50 text-gray-500 hover:text-white transition"
                                                >
                                                    <ChevronRight size={16} className={`transition-transform duration-200 ${expandedRows.has(result.id) ? 'rotate-90' : ''}`} />
                                                </button>
                                            </td>

                                            {/* User Details */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={result.registrationDetails.photoUrl || `https://ui-avatars.com/api/?name=${result.registrationDetails.name}&background=random`}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-700 shadow-sm"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-gray-200 text-sm">{result.registrationDetails.name}</div>
                                                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{result.registrationDetails.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Score */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={`text-lg font-black ${result.finalScore >= 80 ? 'text-emerald-400' :
                                                        result.finalScore >= 50 ? 'text-white' : 'text-red-400'
                                                        }`}>
                                                        {result.finalScore}
                                                    </span>
                                                    {result.violationPenalty > 0 && (
                                                        <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 rounded">
                                                            -{result.violationPenalty}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Integrity */}
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    {result.isSuspicious ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                                            <AlertOctagon size={12} /> SUSPICIOUS
                                                        </span>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${result.plagiarismScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'} mt-1.5`} />
                                                            <div className="text-xs">
                                                                <div className="font-semibold text-gray-300">{result.plagiarismScore}% Plag</div>
                                                                <div className="text-gray-500">{result.aiScore}% AI</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Violations */}
                                            <td className="px-4 py-3 text-center">
                                                {result.resultDetails.violationDetails.totalViolations > 0 ? (
                                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400">
                                                        <AlertTriangle size={14} />
                                                        {result.resultDetails.violationDetails.totalViolations} Flags
                                                    </div>
                                                ) : (
                                                    <span className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1">
                                                        <CheckCircle size={14} /> Clean
                                                    </span>
                                                )}
                                            </td>

                                            {/* Time */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="text-xs font-mono font-medium text-gray-300">{formatDuration(result.durationSeconds)}</div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right rounded-r-2xl">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => onEditResult(result)} className="p-2 md:p-1.5 text-gray-500 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => onDeleteResult(result.id)} className="p-2 md:p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* EXPANDED SECTION */}
                                        {expandedRows.has(result.id) && (
                                            <tr>
                                                <td colSpan={8} className="p-4 bg-transparent">
                                                    <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-inner">

                                                        {/* 1. Problems */}
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                                                                <Code size={14} /> Failed / Solved Breakdown
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {result.resultDetails.problemResults.map((prob, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-gray-900 border border-gray-800">
                                                                        <span className="text-xs font-medium text-gray-300 truncate max-w-[140px]">{prob.problemTitle}</span>
                                                                        <div className="text-right">
                                                                            <div className={`text-[10px] font-bold ${prob.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                                {prob.status}
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-500">
                                                                                {prob.baseScore} pts
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 2. Violations */}
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                                                                <Shield size={14} /> Violation Feed
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-lg text-center">
                                                                    <div className="text-lg font-black text-orange-500">{result.resultDetails.violationDetails.tabSwitchCount}</div>
                                                                    <div className="text-[10px] text-orange-500/70 font-bold uppercase">Tab Switches</div>
                                                                </div>
                                                                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center">
                                                                    <div className="text-lg font-black text-red-500">{result.resultDetails.violationDetails.externalPasteCount}</div>
                                                                    <div className="text-[10px] text-red-500/70 font-bold uppercase">Pastes</div>
                                                                </div>
                                                            </div>
                                                            {result.suggestedPenalty > 0 && (
                                                                <button
                                                                    onClick={() => onApplyPenalty(result.id, result.suggestedPenalty)}
                                                                    className="w-full py-2 bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20"
                                                                >
                                                                    Apply Suggested Penalty (-{result.suggestedPenalty})
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* 3. Meta */}
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                                                                <Building size={14} /> Candidate Info
                                                            </h4>
                                                            <div className="space-y-3 text-sm">
                                                                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                                                    <div className="text-xs text-gray-500 mb-0.5">Institution</div>
                                                                    <div className="font-semibold text-gray-300">{result.registrationDetails.college}</div>
                                                                </div>
                                                                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                                                    <div className="text-xs text-gray-500 mb-0.5">Department</div>
                                                                    <div className="font-semibold text-gray-300">{result.registrationDetails.department}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Filter size={18} className="text-cyan-500" /> Advanced Filters
                            </h3>
                            <button onClick={() => setShowFilterModal(false)} className="text-gray-500 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Score Range */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <Award size={16} /> Score Range
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.minScore}
                                            onChange={e => setFilters(prev => ({ ...prev, minScore: e.target.value }))}
                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                        />
                                    </div>
                                    <span className="text-gray-600">-</span>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.maxScore}
                                            onChange={e => setFilters(prev => ({ ...prev, maxScore: e.target.value }))}
                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Integrity Settings */}
                            <div className="space-y-3 pt-4 border-t border-gray-800">
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <Shield size={16} /> Integrity Check
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Min Plagiarism %</span>
                                        <input
                                            type="number"
                                            placeholder="e.g. 50"
                                            value={filters.minPlagiarism}
                                            onChange={e => setFilters(prev => ({ ...prev, minPlagiarism: e.target.value }))}
                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-gray-800 rounded-xl w-full hover:bg-gray-800 transition">
                                            <input
                                                type="checkbox"
                                                checked={filters.isSuspicious === true}
                                                onChange={e => setFilters(prev => ({ ...prev, isSuspicious: e.target.checked ? true : null }))}
                                                className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500 bg-gray-950 border-gray-700"
                                            />
                                            <span className="text-sm text-gray-300">Flagged Only</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 bg-gray-950/30 flex gap-3">
                            <button
                                onClick={clearFilters}
                                className="flex-1 py-3 border border-gray-800 bg-transparent text-gray-400 font-semibold rounded-xl hover:bg-gray-800 transition"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
