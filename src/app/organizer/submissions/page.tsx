'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submissionService } from "@/api/submissionService";
import type {
    DashboardMetrics,
    LeaderboardEntry,
    SubmissionResponse
} from "@/api/submissionService";
import { contestService } from "@/api/contestService";
import {
    TrendingUp, Users, Award, Code, CheckCircle, Edit, Sparkles, RefreshCw, Download, Search, Eye, ChevronLeft, ChevronRight, Calendar, Trash2
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { toast } from "react-toastify";
import Loader from "@/components/Loader";

interface Contest {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    registrationCount?: number;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    bgClass?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon,
    trend,
    bgClass,
}) => (
    <div className="relative overflow-hidden rounded-2xl border border-theme bg-theme-secondary p-5 shadow-lg flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
        <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-theme-secondary/80">{title}</p>
                <div className="text-3xl font-bold text-theme-primary">{value}</div>
            </div>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-inner ${bgClass ? bgClass : 'bg-theme-primary'}`}>
                <span className={bgClass ? 'text-white' : 'text-theme-accent'}>
                    {icon}
                </span>
            </div>
        </div>
        {trend && (
            <p className="text-xs font-medium text-theme-secondary/80">{trend}</p>
        )}
    </div>
);

interface EditModalProps {
    entry: LeaderboardEntry;
    contestId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const EditLeaderboardModal: React.FC<EditModalProps> = ({ entry, contestId, onClose, onSuccess }) => {
    const [pointsAdjustment, setPointsAdjustment] = useState(0);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submissionService.editLeaderboardEntry(contestId, entry.userId, { pointsAdjustment, reason });
            toast.success("Leaderboard entry updated!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-theme-secondary rounded-2xl shadow-2xl max-w-md w-full p-6 border border-theme">
                <h2 className="text-2xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                    <Edit size={24} className="text-theme-accent" />
                    Edit Leaderboard Entry
                </h2>
                <div className="mb-4 p-4 bg-theme-tertiary rounded-lg border border-theme">
                    <p className="text-sm text-theme-secondary"><strong>User:</strong> {entry.username}</p>
                    <p className="text-sm text-theme-secondary"><strong>Current Points:</strong> {entry.points}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Points Adjustment</label>
                        <input
                            type="number"
                            value={pointsAdjustment}
                            onChange={(e) => setPointsAdjustment(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-theme bg-theme-tertiary text-theme-primary focus:ring-2 focus:ring-theme-accent"
                            placeholder="Enter adjustment value"
                            required
                        />
                        <p className="text-xs text-theme-secondary mt-1">New Total: {(entry.points || 0) + pointsAdjustment}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-2">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-theme bg-theme-tertiary text-theme-primary focus:ring-2 focus:ring-theme-accent"
                            rows={3}
                            placeholder="Explain the reason for adjustment..."
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-theme text-theme-primary hover:bg-theme-tertiary transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-lg button-theme text-theme-primary disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function OrganizerSubmissions() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'contests'>('overview');
    const [contests, setContests] = useState<Contest[]>([]);
    const [selectedContest, setSelectedContest] = useState<string>("all");
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
    const [submissionsPage, setSubmissionsPage] = useState(1);
    const [submissionsTotal, setSubmissionsTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [languageFilter, setLanguageFilter] = useState<string>("");
    const [usernameSearch, setUsernameSearch] = useState<string>("");
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);

    const fetchContests = async () => {
        try {
            const response = await contestService.getCreatedContests();
            setContests(response.data || []);
        } catch (error) {
            console.error("Failed to load contests", error);
        }
    };

    const fetchMetrics = async () => {
        try {
            const contestId = selectedContest === "all" ? undefined : selectedContest;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await submissionService.getDashboardMetrics(contestId as string) as any;
            setMetrics(response.data.data);
        } catch (error: any) {
            console.error("Failed to load metrics:", error);
        }
    };

    const fetchLeaderboard = async () => {
        if (selectedContest === "all") {
            setLeaderboard([]);
            return;
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await submissionService.getContestLeaderboard(selectedContest, 1, 50) as any;
            setLeaderboard(response.data.leaderboard || []);
        } catch (error: any) {
            console.error("Failed to load leaderboard:", error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filters: any = {};
            if (statusFilter) filters.status = statusFilter;
            if (languageFilter) filters.language = languageFilter;
            if (usernameSearch) filters.username = usernameSearch;

            const contestId = selectedContest === "all" ? undefined : selectedContest;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await submissionService.getAllSubmissions(contestId as string, submissionsPage, 10) as any;
            setSubmissions(response.data.submissions || []);
            setSubmissionsTotal(response.data.total || 0);
            if (!selectedSubmission && response.data.submissions && response.data.submissions.length > 0) {
                setSelectedSubmission(response.data.submissions[0]);
            }
        } catch (error: any) {
            console.error("Failed to load submissions:", error);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchContests(), fetchMetrics(), fetchLeaderboard(), fetchSubmissions()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);
    useEffect(() => { fetchMetrics(); fetchLeaderboard(); }, [selectedContest]);
    useEffect(() => { fetchSubmissions(); }, [submissionsPage, statusFilter, languageFilter, usernameSearch, selectedContest]);

    const handleDeleteLeaderboardEntry = async (userId: string) => {
        if (!confirm("Remove this user from leaderboard?")) return;
        try {
            await submissionService.deleteLeaderboardEntry(selectedContest, userId);
            toast.success("User removed from leaderboard");
            fetchLeaderboard();
            fetchMetrics();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete");
        }
    };

    const languageChartData = metrics?.languageDistribution?.map((item) => ({
        name: item.language,
        value: item.count
    })) || [];

    const topPerformersChartData = metrics?.topPerformers?.map((item: any) => ({
        name: item.username,
        points: item.totalPoints,
        solved: item.solved
    })) || [];

    if (loading) {
        return <Loader message="Fetching organizer analytics..." fullscreen />;
    }

    return (
        <div className="min-h-screen bg-theme-primary py-6 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                {/* Header */}
                <header className="flex flex-col gap-4 rounded-2xl border border-theme bg-theme-secondary px-5 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="inline-flex items-center gap-2 rounded-full bg-theme-primary/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-theme-secondary/80">
                                <Sparkles size={14} />
                                Organizer Analytics
                            </p>
                            <h1 className="text-2xl font-bold leading-tight text-theme-primary sm:text-3xl">
                                Submissions Dashboard
                            </h1>
                            <p className="text-sm text-theme-secondary">
                                Track submission health, contest performance, and leaderboard changes in one streamlined view.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={fetchAllData}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-theme px-3 py-2 text-xs sm:text-sm font-semibold text-theme-primary hover:bg-theme-primary/70"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-accent px-3 py-2 text-xs sm:text-sm font-semibold text-theme-primary hover:bg-theme-accent/90">
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-theme-secondary/80">Workspace Overview</h2>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-theme-secondary/70">{contests.length} Contests · {submissionsTotal} Submissions</span>
                    </div>
                    <div className="flex flex-wrap gap-2 rounded-full border border-theme bg-theme-secondary/80 p-1">
                        {[
                            { key: 'overview', label: 'Overview', icon: TrendingUp },
                            { key: 'submissions', label: 'Submissions', icon: Code },
                            { key: 'contests', label: 'Contests & Leaderboard', icon: Award },
                        ].map(({ key, label, icon: Icon }) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key as typeof activeTab)}
                                    className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${isActive
                                        ? 'bg-theme-primary text-theme-primary shadow-[0_18px_40px_-26px_rgba(15,23,42,0.65)]'
                                        : 'text-theme-secondary hover:text-theme-primary'
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? 'text-theme-primary' : 'text-theme-secondary/80 group-hover:text-theme-primary'} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">

                            {/* Added Contest Selector for Overview */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-theme bg-theme-secondary p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-theme-primary">Filter Analytics</p>
                                        <p className="text-xs text-theme-secondary">View metrics for a specific contest or view global stats</p>
                                    </div>
                                </div>
                                <select
                                    value={selectedContest}
                                    onChange={(e) => setSelectedContest(e.target.value)}
                                    className="w-full sm:w-64 rounded-xl border border-theme bg-theme-tertiary px-4 py-2.5 text-sm font-semibold text-theme-primary focus:border-theme-accent focus:outline-none transition-all focus:ring-2 focus:ring-theme-accent/20"
                                >
                                    <option value="all">Global Overview</option>
                                    {contests.map((contest) => (
                                        <option key={contest.id} value={contest.id}>
                                            {contest.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Metric Cards */}
                            {metrics && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <MetricCard
                                        title="Total Submissions"
                                        value={metrics.totalSubmissions || 0}
                                        icon={<Code size={24} />}
                                        bgClass="bg-blue-600"
                                    />
                                    <MetricCard
                                        title="Unique Participants"
                                        value={metrics.uniqueParticipants || 0}
                                        icon={<Users size={24} />}
                                        bgClass="bg-green-600"
                                    />
                                    <MetricCard
                                        title="Success Rate"
                                        value={metrics.successRate || '0%'}
                                        icon={<CheckCircle size={24} />}
                                        trend={`${metrics.successRate || '0%'}`}
                                        bgClass="bg-purple-600"
                                    />
                                    <MetricCard
                                        title="Avg Points"
                                        value={metrics.averagePoints || 0}
                                        icon={<Award size={24} />}
                                        bgClass="bg-orange-600"
                                    />
                                </div>
                            )}

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-theme-secondary rounded-2xl p-6 shadow-lg border border-theme">
                                    <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                                        <Code size={24} className="text-theme-accent" />
                                        Language Distribution
                                    </h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={languageChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {metrics && metrics.topPerformers && metrics.topPerformers.length > 0 && (
                                    <div className="bg-theme-secondary rounded-2xl p-6 shadow-lg border border-theme">
                                        <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                                            <TrendingUp size={24} className="text-green-500" />
                                            Top Performers
                                        </h2>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={topPerformersChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" stroke="#9ca3af" />
                                                <YAxis stroke="#9ca3af" />
                                                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                                                <Legend />
                                                <Area type="monotone" dataKey="points" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                                <Area type="monotone" dataKey="solved" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUBMISSIONS TAB */}
                    {activeTab === 'submissions' && (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px]">
                            {/* CENTER: Filters + submissions list */}
                            <div className="space-y-5">
                                {/* Filters */}
                                <div className="rounded-2xl border border-theme bg-theme-secondary p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-2">
                                                <Search className="inline mr-1" size={16} />
                                                Search Username
                                            </label>
                                            <input
                                                type="text"
                                                value={usernameSearch}
                                                onChange={(e) => setUsernameSearch(e.target.value)}
                                                placeholder="Enter username..."
                                                className="w-full px-4 py-2 rounded-lg border border-theme bg-theme-tertiary text-theme-primary focus:ring-2 focus:ring-theme-accent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-2">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-theme bg-theme-tertiary text-theme-primary focus:ring-2 focus:ring-theme-accent"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="ACCEPTED">Accepted</option>
                                                <option value="WRONG_ANSWER">Wrong Answer</option>
                                                <option value="TIME_LIMIT_EXCEEDED">Time Limit</option>
                                                <option value="RUNTIME_ERROR">Runtime Error</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-2">Language</label>
                                            <select
                                                value={languageFilter}
                                                onChange={(e) => setLanguageFilter(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-theme bg-theme-tertiary text-theme-primary focus:ring-2 focus:ring-theme-accent"
                                            >
                                                <option value="">All Languages</option>
                                                <option value="python">Python</option>
                                                <option value="javascript">JavaScript</option>
                                                <option value="java">Java</option>
                                                <option value="cpp">C++</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Submissions list styled like cards */}
                                <div className="rounded-2xl border border-theme bg-theme-secondary p-4 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-semibold text-theme-primary flex items-center gap-2">
                                                <Code size={22} className="text-theme-accent" />
                                                Live submissions feed
                                            </h2>
                                            <p className="text-[11px] text-theme-secondary mt-1">
                                                Tap a row to inspect the participant on the right.
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-theme-secondary">
                                            Page {submissionsPage} · {submissionsTotal} submissions
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                        {submissions.map((submission) => {
                                            const isSelected = selectedSubmission?.id === submission.id;
                                            return (
                                                <button
                                                    key={submission.id}
                                                    type="button"
                                                    onClick={() => setSelectedSubmission(submission)}
                                                    className={`w-full rounded-2xl border px-3 py-3 text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors ${isSelected
                                                        ? 'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.15)]'
                                                        : 'border-theme bg-theme-tertiary hover:bg-theme-primary/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="h-9 w-9 rounded-full bg-theme-primary/10 flex items-center justify-center text-[11px] font-semibold text-theme-primary">
                                                            {(submission.username || 'Anonymous').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-semibold text-theme-primary">{submission.username || 'Anonymous'}</span>
                                                            <span className="text-[11px] text-theme-secondary">
                                                                Problem {submission.problemId.substring(0, 6)} • {submission.language}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${submission.status === 'ACCEPTED'
                                                            ? 'bg-green-100 text-green-700'
                                                            : submission.status === 'WRONG_ANSWER'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {submission.status}
                                                        </span>
                                                        <span className="text-[11px] text-theme-secondary hidden sm:inline">
                                                            {submission.points} pts · {submission.passedTests}/{submission.totalTests} tests
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/organizer/submissions/${submission.id}`);
                                                            }}
                                                            className="p-1.5 rounded-full bg-theme-accent/10 text-theme-accent hover:bg-theme-accent/20"
                                                            title="View details"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {submissions.length === 0 && (
                                            <p className="text-xs text-theme-secondary text-center py-6">
                                                No submissions match the current filters.
                                            </p>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme">
                                        <p className="text-[11px] text-theme-secondary">
                                            Showing {(submissionsPage - 1) * 10 + 1} to {Math.min(submissionsPage * 10, submissionsTotal)} of {submissionsTotal}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                                                disabled={submissionsPage === 1}
                                                className="px-3 py-2 rounded-lg border border-theme text-theme-primary hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => setSubmissionsPage((p) => p + 1)}
                                                disabled={submissionsPage * 10 >= submissionsTotal}
                                                className="px-3 py-2 rounded-lg border border-theme text-theme-primary hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: User detail panel like reference image */}
                            <aside className="rounded-3xl border border-theme bg-theme-secondary p-4 flex flex-col gap-4">
                                {selectedSubmission ? (
                                    <>
                                        {/* Profile */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-14 w-14 rounded-full bg-theme-primary/10 flex items-center justify-center text-lg font-bold text-theme-primary">
                                                {(selectedSubmission.username || 'Anonymous').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-sm font-semibold text-theme-primary">
                                                    {selectedSubmission.username || 'Anonymous'}
                                                </h2>
                                                <p className="text-[11px] text-theme-secondary">
                                                    Participant • Problem {selectedSubmission.problemId.substring(0, 8)}
                                                </p>
                                                <p className="mt-1 text-[11px] text-theme-secondary">
                                                    Last verdict: {selectedSubmission.status} · {selectedSubmission.language}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Small metrics row */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                                            <div className="rounded-2xl bg-theme-primary/5 px-2 py-2">
                                                <p className="text-[11px] font-semibold text-theme-primary">{selectedSubmission.points}</p>
                                                <p className="text-[10px] text-theme-secondary">Points</p>
                                            </div>
                                            <div className="rounded-2xl bg-theme-primary/5 px-2 py-2">
                                                <p className="text-[11px] font-semibold text-theme-primary">{selectedSubmission.passedTests}/{selectedSubmission.totalTests}</p>
                                                <p className="text-[10px] text-theme-secondary">Tests</p>
                                            </div>
                                            <div className="rounded-2xl bg-theme-primary/5 px-2 py-2">
                                                <p className="text-[11px] font-semibold text-theme-primary">{new Date(selectedSubmission.createdAt).toLocaleTimeString()}</p>
                                                <p className="text-[10px] text-theme-secondary">Submitted</p>
                                            </div>
                                        </div>

                                        {/* Status chips */}
                                        <div className="space-y-2 text-[11px]">
                                            <p className="font-semibold text-theme-primary">Verdict details</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-theme-primary/5 px-3 py-1 text-[10px] text-theme-secondary">
                                                    Status: <span className="font-semibold text-theme-primary">{selectedSubmission.status}</span>
                                                </span>
                                                {selectedSubmission.executionTime !== undefined && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-theme-primary/5 px-3 py-1 text-[10px] text-theme-secondary">
                                                        Time: <span className="font-semibold text-theme-primary">{selectedSubmission.executionTime} ms</span>
                                                    </span>
                                                )}
                                                {selectedSubmission.memoryUsed !== undefined && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-theme-primary/5 px-3 py-1 text-[10px] text-theme-secondary">
                                                        Memory: <span className="font-semibold text-theme-primary">{selectedSubmission.memoryUsed} MB</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-2 text-[11px]">
                                            <p className="font-semibold text-theme-primary">Actions</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => router.push(`/organizer/submissions/${selectedSubmission.id}`)}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-theme-accent/90 px-4 py-2 text-[11px] font-semibold text-theme-primary hover:bg-theme-accent"
                                                >
                                                    <Eye size={14} />
                                                    Open full details
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-xs text-theme-secondary">
                                        <p className="font-semibold text-theme-primary mb-1">No submission selected</p>
                                        <p>Select a row from the submissions list to inspect the participant here.</p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}

                    {/* CONTESTS & LEADERBOARD TAB */}
                    {activeTab === 'contests' && (
                        <div className="space-y-6">
                            {/* Contest Selection */}
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-theme-secondary/70 p-6 shadow-[0_30px_90px_-45px_rgba(56,189,248,0.55)] backdrop-blur">
                                <div className="pointer-events-none absolute -top-20 right-10 h-36 w-36 rounded-full bg-theme-accent/15 blur-3xl" />
                                <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-theme-primary/20 blur-3xl" />
                                <div className="relative z-10">
                                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-theme-secondary/70">
                                        <Calendar size={18} className="text-theme-accent" />
                                        Select Contest
                                    </label>
                                    <select
                                        value={selectedContest}
                                        onChange={(e) => setSelectedContest(e.target.value)}
                                        className="w-full rounded-2xl border border-white/15 bg-theme-primary/15 px-4 py-3 text-sm font-semibold text-theme-primary transition focus:border-theme-accent focus:outline-none"
                                    >
                                        <option value="all">All Contests</option>
                                        {contests.map((contest) => (
                                            <option key={contest.id} value={contest.id}>
                                                {contest.title} {contest.registrationCount ? `(${contest.registrationCount} registered)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Contest Stats */}
                            {selectedContest !== "all" && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {[{
                                        label: 'Participants',
                                        value: leaderboard.length,
                                        icon: Users,
                                        gradient: 'from-sky-500/60 via-sky-400/40 to-sky-500/20'
                                    }, {
                                        label: 'Active Solvers',
                                        value: leaderboard.filter(e => (e.solved || 0) > 0).length,
                                        icon: Award,
                                        gradient: 'from-emerald-500/60 via-emerald-400/35 to-emerald-500/20'
                                    }, {
                                        label: 'Highest Score',
                                        value: leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.points || 0)) : 0,
                                        icon: TrendingUp,
                                        gradient: 'from-violet-500/60 via-fuchsia-400/35 to-violet-500/20'
                                    }].map(({ label, value, icon: Icon, gradient }) => (
                                        <div key={label} className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} p-6 text-white shadow-[0_28px_80px_-40px_rgba(59,130,246,0.55)] backdrop-blur`}>
                                            <div className="pointer-events-none absolute -top-16 right-6 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
                                            <div className="pointer-events-none absolute -bottom-20 left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                            <div className="relative z-10 space-y-4">
                                                <Icon size={28} className="opacity-80" />
                                                <div className="text-3xl font-bold">{value}</div>
                                                <div className="text-sm uppercase tracking-[0.3em] text-white/80">{label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Leaderboard Table */}
                            {selectedContest !== "all" && leaderboard.length > 0 && (
                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-theme-secondary/80 p-6 shadow-[0_32px_90px_-50px_rgba(56,189,248,0.55)] backdrop-blur">
                                    <div className="pointer-events-none absolute -top-28 right-20 h-44 w-44 rounded-full bg-theme-accent/15 blur-3xl" />
                                    <div className="pointer-events-none absolute -bottom-32 left-6 h-48 w-48 rounded-full bg-theme-primary/25 blur-[120px]" />
                                    <div className="relative z-10">
                                        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-theme-primary">
                                            <Award size={28} className="text-theme-accent" />
                                            Contest Leaderboard
                                        </h2>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.25em] text-theme-secondary/70">
                                                        <th className="py-3 px-4">Rank</th>
                                                        <th className="py-3 px-4">Username</th>
                                                        <th className="py-3 px-4">Solved</th>
                                                        <th className="py-3 px-4">Points</th>
                                                        <th className="py-3 px-4">Language</th>
                                                        <th className="py-3 px-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {leaderboard.map((entry, index) => (
                                                        <tr key={entry.userId} className="border-b border-white/5 transition-colors hover:bg-white/5">
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? "bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-lg" :
                                                                    index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 shadow-md" :
                                                                        index === 2 ? "bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-md" :
                                                                            "bg-white/10 text-theme-primary"
                                                                    }`}>
                                                                    {index + 1}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-theme-primary font-medium">{entry.username}</td>
                                                            <td className="py-4 px-4 text-theme-secondary">
                                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-theme-primary">
                                                                    <CheckCircle size={16} className="text-emerald-400" />
                                                                    {entry.solved}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-lg font-bold text-theme-accent">{entry.points}</span>
                                                            </td>
                                                            <td className="py-4 px-4 text-theme-secondary/90">{entry.language || "N/A"}</td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setEditingEntry(entry)}
                                                                        className="inline-flex items-center justify-center rounded-lg border border-theme-accent/40 bg-theme-accent/10 p-2 text-theme-accent transition-all hover:bg-theme-accent/20"
                                                                        title="Edit Entry"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteLeaderboardEntry(entry.userId)}
                                                                        className="inline-flex items-center justify-center rounded-lg border border-rose-400/50 bg-rose-500/10 p-2 text-rose-300 transition-all hover:bg-rose-500/20"
                                                                        title="Remove Entry"
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
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {selectedContest !== "all" && leaderboard.length === 0 && (
                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-theme-secondary/70 p-12 text-center shadow-[0_28px_90px_-45px_rgba(56,189,248,0.45)] backdrop-blur">
                                    <div className="pointer-events-none absolute -top-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-theme-accent/15 blur-3xl" />
                                    <div className="pointer-events-none absolute -bottom-24 right-16 h-48 w-48 rounded-full bg-theme-primary/20 blur-[100px]" />
                                    <div className="relative z-10 space-y-4">
                                        <Award size={64} className="mx-auto text-theme-accent/70" />
                                        <h3 className="text-xl font-bold text-theme-primary">No Leaderboard Data</h3>
                                        <p className="text-sm text-theme-secondary/80">No participants have submitted solutions for this contest yet.</p>
                                    </div>
                                </div>
                            )}

                            {selectedContest === "all" && (
                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-theme-secondary/70 p-12 text-center shadow-[0_28px_90px_-45px_rgba(56,189,248,0.45)] backdrop-blur">
                                    <div className="pointer-events-none absolute -top-24 right-16 h-48 w-48 rounded-full bg-theme-accent/15 blur-3xl" />
                                    <div className="relative z-10 space-y-4">
                                        <Users size={64} className="mx-auto text-theme-secondary opacity-50" />
                                        <h3 className="text-xl font-bold text-theme-primary">Global Leaderboard</h3>
                                        <p className="text-sm text-theme-secondary/80">Select a specific contest from the dropdown above to view the leaderboard for that event.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {editingEntry && (
                        <EditLeaderboardModal
                            entry={editingEntry}
                            contestId={selectedContest}
                            onClose={() => setEditingEntry(null)}
                            onSuccess={() => {
                                fetchLeaderboard();
                                fetchMetrics();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
