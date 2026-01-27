"use client";

import React, { useRef } from 'react';
import {
    Mail,
    Search,
    Plus,
    Upload,
    RefreshCw,
    X,
    ArrowUpRight,
    Users,
    Filter,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Trash2
} from 'lucide-react';
import { invitationService, Invitation, InvitationStats } from '@/api/invitationService';
import { useState } from 'react';

interface InvitationsTabProps {
    invitations: Invitation[];
    stats: InvitationStats | null;
    filter: string;
    setFilter: (filter: string) => void;
    search: string;
    setSearch: (search: string) => void;
    onSearch: () => void;
    onResend: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    onInvite: () => void;
    onCsvUpload: (file: File) => void;
    assessmentId: string;
}

const InvitationsTab = ({
    invitations,
    stats,
    filter,
    setFilter,
    search,
    setSearch,
    onSearch,
    onResend,
    onCancel,
    onDelete,

    onInvite,
    onCsvUpload,
    assessmentId
}: InvitationsTabProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkEmails, setBulkEmails] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });

    const handleBulkInvite = async () => {
        // Just trimming the whole string, backend expects comma separated
        const emails = bulkEmails.trim();
        if (!emails) return;

        if (!assessmentId) {
            const { showToast } = await import('@/utils/toast');
            showToast("Assessment ID is missing. Please refresh the page.", "error");
            return;
        }

        setBulkLoading(true);
        // Estimate total by comma count for visual
        const estimatedTotal = emails.split(',').length;
        setBulkProgress({ current: 0, total: estimatedTotal, successes: 0, failures: 0 });

        const { showToast } = await import('@/utils/toast');

        try {
            console.log(`Sending bulk invites via new API for assessment ${assessmentId}`);

            // Single API call
            const response = await invitationService.bulkInviteEmails({
                assessmentId,
                emails,
                sendEmail: true
            });

            // The backend returns success stats directly
            const { sent, failed, errors } = response.data;

            // Update progress for visual feedback (jump to 100%)
            setBulkProgress({
                current: estimatedTotal,
                total: estimatedTotal,
                successes: sent,
                failures: failed
            });

            let toastMsg = `Bulk invite complete: ${sent} sent, ${failed} failed`;
            if (failed > 0 && errors && errors.length > 0) {
                // Capture first few unique errors to show user
                const uniqueErrors = Array.from(new Set(errors.map(e => e.error))).slice(0, 3);
                toastMsg += `. Errors: ${uniqueErrors.join(", ")}`;
            }

            showToast(toastMsg, failed > 0 ? (sent > 0 ? 'warning' : 'error') : 'success');

            if (sent > 0) {
                setBulkEmails('');
                setShowBulkModal(false);
                onSearch(); // Refresh list
            }

        } catch (error: any) {
            console.error(`Failed to send bulk invites`, error.response?.data || error.message);
            const msg = error.response?.data?.message || error.message || "Unknown error";
            showToast(`Failed to send bulk invites: ${msg}`, 'error');
        } finally {
            setBulkLoading(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-muted text-muted-foreground border-border';
            case 'sent': return 'bg-primary/10 text-primary border-primary/20';
            case 'accepted': return 'bg-primary/10 text-primary border-primary/20';
            case 'expired': return 'bg-muted/50 text-muted-foreground border-border/50';
            case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={14} />;
            case 'sent': return <Mail size={14} />;
            case 'accepted': return <CheckCircle2 size={14} />;
            case 'expired': return <AlertCircle size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return null;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onCsvUpload(file);
        if (e.target) e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-6 h-full">

            {/* Stats Bar */}
            {stats && (
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/30 border border-border rounded-xl">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Total:</span>
                        <span className="text-sm font-bold text-foreground">{stats.total}</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Pending:</span>
                        <span className="text-sm font-bold text-foreground">{stats.pending}</span>
                    </div>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-2 hidden sm:flex">
                        <Mail size={16} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Sent:</span>
                        <span className="text-sm font-bold text-foreground">{stats.sent}</span>
                    </div>
                    <div className="h-4 w-px bg-border hidden md:block" />
                    <div className="flex items-center gap-2 hidden md:flex">
                        <CheckCircle2 size={16} className="text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Accepted:</span>
                        <span className="text-sm font-bold text-primary">{stats.accepted}</span>
                    </div>
                    <div className="h-4 w-px bg-border hidden lg:block" />
                    <div className="flex items-center gap-2 hidden lg:flex">
                        <AlertCircle size={16} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Expired:</span>
                        <span className="text-sm font-bold text-muted-foreground">{stats.expired}</span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none md:min-w-[160px]">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-card border border-border rounded-xl py-3 pl-9 pr-8 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer appearance-none hover:bg-muted/30 transition-all font-medium"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                        </select>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium text-sm"
                    >
                        <Upload size={16} />
                        <span>Upload CSV</span>
                    </button>
                    <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileChange} />

                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium text-sm"
                    >
                        <Users size={16} />
                        <span>Bulk Invite</span>
                    </button>


                    <button
                        onClick={onInvite}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {invitations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Send size={28} className="text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">No invitations yet</h3>
                            <p className="text-muted-foreground text-sm max-w-[320px]">
                                Start inviting candidates by clicking the "Invite" button or upload a CSV file.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Candidate</th>
                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sent Date</th>
                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invitations.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    {inv.email}
                                                </span>
                                                {inv.name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {inv.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyles(inv.status)}`}>
                                                    {getStatusIcon(inv.status)}
                                                    <span className="capitalize">{inv.status}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not sent'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {inv.status !== 'accepted' && inv.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => onResend(inv.id)}
                                                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                                                        title="Resend Invite"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                                {inv.status !== 'accepted' && (
                                                    <button
                                                        onClick={() => onCancel(inv.id)}
                                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                                                        title="Cancel Invitation"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDelete(inv.id)}
                                                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                                                    title="Delete Invitation"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Bulk Modal */}
                <BulkInviteModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    onSend={handleBulkInvite}
                    loading={bulkLoading}
                    progress={bulkProgress}
                    value={bulkEmails}
                    onChange={setBulkEmails}
                />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: hsl(var(--border)); 
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background: hsl(var(--primary) / 0.5); 
                }
            `}</style>
        </div>
    );
};

// ========== UI COMPONENTS ==========

const BulkInviteModal = ({
    isOpen,
    onClose,
    onSend,
    loading,
    progress,
    value,
    onChange
}: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={!loading ? onClose : undefined} />
            <div className="relative bg-card border border-border rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-Inter text-foreground">Bulk Invite</h3>
                        <p className="text-sm text-muted-foreground mt-1">Enter email addresses separated by commas</p>
                    </div>
                    {!loading && (
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                            <X size={24} />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={loading}
                        placeholder="john@example.com, jane@example.com, ..."
                        className="w-full h-40 bg-muted/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 text-sm outline-none transition-all font-medium resize-none"
                    />

                    {loading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Processing {progress.total} emails...</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-br from-indigo-600 to-violet-600 animate-pulse"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3.5 border border-border rounded-2xl font-bold text-sm hover:bg-muted transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSend}
                            disabled={loading || !value.trim()}
                            className="flex-[1.5] px-6 py-3.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground rounded-2xl font-Inter text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    <span>Send Bulk Invites</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
);

export default InvitationsTab;
