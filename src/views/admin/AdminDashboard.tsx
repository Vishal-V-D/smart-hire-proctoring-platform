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
    Moon,
    Building2,
    Globe,
    Mail,
    Settings,
    User,
    Plus,
    Search,
    Filter,
    Bell
} from 'lucide-react';
import Link from 'next/link';
import { AuthContext } from '@/components/AuthProviderClient';
import { useNotifications } from '@/context/NotificationContext';
import { contestService } from '@/api/contestService';
import { ThemeContext } from '@/context/ThemeContext';
import AssessmentSkeleton from '@/components/admin/AssessmentSkeleton';

export default function AdminDashboard() {
    const auth = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
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

        const fetchCompany = async () => {
            try {
                const res = await contestService.getCompanyDetails();
                setCompanyInfo(res.data);
            } catch (error) {
                console.error("Failed to fetch company info in dashboard", error);
            }
        };

        fetchAssessments();
        fetchCompany();
    }, []);

    const activeCount = assessments.filter(a => a.status === 'active' || a.status === 'published').length;
    const totalParticipants = assessments.reduce((sum, a) => sum + (a.participantCount || 0), 0);

    return (
        <div className="min-h-screen bg-muted/5 p-6 md:p-10 animate-in fade-in duration-500">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* 1. Top Header Area (Clean & Minimal) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Building2 size={16} />
                            <span>{companyInfo?.name || auth?.user?.companyName || 'Organization Admin'}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Welcome back, {auth?.user?.fullName?.split(' ')[0] || 'Admin'}
                        </h1>
                        <p className="text-muted-foreground max-w-xl">
                            Here's what's happening with your assessments today.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/admin/notifications" className="relative p-2.5 rounded-xl border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link href="/admin/assessments/create" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm group">
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            <span>New Assessment</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Main Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left Column: Assessments List (8 Cols) */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <LayoutDashboard size={20} className="text-primary" />
                                Recent Assessments
                            </h2>
                            <Link href="/admin/assessments" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>

                        {loading ? (
                            <AssessmentSkeleton />
                        ) : assessments.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
                                <LayoutDashboard size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="font-semibold text-foreground">No assessments yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">Create your first assessment to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {assessments.map((assessment) => (
                                    <Link
                                        key={assessment.id}
                                        href={`/admin/assessments/${assessment.id}`}
                                        className="group flex flex-col justify-between bg-card hover:bg-muted/10 border border-border/60 hover:border-primary/20 p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${assessment.status === 'active' || assessment.status === 'published'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : assessment.status === 'draft'
                                                        ? 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    }`}>
                                                    {assessment.status}
                                                </div>
                                                <div className="p-2 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <ArrowRight size={16} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                                {assessment.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                                {assessment.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-2">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={14} />
                                                    <span>{assessment.participantCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    <span>{assessment.duration || 60}m</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                                                {new Date(assessment.startDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar (4 Cols) */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* 1. Quick Stats Widget */}
                        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                                <BarChart3 size={18} className="text-muted-foreground" />
                                Platform Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Active</p>
                                    <p className="text-3xl font-Inter text-foreground">{activeCount}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                    <p className="text-xs font-bold text-orange-600 mb-1 uppercase tracking-wider">Total</p>
                                    <p className="text-3xl font-Inter text-foreground">{assessments.length}</p>
                                </div>
                                <div className="col-span-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">Participants</p>
                                        <p className="text-3xl font-Inter text-foreground">{totalParticipants}</p>
                                    </div>
                                    <Users size={24} className="text-blue-500/30" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Quick Actions */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-foreground flex items-center gap-2 px-1">
                                <Zap size={18} className="text-muted-foreground" />
                                Quick Actions
                            </h3>

                            <Link href="/admin/monitor" className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group">
                                <div className="p-3 rounded-xl bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Live Monitoring</h4>
                                    <p className="text-xs text-muted-foreground">Watch active sessions</p>
                                </div>
                                <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href="/admin/reports" className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">All Reports</h4>
                                    <p className="text-xs text-muted-foreground">View past performance</p>
                                </div>
                                <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href="/admin/violations" className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Violations</h4>
                                    <p className="text-xs text-muted-foreground">Review flagged incidents</p>
                                </div>
                                <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>

                        {/* 3. System Status / User Info */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-1">Pro Account</h3>
                                <p className="text-white/80 text-xs mb-4">You have full access to all features.</p>
                                <div className="flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-3 py-1.5 rounded-lg backdrop-blur-md">
                                    <Shield size={12} />
                                    <span>Administrator</span>
                                </div>
                            </div>
                            <Sparkles size={80} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
