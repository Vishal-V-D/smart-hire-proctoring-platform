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
    const [assessmentTitle, setAssessmentTitle] = useState('');
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
                    console.log('=== WHOLE REPORT TAB DATA BRO ===', response.data.participant);
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

        // If the date is already formatted (contains "at" or "AM/PM"), return it as-is
        if (dateStr.includes(' at ') || dateStr.includes('AM') || dateStr.includes('PM')) {
            return dateStr;
        }

        // Otherwise, try to parse and format it
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr; // Return original if invalid

            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr; // Return original on error
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins} minutes`;
    };

    const getVerdictColor = (status?: string) => {
        const s = status?.toLowerCase();
        switch (s) {
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error || 'Report not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
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

            {/* Floating Edit Button */}
            <div className="no-print fixed left-22 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`p-3 rounded-full shadow-lg transition-all ${isEditMode ? 'bg-blue-600 text-white scale-110' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    title={isEditMode ? 'Exit Edit Mode' : 'Edit Sections'}
                >
                    {isEditMode ? <X size={20} /> : <Pencil size={20} />}
                </button>
                {isEditMode && hiddenSections.size > 0 && (
                    <button
                        onClick={resetSections}
                        className="p-3 rounded-full shadow-lg bg-white text-gray-700 hover:bg-gray-100 transition-all"
                        title="Reset All Sections"
                    >
                        <RotateCw size={20} />
                    </button>
                )}
            </div>

            {/* Edit Mode Panel */}
            {isEditMode && (
                <div className="no-print fixed left-35 top-1/2 -translate-y-1/2 z-40 bg-white rounded-xl shadow-2xl p-4 w-56 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <EyeOff size={14} /> Toggle Sections
                    </h3>
                    <div className="space-y-2">
                        {[
                            { id: 'participant', label: 'Participant Info' },
                            { id: 'session', label: 'Session Details' },
                            { id: 'scores', label: 'Score Breakdown' },
                            { id: 'coding', label: 'Coding Problems' },
                            { id: 'violations', label: 'Violations' },
                            { id: 'verdict', label: 'Final Verdict' },
                        ].map(section => (
                            <button
                                key={section.id}
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSectionVisible(section.id)
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                <span>{section.label}</span>
                                {isSectionVisible(section.id) ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">Click to hide/show sections</p>
                </div>
            )}

            {/* Page Container */}
            <div className="min-h-screen bg-gray-200 py-8 print:bg-white print:py-0">
                {/* Action Bar - Hidden in print */}
                <div className={`no-print mx-auto mb-4 flex items-center justify-between px-4 ${isLandscape ? 'max-w-[297mm]' : 'max-w-[210mm]'}`}>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <ArrowLeft size={18} />
                        Back to Reports
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLandscape(!isLandscape)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-all ${isLandscape
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-white border border-border hover:shadow-md'
                                }`}
                        >
                            <RotateCcw size={18} className={isLandscape ? '' : 'rotate-90'} />
                            {isLandscape ? 'Landscape' : 'Portrait'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow hover:opacity-90"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg shadow hover:shadow-md"
                        >
                            <Download size={18} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* A4 Paper */}
                <div
                    ref={printRef}
                    className={`a4-report mx-auto bg-white shadow-2xl print:shadow-none transition-all duration-300 ${isLandscape ? 'max-w-[297mm]' : 'max-w-[210mm]'}`}
                    style={{ minHeight: isLandscape ? '210mm' : '297mm', padding: isLandscape ? '8mm' : '10mm' }}
                >
                    {/* Header */}
                    <div className={`border-b-2 border-gray-800 pb-3 mb-4 ${isLandscape ? 'flex items-center justify-between' : ''}`}>
                        <div className={isLandscape ? 'flex items-center gap-8' : ''}>
                            <div>
                                <h1 className={`font-bold text-gray-900 ${isLandscape ? 'text-xl' : 'text-2xl'}`}>Assessment Report</h1>
                                <p className="text-gray-600 text-xs">Candidate Performance Evaluation</p>
                            </div>
                            {isLandscape && (
                                <div className="flex items-center gap-6 text-xs">
                                    <div className="flex items-center gap-1">
                                        <User size={12} className="text-gray-400" />
                                        <span className="font-semibold">{report.registration.fullName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Mail size={12} className="text-gray-400" />
                                        <span>{report.registration.email}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Report Generated</p>
                            <p className="font-medium text-xs">{new Date().toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}</p>
                        </div>
                    </div>

                    {isLandscape ? (
                        /* ===== LANDSCAPE LAYOUT ===== */
                        <>
                            {/* Top Row: Participant Info + Session + Verdict side by side */}
                            <div className={`grid gap-3 mb-3 ${[isSectionVisible('participant'), isSectionVisible('session'), isSectionVisible('verdict')].filter(Boolean).length === 3
                                ? 'grid-cols-3'
                                : [isSectionVisible('participant'), isSectionVisible('session'), isSectionVisible('verdict')].filter(Boolean).length === 2
                                    ? 'grid-cols-2'
                                    : 'grid-cols-1'
                                }`}>
                                {/* Participant Info */}
                                {isSectionVisible('participant') ? (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                                        {isEditMode && (
                                            <button onClick={() => toggleSection('participant')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        )}
                                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <User size={12} /> Participant
                                        </h2>
                                        <div className="flex gap-3">
                                            {/* Profile Photo */}
                                            {report.verification?.photoUrl ? (
                                                <img
                                                    src={report.verification.photoUrl}
                                                    alt={report.registration.fullName}
                                                    className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 border-2 border-gray-300">
                                                    <User size={20} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div className="space-y-1 text-xs">
                                                {report.registration.college && (
                                                    <div className="flex items-center gap-1">
                                                        <Building size={10} className="text-gray-400" />
                                                        <span className="text-gray-500">College:</span>
                                                        <span className="font-medium truncate">{report.registration.college}</span>
                                                    </div>
                                                )}
                                                {report.registration.department && (
                                                    <div className="flex items-center gap-1">
                                                        <GraduationCap size={10} className="text-gray-400" />
                                                        <span className="text-gray-500">Dept:</span>
                                                        <span className="font-medium">{report.registration.department}</span>
                                                    </div>
                                                )}
                                                {report.registration.registrationNumber && (
                                                    <div className="flex items-center gap-1">
                                                        <FileText size={10} className="text-gray-400" />
                                                        <span className="text-gray-500">Reg No:</span>
                                                        <span className="font-medium">{report.registration.registrationNumber}</span>
                                                    </div>
                                                )}
                                                {report.registration.cgpa && (
                                                    <div className="flex items-center gap-1">
                                                        <Award size={10} className="text-gray-400" />
                                                        <span className="text-gray-500">CGPA:</span>
                                                        <span className="font-bold">{report.registration.cgpa}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Session Details */}
                                {isSectionVisible('session') ? (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                                        {isEditMode && (
                                            <button onClick={() => toggleSection('session')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        )}
                                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Clock size={12} /> Session
                                        </h2>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-blue-50 p-1.5 rounded text-center">
                                                <p className="text-blue-600 text-[10px]">Started</p>
                                                <p className="font-bold text-[10px]">{formatDate(report.session.startedAt)}</p>
                                            </div>
                                            <div className="bg-green-50 p-1.5 rounded text-center">
                                                <p className="text-green-600 text-[10px]">Submitted</p>
                                                <p className="font-bold text-[10px]">{formatDate(report.session.submittedAt)}</p>
                                            </div>
                                            <div className="bg-purple-50 p-1.5 rounded text-center">
                                                <p className="text-purple-600 text-[10px]">Duration</p>
                                                <p className="font-bold text-[10px]">{formatDuration(report.session.totalTimeTaken)}</p>
                                            </div>
                                            <div className="bg-gray-100 p-1.5 rounded text-center">
                                                <p className="text-gray-600 text-[10px]">Status</p>
                                                <p className="font-bold text-[10px] capitalize">{report.session.status?.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Verdict */}
                                {isSectionVisible('verdict') ? (
                                    <div className={`p-3 rounded-lg border-2 relative group ${getVerdictColor(report.verdict?.status || report.session?.status)}`}>
                                        {isEditMode && (
                                            <button onClick={() => toggleSection('verdict')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {report.verdict?.status === 'passed' ? (
                                                    <CheckCircle size={24} />
                                                ) : report.verdict?.status === 'failed' || report.verdict?.status === 'disqualified' ? (
                                                    <XCircle size={24} />
                                                ) : (
                                                    <AlertTriangle size={24} />
                                                )}
                                                <div>
                                                    <p className="text-lg font-black uppercase">{report.verdict?.status || report.session?.status || 'N/A'}</p>
                                                    <p className="text-[10px] opacity-75">Final Status</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black">{report.verdict?.finalScore || report.scores?.totalScore || 0}</p>
                                                <p className="text-[10px] opacity-75">Score / {report.scores?.maxScore || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Middle Row: Score Table + Violations side by side */}
                            {(isSectionVisible('scores') || isSectionVisible('violations')) ? (
                                <div className={`grid gap-3 mb-3 ${isSectionVisible('scores') && isSectionVisible('violations') ? 'grid-cols-3' : 'grid-cols-1'}`}>
                                    {/* Score Breakdown - Takes 2 columns */}
                                    {isSectionVisible('scores') ? (
                                        <div className={`relative group ${isSectionVisible('violations') ? 'col-span-2' : ''}`}>
                                            {isEditMode && (
                                                <button onClick={() => toggleSection('scores')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                                            )}
                                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <BarChart3 size={12} /> Score Breakdown
                                            </h2>
                                            <table className="w-full border border-gray-300 text-xs">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="text-left py-1 px-2 border-b border-gray-300 font-semibold">Section</th>
                                                        <th className="text-center py-1 px-2 border-b border-gray-300 font-semibold">Type</th>
                                                        <th className="text-center py-1 px-2 border-b border-gray-300 font-semibold">Scored</th>
                                                        <th className="text-center py-1 px-2 border-b border-gray-300 font-semibold">Max</th>
                                                        <th className="text-center py-1 px-2 border-b border-gray-300 font-semibold">%</th>
                                                        <th className="text-right py-1 px-2 border-b border-gray-300 font-semibold">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {report.scores.sectionScores?.map((section, idx) => (
                                                        <tr key={idx} className="border-b border-gray-200">
                                                            <td className="py-1 px-2 font-medium">{section.sectionTitle}</td>
                                                            <td className="py-1 px-2 text-center capitalize">{section.sectionType}</td>
                                                            <td className="py-1 px-2 text-center font-bold text-blue-600">
                                                                {section.obtainedMarks ?? 0}
                                                            </td>
                                                            <td className="py-1 px-2 text-center text-gray-600">
                                                                {section.totalMarks ?? 0}
                                                            </td>
                                                            <td className="py-1 px-2 text-center">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${Number(section.percentage) >= 60 ? 'bg-green-100 text-green-700' : Number(section.percentage) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {Number(section.percentage || 0).toFixed(0)}%
                                                                </span>
                                                            </td>
                                                            <td className="py-1 px-2 text-right font-mono text-gray-500">
                                                                {formatDuration(section.timeTaken)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-800 text-white font-bold">
                                                        <td className="py-1.5 px-2" colSpan={2}>TOTAL</td>
                                                        <td className="py-1.5 px-2 text-center text-green-400">
                                                            {report.scores.totalScore ?? 0}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center">
                                                            {report.scores.maxScore ?? 0}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-center">
                                                            {Number(report.scores.percentage || 0).toFixed(0)}%
                                                        </td>
                                                        <td className="py-1.5 px-2 text-right">
                                                            {formatDuration(report.session?.totalTimeTaken)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : null}

                                    {/* Violations */}
                                    {isSectionVisible('violations') ? (
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 relative group">
                                            {isEditMode && (
                                                <button onClick={() => toggleSection('violations')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                            )}
                                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <AlertTriangle size={12} /> Violations
                                            </h2>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-500">Total:</span>
                                                    <span className="text-lg font-black">{report.violations?.totalCount || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-500">Risk:</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${getRiskColor(report.violations?.riskLevel)}`}>
                                                        {report.violations?.riskLevel || 'Low'}
                                                    </span>
                                                </div>
                                                <div className="border-t pt-1">
                                                    <p className="text-[9px] text-gray-500 mb-0.5">By Type:</p>
                                                    <div className="text-[9px] space-y-0.5">
                                                        {Object.entries(report.violations?.byType || {}).slice(0, 3).map(([type, count]) => (
                                                            <div key={type} className="flex justify-between">
                                                                <span className="capitalize truncate">{type.replace(/_/g, ' ')}</span>
                                                                <span className="font-bold">{count}</span>
                                                            </div>
                                                        ))}
                                                        {Object.keys(report.violations?.byType || {}).length === 0 && (
                                                            <span className="text-gray-400">None</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {/* Bottom Row: Coding Problems (if any) */}
                            {isSectionVisible('coding') && report.codingProblems && report.codingProblems.length > 0 ? (
                                <div className="mb-3 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('coding')} className="edit-controls absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                                    )}
                                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Code size={12} /> Coding Problems
                                    </h2>
                                    <div className="grid grid-cols-2 gap-2">
                                        {report.codingProblems.map((problem, idx) => (
                                            <div key={idx} className="flex flex-col p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate uppercase">{problem.problemTitle}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono">Lang: {problem.language}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-2">
                                                        <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">
                                                            {problem.passedTests}/{problem.totalTests} Tests
                                                        </span>
                                                        <span className="font-bold text-blue-600">
                                                            {problem.score}/{problem.maxScore}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${getCodingStatusColor(problem.status)}`}>
                                                            {problem.status?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Hidden Test Cases Summary */}
                                                {problem.hiddenTestCases && (
                                                    <div className="flex gap-4 mt-2 px-2 py-1 bg-gray-100 rounded text-[10px]">
                                                        <span className="font-semibold text-gray-600">Private Test Cases:</span>
                                                        <span className="text-green-600 font-bold">{problem.hiddenTestCases.passed} Passed</span>
                                                        <span className="text-red-500 font-bold">{problem.hiddenTestCases.failed} Failed</span>
                                                    </div>
                                                )}

                                                {/* Test Cases Details */}
                                                {problem.testCases && problem.testCases.length > 0 && (
                                                    <div className="mt-3 border-t border-gray-200 pt-2">
                                                        <p className="text-[10px] font-bold text-gray-500 mb-1">Sample Test Cases</p>
                                                        <div className="space-y-1">
                                                            {problem.testCases.map((tc: any, i: number) => (
                                                                <div key={i} className={`flex items-start gap-2 p-1.5 rounded ${tc.passed ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                                                    <div className={`mt-0.5 w-2 h-2 rounded-full ${tc.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                    <div className="flex-1 grid grid-cols-2 gap-2 font-mono text-[9px]">
                                                                        <div>
                                                                            <span className="text-gray-400">Input:</span> <span className="text-gray-700">{tc.input}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400">Result:</span> <span className={tc.passed ? 'text-green-700' : 'text-red-700'}>{tc.actualOutput || 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                    {tc.passed ? <CheckCircle size={10} className="text-green-500" /> : <XCircle size={10} className="text-red-500" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Footer */}
                            <div className="pt-2 border-t border-gray-300 text-center text-[10px] text-gray-400">
                                <p>Computer-generated report ΓÇó {new Date().toLocaleString('en-IN')} ΓÇó Confidential</p>
                            </div>
                        </>
                    ) : (
                        /* ===== PORTRAIT LAYOUT (Original) ===== */
                        <>
                            {/* Participant Info Section */}
                            {isSectionVisible('participant') ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('participant')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User size={14} />
                                        Participant Information
                                    </h2>
                                    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        {/* Profile Photo */}
                                        {report.verification?.photoUrl ? (
                                            <img
                                                src={report.verification.photoUrl}
                                                alt={report.registration.fullName}
                                                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 border-2 border-gray-300">
                                                <User size={28} className="text-gray-400" />
                                            </div>
                                        )}
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span className="text-xs text-gray-500">Name:</span>
                                                <span className="font-semibold text-sm">{report.registration.fullName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="text-xs text-gray-500">Email:</span>
                                                <span className="font-medium text-sm">{report.registration.email}</span>
                                            </div>
                                            {report.registration.college && (
                                                <div className="flex items-center gap-2">
                                                    <Building size={14} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">College:</span>
                                                    <span className="font-medium text-sm">{report.registration.college}</span>
                                                </div>
                                            )}
                                            {report.registration.department && (
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={14} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">Department:</span>
                                                    <span className="font-medium text-sm">{report.registration.department}</span>
                                                </div>
                                            )}
                                            {report.registration.registrationNumber && (
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">Reg. No:</span>
                                                    <span className="font-medium text-sm">{report.registration.registrationNumber}</span>
                                                </div>
                                            )}
                                            {report.registration.cgpa && (
                                                <div className="flex items-center gap-2">
                                                    <Award size={14} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">CGPA:</span>
                                                    <span className="font-medium text-sm">{report.registration.cgpa}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Session Details */}
                            {isSectionVisible('session') ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('session')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Clock size={14} />
                                        Session Details
                                    </h2>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                            <p className="text-xs text-blue-600 mb-1">Started</p>
                                            <p className="font-bold text-sm">{formatDate(report.session.startedAt)}</p>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                                            <p className="text-xs text-green-600 mb-1">Submitted</p>
                                            <p className="font-bold text-sm">{formatDate(report.session.submittedAt)}</p>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-center">
                                            <p className="text-xs text-purple-600 mb-1">Duration</p>
                                            <p className="font-bold text-sm">{formatDuration(report.session.totalTimeTaken)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                                            <p className="text-xs text-gray-600 mb-1">Status</p>
                                            <p className="font-bold text-sm capitalize">{report.session.status?.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    {report.session.systemChecks && (
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Monitor size={12} /> Browser: {report.session.systemChecks.browser ? 'Γ£ô' : 'Γ£ù'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Camera size={12} /> Camera: {report.session.systemChecks.camera ? 'Γ£ô' : 'Γ£ù'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mic size={12} /> Mic: {report.session.systemChecks.mic ? 'Γ£ô' : 'Γ£ù'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Score Breakdown */}
                            {isSectionVisible('scores') ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('scores')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <BarChart3 size={14} />
                                        Score Breakdown
                                    </h2>
                                    <table className="w-full border border-gray-300 text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="text-left py-2 px-3 border-b border-gray-300 font-semibold">Section</th>
                                                <th className="text-center py-2 px-3 border-b border-gray-300 font-semibold">Type</th>
                                                <th className="text-center py-2 px-3 border-b border-gray-300 font-semibold">Scored</th>
                                                <th className="text-center py-2 px-3 border-b border-gray-300 font-semibold">Max Score</th>
                                                <th className="text-center py-2 px-3 border-b border-gray-300 font-semibold">Percentage</th>
                                                <th className="text-center py-2 px-3 border-b border-gray-300 font-semibold">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.scores.sectionScores?.map((section, idx) => (
                                                <tr key={idx} className="border-b border-gray-200">
                                                    <td className="py-2 px-3 font-medium">{section.sectionTitle}</td>
                                                    <td className="py-2 px-3 text-center capitalize">{section.sectionType}</td>
                                                    <td className="py-2 px-3 text-center font-bold text-blue-600">
                                                        {section.obtainedMarks ?? 0}
                                                    </td>
                                                    <td className="py-2 px-3 text-center text-gray-600">
                                                        {section.totalMarks ?? 0}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded ${Number(section.percentage) >= 60 ? 'bg-green-100 text-green-700' : Number(section.percentage) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                            {Number(section.percentage || 0).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center font-mono text-gray-600">
                                                        {formatDuration(section.timeTaken)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-800 text-white font-bold">
                                                <td className="py-3 px-3" colSpan={2}>TOTAL SCORE</td>
                                                <td className="py-3 px-3 text-center text-lg text-green-400">
                                                    {report.scores.totalScore ?? 0}
                                                </td>
                                                <td className="py-3 px-3 text-center text-lg">
                                                    {report.scores.maxScore ?? 0}
                                                </td>
                                                <td className="py-3 px-3 text-center text-lg">
                                                    {Number(report.scores.percentage || 0).toFixed(1)}%
                                                </td>
                                                <td className="py-3 px-3 text-center font-mono">
                                                    {formatDuration(report.session?.totalTimeTaken)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}

                            {/* Coding Problems */}
                            {isSectionVisible('coding') && report.codingProblems && report.codingProblems.length > 0 ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('coding')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Code size={14} />
                                        Coding Problems
                                    </h2>
                                    <div className="space-y-2">
                                        {report.codingProblems.map((problem, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                <div>
                                                    <p className="font-medium text-sm">{problem.problemTitle}</p>
                                                    <p className="text-xs text-gray-500">Language: {problem.language}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-gray-500">
                                                        Tests: {problem.passedTests}/{problem.totalTests}
                                                    </span>
                                                    <span className="font-bold text-sm">
                                                        {problem.score}/{problem.maxScore}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded capitalize ${getCodingStatusColor(problem.status)}`}>
                                                        {problem.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Violations Summary */}
                            {isSectionVisible('violations') ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('violations')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <AlertTriangle size={12} />
                                        Proctoring Violations
                                    </h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Total Violations</p>
                                            <p className="text-xl font-black">{report.violations?.totalCount || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Risk Level</p>
                                            <span className={`text-sm font-bold px-2 py-0.5 rounded uppercase ${getRiskColor(report.violations?.riskLevel)}`}>
                                                {report.violations?.riskLevel || 'Low'}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            <p className="text-[10px] text-gray-500 mb-0.5">By Type</p>
                                            <div className="text-[10px] space-y-0.5">
                                                {Object.entries(report.violations?.byType || {}).slice(0, 3).map(([type, count]) => (
                                                    <div key={type} className="flex justify-between">
                                                        <span className="capitalize truncate">{type.replace(/_/g, ' ')}</span>
                                                        <span className="font-bold">{count}</span>
                                                    </div>
                                                ))}
                                                {Object.keys(report.violations?.byType || {}).length === 0 && (
                                                    <span className="text-gray-400">No violations</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Verdict */}
                            {isSectionVisible('verdict') ? (
                                <div className="mb-4 relative group">
                                    {isEditMode && (
                                        <button onClick={() => toggleSection('verdict')} className="edit-controls absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={14} /></button>
                                    )}
                                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Shield size={12} />
                                        Final Verdict
                                    </h2>
                                    <div className={`p-3 rounded-lg border-2 ${getVerdictColor(report.verdict?.status || report.session?.status)}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {report.verdict?.status === 'passed' ? (
                                                    <CheckCircle size={24} />
                                                ) : report.verdict?.status === 'failed' || report.verdict?.status === 'disqualified' ? (
                                                    <XCircle size={24} />
                                                ) : (
                                                    <AlertTriangle size={24} />
                                                )}
                                                <div>
                                                    <p className="text-lg font-black uppercase">{report.verdict?.status || report.session?.status || 'N/A'}</p>
                                                    <p className="text-[10px] opacity-75">Final Status</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black">{report.verdict?.finalScore || report.scores?.totalScore || 0}</p>
                                                <p className="text-[10px] opacity-75">Final Score / {report.scores?.maxScore || 0}</p>
                                            </div>
                                        </div>
                                        {(report.verdict?.adjustedScore || report.verdict?.violationPenalty) && (
                                            <div className="flex items-center gap-4 pt-2 border-t border-current/20 text-xs mt-2">
                                                {report.verdict.adjustedScore ? (
                                                    <span>Adjusted: <strong>{report.verdict.adjustedScore}</strong></span>
                                                ) : null}
                                                {report.verdict.violationPenalty ? (
                                                    <span>Penalty: <strong>-{report.verdict.violationPenalty}</strong></span>
                                                ) : null}
                                            </div>
                                        )}
                                        {report.verdict?.notes && (
                                            <p className="mt-1 text-[10px] italic truncate">Notes: {report.verdict.notes}</p>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {/* Footer */}
                            <div className="pt-2 border-t border-gray-300 text-center text-[10px] text-gray-400">
                                <p>Computer-generated report ΓÇó {new Date().toLocaleString('en-IN')} ΓÇó Confidential</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
