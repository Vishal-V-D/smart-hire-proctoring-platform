'use client';

import React, { useState, useContext, useEffect } from "react";
import { contestService } from "@/api/contestService";
import { AuthContext } from "@/components/AuthProviderClient";
import { showToast } from "@/utils/toast";
import { Shield, Lock, ArrowRight, CheckCircle, Search, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SecureContestCreate() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = useContext(AuthContext)?.user;
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [problems, setProblems] = useState<any[]>([]);
    const [problemSearch, setProblemSearch] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        durationMinutes: 60,
        problemIds: [] as string[],
    });

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await contestService.listProblems(user?.id);
            setProblems(res.data?.data || res.data || []);
        } catch (err) {
            console.error("Failed to fetch problems", err);
        }
    };

    const toggleProblem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            problemIds: prev.problemIds.includes(id)
                ? prev.problemIds.filter(pid => pid !== id)
                : [...prev.problemIds, id]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.startDate || !formData.endDate) {
            showToast("Please fill in all required fields", "warning");
            return;
        }
        if (formData.problemIds.length === 0) {
            showToast("Please select at least one problem", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                isInviteOnly: true,
            };

            const res = await contestService.createSecureContest(payload);
            const contestId = res.data?.data?.id || res.data?.contest?.id || res.data?._id;

            // Add problems to contest
            await Promise.all(formData.problemIds.map(pid =>
                contestService.addProblemToContest(contestId, pid)
            ));

            showToast("Secure Contest Created! Redirecting...", "success");
            setTimeout(() => {
                router.push(`/organizer/secure/${contestId}/dashboard`);
            }, 1500);

        } catch (err) {
            console.error(err);
            showToast("Failed to create secure contest", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(problemSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-theme-bg via-theme-secondary/20 to-theme-bg p-6 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-theme-secondary/30 backdrop-blur-2xl border border-theme/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-theme-primary tracking-tight">Create Secure Assessment</h1>
                                <p className="text-theme-secondary">Configure invite-only access and proctoring settings.</p>
                            </div>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 bg-theme-bg/50 p-1.5 rounded-full border border-theme/30">
                            {[1, 2].map(s => (
                                <div
                                    key={s}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === s
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : step > s
                                            ? 'bg-green-500 text-white'
                                            : 'text-theme-secondary'
                                        }`}
                                >
                                    {step > s ? <Check size={14} /> : s}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* STEP 1: Details & Timing */}
                        {step === 1 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* Left Column: Basic Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-theme-primary ml-1">Assessment Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full p-4 rounded-xl bg-theme-bg/60 border border-theme/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                placeholder="e.g. Senior Backend Developer Hiring Challenge"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-theme-primary ml-1">Instructions</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full p-4 rounded-xl bg-theme-bg/60 border border-theme/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                                                placeholder="Detailed instructions for the candidates..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Timing & Security */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-theme-primary ml-1">Start Date</label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.startDate}
                                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                    className="w-full p-3 rounded-xl bg-theme-bg/60 border border-theme/40 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-theme-primary ml-1">End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.endDate}
                                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                    className="w-full p-3 rounded-xl bg-theme-bg/60 border border-theme/40 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lock size={18} className="text-indigo-400" />
                                                <h4 className="font-semibold text-indigo-300">Security Protocols Active</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-indigo-200/80">
                                                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Invite Only</div>
                                                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Tab Monitoring</div>
                                                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Copy/Paste Block</div>
                                                <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Webcam Snapshots</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="group px-8 py-3.5 rounded-xl bg-theme-primary text-theme-bg font-bold hover:bg-theme-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-theme-primary/10"
                                    >
                                        Select Problems <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Problem Selection */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">

                                <div className="flex items-center justify-between gap-4 bg-theme-bg/40 p-2 rounded-2xl border border-theme/30">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search problems..."
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none text-theme-primary placeholder:text-theme-secondary/50"
                                            value={problemSearch}
                                            onChange={e => setProblemSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="px-4 py-2 bg-theme-secondary/20 rounded-xl text-sm font-medium text-theme-primary border border-theme/20">
                                        Selected: <span className="text-indigo-400">{formData.problemIds.length}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {filteredProblems.map((problem: any) => {
                                        const isSelected = formData.problemIds.includes(problem.id);
                                        return (
                                            <div
                                                key={problem.id}
                                                onClick={() => toggleProblem(problem.id)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start justify-between group ${isSelected
                                                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                                    : 'bg-theme-bg/40 border-theme/30 hover:border-theme-accent/50 hover:bg-theme-bg/60'
                                                    }`}
                                            >
                                                <div>
                                                    <h4 className={`font-medium mb-1 ${isSelected ? 'text-indigo-300' : 'text-theme-primary'}`}>
                                                        {problem.title}
                                                    </h4>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className={`px-2 py-0.5 rounded-md border ${problem.difficulty === 'HARD' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                                            problem.difficulty === 'MEDIUM' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                                                'border-green-500/30 text-green-400 bg-green-500/10'
                                                            }`}>
                                                            {problem.difficulty || 'MEDIUM'}
                                                        </span>
                                                        <span className="text-theme-secondary px-2 py-0.5 bg-theme-secondary/20 rounded-md">
                                                            {problem.points || 10} pts
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                    : 'border-theme-secondary/50 group-hover:border-theme-accent'
                                                    }`}>
                                                    {isSelected && <Check size={14} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between pt-6 border-t border-theme/20">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 rounded-xl text-theme-secondary hover:text-theme-primary font-medium transition-colors"
                                    >
                                        Back to Details
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                                    >
                                        {loading ? "Creating..." : "Launch Assessment"}
                                        {!loading && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                    </form>
                </div>
            </div>
        </div>
    );
}
