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
    LayoutGrid
} from 'lucide-react';
import { assessmentService } from '@/api/assessmentService';
import { invitationService, Invitation, InvitationStats } from '@/api/invitationService';
import { submissionService } from '@/api/submissionService';

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
    const [invitationFilter, setInvitationFilter] = useState<string>('');
    const [invitationSearch, setInvitationSearch] = useState('');

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Scroll state for sticky nav animation
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        try {
            const response = await invitationService.uploadCsvInvites(assessmentId, file);
            alert(response.data.message || 'Invitations processed successfully!');
            fetchInvitations();
            fetchInvitationStats();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Failed to upload CSV invites');
        }
    };

    // ========== HANDLERS ==========

    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        setInviteLoading(true);
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
        } catch (error) {
            alert('Failed to send invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleResendInvitation = async (id: string) => {
        try {
            await invitationService.resendInvitation(id);
            alert('Invitation resent!');
        } catch (error) {
            console.error('Failed to resend:', error);
        }
    };

    const handleCancelInvitation = async (id: string) => {
        if (!confirm('Cancel this invitation?')) return;
        try {
            await invitationService.cancelInvitation(id);
            fetchInvitations();
            fetchInvitationStats();
        } catch (error) {
            console.error('Failed to cancel:', error);
        }
    };

    const handleDeleteInvitation = async (id: string) => {
        if (!confirm('Permanently delete this invitation? This action cannot be undone.')) return;
        try {
            await invitationService.deleteInvitation(id);
            fetchInvitations();
            fetchInvitationStats();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete invitation');
        }
    };

    const handleDeleteAssessment = async () => {
        setDeleteLoading(true);
        try {
            await assessmentService.deleteAssessment(assessmentId);
            router.push('/organizer/assessments');
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

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'invitations', label: 'Invitations', icon: <Mail size={18} /> },
        { id: 'participants', label: 'Participants', icon: <Users size={18} /> },
        { id: 'monitoring', label: 'Monitoring', icon: <Eye size={18} /> },
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
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
                        onClick={() => router.push('/organizer/assessments')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
                            onClick={() => router.push('/organizer/assessments')}
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
                                    onClick={() => router.push(`/organizer/new-assessment?edit=${assessmentId}`)}
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
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-95 transition-all shadow-lg shadow-primary/25"
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

            <main className="max-w-[1500px] mx-auto p-6 md:p-10 space-y-8">
                {/* Hero Header Section */}
                <div className="relative overflow-hidden rounded-[1rem] bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-xl group">
                    {/* Modern Clean Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

                    <div className="relative z-10 p-8 md:p-10 flex flex-col xl:flex-row gap-10 items-start justify-between">
                        {/* Left Column: Info */}
                        <div className="flex-1 space-y-6 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm border-primary-foreground/20 text-primary-foreground bg-primary-foreground/10`}>
                                    {assessment.status}
                                </span>
                                <div className="h-4 w-px bg-primary-foreground/20" />
                                <span className="text-primary-foreground/90 text-xs font-bold flex items-center gap-2">
                                    <Calendar size={14} className="text-primary-foreground" />
                                    Created on {new Date(assessment.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-primary-foreground">
                                    {assessment.title}
                                </h1>
                                <p className="text-base md:text-lg text-primary-foreground/90 leading-relaxed max-w-2xl font-medium">
                                    {assessment.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/80">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10 border border-primary-foreground/10">
                                    <Clock size={14} className="text-primary-foreground" />
                                    <span className="font-semibold text-primary-foreground">{assessment.duration} min</span> duration
                                </span>
                                <span className="hidden sm:inline text-primary-foreground/20">•</span>
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10 border border-primary-foreground/10">
                                    <LayoutGrid size={14} className="text-primary-foreground" />
                                    <span className="font-semibold text-primary-foreground">{assessment.sections?.length || 0} sections</span>
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Stats & Actions */}
                        <div className="flex flex-col gap-5 w-full xl:w-auto min-w-[320px]">
                            {/* Updated Stats Strip - Cleaner */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/10 flex flex-col items-center justify-center gap-1 text-center hover:bg-primary-foreground/20 transition-colors">
                                    <div className="text-2xl font-bold text-primary-foreground">{invitationStats?.total || 0}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-primary-foreground/80">Candidates</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/10 flex flex-col items-center justify-center gap-1 text-center hover:bg-primary-foreground/20 transition-colors">
                                    <div className="text-2xl font-bold text-primary-foreground">{assessment.totalQuestions}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-primary-foreground/80">Questions</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/10 flex flex-col items-center justify-center gap-1 text-center hover:bg-primary-foreground/20 transition-colors">
                                    <div className="text-2xl font-bold text-primary-foreground">{assessment.totalMarks}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-primary-foreground/80">Marks</div>
                                </div>
                            </div>

                            {/* Active Window Banner */}
                            <div className="p-5 rounded-3xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-full bg-primary-foreground text-primary shadow-sm">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80">Active Until</div>
                                        <div className="text-sm font-bold text-primary-foreground">
                                            {new Date(assessment.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold bg-primary-foreground text-primary px-3 py-1 rounded-full shadow-sm">
                                    {Math.ceil((new Date(assessment.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabbed Navigation */}
                <div className="space-y-8">
                    <div
                        className={`sticky top-16 z-40 -mx-6 px-6 md:-mx-10 md:px-10 transition-all duration-300 
                            `}
                    >
                        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide relative min-w-0">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`relative flex items-center gap-2.5 px-5 py-2.5 font-bold text-sm transition-all whitespace-nowrap rounded-xl ${isActive
                                                ? 'text-primary-foreground bg-primary shadow-lg shadow-primary/30'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                }`}
                                        >
                                            {tab.icon}
                                            <span>{tab.label}</span>
                                            {tab.id === 'invitations' && invitationStats && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {invitationStats.total}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Action Bar */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: isScrolled ? 1 : 0, x: isScrolled ? 0 : 20 }}
                                transition={{ duration: 0.3 }}
                                className="hidden lg:flex items-center gap-3 shrink-0"
                            >
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {assessment.status}
                                </span>
                                {assessment.status === 'DRAFT' && (
                                    <button
                                        onClick={handlePublish}
                                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Publish
                                    </button>
                                )}
                            </motion.div>
                        </div>
                    </div>


                    {/* Content Area */}
                    <div className="min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                {activeTab === 'overview' && <OverviewTab assessment={assessment} />}
                                {activeTab === 'invitations' && (
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
                                    />
                                )}
                                {activeTab === 'participants' && <ParticipantsTab assessmentId={assessmentId} />}
                                {activeTab === 'monitoring' && <MonitoringTab assessmentId={assessmentId} />}
                                {activeTab === 'reports' && <AssessmentReportsTab assessmentId={assessmentId} assessment={assessment} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
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
                                    <h3 className="text-2xl font-black text-foreground">Send Invite</h3>
                                    <p className="text-sm text-muted-foreground">Invite a participant via email</p>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 px-4 text-sm outline-none transition-all font-medium"
                                        placeholder="candidate@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name (Optional)</label>
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
                                    className="flex-[1.5] px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
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
                                <h3 className="text-2xl font-black text-foreground">Delete Assessment?</h3>
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
                                    className="flex-1 px-6 py-3.5 bg-destructive text-destructive-foreground rounded-2xl font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-destructive/20"
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