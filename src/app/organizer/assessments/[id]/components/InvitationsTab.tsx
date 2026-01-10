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
import { Invitation, InvitationStats } from '@/api/invitationService';

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
    onCsvUpload
}: InvitationsTabProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        onClick={onInvite}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm"
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