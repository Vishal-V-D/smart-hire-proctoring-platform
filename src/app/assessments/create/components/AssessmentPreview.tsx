'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, Layers, Shield, Check, FileText, CheckCircle, Clock, X, Edit3 } from 'lucide-react';

import { AssessmentConfig, AssessmentSection } from '../types';

interface AssessmentPreviewProps {
    config: AssessmentConfig;
    sections: AssessmentSection[];
    isEditMode: boolean;
    onBack: () => void;
    onSaveDraft?: () => void;
    onPublish: () => void;
    onUpdateSection?: (sectionId: string, updates: Partial<AssessmentSection>) => void;
    onDeleteSection?: (sectionId: string) => void;
}

export default function AssessmentPreview({
    config,
    sections,
    isEditMode,
    onBack,
    onSaveDraft,
    onPublish,
    onUpdateSection,
    onDeleteSection
}: AssessmentPreviewProps) {
    // Calculate totals
    const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    const totalMarks = sections.reduce((acc, s) => acc + (s.questions?.length || 0) * s.marksPerQuestion, 0);
    const totalTime = sections.reduce((acc, s) => acc + s.timeLimit, 0);

    // Helper function for color classes
    const getColorClasses = (color: string) => {
        const colorMap: Record<string, { badge: string; text: string }> = {
            red: { badge: 'bg-red-500/10 text-red-600', text: 'text-red-500' },
            orange: { badge: 'bg-orange-500/10 text-orange-600', text: 'text-orange-500' },
            yellow: { badge: 'bg-yellow-500/10 text-yellow-600', text: 'text-yellow-500' },
            green: { badge: 'bg-emerald-500/10 text-emerald-600', text: 'text-emerald-500' },
            blue: { badge: 'bg-blue-500/10 text-blue-600', text: 'text-blue-500' },
            purple: { badge: 'bg-purple-500/10 text-purple-600', text: 'text-purple-500' },
            pink: { badge: 'bg-pink-500/10 text-pink-600', text: 'text-pink-500' },
            gray: { badge: 'bg-gray-500/10 text-gray-600', text: 'text-gray-500' },
        };
        return colorMap[color] || colorMap.gray;
    };

    const calculateSectionMarks = (section: AssessmentSection) => {
        return (section.questions?.length || 0) * section.marksPerQuestion;
    };

    // State to track which section is being edited
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col w-full h-full overflow-hidden">
            {/* --- Hero Section with Glassmorphism --- */}
            <div className="shrink-0 relative z-10">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-background border-b border-primary/10 blur-xl opacity-50 -z-10" />
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] -z-10" />

                <div className="px-8 py-12 border-b border-border/40 bg-card/10 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Title & Description */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="h-8 w-1 bg-primary rounded-full" />
                                <h1 className="text-4xl font-black text-foreground tracking-tight">{config.title || "Untitled Assessment"}</h1>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-sm text-muted-foreground/80 font-medium max-w-2xl leading-relaxed"
                            >
                                {config.description || "No description provided."}
                            </motion.p>
                        </div>

                        {/* 3D Stats Cards */}
                        <div className="flex items-center gap-4 shrink-0">
                            {[
                                { label: 'Questions', value: totalQuestions, icon: FileText, color: 'text-foreground', bg: 'bg-background/50' },
                                { label: 'Total Marks', value: totalMarks, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
                                { label: 'Duration', value: `${totalTime}m`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Sections', value: sections.length, icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    className={`relative group overflow-hidden rounded-2xl border border-border/50 ${stat.bg} p-4 w-32 backdrop-blur-sm hover:-translate-y-1 transition-all duration-300`}
                                >
                                    <div className="flex flex-col items-center justify-center text-center gap-1.5">
                                        <stat.icon size={20} className={`${stat.color} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform`} />
                                        <div className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                                    </div>
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="flex-1 overflow-hidden p-8 pb-32">
                <div className="h-full grid grid-cols-12 gap-8">
                    {/* LEFT: Structure Table (8 cols) - Taller */}
                    <div className="col-span-8 flex flex-col bg-card border border-border rounded-xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {/* Table Header */}
                        <div className="px-6 py-4 border-b border-border bg-muted flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Layers size={18} className="text-purple-600" />
                                <h3 className="text-xs font-bold text-foreground">Structure Breakdown</h3>
                            </div>
                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-background border border-border text-muted-foreground">
                                {sections.length} Sections
                            </span>
                        </div>

                        {/* Clean Table */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-muted border-b border-border sticky top-0">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">#</th>
                                        <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Section</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Type</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Questions</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Duration</th>
                                        <th className="text-center py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Marks/Q</th>
                                        <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Total</th>
                                        <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sections.map((s, idx) => {
                                        const colors = getColorClasses(s.themeColor || 'gray');
                                        return (
                                            <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-2 px-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${colors.badge}`}>
                                                        {idx + 1}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <div className="font-semibold text-xs text-foreground">{s.title}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.difficulty}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-block px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium">
                                                        {s.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-sm font-medium text-foreground">{s.questions?.length || 0}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {editingSectionId === s.id && onUpdateSection ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={s.timeLimit}
                                                            onChange={(e) => onUpdateSection(s.id, { timeLimit: parseInt(e.target.value) || 1 })}
                                                            className="w-16 bg-background border border-primary rounded px-2 py-1 text-sm font-medium text-center focus:border-primary outline-none"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-foreground">{s.timeLimit}m</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {editingSectionId === s.id && onUpdateSection ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={s.marksPerQuestion}
                                                            onChange={(e) => onUpdateSection(s.id, { marksPerQuestion: parseInt(e.target.value) || 1 })}
                                                            className="w-16 bg-background border border-primary rounded px-2 py-1 text-sm font-medium text-center focus:border-primary outline-none"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-foreground">{s.marksPerQuestion}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`text-sm font-bold ${colors.text}`}>{calculateSectionMarks(s)}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {onUpdateSection && (
                                                            <button
                                                                onClick={() => setEditingSectionId(editingSectionId === s.id ? null : s.id)}
                                                                className={`p-1.5 rounded-lg transition-colors ${editingSectionId === s.id
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
                                                                    }`}
                                                                title={editingSectionId === s.id ? "Done editing" : "Edit section"}
                                                            >
                                                                {editingSectionId === s.id ? <Check size={16} /> : <Edit3 size={16} />}
                                                            </button>
                                                        )}
                                                        {onDeleteSection && (
                                                            <button
                                                                onClick={() => onDeleteSection(s.id)}
                                                                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                                title="Delete section"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-muted border-t border-border sticky bottom-0">
                                    <tr>
                                        <td colSpan={3} className="py-3 px-4">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">Totals</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-sm font-bold text-foreground">{totalQuestions}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-sm font-bold text-foreground">{totalTime}m</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">-</td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-sm font-bold text-primary">{totalMarks}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: Security Settings (4 cols) - Shorter */}
                    <div className="col-span-4 flex flex-col bg-card border border-border rounded-xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield size={18} className="text-emerald-600" />
                                <h3 className="text-sm font-bold text-foreground">Security Configuration</h3>
                            </div>
                            {config.proctoring.enabled ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold uppercase">Enabled</span>
                                </div>
                            ) : (
                                <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border">Disabled</div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Complete Feature List - 2 Columns */}
                            <div className="grid grid-cols-2 gap-x-4">
                                {/* Column 1 */}
                                <table className="w-full">
                                    <tbody className="divide-y divide-border">
                                        {[
                                            { label: 'Video Monitoring', value: config.proctoring.videoMonitoring },
                                            { label: 'Screen Recording', value: config.proctoring.screenRecording },
                                            { label: 'Audio Monitoring', value: config.proctoring.audioMonitoring },
                                            { label: 'Audio Recording', value: config.proctoring.audioRecording },
                                            { label: 'Image Monitoring', value: config.proctoring.imageMonitoring },
                                            { label: 'Face Detection', value: config.proctoring.faceDetection },
                                            { label: 'Person Detection', value: config.proctoring.personDetection },
                                            { label: 'Eye Tracking', value: config.proctoring.eyeTracking },
                                            { label: 'Object Detection', value: config.proctoring.objectDetection },
                                        ].map((item, idx) => (
                                            <tr key={idx} className={`${item.value ? 'bg-emerald-500/5' : ''} hover:bg-muted/20 transition-colors`}>
                                                <td className="py-2.5 px-4">
                                                    <span className={`text-xs font-medium ${item.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {item.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right w-12">
                                                    {item.value ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ml-auto">
                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ml-auto">
                                                            <X size={12} className="text-muted-foreground" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Column 2 */}
                                <table className="w-full">
                                    <tbody className="divide-y divide-border">
                                        {[
                                            { label: 'Noise Detection', value: config.proctoring.noiseDetection },
                                            { label: 'Force Fullscreen', value: config.proctoring.fullscreen },
                                            { label: 'Disable Copy/Paste', value: config.proctoring.disableCopyPaste },
                                            { label: 'Block Right Click', value: config.proctoring.blockRightClick },
                                            { label: 'Block Ext. Monitor', value: config.proctoring.blockExternalMonitor },
                                            { label: 'Tab Switch Limit', value: config.proctoring.tabSwitchLimit > 0, extra: config.proctoring.tabSwitchLimit > 0 ? `${config.proctoring.tabSwitchLimit} allowed` : null },
                                            { label: 'ID Card Verification', value: config.proctoring.verifyIDCard },
                                            { label: 'Face Verification', value: config.proctoring.verifyFace },
                                        ].map((item, idx) => (
                                            <tr key={idx} className={`${item.value ? 'bg-emerald-500/5' : ''} hover:bg-muted/20 transition-colors`}>
                                                <td className="py-2.5 px-4">
                                                    <span className={`text-xs font-medium ${item.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {item.label}
                                                    </span>
                                                    {item.extra && (
                                                        <span className="text-xs text-muted-foreground ml-2">({item.extra})</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-right w-12">
                                                    {item.value ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ml-auto">
                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ml-auto">
                                                            <X size={12} className="text-muted-foreground" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Floating Actions (Keep As Is) --- */}
            <div className="absolute bottom-6 right-6 z-30">
                <div className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-2 flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-xs px-5 py-2.5 rounded-lg transition-all"
                    >
                        Back to Editor
                    </button>
                    {onSaveDraft && (
                        <button
                            onClick={onSaveDraft}
                            className="text-primary hover:bg-primary/10 font-medium text-xs px-5 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <Save size={14} /> Save Draft
                        </button>
                    )}
                    <button
                        onClick={onPublish}
                        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25"
                    >
                        {isEditMode ? 'Update' : 'Publish'} <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
