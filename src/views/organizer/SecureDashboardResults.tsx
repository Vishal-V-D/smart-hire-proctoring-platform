import React, { useMemo, useState } from 'react';
import {
    MoreHorizontal,
    TrendingUp,
    Download,
    Award,
    Shield,
    CheckCircle,
    AlertTriangle,
    BarChart2,
    PieChart as PieIcon,
    Code,
    Users
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import AdvancedResultsTable from '../../components/organizer/AdvancedResultsTable';
import { contestService } from "../../api/contestService";
import { showToast } from "../../utils/toast";

interface SecureDashboardResultsProps {
    contestId: string;
    results: any[];
    loading: boolean;
    onRefresh: () => void;
}

export default function SecureDashboardResults({ contestId, results, loading, onRefresh }: SecureDashboardResultsProps) {
    const [statsTimeRange, setStatsTimeRange] = useState('all');

    // --- Aggregated Stats ---
    const stats = useMemo(() => {
        if (!results.length) return null;

        const total = results.length;
        const passed = results.filter(r => r.finalScore >= 50).length; // Assuming 50 is pass
        const avgScore = Math.round(results.reduce((acc, r) => acc + r.finalScore, 0) / total);
        const avgPlagiarism = Math.round(results.reduce((acc, r) => acc + r.plagiarismScore, 0) / total);
        const violations = results.reduce((acc, r) => acc + (r.resultDetails?.violationDetails?.totalViolations || 0), 0);
        const suspiciousCount = results.filter(r => r.isSuspicious).length;

        // Score buckets for Bar Chart
        const distribution = [
            { range: '0-20', count: results.filter(r => r.finalScore >= 0 && r.finalScore < 20).length },
            { range: '21-40', count: results.filter(r => r.finalScore >= 20 && r.finalScore < 40).length },
            { range: '41-60', count: results.filter(r => r.finalScore >= 40 && r.finalScore < 60).length },
            { range: '61-80', count: results.filter(r => r.finalScore >= 60 && r.finalScore < 80).length },
            { range: '81-100', count: results.filter(r => r.finalScore >= 80 && r.finalScore <= 100).length },
        ];

        // Problem performance (mock for now if detail not available, or aggregate from resultDetails)
        // Ideally we iterate all results -> problemResults and aggregate status
        const problemStats: Record<string, { accepted: number, total: number }> = {};
        results.forEach(r => {
            r.resultDetails?.problemResults?.forEach((p: any) => {
                if (!problemStats[p.problemTitle]) problemStats[p.problemTitle] = { accepted: 0, total: 0 };
                problemStats[p.problemTitle].total += 1;
                if (p.status === 'ACCEPTED') problemStats[p.problemTitle].accepted += 1;
            });
        });

        const performanceData = Object.entries(problemStats).map(([name, stat]) => ({
            name: name.length > 10 ? name.substring(0, 10) + '...' : name,
            passRate: Math.round((stat.accepted / stat.total) * 100)
        }));

        return {
            total,
            passed,
            avgScore,
            avgPlagiarism,
            violations,
            suspiciousCount,
            distribution,
            performanceData
        };
    }, [results]);

    // --- Handlers ---

    const handleEditResult = (result: any) => {
        // Implement edit modal logic or pass up to parent
        // For 'hire', we might want to keep it simple first
        console.log("Edit result", result);
        showToast("Edit functionality coming soon", "info");
    };

    const handleDeleteResult = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this result? This action cannot be undone.")) return;
        try {
            await contestService.deleteSecureResult(id);
            showToast("Result deleted successfully", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete result", "error");
        }
    };

    const handleApplyPenalty = async (id: string, penalty: number) => {
        if (!window.confirm(`Apply penalty of -${penalty} points?`)) return;
        try {
            // Fetch current result to calculate new score
            const currentResult = results.find(r => r.id === id);
            if (!currentResult) return;

            const newScore = Math.max(0, currentResult.finalScore - penalty);

            // Update result (assuming generic update endpoint or specific apply-penalty endpoint)
            // If specific endpoint doesn't exist, we might need to use updateResult
            await contestService.updateSecureResult(id, {
                finalScore: newScore,
                violationPenalty: (currentResult.violationPenalty || 0) + penalty
            });

            showToast("Penalty applied successfully", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to apply penalty", "error");
        }
    };

    const handleExportCSV = () => {
        if (!results.length) return;
        // Simple CSV export
        const headers = ["User", "Email", "Score", "Plagiarism", "AI Score", "Violations", "Duration (s)", "Suspicious"];
        const csvContent = [
            headers.join(","),
            ...results.map(r => [
                r.registrationDetails.name,
                r.registrationDetails.email,
                r.finalScore,
                r.plagiarismScore,
                r.aiScore,
                r.resultDetails.violationDetails.totalViolations,
                r.durationSeconds,
                r.isSuspicious ? "Yes" : "No"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `contest_results_${contestId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="flex flex-col gap-8 pb-20">

            {/* --- TOP: Stats Grid --- */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Avg Score */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Average Score</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">
                                {stats.avgScore}<span className="text-sm font-bold text-gray-400 ml-1">%</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                    </div>

                    {/* 2. Top Performers (Passed) */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Qualified</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 group-hover:text-emerald-500 transition-colors">
                                {stats.passed}<span className="text-sm font-bold text-gray-400 ml-1">/ {stats.total}</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Award size={24} />
                        </div>
                    </div>

                    {/* 3. Avg Plagiarism */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-amber-500/30 transition-all">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Avg Plagiarism</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 group-hover:text-amber-500 transition-colors">
                                {stats.avgPlagiarism}<span className="text-sm font-bold text-gray-400 ml-1">%</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Shield size={24} />
                        </div>
                    </div>

                    {/* 4. Integrity Issues */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-red-500/30 transition-all">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Suspicious</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 group-hover:text-red-500 transition-colors">
                                {stats.suspiciousCount}<span className="text-sm font-bold text-gray-400 ml-1">Users</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- MIDDLE: Charts --- */}
            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[350px]">
                    {/* Score Distribution */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <BarChart2 size={18} className="text-indigo-500" /> Score Distribution
                            </h3>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.distribution} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 8, 8]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Problem Performance */}
                    <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Code size={18} className="text-emerald-500" /> Problem Success Rate
                            </h3>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.performanceData}>
                                    <defs>
                                        <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="passRate" stroke="#10b981" fillOpacity={1} fill="url(#colorPass)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BOTTOM: Advanced Table --- */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Detailed Results</h3>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                <AdvancedResultsTable
                    results={results}
                    loading={loading}
                    onRefresh={onRefresh}
                    onEditResult={handleEditResult}
                    onDeleteResult={handleDeleteResult}
                    onApplyPenalty={handleApplyPenalty}
                />
            </div>

        </div>
    );
}
