// src/views/organizer/AdminManagement.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaUserShield, FaPlus, FaSearch, FaFilter, FaEllipsisV,
    FaTrashAlt, FaBan, FaRedo, FaLink, FaUserEdit,
    FaShieldAlt,
    FaCheck,
    FaHistory
} from 'react-icons/fa';
import { adminService, AdminBase, AdminStatus, AccessType } from '@/api/adminService';
import { CreateAdminModal, EditAdminModal } from '@/components/organizer/AdminManagementModals';
import { showToast } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminManagement() {
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<AdminStatus | "ALL">("ALL");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminBase | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter !== "ALL") params.status = statusFilter;
            const res = await adminService.listAdmins(params);
            // Fix: Fallback to res.data if res.data.data is undefined
            const adminsList = res.data?.data?.admins || res.data?.admins || [];
            setAdmins(adminsList);
        } catch (err) {
            console.error("Failed to fetch admins", err);
            showToast("Failed to load team admins.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [statusFilter]);

    const filteredAdmins = admins.filter(admin =>
        admin.fullName.toLowerCase().includes(search.toLowerCase()) ||
        admin.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAction = async (admin: AdminBase, action: 'disable' | 'enable' | 'delete' | 'resend' | 'reset') => {
        setActiveMenuId(null);
        try {
            switch (action) {
                case 'disable':
                    await adminService.disableAdmin(admin.id, true);
                    showToast(`${admin.fullName} has been disabled.`, "success");
                    break;
                case 'enable':
                    await adminService.disableAdmin(admin.id, false);
                    showToast(`${admin.fullName} has been re-enabled.`, "success");
                    break;
                case 'delete':
                    if (confirm(`Are you sure you want to delete ${admin.fullName}? This cannot be undone.`)) {
                        await adminService.deleteAdmin(admin.id);
                        showToast(`${admin.fullName} has been deleted.`, "success");
                    }
                    break;
                case 'resend':
                    await adminService.resendLoginLink(admin.id);
                    showToast("Magic login link resent.", "success");
                    break;
                case 'reset':
                    await adminService.resetAdminPassword(admin.id);
                    showToast("Password reset email sent.", "success");
                    break;
            }
            fetchAdmins();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Action failed.", "error");
        }
    };

    const getStatusStyles = (status: AdminStatus) => {
        switch (status) {
            case AdminStatus.ACTIVE:
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case AdminStatus.PENDING:
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            case AdminStatus.INACTIVE:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700";
            default:
                return "bg-theme-tertiary text-theme-secondary";
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                        <FaUserShield size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Team Admins</h1>
                        <p className="text-muted-foreground mt-1">Manage collaborators and their assessment access.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-primary/20 group flex items-center justify-center gap-2"
                >
                    <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Invite New Admin</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted-foreground text-sm font-medium">Total Admins</span>
                    <span className="text-3xl font-bold text-foreground">{admins.length}</span>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted-foreground text-sm font-medium">Active Accounts</span>
                    <span className="text-3xl font-bold text-foreground">{admins.filter(a => a.status === AdminStatus.ACTIVE).length}</span>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted-foreground text-sm font-medium">Whole Access</span>
                    <span className="text-3xl font-bold text-foreground">{admins.filter(a => a.accessType === AccessType.WHOLE).length}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="h-11 pl-12 pr-8 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value={AdminStatus.ACTIVE}>Active</option>
                            <option value={AdminStatus.PENDING}>Pending</option>
                            <option value={AdminStatus.INACTIVE}>Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm">
                <div className="overflow-x-visible">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-theme last:border-0">
                                        <td className="px-6 py-6"><div className="h-4 bg-theme-tertiary rounded w-32"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-theme-tertiary rounded w-24"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 bg-theme-tertiary rounded-full w-20"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-theme-tertiary rounded w-28"></div></td>
                                        <td className="px-6 py-6"><div className="h-8 bg-theme-tertiary rounded-lg w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-theme-secondary italic">
                                        No admins found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="border-b border-theme last:border-0 hover:bg-theme-secondary/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-accent))]/10 border border-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-bold overflow-hidden shadow-sm">
                                                    {admin.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-theme-primary text-sm">{admin.fullName}</span>
                                                    <span className="text-xs text-theme-secondary">{admin.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-xs font-bold flex items-center gap-1.5 ${admin.accessType === AccessType.WHOLE ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                    <FaShieldAlt size={10} /> {admin.accessType}
                                                </span>
                                                <span className="text-[10px] text-theme-muted">
                                                    {admin.accessType === AccessType.WHOLE ? 'All Assessments' : `${admin.assessmentCount || 0} Assessments`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyles(admin.status)}`}>
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-theme-secondary">
                                            {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === admin.id ? null : admin.id)}
                                                    className="p-2 rounded-lg hover:bg-theme-tertiary text-theme-secondary transition-colors"
                                                >
                                                    <FaEllipsisV />
                                                </button>

                                                <AnimatePresence>
                                                    {activeMenuId === admin.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-10"
                                                                onClick={() => setActiveMenuId(null)}
                                                            />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                                className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-card border border-border shadow-2xl z-20 py-2 overflow-hidden"
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAdmin(admin);
                                                                        setIsEditModalOpen(true);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                                                >
                                                                    <FaUserEdit className="text-primary" /> Edit Permissions
                                                                </button>

                                                                <button
                                                                    onClick={() => router.push(`/organizer/admins/${admin.id}/history`)}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                                                >
                                                                    <FaHistory className="text-blue-500" /> View History
                                                                </button>

                                                                {admin.status === AdminStatus.PENDING && (
                                                                    <button
                                                                        onClick={() => handleAction(admin, 'resend')}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <FaLink className="text-primary" /> Resend Login Link
                                                                    </button>
                                                                )}

                                                                {admin.status === AdminStatus.ACTIVE && (
                                                                    <button
                                                                        onClick={() => handleAction(admin, 'reset')}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <FaRedo className="text-amber-500" /> Reset Password
                                                                    </button>
                                                                )}

                                                                <div className="h-px bg-border my-1 mx-2" />

                                                                {admin.status !== AdminStatus.INACTIVE ? (
                                                                    <button
                                                                        onClick={() => handleAction(admin, 'disable')}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-500/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <FaBan /> Disable Account
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAction(admin, 'enable')}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-500/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <FaCheck /> Enable Account
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => handleAction(admin, 'delete')}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-500/5 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <FaTrashAlt /> Delete Admin
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CreateAdminModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchAdmins}
            />
            <EditAdminModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchAdmins}
                admin={selectedAdmin}
            />
        </div>
    );
}
