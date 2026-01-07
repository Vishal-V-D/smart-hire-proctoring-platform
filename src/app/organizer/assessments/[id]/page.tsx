"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Shield,
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    Eye,
    Camera,
    Monitor,
    Mic,
    AlertTriangle,
    Code,
    Type,
    Edit,
    Trash2,
    Mail,
    Users,
    BarChart3,
    Send,
    X,
    Plus,
    RefreshCw,
    RefreshCcw,
    Search,
    Filter,
    Play,
    Activity,
    UserCheck,
    UserX,
    Download,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    MoreVertical
} from 'lucide-react';
import { assessmentService } from '@/api/assessmentService';
import { invitationService, Invitation, InvitationStats } from '@/api/invitationService';
import CodingQuestionDisplay from '@/app/organizer/new-assessment/components/CodingQuestionDisplay';

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
    // Coding question fields
    problemId?: string;
    problemData?: any;
    problem?: any; // Added for compatibility
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
    problems?: any[]; // Coding problems are in a separate array
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

    // ========== FETCH DATA ==========

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
        }
    }, [assessmentId]);

    useEffect(() => {
        if (assessmentId && activeTab === 'invitations') {
            fetchInvitations();
            fetchInvitationStats();
        }
    }, [assessmentId, activeTab, invitationFilter]);

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
            console.error('Failed to send invitation:', error);
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

    const handleDeleteAssessment = async () => {
        setDeleteLoading(true);
        try {
            await assessmentService.deleteAssessment(assessmentId);
            router.push('/organizer/assessments');
        } catch (error) {
            console.error('Failed to delete:', error);
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

    // ========== HELPERS ==========

    const getQuestionTypeIcon = (type: string) => {
        switch (type) {
            case 'coding': return <Code size={16} className="text-emerald-500" />;
            case 'single_choice': return <CheckCircle size={16} className="text-blue-500" />;
            case 'multiple_choice': return <CheckCircle size={16} className="text-purple-500" />;
            case 'fill_in_the_blank': return <Type size={16} className="text-orange-500" />;
            default: return <FileText size={16} className="text-muted-foreground" />;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'Hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'PUBLISHED': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'ARCHIVED': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getInvitationStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-600';
            case 'sent': return 'bg-blue-500/10 text-blue-600';
            case 'accepted': return 'bg-green-500/10 text-green-600';
            case 'expired': return 'bg-gray-500/10 text-gray-600';
            case 'cancelled': return 'bg-red-500/10 text-red-600';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    // ========== TABS CONFIG ==========

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <FileText size={18} /> },
        { id: 'invitations', label: 'Invitations', icon: <Mail size={18} /> },
        { id: 'participants', label: 'Participants', icon: <Users size={18} /> },
        { id: 'monitoring', label: 'Monitoring', icon: <Eye size={18} /> },
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    ];

    // ========== LOADING & ERROR STATES ==========

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-bold text-foreground">Assessment not found</p>
                    <button
                        onClick={() => router.push('/organizer/assessments')}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                    >
                        Back to Assessments
                    </button>
                </div>
            </div>
        );
    }

    // ========== RENDER ==========

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push('/organizer/assessments')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back to Assessments</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {assessment.status === 'DRAFT' && (
                            <>
                                <button
                                    onClick={() => router.push(`/organizer/new-assessment?edit=${assessmentId}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-bold transition-all"
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                                >
                                    <Play size={16} />
                                    Publish
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                        >
                            <Send size={16} />
                            Send Invites
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-bold transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Assessment Title Bar */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="text-primary" size={28} />
                                <h1 className="text-3xl font-black text-foreground">{assessment.title}</h1>
                            </div>
                            <p className="text-muted-foreground">{assessment.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-md border ${getStatusBadge(assessment.status)}`}>
                            {assessment.status}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.id === 'invitations' && invitationStats && (
                                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-bold">
                                    {invitationStats.total}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <OverviewTab
                                assessment={assessment}
                                getQuestionTypeIcon={getQuestionTypeIcon}
                                getDifficultyColor={getDifficultyColor}
                            />
                        )}
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
                                onInvite={() => setShowInviteModal(true)}
                                getStatusColor={getInvitationStatusColor}
                            />
                        )}
                        {activeTab === 'participants' && <ParticipantsTab assessmentId={assessmentId} />}
                        {activeTab === 'monitoring' && <MonitoringTab assessmentId={assessmentId} />}
                        {activeTab === 'reports' && <ReportsTab assessmentId={assessmentId} assessment={assessment} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground">Send Invitation</h3>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-2 block">Email *</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-2 block">Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInvite}
                                    disabled={!inviteEmail || inviteLoading}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {inviteLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <Trash2 className="text-destructive" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">Delete Assessment?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        This will permanently delete "{assessment.title}" and all its data. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAssessment}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ========== OVERVIEW TAB ==========

const OverviewTab = ({ assessment, getQuestionTypeIcon, getDifficultyColor }: any) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Debug log for incoming data
    useEffect(() => {
        console.log('='.repeat(60));
        console.log('🔍 [OVERVIEW TAB] Incoming Assessment Data:');
        console.log('Assessment ID:', assessment?.id);
        console.log('Assessment Title:', assessment?.title);
        console.log('Total Sections:', assessment?.sections?.length);
        console.log('='.repeat(60));

        assessment?.sections?.forEach((section: any, sIndex: number) => {
            console.log(`\n📂 Section ${sIndex + 1}: "${section.title}" (ID: ${section.id})`);
            console.log('   Type:', section.type);
            console.log('   Difficulty:', section.difficulty);
            console.log('   Questions Count:', section.questions?.length);

            section.questions?.forEach((question: any, qIndex: number) => {
                console.log(`\n   💡 Question ${qIndex + 1}:`, question.id);
                console.log('      Type:', question.type);
                console.log('      Text:', question.text?.substring(0, 50) + '...');
                console.log('      Has problemData:', !!question.problemData);
                console.log('      Has problem:', !!question.problem);
                console.log('      ProblemId:', question.problemId);

                if (question.problem) {
                    console.log('      📦 PROBLEM DATA:');
                    console.log('         Title:', question.problem.title);
                    console.log('         Difficulty:', question.problem.difficulty);
                    console.log('         Description Length:', question.problem.description?.length);
                    console.log('         TopicTags:', question.problem.topicTags);
                    console.log('         ExampleTestcases:', question.problem.exampleTestcases?.length);
                    console.log('         StarterCode Keys:', Object.keys(question.problem.starterCode || {}));
                }
            });
        });
        console.log('='.repeat(60));
    }, [assessment]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedSections(new Set(assessment.sections.map((s: Section) => s.id)));
    };

    const collapseAll = () => {
        setExpandedSections(new Set());
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Shield size={16} />
                        <span className="text-xs font-medium">Sections</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">{assessment.totalSections}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText size={16} />
                        <span className="text-xs font-medium">Questions / Problems</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {assessment.sections?.reduce((total: number, section: Section) =>
                            total + (section.questions?.length || 0) + (section.problems?.length || 0), 0) || assessment.totalQuestions || 0}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle size={16} />
                        <span className="text-xs font-medium">Total Marks</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">{assessment.totalMarks}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock size={16} />
                        <span className="text-xs font-medium">Duration</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">{assessment.totalTime || assessment.duration}m</p>
                </div>
            </div>

            {/* Dates */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={14} />
                        <span>Start: <span className="font-bold text-foreground">{new Date(assessment.startDate).toLocaleString()}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={14} />
                        <span>End: <span className="font-bold text-foreground">{new Date(assessment.endDate).toLocaleString()}</span></span>
                    </div>
                </div>
            </div>

            {/* Proctoring Settings */}
            {assessment.proctoringSettings?.enabled && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Eye size={20} className="text-primary" />
                        Proctoring Settings
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {assessment.proctoringSettings.camera && (
                            <div className="flex items-center gap-2 text-sm">
                                <Camera size={14} className="text-green-500" />
                                <span>Camera Required</span>
                            </div>
                        )}
                        {assessment.proctoringSettings.mic && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mic size={14} className="text-green-500" />
                                <span>Microphone</span>
                            </div>
                        )}
                        {assessment.proctoringSettings.fullscreen && (
                            <div className="flex items-center gap-2 text-sm">
                                <Monitor size={14} className="text-green-500" />
                                <span>Fullscreen Mode</span>
                            </div>
                        )}
                        {assessment.proctoringSettings.screenRecord && (
                            <div className="flex items-center gap-2 text-sm">
                                <Monitor size={14} className="text-green-500" />
                                <span>Screen Recording</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sections with Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Sections & Questions</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {assessment.sections.map((section: Section, sectionIndex: number) => {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sectionIndex * 0.05 }}
                            className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                            {/* Section Header - Clickable */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                                        style={{ backgroundColor: section.themeColor || '#6366f1' }}
                                    >
                                        {sectionIndex + 1}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-foreground">{section.title}</h3>
                                        <p className="text-sm text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getDifficultyColor(section.difficulty)}`}>
                                            {section.difficulty}
                                        </span>
                                        <span className="font-medium">
                                            {section.type === 'coding' || (section.problems && section.problems.length > 0)
                                                ? `${section.problems?.length || 0} Problems`
                                                : `${section.questions?.length || 0} Q`}
                                        </span>
                                        <span>•</span>
                                        <span>{section.timeLimit}m</span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp size={20} className="text-muted-foreground" />
                                    ) : (
                                        <ChevronDown size={20} className="text-muted-foreground" />
                                    )}
                                </div>
                            </button>

                            {/* Questions - Collapsible */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="p-4 space-y-4 bg-muted/20">
                                            {/* Style Injection for Markdown Images */}
                                            <style jsx global>{`
                                                .markdown-content img {
                                                    max-width: 450px !important;
                                                    width: 100%;
                                                    height: auto;
                                                    border-radius: 0.5rem;
                                                    border: 1px solid hsl(var(--border));
                                                    margin: 1rem 0;
                                                    display: block;
                                                }
                                            `}</style>

                                            {/* Check if section has any content */}
                                            {(section.questions?.length === 0 && (!section.problems || section.problems.length === 0)) ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No questions in this section</p>
                                            ) : (
                                                <>
                                                    {/* Render coding problems from problems array */}
                                                    {section.problems && section.problems.length > 0 && (
                                                        section.problems.map((problemLink: any, pIndex: number) => {
                                                            // The actual problem data is nested inside problemLink.problem
                                                            const problem = problemLink.problem || problemLink;

                                                            console.log(`🔍 [OVERVIEW] Rendering problem ${pIndex + 1}:`, {
                                                                linkId: problemLink.id,
                                                                problemId: problem.id,
                                                                title: problem.title,
                                                                hasDescription: !!problem.description,
                                                                descriptionLength: problem.description?.length,
                                                                difficulty: problem.difficulty,
                                                                topicTags: problem.topicTags,
                                                                exampleTestcases: problem.exampleTestcases?.length
                                                            });

                                                            const problemData = {
                                                                id: problem.id,
                                                                title: problem.title || `Coding Problem ${pIndex + 1}`,
                                                                titleSlug: problem.titleSlug,
                                                                content: problem.description || problem.content,
                                                                description: problem.description || problem.content,
                                                                difficulty: problem.difficulty || section.difficulty,
                                                                topicTags: problem.topicTags || problem.tags?.map((t: string) => ({ name: t, slug: t.toLowerCase().replace(/\s+/g, '-') })) || [],
                                                                starterCode: problem.starterCode || {},
                                                                exampleTestcases: problem.exampleTestcases || [],
                                                                hiddenTestcases: problem.hiddenTestcases || []
                                                            };
                                                            return (
                                                                <div key={problem.id || pIndex} className="mb-4">
                                                                    <CodingQuestionDisplay
                                                                        problem={problemData}
                                                                        questionNumber={pIndex + 1}
                                                                        marks={problemLink.marks || section.marksPerQuestion || 10}
                                                                    />
                                                                </div>
                                                            );
                                                        })
                                                    )}

                                                    {/* Render MCQ/regular questions */}
                                                    {section.questions && section.questions.length > 0 && section.type !== 'coding' && (
                                                        section.questions.map((question: Question, qIndex: number) => (
                                                            <div key={question.id} className="bg-background border border-border rounded-lg p-4 mb-3">
                                                                {/* Question Header */}
                                                                <div className="flex items-start gap-3 mb-3">
                                                                    <div className="flex items-center justify-center w-7 h-7 bg-primary/10 text-primary rounded-lg font-bold text-sm shrink-0">
                                                                        {qIndex + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            {getQuestionTypeIcon(question.type)}
                                                                            <span className="text-xs font-medium text-muted-foreground capitalize">
                                                                                {question.type.replace(/_/g, ' ')}
                                                                            </span>
                                                                            <span className="text-xs font-bold text-primary ml-auto">
                                                                                {question.marks} marks
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-foreground font-medium">{question.text}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Question Image */}
                                                                {question.image && (
                                                                    <div className="ml-10 mb-3">
                                                                        <img
                                                                            src={question.image}
                                                                            alt="Question"
                                                                            className="max-w-md rounded-lg border border-border"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Options */}
                                                                {question.options && question.options.length > 0 && (
                                                                    <div className="ml-10 space-y-2">
                                                                        {question.options.map((option: string, optIndex: number) => {
                                                                            const optIndexStr = String(optIndex);
                                                                            const isCorrect =
                                                                                question.correctAnswer === optIndexStr ||
                                                                                question.correctAnswer === option ||
                                                                                (Array.isArray(question.correctAnswer) && (
                                                                                    question.correctAnswer.includes(optIndexStr) ||
                                                                                    question.correctAnswer.includes(option)
                                                                                ));
                                                                            return (
                                                                                <div
                                                                                    key={optIndex}
                                                                                    className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${isCorrect
                                                                                        ? 'bg-green-500/10 border border-green-500/20'
                                                                                        : 'bg-muted/50'
                                                                                        }`}
                                                                                >
                                                                                    <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                                                        {String.fromCharCode(65 + optIndex)}.
                                                                                    </span>
                                                                                    <span className={isCorrect ? 'font-medium text-green-700' : 'text-foreground'}>
                                                                                        {option}
                                                                                    </span>
                                                                                    {isCorrect && (
                                                                                        <CheckCircle size={14} className="ml-auto text-green-600" />
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Code Stub */}
                                                                {question.codeStub && (
                                                                    <div className="ml-10 mt-3">
                                                                        <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto">
                                                                            <code>{question.codeStub}</code>
                                                                        </pre>
                                                                    </div>
                                                                )}

                                                                {/* Fill in the Blank Answer */}
                                                                {question.type === 'fill_in_the_blank' && question.correctAnswer && (
                                                                    <div className="ml-10 mt-3 flex items-center gap-2 text-sm">
                                                                        <span className="text-muted-foreground">Answer:</span>
                                                                        <span className="font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded">
                                                                            {question.correctAnswer}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}

                                                    {/* Render coding questions from questions array (if section type is coding) */}
                                                    {section.type === 'coding' && section.questions && section.questions.length > 0 && (
                                                        section.questions.map((question: Question, qIndex: number) => {
                                                            const rawProblem = question.problem || question.problemData || question;
                                                            const problemData = {
                                                                id: rawProblem.id || question.id,
                                                                title: rawProblem.title || `Coding Problem ${qIndex + 1}`,
                                                                titleSlug: rawProblem.titleSlug,
                                                                content: rawProblem.description || rawProblem.content || question.text,
                                                                description: rawProblem.description || rawProblem.content || question.text,
                                                                difficulty: rawProblem.difficulty || section.difficulty,
                                                                topicTags: rawProblem.topicTags || [],
                                                                starterCode: rawProblem.starterCode || {},
                                                                exampleTestcases: rawProblem.exampleTestcases || [],
                                                                hiddenTestcases: rawProblem.hiddenTestcases || []
                                                            };
                                                            return (
                                                                <div key={question.id} className="mb-4">
                                                                    <CodingQuestionDisplay
                                                                        problem={problemData}
                                                                        questionNumber={qIndex + 1}
                                                                        marks={question.marks}
                                                                    />
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div >
        </div >
    );
};

// ========== INVITATIONS TAB ==========

const InvitationsTab = ({ invitations, stats, filter, setFilter, search, setSearch, onSearch, onResend, onCancel, onInvite, getStatusColor }: any) => (
    <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Sent</p>
                    <p className="text-2xl font-black text-blue-600">{stats.sent}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Accepted</p>
                    <p className="text-2xl font-black text-green-600">{stats.accepted}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Expired</p>
                    <p className="text-2xl font-black text-gray-600">{stats.expired}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-black text-foreground">{stats.total}</p>
                </div>
            </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
            <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none"
                />
            </div>
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
            >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <button
                onClick={onInvite}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
            >
                <Plus size={18} />
                Invite
            </button>
        </div>

        {/* Invitations Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {invitations.length === 0 ? (
                <div className="p-12 text-center">
                    <Mail size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-bold text-foreground">No invitations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send invitations to participants</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</th>
                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sent At</th>
                            <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invitations.map((inv: Invitation) => (
                            <tr key={inv.id} className="hover:bg-muted/30">
                                <td className="py-3 px-4 text-sm font-medium">{inv.email}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{inv.name || '-'}</td>
                                <td className="py-3 px-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                    {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {inv.status !== 'accepted' && inv.status !== 'cancelled' && (
                                            <button
                                                onClick={() => onResend(inv.id)}
                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                title="Resend"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        )}
                                        {inv.status !== 'cancelled' && inv.status !== 'accepted' && (
                                            <button
                                                onClick={() => onCancel(inv.id)}
                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
);

// ========== PARTICIPANTS TAB ==========

const ParticipantsTab = ({ assessmentId }: { assessmentId: string }) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

    useEffect(() => {
        fetchParticipants();
    }, [assessmentId, pagination.page]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
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
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        <span className="font-bold text-foreground">Participants</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                            {pagination.total}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchParticipants()}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>

                {participants.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-bold text-foreground">No Participants Yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Participants will appear here once they accept their invitations.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3">#</th>
                                    <th className="text-left px-4 py-3">Participant</th>
                                    <th className="text-left px-4 py-3">Username</th>
                                    <th className="text-center px-4 py-3">Invited At</th>
                                    <th className="text-center px-4 py-3">Accepted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {participants.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-muted-foreground">
                                            {(pagination.page - 1) * pagination.limit + idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">
                                                    {p.user?.fullName || p.invitationName || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.user?.email || p.invitationEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {p.user?.username || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {p.acceptedAt ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
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
        </div>
    );
};

// ========== MONITORING TAB ==========

// Mapping of violation types to display labels
const VIOLATION_TYPE_LABELS: Record<string, string> = {
    'THIRD_EYE': '3rd Eye',
    'SCREEN_COUNT': 'Screen Count',
    'FULLSCREEN_EXIT': 'Full Screen Exit',
    'SAFE_BROWSER': 'Safe Browser',
    'DESKTOP_APPS': 'Control Desktop Apps',
    'WINDOW_SWAP': 'Window Swap',
    'TAB_SWITCH': 'Tab Switch',
    'BLUETOOTH_AUDIO': 'Bluetooth/Audio',
    'FALSE_FACE': 'False Face',
    'NO_FACE': 'No Face',
    'MULTIPLE_PEOPLE': 'Multiple People',
    'BLANK_FEED': 'Blank Feed',
    'LOOKING_AWAY': 'Looking Away',
    'PROCTOR_FEED': 'Proctor Feed to User',
    'ROOM_SCAN': 'Room Scan Request',
    'RESTRICTED_OBJECT': 'Prohibited Object',
};

// All violation types in display order
const ALL_VIOLATION_TYPES = [
    'THIRD_EYE',
    'SCREEN_COUNT',
    'FULLSCREEN_EXIT',
    'SAFE_BROWSER',
    'DESKTOP_APPS',
    'WINDOW_SWAP',
    'TAB_SWITCH',
    'BLUETOOTH_AUDIO',
    'FALSE_FACE',
    'NO_FACE',
    'MULTIPLE_PEOPLE',
    'BLANK_FEED',
    'LOOKING_AWAY',
    'PROCTOR_FEED',
    'ROOM_SCAN',
    'RESTRICTED_OBJECT',
];

const MonitoringTab = ({ assessmentId }: { assessmentId: string }) => {
    const [loading, setLoading] = useState(true);
    const [violationCounts, setViolationCounts] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        ALL_VIOLATION_TYPES.forEach(type => {
            initial[type] = 0;
        });
        return initial;
    });
    const [lastPolled, setLastPolled] = useState<string | null>(null);
    const [activeCandidates, setActiveCandidates] = useState<Record<string, {
        id: string;
        name: string;
        email?: string;
        violations: number;
        status: string;
        progress: number;
        lastUpdate: number;
    }>>({});
    const [recentActivity, setRecentActivity] = useState<{
        id: string;
        name: string;
        type: string;
        timestamp: string;
    }[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [invitedCount, setInvitedCount] = useState(0);
    const [statsTotal, setStatsTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Derive total violations from individual counts
    // For sidebar we keep using the dynamic counts, but for the Top Card we use the static statsTotal
    const sidebarTotalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);
    const activeSessions = Object.keys(activeCandidates).length;

    // Fetch initial stats
    const fetchStats = async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);
            else setLoading(true);

            console.log(`📊 [STATS] Fetching violation stats for assessment ${assessmentId}...`);
            const response = await assessmentService.getViolationStats(assessmentId);

            // Handle both response structures: response.data.stats or response.data directly containing stats
            const responseData = response.data;
            const stats = responseData?.stats || responseData;

            if (stats && (stats.total !== undefined || stats.byType)) {
                console.log(`✅ [STATS] Stats loaded:`, stats);

                setStatsTotal(stats.total || 0);

                // Update counts from API
                const newCounts: Record<string, number> = {};
                ALL_VIOLATION_TYPES.forEach(type => {
                    newCounts[type] = stats.byType?.[type as keyof typeof stats.byType] || 0;
                });

                // Add any dynamic types not in our list
                if (stats.byType) {
                    Object.entries(stats.byType).forEach(([type, count]) => {
                        const normalizedType = type.toUpperCase().replace(/\s+/g, '_');
                        if (!ALL_VIOLATION_TYPES.includes(normalizedType)) {
                            newCounts[normalizedType] = count as number;
                            if (!VIOLATION_TYPE_LABELS[normalizedType]) {
                                VIOLATION_TYPE_LABELS[normalizedType] = type;
                            }
                            ALL_VIOLATION_TYPES.push(normalizedType);
                        }
                    });
                }
                setViolationCounts(newCounts);
            }
            if (!isManual) setLastPolled(new Date().toISOString());
        } catch (error: any) {
            console.error('❌ [STATS] Failed to fetch violation stats:', error);
            console.error('❌ [STATS] Error details:', error?.response?.data || error?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [assessmentId]);

    // Poll for realtime updates every 5 seconds
    useEffect(() => {
        if (!lastPolled) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await assessmentService.getViolationsRealtime(assessmentId, lastPolled);

                // Log detailed info as requested
                if (response.data) {
                    console.log(`📤 [REALTIME] Response from server:`, response.data);
                }

                if (response.data?.violations && response.data.violations.length > 0) {
                    // console.log(`🚨 [REALTIME] Received ${response.data.violations.length} new violations`);
                    // Update global counts and candidate info
                    setViolationCounts(prev => {
                        const newCounts = { ...prev };
                        const newCandidates = { ...activeCandidates };

                        response.data.violations.forEach((v: any) => {
                            // Normalized type mapping for consistency
                            const normalizedType = v.type?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN';

                            // Update global breakdown
                            newCounts[normalizedType] = (newCounts[normalizedType] || 0) + 1;

                            // Update dynamic labels if typeName provided
                            if (v.typeName && !VIOLATION_TYPE_LABELS[normalizedType]) {
                                VIOLATION_TYPE_LABELS[normalizedType] = v.typeName;
                            }

                            // Track unique candidate info
                            // Prioritize finding a stable ID: contestantId -> user.id -> session.id
                            const candidateId = v.contestantId || v.user?.id || v.sessionId || 'unknown';

                            // Determine display name: userName -> user.name -> contestantName -> 'Anonymous'
                            const displayName = v.userName || v.user?.name || v.user?.username || v.contestantName || 'Anonymous Candidate';
                            const displayEmail = v.userEmail || v.user?.email || '';

                            if (!newCandidates[candidateId]) {
                                newCandidates[candidateId] = {
                                    id: candidateId,
                                    name: displayName,
                                    email: displayEmail,
                                    violations: 0,
                                    status: 'active',
                                    progress: 0, // Not available in realtime feed yet
                                    lastUpdate: Date.now()
                                } as any;
                            } else {
                                // Update name if we have a better one now
                                if (displayName !== 'Anonymous Candidate' && newCandidates[candidateId].name === 'Anonymous Candidate') {
                                    newCandidates[candidateId].name = displayName;
                                }
                                if (displayEmail && !newCandidates[candidateId].email) {
                                    newCandidates[candidateId].email = displayEmail;
                                }
                            }
                            newCandidates[candidateId].violations++;
                            newCandidates[candidateId].lastUpdate = Date.now();

                            // Add to recent activity
                            const activityItem = {
                                id: v.id || Math.random().toString(),
                                name: displayName,
                                type: normalizedType,
                                typeName: v.typeName, // Use pretty name from backend if available
                                timestamp: v.timestamp || new Date().toISOString(),
                                timeAgo: v.timeAgo,
                                metadata: v.metadata
                            };

                            setRecentActivity(prev => [activityItem, ...prev].slice(0, 50)); // Keep last 50
                        });

                        setActiveCandidates(newCandidates);
                        return newCounts;
                    });
                }

                // Update timestamp for next poll (prefer lastTimestamp, then serverTimestamp, then legacy timestamp)
                const nextTimestamp = response.data?.lastTimestamp || response.data?.serverTimestamp || response.data?.timestamp;
                if (nextTimestamp) {
                    setLastPolled(nextTimestamp);
                }
            } catch (error) {
                console.error('Failed to poll violations:', error);
            }
        }, 3000); // Poll every 3 seconds for faster updates

        return () => clearInterval(pollInterval);
    }, [assessmentId, lastPolled, violationCounts]);

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                            <Activity size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground">{activeSessions}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Live now
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Violations</p>
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground">
                            {loading ? '-' : statsTotal}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all candidates
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                            <UserCheck size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground">{completedCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            / {invitedCount} Invited
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Proctor Status</p>
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Shield size={18} />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground">Active</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            System optimal
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Candidates List */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Live Candidates
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchStats(true)}
                                disabled={refreshing}
                                className={`p-1.5 hover:bg-muted rounded-md transition-all ${refreshing ? 'animate-spin opacity-50' : ''}`}
                                title="Refresh Dashboard"
                            >
                                <RefreshCcw size={14} />
                            </button>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live Feed
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-xs uppercase font-bold text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-5 py-3">Candidate</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Progress</th>
                                    <th className="px-5 py-3">Violations</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    // Skeleton Loader
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted" />
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-24 bg-muted rounded" />
                                                        <div className="h-2 w-16 bg-muted rounded" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4"><div className="h-4 w-12 bg-muted rounded-full" /></td>
                                            <td className="px-5 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                                            <td className="px-5 py-4"><div className="h-4 w-16 bg-muted rounded-full" /></td>
                                            <td className="px-5 py-4 text-right"><div className="h-4 w-8 bg-muted rounded ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : activeSessions === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                            <Users size={40} className="mx-auto opacity-20 mb-2" />
                                            <p className="text-xs font-medium">No active sessions detected yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    Object.values(activeCandidates)
                                        .sort((a, b) => b.lastUpdate - a.lastUpdate)
                                        .map((candidate) => (
                                            <tr key={candidate.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {candidate.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{candidate.name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">{candidate.id.substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
                                                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                        Live
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="w-24">
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: '45%' }} />
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-1">45% Progress</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${candidate.violations > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                        {candidate.violations} Violations
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button className="text-[10px] font-bold text-primary hover:underline">View Feed</button>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Violations Breakdown Panel */}
                <div className="lg:col-span-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-border">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Violations Monitor
                            <span className="ml-auto text-xs text-muted-foreground font-normal">
                                Total: {loading ? '-' : sidebarTotalViolations}
                            </span>
                        </h3>
                    </div>
                    <div className="p-0 overflow-y-auto max-h-[500px] custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Loading stats...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-px bg-border">
                                {ALL_VIOLATION_TYPES.map((type) => {
                                    const count = violationCounts[type] || 0;
                                    const isActive = count > 0;
                                    return (
                                        <div
                                            key={type}
                                            className={`flex items-center justify-between p-3 bg-card hover:bg-muted/20 transition-colors ${isActive ? 'bg-amber-500/5' : ''}`}
                                        >
                                            <span className={`text-xs font-medium ${isActive ? 'text-amber-700 font-bold' : 'text-muted-foreground'}`}>
                                                {VIOLATION_TYPE_LABELS[type] || type}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500/20 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="lg:col-span-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-5 border-b border-border">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Activity size={18} className="text-emerald-500" />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {recentActivity.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <Clock size={32} className="opacity-20 mb-2" />
                                <p className="text-xs">Waiting for live data...</p>
                            </div>
                        ) : (
                            recentActivity.map((activity: any) => (
                                <div key={activity.id} className="flex gap-3 border-l-2 border-primary/20 pl-3 py-1">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-foreground">{activity.name}</p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {activity.timeAgo || new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-amber-600 mt-0.5 flex items-center gap-1">
                                            {activity.typeName || VIOLATION_TYPE_LABELS[activity.type] || activity.type}
                                            {activity.metadata?.count > 1 && (
                                                <span className="px-1 py-0.5 rounded bg-amber-500/20 text-[9px] font-bold">
                                                    x{activity.metadata.count}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========== REPORTS TAB ==========

const ReportsTab = ({ assessmentId, assessment }: { assessmentId: string; assessment: AssessmentDetail }) => {
    const router = useRouter();
    const [participants, setParticipants] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [violationStats, setViolationStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'evaluated'>('all');
    const [search, setSearch] = useState('');
    const [tableFilter, setTableFilter] = useState(''); // Local filter for table rows
    const [filterColumn, setFilterColumn] = useState<string>('all'); // Column to filter by
    const [sortBy, setSortBy] = useState<'totalScore' | 'submittedAt' | 'percentage'>('totalScore');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

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
                        console.log('📸 [Organizer Report] Photo URL:', photoUrl, 'for user:', p.registration?.fullName || p.contestantName);

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

                // Transform submissions data to match participants format
                const submissions = response.data.submissions || [];
                const transformedParticipants = submissions.map((sub: any) => {
                    // Extract section scores from submission data
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
                        codingProblems: sub.codingProblems || [], // Pass coding problems for test case stats
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
                // Both APIs failed - show empty state
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
            setStats({
                totalParticipants: 0,
                completed: 0,
                inProgress: 0,
                averageScore: 0,
                passRate: 0
            });
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
            {/* Stats Cards - Row 1 */}
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

            {/* Violation Stats */}
            {violationStats && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-amber-600" size={20} />
                            <span className="font-bold text-amber-800 dark:text-amber-200">Proctoring Summary</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <span className="text-amber-700 dark:text-amber-300">
                                Total Violations: <strong>{violationStats.totalViolations}</strong>
                            </span>
                            <span className="text-amber-700 dark:text-amber-300">
                                Participants Flagged: <strong>{violationStats.participantsWithViolations}</strong>
                            </span>
                            {violationStats.highRiskCount > 0 && (
                                <span className="text-red-600 font-bold">
                                    High Risk: {violationStats.highRiskCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-bold">Participant Reports</h3>
                    <div className="flex items-center gap-3">
                        {/* Column Filter Dropdown + Input */}
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
                                    placeholder={`Filter by ${filterableColumns.find(c => c.key === filterColumn)?.label || 'all'}...`}
                                    value={tableFilter}
                                    onChange={(e) => setTableFilter(e.target.value)}
                                    className="pl-7 pr-3 py-2 bg-transparent text-sm w-40 focus:outline-none"
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
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search API..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm w-40 focus:border-primary outline-none"
                            />
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
                            <option value="totalScore-DESC">Score (High to Low)</option>
                            <option value="totalScore-ASC">Score (Low to High)</option>
                            <option value="submittedAt-DESC">Latest First</option>
                            <option value="submittedAt-ASC">Oldest First</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={exporting || participants.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            <Download size={16} />
                            {exporting ? 'Exporting...' : 'Export CSV'}
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
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">#</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Participant</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Department</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border">Time</th>
                                    <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-blue-600 border-r border-border bg-blue-50/50" colSpan={2}>MCQ/Aptitude</th>
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
                                    <th className="text-center py-1 px-2 text-[10px] font-semibold text-muted-foreground border-r border-border bg-purple-50/30">Test Cases</th>

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

                                        // Get MCQ and Coding scores for filtering
                                        const mcqSecs = p.scores?.sectionScores?.filter((s: any) =>
                                            ['mcq', 'aptitude', 'quiz', 'multiple_choice', 'objective'].includes(s.sectionType?.toLowerCase())
                                        ) || [];
                                        const codingSecs = p.scores?.sectionScores?.filter((s: any) =>
                                            ['coding', 'programming', 'code'].includes(s.sectionType?.toLowerCase())
                                        ) || [];
                                        const mcqScore = mcqSecs.reduce((sum: number, s: any) => sum + (s.obtainedMarks || s.scored || s.score || 0), 0);
                                        const codingScore = codingSecs.reduce((sum: number, s: any) => sum + (s.obtainedMarks || s.scored || s.score || 0), 0);

                                        // Column values
                                        const columnValues: Record<string, string> = {
                                            name: (p.registration?.fullName || '').toLowerCase(),
                                            email: (p.registration?.email || '').toLowerCase(),
                                            department: (p.registration?.department || '').toLowerCase(),
                                            college: (p.registration?.college || '').toLowerCase(),
                                            status: (p.session?.status || '').toLowerCase().replace('_', ' '),
                                            plagiarism: String(p.plagiarism?.overallScore || ''),
                                            aiConfidence: String(p.plagiarism?.aiConfidence || ''),
                                            mcqScore: String(mcqScore),
                                            codingScore: String(codingScore),
                                            totalScore: String(p.scores?.totalScore || ''),
                                            percentage: String(p.scores?.percentage || ''),
                                            violations: String(p.violations?.totalCount || 0),
                                            verdict: (p.verdict?.status || '').toLowerCase(),
                                            rank: String(p.scores?.rank || ''),
                                        };

                                        // Filter by selected column or all columns
                                        if (filterColumn === 'all') {
                                            return Object.values(columnValues).some(val => val.includes(searchLower));
                                        } else {
                                            return columnValues[filterColumn]?.includes(searchLower) || false;
                                        }
                                    })
                                    .map((p, index) => {
                                        // Extract MCQ/Aptitude and Coding scores from sectionScores
                                        // Check for multiple possible type names: mcq, aptitude, quiz, multiple_choice
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

                                        // Calculate aggregated details for Test Cases
                                        let totalCodingTests = 0;
                                        let passedCodingTests = 0;
                                        // If codingProblems array exists, use it
                                        if (p.codingProblems && p.codingProblems.length > 0) {
                                            p.codingProblems.forEach((prob: any) => {
                                                totalCodingTests += (prob.totalTests || 0);
                                                passedCodingTests += (prob.passedTests || 0);
                                            });
                                        } else {
                                            // Fallback: try to infer from sections if problems not explicit (less accurate)
                                            // Just show -/- if no details
                                        }

                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-muted/30 cursor-pointer transition-colors"
                                                onClick={() => viewReport(p.participantId)}
                                            >
                                                <td className="py-3 px-4 text-sm font-medium border-r border-border">
                                                    {p.scores?.rank || index + 1}
                                                </td>
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
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusBadge(p.session?.status)}`}>
                                                        {p.session?.status?.replace('_', ' ') || '-'}
                                                    </span>
                                                </td>
                                                {/* Time Taken */}
                                                <td className="py-3 px-4 border-r border-border">
                                                    <span className="text-sm font-mono text-muted-foreground">
                                                        {formatDuration(p.session?.totalTimeTaken)}
                                                    </span>
                                                </td>
                                                {/* MCQ/Aptitude Scored */}
                                                <td className="py-3 px-2 text-center bg-blue-50/20">
                                                    <span className={`font-bold ${mcqTotal > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                                        {mcqTotal > 0 ? mcqObtained : '-'}
                                                    </span>
                                                </td>
                                                {/* MCQ/Aptitude Max */}
                                                <td className="py-3 px-2 text-center border-r border-border bg-blue-50/20">
                                                    <span className="text-muted-foreground">
                                                        {mcqTotal > 0 ? mcqTotal : '-'}
                                                    </span>
                                                </td>
                                                {/* Coding Scored */}
                                                <td className="py-3 px-2 text-center bg-purple-50/20">
                                                    <span className={`font-bold ${codingTotal > 0 ? 'text-purple-600' : 'text-muted-foreground'}`}>
                                                        {codingTotal > 0 ? codingObtained : '-'}
                                                    </span>
                                                </td>
                                                {/* Coding Max */}
                                                <td className="py-3 px-2 text-center border-r border-border bg-purple-50/20">
                                                    <span className="text-muted-foreground">
                                                        {codingTotal > 0 ? codingTotal : '-'}
                                                    </span>
                                                </td>
                                                {/* Coding Test Cases */}
                                                <td className="py-3 px-2 text-center border-r border-border bg-purple-50/20">
                                                    {totalCodingTests > 0 ? (
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            <span className="text-green-600 font-bold">{passedCodingTests}</span>
                                                            <span className="mx-0.5">/</span>
                                                            <span>{totalCodingTests}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
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

                                                {/* Total Scored */}
                                                <td className="py-3 px-2 text-center bg-green-50/20">
                                                    <span className="font-bold text-green-600">
                                                        {p.scores?.totalScore ?? '-'}
                                                    </span>
                                                </td>
                                                {/* Total Max */}
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
                                                <td className="py-3 px-4">
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
                                                <td className="py-3 px-4">
                                                    {p.verdict?.status ? (
                                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getVerdictBadge(p.verdict.status)}`}>
                                                            {p.verdict.status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            viewReport(p.participantId);
                                                        }}
                                                        className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition-colors"
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
        </div>
    );
};

export default AssessmentDetailPage;
