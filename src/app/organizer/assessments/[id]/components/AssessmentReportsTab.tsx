"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    SlidersHorizontal,
    Search,
    X,
    Download,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Maximize2,
    Minimize2,
    TrendingUp,
    Award
} from 'lucide-react';
import ReportsFilterModal from './ReportsFilterModal';
import StatsModal from './StatsModal';
import { assessmentService } from '@/api/assessmentService';
import { submissionService } from '@/api/submissionService';

// Extract needed types from the parent or redefine
interface AssessmentDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    duration: number;
    sections: any[];
    [key: string]: any;
}

interface AssessmentReportsTabProps {
    assessmentId: string;
    assessment: AssessmentDetail;
}

const AssessmentReportsTab = ({ assessmentId, assessment }: AssessmentReportsTabProps) => {
    const router = useRouter();
    const [participants, setParticipants] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [violationStats, setViolationStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'evaluated'>('all'); // Legacy simple filter
    const [search, setSearch] = useState('');


    // Advanced Filters State
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<any>({
        statuses: [],
        minScore: '',
        maxScore: '',
        dateRange: 'all',
        department: '',
        college: '',
        plagiarismRisk: []
    });
    const [tableFilter, setTableFilter] = useState(''); // Local filter for table rows
    const [filterColumn, setFilterColumn] = useState<string>('all'); // Column to filter by
    const [sortBy, setSortBy] = useState<'name' | 'department' | 'totalTime' | 'totalScore' | 'submittedAt' | 'percentage' | 'mcqScore' | 'codingScore' | 'testCases' | 'plagiarismScore' | 'aiConfidence' | 'plagiarismRisk'>('totalScore');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Define filterable columns
    const filterableColumns = [
        { key: 'all', label: 'All Columns' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'department', label: 'Department' },
        { key: 'college', label: 'College' },
        { key: 'status', label: 'Status' },
        { key: 'plagiarism', label: 'Plagiarism Score' },
        { key: 'aiConfidence', label: 'AI Confidence' },
        { key: 'mcqScore', label: 'MCQ Score' },
        { key: 'codingScore', label: 'Coding Score' },
        { key: 'totalScore', label: 'Total Score' },
        { key: 'percentage', label: 'Percentage' },
        { key: 'violations', label: 'Violations' },
        { key: 'verdict', label: 'Verdict' },
        { key: 'rank', label: 'Rank' },
    ];

    useEffect(() => {
        fetchReports();
    }, [assessmentId]);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing reports data...');
            fetchReports();
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [assessmentId, autoRefresh]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params: any = { sortBy: 'totalScore', sortOrder: 'DESC' };
            // Try new reports API first
            try {
                const response = await assessmentService.getParticipantReports(assessmentId, params);
                if (response.data) {
                    const participants = (response.data.participants || []).map((p: any) => {
                        const photoUrl = p.verification?.photoUrl || p.contestant?.profilePhotoUrl || p.contestant?.photoUrl || p.profilePhotoUrl || p.user?.profilePhotoUrl;

                        return {
                            ...p,
                            verification: {
                                ...p.verification,
                                photoUrl: photoUrl,
                                photoThumbnailUrl: p.verification?.photoThumbnailUrl || p.contestant?.photoThumbnailUrl
                            }
                        };
                    });
                    setParticipants(participants);
                    setStats(response.data.stats || {
                        totalParticipants: 0,
                        completed: 0,
                        inProgress: 0,
                        notStarted: 0,
                        averageScore: 0,
                        highestScore: 0,
                        lowestScore: 0,
                        passRate: 0
                    });
                    setViolationStats(response.data.violationStats || null);
                    return;
                }
            } catch (apiErr: any) {
                console.warn('New reports API not available, falling back to submissions API:', apiErr?.response?.status);
            }

            // Fallback to existing submissions API
            try {
                const response = await submissionService.getAllSubmissions(assessmentId, 1, 1000);
                const submissions = response.data.submissions || [];
                const transformedParticipants = submissions.map((sub: any) => {
                    const sectionScores = (sub.sections || sub.sectionScores || []).map((s: any) => ({
                        sectionId: s.sectionId || s.id,
                        sectionTitle: s.sectionTitle || s.title || 'Section',
                        sectionType: s.sectionType || s.type || 'mcq',
                        obtainedMarks: s.obtainedMarks || s.score || s.obtained || 0,
                        totalMarks: s.totalMarks || s.maxScore || s.total || 0,
                        percentage: s.percentage || 0,
                        correctAnswers: s.correctAnswers,
                        wrongAnswers: s.wrongAnswers,
                        unattempted: s.unattempted,
                        testCases: s.testCases || s.testcaseResults || {
                            passed: s.passedTests || s.passed || 0,
                            total: s.totalTests || s.total || 0
                        },
                        timeTaken: s.timeTaken || 0 // Added timeTaken field
                    }));

                    return {
                        id: sub.id,
                        participantId: sub.contestantId || sub.id,
                        registration: {
                            fullName: sub.contestantName || 'Unknown',
                            email: sub.contestantEmail || '',
                            department: sub.department || sub.contestantDepartment || '',
                            college: sub.college || sub.contestantCollege || ''
                        },
                        session: {
                            id: sub.id,
                            status: sub.status === 'submitted' ? 'completed' : sub.status,
                            startedAt: sub.startedAt,
                            submittedAt: sub.submittedAt,
                            totalTimeTaken: sub.timeTaken,
                        },
                        verification: {
                            photoUrl: sub.contestant?.profilePhotoUrl || sub.contestant?.photoUrl || sub.profilePhotoUrl,
                            photoThumbnailUrl: sub.contestant?.photoThumbnailUrl,
                        },
                        scores: {
                            totalScore: sub.totalScore || sub.score || 0,
                            maxScore: sub.totalMarks || sub.maxScore || 0,
                            percentage: sub.percentage || 0,
                            sectionScores: sectionScores,
                            testCases: sub.testCases || sub.testcaseResults || {
                                passed: sub.passedTests || 0,
                                total: sub.totalTests || 0
                            }
                        },
                        violations: {
                            totalCount: 0,
                            byType: {},
                            riskLevel: 'low' as const,
                        },
                        verdict: {
                            status: 'pending' as const,
                            finalScore: sub.totalScore || 0,
                        },
                        codingProblems: sub.codingProblems || sub.submissions || [],
                    };
                });

                setParticipants(transformedParticipants);
                setStats({
                    totalParticipants: response.data.stats?.totalParticipants || 0,
                    completed: response.data.stats?.submitted || 0,
                    inProgress: response.data.stats?.inProgress || 0,
                    notStarted: 0,
                    averageScore: response.data.stats?.averagePercentage || 0,
                    highestScore: response.data.stats?.highestScore || 0,
                    lowestScore: response.data.stats?.lowestScore || 0,
                    passRate: response.data.stats?.passRate || 0,
                });
                setViolationStats(null);
            } catch (fallbackErr: any) {
                setParticipants([]);
                setStats({
                    totalParticipants: 0,
                    completed: 0,
                    inProgress: 0,
                    notStarted: 0,
                    averageScore: 0,
                    passRate: 0
                });
                setViolationStats(null);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setParticipants([]);
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await assessmentService.exportReports(assessmentId, 'csv');
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${assessment.title.replace(/\s+/g, '_')}_reports.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to export reports:', err);
            alert('Failed to export reports');
        } finally {
            setExporting(false);
        }
    };

    const viewReport = (participantId: string) => {
        router.push(`/organizer/assessments/${assessmentId}/reports/${participantId}`);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
            case 'submitted':
                return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'evaluated':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'in_progress':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'not_started':
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getVerdictBadge = (status?: string) => {
        switch (status) {
            case 'passed':
                return 'bg-green-600 text-white';
            case 'failed':
                return 'bg-red-500 text-white';
            case 'disqualified':
                return 'bg-red-700 text-white';
            default:
                return 'bg-amber-500 text-white';
        }
    };

    const getRiskBadge = (level?: string) => {
        switch (level) {
            case 'high':
                return 'bg-red-100 text-red-600';
            case 'medium':
                return 'bg-amber-100 text-amber-600';
            default:
                return 'bg-green-100 text-green-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Stats Summary */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-2 rounded-lg border border-border">
                <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto px-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-background rounded-md border border-border shadow-sm">
                            <BarChart3 size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Total</span>
                            <span className="text-sm font-bold leading-none">{loading ? '-' : stats?.totalParticipants || 0}</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border flex-shrink-0" />

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-background rounded-md border border-border shadow-sm">
                            <span className="text-[10px] font-black text-green-600">✓</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Completed</span>
                            <span className="text-sm font-bold leading-none text-green-600">{loading ? '-' : stats?.completed || 0}</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border flex-shrink-0" />

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-background rounded-md border border-border shadow-sm">
                            <TrendingUp size={14} className="text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Avg Score</span>
                            <span className="text-sm font-bold leading-none text-primary">{loading ? '-' : stats?.averageScore ? `${stats.averageScore.toFixed(0)}%` : '-'}</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border flex-shrink-0" />

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-background rounded-md border border-border shadow-sm">
                            <Award size={14} className="text-amber-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Pass Rate</span>
                            <span className="text-sm font-bold leading-none text-amber-600">{loading ? '-' : stats?.passRate ? `${stats.passRate.toFixed(0)}%` : '-'}</span>
                        </div>
                    </div>
                </div>

                {violationStats && violationStats.totalViolations > 0 && (
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <div className="flex items-center gap-3 text-xs">
                            <span className="font-medium text-amber-800 dark:text-amber-300">
                                <strong>{violationStats.totalViolations}</strong> Violations
                            </span>
                            {violationStats.highRiskCount > 0 && (
                                <span className="font-bold text-red-600 bg-white dark:bg-black/20 px-1.5 rounded">
                                    {violationStats.highRiskCount} High Risk
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className={`bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] rounded-none flex flex-col' : ''}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            Participant Reports
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{participants.length}</span>
                        </h3>
                        {lastUpdated && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                                <button
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${autoRefresh
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {autoRefresh ? '🔄 Auto-refresh ON' : 'Auto-refresh OFF'}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">

                        {/* Advanced Filter Button */}
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${Object.values(advancedFilters).some((v: any) => Array.isArray(v) ? v.length > 0 : !!v) && advancedFilters.dateRange !== 'all'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-background border-border hover:bg-muted'
                                }`}
                        >
                            <SlidersHorizontal size={16} />
                            Filters
                        </button>

                        <ReportsFilterModal
                            isOpen={showFilterModal}
                            onClose={() => setShowFilterModal(false)}
                            currentFilters={advancedFilters}
                            onApply={setAdvancedFilters}
                            departments={Array.from(new Set(participants.map(p => p.registration?.department).filter(Boolean)))}
                            colleges={Array.from(new Set(participants.map(p => p.registration?.college).filter(Boolean)))}
                        />

                        {/* Column Filter Dropdown + Input */}
                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg overflow-hidden flex-1 max-w-sm ml-auto">
                            <select
                                value={filterColumn}
                                onChange={(e) => setFilterColumn(e.target.value)}
                                className="bg-muted/30 py-2 pl-3 pr-2 text-sm focus:outline-none border-r border-border text-muted-foreground font-medium"
                            >
                                {filterableColumns.map((col) => (
                                    <option key={col.key} value={col.key}>
                                        {col.key === 'all' ? 'All Fields' : col.label}
                                    </option>
                                ))}
                            </select>
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={`Search...`}
                                    value={tableFilter}
                                    onChange={(e) => setTableFilter(e.target.value)}
                                    className="pl-8 pr-3 py-2 bg-transparent text-sm w-full focus:outline-none"
                                />
                            </div>
                            {tableFilter && (
                                <button
                                    onClick={() => setTableFilter('')}
                                    className="pr-2 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowStatsModal(true)}
                            disabled={participants.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                            <BarChart3 size={16} />
                            Stats
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={exporting || participants.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            <Download size={16} />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>

                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 hover:bg-muted rounded-lg border border-border transition-colors text-muted-foreground hover:text-foreground"
                            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading reports...</p>
                    </div>
                ) : participants.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border m-4 rounded-xl">
                        <BarChart3 size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">No participants yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Reports will appear here once contestants complete the assessment
                        </p>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1 w-full">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[50px]">#</th>

                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[280px] cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center gap-1">
                                            Participant
                                            <div className="flex flex-col">
                                                <ArrowUp size={10} className={sortBy === 'name' && sortOrder === 'ASC' ? 'text-primary' : 'text-muted-foreground/30'} />
                                                <ArrowDown size={10} className={sortBy === 'name' && sortOrder === 'DESC' ? 'text-primary' : 'text-muted-foreground/30'} />
                                            </div>
                                        </div>
                                    </th>

                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[150px]">Dept / College</th>

                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[120px]">Status</th>

                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[100px] cursor-pointer hover:bg-muted/80"
                                        onClick={() => { setSortBy('totalTime' as any); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center gap-1">
                                            Time
                                            <div className="flex flex-col">
                                                <ArrowUp size={10} className={sortBy === 'totalTime' as any && sortOrder === 'ASC' ? 'text-primary' : 'text-muted-foreground/30'} />
                                                <ArrowDown size={10} className={sortBy === 'totalTime' as any && sortOrder === 'DESC' ? 'text-primary' : 'text-muted-foreground/30'} />
                                            </div>
                                        </div>
                                    </th>

                                    {assessment?.sections?.map((section: any) => {
                                        if (section.type === 'coding') {
                                            return (
                                                <React.Fragment key={section.id}>
                                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider border-r border-border bg-purple-50/20 min-w-[80px]" rowSpan={2}>
                                                        {section.title} <span className="text-[10px] text-purple-600 block">Score</span>
                                                    </th>
                                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider border-r border-border bg-purple-50/20 min-w-[80px]" rowSpan={2}>
                                                        {section.title} <span className="text-[10px] text-purple-600 block">Time</span>
                                                    </th>
                                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider border-r border-border bg-purple-50/20 min-w-[80px]" rowSpan={2}>
                                                        {section.title} <span className="text-[10px] text-purple-600 block">Tests</span>
                                                    </th>
                                                </React.Fragment>
                                            );
                                        }
                                        return (
                                            <React.Fragment key={section.id}>
                                                <th className="text-center py-3 px-3 text-xs font-bold uppercase tracking-wider border-r border-border bg-muted/20 min-w-[100px]" rowSpan={2}>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span>{section.title}</span>
                                                        <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] border bg-blue-100/50 text-blue-700 border-blue-200">
                                                            Score
                                                        </span>
                                                    </div>
                                                </th>
                                                <th className="text-center py-3 px-3 text-xs font-bold uppercase tracking-wider border-r border-border bg-muted/20 min-w-[90px]" rowSpan={2}>
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span>{section.title}</span>
                                                        <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] border bg-gray-100 text-gray-700 border-gray-200">
                                                            Time
                                                        </span>
                                                    </div>
                                                </th>
                                            </React.Fragment>
                                        );
                                    })}
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-red-600 border-r border-border bg-red-50/50" colSpan={3}>Plagiarism</th>

                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-green-600 border-r border-border bg-green-50/50 cursor-pointer hover:bg-green-100/50 transition-colors" colSpan={2}
                                        onClick={() => { setSortBy('totalScore'); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Total
                                            <div className="flex flex-col">
                                                <ArrowUp size={10} className={sortBy === 'totalScore' && sortOrder === 'ASC' ? 'text-green-600' : 'text-green-600/30'} />
                                                <ArrowDown size={10} className={sortBy === 'totalScore' && sortOrder === 'DESC' ? 'text-green-600' : 'text-green-600/30'} />
                                            </div>
                                        </div>
                                    </th>

                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[140px]">Violations</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border min-w-[100px]">Verdict</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground sticky right-0 bg-muted/90 backdrop-blur-sm shadow-sm z-20">Action</th>
                                </tr>
                                <tr className="bg-muted/30 border-b border-border">
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    {/* Plagiarism Sub-headers */}
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-red-50/30 cursor-pointer hover:bg-red-100/50 transition-colors"
                                        onClick={() => { setSortBy('plagiarismScore'); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Sim %
                                            <div className="flex flex-col">
                                                <ArrowUp size={8} className={sortBy === 'plagiarismScore' && sortOrder === 'ASC' ? 'text-red-600' : 'text-red-600/30'} />
                                                <ArrowDown size={8} className={sortBy === 'plagiarismScore' && sortOrder === 'DESC' ? 'text-red-600' : 'text-red-600/30'} />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-red-50/30 cursor-pointer hover:bg-red-100/50 transition-colors"
                                        onClick={() => { setSortBy('aiConfidence'); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            AI %
                                            <div className="flex flex-col">
                                                <ArrowUp size={8} className={sortBy === 'aiConfidence' && sortOrder === 'ASC' ? 'text-red-600' : 'text-red-600/30'} />
                                                <ArrowDown size={8} className={sortBy === 'aiConfidence' && sortOrder === 'DESC' ? 'text-red-600' : 'text-red-600/30'} />
                                            </div>
                                        </div>
                                    </th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-red-50/30 cursor-pointer hover:bg-red-100/50 transition-colors"
                                        onClick={() => { setSortBy('plagiarismRisk'); setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC'); }}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Verdict
                                            <div className="flex flex-col">
                                                <ArrowUp size={8} className={sortBy === 'plagiarismRisk' && sortOrder === 'ASC' ? 'text-red-600' : 'text-red-600/30'} />
                                                <ArrowDown size={8} className={sortBy === 'plagiarismRisk' && sortOrder === 'DESC' ? 'text-red-600' : 'text-red-600/30'} />
                                            </div>
                                        </div>
                                    </th>

                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-green-50/30">Scored</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-green-50/30">Max</th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {participants
                                    .map(p => {
                                        const mcqSections = p.scores?.sectionScores?.filter((s: any) =>
                                            ['mcq', 'aptitude', 'quiz', 'multiple_choice', 'objective'].includes(s.sectionType?.toLowerCase())
                                        ) || [];
                                        const codingSections = p.scores?.sectionScores?.filter((s: any) =>
                                            ['coding', 'programming', 'code'].includes(s.sectionType?.toLowerCase())
                                        ) || [];
                                        const mcqObtained = mcqSections.reduce((sum: number, s: any) => sum + (s.obtainedMarks || s.scored || s.score || 0), 0);
                                        const mcqTotal = mcqSections.reduce((sum: number, s: any) => sum + (s.totalMarks || s.maxScore || s.total || 0), 0);
                                        const codingObtained = codingSections.reduce((sum: number, s: any) => sum + (s.obtainedMarks || s.scored || s.score || 0), 0);
                                        const codingTotal = codingSections.reduce((sum: number, s: any) => sum + (s.totalMarks || s.maxScore || s.total || 0), 0);

                                        let totalCodingTests = 0;
                                        let passedCodingTests = 0;
                                        if (p.codingProblems && p.codingProblems.length > 0) {
                                            p.codingProblems.forEach((prob: any) => {
                                                totalCodingTests += (prob.totalTests || 0);
                                                passedCodingTests += (prob.passedTests || 0);
                                            });
                                        }

                                        return {
                                            ...p,
                                            derived: {
                                                mcqObtained, mcqTotal,
                                                codingObtained, codingTotal,
                                                totalCodingTests, passedCodingTests
                                            }
                                        };
                                    })
                                    .filter((p) => {
                                        let textMatch = true;
                                        if (tableFilter.trim()) {
                                            const searchLower = tableFilter.toLowerCase();
                                            const columnValues: Record<string, string> = {
                                                name: (p.registration?.fullName || '').toLowerCase(),
                                                email: (p.registration?.email || '').toLowerCase(),
                                                department: (p.registration?.department || '').toLowerCase(),
                                                college: (p.registration?.college || '').toLowerCase(),
                                                status: (p.session?.status || '').toLowerCase().replace('_', ' '),
                                                plagiarism: String(p.plagiarism?.overallScore || ''),
                                                aiConfidence: String(p.plagiarism?.aiConfidence || ''),
                                                mcqScore: String(p.derived.mcqObtained),
                                                codingScore: String(p.derived.codingObtained),
                                                totalScore: String(p.scores?.totalScore || ''),
                                                percentage: String(p.scores?.percentage || ''),
                                                violations: String(p.violations?.totalCount || 0),
                                                verdict: (p.verdict?.status || '').toLowerCase(),
                                                rank: String(p.scores?.rank || ''),
                                            };
                                            if (filterColumn === 'all') {
                                                textMatch = Object.values(columnValues).some(val => val.includes(searchLower));
                                            } else {
                                                textMatch = columnValues[filterColumn]?.includes(searchLower) || false;
                                            }
                                        }
                                        if (!textMatch) return false;

                                        if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(p.session?.status)) return false;
                                        if (advancedFilters.minScore !== '' && (Number(p.scores?.percentage || 0) < Number(advancedFilters.minScore))) return false;
                                        if (advancedFilters.maxScore !== '' && (Number(p.scores?.percentage || 0) > Number(advancedFilters.maxScore))) return false;
                                        if (advancedFilters.department && !p.registration?.department?.toLowerCase().includes(advancedFilters.department.toLowerCase())) return false;
                                        if (advancedFilters.college && !p.registration?.college?.toLowerCase().includes(advancedFilters.college.toLowerCase())) return false;
                                        if (advancedFilters.plagiarismRisk.length > 0 && !advancedFilters.plagiarismRisk.includes(p.plagiarism?.riskLevel)) return false;

                                        if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
                                            const dateStr = p.session?.submittedAt || p.session?.startedAt;
                                            if (!dateStr) return false;
                                            const date = new Date(dateStr);
                                            const now = new Date();
                                            const diffTime = Math.abs(now.getTime() - date.getTime());
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            if (advancedFilters.dateRange === 'today' && diffDays > 1) return false;
                                            if (advancedFilters.dateRange === 'week' && diffDays > 7) return false;
                                            if (advancedFilters.dateRange === 'month' && diffDays > 30) return false;
                                        }

                                        return true;
                                    })
                                    .sort((a, b) => {
                                        let valA: any = '';
                                        let valB: any = '';

                                        switch (sortBy) {
                                            case 'name':
                                                valA = a.registration?.fullName || '';
                                                valB = b.registration?.fullName || '';
                                                break;
                                            case 'department':
                                                valA = a.registration?.department || '';
                                                valB = b.registration?.department || '';
                                                break;
                                            case 'totalTime' as any:
                                                valA = a.session?.totalTimeTaken || 0;
                                                valB = b.session?.totalTimeTaken || 0;
                                                break;
                                            case 'totalScore':
                                                valA = a.scores?.totalScore || 0;
                                                valB = b.scores?.totalScore || 0;
                                                break;
                                            case 'mcqScore':
                                                valA = a.derived.mcqObtained || 0;
                                                valB = b.derived.mcqObtained || 0;
                                                break;
                                            case 'codingScore':
                                                valA = a.derived.codingObtained || 0;
                                                valB = b.derived.codingObtained || 0;
                                                break;
                                            case 'testCases':
                                                valA = a.derived.passedCodingTests || 0;
                                                valB = b.derived.passedCodingTests || 0;
                                                break;
                                            case 'plagiarismScore':
                                                valA = a.plagiarism?.overallScore || 0;
                                                valB = b.plagiarism?.overallScore || 0;
                                                break;
                                            case 'aiConfidence':
                                                valA = a.plagiarism?.aiConfidence || 0;
                                                valB = b.plagiarism?.aiConfidence || 0;
                                                break;
                                            case 'plagiarismRisk': {
                                                const riskMap: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
                                                valA = riskMap[a.plagiarism?.riskLevel] || 0;
                                                valB = riskMap[b.plagiarism?.riskLevel] || 0;
                                                break;
                                            }
                                            default:
                                                valA = a.scores?.totalScore || 0;
                                                valB = b.scores?.totalScore || 0;
                                        }

                                        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
                                        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
                                        return 0;
                                    })
                                    .map((p, index) => {
                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-muted/30 cursor-pointer transition-colors"
                                                onClick={() => viewReport(p.participantId)}
                                            >
                                                <td className="py-3 px-4 text-sm font-medium border-r border-border whitespace-nowrap">
                                                    {p.scores?.rank || index + 1}
                                                </td>
                                                <td className="py-4 px-4 border-r border-border">
                                                    <div className="flex items-center gap-4">
                                                        {p.verification?.photoUrl ? (
                                                            <div className="relative group">
                                                                <img
                                                                    src={p.verification.photoUrl}
                                                                    alt="User"
                                                                    className="w-10 h-10 rounded-full object-cover border border-border shadow-sm"
                                                                />
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
                                                <td className="py-3 px-4 border-r border-border whitespace-nowrap">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusBadge(p.session?.status)}`}>
                                                        {p.session?.status?.replace('_', ' ') || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 border-r border-border whitespace-nowrap">
                                                    <span className="text-sm font-mono text-muted-foreground">
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
