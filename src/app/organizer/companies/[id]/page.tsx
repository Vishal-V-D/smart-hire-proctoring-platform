'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, Company } from '@/api/companyService';
import { assessmentService } from '@/api/assessmentService';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    Globe,
    Mail,
    Users,
    Briefcase,
    FileCode2,
    Layers,
    Shield,
    CheckCircle,
    Clock,
    ArrowLeft,
    ArrowUpRight,
    Loader2,
    Calendar,
    User,
    Edit3,
    History,
    X,
    Trash2,
    UserMinus,
    Phone,
    Plus,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@/utils/toast';

export default function CompanyDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params.id as string;
    const queryClient = useQueryClient();

    // Permissions Modal State
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [permissionsForm, setPermissionsForm] = useState({
        createAssessment: false,
        deleteAssessment: false,
        viewAllAssessments: false
    });

    // Remove Admin Modal State
    const [removeAdminModal, setRemoveAdminModal] = useState<{ isOpen: boolean; user: any | null }>({
        isOpen: false,
        user: null
    });

    // Assign Assessment Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
    const [assessmentSearch, setAssessmentSearch] = useState('');

    // Fetch Company Details
    const { data: company, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['company', companyId],
        queryFn: async () => {
            const res = await companyService.getCompanyById(companyId);
            return res.data;
        },
        enabled: !!companyId
    });

    // Fetch Company Assessments
    const { data: companyAssessments = [], isLoading: isLoadingAssessments } = useQuery({
        queryKey: ['companyAssessments', companyId],
        queryFn: async () => {
            try {
                const res = await assessmentService.getAssessmentsByCompany(companyId);
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.assessments && Array.isArray(res.data.assessments)) return res.data.assessments;
                if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            } catch (error) {
                console.error("Failed to fetch company assessments", error);
                return [];
            }
        },
        enabled: !!companyId
    });

    // Update Permissions Mutation
    const updatePermissionsMutation = useMutation({
        mutationFn: (permissions: typeof permissionsForm) =>
            companyService.updatePermissions(companyId, permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            showToast('Permissions updated successfully', 'success');
            setShowPermissionsModal(false);
        },
        onError: () => {
            showToast('Failed to update permissions', 'error');
        }
    });

    // Remove Admin Mutation
    const removeAdminMutation = useMutation({
        mutationFn: (userId: string) =>
            companyService.removeAdmin(companyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            showToast('Admin removed successfully', 'success');
            setRemoveAdminModal({ isOpen: false, user: null });
        },
        onError: () => {
            showToast('Failed to remove admin', 'error');
        }
    });

    // Fetch All Assessments (for assign modal)
    const { data: allAssessments = [], isLoading: isLoadingAllAssessments } = useQuery({
        queryKey: ['allAssessments'],
        queryFn: async () => {
            try {
                const res = await assessmentService.listAssessments({ limit: 100 });
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.data) return res.data.data;
                if (res.data?.assessments) return res.data.assessments;
                return [];
            } catch (error) {
                console.error("Failed to fetch assessments", error);
                return [];
            }
        },
        enabled: showAssignModal
    });

    // Filter assessments by search
    const filteredAssessments = allAssessments.filter((a: any) =>
        a.title?.toLowerCase().includes(assessmentSearch.toLowerCase())
    );

    // Get question count helper
    const getQuestionCount = (assessment: any) => {
        if (assessment.sections && Array.isArray(assessment.sections)) {
            return assessment.sections.reduce((acc: number, section: any) => {
                return acc + (section.questions?.length || section.questionCount || 0);
            }, 0);
        }
        return assessment.totalQuestions || assessment.questionCount || 0;
    };

    // Assign Assessment Mutation
    const assignAssessmentMutation = useMutation({
        mutationFn: (assessmentId: string) =>
            companyService.assignAssessment(assessmentId, companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyAssessments', companyId] });
            showToast('Assessment assigned successfully', 'success');
            setShowAssignModal(false);
            setSelectedAssessmentId('');
            setAssessmentSearch('');
        },
        onError: () => {
            showToast('Failed to assign assessment', 'error');
        }
    });

    const openPermissionsModal = () => {
        if (company) {
            setPermissionsForm({
                createAssessment: company.permissions?.createAssessment || false,
                deleteAssessment: company.permissions?.deleteAssessment || false,
                viewAllAssessments: company.permissions?.viewAllAssessments || false
            });
            setShowPermissionsModal(true);
        }
    };

    const handleSavePermissions = () => {
        updatePermissionsMutation.mutate(permissionsForm);
    };

    if (isLoadingCompany) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <div className="text-center">
                    <Building2 size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
                    <p className="text-muted-foreground mb-6">The company you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/organizer/companies')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-violet-900 to-slate-900 text-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
                    {/* Back Button & Actions */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push('/organizer/companies')}
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Companies</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                            >
                                <Plus size={18} />
                                <span>Assign Assessment</span>
                            </button>

                            <button
                                onClick={() => router.push(`/organizer/companies/${companyId}/history`)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-colors"
                            >
                                <History size={18} />
                                <span className="font-medium">View History</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                            <Building2 size={40} className="text-purple-200" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="text-4xl font-black tracking-tight">{company.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${company.status === 'APPROVED'
                                    ? 'bg-green-500/20 border-green-400/30 text-green-300'
                                    : company.status === 'REJECTED'
                                        ? 'bg-red-500/20 border-red-400/30 text-red-300'
                                        : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                                    }`}>
                                    {company.status}
                                </span>
                            </div>
                            <p className="text-indigo-100/70 text-lg leading-relaxed max-w-3xl">
                                {company.description || 'Professional organization profile. Manage company settings and view details here.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Core Information Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-8 shadow-sm"
                        >
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                <Briefcase className="text-primary" size={20} />
                                Corporate Identity
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Name</label>
                                    <p className="text-base font-medium text-foreground">{company.name}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Industry / Sector</label>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-muted rounded-lg text-sm font-medium text-foreground">
                                            {(company as any).industry || (company as any).sector || 'Technology'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website</label>
                                    {company.website ? (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-primary hover:underline text-base"
                                        >
                                            <Globe size={16} />
                                            {company.website}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Globe size={16} className="opacity-50" />
                                            No website provided
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                                        {company.description || "No description available for this organization."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Linked Assessments Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-2xl p-8 shadow-sm"
                        >
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                <FileCode2 className="text-purple-500" size={20} />
                                Linked Assessments ({companyAssessments.length})
                            </h3>

                            {isLoadingAssessments ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : companyAssessments.length > 0 ? (
                                <div className="space-y-3">
                                    {companyAssessments.map((assessment: any) => (
                                        <div
                                            key={assessment.id}
                                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                                            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-purple-500/30 transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-200/20">
                                                    <FileCode2 size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground group-hover:text-purple-600 transition-colors">{assessment.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span>{assessment.totalQuestions || 0} Questions</span>
                                                        <span>•</span>
                                                        <span>{assessment.duration || 0} mins</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-1 ${assessment.status === 'PUBLISHED'
                                                            ? 'bg-green-500/10 text-green-600'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {assessment.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 text-muted-foreground group-hover:text-purple-600 transition-colors">
                                                <ArrowUpRight size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 rounded-xl bg-muted/20 border border-border/50 border-dashed">
                                    <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                                        <Layers size={18} />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No Assessments Assigned</p>
                                    <p className="text-xs text-muted-foreground mt-1">This company hasn't created or been assigned any assessments yet.</p>
                                </div>
                            )}
                        </motion.div>
                        {/* Admin Users Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-border bg-muted/20">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <Users className="text-purple-500" size={20} />
                                    Admin Users ({company.users?.length || 0})
                                </h3>
                            </div>

                            {company.users && company.users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                                <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {company.users.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                                                                {user.avatarUrl ? (
                                                                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    user.fullName?.charAt(0)?.toUpperCase() || 'A'
                                                                )}
                                                            </div>
                                                            <span className="font-semibold text-foreground">{user.fullName || 'Unknown User'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground">{user.email}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN'
                                                            ? 'bg-purple-500/10 text-purple-600 border border-purple-200/30'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {user.role || 'Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${user.status === 'active' || user.status === 'APPROVED'
                                                            ? 'bg-green-500/10 text-green-600 border border-green-200/30'
                                                            : 'bg-amber-500/10 text-amber-600 border border-amber-200/30'
                                                            }`}>
                                                            {user.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setRemoveAdminModal({ isOpen: true, user })}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Remove Admin"
                                                        >
                                                            <UserMinus size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                                        <Users size={20} />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No Admin Users</p>
                                    <p className="text-xs text-muted-foreground mt-1">This company has no admin users assigned yet.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Contact Details Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                        >
                            <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
                                <Mail className="text-green-500" size={18} />
                                Contact Details
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                        <Mail size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                                        <p className="text-sm font-medium text-foreground break-all">{company.contactEmail}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                        <Phone size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                                        <p className="text-sm font-medium text-foreground">{company.contactPhone || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                        <Users size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-0.5">Admin Accounts</p>
                                        <p className="text-sm font-medium text-foreground">{company.users?.length || 0} Users</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Permissions Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-8"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                                    <Shield className="text-amber-500" size={18} />
                                    Platform Permissions
                                </h3>
                                <button
                                    onClick={openPermissionsModal}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                    title="Edit Permissions"
                                >
                                    <Edit3 size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.createAssessment
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-muted border-transparent'
                                    }`}>
                                    <span className="text-sm font-medium">Create Assessment</span>
                                    {company.permissions?.createAssessment ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.deleteAssessment
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-muted border-transparent'
                                    }`}>
                                    <span className="text-sm font-medium">Delete Assessment</span>
                                    {company.permissions?.deleteAssessment ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-xl border ${company.permissions?.viewAllAssessments
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-muted border-transparent'
                                    }`}>
                                    <span className="text-sm font-medium">View All Content</span>
                                    {company.permissions?.viewAllAssessments ? (
                                        <CheckCircle size={16} className="text-green-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* System Metadata */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-muted/50 to-muted/20 border border-border rounded-2xl p-6"
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-muted-foreground uppercase tracking-wider">
                                <Clock size={14} />
                                System Metadata
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar size={16} className="text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Registered</p>
                                        <p className="text-sm font-medium text-foreground">
                                            {new Date((company as any).createdAt || Date.now()).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User size={16} className="text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Company ID</p>
                                        <p className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded border border-border inline-block">
                                            {company.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Permissions Modal */}
            <AnimatePresence>
                {showPermissionsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <Shield size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Manage Permissions</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {company.name}
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-foreground">Create Assessment</span>
                                        <span className="text-xs text-muted-foreground">Allow company to create new assessments</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={permissionsForm.createAssessment}
                                        onChange={(e) => setPermissionsForm({ ...permissionsForm, createAssessment: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-foreground">Delete Assessment</span>
                                        <span className="text-xs text-muted-foreground">Allow company to delete assessments</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={permissionsForm.deleteAssessment}
                                        onChange={(e) => setPermissionsForm({ ...permissionsForm, deleteAssessment: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-foreground">View All Assessments</span>
                                        <span className="text-xs text-muted-foreground">See assessments from other companies (Caution)</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={permissionsForm.viewAllAssessments}
                                        onChange={(e) => setPermissionsForm({ ...permissionsForm, viewAllAssessments: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPermissionsModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={updatePermissionsMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {updatePermissionsMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Remove Admin Confirmation Modal */}
            <AnimatePresence>
                {removeAdminModal.isOpen && removeAdminModal.user && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setRemoveAdminModal({ isOpen: false, user: null })}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <UserMinus size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Remove Admin</h2>
                                <p className="text-sm text-muted-foreground mt-1 text-center">
                                    Are you sure you want to remove this admin?
                                </p>
                            </div>

                            <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                                        {removeAdminModal.user.avatarUrl ? (
                                            <img src={removeAdminModal.user.avatarUrl} alt={removeAdminModal.user.fullName} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            removeAdminModal.user.fullName?.charAt(0)?.toUpperCase() || 'A'
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{removeAdminModal.user.fullName || 'Unknown User'}</h4>
                                        <p className="text-sm text-muted-foreground">{removeAdminModal.user.email}</p>
                                        <span className="text-xs text-muted-foreground mt-1 inline-block">
                                            Role: <span className="font-medium text-foreground">{removeAdminModal.user.role || 'Member'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                ⚠️ This action cannot be undone. The user will lose access to this company's resources.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRemoveAdminModal({ isOpen: false, user: null })}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => removeAdminMutation.mutate(removeAdminModal.user.id)}
                                    disabled={removeAdminMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {removeAdminMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Removing...
                                        </>
                                    ) : (
                                        'Remove Admin'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Assessment Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-3xl rounded-[32px] shadow-2xl relative flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="relative p-8 pb-6 border-b border-border">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-pink-500/10 rounded-t-[32px]" />

                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedAssessmentId('');
                                        setAssessmentSearch('');
                                    }}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors z-10"
                                >
                                    <X size={20} />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-500/20">
                                            <Briefcase size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Assign Assessment</h2>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                to <span className="font-bold text-foreground">{company?.name}</span>
                                            </p>
                                        </div>
                                        {selectedAssessmentId && (
                                            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                                <span className="text-sm font-bold text-purple-600">1 Selected</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search assessments..."
                                            value={assessmentSearch}
                                            onChange={(e) => setAssessmentSearch(e.target.value)}
                                            className="w-full bg-muted/50 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 border border-border focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Grid */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoadingAllAssessments ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                ) : filteredAssessments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileCode2 className="text-muted-foreground" size={32} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No Assessments Found</h3>
                                        <p className="text-muted-foreground text-sm mt-1">Try adjusting your search.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredAssessments.map((assessment: any) => {
                                            const isSelected = selectedAssessmentId === assessment.id;
                                            const questionCount = getQuestionCount(assessment);

                                            return (
                                                <motion.button
                                                    key={assessment.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    onClick={() => setSelectedAssessmentId(isSelected ? '' : assessment.id)}
                                                    className={`
                                                        relative p-5 rounded-2xl border-2 transition-all text-left group
                                                        ${isSelected
                                                            ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                                                            : 'border-border hover:border-purple-500/30 hover:bg-muted/30'
                                                        }
                                                    `}
                                                >
                                                    {/* Selection Indicator */}
                                                    <div className={`
                                                        absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                        ${isSelected
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-border bg-background group-hover:border-purple-500/50'
                                                        }
                                                    `}>
                                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="pr-8">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className={`
                                                                p-2 rounded-lg transition-colors
                                                                ${isSelected ? 'bg-purple-500/10 text-purple-600' : 'bg-muted text-muted-foreground'}
                                                            `}>
                                                                <FileCode2 size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={`font-bold text-base leading-tight mb-1 ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                                                    {assessment.title}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                                    {assessment.description || 'No description available'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Meta Info */}
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Layers size={12} />
                                                                <span>{assessment.sections?.length || 0} Sections</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FileCode2 size={12} />
                                                                <span>{questionCount} Questions</span>
                                                            </div>
                                                            {assessment.duration && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    <span>{assessment.duration}m</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-border bg-muted/20">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setSelectedAssessmentId('');
                                            setAssessmentSearch('');
                                        }}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-background border border-border text-foreground hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => assignAssessmentMutation.mutate(selectedAssessmentId)}
                                        disabled={assignAssessmentMutation.isPending || !selectedAssessmentId}
                                        className={`
                                            flex-1 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all
                                            ${!selectedAssessmentId || assignAssessmentMutation.isPending
                                                ? 'bg-purple-500/50 cursor-not-allowed opacity-70'
                                                : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                            }
                                        `}
                                    >
                                        {assignAssessmentMutation.isPending ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Briefcase size={18} />
                                                Assign Assessment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
