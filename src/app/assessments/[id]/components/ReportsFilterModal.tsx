import React, { useState } from 'react';
import { X, Filter, RotateCcw, Check, Calendar, Briefcase, GraduationCap, Quote, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ReportsFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: any;
    onApply: (filters: any) => void;
    departments: string[];
    colleges: string[];
}

export default function ReportsFilterModal({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    departments,
    colleges
}: ReportsFilterModalProps) {
    const [filters, setFilters] = useState(currentFilters || {
        statuses: [],
        minScore: '',
        maxScore: '',
        dateRange: 'all',
        department: '',
        college: '',
        plagiarismRisk: []
    });

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const cleared = {
            statuses: [],
            minScore: '',
            maxScore: '',
            dateRange: 'all',
            department: '',
            college: '',
            plagiarismRisk: []
        };
        setFilters(cleared);
        onApply(cleared);
        onClose();
    };

    const toggleStatus = (status: string) => {
        setFilters((prev: any) => {
            const current = prev.statuses || [];
            if (current.includes(status)) {
                return { ...prev, statuses: current.filter((s: string) => s !== status) };
            } else {
                return { ...prev, statuses: [...current, status] };
            }
        });
    };

    const toggleRisk = (risk: string) => {
        setFilters((prev: any) => {
            const current = prev.plagiarismRisk || [];
            if (current.includes(risk)) {
                return { ...prev, plagiarismRisk: current.filter((r: string) => r !== risk) };
            } else {
                return { ...prev, plagiarismRisk: [...current, risk] };
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Advanced Filters</h3>
                            <p className="text-xs text-muted-foreground">Refine participant data by industry metrics</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Section: Session Status */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <ShieldCheck size={14} /> Session Status
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['submitted', 'in_progress', 'evaluated', 'not_started'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(status)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${filters.statuses?.includes(status)
                                            ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10'
                                            : 'bg-card border-border hover:border-primary/50 text-muted-foreground'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded ml-auto flex items-center justify-center transition-colors ${filters.statuses?.includes(status) ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white' : 'bg-muted border border-border'}`}>
                                            {filters.statuses?.includes(status) && <Check size={10} />}
                                        </div>
                                        <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section: Performance */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Quote size={14} className="rotate-180" /> Performance Metric
                            </label>
                            <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-medium text-foreground">Score Percentage</span>
                                        <span className="text-muted-foreground">{filters.minScore || 0}% - {filters.maxScore || 100}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            value={filters.minScore}
                                            onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none text-center"
                                        />
                                        <div className="h-px w-4 bg-border"></div>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            min="0"
                                            max="100"
                                            value={filters.maxScore}
                                            onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary outline-none text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Demographics */}
                        <div className="space-y-4 md:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Briefcase size={14} /> Demographics
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        list="departments-list"
                                        type="text"
                                        placeholder="Filter by Department..."
                                        value={filters.department}
                                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary outline-none shadow-sm"
                                    />
                                    <datalist id="departments-list">
                                        {departments.map(d => <option key={d} value={d} />)}
                                    </datalist>
                                </div>
                                <div className="relative group">
                                    <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        list="colleges-list"
                                        type="text"
                                        placeholder="Filter by College/Institution..."
                                        value={filters.college}
                                        onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary outline-none shadow-sm"
                                    />
                                    <datalist id="colleges-list">
                                        {colleges.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Section: Timeline */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Calendar size={14} /> Submission Timeline
                            </label>
                            <div className="flex flex-col gap-2">
                                {['all', 'today', 'week', 'month'].map((range) => {
                                    const labels: any = { all: 'All Time', today: 'Last 24 Hours', week: 'Last 7 Days', month: 'Last 30 Days' };
                                    return (
                                        <button
                                            key={range}
                                            onClick={() => setFilters({ ...filters, dateRange: range })}
                                            className={`px-4 py-2 text-sm text-left rounded-lg border transition-all ${filters.dateRange === range
                                                ? 'bg-blue-50/50 border-blue-200 text-blue-700 font-bold'
                                                : 'bg-transparent border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {labels[range]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Integrity */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <AlertTriangle size={14} /> Integrity Check
                            </label>
                            <div className="space-y-3 bg-red-50/30 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                <p className="text-xs text-muted-foreground">Filter by Plagiarism Risk Level</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Low', 'Medium', 'High'].map((risk) => (
                                        <button
                                            key={risk}
                                            onClick={() => toggleRisk(risk)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${filters.plagiarismRisk?.includes(risk)
                                                ? risk === 'High' ? 'bg-red-500 border-red-500 text-white'
                                                    : risk === 'Medium' ? 'bg-amber-500 border-amber-500 text-white'
                                                        : 'bg-green-500 border-green-500 text-white'
                                                : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                                                }`}
                                        >
                                            {risk} Risk
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                    >
                        <RotateCcw size={14} /> Reset Filters
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-background hover:text-foreground rounded-xl transition-all border border-transparent hover:border-border hover:shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
