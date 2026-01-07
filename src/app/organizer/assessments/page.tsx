"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    Clock,
    FileText,
    Calendar,
    Search,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Copy,
    List,
    LayoutGrid
} from 'lucide-react';
import { assessmentService, AssessmentStatus } from '@/api/assessmentService';

type Assessment = {
    id: string;
    title: string;
    description?: string;
    status: AssessmentStatus;
    totalSections: number;
    totalQuestions: number;
    totalMarks: number;
    totalTime?: number;
    startDate: string;
    endDate: string;
    createdAt: string;
};

const MyAssessmentsPage = () => {
    const router = useRouter();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<AssessmentStatus | ''>('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        fetchAssessments();
    }, [pagination.page, statusFilter, searchQuery]);

    const fetchAssessments = async () => {
        setIsLoading(true);
        try {
            const response = await assessmentService.listAssessments({
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter || undefined,
                search: searchQuery || undefined,
                sortBy: 'createdAt',
                order: 'desc'
            });
            setAssessments(response.data.data || []);
            setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
            setAssessments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await assessmentService.deleteAssessment(id);
            fetchAssessments();
            setShowDeleteModal(false);
            setSelectedAssessment(null);
        } catch (error) {
            console.error('Failed to delete assessment:', error);
            alert('Failed to delete assessment');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await assessmentService.publishAssessment(id);
            fetchAssessments();
        } catch (error) {
            console.error('Failed to publish assessment:', error);
            alert('Failed to publish assessment');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await assessmentService.duplicateAssessment(id);
            fetchAssessments();
        } catch (error) {
            console.error('Failed to duplicate assessment:', error);
            alert('Failed to duplicate assessment');
        }
    };

    const getStatusBadge = (status: AssessmentStatus) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'PUBLISHED':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'ARCHIVED':
                return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-background p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            Assessments
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your assessments, track progress, and review results
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/organizer/new-assessment')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95"
                    >
                        <Plus size={20} />
                        Create Assessment
                    </button>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-10 bg-background/80 backdrop-blur-xl p-4 border border-border/50 rounded-2xl shadow-sm">
                    {/* Search & Filter */}
                    <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                        <div className="relative flex-1 md:max-w-md group">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search assessments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary/50 focus:bg-background focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] outline-none transition-all"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as AssessmentStatus | '')}
                            className="bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-sm focus:border-primary/50 outline-none transition-all cursor-pointer hover:bg-muted/50"
                        >
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-muted-foreground font-medium animate-pulse">Loading assessments...</p>
                    </div>
                ) : assessments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-3xl bg-card/50"
                    >
                        <div className="p-6 bg-muted/50 rounded-full mb-6 relative group cursor-pointer" onClick={() => router.push('/organizer/new-assessment')}>
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
                            <Shield size={48} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No assessments found</h3>
                        <p className="text-muted-foreground mb-8 text-center max-w-sm">
                            Get started by creating your first assessment. It only takes a few minutes.
                        </p>
                        <button
                            onClick={() => router.push('/organizer/new-assessment')}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                        >
                            Create New Assessment
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === 'list' ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-card border border-border rounded-xl overflow-hidden"
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Assessment</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Marks</th>
                                                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Created</th>
                                                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {assessments.map((assessment) => (
                                                <tr
                                                    key={assessment.id}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/organizer/assessments/${assessment.id}`)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${assessment.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600' :
                                                                    assessment.status === 'ARCHIVED' ? 'bg-slate-500/10 text-slate-600' :
                                                                        'bg-amber-500/10 text-amber-600'
                                                                }`}>
                                                                {assessment.title.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-foreground">{assessment.title}</p>
                                                                {assessment.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{assessment.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusBadge(assessment.status)}`}>
                                                            {assessment.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText size={14} className="text-muted-foreground" />
                                                            <span className="text-sm font-bold text-foreground">{assessment.totalQuestions}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={14} className="text-muted-foreground" />
                                                            <span className="text-sm font-bold text-foreground">{assessment.totalTime || 0}m</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm font-bold text-foreground">{assessment.totalMarks}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {new Date(assessment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => router.push(`/organizer/assessments/${assessment.id}`)}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                                title="View"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {assessment.status !== 'PUBLISHED' && (
                                                                <button
                                                                    onClick={() => router.push(`/organizer/new-assessment?edit=${assessment.id}`)}
                                                                    className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDuplicate(assessment.id)}
                                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                                                title="Duplicate"
                                                            >
                                                                <Copy size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAssessment(assessment);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                                title="Delete"
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
                            </motion.div>

                        ) : (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {assessments.map((assessment, index) => (
                                    <motion.div
                                        key={assessment.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => router.push(`/organizer/assessments/${assessment.id}`)}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye className="text-muted-foreground" size={20} />
                                        </div>

                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${assessment.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' :
                                                assessment.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/10' :
                                                    'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
                                                }`}>
                                                {assessment.title.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusBadge(assessment.status)}`}>
                                                {assessment.status}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-foreground mb-4 line-clamp-2 h-14">
                                            {assessment.title}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-muted/30 rounded-lg p-2.5">
                                                <p className="text-xs text-muted-foreground mb-1">Questions</p>
                                                <p className="text-lg font-black text-foreground">{assessment.totalQuestions}</p>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-2.5">
                                                <p className="text-xs text-muted-foreground mb-1">Time</p>
                                                <p className="text-lg font-black text-foreground">{assessment.totalTime || 0}m</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(assessment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* Pagination */}
                {!isLoading && assessments.length > 0 && (
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="text-xs font-medium text-muted-foreground">
                            Showing <span className="text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-foreground">{pagination.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold w-8 text-center">
                                {pagination.page}
                            </span>
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && selectedAssessment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <AlertCircle className="text-destructive" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-1">Delete Assessment?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm font-medium text-foreground bg-muted p-3 dashed border border-border rounded-lg mb-6">
                                "{selectedAssessment.title}"
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedAssessment(null);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedAssessment.id)}
                                    className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-destructive/20"
                                >
                                    Delete Assessment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyAssessmentsPage;
