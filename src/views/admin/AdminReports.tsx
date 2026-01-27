'use client';

import React, { useState, useEffect } from 'react';
import { assessmentService } from '@/api/assessmentService';
import { FaSearch, FaFilter, FaFileAlt, FaChartBar, FaArrowRight, FaChartPie } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminReports() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAssessments = async () => {
            setLoading(true);
            try {
                // Fetch basic list first
                const res = await assessmentService.listAssessments({ limit: 100 });
                setAssessments(res.data.assessments || []);
            } catch (err) {
                console.error("Failed to load assessments", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    const filteredAssessments = assessments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
                    <p className="text-muted-foreground mt-1">Select an assessment to view detailed reports.</p>
                </div>

                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search assessments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filteredAssessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FaFileAlt className="text-2xl text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No assessments found</h3>
                </div>
            ) : (
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
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <FaChartPie />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground line-clamp-1 flex-1">
                                        {a.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-foreground">{a.participantCount || 0}</div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Participants</div>
                                    </div>
                                    <div className="text-center border-l border-border/50">
                                        <div className="text-2xl font-bold text-green-600">
                                            {/* Placeholder for real stats if available in list response */}
                                            {a.status === 'PUBLISHED' ? 'Active' : a.status}
                                        </div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/admin/assessments/${a.id}`} // We rely on the single assessment view which has tabs
                                className="bg-muted/30 p-4 border-t border-border flex items-center justify-between text-sm font-bold text-primary group-hover:bg-gradient-to-br from-indigo-600 to-violet-600 group-hover:text-primary-foreground transition-all"
                            >
                                View Analytics
                                <FaChartBar />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
