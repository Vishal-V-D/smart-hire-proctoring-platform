"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Activity,
    LineChart,
    Settings,
    LogOut,
    ChevronLeft,
    Shield,
    Menu,
    X,
    Bell,
    Share2,
    TrendingUp,
    Users2,
    AlertCircle,
    Zap
} from "lucide-react";
import { contestService } from "../../api/contestService";
import Loader from "../../components/Loader";
import { showToast } from "../../utils/toast";

// Sub-components
import SecureDashboardOverview from './SecureDashboardOverview';
import SecureDashboardInvites from './SecureDashboardInvites';
import SecureDashboardLiveReports from './SecureDashboardLiveReports';
import SecureDashboardResults from './SecureDashboardResults';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'invites', label: 'Invites', icon: Users },
    { id: 'monitoring', label: 'Live Reports', icon: Activity },
    { id: 'results', label: 'Results', icon: LineChart },
    // { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SecureContestDashboard() {
    const params = useParams();
    const router = useRouter();
    const contestId = params?.contestId as string;

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<any>(null);
    const [invites, setInvites] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [violations, setViolations] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle

    // --- Data Fetching ---
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [contestRes, invitesRes, participantsRes, violationsRes, resultsRes] = await Promise.all([
                contestService.getContestById(contestId),
                contestService.getInvitations(contestId),
                contestService.getLiveParticipants(contestId), // Updated to getLiveParticipants
                contestService.getRealTimeViolations(contestId),   // Updated to getRealTimeViolations
                contestService.getContestResults(contestId)
            ]);

            setContest(contestRes.data.data || contestRes.data);
            setInvites(invitesRes.data.data || invitesRes.data || []);
            setParticipants(participantsRes.data.data || participantsRes.data || []);
            setViolations(violationsRes.data.data || violationsRes.data || []);
            setResults(resultsRes.data.data || resultsRes.data || []);

        } catch (error) {
            console.error("Dashboard data fetch failed", error);
            showToast("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contestId) {
            fetchDashboardData();
            // Optional: Poll for live updates every 30s
            const interval = setInterval(fetchDashboardData, 30000);
            return () => clearInterval(interval);
        }
    }, [contestId]);

    // --- Actions ---
    const handleQuickAction = async (action: string) => {
        if (action === 'delete') {
            if (confirm("Are you sure? This will delete the contest and all associated data.")) {
                try {
                    await contestService.deleteContest(contestId);
                    showToast("Contest deleted", "success");
                    router.push('/hire/dashboard');
                } catch (e) {
                    showToast("Delete failed", "error");
                }
            }
        }
        if (action === 'edit') {
            router.push(`/hire/contest/${contestId}/edit`); // Assuming edit page exists
        }
    };

    if (loading && !contest) {
        return <Loader message="Loading Dashboard..." />;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#151521] text-gray-800 dark:text-gray-200 overflow-hidden font-sans">

            {/* --- SIDEBAR (Desktop) --- */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#1e1e2d] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="p-8 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">SecureAudit</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Live Session</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1.5 mt-4">
                        <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Main Menu</p>
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        }`}
                                >
                                    <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500 transition-colors'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}

                        {/* Detailed Contest Info */}
                        <div className="mt-10 px-4 space-y-6">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Contest Health</p>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users2 size={14} className="text-indigo-500" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Active</span>
                                        </div>
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{participants.length}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((participants.length / (invites.length || 1)) * 100, 100)}%` }} />
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-900/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={14} className="text-red-500" />
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">Violations</span>
                                        </div>
                                        <span className="text-xs font-black text-red-600 dark:text-red-400">{violations.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Tip Card */}
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group">
                                <Zap size={40} className="absolute -right-2 -bottom-2 text-white/20 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">Pro Tip</p>
                                <p className="text-xs font-bold leading-tight">Enable AI Proctoring for better security.</p>
                            </div>
                        </div>
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <button
                            onClick={() => router.push('/hire/dashboard')}
                            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 transition-all font-bold text-sm shadow-sm"
                        >
                            <LogOut size={18} />
                            <span>Exit Dashboard</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- OVERLAY for Mobile --- */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-white/80 dark:bg-[#151521]/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 transition"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                                Contest ID: <span className="font-mono text-indigo-500">{contestId.slice(0, 8)}...</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-500 hover:border-indigo-500 transition shadow-sm">
                            <Bell size={20} />
                        </button>
                        <button className="p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-500 hover:border-indigo-500 transition shadow-sm">
                            <Share2 size={20} />
                        </button>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 p-0.5 ml-2 cursor-pointer hover:scale-105 transition">
                            <div className="h-full w-full rounded-full bg-white dark:bg-[#1e1e2d] flex items-center justify-center">
                                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">O</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Tab Content */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                            {activeTab === 'overview' && (
                                <SecureDashboardOverview
                                    contest={contest}
                                    invites={invites}
                                    violations={violations}
                                    participants={participants}
                                    results={results}
                                    onQuickAction={handleQuickAction}
                                />
                            )}
                            {activeTab === 'invites' && (
                                <SecureDashboardInvites
                                    contestId={contestId}
                                    invites={invites}
                                    onRefresh={fetchDashboardData}
                                />
                            )}
                            {activeTab === 'monitoring' && (
                                <SecureDashboardLiveReports
                                    contestId={contestId}
                                    violations={violations}
                                    participants={participants}
                                />
                            )}
                            {activeTab === 'results' && (
                                <SecureDashboardResults
                                    contestId={contestId}
                                    results={results}
                                    loading={loading}
                                    onRefresh={fetchDashboardData}
                                />
                            )}
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}
