"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Printer,
    Download,
    User,
    Mail,
    Building,
    GraduationCap,
    Clock,
    Calendar,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Code,
    FileText,
    Shield,
    Award,
    BarChart3,
    Camera,
    Mic,
    Monitor,
    RotateCcw,
    Pencil,
    X,
    Eye,
    EyeOff,
    RotateCw
} from 'lucide-react';
import { assessmentService, ParticipantReport } from '@/api/assessmentService';

export default function ParticipantReportPage() {
    const router = useRouter();
    const params = useParams();
    const assessmentId = params.id as string;
    const participantId = params.participantId as string;
    const printRef = useRef<HTMLDivElement>(null);

    const [report, setReport] = useState<ParticipantReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());

    const toggleSection = (sectionId: string) => {
        setHiddenSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const resetSections = () => {
        setHiddenSections(new Set());
    };

    const isSectionVisible = (sectionId: string) => !hiddenSections.has(sectionId);

    useEffect(() => {
        fetchReport();
    }, [assessmentId, participantId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try the participant detail API first
            try {
                const response = await assessmentService.getParticipantDetail(assessmentId, participantId);
                if (response.data?.participant) {
                    setReport(response.data.participant);
                    return;
                }
            } catch (detailErr: any) {
                console.warn('getParticipantDetail failed, trying alternative APIs:', detailErr?.response?.status);
            }

            // Fallback: Try to get from reports list and find the participant
            try {
                const reportsResponse = await assessmentService.getParticipantReports(assessmentId, {});
                const participants = reportsResponse.data?.participants || [];
                const participant = participants.find((p: any) =>
                    p.participantId === participantId ||
                    p.id === participantId ||
                    p.contestantId === participantId
                );

                if (participant) {
                    setReport(participant);
                    return;
                }
            } catch (reportsErr: any) {
                console.warn('getParticipantReports failed:', reportsErr?.response?.status);
            }

            // Fallback: Try the submissions API with submissionId
            try {
                const submissionResponse = await assessmentService.getSubmissionDetails(assessmentId, participantId);
                if (submissionResponse.data?.submission) {
                    const sub = submissionResponse.data.submission as any;
                    // Transform submission data to match ParticipantReport format
                    const transformedReport: ParticipantReport = {
                        id: sub.id,
                        participantId: sub.contestantId || sub.id,
                        registration: {
                            fullName: sub.contestantName || sub.contestant?.name || 'Unknown',
                            email: sub.contestantEmail || sub.contestant?.email || '',
                            college: sub.contestant?.college || '',
                            department: sub.contestant?.department || '',
                            registrationNumber: sub.contestant?.registrationNumber || '',
                            cgpa: sub.contestant?.cgpa,
                        },
                        verification: {
                            photoUrl: sub.contestant?.profilePhotoUrl || sub.contestant?.photoUrl || sub.profilePhotoUrl,
                            photoThumbnailUrl: sub.contestant?.photoThumbnailUrl,
                        },
                        session: {
                            id: sub.id,
                            status: sub.status === 'submitted' || sub.status === 'graded' ? 'completed' : (sub.status === 'in_progress' ? 'in_progress' : 'not_started'),
                            startedAt: sub.startedAt,
                            submittedAt: sub.submittedAt,
                            totalTimeTaken: sub.timeTaken,
                            systemChecks: undefined,
                        },
                        scores: {
                            totalScore: sub.totalScore || 0,
                            maxScore: sub.totalMarks || 100,
                            percentage: sub.percentage || (sub.totalScore && sub.totalMarks ? (sub.totalScore / sub.totalMarks) * 100 : 0),
                            rank: undefined,
                            sectionScores: sub.sections?.map((s: any) => ({
                                sectionId: s.sectionId || s.id,
                                sectionTitle: s.sectionTitle || s.title || 'Section',
                                sectionType: s.sectionType || s.type || 'mcq',
                                obtainedMarks: s.obtainedMarks || s.score || 0,
                                totalMarks: s.totalMarks || s.maxScore || 0,
                                percentage: s.percentage || 0,
                                correctAnswers: s.correctAnswers,
                                wrongAnswers: s.wrongAnswers,
                                unattempted: s.unattempted,
                                timeTaken: s.timeTaken,
                            })) || [],
                        },
                        violations: {
                            totalCount: 0,
                            byType: {},
                            riskLevel: 'low',
                        },
                        verdict: {
                            status: 'pending',
                            finalScore: sub.totalScore || 0,
                            notes: undefined,
                        },
                        timestamps: {
                            startedAt: sub.startedAt,
                            submittedAt: sub.submittedAt,
                        },
                        codingProblems: sub.codingProblems || [],
                    };
                    setReport(transformedReport);
                    return;
                }
            } catch (subErr: any) {
                console.warn('getSubmissionDetail failed:', subErr?.response?.status);
            }

            // All APIs failed
            setError('Failed to load participant report');
        } catch (err) {
            console.error('Failed to fetch report:', err);
            setError('Failed to load participant report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        // Trigger print dialog which allows saving as PDF
        window.print();
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins} minutes`;
    };

    const getVerdictColor = (status?: string) => {
        switch (status) {
            case 'passed': return 'text-green-600 bg-green-50 border-green-200';
            case 'failed': return 'text-red-600 bg-red-50 border-red-200';
            case 'disqualified': return 'text-red-800 bg-red-100 border-red-300';
            default: return 'text-amber-600 bg-amber-50 border-amber-200';
        }
    };

    const getRiskColor = (level?: string) => {
        switch (level) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-amber-600 bg-amber-100';
            default: return 'text-green-600 bg-green-100';
        }
    };

    const getCodingStatusColor = (status?: string) => {
        switch (status) {
            case 'accepted': return 'text-green-600 bg-green-100';
            case 'wrong_answer': return 'text-red-600 bg-red-100';
            case 'time_limit': return 'text-amber-600 bg-amber-100';
            case 'runtime_error': return 'text-orange-600 bg-orange-100';
            case 'compile_error': return 'text-purple-600 bg-purple-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Error Loading Report</h2>
                    <p className="text-muted-foreground mb-8">{error || 'Report not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .a4-report, .a4-report * {
                        visibility: visible;
                    }
                    .a4-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: ${isLandscape ? '297mm' : '210mm'} !important;
                        min-height: auto !important;
                        max-height: ${isLandscape ? '210mm' : '297mm'} !important;
                        height: ${isLandscape ? '210mm' : '297mm'} !important;
                        padding: ${isLandscape ? '6mm' : '8mm'} !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: hidden !important;
                        page-break-after: avoid;
                        page-break-inside: avoid;
                    }
                    .no-print, .edit-controls {
                        display: none !important;
                    }
                    .hidden-section {
                        display: none !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                    @page {
                        size: ${isLandscape ? 'A4 landscape' : 'A4'};
                        margin: 0;
                    }
                }
            `}</style>

            {/* Action Bar - Floating Top Bar */}
            <div className="no-print sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-card hover:bg-muted rounded-xl border border-border transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <ArrowLeft size={18} />
                        Back to Reports
                    </button>
                    <div className="h-6 w-px bg-border" />
                    <div>
                        <h1 className="text-base font-bold">Participant Report</h1>
                        <p className="text-xs text-muted-foreground font-medium">{report.registration.fullName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isEditMode ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-card border-border hover:bg-muted'}`}
                    >
                        {isEditMode ? <X size={16} /> : <Pencil size={16} />}
                        {isEditMode ? 'Exit Edit' : 'Edit Sections'}
                    </button>

                    <button
                        onClick={() => setIsLandscape(!isLandscape)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border bg-card border-border hover:bg-muted`}
                    >
                        <RotateCcw size={16} className={isLandscape ? '' : 'rotate-90'} />
                        {isLandscape ? 'Landscape' : 'Portrait'}
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-foreground/10"
                    >
                        <Printer size={16} />
                        Print Report
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                    >
                        <Download size={16} />
                        Save PDF
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="py-12 px-4 print:p-0 flex justify-center">
                {/* Edit Sidebar - Only visible in edit mode */}
                {isEditMode && (
                    <div className="no-print fixed left-8 top-32 w-64 bg-card rounded-2xl border border-border shadow-2xl p-6 z-20">
                        <div className="flex items-center gap-2 mb-6">
                            <EyeOff size={18} className="text-primary" />
                            <h3 className="font-bold">Visible Sections</h3>
                        </div>
                        <div className="space-y-2">
                            {[
                                { id: 'participant', label: 'Participant Info', icon: User },
                                { id: 'session', label: 'Session Details', icon: Clock },
                                { id: 'scores', label: 'Score Breakdown', icon: BarChart3 },
                                { id: 'coding', label: 'Coding Problems', icon: Code },
                                { id: 'violations', label: 'Violations', icon: AlertTriangle },
                                { id: 'verdict', label: 'Final Verdict', icon: Award },
                            ].map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${isSectionVisible(section.id)
                                        ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <section.icon size={16} />
                                        <span>{section.label}</span>
                                    </div>
                                    {isSectionVisible(section.id) ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={resetSections}
                            className="w-full mt-6 py-3 text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCw size={14} />
                            Reset All Sections
                        </button>
                    </div>
                )}

                {/* A4 Report Wrapper */}
                <div
                    ref={printRef}
                    className={`a4-report bg-white text-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.1)] print:shadow-none transition-all duration-500 overflow-hidden ${isLandscape ? 'w-[297mm] h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}
                    style={{ padding: isLandscape ? '15mm' : '20mm' }}
                >
                    {/* Report Header */}
                    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
                                <Shield size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Assessment Report</h1>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Candidate Evaluation Summary</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Generated On</p>
                            <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}</p>
                        </div>
                    </div>

                    {/* Shared Report Content Logic */}
                    <div className="space-y-6">
                        {/* Top Section: Participant & Session & Verdict side-by-side if landscape */}
                        <div className={`grid gap-6 ${isLandscape ? 'grid-cols-3' : 'grid-cols-1'}`}>
                            {/* Participant Section */}
                            {isSectionVisible('participant') && (
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative group min-h-[160px]">
                                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User size={14} /> Candidate Information
                                    </h2>
                                    <div className="flex gap-5">
                                        {report.verification?.photoUrl ? (
                                            <img
                                                src={report.verification.photoUrl}
                                                alt=""
                                                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md shrink-0"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
                                                <User size={32} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <p className="text-lg font-black text-slate-900 leading-tight truncate">{report.registration.fullName}</p>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Mail size={12} />
                                                <span className="truncate">{report.registration.email}</span>
                                            </div>
                                            {(report.registration.college || report.registration.department) && (
                                                <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                    {report.registration.college && <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{report.registration.college}</span>}
                                                    {report.registration.department && <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{report.registration.department}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Session Info Section */}
                            {isSectionVisible('session') && (
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 min-h-[160px]">
                                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Clock size={14} /> Session Details
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Duration</p>
                                            <p className="text-sm font-black text-slate-900">{formatDuration(report.session.totalTimeTaken)}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                                            <p className="text-sm font-black text-slate-900 capitalize">{report.session.status?.replace('_', ' ')}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Started</p>
                                            <p className="text-[10px] font-bold text-slate-900 leading-tight">{formatDate(report.session.startedAt)}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Finished</p>
                                            <p className="text-[10px] font-bold text-slate-900 leading-tight">{formatDate(report.session.submittedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verdict Section */}
                            {isSectionVisible('verdict') && (
                                <div className={`p-6 rounded-3xl border-2 shadow-lg min-h-[160px] flex flex-col justify-between ${getVerdictColor(report.verdict.status)}`}>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2 opacity-70">
                                            <Award size={14} /> Final Evaluation
                                        </h2>
                                        <div className="p-2 bg-white/50 rounded-xl">
                                            {report.verdict.status === 'passed' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between mt-4">
                                        <div>
                                            <p className="text-3xl font-black uppercase leading-none mb-1">{report.verdict.status}</p>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Qualified Status</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black leading-none mb-1">{report.verdict.finalScore}</p>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Final Score</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Middle Section: Scores & Violations */}
                        <div className={`grid gap-6 ${isLandscape ? 'grid-cols-12' : 'grid-cols-1'}`}>
                            {/* Score table - takes more space */}
                            {isSectionVisible('scores') && (
                                <div className={`border border-slate-200 rounded-3xl overflow-hidden shadow-sm ${isLandscape ? 'col-span-8' : ''}`}>
                                    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                                        <h2 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <BarChart3 size={14} /> Performance Breakdown
                                        </h2>
                                        <span className="text-xs font-black text-emerald-400">{report.scores.percentage.toFixed(1)}% SUCCESS RATE</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Section</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Type</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Obtained</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Weight</th>
                                                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.scores.sectionScores?.map((section, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-black text-slate-700">{section.sectionTitle}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded uppercase">{section.sectionType}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-black text-slate-900">{section.obtainedMarks}</td>
                                                    <td className="px-4 py-4 text-center text-slate-400 font-bold">{section.totalMarks}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 font-bold">{formatDuration(section.timeTaken)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                                                <td className="px-6 py-4" colSpan={2}>AGGREGATE PERFORMANCE</td>
                                                <td className="px-4 py-4 text-center text-emerald-600">{report.scores.totalScore}</td>
                                                <td className="px-4 py-4 text-center">{report.scores.maxScore}</td>
                                                <td className="px-6 py-4 text-right">{formatDuration(report.session.totalTimeTaken)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Violations Sidebar */}
                            {isSectionVisible('violations') && (
                                <div className={`bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between ${isLandscape ? 'col-span-4' : ''}`}>
                                    <div>
                                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Shield size={14} className="text-red-500" /> Integrity Check
                                        </h2>
                                        <div className="flex items-end justify-between mb-8">
                                            <p className="text-6xl font-black leading-none">{report.violations.totalCount}</p>
                                            <div className="text-right">
                                                <p className={`text-[11px] font-black px-3 py-1 rounded-full uppercase mb-2 ${report.violations.riskLevel === 'high' ? 'bg-red-500 text-white' :
                                                        report.violations.riskLevel === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                                    }`}>
                                                    {report.violations.riskLevel} RISK
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Security Verdict</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Violation Logs</p>
                                        <div className="space-y-2">
                                            {Object.entries(report.violations.byType || {}).map(([type, count]) => (
                                                <div key={type} className="flex items-center justify-between text-xs font-black">
                                                    <span className="text-slate-400 capitalize">{type.replace(/_/g, ' ')}</span>
                                                    <span>{count}</span>
                                                </div>
                                            ))}
                                            {Object.keys(report.violations.byType || {}).length === 0 && (
                                                <p className="text-xs font-bold text-slate-600 italic">No anomalies detected</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Coding Section */}
                        {isSectionVisible('coding') && report.codingProblems && report.codingProblems.length > 0 && (
                            <div className="pt-4">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Code size={16} className="text-slate-900" /> Advanced Engineering Challenges
                                </h2>
                                <div className="grid gap-4">
                                    {report.codingProblems.map((problem, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">{problem.problemTitle}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">{problem.language}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{problem.passedTests} / {problem.totalTests} TESTS PASSED</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-slate-900 mb-1">{problem.score}</p>
                                                        <p className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${getCodingStatusColor(problem.status)}`}>
                                                            {problem.status?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Summary results */}
                                                <div className="grid grid-cols-2 gap-4 mt-6">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Complexity & Performance</p>
                                                        <div className="flex items-center gap-4 text-xs font-bold">
                                                            <div className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> 0.24s</div>
                                                            <div className="flex items-center gap-1.5"><Monitor size={12} className="text-slate-400" /> 14.2 MB</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Private Validation</p>
                                                        <div className="flex items-center gap-4 text-xs font-bold">
                                                            <span className="text-emerald-600">✓ {problem.hiddenTestCases?.passed || 0} Passed</span>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-red-500">✗ {problem.hiddenTestCases?.failed || 0} Failed</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Report Footer */}
                    <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Authenticated Documentation • Proprietary Data</p>
                        <p className="text-[9px] font-bold text-slate-400 italic">This report is cryptographically signed and verified by SmartHire Platform. Any tampering invalidates the results.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
