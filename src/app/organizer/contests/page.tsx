'use client';

import React, { useEffect, useState, useMemo } from "react";
import { contestService } from "@/api/contestService";
import { Trash2, Edit, X, Trophy, Calendar, Clock, Code2, Eye, Zap, ListChecks, Search, Save } from "lucide-react";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

interface Problem {
    id: string;
    title: string;
    difficulty?: string;
    description?: string;
    constraints?: string;
    inputFormat?: string;
    outputFormat?: string;
    additionalInfo?: string;
    testCases?: TestCase[];
}

interface ContestProblem {
    id: string;
    problem: Problem;
}

interface Contest {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    contestProblems: ContestProblem[];
}

// ----------------------------------------------------
// ✅ Real Calendar Component with Event Markers
// ----------------------------------------------------
interface CalendarComponentProps {
    contests: Contest[];
    onDateClick?: (date: Date) => void;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ contests, onDateClick }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const contestDateMap = useMemo(() => {
        const map = new Map<string, Contest[]>();
        contests.forEach(contest => {
            const dateKey = new Date(contest.startTime).toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)?.push(contest);
        });
        return map;
    }, [contests]);

    const hasContest = (date: Date) => {
        return contestDateMap.has(date.toDateString());
    };

    const getContestsForDate = (date: Date) => {
        return contestDateMap.get(date.toDateString()) || [];
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month' && hasContest(date)) {
            const contestCount = getContestsForDate(date).length;
            return (
                <div className="flex justify-center items-center mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" title={`${contestCount} contest(s)`}></div>
                </div>
            );
        }
        return null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month' && hasContest(date)) {
            return 'contest-date';
        }
        return '';
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDateChange = (value: any) => {
        setSelectedDate(value as Date);
        if (onDateClick) {
            onDateClick(value as Date);
        }
    };

    const selectedDateContests = getContestsForDate(selectedDate);

    return (
        <div className="bg-theme-secondary border border-theme rounded-xl p-5 sticky top-6 self-start animate-fade-in-slide-up">
            <h3 className="text-base font-bold text-theme-primary mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-theme-accent" />
                Contest Schedule
            </h3>

            <style>{`
                .react-calendar {
                    width: 100%;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                }
                .react-calendar__tile {
                    padding: 10px 6px;
                    background: var(--theme-primary);
                    color: var(--text-primary);
                    border-radius: 6px;
                    margin: 2px;
                    transition: all 0.2s;
                }
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                    background: var(--theme-accent);
                    color: white;
                }
                .react-calendar__tile--active {
                    background: var(--theme-accent) !important;
                    color: white !important;
                }
                .react-calendar__tile.contest-date {
                    background: rgba(139, 92, 246, 0.1);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    font-weight: 600;
                }
                .react-calendar__navigation button {
                    color: var(--text-primary);
                    min-width: 44px;
                    background: transparent;
                    font-size: 16px;
                    margin-top: 8px;
                }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                    background: var(--theme-tertiary);
                    border-radius: 6px;
                }
                .react-calendar__month-view__weekdays {
                    text-transform: uppercase;
                    font-weight: bold;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .react-calendar__month-view__days__day--weekend {
                    color: #ef4444;
                }
            `}</style>

            <ReactCalendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                tileClassName={tileClassName}
                className="rounded-lg"
            />

            {selectedDateContests.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-2">
                        {selectedDate.toLocaleDateString()} - {selectedDateContests.length} Contest(s)
                    </h4>
                    <div className="space-y-2">
                        {selectedDateContests.map(contest => (
                            <div key={contest.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-900">
                                <p className="font-semibold text-purple-900 dark:text-purple-300 truncate">{contest.title}</p>
                                <p className="text-purple-700 dark:text-purple-400 flex items-center gap-1 mt-1">
                                    <Clock size={10} />
                                    {new Date(contest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-theme-secondary">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span>Contest scheduled</span>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// ✅ CONTEST CARD COMPONENT
// ----------------------------------------------------
interface ContestCardProps {
    contest: Contest;
    onManageProblems: (contestId: string) => void;
    onEditContest: (contest: Contest) => void;
    onDeleteContest: (contestId: string) => void;
    index: number;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest, onManageProblems, onEditContest, onDeleteContest, index }) => {
    const problemCount = contest.contestProblems?.length || 0;
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    const now = Date.now();
    const startMs = start.getTime() || 0;
    const endMs = end.getTime() || startMs;

    let statusLabel = "Completed";
    let statusClasses = "bg-theme-primary/40 text-theme-secondary border border-theme/60";
    if (startMs > now) {
        statusLabel = "Upcoming";
        statusClasses = "bg-theme-primary/50 text-theme-primary border border-theme/60";
    } else if (startMs <= now && endMs >= now) {
        statusLabel = "Live";
        statusClasses = "bg-[hsl(var(--color-accent)/0.16)] text-[hsl(var(--color-accent))] border border-[hsl(var(--color-accent)/0.4)]";
    }

    const durationMs = Math.max(0, endMs - startMs);
    let durationLabel = "—";
    if (durationMs > 0) {
        const minutes = Math.round(durationMs / 60000);
        if (minutes >= 60) {
            const hours = Math.round((minutes / 60) * 10) / 10;
            durationLabel = `${hours}${hours === 1 ? " hr" : " hrs"}`;
        } else {
            durationLabel = `${minutes} min${minutes === 1 ? "" : "s"}`;
        }
    }

    return (
        <div
            key={contest.id}
            className="bg-theme-secondary border border-theme rounded-xl overflow-hidden transition-all duration-300 hover:border-theme-accent hover:shadow-xl hover:shadow-theme-primary/15 animate-fade-in-slide-up flex flex-col"
            style={{ animationDelay: `${0.08 * index}s` }}
        >
            <div className="p-4 border-b border-theme/40 flex flex-col gap-2 flex-grow">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-theme-primary line-clamp-2">
                        {contest.title}
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClasses}`}>
                        {statusLabel}
                    </span>
                </div>
                <p className="text-theme-secondary text-[11px] sm:text-xs leading-relaxed line-clamp-3">
                    {contest.description}
                </p>
            </div>

            <div className="px-4 py-3 border-b border-theme/40 flex flex-wrap items-center gap-3 text-[11px] text-theme-secondary">
                <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-theme-accent" />
                    <span>{start.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={14} className="text-theme-secondary" />
                    <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1">
                    <ListChecks size={14} className="text-purple-400" />
                    <span>{problemCount} problems</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={14} className="text-orange-400" />
                    <span>{durationLabel}</span>
                </div>
            </div>

            <div className="p-3 space-y-2">
                <button
                    onClick={() => onManageProblems(contest.id)}
                    className="w-full flex items-center justify-center gap-2 button-theme text-theme-primary px-3 py-2 text-sm font-semibold"
                >
                    <Zap size={16} />
                    Manage Problems
                </button>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onEditContest(contest)}
                        className="flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                    >
                        <Edit size={14} />
                        Edit
                    </button>
                    <button
                        onClick={() => onDeleteContest(contest.id)}
                        className="flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ContestDashboard() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedContestForManagement, setSelectedContestForManagement] = useState<Contest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
    const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
    const [editingContest, setEditingContest] = useState<Contest | null>(null);
    const [showEditContestModal, setShowEditContestModal] = useState(false);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            const res = await contestService.getCreatedContests();
            setContests(res.data);
        } catch (err) {
            console.error("Failed to fetch contests:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredContests = useMemo(() => {
        return contests.filter(contest => {
            const matchesSearch = contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contest.description.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [contests, searchQuery]);

    const handleManageProblems = async (contestId: string) => {
        try {
            const res = await contestService.getContestById(contestId);
            setSelectedContestForManagement(res.data);
            setShowModal(true);
        } catch (err) {
            console.error("Failed to fetch contest details for management:", err);
            const contest = contests.find(c => c.id === contestId);
            if (contest) {
                setSelectedContestForManagement(contest);
                setShowModal(true);
            }
        }
    };

    const handleViewProblem = async (problemId: string) => {
        try {
            const res = await contestService.getProblem(problemId);
            setSelectedProblem(res.data);
        } catch (err) {
            console.error("Failed to load problem details:", err);
        }
    };

    const handleEditProblem = async (problemId: string) => {
        try {
            const res = await contestService.getProblem(problemId);
            setEditingProblem(res.data);
        } catch (err) {
            console.error("Failed to load problem for editing:", err);
        }
    };

    const handleSaveProblem = async () => {
        if (!editingProblem) return;
        try {
            await contestService.updateProblem(editingProblem.id, {
                title: editingProblem.title,
                description: editingProblem.description,
                difficulty: editingProblem.difficulty,
                constraints: editingProblem.constraints,
                inputFormat: editingProblem.inputFormat,
                outputFormat: editingProblem.outputFormat,
                additionalInfo: editingProblem.additionalInfo,
                accessType: "PRIVATE"
            });

            setSelectedContestForManagement(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    contestProblems: prev.contestProblems.map(cp =>
                        cp.problem.id === editingProblem.id
                            ? { ...cp, problem: editingProblem }
                            : cp
                    )
                };
            });

            setEditingProblem(null);
            alert("Problem updated successfully!");
        } catch (err) {
            console.error("Failed to update problem:", err);
            alert("Failed to update problem");
        }
    };

    const handleDeleteProblem = async (contestId: string, cpId: string) => {
        if (!window.confirm("Are you sure you want to delete this problem from the contest?")) return;
        try {
            await contestService.removeContestProblem(cpId);
            setSelectedContestForManagement(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    contestProblems: prev.contestProblems.filter(cp => cp.id !== cpId)
                };
            });
            setContests(prev =>
                prev.map(c =>
                    c.id === contestId
                        ? { ...c, contestProblems: c.contestProblems.filter(cp => cp.id !== cpId) }
                        : c
                )
            );
        } catch (err) {
            console.error("Failed to delete problem:", err);
        }
    };

    const handleEditContest = (contest: Contest) => {
        setEditingContest(contest);
        setShowEditContestModal(true);
    };

    const handleSaveContest = async () => {
        if (!editingContest) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await contestService.updateContest(editingContest.id, {
                title: editingContest.title,
                description: editingContest.description,
                startDate: editingContest.startTime,
                endDate: editingContest.endTime
            } as any);

            setContests(prev =>
                prev.map(c => c.id === editingContest.id ? editingContest : c)
            );

            setShowEditContestModal(false);
            setEditingContest(null);
            alert("Contest updated successfully!");
        } catch (err) {
            console.error("Failed to update contest:", err);
            alert("Failed to update contest");
        }
    };

    const handleDeleteContest = async (contestId: string) => {
        if (!window.confirm("Are you sure you want to delete this contest? This action cannot be undone.")) return;
        try {
            await contestService.deleteContest(contestId);
            setContests(prev => prev.filter(c => c.id !== contestId));
            alert("Contest deleted successfully!");
        } catch (err) {
            console.error("Failed to delete contest:", err);
            alert("Failed to delete contest");
        }
    };

    if (loading) {
        return (
            <Loader fullscreen message="Loading contests..." />
        );
    }

    if (contests.length === 0) {
        return (
            <div className="min-h-screen bg-theme-primary flex items-center justify-center">
                <div className="text-center animate-fade-in-slide-up">
                    <Trophy className="mx-auto mb-4 text-theme-secondary/50" size={60} />
                    <p className="text-theme-secondary text-lg font-medium">No contests created yet.</p>
                    <p className="text-theme-secondary/70 text-sm mt-2">Start by creating your first contest!</p>
                </div>
            </div>
        );
    }

    const ManagementModalContent = () => {
        if (!selectedContestForManagement) return null;
        const contest = selectedContestForManagement;

        return (
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                    <Code2 size={20} className="text-purple-400" />
                    Problems in "{contest.title}"
                </h3>

                {contest.contestProblems?.length > 0 ? (
                    <div className="space-y-3">
                        {contest.contestProblems.map((cp) => (
                            <div
                                key={cp.id}
                                className="bg-theme-primary/70 border border-theme/50 rounded-lg p-3 flex justify-between items-center transition-all duration-300 hover:border-theme-accent group"
                            >
                                <div className="flex-1 pr-3">
                                    <h4
                                        className="font-semibold text-theme-primary text-base group-hover:text-theme-accent cursor-pointer transition-colors line-clamp-1"
                                        onClick={() => handleViewProblem(cp.problem.id)}
                                    >
                                        {cp.problem.title}
                                    </h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cp.problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
                                            cp.problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {cp.problem.difficulty || 'N/A'}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewProblem(cp.problem.id)}
                                        className="flex items-center justify-center px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium"
                                    >
                                        <Eye size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleEditProblem(cp.problem.id)}
                                        className="flex items-center justify-center px-3 py-1.5 bg-green-600/80 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium"
                                    >
                                        <Edit size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProblem(contest.id, cp.id)}
                                        className="flex items-center justify-center px-3 py-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-theme-secondary/70 italic text-center py-6 border border-dashed border-theme/50 rounded-lg text-sm">
                        No problems attached yet.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-theme-primary p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 animate-fade-in-slide-up">
                    <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-1 flex items-center gap-3">
                        <Trophy className="text-theme-accent" size={32} />
                        Contest Management Hub
                    </h1>
                    <p className="text-theme-secondary text-base">Overview of your created competitions and schedule.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 bg-theme-secondary border border-theme rounded-xl p-4 animate-fade-in-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary" size={18} />
                            <input
                                type="text"
                                placeholder="Search contests by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                            />
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-theme-accent" />
                            My Competitions ({filteredContests.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredContests.map((contest, index) => (
                                <ContestCard
                                    key={contest.id}
                                    contest={contest}
                                    onManageProblems={handleManageProblems}
                                    onEditContest={handleEditContest}
                                    onDeleteContest={handleDeleteContest}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <CalendarComponent contests={filteredContests} />
                    </div>
                </div>

                {/* Problem Management Modal */}
                {showModal && selectedContestForManagement && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-slide-up">
                        <div className="bg-theme-secondary border border-theme rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl">
                            <button
                                onClick={() => { setShowModal(false); setSelectedProblem(null); setEditingProblem(null); setSelectedContestForManagement(null); }}
                                className="absolute top-4 right-4 text-theme-secondary hover:text-theme-primary transition-colors p-2 rounded-full bg-theme-primary/20 hover:bg-theme-primary/30"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6 border-b border-theme/50 pb-4">
                                <h2 className="text-2xl font-bold text-theme-primary mb-1">Manage Contest: {selectedContestForManagement.title}</h2>
                                <p className="text-theme-secondary text-sm">{new Date(selectedContestForManagement.startTime).toLocaleString()} - {new Date(selectedContestForManagement.endTime).toLocaleString()}</p>
                            </div>

                            {editingProblem ? (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
                                        <Edit size={20} className="text-green-400" />
                                        Edit Problem
                                    </h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={editingProblem.title}
                                                onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                                                className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-1">Difficulty</label>
                                            <select
                                                value={editingProblem.difficulty}
                                                onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value })}
                                                className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                                            >
                                                <option value="EASY">Easy</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HARD">Hard</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
                                            <textarea
                                                value={editingProblem.description}
                                                onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                                                className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm min-h-[100px]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-primary mb-1">Constraints</label>
                                            <textarea
                                                value={editingProblem.constraints || ''}
                                                onChange={(e) => setEditingProblem({ ...editingProblem, constraints: e.target.value })}
                                                className="w-full px-3 py-2 bg-theme-primary border border-theme rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                                            />
                                        </div>

                                        {editingProblem.testCases && editingProblem.testCases.length > 0 && (
                                            <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                                <h4 className="text-lg font-semibold text-theme-primary mb-3">Test Cases</h4>
                                                <div className="space-y-3">
                                                    {editingProblem.testCases.map((tc, idx) => (
                                                        <div key={tc.id} className="p-3 bg-theme-primary/50 rounded border border-theme/30">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-medium text-theme-primary">Test Case {idx + 1}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${tc.isHidden ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {tc.isHidden ? 'Hidden' : 'Visible'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                                <div>
                                                                    <p className="text-xs text-theme-secondary mb-1 uppercase tracking-wider">Input:</p>
                                                                    <pre className="text-xs text-theme-primary bg-theme-primary/70 p-2 rounded font-mono border border-theme/50 overflow-x-auto">{tc.input}</pre>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-theme-secondary mb-1 uppercase tracking-wider">Expected Output:</p>
                                                                    <pre className="text-xs text-theme-primary bg-theme-primary/70 p-2 rounded font-mono border border-theme/50 overflow-x-auto">{tc.expectedOutput}</pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={handleSaveProblem}
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                                        >
                                            <Save size={16} />
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditingProblem(null)}
                                            className="flex-1 button-theme px-4 py-2 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : selectedProblem ? (
                                <div className="space-y-4">
                                    <div className="mb-4 border-b border-theme/50 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-theme-primary">{selectedProblem.title}</h3>
                                        {selectedProblem.difficulty && (
                                            <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${selectedProblem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
                                                    selectedProblem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {selectedProblem.difficulty}
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                        <h4 className="text-lg font-semibold text-theme-primary mb-2">Description</h4>
                                        <p className="text-theme-secondary whitespace-pre-wrap text-sm">{selectedProblem.description}</p>
                                    </div>

                                    {selectedProblem.constraints && (
                                        <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                            <h4 className="text-lg font-semibold text-theme-primary mb-2">Constraints</h4>
                                            <p className="text-theme-secondary whitespace-pre-wrap text-sm">{selectedProblem.constraints}</p>
                                        </div>
                                    )}

                                    {selectedProblem.inputFormat && (
                                        <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                            <h4 className="text-lg font-semibold text-theme-primary mb-2">Input Format</h4>
                                            <p className="text-theme-secondary whitespace-pre-wrap text-sm">{selectedProblem.inputFormat}</p>
                                        </div>
                                    )}

                                    {selectedProblem.outputFormat && (
                                        <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                            <h4 className="text-lg font-semibold text-theme-primary mb-2">Output Format</h4>
                                            <p className="text-theme-secondary whitespace-pre-wrap text-sm">{selectedProblem.outputFormat}</p>
                                        </div>
                                    )}

                                    {(selectedProblem.testCases && selectedProblem.testCases.length > 0) && (
                                        <div className="p-4 bg-theme-primary/30 rounded-lg border border-theme/50">
                                            <h4 className="text-lg font-semibold text-theme-primary mb-3">Test Cases</h4>
                                            <div className="space-y-3">
                                                {selectedProblem.testCases.map((tc, idx) => (
                                                    <div key={tc.id} className="p-3 bg-theme-primary/50 rounded border border-theme/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-medium text-theme-primary">Test Case {idx + 1}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${tc.isHidden ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                {tc.isHidden ? 'Hidden' : 'Visible'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                            <div>
                                                                <p className="text-xs text-theme-secondary mb-1 uppercase tracking-wider">Input:</p>
                                                                <pre className="text-xs text-theme-primary bg-theme-primary/70 p-2 rounded font-mono border border-theme/50 overflow-x-auto">{tc.input}</pre>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-theme-secondary mb-1 uppercase tracking-wider">Expected Output:</p>
                                                                <pre className="text-xs text-theme-primary bg-theme-primary/70 p-2 rounded font-mono border border-theme/50 overflow-x-auto">{tc.expectedOutput}</pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setSelectedProblem(null)}
                                        className="w-full mt-4 button-theme px-6 py-2 text-sm font-semibold"
                                    >
                                        Back to Contest Management
                                    </button>
                                </div>
                            ) : (
                                <ManagementModalContent />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
