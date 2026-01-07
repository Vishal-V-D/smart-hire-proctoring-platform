import React, { useState } from 'react';
import {
    AlertTriangle, Camera, Activity, Users, User, ChevronRight
} from "lucide-react";
import { contestService } from "../../api/contestService";
import { showToast } from "../../utils/toast";
import Loader from "../../components/Loader";

interface SecureDashboardLiveReportsProps {
    contestId: string;
    violations: any[];
    participants: any[];
}

export default function SecureDashboardLiveReports({ contestId, violations, participants }: SecureDashboardLiveReportsProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [userViolations, setUserViolations] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [groupByUser, setGroupByUser] = useState(false);

    const getUsername = (userId: string) => {
        // 1. Try finding in participants list
        const participant = participants.find(p => p.userId === userId || p.id === userId);
        if (participant) return participant.name || participant.username;

        // 2. Try finding embedded user in violations list
        const violation = violations.find(v => v.userId === userId && v.user);
        if (violation) return violation.user.username || violation.user.name;

        return "Unknown User";
    };

    const formatViolationType = (type: string) => {
        if (!type) return "Unknown Violation";
        return type.replace(/_/g, ' ');
    };

    // Group violations by user
    const groupedViolations = violations.reduce((acc: any, v: any) => {
        const uid = v.userId;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(v);
        return acc;
    }, {});

    const handleUserSelect = async (user: any) => {
        const targetUserId = user.userId || user.id;

        setSelectedUser(user);
        setLoadingDetails(true);
        try {
            const [flagsRes, violationsRes] = await Promise.all([
                contestService.getUserFlags(contestId, targetUserId),
                contestService.getUserViolations(contestId, targetUserId)
            ]);

            setUserDetails(flagsRes.data.data || flagsRes.data);
            setUserViolations(violationsRes.data.data || violationsRes.data || []);
        } catch (err) {
            console.error("Failed to load user details", err);
            showToast("Failed to load user details", "error");
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Feed */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-900/20 rounded-2xl border border-gray-800/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} /> Violation Feed
                        </h3>
                        <button
                            onClick={() => setGroupByUser(!groupByUser)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-600/10 hover:bg-gray-600/20 text-gray-300 transition"
                        >
                            {groupByUser ? "Show Chronological" : "Group by User"}
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {groupByUser ? (
                            // Grouped View
                            Object.entries(groupedViolations).map(([userId, userViolations]: [string, any]) => (
                                <div key={userId} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-300">{getUsername(userId)}</h4>
                                        <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-500 rounded-full">
                                            {userViolations.length} Violations
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {userViolations.slice(0, 3).map((v: any, idx: number) => (
                                            <div key={idx} className="text-xs text-gray-500 flex justify-between">
                                                <span>{formatViolationType(v.violationType)}</span>
                                                <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        ))}
                                        {userViolations.length > 3 && (
                                            <div className="text-xs text-center text-gray-500 pt-1">
                                                + {userViolations.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Chronological View
                            violations.map((v, idx) => {
                                const vType = v.violationType || 'UNKNOWN';
                                return (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-red-500/30 transition">
                                        <div className="mt-1">
                                            {(vType === 'TAB_SWITCH' || vType.includes('TAB')) ?
                                                <Activity size={16} className="text-orange-400" /> :
                                                <Camera size={16} className="text-red-400" />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-semibold text-gray-300">
                                                    {formatViolationType(vType)}
                                                </p>
                                                <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-cyan-500 mt-1 font-medium">
                                                {getUsername(v.userId)}
                                            </p>
                                            {v.metadata && (
                                                <p className="text-[10px] text-gray-500 mt-1 opacity-70">
                                                    Details: {JSON.stringify(v.metadata).slice(0, 50)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {violations.length === 0 && (
                            <p className="text-center text-gray-500 py-10">No violations detected yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Participants List & Details */}
            <div className="bg-gray-900/20 rounded-2xl border border-gray-800/30 p-5 flex flex-col h-[600px]">
                <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <Users className="text-blue-500" size={20} /> Live Participants
                </h3>

                {selectedUser ? (
                    <div className="flex-1 overflow-y-auto pr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="mb-4 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                        >
                            ← Back to List
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                {selectedUser.photoUrl ? (
                                    <img
                                        src={selectedUser.photoUrl}
                                        alt={selectedUser.name}
                                        className="w-12 h-12 rounded-full border-2 border-cyan-500 object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                                        <User size={24} className="text-gray-500" />
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-lg font-bold text-gray-200">{selectedUser.name || selectedUser.username}</h4>
                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-6">
                            {userDetails && (
                                <div className={`text-center py-2 rounded-xl text-xs font-bold border ${userDetails.isSuspicious
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-green-500/10 text-green-500 border-green-500/20"
                                    }`}>
                                    STATUS: {userDetails.isSuspicious ? "SUSPICIOUS" : "CLEAN"}
                                </div>
                            )}
                        </div>

                        {loadingDetails ? (
                            <div className="flex justify-center py-10"><Loader /></div>
                        ) : userDetails ? (
                            <div className="space-y-6">
                                {/* Score Card */}
                                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium text-gray-400">Suspicion Score</span>
                                        <span className={`text-2xl font-black ${userDetails.suspiciousScore > 50 ? "text-red-500" : "text-gray-200"
                                            }`}>
                                            {userDetails.suspiciousScore}/100
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${userDetails.suspiciousScore > 50 ? "bg-red-500" : "bg-green-500"
                                                }`}
                                            style={{ width: `${userDetails.suspiciousScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Violation Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                                        <div className="text-xs text-gray-500 mb-1">Tab Switches</div>
                                        <div className="text-lg font-bold text-orange-400">
                                            {userDetails.details?.tabSwitchCount || 0}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                                        <div className="text-xs text-gray-500 mb-1">Copy/Paste</div>
                                        <div className="text-lg font-bold text-red-400">
                                            {userDetails.details?.externalPasteCount || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent User Violations */}
                                <div>
                                    <h5 className="text-sm font-bold text-gray-300 mb-3">Recent Activity</h5>
                                    <div className="space-y-2">
                                        {userViolations.map((v: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-800 border border-gray-700 text-xs">
                                                <span className="text-gray-400">{formatViolationType(v.violationType)}</span>
                                                <span className="text-gray-500">
                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                        {userViolations.length === 0 && (
                                            <p className="text-center text-gray-500 text-xs py-4">No violations recorded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No data available.</p>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {participants.map((p, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleUserSelect(p)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500/50 transition group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {p.photoUrl ? (
                                            <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-gray-800" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                                <span className="text-xs font-bold text-gray-400">{p.name?.charAt(0) || '?'}</span>
                                            </div>
                                        )}
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${p.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    </div>

                                    <div>
                                        <span className="text-sm font-medium text-gray-300 block group-hover:text-cyan-500 transition">
                                            {p.name || "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-gray-500 truncate max-w-[120px] block">{p.email}</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-cyan-500" />
                            </button>
                        ))}
                        {participants.length === 0 && (
                            <p className="text-center text-gray-500 py-10">No active participants.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
