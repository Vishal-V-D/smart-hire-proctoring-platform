import React, { useState } from 'react';
import {
    Users, Trash2, Link as LinkIcon, Copy, Upload, FileSpreadsheet, Mail, Send, CheckCircle, Clock, AlertTriangle, Search, Loader2
} from "lucide-react";
import { contestService, Invitation } from "../../api/contestService";
import { showToast } from "../../utils/toast";

interface SecureDashboardInvitesProps {
    contestId: string;
    invites: Invitation[];
    onRefresh: () => void;
}

export default function SecureDashboardInvites({ contestId, invites, onRefresh }: SecureDashboardInvitesProps) {
    const [newEmail, setNewEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [generatingLink, setGeneratingLink] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredInvites = invites.filter(inv =>
        inv.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; text: string; bg: string; border: string; icon: any }> = {
            PENDING: { color: 'text-amber-600', text: 'Pending', bg: 'bg-amber-100', border: 'border-amber-200', icon: Clock },
            ACCEPTED: { color: 'text-blue-600', text: 'Accepted', bg: 'bg-blue-100', border: 'border-blue-200', icon: CheckCircle },
            REGISTERED: { color: 'text-indigo-600', text: 'Registered', bg: 'bg-indigo-100', border: 'border-indigo-200', icon: Users },
            STARTED: { color: 'text-purple-600', text: 'In Progress', bg: 'bg-purple-100', border: 'border-purple-200', icon: LinkIcon },
            FINISHED: { color: 'text-emerald-600', text: 'Completed', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: CheckCircle }
        };
        return badges[status] || { color: 'text-gray-600', text: status, bg: 'bg-gray-100', border: 'border-gray-200', icon: AlertTriangle };
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setInviteLoading(true);
        try {
            await contestService.sendInvite(contestId!, newEmail);
            showToast(`Invite sent to ${newEmail}`, "success");
            setNewEmail("");
            onRefresh();
        } catch (err) {
            showToast("Failed to send invite", "error");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleBulkInvite = async () => {
        if (!bulkEmails) return;
        const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            showToast("No valid emails to send", "error");
            return;
        }

        setInviteLoading(true);
        try {
            await contestService.sendBulkInvites(contestId!, emails);
            showToast(`Sent ${emails.length} invites`, "success");
            setBulkEmails("");
            setCsvFile(null);
            onRefresh();
        } catch (err) {
            showToast("Failed to send bulk invites", "error");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showToast("Please upload a CSV file", "error");
            return;
        }

        setCsvFile(file);
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            const emails: string[] = [];
            const lines = text.split('\n');
            lines.forEach((line) => {
                if (!line.trim()) return;
                const columns = line.split(',');
                const email = columns[0]?.trim();
                if (email && email.includes('@') && email.includes('.')) {
                    emails.push(email);
                }
            });

            if (emails.length === 0) {
                showToast("No valid emails found in CSV", "error");
                setCsvFile(null);
                return;
            }

            const currentEmails = bulkEmails.trim();
            const newEmailList = currentEmails
                ? currentEmails + '\n' + emails.join('\n')
                : emails.join('\n');

            setBulkEmails(newEmailList);
            showToast(`Extracted ${emails.length} emails from CSV`, "success");
        };

        reader.onerror = () => {
            showToast("Failed to read CSV file", "error");
            setCsvFile(null);
        };

        reader.readAsText(file);
        e.target.value = '';
    };

    const handleRevoke = async (invitationId: string) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await contestService.revokeInvitation(invitationId);
            showToast("Invitation revoked", "success");
            onRefresh();
        } catch (err) {
            showToast("Failed to revoke", "error");
        }
    };

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        try {
            const res = await contestService.generateShareableLink(contestId!);
            const code = res.data.data?.code || res.data.code;
            if (code) {
                const link = `${window.location.origin}/invitation/${code}`;
                setShareLink(link);
            }
        } catch (err) {
            showToast("Failed to generate share link", "error");
        } finally {
            setGeneratingLink(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        showToast("Link copied to clipboard!", "success");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">

            {/* --- LEFT COLUMN: INVITE ACTIONS (Colorful Cards) --- */}
            <div className="lg:col-span-4 space-y-6">

                {/* 1. SINGLE INVITE CARD */}
                <div className="bg-[#d4f7da] p-6 rounded-[30px] shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/40 rounded-full blur-3xl group-hover:bg-white/50 transition-all" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                            <Mail size={18} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">Quick Invite</h3>
                        <p className="text-sm text-gray-600 mb-6 font-medium opacity-80">Send a direct email invitation</p>

                        <form onSubmit={handleSendInvite} className="space-y-3">
                            <div className="bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl border border-white/40 flex items-center shadow-sm focus-within:ring-2 ring-emerald-500/20 transition-all">
                                <input
                                    type="email"
                                    placeholder="candidate@email.com"
                                    className="w-full bg-transparent px-3 py-2 text-sm font-semibold placeholder:text-gray-500 outline-none text-gray-800"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={inviteLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                {inviteLoading ? <Loader2 className="animate-spin" size={20} /> : <>Send Invite <Send size={18} /></>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. BULK INVITE CARD */}
                <div className="bg-[#ff8a65] p-6 rounded-[30px] shadow-lg relative overflow-hidden group text-white">
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <Users size={18} />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Bulk Upload</h3>
                        <p className="text-sm opacity-90 mb-6 font-medium">Import candidates via CSV</p>

                        <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-3">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70">CSV / Text</span>
                                <label className="cursor-pointer bg-white text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm hover:shadow-md">
                                    <Upload size={12} /> Upload CSV
                                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                                </label>
                            </div>
                            <textarea
                                placeholder="Paste emails here..."
                                rows={3}
                                className="w-full bg-transparent text-sm placeholder:text-white/40 outline-none resize-none font-mono custom-scrollbar"
                                value={bulkEmails}
                                onChange={e => setBulkEmails(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleBulkInvite}
                            disabled={inviteLoading || !bulkEmails}
                            className="w-full py-3.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            Process List <FileSpreadsheet size={18} />
                        </button>
                    </div>
                </div>

                {/* 3. SHARE LINK CARD */}
                <div className="bg-[#22d3ee] p-6 rounded-[30px] shadow-lg relative overflow-hidden group text-gray-900">
                    <div className="absolute right-[-20%] top-[-20%] w-60 h-60 bg-white/30 rounded-full blur-3xl opacity-60" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-black/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <LinkIcon size={18} />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Public Access</h3>
                        <p className="text-sm text-gray-800 mb-6 font-medium opacity-80">Generate a shareable signup link</p>

                        {!shareLink ? (
                            <button
                                onClick={handleGenerateLink}
                                disabled={generatingLink}
                                className="w-full py-4 bg-white hover:bg-cyan-50 text-cyan-700 rounded-2xl font-bold shadow-lg shadow-cyan-900/10 transition flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                {generatingLink ? <Loader2 className="animate-spin" size={18} /> : <>Generate Link <LinkIcon size={18} /></>}
                            </button>
                        ) : (
                            <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl flex items-center border border-white/50 shadow-sm">
                                <span className="text-xs font-mono px-3 truncate flex-1 font-semibold">{shareLink}</span>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2.5 bg-white rounded-xl text-cyan-600 shadow-md hover:scale-105 transition"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* --- RIGHT COLUMN: USER TABLE --- */}
            <div className="lg:col-span-8">
                <div className="bg-white dark:bg-[#1e1e2d] rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[800px]">

                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                                    <Users size={20} />
                                </span>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Participant List</h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor invitation status and contest entry.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="pl-11 pr-5 py-3 bg-gray-50 dark:bg-[#151520] border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={onRefresh}
                                className="p-3 text-gray-400 hover:text-indigo-500 bg-gray-50 dark:bg-[#151520] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition border border-gray-200 dark:border-gray-800"
                            >
                                <Loader2 size={18} className={inviteLoading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User Details</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Activity Log</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredInvites.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-500 flex items-center justify-center font-bold text-sm">
                                                    {inv.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-700 dark:text-gray-200">{inv.email}</div>
                                                    <div className="text-xs text-xs text-gray-400">ID: {inv.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {(() => {
                                                const badge = getStatusBadge(inv.status);
                                                const BadgeIcon = badge.icon;
                                                return (
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${badge.bg} ${badge.color} ${badge.border}`}>
                                                        <BadgeIcon size={14} />
                                                        {badge.text}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <Mail size={12} />
                                                    Sent {new Date(inv.invitedAt || inv.createdAt || "").toLocaleDateString()}
                                                </div>
                                                {inv.statusDetails?.registeredAt && (
                                                    <div className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-2 font-medium">
                                                        <CheckCircle size={12} />
                                                        Joined {new Date(inv.statusDetails.registeredAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleRevoke(inv.id)}
                                                className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-xs font-bold opacity-0 group-hover:opacity-100 ml-auto"
                                                title="Revoke and Delete"
                                            >
                                                <Trash2 size={14} />
                                                <span>Revoke</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInvites.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-32 text-center text-gray-400">
                                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-medium">No participants found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}
