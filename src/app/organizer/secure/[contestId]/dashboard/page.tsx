'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { contestService } from "@/api/contestService";
import { showToast } from "@/utils/toast";
import { submissionService } from "@/api/submissionService";
import {
    Users,
    Mail,
    Shield,
    FileText,
    Activity,
    RefreshCw,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    Camera,
    AlertTriangle,
    Link as LinkIcon,
    Copy,
    ChevronRight,
    User,
    TrendingUp,
    Timer,
    Award
} from "lucide-react";
import Loader from "@/components/Loader";

export default function SecureContestDashboard() {
    const params = useParams();
    const contestId = params?.contestId as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [contest, setContest] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'invites' | 'monitoring' | 'reports'>('invites');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Invite State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invites, setInvites] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);

    // Share Link State
    const [shareLink, setShareLink] = useState("");
    const [generatingLink, setGeneratingLink] = useState(false);

    // Monitoring State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [violations, setViolations] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [participants, setParticipants] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedUser, setSelectedUser] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userDetails, setUserDetails] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userViolations, setUserViolations] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [groupByUser, setGroupByUser] = useState(false);

    // Session Stats State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessionStats, setSessionStats] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [unifiedParticipants, setUnifiedParticipants] = useState<any[]>([]);

    const isValidUUID = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    useEffect(() => {
        if (contestId) {
            if (!isValidUUID(contestId)) {
                setError("Invalid Contest ID");
                setLoading(false);
                return;
            }
            fetchContestData();
        }
    }, [contestId]);

    useEffect(() => {
        if (contestId && isValidUUID(contestId)) {
            if (activeTab === 'invites') fetchInvites();
            if (activeTab === 'monitoring') fetchMonitoringData();
            if (activeTab === 'reports') fetchReportsData();
        }
    }, [contestId, activeTab]);

    const fetchContestData = async () => {
        try {
            const res = await contestService.getContestById(contestId!);
            setContest(res.data.data || res.data);
        } catch (err) {
            console.error(err);
            showToast("Failed to load contest data", "error");
            setError("Failed to load contest data");
        } finally {
            setLoading(false);
        }
    };

    const fetchInvites = async () => {
        try {
            const res = await contestService.getInvitations(contestId!);
            setInvites(res.data.data || res.data || []);
        } catch (err) {
            console.error("Failed to load invites", err);
        }
    };

    const fetchMonitoringData = async () => {
        try {
            const [vRes, pRes] = await Promise.all([
                contestService.getRealTimeViolations(contestId!),
                contestService.getLiveParticipants(contestId!)
            ]);

            // Handle loose data structures (array directly or nested in data)
            const rawViolations = Array.isArray(vRes.data) ? vRes.data : (vRes.data.data || []);
            const rawParticipants = Array.isArray(pRes.data) ? pRes.data : (pRes.data.data || []);

            setViolations(rawViolations);
            setParticipants(rawParticipants);
        } catch (err) {
            console.error("Failed to load monitoring data", err);
        }
    };

    const fetchReportsData = async () => {
        try {
            const [statsRes, participantsRes] = await Promise.all([
                submissionService.getSessionStats(contestId!),
                submissionService.getUnifiedParticipants(contestId!)
            ]);
            setSessionStats(statsRes.data || null);
            setUnifiedParticipants(participantsRes.data || []);
        } catch (err) {
            console.error("Failed to load reports data", err);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserSelect = async (user: any) => {
        // Handle mapping userId correctly from different response structures
        const targetUserId = user.userId || user.id;

        setSelectedUser(user);
        setLoadingDetails(true);
        try {
            const [flagsRes, violationsRes] = await Promise.all([
                contestService.getUserFlags(contestId!, targetUserId),
                contestService.getUserViolations(contestId!, targetUserId)
            ]);

            setUserDetails(flagsRes.data.data || flagsRes.data);
            setUserViolations(violationsRes.data.data || violationsRes.data || []);
        } catch (err) {
            console.error("Failed to load user details", err);
            showToast("Failed to load user details", "error");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setInviteLoading(true);
        try {
            await contestService.sendInvite(contestId!, newEmail);
            showToast(`Invite sent to ${newEmail}`, "success");
            setNewEmail("");
            fetchInvites();
        } catch (err) {
            showToast("Failed to send invite", "error");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleBulkInvite = async () => {
        if (!bulkEmails) return;
        const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return;

        setInviteLoading(true);
        try {
            await contestService.sendBulkInvites(contestId!, emails);
            showToast(`Sent ${emails.length} invites`, "success");
            setBulkEmails("");
            fetchInvites();
        } catch (err) {
            showToast("Failed to send bulk invites", "error");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevoke = async (invitationId: string) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await contestService.revokeInvitation(invitationId);
            showToast("Invitation revoked", "success");
            fetchInvites();
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

    // Helper to get username safely from various sources
    const getUsername = (userId: string) => {
        // 1. Try finding in participants list
        const participant = participants.find(p => p.userId === userId || p.id === userId);
        if (participant) return participant.name || participant.username;

        // 2. Try finding embedded user in violations list
        const violation = violations.find(v => v.userId === userId && v.user);
        if (violation) return violation.user.username || violation.user.name;

        return "Unknown User";
    };

    // Helper to get clean violation text
    const formatViolationType = (type: string) => {
        if (!type) return "Unknown Violation";
        return type.replace(/_/g, ' ');
    };

    // Group violations by user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedViolations = violations.reduce((acc: any, v: any) => {
        const uid = v.userId;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(v);
        return acc;
    }, {});

    if (loading) return <Loader fullscreen />;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-bg">
                <div className="text-center p-8 bg-theme-secondary/20 rounded-3xl border border-theme/30">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-theme-primary mb-2">{error}</h2>
                    <p className="text-theme-secondary mb-6">The contest ID provided is invalid or could not be loaded.</p>
                    <Link href="/organizer/contests" className="px-6 py-2 bg-theme-accent text-white rounded-xl">
                        Go Back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-theme-secondary/30 p-6 rounded-3xl border border-theme/30 backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-theme-primary">{contest?.title}</h1>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1">
                                <Shield size={12} /> Secure Mode
                            </span>
                        </div>
                        <p className="text-theme-secondary text-sm">Manage invites, monitor integrity, and view reports.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchContestData} className="p-2 rounded-lg bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary transition">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-theme/30 pb-1">
                    {[
                        { id: 'invites', label: 'Invitations', icon: Mail },
                        { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
                        { id: 'reports', label: 'Reports & Results', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                                ? 'border-theme-accent text-theme-accent'
                                : 'border-transparent text-theme-secondary hover:text-theme-primary'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">

                    {/* --- INVITES TAB --- */}
                    {activeTab === 'invites' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Invite Form */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-theme-secondary/20 p-5 rounded-2xl border border-theme/30">
                                    <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                                        <Plus size={18} /> Send Invite
                                    </h3>
                                    <form onSubmit={handleSendInvite} className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder="candidate@example.com"
                                            className="w-full p-3 rounded-xl bg-theme-bg border border-theme/50 focus:border-theme-accent outline-none"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="w-full py-2.5 rounded-xl bg-theme-accent text-white font-medium hover:opacity-90 transition"
                                        >
                                            {inviteLoading ? "Sending..." : "Send Invitation"}
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-theme-secondary/20 p-5 rounded-2xl border border-theme/30">
                                    <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                                        <Users size={18} /> Bulk Invite
                                    </h3>
                                    <textarea
                                        placeholder="Paste emails separated by commas or new lines..."
                                        rows={5}
                                        className="w-full p-3 rounded-xl bg-theme-bg border border-theme/50 focus:border-theme-accent outline-none mb-3"
                                        value={bulkEmails}
                                        onChange={e => setBulkEmails(e.target.value)}
                                    />
                                    <button
                                        onClick={handleBulkInvite}
                                        disabled={inviteLoading}
                                        className="w-full py-2.5 rounded-xl bg-theme-primary/20 text-theme-primary font-medium hover:bg-theme-primary/30 transition border border-theme/30"
                                    >
                                        Process Bulk List
                                    </button>
                                </div>

                                {/* Share Link Card */}
                                <div className="bg-theme-secondary/20 p-5 rounded-2xl border border-theme/30">
                                    <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                                        <LinkIcon size={18} /> Shareable Link
                                    </h3>
                                    <p className="text-xs text-theme-secondary mb-4">
                                        Generate a public link for this contest. Users can request to join via this link.
                                    </p>

                                    {!shareLink ? (
                                        <button
                                            onClick={handleGenerateLink}
                                            disabled={generatingLink}
                                            className="w-full py-2.5 rounded-xl bg-theme-primary/10 text-theme-primary font-medium hover:bg-theme-primary/20 transition border border-theme/30"
                                        >
                                            {generatingLink ? "Generating..." : "Generate Link"}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-theme-bg p-2 rounded-xl border border-theme/50">
                                            <input
                                                type="text"
                                                readOnly
                                                value={shareLink}
                                                className="bg-transparent text-xs text-theme-secondary flex-1 outline-none"
                                            />
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-1.5 rounded-lg hover:bg-theme-primary/10 text-theme-accent transition"
                                                title="Copy Link"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invite List */}
                            <div className="lg:col-span-2 bg-theme-secondary/20 rounded-2xl border border-theme/30 overflow-hidden">
                                <div className="p-4 border-b border-theme/30 flex justify-between items-center">
                                    <h3 className="font-semibold text-theme-primary">Sent Invitations ({invites.length})</h3>
                                    <button onClick={fetchInvites} className="text-xs text-theme-accent hover:underline">Refresh List</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-theme-primary/10 text-theme-secondary uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Sent At</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-theme/20">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {invites.map((inv: any) => (
                                                <tr key={inv.id} className="hover:bg-theme-primary/5">
                                                    <td className="px-4 py-3 text-theme-primary font-medium">{inv.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs border ${inv.status === 'ACCEPTED'
                                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-theme-secondary text-xs">
                                                        {new Date(inv.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleRevoke(inv.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition"
                                                            title="Revoke Invite"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {invites.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-theme-secondary">
                                                        No invitations sent yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- MONITORING TAB --- */}
                    {activeTab === 'monitoring' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Live Feed */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-theme-secondary/20 rounded-2xl border border-theme/30 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                                            <AlertTriangle className="text-red-500" size={20} /> Violation Feed
                                        </h3>
                                        <button
                                            onClick={() => setGroupByUser(!groupByUser)}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary transition"
                                        >
                                            {groupByUser ? "Show Chronological" : "Group by User"}
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {groupByUser ? (
                                            // Grouped View
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            Object.entries(groupedViolations).map(([userId, userViolations]: [string, any]) => (
                                                <div key={userId} className="p-4 rounded-xl bg-theme-bg border border-theme/30">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-bold text-theme-primary">{getUsername(userId)}</h4>
                                                        <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-500 rounded-full">
                                                            {userViolations.length} Violations
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                        {userViolations.slice(0, 3).map((v: any, idx: number) => (
                                                            <div key={idx} className="text-xs text-theme-secondary flex justify-between">
                                                                <span>{formatViolationType(v.violationType)}</span>
                                                                <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                                                            </div>
                                                        ))}
                                                        {userViolations.length > 3 && (
                                                            <div className="text-xs text-center text-theme-secondary pt-1">
                                                                + {userViolations.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            // Chronological View
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            violations.map((v: any, idx: number) => {
                                                const vType = v.violationType || 'UNKNOWN';
                                                return (
                                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-theme-bg border border-theme/30 hover:border-red-500/30 transition">
                                                        <div className="mt-1">
                                                            {(vType === 'TAB_SWITCH' || vType.includes('TAB')) ?
                                                                <Activity size={16} className="text-orange-400" /> :
                                                                <Camera size={16} className="text-red-400" />
                                                            }
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-semibold text-theme-primary">
                                                                    {formatViolationType(vType)}
                                                                </p>
                                                                <span className="text-[10px] text-theme-secondary bg-theme-primary/5 px-2 py-1 rounded-full">
                                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-theme-accent mt-1 font-medium">
                                                                {getUsername(v.userId)}
                                                            </p>
                                                            {v.metadata && (
                                                                <p className="text-[10px] text-theme-secondary mt-1 opacity-70">
                                                                    Details: {JSON.stringify(v.metadata).slice(0, 50)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}

                                        {violations.length === 0 && (
                                            <p className="text-center text-theme-secondary py-10">No violations detected yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Participants List & Details */}
                            <div className="bg-theme-secondary/20 rounded-2xl border border-theme/30 p-5 flex flex-col h-[600px]">
                                <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
                                    <Users className="text-blue-500" size={20} /> Live Participants
                                </h3>

                                {selectedUser ? (
                                    <div className="flex-1 overflow-y-auto pr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="mb-4 text-xs text-theme-secondary hover:text-theme-primary flex items-center gap-1"
                                        >
                                            ← Back to List
                                        </button>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                {selectedUser.photoUrl ? (
                                                    <img
                                                        src={selectedUser.photoUrl}
                                                        alt={selectedUser.name}
                                                        className="w-12 h-12 rounded-full border-2 border-theme-accent object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-theme-primary/10 flex items-center justify-center">
                                                        <User size={24} className="text-theme-secondary" />
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="text-lg font-bold text-theme-primary">{selectedUser.name || selectedUser.username}</h4>
                                                    <p className="text-xs text-theme-secondary truncate max-w-[150px]">{selectedUser.email}</p>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-6">
                                            {userDetails && (
                                                <div className={`text-center py-2 rounded-xl text-xs font-bold border ${userDetails.isSuspicious
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                    : "bg-green-500/10 text-green-500 border-green-500/20"
                                                    }`}>
                                                    STATUS: {userDetails.isSuspicious ? "SUSPICIOUS" : "CLEAN"}
                                                </div>
                                            )}
                                        </div>

                                        {loadingDetails ? (
                                            <div className="flex justify-center py-10"><Loader /></div>
                                        ) : userDetails ? (
                                            <div className="space-y-6">
                                                {/* Score Card */}
                                                <div className="p-4 rounded-xl bg-theme-bg border border-theme/30">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-theme-secondary">Suspicion Score</span>
                                                        <span className={`text-2xl font-black ${userDetails.suspiciousScore > 50 ? "text-red-500" : "text-theme-primary"
                                                            }`}>
                                                            {userDetails.suspiciousScore}/100
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-theme-secondary/20 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${userDetails.suspiciousScore > 50 ? "bg-red-500" : "bg-green-500"
                                                                }`}
                                                            style={{ width: `${userDetails.suspiciousScore}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Violation Stats */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 rounded-xl bg-theme-bg border border-theme/30 text-center">
                                                        <div className="text-xs text-theme-secondary mb-1">Tab Switches</div>
                                                        <div className="text-lg font-bold text-orange-400">
                                                            {userDetails.details?.tabSwitchCount || 0}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-theme-bg border border-theme/30 text-center">
                                                        <div className="text-xs text-theme-secondary mb-1">Copy/Paste</div>
                                                        <div className="text-lg font-bold text-red-400">
                                                            {userDetails.details?.externalPasteCount || 0}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Recent User Violations */}
                                                <div>
                                                    <h5 className="text-sm font-bold text-theme-primary mb-3">Recent Activity</h5>
                                                    <div className="space-y-2">
                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                        {userViolations.map((v: any, idx: number) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-theme-bg/50 border border-theme/10 text-xs">
                                                                <span className="text-theme-secondary">{formatViolationType(v.violationType)}</span>
                                                                <span className="text-theme-secondary/50">
                                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {userViolations.length === 0 && (
                                                            <p className="text-center text-theme-secondary text-xs py-4">No violations recorded.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-center text-theme-secondary">No data available.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {participants.map((p: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleUserSelect(p)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-theme-bg border border-theme/30 hover:border-theme-accent/50 transition group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {p.photoUrl ? (
                                                            <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-theme/30" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center border border-theme/30">
                                                                <span className="text-xs font-bold text-theme-primary">{p.name?.charAt(0) || '?'}</span>
                                                            </div>
                                                        )}
                                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-theme-bg ${p.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                    </div>

                                                    <div>
                                                        <span className="text-sm font-medium text-theme-primary block group-hover:text-theme-accent transition">
                                                            {p.name || "Unknown"}
                                                        </span>
                                                        <span className="text-[10px] text-theme-secondary truncate max-w-[120px] block">{p.email}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-theme-secondary group-hover:text-theme-accent" />
                                            </button>
                                        ))}
                                        {participants.length === 0 && (
                                            <p className="text-center text-theme-secondary py-10">No active participants.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- REPORTS TAB --- */}
                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            {/* Session Statistics Cards */}
                            {sessionStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-2xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-3 bg-cyan-500/10 rounded-xl">
                                                <TrendingUp className="text-cyan-400" size={24} />
                                            </div>
                                            <span className="text-3xl font-black text-cyan-400">{sessionStats.totalStarted || 0}</span>
                                        </div>
                                        <h3 className="text-sm font-medium text-theme-secondary">Total Started</h3>
                                    </div>

                                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                                <Activity className="text-amber-400" size={24} />
                                            </div>
                                            <span className="text-3xl font-black text-amber-400">{sessionStats.currentlyActive || 0}</span>
                                        </div>
                                        <h3 className="text-sm font-medium text-theme-secondary">Currently Active</h3>
                                    </div>

                                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                                <CheckCircle className="text-emerald-400" size={24} />
                                            </div>
                                            <span className="text-3xl font-black text-emerald-400">{sessionStats.finished || 0}</span>
                                        </div>
                                        <h3 className="text-sm font-medium text-theme-secondary">Finished</h3>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                                <Timer className="text-purple-400" size={24} />
                                            </div>
                                            <span className="text-3xl font-black text-purple-400">
                                                {Math.floor((sessionStats.averageDuration || 0) / 60)}m
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium text-theme-secondary">Avg Duration</h3>
                                    </div>
                                </div>
                            )}

                            {/* Unified Participants Table */}
                            <div className="bg-theme-secondary/20 rounded-2xl border border-theme/30 overflow-hidden">
                                <div className="p-6 border-b border-theme/30 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                                        <Users size={20} className="text-cyan-500" />
                                        All Participants ({unifiedParticipants.length})
                                    </h3>
                                    <button onClick={fetchReportsData} className="text-xs text-theme-accent hover:underline flex items-center gap-1">
                                        <RefreshCw size={12} /> Refresh
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-theme-primary/10 text-theme-secondary uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-3 text-left">User</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                                <th className="px-6 py-3 text-left">Started At</th>
                                                <th className="px-6 py-3 text-left">Finished At</th>
                                                <th className="px-6 py-3 text-left">Score</th>
                                                <th className="px-6 py-3 text-left">Blocked</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-theme/20">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {unifiedParticipants.map((participant: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-theme-primary/5 transition">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-theme-primary">{participant.username || 'N/A'}</div>
                                                            <div className="text-xs text-theme-secondary">{participant.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${participant.status === 'finished' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                            participant.status === 'started' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                participant.status === 'registered' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                            } uppercase`}>
                                                            {participant.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-theme-secondary text-xs">
                                                        {participant.startedAt ? new Date(participant.startedAt).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-theme-secondary text-xs">
                                                        {participant.finishedAt ? new Date(participant.finishedAt).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {participant.score !== undefined && participant.score !== null ? (
                                                            <span className="flex items-center gap-1 text-sm font-medium text-cyan-400">
                                                                <Award size={14} />
                                                                {participant.score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-theme-secondary">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {participant.isBlocked ? (
                                                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                                                <XCircle size={14} />
                                                                Blocked
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                                                <CheckCircle size={14} />
                                                                Allowed
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {unifiedParticipants.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-10 text-center text-theme-secondary italic">
                                                        No participants data available.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
