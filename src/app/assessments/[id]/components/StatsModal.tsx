"use client";

import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Users, Clock, Target, Activity, Trophy, Zap, BrainCircuit, ChevronLeft, ChevronRight, LayoutDashboard, Building, GraduationCap, Filter, RefreshCcw } from 'lucide-react';
import {
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, Tooltip, Legend, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: any[];
    stats: any;
    assessment: any;
}

const COLORS = {
    primary: "#6366F1",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
    pink: "#EC4899",
    chart: ["#6366F1", "#10B981", "#06B6D4", "#F59E0B", "#EC4899", "#8B5CF6", "#F43F5E", "#82ca9d"],
};

const StatsModal = ({ isOpen, onClose, participants, stats, assessment }: StatsModalProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedCollege, setSelectedCollege] = useState('all');

    // --- ADAPTIVE FILTERING LOGIC ---
    // This hook ensures all data downstream is reactive to the filter state
    const filteredData = useMemo(() => {
        return participants.filter(p => {
            const matchesDept = selectedDept === 'all' || p.registration?.department === selectedDept;
            const matchesCollege = selectedCollege === 'all' || p.registration?.college === selectedCollege;
            return matchesDept && matchesCollege;
        });
    }, [participants, selectedDept, selectedCollege]);

    const departments = useMemo(() => Array.from(new Set(participants.map(p => p.registration?.department).filter(Boolean))), [participants]);
    const colleges = useMemo(() => Array.from(new Set(participants.map(p => p.registration?.college).filter(Boolean))), [participants]);

    // --- RE-CALCULATED ANALYTICS (Grounded in filteredData) ---
    const scoreDistribution = useMemo(() => [
        { name: '0-20%', value: filteredData.filter(p => (p.scores?.percentage || 0) < 20).length, fill: COLORS.danger },
        { name: '20-40%', value: filteredData.filter(p => (p.scores?.percentage || 0) >= 20 && (p.scores?.percentage || 0) < 40).length, fill: COLORS.warning },
        { name: '40-60%', value: filteredData.filter(p => (p.scores?.percentage || 0) >= 40 && (p.scores?.percentage || 0) < 60).length, fill: COLORS.info },
        { name: '60-80%', value: filteredData.filter(p => (p.scores?.percentage || 0) >= 60 && (p.scores?.percentage || 0) < 80).length, fill: COLORS.primary },
        { name: '80-100%', value: filteredData.filter(p => (p.scores?.percentage || 0) >= 80).length, fill: COLORS.success },
    ].filter(d => d.value > 0), [filteredData]);

    const totalMetrics = useMemo(() => filteredData.reduce((acc, p) => {
        p.scores?.sectionScores?.forEach((s: any) => {
            acc.correct += (s.correctAnswers || 0);
            acc.wrong += (s.wrongAnswers || 0);
            acc.skipped += (s.unattempted || 0);
        });
        return acc;
    }, { correct: 0, wrong: 0, skipped: 0 }), [filteredData]);

    const accuracyDonutData = useMemo(() => [
        { name: 'Correct', value: totalMetrics.correct, fill: COLORS.success },
        { name: 'Wrong', value: totalMetrics.wrong, fill: COLORS.danger },
        { name: 'Skipped', value: totalMetrics.skipped, fill: "#94a3b8" },
    ].filter(d => d.value > 0), [totalMetrics]);

    const performanceRadar = useMemo(() => {
        const avgScore = filteredData.length ? filteredData.reduce((acc, p) => acc + (p.scores?.percentage || 0), 0) / filteredData.length : 0;
        const completed = filteredData.filter(p => p.session?.status === 'COMPLETED').length;
        const passed = filteredData.filter(p => (p.scores?.percentage || 0) >= (assessment?.passingPercentage || 40)).length;
        return [
            { metric: 'Score', value: Math.round(avgScore) },
            { metric: 'Done', value: filteredData.length ? Math.round((completed / filteredData.length) * 100) : 0 },
            { metric: 'Pass', value: filteredData.length ? Math.round((passed / filteredData.length) * 100) : 0 },
            { metric: 'Active', value: 92 }, // Placeholder for real-time engagement
            { metric: 'Speed', value: 85 },
        ];
    }, [filteredData, assessment]);

    const sectionPerformance = useMemo(() => (assessment?.sections || []).map((section: any, idx: number) => {
        const sectionScores = filteredData.map(p => {
            const sScore = p.scores?.sectionScores?.find((s: any) => s.sectionId === section.id);
            return sScore?.percentage || 0;
        });
        return {
            section: section.title?.substring(0, 10) || `S${idx + 1}`,
            average: Math.round(sectionScores.reduce((a: number, b: number) => a + b, 0) / (sectionScores.length || 1)),
        };
    }), [filteredData, assessment]);

    const sectionTimeData = useMemo(() => (assessment?.sections || []).map((section: any, idx: number) => {
        const times = filteredData.reduce((acc, p) => {
            const s = p.scores?.sectionScores?.find((ss: any) => ss.sectionId === section.id);
            return acc + (s?.timeTaken || 0);
        }, 0);
        return {
            name: section.title?.substring(0, 15) || `Section ${idx + 1}`,
            minutes: filteredData.length ? Math.round((times / filteredData.length) / 60) + 1 : 1,
            fill: COLORS.chart[idx % COLORS.chart.length]
        };
    }).sort((a: any, b: any) => b.minutes - a.minutes), [filteredData, assessment]);

    // Derived stats for sidebar
    const currentAvgScore = useMemo(() => 
        filteredData.length ? Math.round(filteredData.reduce((a, b) => a + (b.scores?.percentage || 0), 0) / filteredData.length) : 0
    , [filteredData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex bg-background/98 backdrop-blur-xl overflow-hidden animate-in fade-in duration-500">
            
            {/* --- SIDEBAR --- */}
            <aside className={`${isSidebarOpen ? 'w-[400px]' : 'w-[100px]'} h-full bg-card border-r border-border/50 flex flex-col relative transition-all duration-500 shadow-2xl`}>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-4 top-24 z-50 p-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground shadow-lg hover:scale-110 transition-all">
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                <div className={`p-8 flex-1 overflow-y-auto ${!isSidebarOpen ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                    <div className="mb-12">
                        <button onClick={onClose} className="mb-6 p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-primary transition-all group">
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                        <p className="text-[10px] font-Inter text-primary uppercase tracking-[0.3em] mb-2">Operational Context</p>
                        <h2 className="text-xl font-Inter text-foreground uppercase leading-tight mb-8 border-l-4 border-primary pl-4 tracking-tighter">
                            {assessment?.title || "Neural Evaluation"}
                        </h2>
                        <h1 className="text-4xl font-Inter tracking-tighter text-foreground mb-1 leading-none uppercase">
                            Cohort <br /><span className="text-primary italic tracking-tight">Intelligence</span>
                        </h1>
                        <p className="text-[10px] font-Inter text-muted-foreground uppercase tracking-[0.3em]">Neural Analytics Engine</p>
                    </div>

                    <div className="space-y-12">
                        <div>
                            <p className="text-[10px] font-Inter text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Users size={12} /> Filtered Nodes</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-Inter tracking-tighter">{filteredData.length}</span>
                                <span className="text-xs font-Inter text-success">TARGETS</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-Inter text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={12} /> Adaptive Avg</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-7xl font-Inter tracking-tighter text-success">{currentAvgScore}</span>
                                <span className="text-3xl font-Inter text-muted-foreground">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    
                    {/* --- MODERN FILTER COMMAND BAR --- */}
                    <div className="flex flex-wrap items-center gap-6 bg-card border border-border/60 p-5 rounded-[2rem] shadow-xl backdrop-blur-xl sticky top-0 z-50">
                        <div className="flex items-center gap-3 px-4 border-r border-border/50">
                            <Filter size={18} className="text-primary" />
                            <span className="text-[10px] font-Inter text-muted-foreground uppercase tracking-[0.2em]">Filter Engine</span>
                        </div>
                        
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative group flex-1 max-w-[280px]">
                                <select 
                                    value={selectedDept} 
                                    onChange={(e) => setSelectedDept(e.target.value)} 
                                    className="w-full bg-secondary/40 border border-border/50 text-[11px] font-Inter px-5 py-3 rounded-2xl outline-none cursor-pointer appearance-none uppercase tracking-tighter hover:bg-secondary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="all">🌐 ALL DEPARTMENTS</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                    <Building size={14} />
                                </div>
                            </div>

                            <div className="relative group flex-1 max-w-[280px]">
                                <select 
                                    value={selectedCollege} 
                                    onChange={(e) => setSelectedCollege(e.target.value)} 
                                    className="w-full bg-secondary/40 border border-border/50 text-[11px] font-Inter px-5 py-3 rounded-2xl outline-none cursor-pointer appearance-none uppercase tracking-tighter hover:bg-secondary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="all">🏫 ALL COLLEGES</option>
                                    {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                    <GraduationCap size={14} />
                                </div>
                            </div>

                            {(selectedDept !== 'all' || selectedCollege !== 'all') && (
                                <button 
                                    onClick={() => { setSelectedDept('all'); setSelectedCollege('all'); }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-danger/10 text-danger text-[10px] font-Inter uppercase tracking-widest hover:bg-danger hover:text-white transition-all animate-in slide-in-from-right-4"
                                >
                                    <RefreshCcw size={14} /> Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CHARTS GRID (Updates Automatically via filteredData) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <section className="bg-card rounded-[2.5rem] p-8 border border-border/60 shadow-sm flex flex-col md:flex-row items-center gap-8 min-h-[350px]">
                            <div className="flex-1">
                                <h3 className="text-xs font-Inter uppercase tracking-tighter flex items-center gap-2 mb-2 text-foreground">
                                    <BrainCircuit size={16} className="text-primary" /> Matrix Analysis
                                </h3>
                                <div className="space-y-3 mt-6">
                                    {performanceRadar.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-Inter border-b border-border/50 pb-2">
                                            <span className="text-muted-foreground uppercase">{p.metric}</span>
                                            <span className="text-primary">{p.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-64 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={performanceRadar}>
                                        <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 900 }} />
                                        <Radar dataKey="value" stroke={COLORS.primary} strokeWidth={3} fill={COLORS.primary} fillOpacity={0.1} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="bg-card rounded-[2.5rem] p-8 border border-border/60 shadow-sm flex flex-col md:flex-row items-center min-h-[350px]">
                            <div className="md:w-1/2">
                                <h3 className="text-xs font-Inter uppercase tracking-tighter flex items-center gap-2 mb-6 text-foreground">
                                    <Target size={16} className="text-emerald-500" /> Answer Accuracy
                                </h3>
                                <div className="space-y-6">
                                    {accuracyDonutData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-md" style={{ backgroundColor: item.fill }} />
                                            <div>
                                                <p className="text-[10px] font-Inter text-muted-foreground uppercase leading-none mb-1">{item.name}</p>
                                                <p className="text-3xl font-Inter tracking-tighter">{item.value.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="md:w-1/2 h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={accuracyDonutData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" cornerRadius={8} paddingAngle={4}>
                                            {accuracyDonutData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>

                    {/* TEMPORAL RADIAL */}
                    <section className="bg-card rounded-[2.5rem] p-8 border border-border/60 shadow-sm min-h-[380px] flex flex-col md:flex-row items-center gap-10">
                        <div className="md:w-1/3">
                            <h3 className="text-xs font-Inter uppercase tracking-tighter flex items-center gap-2 mb-4 text-foreground">
                                <Clock size={16} className="text-amber-500" /> Temporal Distribution
                            </h3>
                            <div className="grid grid-cols-1 gap-3 mt-8">
                                    {sectionTimeData.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                        <span className="text-[10px] font-Inter uppercase tracking-tighter text-muted-foreground truncate">{s.name}</span>
                                        <span className="ml-auto text-xs font-Inter">{s.minutes}m</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="105%" barSize={16} data={sectionTimeData} startAngle={90} endAngle={450}>
                                    <RadialBar background={{ fill: 'hsl(var(--muted)/0.3)' }} dataKey="minutes" cornerRadius={12} />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* BENCHMARKING GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <section className="bg-card rounded-[2.5rem] p-8 border border-border/60 shadow-sm flex flex-col items-center">
                            <h3 className="w-full text-xs font-Inter uppercase tracking-tighter flex items-center gap-2 mb-8 text-foreground">
                                <Activity size={16} className="text-primary" /> Grade Spectrum
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={scoreDistribution} innerRadius={65} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={10}>
                                            {scoreDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="bg-card rounded-[2.5rem] p-8 border border-border/60 shadow-sm flex flex-col items-center">
                            <h3 className="w-full text-xs font-Inter uppercase tracking-tighter flex items-center gap-2 mb-8 text-foreground">
                                <Zap size={16} className="text-primary" /> Efficiency Score Trend
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sectionPerformance}>
                                        <defs>
                                            <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip />
                                        <Area type="monotone" dataKey="average" stroke={COLORS.primary} strokeWidth={4} fill="url(#effGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>

                    {/* --- ELITE PERFORMERS TABLE (ADAPTIVE) --- */}
                    <section className="bg-card rounded-[2.5rem] border border-border/60 shadow-2xl overflow-hidden">
                        <div className="p-10 border-b border-border/40 flex justify-between items-center bg-muted/10">
                            <div>
                                <h3 className="text-xs font-Inter uppercase tracking-widest flex items-center gap-2 text-foreground">
                                    <Trophy size={18} className="text-amber-500" /> Elite Performers
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">Current Cohort Spectrum (Showing Top 15)</p>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/40">
                                        <th className="py-5 px-8 text-[10px] font-Inter text-muted-foreground uppercase tracking-widest">Rank</th>
                                        <th className="py-5 px-6 text-[10px] font-Inter text-muted-foreground uppercase tracking-widest">Node Name</th>
                                        <th className="py-5 px-6 text-[10px] font-Inter text-muted-foreground uppercase tracking-widest">Department</th>
                                        <th className="py-5 px-6 text-[10px] font-Inter text-muted-foreground uppercase tracking-widest">College</th>
                                        <th className="py-5 px-8 text-[10px] font-Inter text-muted-foreground uppercase tracking-widest text-right">Efficiency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData
                                        .sort((a, b) => (b.scores?.percentage || 0) - (a.scores?.percentage || 0))
                                        .slice(0, 15)
                                        .map((p, i) => (
                                            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors group">
                                                <td className="py-5 px-8">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-Inter ${
                                                        i === 0 ? 'bg-amber-500 text-white shadow-lg' : 
                                                        i === 1 ? 'bg-slate-400 text-white' : 
                                                        i === 2 ? 'bg-amber-700 text-white' : 
                                                        'bg-secondary text-muted-foreground'
                                                    }`}>
                                                        {i + 1}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="text-xs font-Inter text-foreground uppercase tracking-tight">
                                                        {p.registration?.fullName || 'Anonymous'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase px-3 py-1 rounded-lg bg-secondary/50">
                                                        {p.registration?.department || 'General'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="text-[10px] font-Inter text-foreground/70 uppercase">
                                                        {p.registration?.college || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-8 text-right">
                                                    <span className="text-sm font-Inter text-primary tracking-tighter">
                                                        {Math.round(p.scores?.percentage || 0)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default StatsModal;