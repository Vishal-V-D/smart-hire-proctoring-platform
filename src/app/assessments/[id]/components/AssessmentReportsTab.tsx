"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Filter,
    Download,
    Eye,
    ChevronDown,
    ChevronUp,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    BarChart3,
    ArrowRight,
    Users,
    Mail,
    RefreshCw,
    Shield,
    MoreVertical,
    Check,
    X
} from 'lucide-react';
import { assessmentService } from '@/api/assessmentService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProviderClient';
import StatsModal from './StatsModal';
import ReportsFilterModal from './ReportsFilterModal';

interface AssessmentReportsTabProps {
    assessmentId: string;
    assessment: any;
}

const AssessmentReportsTab = ({ assessmentId, assessment }: AssessmentReportsTabProps) => {
    const router = useRouter();
    const { user } = useAuth();
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<any>({
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        passRate: 0,
        averageTimeTaken: 0,
        departmentStats: [],
        collegeStats: []
    });
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<any>({
        statuses: [],
        minScore: '',
        maxScore: '',
        dateRange: 'all',
        department: '',
        college: '',
        plagiarismRisk: []
    });

    const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });

    useEffect(() => {
        fetchReports();
    }, [assessmentId]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Fetch participants/reports with full details
            const response = await assessmentService.getParticipantReports(assessmentId);
            if (response.data) {
                setParticipants(response.data.participants || []);
                setStats(response.data.stats || {});
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Charts/Visuals within the table view context
    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            const matchesSearch =
                p.registration?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.registration?.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const pStatus = p.session?.status?.toLowerCase();
            const matchesStatus = filters.statuses?.length > 0 ? filters.statuses.includes(pStatus) : true;

            const score = p.scores?.percentage || 0;
            const matchesMinScore = filters.minScore ? score >= Number(filters.minScore) : true;
            const matchesMaxScore = filters.maxScore ? score <= Number(filters.maxScore) : true;

            const matchesDepartment = filters.department ? p.registration?.department === filters.department : true;
            const matchesCollege = filters.college ? p.registration?.college === filters.college : true;

            const matchesRisk = filters.plagiarismRisk?.length > 0 ? (
                filters.plagiarismRisk.includes(p.plagiarism?.verdict) ||
                filters.plagiarismRisk.includes(p.plagiarism?.riskLevel)
            ) : true;

            return matchesSearch && matchesStatus && matchesMinScore && matchesMaxScore && matchesDepartment && matchesCollege && matchesRisk;
        }).sort((a, b) => {
            // Allow nested property sorting
            const getVal = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);

            let valA = getVal(a, sortConfig.key);
            let valB = getVal(b, sortConfig.key);

            // Handle date comparison
            if (sortConfig.key === 'submittedAt' || sortConfig.key === 'createdAt') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            // Handle numeric comparison
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }

            // String comparison
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();

            return sortConfig.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        });
    }, [participants, searchQuery, filters, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'STARTED': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getVerdictBadge = (status: string) => {
        switch (status) {
            case 'PASSED': return 'bg-emerald-100 text-emerald-700';
            case 'FAILED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getRiskBadge = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-500 text-white';
            case 'HIGH': return 'bg-orange-500 text-white';
            case 'MEDIUM': return 'bg-amber-500 text-white';
            case 'LOW': return 'bg-yellow-500 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    const viewReport = (participantId: string) => {
        router.push(`/assessments/${assessmentId}/reports/${participantId}`);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // Small Stats Summary Component (Compact)
    const QuickStat = ({ label, value, subtext, icon: Icon, color }: any) => (
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-sm hover:border-primary/20 transition-all cursor-default">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
                <Icon size={18} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-foreground">{value}</span>
                    {subtext && <span className="text-[10px] text-muted-foreground">{subtext}</span>}
                </div>
            </div>
        </div>
    );

    const departments = useMemo(() => {
        const set = new Set(participants.map(p => p.registration?.department).filter(Boolean));
        return Array.from(set) as string[];
    }, [participants]);

    const colleges = useMemo(() => {
        const set = new Set(participants.map(p => p.registration?.college).filter(Boolean));
        return Array.from(set) as string[];
    }, [participants]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm animate-pulse">Gathering insights...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Header & Filters Toolbar */}
            <div className="flex flex-col gap-4">
                {/* Search & Actions Row */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search candidates by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <button
                            onClick={() => setShowFilters(true)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm
                                ${filters.statuses?.length > 0 || filters.minScore || filters.maxScore || filters.department || filters.college || filters.plagiarismRisk?.length > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted text-foreground'}
                            `}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {(filters.statuses?.length > 0 || filters.minScore || filters.maxScore || filters.department || filters.college || filters.plagiarismRisk?.length > 0) && (
                                <span className="w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] rounded-full">!</span>
                            )}
                        </button>

                        <div className="h-8 w-px bg-border mx-1 hidden md:block" />

                        <button
                            onClick={() => setShowStatsModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            <BarChart3 size={16} />
                            <span className="hidden sm:inline">Analytics</span>
                        </button>

                        <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:bg-muted text-foreground rounded-xl text-sm font-medium transition-all shadow-sm">
                            <Download size={16} />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>

                {/* Quick Summary Strip - removing big cards as per earlier request, keeping it lean */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <QuickStat label="Candidates" value={stats.totalParticipants} color="bg-blue-500" icon={Users} />
                    <QuickStat label="Avg Score" value={`${Math.round(stats.averageScore)}%`} color="bg-violet-500" icon={BarChart3} />
                    <QuickStat label="Pass Rate" value={`${Math.round(stats.passRate)}%`} color="bg-emerald-500" icon={CheckCircle} />
                    <QuickStat label="Completed" value={stats.completed} subtext={`/ ${stats.totalParticipants}`} color="bg-amber-500" icon={Check} />
                </div>

                {/* Filters Modal/Dropdown Area */}
                <ReportsFilterModal
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    currentFilters={filters}
                    onApply={(newFilters) => setFilters(newFilters)}
                    departments={departments}
                    colleges={colleges}
                />
            </div>

            {/* 2. Main Data Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Table Header Controls */}
                <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        Candidate Results <span className="text-muted-foreground font-normal">({filteredParticipants.length})</span>
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" /> Pass
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" /> Fail
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500" /> Flagged
                        </div>
                    </div>
                </div>

                {filteredParticipants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search size={32} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No results found</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-[300px]">
                            Try adjusting your filters or search query to find who you're looking for.
                        </p>
                        <button
                            onClick={() => {
                                setFilters({
                                    statuses: [],
                                    minScore: '',
                                    maxScore: '',
                                    dateRange: 'all',
                                    department: '',
                                    college: '',
                                    plagiarismRisk: []
                                });
                                setSearchQuery('');
                            }}
                            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                                    <th className="py-3 px-4 w-[250px] cursor-pointer hover:text-foreground transition-colors group" onClick={() => handleSort('registration.fullName')}>
                                        <div className="flex items-center gap-2">
                                            Candidate Details
                                            {sortConfig.key === 'registration.fullName' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('registration.department')}>
                                        Department
                                    </th>
                                    <th className="py-3 px-4 text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('session.status')}>
                                        Status
                                    </th>
                                    <th className="py-3 px-4 text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('session.totalTimeTaken')}>
                                        Time
                                    </th>

                                    {/* Dynamic Section Columns - Only show summary columns for sections */}
                                    {assessment?.sections?.map((section: any, idx: number) => (
                                        <React.Fragment key={section.id}>
                                            <th className="py-3 px-4 text-center border-l border-border bg-muted/30">
                                                <div className="flex flex-col items-center" title={section.title}>
                                                    <span className="truncate max-w-[80px] text-[10px]">{section.title}</span>
                                                    <span className="text-[9px] opacity-70">Score</span>
                                                </div>
                                            </th>
                                            {section.type === 'coding' && (
                                                <>
                                                    <th className="py-3 px-4 text-center border-l-0 border-r-0 border-border bg-muted/30">
                                                        <span className="text-[9px] opacity-70">Time</span>
                                                    </th>
                                                    <th className="py-3 px-4 text-center border-r border-border bg-muted/30">
                                                        <span className="text-[9px] opacity-70">Tests</span>
                                                    </th>
                                                </>
                                            )}
                                            {section.type !== 'coding' && (
                                                <th className="py-3 px-4 text-center border-r border-border bg-muted/30">
                                                    <span className="text-[9px] opacity-70">Time</span>
                                                </th>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    <th className="py-3 px-2 text-center text-red-600/70 bg-red-50/50">Plag %</th>
                                    <th className="py-3 px-2 text-center text-red-600/70 bg-red-50/50">AI %</th>
                                    <th className="py-3 px-2 text-center border-r border-border bg-red-50/50">Risk</th>

                                    <th className="py-3 px-2 text-center bg-green-50/30 text-green-700/70">Score</th>
                                    <th className="py-3 px-4 text-center border-r border-border bg-green-50/30 text-green-700/70 cursor-pointer" onClick={() => handleSort('scores.percentage')}>
                                        Total %
                                    </th>

                                    <th className="py-3 px-4">Violations</th>
                                    <th className="py-3 px-4">Verdict</th>
                                    <th className="py-3 px-4 text-right sticky right-0 bg-muted/50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredParticipants.map((p) => {
                                    return (
                                        <tr key={p.participantId} className="hover:bg-muted/20 transition-colors group text-sm" onClick={() => viewReport(p.participantId)}>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {p.registration?.avatar ? (
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                                                            <img src={p.registration.avatar} alt="" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 rounded-full bg-black/5 group-hover:bg-transparent transition-colors" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-background shadow-sm">
                                                            {p.registration?.fullName?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-0.5 w-full">
                                                        <p className="font-bold text-foreground text-sm truncate" title={p.registration?.fullName}>
                                                            {p.registration?.fullName || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/80 truncate font-medium" title={p.registration?.email}>
                                                            {p.registration?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 border-r border-border whitespace-nowrap">
                                                <div>
                                                    <p className="font-medium text-foreground text-xs">{p.registration?.department || '-'}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={p.registration?.college}>{p.registration?.college || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 border-r border-border whitespace-nowrap text-center">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(p.session?.status)}`}>
                                                    {p.session?.status?.replace('_', ' ') || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-r border-border whitespace-nowrap text-center">
                                                <span className="text-[11px] font-mono text-muted-foreground">
                                                    {formatDuration(p.session?.totalTimeTaken)}
                                                </span>
                                            </td>
                                            {assessment?.sections?.map((section: any) => {
                                                const sScore = p.scores?.sectionScores?.find((s: any) => s.sectionId === section.id || s.sectionTitle === section.title);
                                                const isCoding = section.type === 'coding';
                                                let totalTests = 0;
                                                let passedTests = 0;

                                                if (isCoding) {
                                                    if (sScore?.testCases && sScore.testCases.total > 0) {
                                                        totalTests = sScore.testCases.total;
                                                        passedTests = sScore.testCases.passed;
                                                    }
                                                    else if (p.codingProblems && p.codingProblems.length > 0) {
                                                        const sectionQuestions = section.questions?.filter((q: any) => q.type === 'coding') || [];
                                                        const matchedProblems = p.codingProblems.filter((prob: any) =>
                                                            sectionQuestions.some((q: any) =>
                                                                (q.problemId && q.problemId === (prob.problemId || prob.questionId)) ||
                                                                (q.id && q.id === (prob.problemId || prob.questionId))
                                                            )
                                                        );
                                                        matchedProblems.forEach((prob: any) => {
                                                            totalTests += (prob.totalTests || 0);
                                                            passedTests += (prob.passedTests || 0);
                                                        });
                                                    }
                                                    if (totalTests === 0 && p.scores?.testCases?.total > 0) {
                                                        totalTests = p.scores.testCases.total;
                                                        passedTests = p.scores.testCases.passed;
                                                    }
                                                }

                                                if (isCoding) {
                                                    return (
                                                        <React.Fragment key={section.id}>
                                                            <td className="py-3 px-4 text-center border-r border-border bg-purple-50/5">
                                                                {sScore ? (
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="font-bold text-purple-700">
                                                                                {sScore.obtainedMarks}
                                                                            </span>
                                                                            <span className="text-muted-foreground text-xs">/ {sScore.totalMarks}</span>
                                                                        </div>
                                                                        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${(sScore.percentage || 0) >= 70 ? 'bg-green-100 text-green-700' :
                                                                            (sScore.percentage || 0) >= 40 ? 'bg-amber-100 text-amber-700' :
                                                                                'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {(Number(sScore.percentage) || 0).toFixed(1)}%
                                                                        </div>
                                                                    </div>
                                                                ) : <span className="text-muted-foreground text-xs">-</span>}
                                                            </td>
                                                            <td className="py-3 px-4 text-center border-r border-border bg-purple-50/10">
                                                                <span className="text-[11px] font-mono text-muted-foreground/80">
                                                                    {sScore?.timeTaken ? formatDuration(sScore.timeTaken) : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center border-r border-border bg-purple-50/10">
                                                                {totalTests > 0 ? (
                                                                    <div className="flex items-center justify-center gap-0.5 text-[13px] font-bold tracking-tight">
                                                                        <span className="text-emerald-600">{passedTests}</span>
                                                                        <span className="text-muted-foreground/30 font-light mx-[1px]">/</span>
                                                                        <span className="text-muted-foreground/80">{totalTests}</span>
                                                                    </div>
                                                                ) : <span className="text-muted-foreground/40 text-[10px] font-mono select-none">- / -</span>}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                }

                                                return (
                                                    <React.Fragment key={section.id}>
                                                        <td className="py-3 px-4 text-center border-r border-border">
                                                            {sScore ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="font-bold text-blue-600">
                                                                            {sScore.obtainedMarks}
                                                                        </span>
                                                                        <span className="text-muted-foreground text-xs">/ {sScore.totalMarks}</span>
                                                                    </div>
                                                                    <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${(sScore.percentage || 0) >= 70 ? 'bg-green-100 text-green-700' :
                                                                        (sScore.percentage || 0) >= 40 ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {(Number(sScore.percentage) || 0).toFixed(1)}%
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center border-r border-border">
                                                            <span className="text-[11px] font-mono text-muted-foreground/80">
                                                                {sScore?.timeTaken ? formatDuration(sScore.timeTaken) : '-'}
                                                            </span>
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}

                                            <td className="py-3 px-2 text-center bg-red-50/20">
                                                {p.plagiarism ? (
                                                    <span className={`font-bold ${p.plagiarism.overallScore > 20 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                        {p.plagiarism.overallScore}%
                                                    </span>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="py-3 px-2 text-center bg-red-50/20">
                                                {p.plagiarism ? (
                                                    <span className={`font-bold ${p.plagiarism.aiConfidence > 50 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                        {p.plagiarism.aiConfidence}%
                                                    </span>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="py-3 px-2 text-center border-r border-border bg-red-50/20">
                                                {(p.plagiarism?.verdict || p.plagiarism?.riskLevel) ? (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${(p.plagiarism.verdict === 'Clean' || p.plagiarism.riskLevel === 'Low') ? 'bg-green-500 text-white' :
                                                        (p.plagiarism.verdict === 'Suspicious' || p.plagiarism.riskLevel === 'Medium') ? 'bg-amber-500 text-white' :
                                                            'bg-red-500 text-white'
                                                        }`}>
                                                        {p.plagiarism.verdict || p.plagiarism.riskLevel}
                                                    </span>
                                                ) : <span className="text-muted-foreground text-[10px]">-</span>}
                                            </td>

                                            <td className="py-3 px-2 text-center bg-green-50/20">
                                                <span className="font-bold text-green-600">
                                                    {p.scores?.totalScore ?? '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center border-r border-border bg-green-50/20">
                                                <span className="text-muted-foreground">
                                                    {p.scores?.maxScore ?? '-'}
                                                </span>
                                                {p.scores?.percentage != null && (
                                                    <span className={`ml-1 text-[10px] font-medium px-1 py-0.5 rounded ${Number(p.scores.percentage) >= 60 ? 'bg-green-100 text-green-700' :
                                                        Number(p.scores.percentage) >= 40 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {Number(p.scores.percentage).toFixed(0)}%
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {p.violations?.totalCount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-amber-600">{p.violations.totalCount}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${getRiskBadge(p.violations.riskLevel)}`}>
                                                            {p.violations.riskLevel}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">None</span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {p.verdict?.status ? (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getVerdictBadge(p.verdict.status)}`}>
                                                        {p.verdict.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right sticky right-0 bg-white dark:bg-card border-l border-border z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        viewReport(p.participantId);
                                                    }}
                                                    className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    View Report
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats Modal */}
            <StatsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                participants={participants}
                stats={stats}
                assessment={assessment}
            />
        </div >
    );
};

export default AssessmentReportsTab;
