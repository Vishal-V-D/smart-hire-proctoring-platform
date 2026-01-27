"use client";

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, CheckCircle, Mail, Clock } from 'lucide-react';
import { invitationService } from '@/api/invitationService';

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
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
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
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border font-bold">
                                <tr>
                                    <th className="px-6 py-4">Participant</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Invited At</th>
                                    <th className="px-6 py-4 text-center">Accepted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {participants.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                    {(p.user?.email || p.invitationEmail || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="font-bold text-foreground text-sm">
                                                        {p.user?.email || p.invitationEmail}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.acceptedAt ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-Inter uppercase border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    <CheckCircle size={12} /> Joined
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-Inter uppercase border bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                    <Clock size={12} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-muted-foreground font-medium">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-muted-foreground font-medium">
                                            {p.acceptedAt ? new Date(p.acceptedAt).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-50 hover:bg-background transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-50 hover:bg-background transition-colors"
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

export default ParticipantsTab;
