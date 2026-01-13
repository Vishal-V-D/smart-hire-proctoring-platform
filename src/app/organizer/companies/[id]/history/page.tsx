'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/api/companyService';
import {
    History as HistoryIcon,
    ArrowLeft,
    Clock,
    User,
    Check,
    X,
    Briefcase,
    Loader2,
    Calendar,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompanyHistoryPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: historyData = [], isLoading } = useQuery({
        queryKey: ['company-history', id],
        queryFn: async () => {
            const res = await companyService.getCompanyHistory(id as string);
            return res.data || [];
        }
    });

    const { data: company } = useQuery({
        queryKey: ['company', id],
        queryFn: async () => {
            const res = await companyService.getCompanyById(id as string);
            return res.data;
        }
    });

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Back to Management</span>
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm border border-primary/20">
                            <HistoryIcon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight">
                                Audit Log
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Activity history for <span className="font-bold text-foreground">
                                    {company?.name || 'Loading organization...'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl shadow-sm">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">
                            {historyData.length} Events Recorded
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        Timeline of Activities
                    </h3>
                    <button className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
                        <Filter size={14} /> Filter Logs
                    </button>
                </div>

                <div className="flex-1 p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                            <Loader2 size={48} className="animate-spin text-primary/40" />
                            <p className="text-muted-foreground font-medium animate-pulse">Loading historical data...</p>
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center">
                                <HistoryIcon size={40} className="text-muted-foreground/30" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">No Records Found</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    There are currently no activities recorded for this organization.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative pl-10 space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
                            {historyData.map((event: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="relative"
                                >
                                    <div className={`absolute -left-[30px] top-1 w-9 h-9 rounded-xl border-4 border-background flex items-center justify-center z-10 shadow-md
                                        ${event.type === 'APPROVAL' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                            event.type === 'REJECTION' ? 'bg-rose-500 text-white shadow-rose-200' :
                                                event.type === 'ASSIGNMENT' ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-500 text-white shadow-slate-200'}`}
                                    >
                                        {event.type === 'APPROVAL' ? <Check size={16} /> :
                                            event.type === 'REJECTION' ? <X size={16} /> :
                                                event.type === 'ASSIGNMENT' ? <Briefcase size={16} /> : <User size={16} />}
                                    </div>

                                    <div className="bg-muted/30 hover:bg-muted/50 border border-border/50 p-6 rounded-2xl transition-all group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-foreground text-lg tracking-tight">
                                                    {event.action || event.type}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <Clock size={12} />
                                                    {new Date(event.createdAt).toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                    <span className="text-muted-foreground/30">•</span>
                                                    {new Date(event.createdAt).toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-background border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Event ID: #{idx + 1000}
                                            </div>
                                        </div>

                                        <div className="text-foreground/80 leading-relaxed bg-background/50 p-4 rounded-xl border border-border/30 mb-4 text-sm">
                                            {(() => {
                                                const data = event.details || event.message;
                                                if (typeof data === 'object' && data !== null) {
                                                    // Render object as formatted key-value pairs
                                                    const renderValue = (value: any, depth = 0): React.ReactNode => {
                                                        if (value === null || value === undefined) return <span className="text-muted-foreground italic">N/A</span>;
                                                        if (typeof value === 'boolean') return <span className={value ? 'text-green-600' : 'text-red-500'}>{value ? 'Yes' : 'No'}</span>;
                                                        if (typeof value === 'number') return <span className="font-mono text-primary">{value}</span>;
                                                        if (typeof value === 'string') {
                                                            // Check if it's a date
                                                            if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                                                                try {
                                                                    return <span>{new Date(value).toLocaleString()}</span>;
                                                                } catch { return value; }
                                                            }
                                                            return value;
                                                        }
                                                        if (Array.isArray(value)) {
                                                            if (value.length === 0) return <span className="text-muted-foreground italic">Empty list</span>;
                                                            return (
                                                                <ul className="list-disc list-inside ml-2">
                                                                    {value.map((item, i) => <li key={i}>{renderValue(item, depth + 1)}</li>)}
                                                                </ul>
                                                            );
                                                        }
                                                        if (typeof value === 'object') {
                                                            return (
                                                                <div className={depth > 0 ? 'ml-4 pl-3 border-l-2 border-border/50' : ''}>
                                                                    {Object.entries(value).map(([k, v]) => (
                                                                        <div key={k} className="py-1">
                                                                            <span className="font-medium text-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: </span>
                                                                            {renderValue(v, depth + 1)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                        return String(value);
                                                    };
                                                    return (
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-primary/80 mb-3 text-xs uppercase tracking-wider">Change Details</p>
                                                            {Object.entries(data).map(([key, value]) => (
                                                                <div key={key} className="flex flex-wrap gap-1 py-1.5 border-b border-border/20 last:border-0">
                                                                    <span className="font-semibold text-foreground min-w-[120px] capitalize">
                                                                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                                                                    </span>
                                                                    <span className="text-muted-foreground flex-1">
                                                                        {renderValue(value)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return data || "Action successfully recorded by the platform's audit system.";
                                            })()}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                                                    <User size={18} className="text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter leading-none mb-1">Performed By</span>
                                                    <span className="text-sm font-bold text-foreground">
                                                        {event.performedBy?.username || event.performedBy?.fullName || "System Administrator"}
                                                    </span>
                                                </div>
                                            </div>

                                            {event.metadata && (
                                                <button className="text-xs font-bold text-primary hover:underline">
                                                    View Metadata
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
