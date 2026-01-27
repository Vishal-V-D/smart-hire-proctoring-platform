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
        <div className="fixed inset-0 z-[200] bg-background flex flex-col w-full h-full overflow-hidden font-inter">
            {/* --- Premium Header --- */}
            <div className="shrink-0 relative overflow-hidden">
                {/* Mesh Gradient Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary)_0%,transparent_30%),radial-gradient(circle_at_70%_60%,var(--color-primary)_0%,transparent_30%)] opacity-[0.03] pointer-events-none" />

                <div className="px-10 py-5 border-b border-border/40 bg-card/40 backdrop-blur-xl relative z-10">
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                        {/* Title & Description */}
                        <div className="flex-1 min-w-0">
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4 mb-1.5"
                            >
                                <div className="h-7 w-1.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full shadow-[0_0_15px_rgba(123,92,250,0.4)]" />
                                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                                    {config.title || "Untitled Assessment"}
                                    <span className="text-[9px] font-Inter bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">Live Preview</span>
                                </h1>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-xs text-muted-foreground/80 font-medium max-w-3xl leading-relaxed"
                            >
                                {config.description || "No description provided."}
                            </motion.p>
                        </div>

                        {/* High-End Stats Bar */}
                        <div className="flex items-center bg-background/40 border border-border/50 rounded-2xl p-1 shadow-inner backdrop-blur-md">
                            {[
                                { label: 'Questions', value: totalQuestions, icon: FileText, color: 'text-foreground' },
                                { label: 'Total Marks', value: totalMarks, icon: CheckCircle, color: 'text-primary' },
                                { label: 'Duration', value: `${totalTime}m`, icon: Clock, color: 'text-foreground' },
                                { label: 'Sections', value: sections.length, icon: Layers, color: 'text-foreground' },
                            ].map((stat, idx) => (
                                <React.Fragment key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (idx * 0.05) }}
                                        className="px-6 py-2 flex flex-col items-center justify-center transition-all hover:bg-white/5 rounded-xl group cursor-default"
                                    >
                                        <div className={`text-xl font-bold ${stat.color} tracking-tighter transition-transform group-hover:scale-110`}>{stat.value}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/90">{stat.label}</div>
                                    </motion.div>
                                    {idx < 3 && <div className="h-8 w-px bg-border/40 my-auto" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="h-full grid grid-cols-12 gap-6">
                    {/* LEFT: Structure Table */}
                    <div className="col-span-8 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        {/* Table Header */}
                        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-primary/70" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Assessment Structure</h3>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground">
                                {sections.length} SECTIONS
                            </span>
                        </div>

                        {/* Lean Table */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 w-12">#</th>
                                        <th className="text-left py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Section</th>
                                        <th className="text-center py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Type</th>
                                        <th className="text-center py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Qns</th>
                                        <th className="text-center py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Time</th>
                                        <th className="text-center py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Marks</th>
                                        <th className="text-center py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-red-500/60">Neg</th>
                                        <th className="text-right py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Total</th>
                                        <th className="text-right py-2 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {sections.map((s, idx) => {
                                        const colors = getColorClasses(s.themeColor || 'gray');
                                        return (
                                            <tr key={s.id} className="hover:bg-muted/10 transition-colors group">
                                                <td className="py-2.5 px-4">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${colors.badge}`}>
                                                        {String(idx + 1).padStart(2, '0')}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 font-inter">
                                                    <div className="font-bold text-xs text-foreground">{s.title}</div>
                                                    <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{s.difficulty} Level</div>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[9px] font-bold uppercase tracking-tighter">
                                                        {s.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-inter">
                                                    <span className="text-xs font-bold text-foreground">{s.questions?.length || 0}</span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-inter">
                                                    {editingSectionId === s.id && onUpdateSection ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={s.timeLimit}
                                                            onChange={(e) => onUpdateSection(s.id, { timeLimit: parseInt(e.target.value) || 1 })}
                                                            className="w-12 bg-background border border-primary rounded px-1.5 py-0.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-primary/30"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-foreground">{s.timeLimit}m</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-inter">
                                                    {editingSectionId === s.id && onUpdateSection ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={s.marksPerQuestion}
                                                            onChange={(e) => onUpdateSection(s.id, { marksPerQuestion: parseInt(e.target.value) || 1 })}
                                                            className="w-12 bg-background border border-primary rounded px-1.5 py-0.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-primary/30"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-foreground">{s.marksPerQuestion}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-inter">
                                                    {editingSectionId === s.id && onUpdateSection ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.25"
                                                            value={s.negativeMarking || 0}
                                                            onChange={(e) => onUpdateSection(s.id, { negativeMarking: parseFloat(e.target.value) || 0 })}
                                                            className="w-12 bg-background border border-red-500/20 rounded px-1.5 py-0.5 text-xs font-bold text-center outline-none focus:border-red-500/50 text-red-600"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-red-500/70">{s.negativeMarking || 0}</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-inter">
                                                    <span className={`text-xs font-bold ${colors.text}`}>{calculateSectionMarks(s)}</span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {onUpdateSection && (
                                                            <button
                                                                onClick={() => setEditingSectionId(editingSectionId === s.id ? null : s.id)}
                                                                className={`p-1 rounded bg-muted/30 transition-colors ${editingSectionId === s.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                                                            >
                                                                {editingSectionId === s.id ? <Check size={14} /> : <Edit3 size={14} />}
                                                            </button>
                                                        )}
                                                        {onDeleteSection && (
                                                            <button
                                                                onClick={() => onDeleteSection(s.id)}
                                                                className="p-1 rounded bg-muted/30 text-muted-foreground hover:text-red-500 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-muted/30 border-t border-border sticky bottom-0 z-10">
                                    <tr className="divide-x divide-border/20">
                                        <td colSpan={3} className="py-2 px-4 uppercase text-[9px] font-bold text-muted-foreground/70">Final Metrics</td>
                                        <td className="py-2 px-4 text-center text-xs font-bold text-foreground">{totalQuestions}</td>
                                        <td className="py-2 px-4 text-center text-xs font-bold text-foreground">{totalTime}m</td>
                                        <td className="py-2 px-4 text-center">-</td>
                                        <td className="py-2 px-4 text-center">-</td>
                                        <td className="py-2 px-4 text-right text-xs font-bold text-primary">{totalMarks}</td>
                                        <td className="py-2 px-4"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: Security Panel */}
                    <div className="col-span-4 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-primary/70" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Security Profile</h3>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${config.proctoring.enabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                                {config.proctoring.enabled ? 'PROCTORING ON' : 'PROCTORING OFF'}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 gap-1">
                                {[
                                    { label: 'Webcam Monitoring', value: config.proctoring.videoMonitoring },
                                    { label: 'Screen Recording', value: config.proctoring.screenRecording },
                                    { label: 'Audio Intelligence', value: config.proctoring.audioMonitoring },
                                    { label: 'Environment Recording', value: config.proctoring.audioRecording },
                                    { label: 'Snapshots/Photo', value: config.proctoring.imageMonitoring },
                                    { label: 'Identity Verification', value: config.proctoring.verifyIDCard },
                                    { label: 'AI Face Match', value: config.proctoring.verifyFace },
                                    { label: 'AI Face Detection', value: config.proctoring.faceDetection },
                                    { label: 'Object Detection', value: config.proctoring.objectDetection },
                                    { label: 'Gaze/Eye Tracking', value: config.proctoring.eyeTracking },
                                    { label: 'Noise Detection', value: config.proctoring.noiseDetection },
                                    { divider: true },
                                    { label: 'Force Fullscreen', value: config.proctoring.fullscreen },
                                    { label: 'Restrict Copy/Paste', value: config.proctoring.disableCopyPaste },
                                    { label: 'Disable Right Click', value: config.proctoring.blockRightClick },
                                    { label: 'Detect Ext. Monitors', value: config.proctoring.blockExternalMonitor },
                                    { label: 'Tab Switch Tolerance', value: config.proctoring.tabSwitchLimit > 0, extra: config.proctoring.tabSwitchLimit > 0 ? `${config.proctoring.tabSwitchLimit}x` : null },
                                ].map((item, idx) => (
                                    item.divider ? (
                                        <div key={idx} className="h-px bg-border/50 my-1" />
                                    ) : (
                                        <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${item.value ? 'bg-muted/20' : 'opacity-60'}`}>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-foreground/90">{item.label}</span>
                                                {item.extra && <span className="text-[9px] text-primary/70 font-bold uppercase tracking-tighter">{item.extra}</span>}
                                            </div>
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.value ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {item.value ? <CheckCircle size={14} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Floating Action Bar --- */}
            <div className="shrink-0 px-8 py-4 bg-background border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Preview Mode</span>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground italic">Review carefully before publishing.</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="px-5 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase tracking-wider"
                    >
                        Back to Editor
                    </button>
                    {onSaveDraft && (
                        <button
                            onClick={onSaveDraft}
                            className="px-5 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/5 border border-primary/20 transition-all uppercase tracking-wider"
                        >
                            Save Draft
                        </button>
                    )}
                    <button
                        onClick={onPublish}
                        className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        {isEditMode ? 'Update' : 'Publish'} <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
