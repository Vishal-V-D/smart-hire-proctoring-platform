import React, { useState, useEffect } from 'react';
import { AssessmentConfig } from '../types';
import {
    ArrowRight, Calendar, FileText, Shield, Video, Lock,
    Scan, Fingerprint, Info, Navigation, Copy, X,
    ChevronLeft, LayoutGrid, Clock, CheckCircle2, AlertCircle,
    Settings, Eye
} from 'lucide-react';
import plagiarismService, { PlagiarismConfig } from '@/api/plagiarismService';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AssessmentSetupProps {
    config: AssessmentConfig;
    setConfig: (config: AssessmentConfig) => void;
    onNext: () => void;
    isEditMode?: boolean;
    assessmentId?: string;
}

// --- High-Performance Sub-components ---

const SectionHeader = ({ title, icon: Icon, subtitle }: { title: string; icon: any; subtitle?: string }) => (
    <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
            <Icon size={18} className="text-assessment-text-main" />
            <h3 className="text-[14px] font-bold text-assessment-text-main uppercase tracking-tight">{title}</h3>
        </div>
        {subtitle && <p className="text-[12px] text-assessment-text-muted font-medium">{subtitle}</p>}
        <div className="h-px bg-assessment-border w-full mt-2" />
    </div>
);

const GroupCard = ({ title, icon: Icon, color, children, onToggleAll, isAllSelected }: any) => (
    <div className="bg-assessment-card rounded-xl border border-assessment-border/50 shadow-sm transition-all hover:shadow-md hover:border-assessment-border">
        <div className="flex items-center justify-between p-4 border-b border-assessment-border/50">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                    <Icon size={14} />
                </div>
                <h4 className="text-[12px] font-bold text-assessment-text-muted uppercase">{title}</h4>
            </div>
            {onToggleAll && (
                <button
                    onClick={onToggleAll}
                    className="text-[10px] font-bold text-assessment-text-muted hover:text-assessment-text-main border border-assessment-border px-2 py-1 rounded transition-colors"
                >
                    {isAllSelected ? <CheckCircle2 size={14} className="text-assessment-accent" /> : <CheckCircle2 size={14} />}
                </button>
            )}
        </div>
        <div className="p-3 space-y-0.5">{children}</div>
    </div>
);

const ToggleRow = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <div className="flex items-center justify-between py-2 px-2 rounded hover:bg-assessment-bg cursor-pointer group" onClick={onClick}>
        <span className={`text-[13px] transition-colors ${isActive ? 'text-assessment-text-main font-semibold' : 'text-assessment-text-muted'}`}>{label}</span>
        <div className={`w-8 h-4.5 rounded-full relative transition-all duration-200 ${isActive ? 'bg-assessment-accent' : 'bg-assessment-border'}`}>
            <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
        </div>
    </div>
);

const AssessmentSetup: React.FC<AssessmentSetupProps> = ({ config, setConfig, onNext, isEditMode, assessmentId }) => {
    const router = useRouter();
    const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Load plagiarism config if in edit mode and missing
    useEffect(() => {
        if (isEditMode && assessmentId && !config.plagiarism) {
            loadPlagiarismConfig(assessmentId);
        }
    }, [isEditMode, assessmentId, config.plagiarism]);

    const loadPlagiarismConfig = async (id: string) => {
        try {
            const loadedConfig = await plagiarismService.getPlagiarismConfig(id);
            setConfig({
                ...config,
                plagiarism: {
                    enabled: loadedConfig.enabled || false,
                    config: loadedConfig,
                }
            });
        } catch (error) {
            console.error('Failed to load plagiarism config:', error);
        }
    };

    const plagiarismEnabled = config.plagiarism?.enabled ?? false;
    const plagiarismConfig = config.plagiarism?.config ?? {
        strictness: 'Medium',
        similarityThreshold: 75,
        aiSensitivity: 'Medium',
        reportConfig: { includeSourceCode: true, includeMatches: true, includeAiAnalysis: true, includeVerdict: true },
    };

    const validateAll = () => {
        const newErrors: { [key: string]: string } = {};
        if (!config.title?.trim()) newErrors.title = 'Title required';
        if (!config.startDate) newErrors.startDate = 'Start date required';
        if (!config.endDate) newErrors.endDate = 'End date required';
        if (config.proctoring.enabled && Object.values(config.proctoring).filter(v => v === true).length === 0) {
            newErrors.proctoring = 'Enable at least one security feature';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateProctoring = (field: string, value: any) => {
        let newProctoring = { ...config.proctoring, [field]: value };

        // If enabling master switch, enable ALL individual settings
        if (field === 'enabled' && value === true) {
            newProctoring = {
                ...newProctoring,
                // Visual
                videoMonitoring: true,
                screenRecording: true,
                imageMonitoring: true,
                // AI
                faceDetection: true,
                personDetection: true,
                eyeTracking: true,
                noiseDetection: true,
                objectDetection: true,
                // Lockdown
                fullscreen: true,
                disableCopyPaste: true,
                blockRightClick: true,
                blockExternalMonitor: true,
                audioMonitoring: true,
                audioRecording: true,
                // Verification
                verifyIDCard: true,
                verifyFace: true
            };
        }

        setConfig({ ...config, proctoring: newProctoring });
    };

    const toggleProctoringGroup = (fields: string[]) => {
        const allEnabled = fields.every(field => (config.proctoring as any)[field] === true);
        const newProctoring = { ...config.proctoring };
        fields.forEach(f => { (newProctoring as any)[f] = !allEnabled; });
        setConfig({ ...config, proctoring: newProctoring });
    };

    const isGroupSelected = (fields: string[]) => fields.every(f => (config.proctoring as any)[f] === true);

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <div className="w-full bg-assessment-bg h-screen overflow-y-auto font-inter">
            {/* --- Floating Action Bar --- */}
            <div className="fixed bottom-6 right-8 z-[100] flex items-center gap-3 bg-slate-900/95 backdrop-blur-md p-2 pl-6 pr-2 rounded-full border border-slate-700/50 hover:bg-slate-900 transition-all shadow-2xl">
                <div className="h-8 w-px bg-slate-700/50 mx-2" />
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                >
                    Back
                </button>
                <button
                    onClick={() => validateAll() && onNext()}
                    className="bg-assessment-accent text-assessment-text-main px-7 py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,209,130,0.2)] flex items-center gap-2 active:scale-95"
                >
                    Setup Questions
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* --- Premium Header --- */}
            <header className="relative w-full overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none blur-3xl" />

                <div className="relative px-8 pt-4 pb-2 bg-assessment-bg border-b border-assessment-border/20 backdrop-blur-sm z-10">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                        <div className="flex-1">
                            <button onClick={() => router.back()} className="flex items-center gap-2 text-assessment-text-muted hover:text-assessment-text-main transition-all group px-4 py-2 rounded-xl hover:bg-muted/50 w-fit">
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Dashboard</span>
                            </button>
                        </div>

                        <div className="flex-1 text-center">
                            <div className="inline-flex flex-col items-center">
                                <h1 className="text-xl font-bold tracking-tight text-assessment-text-main flex items-center gap-3">
                                    <span className="h-4 w-1 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full" />
                                    Configure Assessment
                                </h1>
                                <p className="text-[9px] text-assessment-text-muted font-bold uppercase tracking-widest mt-1.5 opacity-60">Architecture & Security Configuration</p>
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end">

                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 md:px-10 pt-4 pb-20 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                    {/* --- Row 1 Left: Identity & Context --- */}
                    <div className="xl:col-span-6">
                        <section className="bg-assessment-card rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-assessment-border/30 h-full flex flex-col">
                            <SectionHeader
                                title="Identity & Context"
                                icon={FileText}
                                subtitle="Define the public presence of this hiring challenge."
                            />
                            <div className="space-y-6 mt-4 flex-1">
                                <div>
                                    <label className="text-[10px] font-bold text-assessment-text-muted uppercase block mb-2 px-1 tracking-[0.1em]">Assessment Title</label>
                                    <input
                                        type="text"
                                        value={config.title}
                                        onChange={(e) => {
                                            setConfig({ ...config, title: e.target.value });
                                            clearError('title');
                                        }}
                                        className={`w-full px-5 py-4 bg-assessment-bg border rounded-2xl text-[15px] font-semibold transition-all outline-none text-assessment-text-main ${errors.title ? 'border-red-500 bg-red-50/50' : 'border-assessment-border focus:bg-assessment-card focus:border-assessment-text-main focus:ring-4 focus:ring-primary/5'}`}
                                        placeholder="e.g. Lead Systems Architect Assessment"
                                    />
                                    {errors.title && <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1.5 animate-in slide-in-from-left-1"><AlertCircle size={12} />{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-assessment-text-muted uppercase block mb-2 px-1 tracking-[0.1em]">Candidate Instructions & Guidelines</label>
                                    <textarea
                                        rows={6}
                                        value={config.description}
                                        onChange={(e) => setConfig({ ...config, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-assessment-bg border border-assessment-border rounded-2xl text-[14px] leading-relaxed transition-all outline-none focus:bg-assessment-card focus:border-assessment-text-main focus:ring-4 focus:ring-primary/5 resize-none font-medium text-assessment-text-main"
                                        placeholder="Provide comprehensive instructions. Include details about the coding environment, time allocation per section, specific technical requirements, and any rules regarding external research or documentation usage. A detailed description helps candidates focus on the challenge."
                                    />
                                    <div className="flex items-center gap-2 mt-3 px-1">
                                        <Info size={12} className="text-assessment-text-muted opacity-50" />
                                        <p className="text-[10px] text-assessment-text-muted italic font-medium opacity-60">Shown before authentication.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className={`p-4 border rounded-2xl transition-all ${errors.startDate ? 'border-red-200 bg-red-50/30' : 'bg-assessment-bg border-assessment-border/50'}`}>
                                        <label className="text-[9px] font-bold text-assessment-text-muted uppercase block mb-2 tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Live Start Date</label>
                                        <input
                                            type="datetime-local"
                                            value={config.startDate}
                                            onChange={(e) => {
                                                setConfig({ ...config, startDate: e.target.value });
                                                clearError('startDate');
                                            }}
                                            className="w-full bg-transparent text-sm font-bold outline-none text-assessment-text-main"
                                        />
                                    </div>
                                    <div className={`p-4 border rounded-2xl transition-all ${errors.endDate ? 'border-red-200 bg-red-50/30' : 'bg-assessment-bg border-assessment-border/50'}`}>
                                        <label className="text-[9px] font-bold text-assessment-text-muted uppercase block mb-2 tracking-widest flex items-center gap-1.5"><Clock size={12} /> Expiry Date</label>
                                        <input
                                            type="datetime-local"
                                            value={config.endDate}
                                            onChange={(e) => {
                                                setConfig({ ...config, endDate: e.target.value });
                                                clearError('endDate');
                                            }}
                                            className="w-full bg-transparent text-sm font-bold outline-none text-assessment-text-main"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border border-assessment-border rounded-2xl bg-gradient-to-br from-assessment-card to-assessment-bg shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div>
                                            <label className="text-[12px] font-bold text-assessment-text-main uppercase tracking-widest block">Passing Criteria</label>
                                            <span className="text-[10px] text-assessment-text-muted font-bold uppercase tracking-tight">Min score to qualify</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-Inter text-assessment-text-main leading-none">{config.passPercentage}</span>
                                            <span className="text-sm font-bold text-assessment-text-muted">%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" step="1"
                                        value={config.passPercentage || 0}
                                        onChange={(e) => setConfig({ ...config, passPercentage: parseInt(e.target.value) })}
                                        className="w-full h-2.5 bg-purple-500/20 rounded-full appearance-none cursor-pointer accent-purple-600 transition-all hover:accent-purple-500"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* --- Row 1 Right: Security & Surveillance --- */}
                    <div className="xl:col-span-6">
                        <section className="bg-assessment-card rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-assessment-border/30 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <SectionHeader
                                    title="Security & Surveillance"
                                    icon={Shield}
                                    subtitle="Define automated proctoring protocols."
                                />
                                <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${config.proctoring.enabled ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-assessment-bg border-assessment-border'}`}>
                                    <span className={`text-[10px] font-Inter uppercase tracking-widest ${config.proctoring.enabled ? 'text-emerald-700' : 'text-assessment-text-muted opacity-40'}`}>
                                        PROCTORING {config.proctoring.enabled ? 'LIVE' : 'OFF'}
                                    </span>
                                    <div
                                        onClick={() => updateProctoring('enabled', !config.proctoring.enabled)}
                                        className={`w-11 h-6.5 rounded-full relative cursor-pointer transition-all ${config.proctoring.enabled ? 'bg-emerald-500' : 'bg-assessment-border'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-sm ${config.proctoring.enabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className={`space-y-6 flex-1 transition-all duration-500 ${!config.proctoring.enabled ? 'opacity-30 grayscale pointer-events-none blur-[1px]' : ''}`}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <GroupCard
                                        title="Visual & Environment" icon={Video} color="emerald"
                                        onToggleAll={() => toggleProctoringGroup(['videoMonitoring', 'screenRecording', 'audioMonitoring', 'audioRecording'])}
                                        isAllSelected={isGroupSelected(['videoMonitoring', 'screenRecording', 'audioMonitoring', 'audioRecording'])}
                                    >
                                        <ToggleRow label="Webcam Monitoring" isActive={config.proctoring.videoMonitoring} onClick={() => updateProctoring('videoMonitoring', !config.proctoring.videoMonitoring)} />
                                        <ToggleRow label="Screen Recording" isActive={config.proctoring.screenRecording} onClick={() => updateProctoring('screenRecording', !config.proctoring.screenRecording)} />
                                        <ToggleRow label="Audio Intelligence" isActive={config.proctoring.audioMonitoring} onClick={() => updateProctoring('audioMonitoring', !config.proctoring.audioMonitoring)} />
                                        <ToggleRow label="Environment Recording" isActive={config.proctoring.audioRecording} onClick={() => updateProctoring('audioRecording', !config.proctoring.audioRecording)} />
                                    </GroupCard>

                                    <GroupCard
                                        title="Lockdown Controls" icon={Lock} color="blue"
                                        onToggleAll={() => toggleProctoringGroup(['fullscreen', 'disableCopyPaste', 'blockRightClick', 'blockExternalMonitor'])}
                                        isAllSelected={isGroupSelected(['fullscreen', 'disableCopyPaste', 'blockRightClick', 'blockExternalMonitor'])}
                                    >
                                        <ToggleRow label="Force Fullscreen" isActive={config.proctoring.fullscreen} onClick={() => updateProctoring('fullscreen', !config.proctoring.fullscreen)} />
                                        <ToggleRow label="Restrict Copy/Paste" isActive={config.proctoring.disableCopyPaste} onClick={() => updateProctoring('disableCopyPaste', !config.proctoring.disableCopyPaste)} />
                                        <ToggleRow label="Disable Right Click" isActive={config.proctoring.blockRightClick} onClick={() => updateProctoring('blockRightClick', !config.proctoring.blockRightClick)} />
                                        <ToggleRow label="Detect Ext. Monitors" isActive={config.proctoring.blockExternalMonitor} onClick={() => updateProctoring('blockExternalMonitor', !config.proctoring.blockExternalMonitor)} />
                                    </GroupCard>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <GroupCard
                                        title="AI Detection" icon={Scan} color="purple"
                                        onToggleAll={() => toggleProctoringGroup(['faceDetection', 'objectDetection', 'noiseDetection', 'eyeTracking'])}
                                        isAllSelected={isGroupSelected(['faceDetection', 'objectDetection', 'noiseDetection', 'eyeTracking'])}
                                    >
                                        <ToggleRow label="AI Face Detection" isActive={config.proctoring.faceDetection} onClick={() => updateProctoring('faceDetection', !config.proctoring.faceDetection)} />
                                        <ToggleRow label="Object Detection" isActive={config.proctoring.objectDetection} onClick={() => updateProctoring('objectDetection', !config.proctoring.objectDetection)} />
                                        <ToggleRow label="Noise Detection" isActive={config.proctoring.noiseDetection} onClick={() => updateProctoring('noiseDetection', !config.proctoring.noiseDetection)} />
                                        <ToggleRow label="Gaze/Eye Tracking" isActive={config.proctoring.eyeTracking} onClick={() => updateProctoring('eyeTracking', !config.proctoring.eyeTracking)} />
                                    </GroupCard>

                                    <GroupCard
                                        title="Verification" icon={Fingerprint} color="orange"
                                        onToggleAll={() => toggleProctoringGroup(['verifyIDCard', 'verifyFace', 'imageMonitoring'])}
                                        isAllSelected={isGroupSelected(['verifyIDCard', 'verifyFace', 'imageMonitoring'])}
                                    >
                                        <ToggleRow label="Identity Verification" isActive={config.proctoring.verifyIDCard} onClick={() => updateProctoring('verifyIDCard', !config.proctoring.verifyIDCard)} />
                                        <ToggleRow label="AI Face Match" isActive={config.proctoring.verifyFace} onClick={() => updateProctoring('verifyFace', !config.proctoring.verifyFace)} />
                                        <ToggleRow label="Snapshots/Photo" isActive={config.proctoring.imageMonitoring} onClick={() => updateProctoring('imageMonitoring', !config.proctoring.imageMonitoring)} />
                                    </GroupCard>
                                </div>

                                <div className="bg-assessment-card border border-assessment-border/40 p-6 rounded-2xl flex items-center justify-between shadow-inner bg-assessment-bg/30 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-assessment-card rounded-xl text-assessment-text-muted border border-assessment-border/50">
                                            <LayoutGrid size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-assessment-text-main uppercase tracking-tight">Tab Switch Tolerance</span>
                                            <span className="text-[9px] font-bold text-assessment-text-muted opacity-60">Auto-submit threshold</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number" value={config.proctoring.tabSwitchLimit}
                                            onChange={(e) => updateProctoring('tabSwitchLimit', parseInt(e.target.value))}
                                            className="w-16 h-11 bg-assessment-card border border-assessment-border rounded-xl text-center text-sm font-Inter focus:border-assessment-text-main outline-none text-assessment-text-main shadow-sm"
                                        />
                                        <span className="text-[9px] font-bold text-assessment-text-muted uppercase tracking-widest opacity-50">Limit</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* --- Row 2 Left: Plagiarism Intelligence --- */}
                    <div className="xl:col-span-6">
                        <section className="bg-gradient-to-br from-[#7B5CFA] to-[#5C45FA] rounded-[1.5rem] p-10  shadow-purple-500/10 hover:shadow-purple-500/20 transition-all group relative overflow-hidden flex flex-col justify-center h-full min-h-[160px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full -ml-20 -mb-20 blur-[80px]" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl text-white flex items-center justify-center rounded-[1.5rem] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                                        <Copy size={32} className="group-hover:scale-110 transition-all duration-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] font-Inter text-white uppercase tracking-[0.25em]">Plagiarism Intelligence</h4>
                                        <p className="text-[12px] font-medium text-purple-100/70 italic mt-1.5 leading-relaxed max-w-[320px]">Real-time behavioral analysis and cross-reference code scanning.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPlagiarismModal(true)}
                                    className={`px-8 py-3.5 rounded-2xl font-bold text-[11px] uppercase transition-all tracking-[0.2em] shadow-2xl ${plagiarismEnabled ? 'bg-white text-purple-600 hover:scale-105 active:scale-95' : 'bg-purple-300/20 text-white border border-white/20 hover:bg-white/10'}`}
                                >
                                    {plagiarismEnabled ? 'Settings Active' : 'Configure Engine'}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* --- Row 2 Right: Navigation Control --- */}
                    <div className="xl:col-span-6">
                        <section className="bg-assessment-card rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-assessment-border/30 h-full flex flex-col justify-center">
                            <SectionHeader title="Candidate Flow" icon={Navigation} subtitle="Control movement logic." />
                            <div className="space-y-5 mt-4">
                                <ToggleRow
                                    label="Allow Previous Navigation"
                                    isActive={config.navigation.allowPreviousNavigation}
                                    onClick={() => setConfig({ ...config, navigation: { ...config.navigation, allowPreviousNavigation: !config.navigation.allowPreviousNavigation } })}
                                />
                                <div className="flex gap-3 px-2 border-l-2 border-primary/20">
                                    <p className="text-[10px] text-assessment-text-muted leading-relaxed font-medium opacity-70">
                                        Disabling this forces a strictly sequential experience. Candidates will not be able to revisit or amend answers once they move forward.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* --- Advanced Plagiarism Modal --- */}
            <AnimatePresence>
                {showPlagiarismModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="bg-assessment-card border border-assessment-border rounded-[2rem] w-full max-w-xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]">
                            <div className="px-10 py-8 bg-assessment-text-main text-assessment-card flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-assessment-card/15 rounded-2xl border border-white/10">
                                        <Settings className="animate-spin-slow text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-Inter uppercase tracking-[0.2em] leading-none">Security Core</h2>
                                        <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">Plagiarism Detection Subsystem</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPlagiarismModal(false)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
                                    <X size={22} className="text-white" />
                                </button>
                            </div>

                            <div className="p-10 space-y-10">
                                <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 ${plagiarismEnabled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-assessment-bg border-assessment-border'}`}>
                                    <div className="flex flex-col">
                                        <span className={`text-[12px] font-Inter uppercase tracking-widest ${plagiarismEnabled ? 'text-emerald-700' : 'text-assessment-text-main'}`}>
                                            Engine Status: {plagiarismEnabled ? 'Engaged' : 'Standby'}
                                        </span>
                                        <span className="text-[10px] font-bold text-assessment-text-muted mt-1 opacity-70">Cross-reference submissions for patterns & AI assistance</span>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, plagiarism: { ...config.plagiarism!, enabled: !plagiarismEnabled } })}
                                        className={`w-15 h-8 rounded-full relative transition-all duration-300 shadow-inner ${plagiarismEnabled ? 'bg-emerald-500' : 'bg-assessment-border'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${plagiarismEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className={`space-y-10 transition-all duration-700 ${!plagiarismEnabled ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                                    <div>
                                        <div className="flex justify-between mb-5">
                                            <div className="flex flex-col">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-assessment-text-main">Similarity Threshold</label>
                                                <span className="text-[10px] font-bold text-assessment-text-muted opacity-60">Minimum match percentage to flag for manual review</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-Inter text-assessment-text-main">{plagiarismConfig.similarityThreshold}</span>
                                                <span className="text-sm font-bold text-assessment-text-muted">%</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range" className="w-full h-2.5 bg-purple-500/20 rounded-full appearance-none accent-purple-600 transition-all"
                                            value={plagiarismConfig.similarityThreshold}
                                            onChange={(e) => setConfig({ ...config, plagiarism: { ...config.plagiarism!, config: { ...plagiarismConfig, similarityThreshold: parseInt(e.target.value) } } })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="text-[10px] font-Inter uppercase tracking-widest text-assessment-text-muted mb-3 block px-1">Behavioral Strictness</label>
                                            <select className="w-full bg-assessment-bg border border-assessment-border rounded-[1rem] p-4 text-sm font-Inter outline-none focus:border-assessment-text-main transition-all cursor-pointer shadow-sm hover:bg-assessment-card">
                                                <option>Low</option><option selected>Standard</option><option>Aggressive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-Inter uppercase tracking-widest text-assessment-text-muted mb-3 block px-1">AI Intelligence Level</label>
                                            <select className="w-full bg-assessment-bg border border-assessment-border rounded-[1rem] p-4 text-sm font-Inter outline-none focus:border-assessment-text-main transition-all cursor-pointer shadow-sm hover:bg-assessment-card">
                                                <option>Detection Only</option><option selected>Deep Scan</option><option>Neural Analysis</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-10 py-8 bg-assessment-bg border-t border-assessment-border flex justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                                <button onClick={() => setShowPlagiarismModal(false)} className="px-6 py-3 text-[10px] font-Inter uppercase tracking-widest text-assessment-text-muted hover:text-assessment-text-main transition-colors">Discard</button>
                                <button onClick={() => setShowPlagiarismModal(false)} className="bg-assessment-text-main text-assessment-card px-10 py-4 rounded-2xl text-[11px] font-Inter uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all">Apply Architecture</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssessmentSetup;
