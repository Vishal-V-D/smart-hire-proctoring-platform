'use client'

import React, { useState, useEffect } from 'react';
import {
    FaBuilding, FaUserClock, FaCheck, FaTimes, FaSearch, FaGlobe, FaEnvelope, FaHistory
} from 'react-icons/fa';
import { companyService } from '@/api/companyService';
import { showToast } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingData {
    companies: any[];
    users: any[];
}

export default function PartnerRequests() {
    const [data, setData] = useState<PendingData>({ companies: [], users: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');

    const [historyData, setHistoryData] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await companyService.getPendingRequests();
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch pending requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApproveCompany = async (id: string) => {
        try {
            await companyService.approveCompany(id);
            showToast("Company approved successfully", "success");
            fetchPending();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to approve company", "error");
        }
    };

    const handleRejectCompany = async (id: string) => {
        if (!confirm('Are you sure you want to reject this company?')) return;
        try {
            await companyService.rejectCompany(id);
            showToast("Company rejected", "success");
            fetchPending();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to reject company", "error");
        }
    };

    const handleApproveUser = async (id: string) => {
        try {
            await companyService.approveUser(id);
            showToast("User approved successfully", "success");
            fetchPending();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to approve user", "error");
        }
    };

    const handleRejectUser = async (id: string) => {
        if (!confirm('Are you sure you want to reject this user?')) return;
        try {
            await companyService.rejectUser(id);
            showToast("User rejected", "success");
            fetchPending();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to reject user", "error");
        }
    };

    const handleViewHistory = async (companyId: string) => {
        setShowHistory(true);
        setHistoryLoading(true);
        setHistoryData([]);
        try {
            const res = await companyService.getCompanyHistory(companyId);
            setHistoryData(res.data);
        } catch (err: any) {
            console.error(err);
            showToast("Failed to load history", "error");
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                    <FaUserClock size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Partner Requests</h1>
                    <p className="text-muted-foreground mt-1">Review and approve company registrations and team member requests.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('companies')}
                    className={`pb-4 px-4 text-sm font-bold transition-colors relative ${activeTab === 'companies' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <FaBuilding /> Pending Companies
                        {data.companies.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {data.companies.length}
                            </span>
                        )}
                    </span>
                    {activeTab === 'companies' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-4 text-sm font-bold transition-colors relative ${activeTab === 'users' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <FaUserClock /> Pending Users
                        {data.users.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {data.users.length}
                            </span>
                        )}
                    </span>
                    {activeTab === 'users' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading specific requests...</div>
                ) : activeTab === 'companies' ? (
                    <CompanyRequestsList
                        requests={data.companies}
                        onApprove={handleApproveCompany}
                        onReject={handleRejectCompany}
                        onViewHistory={handleViewHistory}
                    />
                ) : (
                    <UserRequestsList
                        requests={data.users}
                        onApprove={handleApproveUser}
                        onReject={handleRejectUser}
                    />
                )}
            </div>

            {/* History Modal */}
            <AnimatePresence>
                {showHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-2xl max-h-[80vh] flex flex-col rounded-[24px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FaHistory className="text-primary" /> Audit History
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-muted rounded-full">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {historyLoading ? (
                                    <div className="text-center py-8">Loading history...</div>
                                ) : historyData.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No history found for this entity.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {historyData.map((log: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                                                <div className="mt-1">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-sm">{log.action || 'Action'}</h4>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                                                    {log.performedBy && (
                                                        <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                                            <FaUserClock size={10} /> {log.performedBy}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CompanyRequestsList({ requests, onApprove, onReject, onViewHistory }: {
    requests: any[],
    onApprove: (id: string) => void,
    onReject: (id: string) => void,
    onViewHistory: (id: string) => void
}) {
    if (requests.length === 0) {
        return (
            <div className="bg-muted/30 rounded-2xl p-12 text-center border-2 border-dashed border-border">
                <FaBuilding className="mx-auto text-4xl text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground">No Pending Companies</h3>
                <p className="text-muted-foreground">All company registrations have been processed.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {requests.map((company) => (
                <div key={company.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-foreground">{company.name}</h3>
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                                PENDING
                            </span>
                            <button
                                onClick={() => onViewHistory(company.id)}
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                title="View History"
                            >
                                <FaHistory />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <FaGlobe /> {company.website}
                                </a>
                            )}
                            <div className="flex items-center gap-1">
                                <FaEnvelope /> {company.contactEmail}
                            </div>
                        </div>
                        <p className="text-sm text-foreground/80 bg-muted/50 p-3 rounded-lg max-w-2xl">
                            {company.description || "No description provided."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => onReject(company.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <FaTimes /> Reject
                        </button>
                        <button
                            onClick={() => onApprove(company.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-green-600/20 transition-all flex items-center gap-2"
                        >
                            <FaCheck /> Approve
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function UserRequestsList({ requests, onApprove, onReject }: {
    requests: any[],
    onApprove: (id: string) => void,
    onReject: (id: string) => void
}) {
    if (requests.length === 0) {
        return (
            <div className="bg-muted/30 rounded-2xl p-12 text-center border-2 border-dashed border-border">
                <FaUserClock className="mx-auto text-4xl text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground">No Pending Users</h3>
                <p className="text-muted-foreground">All user requests have been processed.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {requests.map((user) => (
                <div key={user.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {user.fullName?.[0] || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">{user.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Company:</span>
                                <span className="font-semibold text-foreground">{user.company?.name || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onReject(user.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                        >
                            <FaTimes /> Reject
                        </button>
                        <button
                            onClick={() => onApprove(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-green-600/20 transition-all text-sm flex items-center gap-2"
                        >
                            <FaCheck /> Approve
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
