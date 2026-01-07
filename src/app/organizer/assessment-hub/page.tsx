'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contestService } from '@/api/contestService';
import {
    Shield,
    Users,
    Eye,
    FileText,
    Plus,
    Activity,
    Lock,
    Mail,
    AlertTriangle,
    BarChart3,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import Loader from '@/components/Loader';

const AssessmentHub = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [secureContests, setSecureContests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSecureContests();
    }, []);

    const fetchSecureContests = async () => {
        try {
            // Assuming we can filter by isInviteOnly or fetch created contests and filter client-side
            const res = await contestService.getCreatedContests();
            const allContests = res.data.data || res.data || [];
            // Filter for secure contests (isInviteOnly: true)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const secure = allContests.filter((c: any) => c.isInviteOnly);
            setSecureContests(secure);
        } catch (err) {
            console.error("Failed to fetch contests", err);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            title: "Secure Assessment",
            description: "Create an invite-only contest with proctoring enabled (tab-switch detection, webcam monitoring).",
            icon: Shield,
            to: "/organizer/secure/create",
            color: "bg-indigo-600",
            gradient: "from-indigo-600 to-indigo-800",
            action: "Create Secure"
        },
        {
            title: "Candidate Invites",
            description: "Manage email invitations, bulk invites, and track acceptance status for private assessments.",
            icon: Mail,
            to: "/organizer/contests?tab=invites", // Placeholder route logic
            color: "bg-blue-600",
            gradient: "from-blue-600 to-blue-800",
            action: "Manage Invites"
        },
        {
            title: "Live Monitoring",
            description: "Real-time dashboard to view active violations, suspicious flags, and participant status.",
            icon: Eye,
            to: "/organizer/submissions?mode=live",
            color: "bg-red-600",
            gradient: "from-red-600 to-red-800",
            action: "Open Monitor"
        },
        {
            title: "Performance Reports",
            description: "Generate comprehensive PDF reports with plagiarism analysis and violation logs.",
            icon: FileText,
            to: "/organizer/reports",
            color: "bg-emerald-600",
            gradient: "from-emerald-600 to-emerald-800",
            action: "View Reports"
        }
    ];

    const stats = [
        { label: "Active Assessments", value: secureContests.length.toString(), icon: Activity, color: "text-green-500" },
        { label: "Pending Invites", value: "-", icon: Users, color: "text-blue-500" }, // Placeholder
        { label: "Flagged Violations", value: "-", icon: AlertTriangle, color: "text-red-500" }, // Placeholder
    ];

    if (loading) return <Loader fullscreen />;

    return (
        <div className="min-h-screen bg-theme-bg p-6 md:p-8 animate-fadeIn">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-theme-primary tracking-tight flex items-center gap-3">
                            <Lock className="w-8 h-8 text-theme-accent" />
                            Assessment Control Center
                        </h1>
                        <p className="text-theme-secondary text-lg">
                            Manage secure contests, monitor integrity, and analyze candidate performance.
                        </p>
                    </div>
                    <Link
                        href="/organizer/secure/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-theme-accent text-white rounded-xl font-semibold shadow-lg shadow-theme-accent/20 hover:scale-105 transition-transform"
                    >
                        <Plus className="w-5 h-5" />
                        New Secure Assessment
                    </Link>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-theme-secondary/30 border border-theme/30 rounded-2xl p-5 flex items-center justify-between hover:border-theme-accent/50 transition-colors">
                            <div>
                                <p className="text-theme-secondary text-sm font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-theme-primary mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-theme-bg ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <Link
                            key={index}
                            href={feature.to}
                            className="group relative overflow-hidden rounded-3xl border border-theme/30 bg-theme-secondary/40 hover:bg-theme-secondary/60 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                        >
                            {/* Background Gradient Effect */}
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full transition-transform duration-700 group-hover:scale-125`} />

                            <div className="p-8 relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full border border-theme/20 bg-theme-bg/50 text-xs font-semibold text-theme-secondary uppercase tracking-wider">
                                        {feature.action}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-theme-primary group-hover:text-theme-accent transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-theme-secondary leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-theme-accent opacity-80 group-hover:opacity-100 group-hover:gap-3 transition-all">
                                    <span>Access Module</span>
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Secure Contests List */}
                <div className="rounded-3xl border border-theme/30 bg-theme-secondary/20 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                            <Shield className="w-5 h-5 text-theme-accent" />
                            Your Secure Assessments
                        </h3>
                        <Link href="/organizer/contests" className="text-sm text-theme-accent hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {secureContests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {secureContests.map((contest: any) => (
                                <Link
                                    key={contest.id}
                                    href={`/organizer/secure/${contest.id}/dashboard`}
                                    className="block p-5 rounded-2xl bg-theme-bg/50 border border-theme/20 hover:border-theme-accent/50 transition-all group hover:shadow-lg hover:-translate-y-1"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <Shield size={20} />
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-xs border ${new Date(contest.endDate) < new Date() ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            new Date(contest.startDate) > new Date() ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                'bg-green-500/10 text-green-500 border-green-500/20'
                                            }`}>
                                            {new Date(contest.endDate) < new Date() ? 'Ended' :
                                                new Date(contest.startDate) > new Date() ? 'Upcoming' : 'Active'}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-lg text-theme-primary group-hover:text-theme-accent transition-colors mb-2 line-clamp-1">
                                        {contest.title}
                                    </h4>

                                    <div className="space-y-2 text-xs text-theme-secondary">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>{new Date(contest.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            <span>{contest.durationMinutes} Minutes</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-theme/10 flex items-center justify-between text-xs font-medium">
                                        <span className="text-theme-secondary">Manage Dashboard</span>
                                        <ArrowRight size={14} className="text-theme-accent group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-theme-bg/30 rounded-2xl border border-theme/20 border-dashed">
                            <Shield size={48} className="mx-auto text-theme-secondary/50 mb-3" />
                            <h4 className="text-lg font-medium text-theme-primary">No Secure Assessments Yet</h4>
                            <p className="text-theme-secondary text-sm mb-4">Create your first invite-only contest to get started.</p>
                            <Link
                                href="/organizer/secure/create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-lg hover:bg-theme-primary/20 transition-colors"
                            >
                                <Plus size={16} /> Create Now
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AssessmentHub;
