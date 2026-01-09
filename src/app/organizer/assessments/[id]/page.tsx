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
    Users,
    Settings,
    ChevronDown,
    MoreVertical,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Share2,
    Trash2,
    Eye,
    Globe,
    Lock,
    Edit3,
    Filter,
    UserX,
    ChevronUp,
    Image as ImageIcon,
    Code,
    Type,
    Edit,
    Mail,
    Play,
    Send,
    X,
    Plus,
    RefreshCw,
    RefreshCcw,
    Search,
    Activity,
    UserCheck,
    Camera,
    Mic,
    Monitor,
    LayoutGrid,
    List,
    Copy,
    ArrowUp,
    ArrowDown,
    SlidersHorizontal,
    Upload
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { assessmentService } from '@/api/assessmentService';
import { invitationService, Invitation, InvitationStats } from '@/api/invitationService';
import { submissionService } from '@/api/submissionService';
import CodingQuestionDisplay from '@/app/organizer/new-assessment/components/CodingQuestionDisplay';
import AssessmentReportsTab from './components/AssessmentReportsTab';

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

    // Code Submission Modal State
    const [selectedSubmission, setSelectedSubmission] = useState<{
        participant: any;
        section: any;
        problems: any[];
    } | null>(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    // ========== FETCH DATA ==========

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
            // Prefetch violation stats in the background for instant monitoring tab load
            assessmentService.getViolationStats(assessmentId)
                .then(response => {
                    console.log('✅ [PREFETCH] Violation stats prefetched successfully');
                })
                .catch(error => {
                    console.log('⚠️ [PREFETCH] Violation stats prefetch failed (non-critical):', error?.message);
                });
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

    const handleCsvUpload = async (file: File) => {
        const toastId = 'csv-upload'; // Simple ID if we had toast
        try {
            // Show loading state or toast
            console.log('Uploading CSV...', file.name);

            const response = await invitationService.uploadCsvInvites(assessmentId, file);
            console.log('CSV Upload Response:', response.data);

            alert(response.data.message || 'Invitations processed successfully!');
            fetchInvitations();
            fetchInvitationStats();
        } catch (error: any) {
            console.error('Failed to upload CSV:', error);
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
                                onCsvUpload={handleCsvUpload}
                                getStatusColor={getInvitationStatusColor}
                            />
                        )}
                        {activeTab === 'participants' && <ParticipantsTab assessmentId={assessmentId} />}
                        {activeTab === 'monitoring' && <MonitoringTab assessmentId={assessmentId} />}
                        {activeTab === 'reports' && <AssessmentReportsTab assessmentId={assessmentId} assessment={assessment} />}
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

const InvitationsTab = ({ invitations, stats, filter, setFilter, search, setSearch, onSearch, onResend, onCancel, onInvite, onCsvUpload, getStatusColor }: any) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onCsvUpload(file);
        }
        // Reset input so same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

    return (
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
                <div className="h-8 w-px bg-border mx-1"></div>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border text-foreground rounded-lg text-sm font-bold hover:bg-muted transition-colors"
                    title="Upload CSV to bulk invite"
                >
                    <Upload size={18} className="text-muted-foreground" />
                    Upload CSV
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
};

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
                                                    {p.user?.fullName || p.invitationName || p.user?.username || 'Anonymous'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.user?.email || p.invitationEmail}
                                                </span>
                                            </div>
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
    const [allViolations, setAllViolations] = useState<any[]>([]); // Store all violations for chart
    const [chartData, setChartData] = useState<any[]>([]);

    // Derive total violations from individual counts
    // For sidebar we keep using the dynamic counts, but for the Top Card we use the static statsTotal
    const sidebarTotalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);

    // Process violations data for area chart
    const processChartData = (violations: any[]) => {
        if (!violations || violations.length === 0) return [];

        // Group by 5-minute intervals
        const buckets: Record<string, { time: string; count: number; timestamp: number }> = {};

        violations.forEach(v => {
            const date = new Date(v.detectedAt || v.timestamp || v.createdAt);
            // Round down to nearest 5 min
            const minutes = Math.floor(date.getMinutes() / 5) * 5;
            date.setMinutes(minutes, 0, 0);
            const timeKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!buckets[timeKey]) {
                buckets[timeKey] = { time: timeKey, count: 0, timestamp: date.getTime() };
            }
            buckets[timeKey].count++;
        });

        // Convert to Array and Sort by timestamp
        return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
    };
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
                // Formatted console log showing exact data structure
                console.log(
                    '%c╔══════════════════════════════════════════════════════════╗',
                    'color: #0f62fe; font-weight: bold;'
                );
                console.log(
                    '%c║  📦 [VIOLATION_STATS] Sending Stats Payload             ║',
                    'color: #0f62fe; font-weight: bold;'
                );
                console.log(
                    '%c╠══════════════════════════════════════════════════════════╣',
                    'color: #0f62fe; font-weight: bold;'
                );
                console.log(
                    `%c║  Total Violations: ${String(stats.total || 0).padEnd(37)} ║`,
                    'color: #42be65; font-weight: bold;'
                );
                console.log(
                    '%c╠══════════════════════════════════════════════════════════╣',
                    'color: #0f62fe; font-weight: bold;'
                );
                console.log(
                    '%c║  Violations By Type:                                     ║',
                    'color: #f1c21b; font-weight: bold;'
                );

                // Display each violation type with its count
                if (stats.byType) {
                    Object.entries(stats.byType).forEach(([type, count]) => {
                        const displayText = `${type}: ${count}`;
                        console.log(
                            `%c║    • ${displayText.padEnd(52)} ║`,
                            'color: #8a3ffc; font-weight: bold;'
                        );
                    });
                }

                console.log(
                    '%c╚══════════════════════════════════════════════════════════╝',
                    'color: #0f62fe; font-weight: bold;'
                );
                console.log('📊 [FULL_PAYLOAD]:', JSON.stringify(stats, null, 2));

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

                // Fetch all violations for chart if we have violations data
                const statsData = stats as any;
                if (statsData.users && Array.isArray(statsData.users)) {
                    const allViols: any[] = [];
                    statsData.users.forEach((user: any) => {
                        if (user.violations && Array.isArray(user.violations)) {
                            allViols.push(...user.violations);
                        }
                    });
                    setAllViolations(allViols);
                    const processed = processChartData(allViols);
                    setChartData(processed);
                    console.log('📈 [CHART] Processed chart data:', processed);
                }
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
            {/* Modern Dashboard Header with Gradients */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Active Sessions Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 shadow-lg shadow-emerald-500/5 overflow-hidden group hover:shadow-emerald-500/5 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-emerald-600">Active Sessions</p>
                            <div className="p-2.5 bg-emerald-500/20 text-emerald-600 rounded-xl">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-foreground mb-1">{activeSessions}</p>
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Live now
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Total Violations Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-lg shadow-amber-500/5 overflow-hidden group hover:shadow-amber-500/10 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-amber-600">Total Violations</p>
                            <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-xl">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-foreground mb-1">
                                {loading ? (
                                    <span className="inline-block w-16 h-10 bg-muted/50 rounded animate-pulse" />
                                ) : (
                                    statsTotal
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                                Across all candidates
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Completed Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 overflow-hidden group hover:shadow-blue-500/10 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-blue-600">Completed</p>
                            <div className="p-2.5 bg-blue-500/20 text-blue-600 rounded-xl">
                                <UserCheck size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-foreground mb-1">{completedCount}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                                / {invitedCount} Invited
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Proctor Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 shadow-lg shadow-primary/5 overflow-hidden group hover:shadow-primary/10 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-primary">Proctor Status</p>
                            <div className="p-2.5 bg-primary/20 text-primary rounded-xl">
                                <Shield size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-foreground mb-1">Active</p>
                            <p className="text-xs text-muted-foreground font-medium">
                                System optimal
                            </p>
                        </div>
                    </div>
                </motion.div>
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

                {/* Violations Breakdown Panel - Enhanced */}
                <div className="lg:col-span-1 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
                        <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <AlertTriangle size={20} className="text-amber-500" />
                            </div>
                            Violations Monitor
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2">
                            Total: <span className="font-bold text-foreground">{loading ? '-' : sidebarTotalViolations}</span>
                        </p>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[500px] space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-muted-foreground font-medium">Loading stats...</p>
                            </div>
                        ) : (
                            ALL_VIOLATION_TYPES.map((type) => {
                                const count = violationCounts[type] || 0;
                                const isActive = count > 0;
                                const maxCount = Math.max(...Object.values(violationCounts));
                                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                                return (
                                    <motion.div
                                        key={type}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`relative p-3 rounded-xl border transition-all ${isActive
                                            ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                                            : 'bg-muted/20 border-transparent hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-semibold ${isActive ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                                {VIOLATION_TYPE_LABELS[type] || type}
                                            </span>
                                            <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${isActive
                                                ? 'bg-amber-500/20 text-amber-700'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {count}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
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
                            recentActivity.map((activity: any, idx: number) => (
                                <div key={`${activity.id}-${idx}`} className="flex gap-3 border-l-2 border-primary/20 pl-3 py-1">
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

            {/* Violations Trend Area Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-6 border-b border-border/50 bg-gradient-to-r from-red-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <BarChart3 size={20} className="text-red-500" />
                                </div>
                                Violations Trend
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Real-time violation activity over time (5-minute intervals)
                            </p>
                        </div>
                        {chartData.length > 0 && (
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Peak Activity</p>
                                <p className="text-lg font-black text-red-500">
                                    {Math.max(...chartData.map(d => d.count))} violations
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-muted-foreground font-medium">Loading chart data...</p>
                            </div>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="p-4 bg-muted/20 rounded-full mb-3 inline-block">
                                    <BarChart3 size={32} className="text-muted-foreground/40" />
                                </div>
                                <p className="font-bold text-foreground mb-1">No Violation Data Yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Chart will appear when violations are detected
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="time"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{
                                        color: 'hsl(var(--foreground))',
                                        fontWeight: 'bold',
                                        marginBottom: '4px'
                                    }}
                                    itemStyle={{
                                        color: '#ef4444',
                                        fontWeight: '600'
                                    }}
                                    formatter={(value: any) => [`${value} violations`, 'Count']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorViolations)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AssessmentDetailPage;
