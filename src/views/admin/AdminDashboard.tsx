// src/views/admin/AdminDashboard.tsx
'use client'

import React, { useState, useEffect, useContext } from 'react';
import { assessmentService } from '@/api/assessmentService';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    ArrowRight,
    Shield,
    Eye,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    Zap,
    TrendingUp,
    Clock,
    FileText,
    Sparkles,
    Sun,
    Moon
} from 'lucide-react';
import Link from 'next/link';
import { AuthContext } from '@/components/AuthProviderClient';
import { ThemeContext } from '@/context/ThemeContext';

export default function AdminDashboard() {
    const auth = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await assessmentService.listAssessments({ limit: 50 });
                setAssessments(res.data.assessments || []);
            } catch (err) {
                console.error("Failed to load assessments", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    const activeCount = assessments.filter(a => a.status === 'active' || a.status === 'published').length;
    const totalParticipants = assessments.reduce((sum, a) => sum + (a.participantCount || 0), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 bg-background text-foreground">

            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-10 shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl" />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg border border-white/20 group"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-90 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
                </button>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Sparkles className="text-white" size={28} />
                            </div>
                            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm uppercase tracking-wider">
                                Admin Portal
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                            Welcome back, {auth?.user?.fullName?.split(' ')[0] || 'Admin'}! 👋
                        </h1>
                        <p className="text-white/80 text-lg leading-relaxed">
                            Monitor assessments, review participant reports, and track proctoring violations in real-time.
                            Your dashboard provides a comprehensive overview of all assessment activities.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[180px]">
                            <div className="flex items-center gap-3 mb-2">
                                <LayoutDashboard className="text-white/70" size={20} />
                                <span className="text-white/70 text-sm font-medium">Assessments</span>
                            </div>
                            <p className="text-4xl font-black text-white">{assessments.length}</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-white/70" size={20} />
                                <span className="text-white/70 text-sm font-medium">Total Participants</span>
                            </div>
                            <p className="text-4xl font-black text-white">{totalParticipants}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 group hover:border-blue-500/40 transition-all">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Eye className="text-blue-500" size={24} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Live Monitoring</h3>
                    <p className="text-xs text-muted-foreground">Watch participant activity and proctoring feeds in real-time</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 group hover:border-purple-500/40 transition-all">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="text-purple-500" size={24} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Detailed Reports</h3>
                    <p className="text-xs text-muted-foreground">Access comprehensive performance analytics and scores</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 group hover:border-amber-500/40 transition-all">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="text-amber-500" size={24} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Violation Tracking</h3>
                    <p className="text-xs text-muted-foreground">Review flagged incidents and suspicious activities</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-5 group hover:border-green-500/40 transition-all">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="text-green-500" size={24} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Export Data</h3>
                    <p className="text-xs text-muted-foreground">Download reports and participant data in CSV format</p>
                </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <LayoutDashboard className="text-primary" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Your Assessments</h2>
                        <p className="text-sm text-muted-foreground">Click on any assessment to view detailed reports and monitoring</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full font-bold text-xs">
                        {activeCount} Active
                    </span>
                    <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full font-bold text-xs">
                        {assessments.length} Total
                    </span>
                </div>
            </div>

            {/* Assessments Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : assessments.length === 0 ? (
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl p-16 text-center border-2 border-dashed border-border">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutDashboard className="text-muted-foreground" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">No Assessments Assigned</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        You haven't been granted access to any assessments yet. Contact your organization's administrator to get started.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((a) => (
                        <Link
                            key={a.id}
                            href={`/admin/assessments/${a.id}`}
                            className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
                        >
                            {/* Status ribbon */}
                            <div className={`h-1.5 ${a.status === 'active' || a.status === 'published'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                : a.status === 'draft'
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-300'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                }`} />

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                        {a.title}
                                    </h3>
                                    <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${a.status === 'active' || a.status === 'published'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                        : a.status === 'draft'
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                        }`}>
                                        {a.status}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {a.description || 'No description available'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays size={14} className="text-primary shrink-0" />
                                        <span>{new Date(a.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                                        <Users size={14} className="text-primary shrink-0" />
                                        <span className="font-medium">{a.participantCount || 0} Submissions</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-between">
                                <span className="text-sm font-bold text-primary flex items-center gap-2">
                                    <Eye size={16} />
                                    View Reports & Monitoring
                                </span>
                                <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Footer Tips */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-3 bg-primary/15 rounded-xl shrink-0">
                    <Zap className="text-primary" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-foreground mb-1">Quick Tip</h3>
                    <p className="text-sm text-muted-foreground">
                        Click on any assessment card to access the full monitoring dashboard. You can view live proctoring feeds,
                        track violations, and generate detailed reports for each participant.
                    </p>
                </div>
            </div>
        </div>
    );
}
