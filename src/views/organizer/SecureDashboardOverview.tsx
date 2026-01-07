import React, { useMemo, useState } from 'react';
import {
    Users,
    Shield,
    Zap,
    Clock,
    Activity,
    TrendingUp,
    CheckCircle,
    AlertTriangle,
    MoreVertical,
    ChevronRight,
    Play,
    Pause,
    Wifi,
    Video,
    Mic,
    MoreHorizontal,
    Code,
    Maximize,
    Edit,
    Trash2
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface SecureDashboardOverviewProps {
    contest: any;
    invites: any[];
    violations: any[];
    participants: any[];
    results: any[];
    onQuickAction: (action: string) => void;
}

export default function SecureDashboardOverview({
    contest,
    invites,
    violations,
    participants,
    results,
    onQuickAction
}: SecureDashboardOverviewProps) {


    // --- Calculated Stats ---
    const totalInvited = invites.length;
    const acceptedInvites = invites.filter(i => i.status === 'ACCEPTED').length;
    const registered = participants.length;
    const totalViolations = violations.length;

    // Determine active contest status
    const now = new Date();
    const startTime = new Date(contest?.startTime);
    const endTime = new Date(contest?.endTime);
    const isActive = now >= startTime && now <= endTime;
    const isFinished = now > endTime;

    // Mock Data (replace with real if available)
    const activityData = [
        { name: '10:00', submissions: 4 },
        { name: '10:30', submissions: 12 },
        { name: '11:00', submissions: 8 },
        { name: '11:30', submissions: 25 },
        { name: '12:00', submissions: 18 },
        { name: '12:30', submissions: 30 },
        { name: '13:00', submissions: 45 },
    ];

    // --- Widgets ---
    const QuickStatCard = ({ label, value, icon: Icon, colorClass, bgClass, toggle }: any) => (
        <div className={`p-4 rounded-3xl ${bgClass} text-white flex flex-col justify-between h-28 relative overflow-hidden group transition-all hover:scale-[1.02] shadow-sm`}>
            <div className="flex justify-between items-start z-10">
                <div className={`p-2 rounded-xl bg-white/20 backdrop-blur-sm`}>
                    <Icon size={18} className="text-white" />
                </div>
                {toggle && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium opacity-80 uppercase">ON</span>
                        <div className="w-8 h-4 bg-white/30 rounded-full p-0.5 flex justify-end">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>
                )}
            </div>
            <div className="z-10">
                <div className="text-xs font-medium opacity-80 mb-1">{label}</div>
                <div className="text-2xl font-bold">{value}</div>
            </div>
            {/* Decoratiive circles */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        </div>
    );

    return (
        <div className="flex flex-col gap-8 pb-12">

            {/* --- TOP SECTION: Purple Header + Overlapping Cards --- */}
            <div>
                {/* HEAD (Purple Gradient) */}
                <div className="relative bg-gradient-to-r from-[#5b4fcf] to-[#8b5cf6] rounded-[40px] p-8 pb-32 shadow-xl overflow-visible">
                    {/* Background Blobs */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-[40px] pointer-events-none">
                        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl opacity-50" />
                        <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-3xl" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start text-white">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{contest?.title || "Active Engineer Contest"}</h1>
                                <div className="px-3 py-1 rounded-full bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                                    <Shield size={12} /> Secure Mode
                                </div>
                            </div>
                            <p className="opacity-80 text-sm max-w-xl">
                                Manage invites, monitor integrity, and view reports.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => onQuickAction('edit')}
                                className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all backdrop-blur-md flex items-center justify-center"
                                title="Edit Contest"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => onQuickAction('delete')}
                                className="p-3 bg-red-500/20 rounded-full hover:bg-red-500/30 text-white transition-all backdrop-blur-md flex items-center justify-center"
                                title="Delete Contest"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* OVERLAPPING CARDS (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 -mt-24 relative z-20">

                    {/* Card 1: TIMING (Green-ish) */}
                    <div className="bg-[#d4f7da] p-6 rounded-[30px] shadow-lg flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/40 rounded-full blur-2xl group-hover:bg-white/50 transition-all" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mb-6">
                                    <Clock size={20} />
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isActive ? 'bg-green-500/20 text-green-800' : 'bg-gray-500/10 text-gray-700'
                                    }`}>
                                    {isActive ? 'LIVE' : isFinished ? 'ENDED' : 'UPCOMING'}
                                </div>
                            </div>
                            <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">TIMING DETAILS</div>
                            <div className="text-3xl font-bold text-gray-800 leading-tight mb-1">
                                {contest?.durationMinutes}<span className="text-lg opacity-60">mins</span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <div className="bg-white/40 p-3 rounded-2xl backdrop-blur-sm">
                                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                                    <span>Start</span>
                                    <span>{contest?.startTime ? new Date(contest.startTime).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-700">
                                    <span>End</span>
                                    <span>{contest?.endTime ? new Date(contest.endTime).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: CHALLENGES (Orange) */}
                    <div className="bg-[#ff8a65] p-6 rounded-[30px] shadow-lg flex flex-col justify-between min-h-[220px] relative overflow-hidden text-white group">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform" />

                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                                <Code size={20} />
                            </div>
                            <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">CHALLENGES</div>
                            <h3 className="text-3xl font-bold mb-2">
                                {(contest?.problems || []).length + (contest?.contestProblems || []).length}
                            </h3>
                        </div>

                        <div className="relative z-10 mt-auto max-h-24 overflow-y-auto custom-scrollbar pr-2">
                            <div className="flex flex-col gap-2">
                                {((contest?.problems || contest?.contestProblems || []) as any[]).map((p, idx) => {
                                    const title = p.problem?.title || p.title || `Problem ${idx + 1}`;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 bg-black/10 p-2 rounded-xl text-xs font-medium backdrop-blur-sm">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{idx + 1}</div>
                                            <span className="truncate">{title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Card 3: ACTIVE SECURITY (Cyan/Blue) */}
                    <div className="bg-[#22d3ee] p-6 rounded-[30px] shadow-lg flex flex-col justify-between min-h-[220px] relative overflow-hidden text-gray-900">
                        <div className="absolute right-[-20%] top-[-20%] w-60 h-60 bg-white/30 rounded-full blur-3xl opacity-60" />

                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-black/10 text-gray-800 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                                <Shield size={20} />
                            </div>
                            <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">ACTIVE SECURITY</div>
                            <div className="text-lg font-bold leading-tight">Proctoring Metrics</div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-2 mt-4">
                            <div className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 ${contest?.proctoringSettings?.enableVideoProctoring ? 'bg-white/40' : 'bg-black/5 opacity-50'}`}>
                                <Video size={16} />
                                <span className="text-[10px] font-bold">Video</span>
                            </div>
                            <div className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 ${contest?.proctoringSettings?.enableAudioMonitoring ? 'bg-white/40' : 'bg-black/5 opacity-50'}`}>
                                <Mic size={16} />
                                <span className="text-[10px] font-bold">Audio</span>
                            </div>
                            <div className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 ${contest?.proctoringSettings?.enableFullscreenMode ? 'bg-white/40' : 'bg-black/5 opacity-50'}`}>
                                <Maximize size={16} />
                                <span className="text-[10px] font-bold">Screen</span>
                            </div>
                            <div className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 ${contest?.proctoringSettings?.enableTabSwitchDetection ? 'bg-white/40' : 'bg-black/5 opacity-50'}`}>
                                <Activity size={16} />
                                <span className="text-[10px] font-bold">Tabs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION: Smart Home Grid Style --- */}
            <div className="grid grid-cols-12 gap-6 px-2">

                {/* --- LEFT COLUMN --- */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Average Score Dial */}
                    <div className="bg-white dark:bg-[#1e1e2d] rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="font-bold text-gray-700 dark:text-gray-200">Average Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">STATUS</span>
                                <div className="w-10 h-6 bg-indigo-500 rounded-full p-1 flex justify-end">
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-2 h-[300px]">
                            {/* Dynamic Semi-Donut Chart */}
                            {(() => {
                                const avgScore = useMemo(() => {
                                    if (!results || results.length === 0) return 0;
                                    const total = results.reduce((acc, r) => acc + (r.finalScore || 0), 0);
                                    return Math.round(total / results.length);
                                }, [results]);

                                const data = [
                                    { name: 'Average Score', value: avgScore },
                                    { name: 'Remaining', value: 100 - avgScore }
                                ];

                                return (
                                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <defs>
                                                    <linearGradient id="scorePieGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#ec4899" />
                                                    </linearGradient>
                                                </defs>
                                                <Pie
                                                    data={data}
                                                    cx="50%"
                                                    cy="70%"
                                                    startAngle={180}
                                                    endAngle={0}
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell key="score" fill="url(#scorePieGradient)" className="drop-shadow-lg hover:opacity-90 transition-opacity cursor-pointer" />
                                                    <Cell key="remaining" fill="#f3f4f6" className="dark:fill-gray-800" />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                                    itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Centered Text */}
                                        <div className="absolute top-[65%] left-0 right-0 flex flex-col items-center justify-center pointer-events-none transform -translate-y-1/2">
                                            <div className="flex flex-col items-center">
                                                <span className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                                                    {avgScore}%
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Avg Score</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Submission Graph (Moved Here) */}
                    <div className="relative bg-white dark:bg-[#1e1e2d] rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 h-[400px] flex flex-col overflow-hidden group">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="relative z-10 flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Activity size={18} className="text-orange-500" />
                                    Submission Activity
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 pl-6">Real-time submission frequency</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="#f3f4f600" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                        itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="submissions"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSub)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Key Metrics Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Key Metrics</h3>
                            <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                <span>ON</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickStatCard
                                label="Total Invited"
                                value={totalInvited}
                                icon={Users}
                                bgClass="bg-indigo-500"
                                toggle={true}
                            />
                            <QuickStatCard
                                label="Registered"
                                value={registered}
                                icon={CheckCircle}
                                bgClass="bg-yellow-400"
                                toggle={true}
                            />
                            <QuickStatCard
                                label="High Violations"
                                value={totalViolations}
                                icon={AlertTriangle}
                                bgClass="bg-orange-400"
                                toggle={true}
                            />
                            <QuickStatCard
                                label="Active Now"
                                value="--"
                                icon={Play}
                                bgClass="bg-cyan-400"
                                toggle={true}
                            />
                        </div>
                    </div>

                    {/* Top Candidates (Vertical List) */}
                    <div className="bg-white dark:bg-[#1e1e2d] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Leaderboard</h3>
                                <p className="text-xs text-gray-500">Real-time ranking</p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-indigo-500 transition-colors">
                                <Maximize size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {(() => {
                                // Merge participants with their results and sort by score
                                const rankedParticipants = participants.map(p => {
                                    const result = results?.find(r => r.userId === p.id || r.userId === p.userId);
                                    return {
                                        ...p,
                                        score: result?.finalScore || 0,
                                        timeUsed: result?.timeUsed,
                                        submittedAt: result?.updatedAt || result?.createdAt
                                    };
                                }).sort((a, b) => b.score - a.score);

                                return rankedParticipants.length > 0 ? (
                                    <>
                                        {rankedParticipants.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-white border border-gray-100 text-gray-500'}
                                                `}>
                                                    {idx + 1}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {p.name?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate group-hover:text-indigo-500 transition-colors">{p.name || 'Anonymous User'}</h4>
                                                        <span className="text-xs font-bold text-green-500">{p.score}% pts</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[10px] text-gray-400 truncate">{p.email || 'user@example.com'}</span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not submitted'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 opacity-60">
                                        <Users size={32} />
                                        <span className="text-sm">No participants yet</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
