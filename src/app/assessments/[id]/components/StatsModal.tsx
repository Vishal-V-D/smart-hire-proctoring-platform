"use client";

import React from 'react';
import { X, TrendingUp, Users, Award, Clock, Target, BarChart3, PieChart, Activity, Trophy, Zap, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart as RePieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Area,
    AreaChart
} from 'recharts';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: any[];
    stats: any;
    assessment: any;
}

const StatsModal = ({ isOpen, onClose, participants, stats, assessment }: StatsModalProps) => {
    if (!isOpen) return null;

    // --- Data Processing ---

    // 1. Score Distribution
    const scoreDistribution = [
        { range: '0-20%', count: participants.filter(p => (p.scores?.percentage || 0) < 20).length, fill: 'hsl(var(--destructive))' },
        { range: '20-40%', count: participants.filter(p => (p.scores?.percentage || 0) >= 20 && (p.scores?.percentage || 0) < 40).length, fill: 'hsl(var(--chart-5))' },
        { range: '40-60%', count: participants.filter(p => (p.scores?.percentage || 0) >= 40 && (p.scores?.percentage || 0) < 60).length, fill: 'hsl(var(--chart-4))' },
        { range: '60-80%', count: participants.filter(p => (p.scores?.percentage || 0) >= 60 && (p.scores?.percentage || 0) < 80).length, fill: 'hsl(var(--chart-2))' },
        { range: '80-100%', count: participants.filter(p => (p.scores?.percentage || 0) >= 80).length, fill: 'hsl(var(--chart-1))' },
    ];

    // 2. Status Data
    const statusData = [
        { name: 'Completed', value: stats?.completed || 0, fill: 'hsl(var(--chart-1))' },
        { name: 'In Progress', value: stats?.inProgress || 0, fill: 'hsl(var(--chart-3))' },
        { name: 'Not Started', value: stats?.notStarted || 0, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    // 3. Top Performers
    const topPerformers = participants
        .sort((a, b) => (b.scores?.totalScore || 0) - (a.scores?.totalScore || 0))
        .slice(0, 5)
        .map((p, idx) => ({
            name: p.registration?.fullName || 'Unknown',
            score: p.scores?.totalScore || 0,
            percentage: p.scores?.percentage || 0,
            rank: idx + 1,
            time: Math.round((p.session?.totalTimeTaken || 0) / 60)
        }));

    // 4. Section Performance
    const sectionPerformance = (assessment?.sections || []).map((section: any, idx: number) => {
        const sectionScores = participants.map(p => {
            const sScore = p.scores?.sectionScores?.find((s: any) => s.sectionId === section.id);
            return sScore?.percentage || 0;
        });
        const avgScore = sectionScores.length > 0
            ? sectionScores.reduce((a: number, b: number) => a + b, 0) / sectionScores.length
            : 0;

        return {
            section: section.title?.substring(0, 15) || `S${idx + 1}`,
            average: Math.round(avgScore),
            highest: Math.max(...sectionScores, 0),
            fill: `hsl(var(--chart-${(idx % 5) + 1}))`
        };
    });

    // 5. Performance Radar (The one you liked!)
    const performanceRadar = [
        { metric: 'Avg Score', value: Math.round(stats?.averageScore || 0), fullMark: 100 },
        { metric: 'Completion', value: stats?.totalParticipants > 0 ? Math.round((stats?.completed / stats?.totalParticipants) * 100) : 0, fullMark: 100 },
        { metric: 'Pass Rate', value: Math.round(stats?.passRate || 0), fullMark: 100 },
        { metric: 'Engagement', value: stats?.totalParticipants > 0 ? Math.round(((stats?.completed + stats?.inProgress) / stats?.totalParticipants) * 100) : 0, fullMark: 100 },
        { metric: 'Efficiency', value: Math.min(100, Math.round(100 - ((stats?.averageTimeTaken || 0) / (assessment?.duration || 1) * 20))), fullMark: 100 }, // Mock efficiency text
    ];

    // 6. Time vs Score Interaction
    const timeVsScore = participants
        .filter(p => p.scores?.percentage > 0 && p.session?.totalTimeTaken > 0)
        .map(p => ({
            time: Math.round(p.session?.totalTimeTaken / 60),
            score: p.scores?.percentage,
            name: p.registration?.fullName
        }))
        .sort((a, b) => a.time - b.time) // Sort by time to show trend
        .slice(0, 20); // Limit to top 20 data points for clarity

    return (
        <div className="fixed inset-0 z-[200] flex bg-background/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">

            {/* --- LEFT SIDEBAR: EXECUTIVE SUMMARY --- */}
            <aside className="w-1/3 max-w-[400px] h-full bg-card border-r border-border flex flex-col relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-chart-2 to-chart-1" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />

                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <button onClick={onClose} className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                            <div className="p-2 rounded-full bg-muted group-hover:bg-primary/20 transition-colors">
                                <X size={16} />
                            </div>
                            <span className="text-sm font-medium">Close Analytics</span>
                        </button>
                        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2 leading-tight">
                            {assessment?.title || "Assessment"} <span className="text-primary">Insights</span>
                        </h1>
                        <p className="text-muted-foreground font-medium">Real-time performance digest</p>
                    </div>

                    {/* Massive Stats - Custom Layout */}
                    <div className="space-y-8">
                        {/* Big Stat 1: Participation */}
                        <div className="group">
                            <div className="flex items-end gap-1 mb-1 text-muted-foreground">
                                <Users size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Total Candidates</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">
                                    {stats?.totalParticipants || 0}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground">Active</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted mt-3 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${(stats?.completed / (stats?.totalParticipants || 1)) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong className="text-foreground">{stats?.completed}</strong> completed assessments
                            </p>
                        </div>

                        {/* Big Stat 2: Avg Score */}
                        <div className="group">
                            <div className="flex items-end gap-1 mb-1 text-muted-foreground">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Class Average</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-foreground tracking-tighter group-hover:text-chart-2 transition-colors">
                                    {stats?.averageScore?.toFixed(0) || 0}
                                    <span className="text-3xl text-muted-foreground font-bold">%</span>
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                The cohort is performing <strong className="text-chart-2">
                                    {stats?.averageScore > 75 ? 'exceptionally well' : stats?.averageScore > 50 ? 'moderately' : 'below average'}
                                </strong> compared to benchmarks.
                            </p>
                        </div>

                        {/* Quick Grid for others */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="p-4 rounded-xl bg-muted/40 border border-border hover:border-chart-4 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-chart-4">
                                    <Trophy size={18} />
                                    <span className="text-xs font-bold">Top Score</span>
                                </div>
                                <span className="text-2xl font-black text-foreground">{stats?.highestScore?.toFixed(0) || 0}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border hover:border-chart-3 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-chart-3">
                                    <Award size={18} />
                                    <span className="text-xs font-bold">Pass Rate</span>
                                </div>
                                <span className="text-2xl font-black text-foreground">{stats?.passRate?.toFixed(0) || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- RIGHT CONTENT: VISUAL STORIES --- */}
            <main className="flex-1 h-full overflow-y-auto bg-muted/10">
                <div className="p-8 max-w-5xl mx-auto space-y-8">

                    {/* 1. HERO GRAPH: Performance Radar (The user liked this!) */}
                    <section className="bg-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Target size={200} />
                        </div>
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                    <BrainCircuit size={14} />
                                    Performance Overview
                                </div>
                                <h2 className="text-3xl font-black text-foreground">A Balanced View of Metric Health</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    This radar indicates the overall health of the assessment.
                                    A balanced polygon suggests a well-rounded cohort, while spikes indicate specific strengths (like high completion rates vs low average scores).
                                </p>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="px-4 py-2 rounded-lg bg-muted border border-border">
                                        <p className="text-xs font-medium text-muted-foreground">Efficiency</p>
                                        <p className="text-xl font-bold text-foreground">High</p>
                                    </div>
                                    <div className="px-4 py-2 rounded-lg bg-muted border border-border">
                                        <p className="text-xs font-medium text-muted-foreground">Engagement</p>
                                        <p className="text-xl font-bold text-foreground">Strong</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full min-h-[350px]">
                                <ResponsiveContainer width="100%" height={350}>
                                    <RadarChart data={performanceRadar}>
                                        <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                        <PolarAngleAxis
                                            dataKey="metric"
                                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 700 }}
                                        />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Performance"
                                            dataKey="value"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            fill="hsl(var(--primary))"
                                            fillOpacity={0.25}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* 2. Score Trend & Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Distribution Chart */}
                        <section className="lg:col-span-2 bg-card rounded-3xl p-8 border border-border shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Activity size={20} className="text-chart-2" />
                                        Score Distribution
                                    </h3>
                                    <p className="text-muted-foreground text-sm mt-1">How marks are spread across the cohort</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={scoreDistribution} barSize={60}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis
                                            dataKey="range"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--popover))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[8, 8, 8, 8]}>
                                            {scoreDistribution.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Status Donut */}
                        <section className="col-span-1 bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col justify-center">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                                <Zap size={18} className="text-chart-4" />
                                Engagement
                            </h3>
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={statusData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-black text-foreground">{stats?.totalParticipants || 0}</span>
                                    <span className="text-xs text-muted-foreground font-bold uppercase">Total</span>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                {statusData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="font-medium text-muted-foreground">{item.name}</span>
                                        </div>
                                        <span className="font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* 3. Deep Dive: Section Performance & Time Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Section Breakdown */}
                        <section className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                            <h3 className="text-xl font-bold mb-2">Section Performance</h3>
                            <p className="text-muted-foreground text-sm mb-6">Average vs Highest score per section</p>

                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sectionPerformance}>
                                        <defs>
                                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis dataKey="section" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="average" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={3} />
                                        <Area type="step" dataKey="highest" stroke="hsl(var(--chart-2))" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-3 h-1 bg-primary rounded-full" /> Average
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-3 h-1 bg-chart-2 border-t-2 border-dotted" /> Highest
                                </div>
                            </div>
                        </section>

                        {/* Top Performers Table */}
                        <section className="bg-gradient-to-br from-card to-muted/20 rounded-3xl p-8 border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Leaderboard</h3>
                                <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                    View All <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {topPerformers.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm
                                                ${i === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                        i === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                                            i === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                                'bg-background text-muted-foreground border border-border'}`}
                                            >
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{p.time} mins</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-lg">{p.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                                {topPerformers.length === 0 && (
                                    <p className="text-muted-foreground text-center py-6">No data yet</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* 4. Time Impact */}
                    {timeVsScore.length > 5 && (
                        <section className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Clock size={20} className="text-chart-1" />
                                        Time vs. Score Correlation
                                    </h3>
                                    <p className="text-muted-foreground text-sm">Does spending more time result in higher scores?</p>
                                </div>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={timeVsScore}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis dataKey="time" type="number" unit="m" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                        <YAxis dataKey="score" unit="%" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
};

export default StatsModal;
