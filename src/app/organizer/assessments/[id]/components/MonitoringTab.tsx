"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Users,
    Shield,
    RefreshCcw,
    Clock,
    BarChart3,
    Mail,
    TrendingUp,
    Eye
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { assessmentService } from '@/api/assessmentService';

// ========== CONSTANTS ==========

const VIOLATION_TYPE_LABELS: Record<string, string> = {
    'THIRD_EYE': '3rd Eye',
    'SCREEN_COUNT': 'Screen Count',
    'FULLSCREEN_EXIT': 'Full Screen Exit',
    'SAFE_BROWSER': 'Safe Browser',
    'DESKTOP_APPS': 'Control Desktop Apps',
    'WINDOW_SWAP': 'Window Swap',
    'TAB_SWITCH': 'Tab Switch',
    'BLUETOOTH_AUDIO': 'Bluetooth/Audio',
    'FALSE_FACE': 'False Face',
    'NO_FACE': 'No Face',
    'MULTIPLE_PEOPLE': 'Multiple People',
    'BLANK_FEED': 'Blank Feed',
    'LOOKING_AWAY': 'Looking Away',
    'PROCTOR_FEED': 'Proctor Feed',
    'ROOM_SCAN': 'Room Scan',
    'RESTRICTED_OBJECT': 'Prohibited Object',
};

const ALL_VIOLATION_TYPES = [
    'THIRD_EYE', 'SCREEN_COUNT', 'FULLSCREEN_EXIT', 'SAFE_BROWSER',
    'DESKTOP_APPS', 'WINDOW_SWAP', 'TAB_SWITCH', 'BLUETOOTH_AUDIO',
    'FALSE_FACE', 'NO_FACE', 'MULTIPLE_PEOPLE', 'BLANK_FEED',
    'LOOKING_AWAY', 'PROCTOR_FEED', 'ROOM_SCAN', 'RESTRICTED_OBJECT'
];

interface MonitoringTabProps {
    assessmentId: string;
}

// ========== MAIN COMPONENT ==========

const MonitoringTab = ({ assessmentId }: MonitoringTabProps) => {
    const [loading, setLoading] = useState(false); // Changed to false for instant skeleton display
    const [refreshing, setRefreshing] = useState(false);
    const [lastPolled, setLastPolled] = useState<string | null>(null);
    const [statsTotal, setStatsTotal] = useState(0);
    const [violationCounts, setViolationCounts] = useState<Record<string, number>>({});
    const [activeCandidates, setActiveCandidates] = useState<Record<string, any>>({});
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

    // Process violations for Recharts
    const processChartData = (violations: any[]) => {
        if (!violations || violations.length === 0) return [];
        const buckets: Record<string, { time: string; count: number; timestamp: number }> = {};

        violations.forEach(v => {
            const date = new Date(v.detectedAt || v.timestamp || v.createdAt);
            const minutes = Math.floor(date.getMinutes() / 5) * 5;
            date.setMinutes(minutes, 0, 0);
            const timeKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!buckets[timeKey]) {
                buckets[timeKey] = { time: timeKey, count: 0, timestamp: date.getTime() };
            }
            buckets[timeKey].count++;
        });

        return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
    };

    const fetchStats = async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);

            const response = await assessmentService.getViolationStats(assessmentId);
            const stats: any = response.data?.stats || response.data;

            if (stats) {
                // Initialize counts
                const newCounts: Record<string, number> = {};
                ALL_VIOLATION_TYPES.forEach(type => {
                    newCounts[type] = 0;
                });

                let totalCount = 0;
                const allViols: any[] = [];
                const candidatesMap: Record<string, any> = {};

                // Process violations from users
                if (stats.users && Array.isArray(stats.users)) {
                    console.log('📊 Processing', stats.users.length, 'users from backend');
                    stats.users.forEach((user: any) => {
                        const candidateId = user.userId || user.contestantId || user.id;
                        const violationsArray = user.violations || [];
                        const userViolationCount = violationsArray.length;

                        console.log('👤 User:', user.userName || user.contestantName, '| Violations:', userViolationCount);

                        if (violationsArray.length > 0) {
                            violationsArray.forEach((v: any) => {
                                const type = v.type?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN';

                                // Count violations by type (for breakdown)
                                if (ALL_VIOLATION_TYPES.includes(type)) {
                                    newCounts[type] = (newCounts[type] || 0) + 1;
                                    totalCount++;
                                } else {
                                    // Also count unknown types
                                    console.log('⚠️ Unknown violation type:', type, 'Original:', v.type);
                                    totalCount++;
                                }

                                allViols.push(v);
                            });
                        }

                        // Track ALL candidates
                        if (candidateId) {
                            candidatesMap[candidateId] = {
                                id: candidateId,
                                name: user.userName || user.contestantName || 'Anonymous',
                                email: user.userEmail || user.contestantEmail || '',
                                violations: userViolationCount,
                                lastUpdate: Date.now()
                            };
                            console.log('✅ Candidate added:', candidateId, 'Violations:', userViolationCount);
                        }
                    });
                }

                // Also check byType from backend if available (fallback)
                if (stats.byType && Object.keys(newCounts).every(k => newCounts[k] === 0)) {
                    ALL_VIOLATION_TYPES.forEach(type => {
                        newCounts[type] = stats.byType[type] || 0;
                    });
                }

                setStatsTotal(totalCount || stats.total || 0);
                setViolationCounts(newCounts);
                setActiveCandidates(prev => ({ ...prev, ...candidatesMap }));
                setChartData(processChartData(allViols));
            }
            if (!isManual) setLastPolled(new Date().toISOString());
        } catch (error) {
            console.error('❌ Failed to fetch violation stats:', error);
        } finally {
            setDataLoaded(true);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [assessmentId]);

    // Real-time Polling
    useEffect(() => {
        if (!lastPolled) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await assessmentService.getViolationsRealtime(assessmentId, lastPolled);
                if (response.data?.violations && response.data.violations.length > 0) {
                    // Just refresh the full stats instead of incrementing
                    fetchStats(true);

                    // Update activity feed with new violations
                    const newCandidates = { ...activeCandidates };
                    response.data.violations.forEach((v: any) => {
                        const type = v.type?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN';
                        const candidateId = v.contestantId || v.user?.id || 'unknown';

                        if (!newCandidates[candidateId]) {
                            newCandidates[candidateId] = {
                                id: candidateId,
                                name: v.userName || v.contestantName || 'Anonymous',
                                email: v.userEmail || v.contestantEmail || '',
                                violations: 0,
                                lastUpdate: Date.now()
                            };
                        }
                        newCandidates[candidateId].lastUpdate = Date.now();

                        setRecentActivity(prev => [{
                            id: v.id || Math.random(),
                            name: newCandidates[candidateId].name,
                            type: type,
                            timestamp: v.timestamp || new Date().toISOString()
                        }, ...prev].slice(0, 30));
                    });

                    setActiveCandidates(newCandidates);
                }
                const nextTs = response.data?.lastTimestamp || response.data?.serverTimestamp;
                if (nextTs) setLastPolled(nextTs);
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [assessmentId, lastPolled, activeCandidates]);

    const activeSessions = Object.keys(activeCandidates).length;
    const topViolations = Object.entries(violationCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type: VIOLATION_TYPE_LABELS[type] || type, count }));

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Quick Stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-foreground">Live Monitoring</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2 text-sm">
                        <Users size={16} className="text-muted-foreground" />
                        <span className="font-bold text-foreground">{activeSessions}</span>
                        <span className="text-muted-foreground">Active</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} className="text-muted-foreground" />
                        <span className="font-bold text-foreground">{loading ? "..." : statsTotal}</span>
                        <span className="text-muted-foreground">Violations</span>
                    </div>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className={`p-2 hover:bg-muted rounded-lg transition-all ${refreshing ? 'animate-spin' : ''}`}
                    disabled={refreshing}
                >
                    <RefreshCcw size={16} className="text-muted-foreground" />
                </button>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Candidates Table */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Eye size={16} className="text-primary" />
                            Active Candidates
                        </h3>
                    </div>
                    <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
                        {!dataLoaded ? (
                            <CandidatesSkeleton />
                        ) : activeSessions === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Users size={48} className="text-muted-foreground mb-4 opacity-30" />
                                <p className="text-sm font-medium text-muted-foreground">No active candidates</p>
                                <p className="text-xs text-muted-foreground mt-1">Waiting for sessions to start...</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="sticky top-0 bg-card border-b border-border">
                                    <tr className="text-xs font-bold text-muted-foreground uppercase">
                                        <th className="px-4 py-3 text-left">Candidate</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {Object.values(activeCandidates).map((candidate) => (
                                        <tr key={candidate.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {candidate.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                                                        {candidate.email && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail size={10} />
                                                                {candidate.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                                    Live
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Column - Activity & Charts */}
                <div className="flex flex-col gap-6">

                    {/* Recent Activity */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="overflow-y-auto max-h-[250px] p-3 space-y-2 custom-scrollbar">
                            {!dataLoaded ? (
                                <ActivitySkeleton />
                            ) : recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Activity size={32} className="text-muted-foreground mb-2 opacity-30" />
                                    <p className="text-xs text-muted-foreground">No recent activity</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {recentActivity.map((activity) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-3 bg-muted/30 border border-border rounded-lg"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{activity.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {VIOLATION_TYPE_LABELS[activity.type] || activity.type}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(activity.timestamp).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* Top Violations */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <TrendingUp size={16} className="text-primary" />
                                Top Violations
                            </h3>
                        </div>
                        <div className="p-4">
                            {!dataLoaded ? (
                                <ViolationsSkeleton />
                            ) : topViolations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Shield size={32} className="text-muted-foreground mb-2 opacity-30" />
                                    <p className="text-xs text-muted-foreground">No violations detected</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topViolations.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-foreground">{item.type}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${(item.count / statsTotal) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-foreground w-8 text-right">{item.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Violations Trend Chart */}
            <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-primary" />
                    Violations Timeline
                </h3>
                {!dataLoaded ? (
                    <ChartSkeleton />
                ) : chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <BarChart3 size={48} className="text-muted-foreground mb-4 opacity-30" />
                        <p className="text-sm font-medium text-muted-foreground">No data available</p>
                    </div>
                ) : (
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorViolation" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    stroke="hsl(var(--border))"
                                />
                                <YAxis
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    stroke="hsl(var(--border))"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorViolation)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* All Violations Breakdown Grid */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        Violation Breakdown
                    </h3>
                    {!dataLoaded && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <RefreshCcw size={12} className="animate-spin" />
                            Loading violations...
                        </div>
                    )}
                </div>

                {!dataLoaded ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="p-4 bg-muted/30 rounded-lg animate-pulse">
                                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                                <div className="h-6 bg-muted rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {ALL_VIOLATION_TYPES.map((type) => {
                            const count = violationCounts[type] || 0;
                            const hasViolations = count > 0;

                            return (
                                <div
                                    key={type}
                                    className={`p-4 rounded-lg border transition-all ${hasViolations
                                        ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                                        : 'bg-muted/30 border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-xs font-medium leading-tight ${hasViolations ? 'text-foreground' : 'text-muted-foreground'
                                            }`}>
                                            {VIOLATION_TYPE_LABELS[type] || type}
                                        </p>
                                        {hasViolations && (
                                            <AlertTriangle size={12} className="text-destructive shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                    <p className={`text-2xl font-bold mt-2 ${hasViolations ? 'text-destructive' : 'text-muted-foreground'
                                        }`}>
                                        {count}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: hsl(var(--border)); 
                    border-radius: 10px; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background: hsl(var(--primary) / 0.5); 
                }
            `}</style>
        </div>
    );
};

// ========== SKELETON LOADERS ==========

const CandidatesSkeleton = () => (
    <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

const ActivitySkeleton = () => (
    <div className="space-y-2">
        {[1, 2, 3].map(i => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg animate-pulse">
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-2 bg-muted rounded w-1/2" />
            </div>
        ))}
    </div>
);

const ViolationsSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-2 bg-muted rounded w-20" />
            </div>
        ))}
    </div>
);

const ChartSkeleton = () => (
    <div className="h-[200px] bg-muted/20 rounded-lg animate-pulse" />
);

export default MonitoringTab;