// src/views/admin/AdminAssessmentView.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Shield, FileText, Eye,
    Users, BarChart3, Clock, Calendar, CheckCircle,
    Copy, Search, Filter, Download, X
} from 'lucide-react';
import { assessmentService } from '@/api/assessmentService';
import { showToast } from '@/utils/toast';

// We reuse the tab components if they were separate, but since they are in the same file in Organizer,
// I will implement a cleaner version here for Admin.

export default function AdminAssessmentView() {
    const router = useRouter();
    const params = useParams();
    const assessmentId = params?.id as string;

    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'monitoring' | 'reports'>('overview');

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
        }
    }, [assessmentId]);

    const fetchAssessment = async () => {
        setLoading(true);
        try {
            const res = await assessmentService.getAssessment(assessmentId);
            setAssessment(res.data);
        } catch (err) {
            console.error("Failed to fetch assessment", err);
            showToast("Failed to load assessment details.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="p-8 text-center">
                <p className="text-theme-secondary">Assessment not found.</p>
                <button onClick={() => router.push('/admin/dashboard')} className="mt-4 button-theme">Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800">
                        READ-ONLY ACCESS
                    </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(assessment.id);
                            showToast("ID copied to clipboard", "success");
                        }}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                        title="Copy Assessment ID"
                    >
                        <Copy size={16} />
                    </button>
                </div>
            </div>

            {/* Assessment Info */}
            <div className="bg-muted/20 border border-border p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} />
                </div>
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                            <Shield size={24} />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground">{assessment.title}</h1>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">{assessment.description}</p>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-xl border border-border text-sm text-muted-foreground">
                            <Calendar size={14} className="text-primary" />
                            <span>Ends: {new Date(assessment.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-xl border border-border text-sm text-muted-foreground">
                            <Clock size={14} className="text-primary" />
                            <span>Duration: {assessment.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-xl border border-border text-sm text-muted-foreground">
                            <FileText size={14} className="text-primary" />
                            <span>{assessment.totalQuestions || 0} Questions</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border pb-px">
                {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'participants', label: 'Participants', icon: Users },
                    { id: 'monitoring', label: 'Monitoring', icon: Eye },
                    { id: 'reports', label: 'Reports', icon: BarChart3 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative
                            ${activeTab === tab.id
                                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                                : 'text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assessment.sections?.map((section: any, idx: number) => (
                                <div key={section.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs">{idx + 1}</span>
                                            {section.title}
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded uppercase">
                                            {section.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground/70">
                                        <span>{section.questionCount} Questions</span>
                                        <span>•</span>
                                        <span>{section.timeLimit} mins</span>
                                        <span>•</span>
                                        <span className="capitalize">{section.difficulty} difficulty</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {assessment.proctoringSettings?.enabled && (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                                <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4">
                                    <Shield size={18} /> Proctoring Configuration
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(assessment.proctoringSettings).map(([key, value]) => {
                                        if (typeof value !== 'boolean' || !value || key === 'enabled') return null;
                                        return (
                                            <div key={key} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                                                <CheckCircle size={12} />
                                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'monitoring' && (
                    <div className="animate-in fade-in duration-300">
                        <MonitoringTab assessmentId={assessmentId} />
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="animate-in fade-in duration-300">
                        <ReportsTab assessmentId={assessmentId} />
                    </div>
                )}

                {(activeTab === 'participants') && (
                    <div className="animate-in fade-in duration-300">
                        <ParticipantsTab assessmentId={assessmentId} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ========== MONITORING TAB COMPONENT ==========

// ========== MONITORING TAB COMPONENT ==========

function MonitoringTab({ assessmentId }: { assessmentId: string }) {
    const [violations, setViolations] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [vRes, sRes] = await Promise.all([
                    assessmentService.getViolations(assessmentId, { limit: 20 }),
                    assessmentService.getViolationStats(assessmentId)
                ]);
                setViolations(vRes.data.violations || []);
                setStats(sRes.data.stats);
            } catch (err) {
                console.error("Failed to load monitoring data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [assessmentId]);

    if (loading && !stats) return <div className="py-20 text-center text-muted-foreground">Loading live feed...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Violations</p>
                    <p className="text-3xl font-bold text-foreground">{stats?.total || 0}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">High Risk Cases</p>
                    <p className="text-3xl font-bold text-red-500">{stats?.highRiskCount || 0}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Live Feed</p>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        ACTIVE
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border font-bold text-foreground">Recent Activity Feed</div>
                <div className="divide-y divide-border">
                    {violations.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">No violations detected yet. Good sign!</div>
                    ) : (
                        violations.map((v) => (
                            <div key={v.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{v.contestantName}</p>
                                        <p className="text-xs text-red-500 uppercase font-bold">{v.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{new Date(v.timestamp).toLocaleTimeString()}</p>
                                    <p className="text-[10px] text-muted-foreground/60 font-mono">{v.id.substring(0, 8)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ========== PARTICIPANTS TAB COMPONENT ==========

function ParticipantsTab({ assessmentId }: { assessmentId: string }) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

    useEffect(() => {
        fetchParticipants();
    }, [assessmentId, pagination.page]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            // Import invitationService dynamically to avoid circular deps
            const { invitationService } = await import('@/api/invitationService');
            const res = await invitationService.getParticipants(assessmentId, { page: pagination.page, limit: pagination.limit });
            setParticipants(res.data.participants || []);
            if (res.data.pagination) {
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Failed to load participants", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && participants.length === 0) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                    <Users className="text-primary" size={20} />
                    <span className="font-bold text-foreground text-lg">Participants</span>
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-bold">
                        {pagination.total}
                    </span>
                </div>
            </div>

            {participants.length === 0 ? (
                <div className="p-12 text-center">
                    <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground font-medium">No participants have accepted invitations yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4">#</th>
                                <th className="text-left px-6 py-4">Participant</th>
                                <th className="text-left px-6 py-4">Username</th>
                                <th className="text-center px-6 py-4">Invited At</th>
                                <th className="text-center px-6 py-4">Accepted At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {participants.map((p, idx) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-muted-foreground">
                                        {(pagination.page - 1) * pagination.limit + idx + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">
                                                {p.user?.fullName || p.invitationName || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {p.user?.email || p.invitationEmail}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {p.user?.username || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {p.acceptedAt ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold">
                                                <CheckCircle size={12} />
                                                {new Date(p.acceptedAt).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ========== REPORTS TAB COMPONENT ==========

function ReportsTab({ assessmentId }: { assessmentId: string }) {
    const router = useRouter();
    const [participants, setParticipants] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [violationStats, setViolationStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'evaluated'>('all');
    const [search, setSearch] = useState('');
    const [tableFilter, setTableFilter] = useState('');
    const [filterColumn, setFilterColumn] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'totalScore' | 'submittedAt' | 'percentage'>('totalScore');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

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
    }, [assessmentId, filter, sortBy, sortOrder]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params: any = { sortBy, sortOrder };
            if (filter !== 'all') params.status = filter;
            if (search) params.search = search;

            // Try new reports API first
            try {
                const response = await assessmentService.getParticipantReports(assessmentId, params);
                if (response.data) {
                    // Ensure verification data exists by mapping potentially missing fields
                    // Ensure verification data exists by mapping potentially missing fields
                    const participants = (response.data.participants || []).map((p: any) => {
                        const photoUrl = p.verification?.photoUrl || p.contestant?.profilePhotoUrl || p.contestant?.photoUrl || p.profilePhotoUrl || p.user?.profilePhotoUrl;
                        console.log('📸 [Available Photo URL]:', photoUrl, 'for', p.registration?.fullName || p.contestantName);

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
                const fallbackParams = filter !== 'all' ? { status: filter === 'evaluated' ? 'submitted' : filter } : {};
                const response = await assessmentService.getSubmissions(assessmentId, fallbackParams);

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
                            totalScore: sub.totalScore,
                            maxScore: sub.totalMarks,
                            percentage: sub.percentage,
                            sectionScores: sectionScores,
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
                        codingProblems: sub.codingProblems || [],
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
                console.warn('Submissions API also not available:', fallbackErr?.response?.status);
                setParticipants([]);
                setStats({});
                setViolationStats(null);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setParticipants([]);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchReports();
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await assessmentService.exportReports(assessmentId, 'csv');
            const url = window.URL.createObjectURL(new Blob([blob.data as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reports-${assessmentId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast("Export started!", "success");
        } catch (err) {
            console.error('Failed to export reports:', err);
            showToast("Failed to export reports", "error");
        } finally {
            setExporting(false);
        }
    };

    const viewReport = (participantId: string) => {
        router.push(`/admin/assessments/${assessmentId}/reports/${participantId}`);
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
            case 'passed': return 'bg-green-600 text-white';
            case 'failed': return 'bg-red-500 text-white';
            case 'disqualified': return 'bg-red-700 text-white';
            default: return 'bg-amber-500 text-white';
        }
    };

    const getRiskBadge = (level?: string) => {
        switch (level) {
            case 'high': return 'bg-red-100 text-red-600';
            case 'medium': return 'bg-amber-100 text-amber-600';
            default: return 'bg-green-100 text-green-600';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Participants</p>
                    <p className="text-2xl font-black text-foreground">
                        {loading ? '-' : stats?.totalParticipants || 0}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <p className="text-2xl font-black text-green-600">
                        {loading ? '-' : stats?.completed || 0}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">In Progress</p>
                    <p className="text-2xl font-black text-amber-600">
                        {loading ? '-' : stats?.inProgress || 0}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Average Score</p>
                    <p className="text-2xl font-black text-blue-600">
                        {loading ? '-' : stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : '-'}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
                    <p className="text-2xl font-black text-primary">
                        {loading ? '-' : stats?.passRate ? `${stats.passRate.toFixed(1)}%` : '-'}
                    </p>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-bold">Detailed Results</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg overflow-hidden">
                            <select
                                value={filterColumn}
                                onChange={(e) => setFilterColumn(e.target.value)}
                                className="bg-transparent py-2 pl-3 pr-1 text-sm focus:outline-none border-r border-border text-muted-foreground"
                            >
                                {filterableColumns.map((col) => (
                                    <option key={col.key} value={col.key}>{col.label}</option>
                                ))}
                            </select>
                            <div className="relative">
                                <Filter size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={`Filter...`}
                                    value={tableFilter}
                                    onChange={(e) => setTableFilter(e.target.value)}
                                    className="pl-7 pr-3 py-2 bg-transparent text-sm w-32 md:w-40 focus:outline-none"
                                />
                            </div>
                            {tableFilter && (
                                <button onClick={() => setTableFilter('')} className="pr-2 text-muted-foreground hover:text-foreground">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="submitted">Submitted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="evaluated">Evaluated</option>
                        </select>
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field as any);
                                setSortOrder(order as any);
                            }}
                            className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                        >
                            <option value="totalScore-DESC">Highest Score</option>
                            <option value="totalScore-ASC">Lowest Score</option>
                            <option value="submittedAt-DESC">Latest</option>
                            <option value="submittedAt-ASC">Oldest</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={exporting || participants.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            <Download size={16} />
                            {exporting ? 'Exporting...' : 'Export'}
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
                        <p className="text-sm text-muted-foreground">No reports available</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">#</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Participant</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Department</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Time</th>
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-blue-600 border-r border-border bg-blue-50/50" colSpan={2}>MCQ</th>
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-purple-600 border-r border-border bg-purple-50/50" colSpan={3}>Coding</th>
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-red-600 border-r border-border bg-red-50/50" colSpan={3}>Plagiarism</th>
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-green-600 border-r border-border bg-green-50/50" colSpan={2}>Total</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Violations</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Verdict</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</th>
                                </tr>
                                <tr className="bg-muted/30 border-b border-border">
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-blue-50/30">Scored</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-blue-50/30">Max</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-purple-50/30">Scored</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-purple-50/30">Max</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-purple-50/30">Cases</th>

                                    {/* Plagiarism Sub-headers */}
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-red-50/30">Sim %</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-red-50/30">AI %</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-red-50/30">Risk</th>

                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground bg-green-50/30">Scored</th>
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-green-50/30">Max</th>
                                    <th className="border-r border-border"></th>
                                    <th className="border-r border-border"></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {participants
                                    .filter((p) => {
                                        if (!tableFilter.trim()) return true;
                                        const searchLower = tableFilter.toLowerCase();
                                        const columnValues: Record<string, string> = {
                                            name: (p.registration?.fullName || '').toLowerCase(),
                                            email: (p.registration?.email || '').toLowerCase(),
                                            department: (p.registration?.department || '').toLowerCase(),
                                            college: (p.registration?.college || '').toLowerCase(),
                                            status: (p.session?.status || '').toLowerCase().replace('_', ' '),
                                            plagiarism: String(p.plagiarism?.overallScore || ''),
                                            aiConfidence: String(p.plagiarism?.aiConfidence || ''),
                                            totalScore: String(p.scores?.totalScore || ''),
                                            percentage: String(p.scores?.percentage || ''),
                                            violations: String(p.violations?.totalCount || 0),
                                            verdict: (p.verdict?.status || '').toLowerCase(),
                                        };
                                        if (filterColumn === 'all') {
                                            return Object.values(columnValues).some(val => val.includes(searchLower));
                                        } else {
                                            return columnValues[filterColumn]?.includes(searchLower) || false;
                                        }
                                    })
                                    .map((p, index) => {
                                        const mcqSections = p.scores?.sectionScores?.filter((s: any) =>
                                            ['mcq', 'aptitude', 'quiz', 'multiple_choice'].includes(s.sectionType?.toLowerCase())
                                        ) || [];
                                        const codingSections = p.scores?.sectionScores?.filter((s: any) =>
                                            ['coding', 'programming'].includes(s.sectionType?.toLowerCase())
                                        ) || [];

                                        const mcqObtained = mcqSections.reduce((sum: number, s: any) => sum + (s.obtainedMarks || 0), 0);
                                        const mcqTotal = mcqSections.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0);
                                        const codingObtained = codingSections.reduce((sum: number, s: any) => sum + (s.obtainedMarks || 0), 0);
                                        const codingTotal = codingSections.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0);

                                        let totalCodingTests = 0;
                                        let passedCodingTests = 0;
                                        if (p.codingProblems && p.codingProblems.length > 0) {
                                            p.codingProblems.forEach((prob: any) => {
                                                totalCodingTests += (prob.totalTests || 0);
                                                passedCodingTests += (prob.passedTests || 0);
                                            });
                                        }

                                        return (
                                            <tr key={p.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => viewReport(p.participantId)}>
                                                <td className="py-3 px-4 text-sm font-medium border-r border-border">{index + 1}</td>
                                                <td className="py-3 px-4 border-r border-border">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar / Photo */}
                                                        {p.verification?.photoUrl ? (
                                                            <img
                                                                src={p.verification.photoUrl}
                                                                alt="User"
                                                                className="w-9 h-9 rounded-full object-cover border border-border shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                                                                {p.registration?.fullName?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-foreground">{p.registration?.fullName || 'Unknown'}</p>
                                                            <p className="text-xs text-muted-foreground">{p.registration?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 border-r border-border">
                                                    <div>
                                                        <p className="font-medium text-foreground text-xs">{p.registration?.department || '-'}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={p.registration?.college}>{p.registration?.college || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 border-r border-border">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusBadge(p.session?.status)}`}>{p.session?.status?.replace('_', ' ') || '-'}</span>
                                                </td>
                                                <td className="py-3 px-4 border-r border-border">
                                                    <span className="text-sm font-mono text-muted-foreground">{formatDuration(p.session?.totalTimeTaken)}</span>
                                                </td>
                                                <td className="py-3 px-2 text-center bg-blue-50/20"><span className={`font-bold ${mcqTotal > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>{mcqTotal > 0 ? mcqObtained : '-'}</span></td>
                                                <td className="py-3 px-2 text-center border-r border-border bg-blue-50/20"><span className="text-muted-foreground">{mcqTotal > 0 ? mcqTotal : '-'}</span></td>
                                                <td className="py-3 px-2 text-center bg-purple-50/20"><span className={`font-bold ${codingTotal > 0 ? 'text-purple-600' : 'text-muted-foreground'}`}>{codingTotal > 0 ? codingObtained : '-'}</span></td>
                                                <td className="py-3 px-2 text-center bg-purple-50/20"><span className="text-muted-foreground">{codingTotal > 0 ? codingTotal : '-'}</span></td>
                                                <td className="py-3 px-2 text-center border-r border-border bg-purple-50/20">
                                                    {totalCodingTests > 0 ? (
                                                        <span className="text-xs font-medium text-muted-foreground"><span className="text-green-600 font-bold">{passedCodingTests}</span><span className="mx-0.5">/</span><span>{totalCodingTests}</span></span>
                                                    ) : <span className="text-xs text-muted-foreground">-</span>}
                                                </td>

                                                {/* Plagiarism: Similarity */}
                                                <td className="py-3 px-2 text-center bg-red-50/20">
                                                    {p.plagiarism ? (
                                                        <span className={`font-bold ${p.plagiarism.overallScore > 20 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                            {p.plagiarism.overallScore}%
                                                        </span>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </td>
                                                {/* Plagiarism: AI */}
                                                <td className="py-3 px-2 text-center bg-red-50/20">
                                                    {p.plagiarism ? (
                                                        <span className={`font-bold ${p.plagiarism.aiConfidence > 50 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                                            {p.plagiarism.aiConfidence}%
                                                        </span>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </td>
                                                {/* Plagiarism: Risk */}
                                                <td className="py-3 px-2 text-center border-r border-border bg-red-50/20">
                                                    {p.plagiarism?.riskLevel ? (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${p.plagiarism.riskLevel === 'High' ? 'bg-red-500 text-white' :
                                                            p.plagiarism.riskLevel === 'Medium' ? 'bg-amber-500 text-white' :
                                                                'bg-green-500 text-white'
                                                            }`}>
                                                            {p.plagiarism.riskLevel}
                                                        </span>
                                                    ) : <span className="text-muted-foreground text-[10px]">-</span>}
                                                </td>

                                                <td className="py-3 px-2 text-center bg-green-50/20"><span className="font-bold text-green-600">{p.scores?.totalScore ?? '-'}</span></td>
                                                <td className="py-3 px-2 text-center border-r border-border bg-green-50/20">
                                                    <span className="text-muted-foreground">{p.scores?.maxScore ?? '-'}</span>
                                                    {p.scores?.percentage != null && (
                                                        <span className={`ml-1 text-[10px] font-medium px-1 py-0.5 rounded ${Number(p.scores.percentage) >= 60 ? 'bg-green-100 text-green-700' : Number(p.scores.percentage) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                            {Number(p.scores.percentage).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {p.violations?.totalCount > 0 ? (
                                                        <div className="flex items-center gap-2"><span className="text-sm font-bold text-amber-600">{p.violations.totalCount}</span><span className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${getRiskBadge(p.violations.riskLevel)}`}>{p.violations.riskLevel}</span></div>
                                                    ) : <span className="text-xs text-muted-foreground">None</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {p.verdict?.status ? <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getVerdictBadge(p.verdict.status)}`}>{p.verdict.status}</span> : <span className="text-xs text-muted-foreground">-</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); viewReport(p.participantId); }} className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition-colors">View Report</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

