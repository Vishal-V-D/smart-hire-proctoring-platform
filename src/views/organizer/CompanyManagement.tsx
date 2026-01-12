'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, Company } from '@/api/companyService';
import { assessmentService } from '@/api/assessmentService';
import { showToast } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import {
    Search,
    Trash2,
    Building2,
    Globe,
    Mail,
    Users,
    ShieldAlert,
    Briefcase,
    CheckCircle,
    X,
    Loader2,
    FileCode2,
    Layers,
    Clock,
    LayoutGrid,
    Table as TableIcon,
    Eye,
    MoreHorizontal,
    Lock,
    Link as LinkIcon,
    Shield,
    Check,
    FileEdit,
    History as HistoryIcon,
    User,
    ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompanyManagement() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Selection States
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null); // For deletion modal
    const [companyDetails, setCompanyDetails] = useState<Company | any | null>(null);   // For details modal

    // Permissions Modal State
    const [permissionsModalData, setPermissionsModalData] = useState<{ company: Company | null, isOpen: boolean }>({ company: null, isOpen: false });
    const [permissionsForm, setPermissionsForm] = useState({
        createAssessment: false,
        deleteAssessment: false,
        viewAllAssessments: false
    });
    const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

    // Assignment Modal State
    const [assignModalData, setAssignModalData] = useState<{ company: Company | null, isOpen: boolean }>({ company: null, isOpen: false });
    const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assessmentSearch, setAssessmentSearch] = useState('');

    // History State
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const handleViewHistory = (companyId: string) => {
        router.push(`/organizer/companies/${companyId}/history`);
    };

    // Fetch Companies
    const { data: companies = [], isLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const res = await companyService.getCompanies();
            const data = res.data;
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.data)) return data.data;
            if (data && Array.isArray(data.companies)) return data.companies;
            return [];
        }
    });

    // Fetch Assessments
    const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
        queryKey: ['assessments', 'published'],
        queryFn: async () => {
            const res = await assessmentService.listAssessments({ limit: 100 });
            return res.data.data || [];
        },
        enabled: assignModalData.isOpen
    });

    // Fetch Company Assessments (when modal is open)
    const { data: companyAssessments = [], isLoading: isLoadingCompanyAssessments } = useQuery({
        queryKey: ['companyAssessments', companyDetails?.id],
        queryFn: async () => {
            if (!companyDetails?.id) return [];
            try {
                const res = await assessmentService.getAssessmentsByCompany(companyDetails.id);
                // Handle various response structures
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.assessments && Array.isArray(res.data.assessments)) return res.data.assessments;
                if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            } catch (error) {
                console.error("Failed to fetch company assessments", error);
                return [];
            }
        },
        enabled: !!companyDetails?.id
    });

    const getQuestionCount = (assessment: any) => {
        if (assessment.questions && assessment.questions.length > 0) return assessment.questions.length;
        if (assessment.sections && Array.isArray(assessment.sections)) {
            return assessment.sections.reduce((acc: number, section: any) => {
                return acc + (section.questions?.length || section.questionCount || 0);
            }, 0);
        }
        return assessment.totalQuestions || assessment.questionCount || 0;
    };

    const filteredAssessments = assessments.filter((a: any) =>
        a.title.toLowerCase().includes(assessmentSearch.toLowerCase())
    );

    const toggleAssessment = (id: string) => {
        setSelectedAssessmentIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => companyService.deleteCompany(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            showToast('Company deleted successfully', 'success');
            setSelectedCompany(null);
        },
        onError: () => {
            showToast('Failed to delete company', 'error');
        }
    });

    const openPermissionsModal = (company: Company) => {
        setPermissionsForm({
            createAssessment: company.permissions?.createAssessment || false,
            deleteAssessment: company.permissions?.deleteAssessment || false,
            viewAllAssessments: company.permissions?.viewAllAssessments || false
        });
        setPermissionsModalData({ company, isOpen: true });
    };

    const handleSavePermissions = async () => {
        if (!permissionsModalData.company) return;

        setIsUpdatingPermissions(true);
        try {
            await companyService.updatePermissions(permissionsModalData.company.id, permissionsForm);
            showToast('Permissions updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            setPermissionsModalData({ company: null, isOpen: false });
        } catch (error: any) {
            console.error(error);
            showToast('Failed to update permissions', 'error');
        } finally {
            setIsUpdatingPermissions(false);
        }
    };

    const handleAssignAssessments = async () => {
        if (!assignModalData.company || selectedAssessmentIds.length === 0) {
            showToast("Please select at least one assessment", "error");
            return;
        }

        setIsAssigning(true);
        try {
            await Promise.all(
                selectedAssessmentIds.map(assessmentId =>
                    companyService.assignAssessment(assessmentId, assignModalData.company!.id)
                )
            );

            showToast(
                `${selectedAssessmentIds.length} assessment${selectedAssessmentIds.length > 1 ? 's' : ''} assigned to ${assignModalData.company.name}`,
                "success"
            );

            setAssignModalData({ company: null, isOpen: false });
            setSelectedAssessmentIds([]);
            setAssessmentSearch('');
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to assign assessments", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredCompanies = (companies as Company[]).filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Company Management</h1>
                    <p className="text-muted-foreground mt-1">View and manage registered partner companies.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded-lg border border-border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <TableIcon size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-2xl border border-border/50"></div>
                    ))}
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="text-muted-foreground" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold">No Companies Found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms.</p>
                </div>
            ) : viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredCompanies.map((company) => (
                            <motion.div
                                key={company.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-card hover:bg-card/80 border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground text-lg leading-tight">{company.name}</h3>
                                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5">
                                                    <Globe size={10} /> {company.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${company.status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border-green-200' :
                                            company.status === 'REJECTED' ? 'bg-red-500/10 text-red-600 border-red-200' :
                                                'bg-amber-500/10 text-amber-600 border-amber-200'
                                            }`}>
                                            {company.status}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-foreground/80">
                                            <Mail size={16} className="text-muted-foreground shrink-0" />
                                            <span className="truncate">{company.contactEmail}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-foreground/80">
                                            <Users size={16} className="text-muted-foreground shrink-0" />
                                            <span>{company.users?.length || 0} Admin{(company.users?.length || 0) !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => setAssignModalData({ company, isOpen: true })}
                                        className="col-span-1 flex items-center justify-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 px-2 py-2 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                                        title="Assign Assessment"
                                    >
                                        <Briefcase size={16} /> Assign
                                    </button>
                                    <button
                                        onClick={() => openPermissionsModal(company)}
                                        className="col-span-1 flex items-center justify-center gap-2 text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 py-2 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                                        title="Manage Permissions"
                                    >
                                        <Lock size={16} /> Perms
                                    </button>
                                    <button
                                        onClick={() => handleViewHistory(company.id)}
                                        className="col-span-1 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                        title="View History"
                                    >
                                        <HistoryIcon size={16} /> History
                                    </button>
                                    <button
                                        onClick={() => setCompanyDetails(company)}
                                        className="col-span-1 flex items-center justify-center gap-2 text-xs font-bold text-foreground hover:bg-muted px-2 py-2 rounded-lg transition-colors"
                                        title="View Company"
                                    >
                                        <Eye size={16} /> View
                                    </button>
                                    <button
                                        onClick={() => setSelectedCompany(company)}
                                        className="col-span-1 flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-2 rounded-lg transition-colors"
                                        title="Delete Company"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                // TABLE VIEW
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-center">Admins</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{company.name}</div>
                                                    <a href={company.website} target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                                        {company.website.replace(/^https?:\/\//, '')}
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail size={14} />
                                                <span>{company.contactEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium bg-muted px-2 py-1 rounded text-xs">
                                                {company.users?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${company.status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border-green-200' :
                                                company.status === 'REJECTED' ? 'bg-red-500/10 text-red-600 border-red-200' :
                                                    'bg-amber-500/10 text-amber-600 border-amber-200'
                                                }`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setAssignModalData({ company, isOpen: true })}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors tooltip"
                                                    title="Assign Assessment"
                                                >
                                                    <Briefcase size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openPermissionsModal(company)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors tooltip"
                                                    title="Manage Permissions"
                                                >
                                                    <Lock size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewHistory(company.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                                    title="View History"
                                                >
                                                    <HistoryIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setCompanyDetails(company)}
                                                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors tooltip"
                                                    title="View Company"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCompany(company)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                                    title="Delete Company"
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
                </div>
            )}

            {/* PERMISSIONS MODAL */}
            <AnimatePresence>
                {permissionsModalData.isOpen && permissionsModalData.company && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md p-8 rounded-[24px] shadow-2xl relative"
                        >
                            <button
                                onClick={() => setPermissionsModalData({ company: null, isOpen: false })}
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
                                    {permissionsModalData.company.name}
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
                                    onClick={() => setPermissionsModalData({ company: null, isOpen: false })}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isUpdatingPermissions}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {isUpdatingPermissions ? (
                                        <>Updating...</>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {selectedCompany && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md p-6 rounded-3xl shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                                    <ShieldAlert size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Delete Company?</h2>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                        This action will permanently delete
                                        <span className="font-bold text-foreground"> {selectedCompany.name} </span>
                                        and remove <span className="text-red-500 font-bold">{selectedCompany.users?.length || 0} associated admin accounts</span>.
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedCompany(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(selectedCompany.id)}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETAILS MODAL */}
            <AnimatePresence>
                {companyDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0 rounded-[32px] shadow-2xl relative"
                        >
                            <button
                                onClick={() => setCompanyDetails(null)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-20"
                            >
                                <X size={20} />
                            </button>

                            {/* Header / Hero Section (Reused from Admin View) */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 p-10 text-white">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                                        <Building2 size={40} className="text-indigo-200" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-3xl font-black tracking-tight">{companyDetails.name}</h2>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${companyDetails.status === 'APPROVED' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
                                                'bg-amber-500/20 border-amber-400/30 text-amber-300'
                                                }`}>
                                                {companyDetails.status}
                                            </span>
                                        </div>
                                        <p className="text-indigo-100/70 text-lg leading-relaxed">
                                            {companyDetails.description || 'Welcome to your organization profile. Manage your company settings and view details here.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-background">
                                {/* Main Details Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Core Information Card */}
                                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                            <Briefcase className="text-primary" size={20} />
                                            Corporate Identity
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Name</label>
                                                <p className="text-base font-medium text-foreground">{companyDetails.name}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Industry / Sector</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-muted rounded-lg text-sm font-medium text-foreground">
                                                        {companyDetails.industry || companyDetails.sector || 'Technology'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website</label>
                                                <a
                                                    href={companyDetails.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-primary hover:underline text-base"
                                                >
                                                    <Globe size={16} />
                                                    {companyDetails.website || 'No website provided'}
                                                </a>
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                                                    {companyDetails.description || "No description available for this organization."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linked Assessments Card */}
                                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                            <FileCode2 className="text-purple-500" size={20} />
                                            Linked Assessments
                                        </h3>

                                        {isLoadingCompanyAssessments ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : companyAssessments.length > 0 ? (
                                            <div className="space-y-3">
                                                {companyAssessments.map((assessment: any) => (
                                                    <div key={assessment.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-200/20">
                                                                <FileCode2 size={18} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-foreground">{assessment.title}</h4>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                    <span>{assessment.totalQuestions || 0} Questions</span>
                                                                    <span>•</span>
                                                                    <span>{assessment.duration || 0} mins</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-1 ${assessment.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                        {assessment.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                                                            className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border shadow-sm"
                                                        >
                                                            <ArrowUpRight size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 px-4 rounded-2xl bg-muted/20 border border-border/50 border-dashed">
                                                <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                                                    <Layers size={18} />
                                                </div>
                                                <p className="text-sm font-medium text-foreground">No Assessments Assigned</p>
                                                <p className="text-xs text-muted-foreground mt-1">This company hasn't created or been assigned any assessments yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Information Card */}
                                    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                            <Mail className="text-green-500" size={20} />
                                            Contact Details
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                                <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-muted-foreground">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Contact Email</p>
                                                    <p className="text-sm font-medium text-foreground break-all">{companyDetails.contactEmail}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                                                <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-muted-foreground">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Admin Accounts</p>
                                                    <p className="text-sm font-medium text-foreground">{companyDetails.users?.length || 0} Users</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Column */}
                                <div className="space-y-6">
                                    {/* Permissions Card */}
                                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
                                            <Shield className="text-amber-500" size={18} />
                                            Platform Permissions
                                        </h3>

                                        <div className="space-y-3">
                                            <div className={`flex items-center justify-between p-3 rounded-xl border ${companyDetails.permissions?.createAssessment ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                                <span className="text-sm font-medium">Create Assessment</span>
                                                {companyDetails.permissions?.createAssessment ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                                            </div>

                                            <div className={`flex items-center justify-between p-3 rounded-xl border ${companyDetails.permissions?.deleteAssessment ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                                <span className="text-sm font-medium">Delete Assessment</span>
                                                {companyDetails.permissions?.deleteAssessment ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                                            </div>

                                            <div className={`flex items-center justify-between p-3 rounded-xl border ${companyDetails.permissions?.viewAllAssessments ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-transparent'}`}>
                                                <span className="text-sm font-medium">View All Content</span>
                                                {companyDetails.permissions?.viewAllAssessments ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Metadata */}
                                    <div className="bg-gradient-to-br from-muted/50 to-muted/20 border border-border rounded-3xl p-6">
                                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-muted-foreground uppercase tracking-wider">
                                            <Clock size={14} />
                                            System Metadata
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Joined On</span>
                                                <span className="font-mono font-medium">{new Date(companyDetails.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Last Updated</span>
                                                <span className="font-mono font-medium">{new Date(companyDetails.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Company ID</span>
                                                <span className="font-mono text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border" title={companyDetails.id}>
                                                    {companyDetails.id.substring(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setCompanyDetails(null)}
                                        className="w-full py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ASSIGN ASSESSMENT MODAL - Modern Multi-Select */}
            <AnimatePresence>
                {assignModalData.isOpen && assignModalData.company && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-3xl rounded-[32px] shadow-2xl relative flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="relative p-8 pb-6 border-b border-border">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-t-[32px]" />

                                <button
                                    onClick={() => {
                                        setAssignModalData({ company: null, isOpen: false });
                                        setSelectedAssessmentIds([]);
                                        setAssessmentSearch('');
                                    }}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors z-10"
                                >
                                    <X size={20} />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
                                            <Briefcase size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Assign Assessments</h2>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                to <span className="font-bold text-foreground">{assignModalData.company.name}</span>
                                            </p>
                                        </div>
                                        {selectedAssessmentIds.length > 0 && (
                                            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                                                <span className="text-sm font-bold text-primary">
                                                    {selectedAssessmentIds.length} Selected
                                                </span>
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
                                            className="w-full bg-muted/50 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-border focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Grid */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {assessmentsLoading ? (
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
                                        <AnimatePresence mode="popLayout">
                                            {filteredAssessments.map((assessment: any) => {
                                                const isSelected = selectedAssessmentIds.includes(assessment.id);
                                                const questionCount = getQuestionCount(assessment);

                                                return (
                                                    <motion.button
                                                        key={assessment.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        onClick={() => toggleAssessment(assessment.id)}
                                                        className={`
                                                            relative p-5 rounded-2xl border-2 transition-all text-left group
                                                            ${isSelected
                                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                                : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                                            }
                                                        `}
                                                    >
                                                        {/* Selection Indicator */}
                                                        <div className={`
                                                            absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                            ${isSelected
                                                                ? 'border-primary bg-primary'
                                                                : 'border-border bg-background group-hover:border-primary/50'
                                                            }
                                                        `}>
                                                            {isSelected && <CheckCircle size={14} className="text-primary-foreground" />}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="pr-8">
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className={`
                                                                    p-2 rounded-lg transition-colors
                                                                    ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
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
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-border bg-muted/20">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setAssignModalData({ company: null, isOpen: false });
                                            setSelectedAssessmentIds([]);
                                            setAssessmentSearch('');
                                        }}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-background border border-border text-foreground hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAssignAssessments}
                                        disabled={isAssigning || selectedAssessmentIds.length === 0}
                                        className={`
                                            flex-1 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all
                                            ${selectedAssessmentIds.length === 0 || isAssigning
                                                ? 'bg-primary/50 cursor-not-allowed opacity-70'
                                                : 'bg-gradient-to-r from-primary to-indigo-600 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                            }
                                        `}
                                    >
                                        {isAssigning ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Briefcase size={18} />
                                                Assign {selectedAssessmentIds.length > 0 ? `(${selectedAssessmentIds.length})` : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* HISTORY MODAL */}
            <AnimatePresence>
                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-2xl p-8 rounded-[32px] shadow-2xl relative flex flex-col max-h-[80vh]"
                        >
                            <button
                                onClick={() => setShowHistory(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-500/20">
                                    <HistoryIcon size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Organization History</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">Audit log of all activities and changes.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                {historyLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 size={40} className="animate-spin text-primary/40" />
                                        <p className="text-sm text-muted-foreground animate-pulse">Retrieving audit logs...</p>
                                    </div>
                                ) : historyData.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock size={24} className="text-muted-foreground/50" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No history found for this organization.</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Activities will appear here once recorded.</p>
                                    </div>
                                ) : (
                                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                                        {historyData.map((event, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-sm
                                                    ${event.type === 'APPROVAL' ? 'bg-green-500 text-white' :
                                                        event.type === 'REJECTION' ? 'bg-red-500 text-white' :
                                                            event.type === 'ASSIGNMENT' ? 'bg-blue-500 text-white' : 'bg-slate-400 text-white'}`}
                                                >
                                                    {event.type === 'APPROVAL' ? <Check size={12} /> :
                                                        event.type === 'REJECTION' ? <X size={12} /> :
                                                            event.type === 'ASSIGNMENT' ? <Briefcase size={12} /> : <User size={12} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-bold text-sm text-foreground">{event.action || event.type}</span>
                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-muted px-2 py-0.5 rounded leading-none shrink-0">
                                                            {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground leading-relaxed italic">
                                                        {typeof (event.details || event.message) === 'object'
                                                            ? JSON.stringify(event.details || event.message)
                                                            : (event.details || event.message) || "No additional details recorded."}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex -space-x-1">
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                                                                <User size={10} className="text-primary" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-medium text-muted-foreground/80">
                                                            Performed by <span className="text-foreground">{event.performedBy?.username || event.performedBy || "System Admin"}</span>
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground/40">•</span>
                                                        <span className="text-[11px] font-medium text-muted-foreground/60">
                                                            {new Date(event.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border flex justify-end">
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="px-8 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                                >
                                    Close History
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
