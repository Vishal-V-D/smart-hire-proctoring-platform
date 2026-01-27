"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Shield,
    FileText,
    Users,
    BarChart3,
    AlertTriangle,
    Download,
    Share2,
    Trash2,
    Eye,
    Mail,
    Play,
    Send,
    X,
    Plus,
    Activity,
    Edit,
    ChevronRight,
    Calendar,
    Clock,
    LayoutDashboard,
    LayoutGrid,
    PanelLeftClose,
    PanelLeftOpen,
    HelpCircle
} from 'lucide-react';
import { assessmentService } from '@/api/assessmentService';
import { invitationService, Invitation, InvitationStats } from '@/api/invitationService';
import { submissionService } from '@/api/submissionService';
import { useAuth } from '@/components/AuthProviderClient';

// Sub-components
import AssessmentReportsTab from './components/AssessmentReportsTab';
import OverviewTab from './components/OverviewTab';
import InvitationsTab from './components/InvitationsTab';
import MonitoringTab from './components/MonitoringTab';
import ParticipantsTab from './components/ParticipantsTab';

// ========== TYPES ==========
type Question = {
    id: string;
    text: string;
    image?: string;
    type: string;
    options?: string[];
    correctAnswer?: string | string[];
    codeStub?: string;
    marks: number;
    orderIndex: number;
    problemId?: string;
    problemData?: any;
    problem?: any;
    negativeMarks?: number;
};

type Section = {
    id: string;
    title: string;
    description: string;
    type: string;
    questionCount: number;
    marksPerQuestion: number;
    timeLimit: number;
    negativeMarking: number;
    difficulty: string;
    themeColor: string;
    orderIndex: number;
    questions: Question[];
    problems?: any[];
};

type AssessmentDetail = {
    id: string;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    duration: number;
    timeMode: string;
    globalTime: number;
    totalSections: number;
    totalQuestions: number;
    totalMarks: number;
    totalTime: number;
    proctoringSettings: any;
    sections: Section[];
    createdAt: string;
};

type TabType = 'overview' | 'invitations' | 'participants' | 'monitoring' | 'reports';

// ========== MAIN COMPONENT ==========

const AssessmentDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const assessmentId = params?.id as string;
    const { user } = useAuth();

    // Core state
    const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Invitation state
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [invitationStats, setInvitationStats] = useState<InvitationStats | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [invitationFilter, setInvitationFilter] = useState<string>('');
    const [invitationSearch, setInvitationSearch] = useState('');

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [hoveredText, setHoveredText] = useState<string | null>(null);
    const [tooltipTop, setTooltipTop] = useState<number | null>(null);

    const handleHover = (text: string | null, e: React.MouseEvent<HTMLElement> | null) => {
        if (!isSidebarCollapsed) {
            setHoveredText(null);
            setTooltipTop(null);
            return;
        }

        if (text && e) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredText(text);
            setTooltipTop(rect.top);
        } else {
            setHoveredText(null);
            setTooltipTop(null);
        }
    };

    // Scroll state for sticky nav animation
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper for navigation
    const getBackLink = () => {
        if (user?.role === 'admin' || user?.role === 'company') {
            return '/admin/assessments';
        }
        return '/organizer/assessments';
    };

    // ========== FETCH DATA ==========

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
            assessmentService.getViolationStats(assessmentId)
                .then(() => console.log('✅ [PREFETCH] Violation stats prefetched'))
                .catch(error => console.log('⚠️ [PREFETCH] failed:', error?.message));
        }
    }, [assessmentId]);

    useEffect(() => {
        if (assessmentId && activeTab === 'invitations') {
            const timer = setTimeout(() => {
                fetchInvitations();
                fetchInvitationStats();
            }, 300); // 300ms debounce

            return () => clearTimeout(timer);
        }
    }, [assessmentId, activeTab, invitationFilter, invitationSearch]);

    const fetchAssessment = async () => {
        setIsLoading(true);
        try {
            const response = await assessmentService.getAssessment(assessmentId);
            setAssessment(response.data);
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const params: any = { assessmentId };
            if (invitationFilter) params.status = invitationFilter;
            if (invitationSearch) params.search = invitationSearch;
            const response = await invitationService.listInvitations(params);
            setInvitations(response.data.invitations || []);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        }
    };

    const fetchInvitationStats = async () => {
        try {
            const response = await invitationService.getInvitationStats(assessmentId);
            setInvitationStats(response.data);
        } catch (error) {
            console.error('Failed to fetch invitation stats:', error);
        }
    };

    const handleCsvUpload = async (file: File) => {
        const { showToast } = await import('@/utils/toast');
        try {
            const response = await invitationService.uploadCsvInvites(assessmentId, file);
            showToast(response.data.message || 'Invitations processed successfully!', 'success');
            fetchInvitations();
            fetchInvitationStats();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Failed to upload CSV invites';
            showToast(errorMessage, 'error');
        }
    };

    // ========== HANDLERS ==========

    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        setInviteLoading(true);
        setInviteError(null);
        const { showToast } = await import('@/utils/toast');
        try {
            await invitationService.createInvitation({
                assessmentId,
                email: inviteEmail,
                name: inviteName || undefined,
                sendEmail: true
            });
            setInviteEmail('');
            setInviteName('');
            setShowInviteModal(false);
            fetchInvitations();
            fetchInvitationStats();
            showToast('Invitation sent successfully', 'success');
        } catch (error: any) {
            console.error("Invite Error:", error);
            let errorMessage = 'Failed to send invitation';

            if (error.response?.data) {
                const data = error.response.data;
                if (data.message) {
                    errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                } else if (data.error) {
                    errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            setInviteError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleResendInvitation = async (id: string) => {
        const { showToast } = await import('@/utils/toast');
        try {
            await invitationService.resendInvitation(id);
            showToast('Invitation resent successfully', 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Failed to resend invitation';
            showToast(errorMessage, 'error');
        }
    };

    const handleCancelInvitation = async (id: string) => {
        if (!confirm('Cancel this invitation?')) return;
        const { showToast } = await import('@/utils/toast');
        try {
            await invitationService.cancelInvitation(id);
            fetchInvitations();
            fetchInvitationStats();
            showToast('Invitation cancelled', 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Failed to cancell invitation';
            showToast(errorMessage, 'error');
        }
    };

    const handleDeleteInvitation = async (id: string) => {
        if (!confirm('Permanently delete this invitation? This action cannot be undone.')) return;
        const { showToast } = await import('@/utils/toast');
        try {
            await invitationService.deleteInvitation(id);
            fetchInvitations();
            fetchInvitationStats();
            showToast('Invitation deleted', 'success');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Failed to delete invitation';
            showToast(errorMessage, 'error');
        }
    };

    const handleDeleteAssessment = async () => {
        setDeleteLoading(true);
        try {
            await assessmentService.deleteAssessment(assessmentId);
            router.push(getBackLink());
        } catch (error) {
            alert('Failed to delete assessment');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            await assessmentService.publishAssessment(assessmentId);
            fetchAssessment();
        } catch (error) {
            console.error('Failed to publish:', error);
        }
    };

    // ========== UI HELPERS ==========

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'PUBLISHED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'ARCHIVED': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'invitations', label: 'Invitations', icon: Mail },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'monitoring', label: 'Monitoring', icon: Eye },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Syncing assessment data...</p>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-destructive/10 text-destructive mb-2">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Assessment not found</h2>
                    <p className="text-muted-foreground">The assessment you're looking for might have been deleted or moved.</p>
                    <button
                        onClick={() => router.push(getBackLink())}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <ArrowLeft size={18} />
                        Back to Assessments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(getBackLink())}
                            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all text-muted-foreground hover:text-foreground shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="h-8 w-px bg-border hidden sm:block" />
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Shield size={14} className="text-primary" />
                                Assessment Management
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {assessment.status === 'DRAFT' && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push(`/assessments/create?edit=${assessmentId}`)}
                                    className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:bg-muted rounded-xl text-sm font-bold transition-all shadow-sm"
                                >
                                    <Edit size={16} />
                                    Edit Details
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    <Play size={16} fill="currentColor" />
                                    Publish
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-xl text-sm font-bold hover:opacity-95 transition-all shadow-lg shadow-primary/25"
                        >
                            <Send size={16} />
                            Invite
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2.5 bg-destructive/5 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white rounded-xl transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-4 md:p-6 transition-all duration-300">
                <div className="flex flex-col lg:flex-row gap-6 relative items-start">

                    {/* LEFT COLUMN: Navigation Sidebar */}
                    <motion.div
                        initial={false}
                        animate={{
                            width: isSidebarCollapsed ? 80 : 280,
                            minWidth: isSidebarCollapsed ? 80 : 280
                        }}
                        className="hidden lg:block sticky top-24 z-30"
                    >
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-3 shadow-lg flex flex-col gap-2 overflow-hidden relative">
                            {/* Toggle Handle */}
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors z-20"
                            >
                                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                            </button>

                            <div className={`px-4 py-2 mb-2 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 h-4' : 'opacity-100'}`}>
                                <h3 className="text-[10px] font-Inter text-muted-foreground uppercase tracking-widest">
                                    Menu
                                </h3>
                            </div>

                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        onMouseEnter={(e) => handleHover(tab.label, e)}
                                        onMouseLeave={() => handleHover(null, null)}
                                        className={`group relative flex items-center gap-3 px-3.5 py-3  font-Inter text-sm transition-all rounded-2xl text-left w-full outline-none ${isActive
                                            ? 'text-primary-foreground shadow-lg shadow-indigo-500/25'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            />
                                        )}
                                        <span className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                            <tab.icon size={20} />
                                        </span>

                                        {!isSidebarCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="relative z-10 whitespace-nowrap overflow-hidden text-ellipsis"
                                            >
                                                {tab.label}
                                            </motion.span>
                                        )}

                                        {tab.id === 'invitations' && invitationStats && (
                                            <span className={`relative z-10 ml-auto px-2 py-0.5 rounded-full text-[10px] font-Inter transition-all ${isSidebarCollapsed ? 'absolute top-1 right-1 px-1.5 py-0 min-w-[1.2rem] h-4 flex items-center justify-center' : ''} ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-muted-foreground/10 text-muted-foreground'
                                                }`}>
                                                {invitationStats.total}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status Card (Sidebar) */}
                        <AnimatePresence>
                            {!isSidebarCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-6 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 border border-indigo-500/10 rounded-xl p-5 backdrop-blur-sm"
                                >
                                    <h4 className="text-[10px] font-Inter text-indigo-600/70 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={12} />
                                        Assessment Status
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between group">
                                            <span className="text-xs text-muted-foreground font-semibold group-hover:text-foreground transition-colors">Current State</span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-Inter uppercase tracking-widest border shadow-sm ${assessment.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                assessment.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                }`}>
                                                {assessment.status}
                                            </span>
                                        </div>
                                        <div className="h-px bg-indigo-500/10" />
                                        <div className="flex items-center justify-between group">
                                            <span className="text-xs text-muted-foreground font-semibold group-hover:text-foreground transition-colors">Days Remaining</span>
                                            <span className="text-xs font-bold text-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                                {Math.ceil((new Date(assessment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Tooltip Portal */}
                    <AnimatePresence>
                        {isSidebarCollapsed && hoveredText && tooltipTop !== null && (
                            <motion.div
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                style={{
                                    position: 'fixed',
                                    top: tooltipTop,
                                    left: 'calc((100vw - 1600px) / 2 + 100px)', // adjust based on container max-width + sidebar width offset
                                    zIndex: 60
                                }}
                                className="pointer-events-none"
                            >
                               
                                <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 flex items-center gap-2">
                                    {hoveredText}
                                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/50"></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* RIGHT COLUMN: Content Area */}
                    <motion.div
                        layout
                        className="flex-1 min-w-0 min-h-[500px] space-y-6"
                    >
                        {/* Mobile Tabs */}
                        <div className="lg:hidden flex overflow-x-auto pb-4 gap-2 scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md'
                                        : 'bg-card border border-border text-muted-foreground'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* OVERVIEW HEADER (Only shown in Overview tab) */}
                                {activeTab === 'overview' && (
                                    <div className="mb-8 space-y-6">
                                        <div className="relative overflow-hidden rounded-[1rem] bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-900/20 p-8 md:p-12 text-white">
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 items-start">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="flex items-center gap-3 text-white text-[10px] font-Inter uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(assessment.createdAt).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {assessment.duration} MIN</span>
                                                    </div>
                                                    <h1 className="text-3xl md:text-3xl font-Inter tracking-tight leading-none">
                                                        {assessment.title}
                                                    </h1>
                                                    <p className="text-lg text-indigo-100/80 font-medium leading-relaxed max-w-xl">
                                                        {assessment.description || "No description provided."}
                                                    </p>
                                                </div>

                                                {/* Quick Stats Grid */}
                                                <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
                                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center hover:bg-white/10 transition-colors">
                                                        <div className="text-3xl font-Inter">{invitationStats?.total || 0}</div>
                                                        <div className="text-[9px] uppercase font-Inter text-indigo-200 mt-1 tracking-widest">Candidates</div>
                                                    </div>
                                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center hover:bg-white/10 transition-colors">
                                                        <div className="text-3xl font-Inter">{assessment.totalQuestions}</div>
                                                        <div className="text-[9px] uppercase font-Inter text-indigo-200 mt-1 tracking-widest">Questions</div>
                                                    </div>
                                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center hover:bg-white/10 transition-colors">
                                                        <div className="text-3xl font-Inter">{assessment.totalMarks}</div>
                                                        <div className="text-[9px] uppercase font-Inter text-indigo-200 mt-1 tracking-widest">Marks</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content wrapper to ensure clean separation */}
                                <div className="bg-transparent">
                                    {activeTab === 'overview' && <OverviewTab assessment={assessment} />}
                                    {activeTab === 'invitations' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold tracking-tight">Invitations</h2>
                                                    <p className="text-muted-foreground">Manage candidate access and invites</p>
                                                </div>
                                            </div>
                                            <InvitationsTab
                                                invitations={invitations}
                                                stats={invitationStats}
                                                filter={invitationFilter}
                                                setFilter={setInvitationFilter}
                                                search={invitationSearch}
                                                setSearch={setInvitationSearch}
                                                onSearch={fetchInvitations}
                                                onResend={handleResendInvitation}
                                                onCancel={handleCancelInvitation}
                                                onDelete={handleDeleteInvitation}
                                                onInvite={() => setShowInviteModal(true)}
                                                onCsvUpload={handleCsvUpload}
                                                assessmentId={assessmentId}
                                            />
                                        </div>
                                    )}
                                    {activeTab === 'participants' && (
                                        <div className="space-y-4">
                                            <div className="mb-4">
                                                <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
                                                <p className="text-muted-foreground">Monitor candidate progress and results</p>
                                            </div>
                                            <ParticipantsTab assessmentId={assessmentId} />
                                        </div>
                                    )}
                                    {activeTab === 'monitoring' && (
                                        <div className="space-y-4">
                                            <div className="mb-4">
                                                <h2 className="text-2xl font-bold tracking-tight">Live Monitoring</h2>
                                                <p className="text-muted-foreground">Real-time proctoring and security alerts</p>
                                            </div>
                                            <MonitoringTab assessmentId={assessmentId} />
                                        </div>
                                    )}
                                    {activeTab === 'reports' && (
                                        <div className="space-y-4">
                                            <div className="mb-4">
                                                <h2 className="text-2xl font-bold tracking-tight">Analytics & Reports</h2>
                                                <p className="text-muted-foreground">Detailed performance insights</p>
                                            </div>
                                            <AssessmentReportsTab assessmentId={assessmentId} assessment={assessment} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>

            {/* Modal Components */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInviteModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card border border-border rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-Inter text-foreground">Send Invite</h3>
                                    <p className="text-sm text-muted-foreground">Invite a participant via email</p>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {inviteError && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium text-red-600">{inviteError}</p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-Inter uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 px-4 text-sm outline-none transition-all font-medium"
                                        placeholder="candidate@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-Inter uppercase tracking-widest text-muted-foreground ml-1">Full Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 px-4 text-sm outline-none transition-all font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-6 py-3.5 border border-border rounded-2xl font-bold text-sm hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInvite}
                                    disabled={!inviteEmail || inviteLoading}
                                    className="flex-[1.5] px-6 py-3.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-2xl font-Inter text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {inviteLoading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Invitation
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative bg-card border border-border rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-2xl font-Inter text-foreground">Delete Assessment?</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Are you sure you want to delete <span className="font-bold text-foreground">"{assessment.title}"</span>? All progress, questions, and reports will be permanently removed.
                                </p>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-6 py-3.5 border border-border rounded-2xl font-bold text-sm hover:bg-muted transition-all"
                                >
                                    Keep It
                                </button>
                                <button
                                    onClick={handleDeleteAssessment}
                                    disabled={deleteLoading}
                                    className="flex-1 px-6 py-3.5 bg-destructive text-destructive-foreground rounded-2xl font-Inter text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-destructive/20"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssessmentDetailPage;
