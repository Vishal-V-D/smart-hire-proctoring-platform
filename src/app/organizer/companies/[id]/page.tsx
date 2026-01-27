'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/api/companyService';
import { assessmentService } from '@/api/assessmentService';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    Globe,
    Mail,
    Users,
    Briefcase,
    FileCode2,
    Clock,
    ArrowLeft,
    Loader2,
    UserMinus,
    Plus,
    History,
    MoreHorizontal,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Shield,
    X,
    Lock,
    CheckCircle
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
    const [assessmentAssignSearch, setAssessmentAssignSearch] = useState('');

    // Add Admin Modal State
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Fetch Company Details
    const { data: company, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['company', companyId],
        queryFn: async () => {
            const res = await companyService.getCompanyById(companyId);
            return res.data;
        },
        enabled: !!companyId
    });

    // Fetch Company Assessments (FIXED ROBUSTNESS)
    const { data: companyAssessments = [], isLoading: isLoadingAssessments } = useQuery({
        queryKey: ['companyAssessments', companyId],
        queryFn: async () => {
            try {
                const res = await assessmentService.getAssessmentsByCompany(companyId);
                // Handle different possible API response structures safely
                if (res.data && Array.isArray(res.data)) return res.data;
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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAssessments = companyAssessments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(companyAssessments.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

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
                // Handle different structure safely
                if (res.data && Array.isArray(res.data)) return res.data;
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

    // Filter assessments by search for Modal
    const filteredAssignAssessments = allAssessments.filter((a: any) =>
        a.title?.toLowerCase().includes(assessmentAssignSearch.toLowerCase())
    );

    // Assign Assessment Mutation
    const assignAssessmentMutation = useMutation({
        mutationFn: (assessmentId: string) =>
            companyService.assignAssessment(assessmentId, companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyAssessments', companyId] });
            showToast('Assessment assigned successfully', 'success');
            setShowAssignModal(false);
            setSelectedAssessmentId('');
            setAssessmentAssignSearch('');
        },
        onError: () => {
            showToast('Failed to assign assessment', 'error');
        }
    });

    // Add Admin Mutation
    const addAdminMutation = useMutation({
        mutationFn: (data: { adminName: string; adminEmail: string }) =>
            companyService.addAdminByOrganizer({ companyId, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            showToast('Admin added successfully! Setup email sent.', 'success');
            setShowAddAdminModal(false);
            setAddAdminForm({ name: '', email: '' });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to add admin';
            showToast(message, 'error');
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
                <div className="text-center">
                    <Building2 size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
                    <p className="text-muted-foreground mb-6">The company you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/organizer/companies')}
                        className="px-4 py-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 transition-colors"
                    >
                        Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">

            {/* Full Width Gradient Banner - Now containing company info */}
            <div className="w-full h-[280px] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Back Button */}
                <button
                    onClick={() => router.push('/organizer/companies')}
                    className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium z-20 hover:bg-black/30"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>

                {/* Company Info Inside Banner */}
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-20">
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-end gap-8">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white/20 bg-white shadow-2xl flex items-center justify-center overflow-hidden shrink-0 backdrop-blur-sm">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={56} className="text-purple-600" />
                            )}
                        </div>

                        {/* Text Info (White on Gradient) */}
                        <div className="flex-1 mb-2">
                            <h1 className="text-4xl md:text-5xl font-Inter tracking-tight text-white mb-3 drop-shadow-md">{company.name}</h1>

                            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base font-medium">
                                <span className="flex items-center gap-1.5"><Briefcase size={16} /> {company.industry || 'Technology'}</span>
                                <span className="text-white/40">•</span>
                                <a href={company.website || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors">
                                    <Globe size={16} /> {company.website || 'No website'}
                                </a>
                                <span className="text-white/40">•</span>
                                <span className={`capitalize font-bold px-2.5 py-0.5 rounded-full text-xs border ${company.status === 'APPROVED' ? 'bg-green-500/20 border-green-400 text-green-100' :
                                    company.status === 'REJECTED' ? 'bg-red-500/20 border-red-400 text-red-100' :
                                        'bg-amber-500/20 border-amber-400 text-amber-100'
                                    }`}>
                                    {company.status?.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Header Actions Bar */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-4 md:px-10 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-full transition-all border border-border text-sm"
                    >
                        <Plus size={16} />
                        Assign Assessment
                    </button>
                    <button
                        onClick={() => router.push(`/assessments/create?companyId=${companyId}&fresh=true`)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-indigo-600 to-violet-600 hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 text-primary-foreground font-bold rounded-full transition-all shadow-md hover:shadow-lg text-sm"
                    >
                        <FileCode2 size={18} />
                        Create New Assessment
                    </button>
                    <button
                        onClick={() => router.push(`/organizer/companies/${companyId}/history`)}
                        className="p-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-all border border-border"
                        title="View History"
                    >
                        <History size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Two-Column Layout */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column (Sticky Sidebar - Unified Container) */}
                    <div className="lg:col-span-3">
                        <div className="bg-card/30 border border-border rounded-3xl p-6 space-y-8 sticky top-24">
                            {/* Intro Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-foreground">
                                        <Briefcase size={18} className="text-primary" />
                                        About
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {company.description || "No description provided for this company."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={16} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Contact Email</span>
                                            <span className="text-foreground font-medium">{company.contactEmail}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock size={16} className="text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Joined On</span>
                                            <span className="text-foreground font-medium">{new Date(company.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Section */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                        <Shield size={18} className="text-primary" />
                                        Permissions
                                    </h3>
                                    <button onClick={openPermissionsModal} className="text-primary text-xs font-bold hover:underline">Edit</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {company.permissions?.createAssessment && (
                                        <span className="bg-green-500/10 text-green-600 text-xs px-2.5 py-1 rounded-full font-bold border border-green-500/20">Create</span>
                                    )}
                                    {company.permissions?.deleteAssessment && (
                                        <span className="bg-red-500/10 text-red-600 text-xs px-2.5 py-1 rounded-full font-bold border border-red-500/20">Delete</span>
                                    )}
                                    {company.permissions?.viewAllAssessments && (
                                        <span className="bg-blue-500/10 text-blue-600 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-500/20">View All</span>
                                    )}
                                    {!company.permissions?.createAssessment && !company.permissions?.deleteAssessment && !company.permissions?.viewAllAssessments && (
                                        <span className="text-muted-foreground text-sm italic">No special permissions</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Content Feed) */}
                    <div className="lg:col-span-9 space-y-12">

                        {/* Assessments Table Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-foreground">Assessments</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search assessments..."
                                        className="pl-9 pr-4 py-2 bg-secondary border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="bg-card/50 rounded-3xl border border-border overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assessment</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Questions</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {currentAssessments.length > 0 ? (
                                            currentAssessments.map((assessment: any) => (
                                                <tr key={assessment.id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                <FileCode2 size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-foreground">{assessment.title}</p>
                                                                <p className="text-xs text-muted-foreground">ID: {assessment.id.substring(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-muted-foreground">{assessment.duration} min</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-muted-foreground">{assessment.totalQuestions || 0}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${assessment.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {assessment.status?.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                                                            className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                                    No assessments found for this company.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {companyAssessments.length > 0 && (
                                    <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, companyAssessments.length)}</span> of <span className="font-medium">{companyAssessments.length}</span> results
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                                    <button
                                                        key={number}
                                                        onClick={() => handlePageChange(number)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === number
                                                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground'
                                                            : 'hover:bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admins Table Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-foreground">Administrators</h3>
                                <button
                                    onClick={() => setShowAddAdminModal(true)}
                                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    Add Admin
                                </button>
                            </div>

                            <div className="bg-card/50 rounded-3xl border border-border overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {company.users && company.users.length > 0 ? (
                                            company.users.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.fullName?.[0]?.toUpperCase() || <Users size={16} />}
                                                            </div>
                                                            <span className="font-bold text-sm text-foreground">{user.fullName || 'Unknown User'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-muted-foreground">{user.email}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600">
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setRemoveAdminModal({ isOpen: true, user })}
                                                            className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                            title="Remove Admin"
                                                        >
                                                            <UserMinus size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                                    No admins found for this company.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* PERMISSIONS MODAL (Cool Style) */}
            <AnimatePresence>
                {showPermissionsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md p-8 rounded-[24px] shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <Lock size={32} />
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
                                        <span className="text-xs text-muted-foreground">See assessments from other companies</span>
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
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ASSIGN MODAL (Cool Style) */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-lg p-8 rounded-[24px] shadow-2xl border border-border relative"
                        >
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <Briefcase size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Assign Assessment</h2>
                                <p className="text-sm text-muted-foreground mt-1">Select an assessment to assign</p>
                            </div>

                            <input
                                type="text"
                                placeholder="Search assessments..."
                                value={assessmentAssignSearch}
                                onChange={(e) => setAssessmentAssignSearch(e.target.value)}
                                className="w-full p-3 mb-4 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />

                            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
                                {filteredAssignAssessments.map((a: any) => (
                                    <div
                                        key={a.id}
                                        onClick={() => setSelectedAssessmentId(a.id)}
                                        className={`p-4 rounded-xl border cursor-pointer hover:bg-muted transition-all flex items-center gap-3 ${selectedAssessmentId === a.id ? 'border-blue-500 bg-blue-50/50' : 'border-border'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAssessmentId === a.id ? 'border-blue-500' : 'border-muted-foreground/30'}`}>
                                            {selectedAssessmentId === a.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-foreground">{a.title}</div>
                                            <div className="text-xs text-muted-foreground">{a.totalQuestions || 0} Questions • {a.duration} mins</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowAssignModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                                <button
                                    onClick={() => assignAssessmentMutation.mutate(selectedAssessmentId)}
                                    disabled={!selectedAssessmentId || assignAssessmentMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Admin Modal (Simple style for now, can be upgraded if requested) */}
            <AnimatePresence>
                {showAddAdminModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-border">
                            <h3 className="text-lg font-bold mb-4">Add Administrator</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        value={addAdminForm.name}
                                        onChange={(e) => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
                                        className="w-full p-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={addAdminForm.email}
                                        onChange={(e) => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
                                        className="w-full p-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowAddAdminModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                                <button
                                    onClick={() => addAdminMutation.mutate({ adminName: addAdminForm.name, adminEmail: addAdminForm.email })}
                                    disabled={!addAdminForm.name || !addAdminForm.email || addAdminMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-lg disabled:opacity-50 hover:bg-gradient-to-br from-indigo-600 to-violet-600/90"
                                >
                                    Add Admin
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Remove Admin Modal */}
            <AnimatePresence>
                {removeAdminModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-card w-full max-w-sm p-6 rounded-2xl shadow-xl text-center border border-border">
                            <h3 className="text-lg font-bold mb-2">Remove Admin?</h3>
                            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to remove <span className="font-bold text-foreground">{removeAdminModal.user?.fullName}</span>? This action is irreversible.</p>
                            <div className="flex justify-center gap-2">
                                <button onClick={() => setRemoveAdminModal({ isOpen: false, user: null })} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80">Cancel</button>
                                <button
                                    onClick={() => removeAdminMutation.mutate(removeAdminModal.user?.id)}
                                    className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
