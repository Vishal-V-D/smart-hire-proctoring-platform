'use client';

import React, { useState, useEffect } from 'react';
import { assessmentService } from '@/api/assessmentService';
import { Search, Filter, Calendar, Users, ArrowRight, Shield, LayoutGrid, List, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminAssessmentsList() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const res = await assessmentService.listAssessments({ limit: 100 });
            setAssessments(res.data.assessments || []);
        } catch (err) {
            console.error("Failed to load assessments", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || a.status?.toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'PUBLISHED' || s === 'ACTIVE') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
        if (s === 'DRAFT') return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    };

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor all assigned assessments.</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search assessments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-border rounded-xl bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-64"
                        />
                    </div>
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-border rounded-xl bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-muted rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Card View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                viewMode === 'list' ? (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-muted animate-pulse border-b border-border last:border-0" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
                        ))}
                    </div>
                )
            ) : filteredAssessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Shield className="text-muted-foreground" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No assessments found</h3>
                    <p className="text-muted-foreground mt-2 text-center max-w-md">
                        {searchQuery ? "No matches for your search query." : "You haven't been assigned any assessments yet."}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                            className="mt-4 text-primary font-medium hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                /* ===== LIST VIEW ===== */
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4">Assessment</th>
                                <th className="text-center px-4 py-4">Status</th>
                                <th className="text-center px-4 py-4">Date</th>
                                <th className="text-center px-4 py-4">Participants</th>
                                <th className="text-right px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAssessments.map((a, index) => (
                                <motion.tr
                                    key={a.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                {a.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {a.description || 'No description'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase border ${getStatusStyle(a.status)}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar size={12} />
                                            {a.startDate ? new Date(a.startDate).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                            <Users size={12} />
                                            <span className="font-medium">{a.participantCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/assessments/${a.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-gradient-to-br from-indigo-600 to-violet-600 text-primary hover:text-primary-foreground rounded-lg text-xs font-bold transition-all"
                                        >
                                            <Eye size={14} />
                                            View
                                            <ArrowRight size={14} />
                                        </Link>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ===== CARD VIEW ===== */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssessments.map((a, index) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
                        >
                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-lg font-bold text-foreground line-clamp-1 flex-1" title={a.title}>
                                        {a.title}
                                    </h3>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase border ${getStatusStyle(a.status)}`}>
                                        {a.status}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {a.description || "No description provided."}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar size={14} className="text-primary/70" />
                                        <span>{a.startDate ? new Date(a.startDate).toLocaleDateString() : 'TBD'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                                        <Users size={14} className="text-primary/70" />
                                        <span>{a.participantCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 border-t border-border">
                                <Link
                                    href={`/assessments/${a.id}`}
                                    className="flex items-center justify-between text-sm font-bold text-primary group-hover:text-primary/80 transition-colors"
                                >
                                    Open Dashboard
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
