import React, { useState, useEffect } from 'react';
import { AssessmentConfig } from '../types';
import { ArrowRight, Calendar, FileText, Shield, Video, Lock, Scan, Fingerprint, Info, Navigation, Copy, RotateCcw, X, ChevronLeft, ChevronRight, Layers, Clock } from 'lucide-react';
import plagiarismService, { PlagiarismConfig } from '@/api/plagiarismService';
import { motion, AnimatePresence } from 'framer-motion';

interface AssessmentSetupProps {
    config: AssessmentConfig;
    setConfig: (config: AssessmentConfig) => void;
    onNext: () => void;
    isEditMode?: boolean;
    assessmentId?: string;
}

const GroupCard = ({ title, icon: Icon, color, children, onToggleAll, isAllSelected }: { title: string; icon: any; color: string; children: React.ReactNode; onToggleAll?: () => void; isAllSelected?: boolean }) => (
    <div className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${color === 'emerald' ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/30' : color === 'blue' ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/30' : color === 'purple' ? 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:border-purple-500/30' : 'border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/30'}`}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : color === 'blue' ? 'bg-blue-500/10 text-blue-600' : color === 'purple' ? 'bg-purple-500/10 text-purple-600' : 'bg-orange-500/10 text-orange-600'}`}>
                    <Icon size={14} />
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${color === 'emerald' ? 'text-emerald-700' : color === 'blue' ? 'text-blue-700' : color === 'purple' ? 'text-purple-700' : 'text-orange-700'}`}>
                    {title}
                </h4>
            </div>
            {onToggleAll && (
                <button
                    onClick={onToggleAll}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${isAllSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'}`}
                >
                    {isAllSelected ? 'Unselect All' : 'Select All'}
                </button>
            )}
        </div>
        <div className="space-y-2">{children}</div>
    </div>
);

const ToggleRow = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <div className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg cursor-pointer group hover:bg-background/50 transition-colors" onClick={onClick}>
        <span className={`text-sm font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{label}</span>
        <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${isActive ? 'bg-primary shadow-sm' : 'bg-muted border border-border group-hover:border-primary/30'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </div>
);

const ReportToggle = ({ label, isActive, onChange }: { label: string; isActive: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={onChange}>
        <span className={`text-xs font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
        <div className={`w-8 h-4.5 rounded-full relative transition-all duration-200 ${isActive ? 'bg-primary' : 'bg-muted border border-border'}`}>
            <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`} />
        </div>
    </div>
);

const AssessmentSetup: React.FC<AssessmentSetupProps> = ({ config, setConfig, onNext, isEditMode, assessmentId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 3;

    // Load saved step state
    useEffect(() => {
        const savedStep = localStorage.getItem(`assessmentSetupStep_${assessmentId || 'new'}`);
        if (savedStep) {
            setCurrentStep(parseInt(savedStep));
        }
    }, [assessmentId]);

    // Save step state
    useEffect(() => {
        localStorage.setItem(`assessmentSetupStep_${assessmentId || 'new'}`, currentStep.toString());
    }, [currentStep, assessmentId]);

    // Initialize from config, fallback to defaults
    const getDefaultPlagiarismConfig = (): PlagiarismConfig => ({
        strictness: 'Medium',
        similarityThreshold: 75,
        aiSensitivity: 'Medium',
        reportConfig: {
            includeSourceCode: true,
            includeMatches: true,
            includeAiAnalysis: true,
            includeVerdict: true,
        },
    });

    const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
    const [savingPlagiarism, setSavingPlagiarism] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Use config object for plagiarism state - ensures persistence across navigation
    const plagiarismEnabled = config.plagiarism?.enabled ?? false;
    const plagiarismConfig = config.plagiarism?.config ?? getDefaultPlagiarismConfig();

    const validateStep = (step: number) => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (step === 0) {
            if (!config.title?.trim()) newErrors.title = 'Title is required';
            else if (config.title.length < 5) newErrors.title = 'Title must be at least 5 characters';

            if (!config.description?.trim()) newErrors.description = 'Description is required';
            else if (config.description.length < 10) newErrors.description = 'Description must be at least 10 characters';

            if (!config.startDate) newErrors.startDate = 'Start date is required';
            if (!config.endDate) newErrors.endDate = 'End date is required';

            if (config.startDate && config.endDate && new Date(config.startDate) >= new Date(config.endDate)) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        if (step === 2) {
            if (config.proctoring.enabled && enabledCount === 0) {
                newErrors.proctoring = 'Select at least one method';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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

    const savePlagiarismConfig = async () => {
        if (!assessmentId) {
            console.warn('Assessment ID not provided for saving plagiarism config');
            return;
        }

        setSavingPlagiarism(true);
        try {
            const configToSave: PlagiarismConfig = {
                ...plagiarismConfig,
                enabled: plagiarismEnabled,
            };
            const result = await plagiarismService.savePlagiarismConfig(assessmentId, configToSave);
            setConfig({
                ...config,
                plagiarism: {
                    enabled: plagiarismEnabled,
                    config: result,
                }
            });
            console.log('Plagiarism config saved successfully');
        } catch (error) {
            console.error('Failed to save plagiarism config:', error);
        } finally {
            setSavingPlagiarism(false);
        }
    };

    const resetPlagiarismConfig = async () => {
        if (!assessmentId) {
            console.warn('Assessment ID not provided for resetting plagiarism config');
            return;
        }

        try {
            const defaultConfig = await plagiarismService.resetPlagiarismConfig(assessmentId);
            setConfig({
                ...config,
                plagiarism: {
                    enabled: defaultConfig.enabled || false,
                    config: defaultConfig,
                }
            });
            console.log('Plagiarism config reset to defaults');
        } catch (error) {
            console.error('Failed to reset plagiarism config:', error);
        }
    };

    const updatePlagiarismSetting = (field: keyof PlagiarismConfig, value: any) => {
        const newConfig = {
            ...config,
            plagiarism: {
                enabled: plagiarismEnabled,
                config: {
                    ...plagiarismConfig,
                    [field]: value,
                }
            }
        };
        setConfig(newConfig);
    };

    const updatePlagiarismReportConfig = (field: keyof PlagiarismConfig['reportConfig'], value: boolean) => {
        const newConfig = {
            ...config,
            plagiarism: {
                enabled: plagiarismEnabled,
                config: {
                    ...plagiarismConfig,
                    reportConfig: {
                        ...plagiarismConfig.reportConfig,
                        [field]: value,
                    }
                }
            }
        };
        setConfig(newConfig);
    };

    const togglePlagiarismEnabled = (newEnabled: boolean) => {
        const newConfig = {
            ...config,
            plagiarism: {
                enabled: newEnabled,
                config: plagiarismConfig,
            }
        };
        setConfig(newConfig);

        if (newEnabled) {
            setShowPlagiarismModal(true);
        }
    };

    const updateProctoring = (field: keyof AssessmentConfig['proctoring'], value: any) => {
        setConfig({
            ...config,
            proctoring: { ...config.proctoring, [field]: value }
        });
    };

    const updateNavigation = (field: keyof AssessmentConfig['navigation'], value: boolean) => {
        setConfig({
            ...config,
            navigation: { ...config.navigation, [field]: value }
        });
    };

    const enabledCount = Object.values(config.proctoring).filter(v => v === true).length;

    const proctoringGroups = {
        visual: ['videoMonitoring', 'screenRecording', 'imageMonitoring'],
        ai: ['faceDetection', 'personDetection', 'eyeTracking', 'objectDetection', 'noiseDetection'],
        lockdown: ['fullscreen', 'audioMonitoring', 'audioRecording', 'disableCopyPaste', 'blockRightClick', 'blockExternalMonitor'],
        verification: ['verifyIDCard', 'verifyFace']
    };

    const toggleProctoringGroup = (group: keyof typeof proctoringGroups) => {
        const fields = proctoringGroups[group];
        // Check if all boolean fields in the group are true
        const allEnabled = fields.every(field => config.proctoring[field as keyof typeof config.proctoring] === true);

        const newProctoring = { ...config.proctoring };
        fields.forEach(field => {
            // @ts-ignore
            newProctoring[field] = !allEnabled;
        });

        setConfig({ ...config, proctoring: newProctoring });
    };

    const isGroupSelected = (group: keyof typeof proctoringGroups) => {
        return proctoringGroups[group].every(field => config.proctoring[field as keyof typeof config.proctoring] === true);
    };

    const steps = [
        {
            id: 'details',
            title: 'Assessment Details',
            subtitle: 'Configure core parameters',
            icon: FileText,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            content: (
                <div className="flex flex-col gap-4 h-full">
                    <div className="shrink-0">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                            Assessment Title
                        </label>
                        <input
                            type="text"
                            value={config.title}
                            onChange={(e) => {
                                setConfig({ ...config, title: e.target.value });
                                if (errors.title) setErrors({ ...errors, title: '' });
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg bg-background border text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 font-medium text-sm ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                            placeholder="e.g. Senior Backend Developer Hiring Challenge"
                            autoFocus
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">{errors.title}</p>}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block shrink-0">
                            Instructions / Description
                        </label>
                        <textarea
                            value={config.description}
                            onChange={(e) => {
                                setConfig({ ...config, description: e.target.value });
                                if (errors.description) setErrors({ ...errors, description: '' });
                            }}
                            className={`w-full flex-1 px-3 py-2.5 rounded-lg bg-background border text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm placeholder:text-muted-foreground/50 leading-relaxed ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                            placeholder="Enter detailed instructions for candidates..."
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">{errors.description}</p>}
                    </div>

                    <div className="shrink-0 mb-2">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                            Passing Score (%)
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={config.passPercentage}
                                onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                    setConfig({ ...config, passPercentage: val });
                                }}
                                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                placeholder="60"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
                                %
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 px-1">Candidates must score at least this percentage to pass.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Calendar size={10} className="text-primary" /> Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={config.startDate}
                                onChange={(e) => {
                                    setConfig({ ...config, startDate: e.target.value });
                                    if (errors.startDate) setErrors({ ...errors, startDate: '' });
                                }}
                                className={`w-full px-3 py-2.5 rounded-lg bg-background border text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium ${errors.startDate ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                            />
                            {errors.startDate && <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Calendar size={10} className="text-orange-500" /> End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={config.endDate}
                                onChange={(e) => {
                                    setConfig({ ...config, endDate: e.target.value });
                                    if (errors.endDate) setErrors({ ...errors, endDate: '' });
                                }}
                                className={`w-full px-3 py-2.5 rounded-lg bg-background border text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium ${errors.endDate ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                            />
                            {errors.endDate && <p className="text-xs text-red-500 mt-1 font-medium animate-in slide-in-from-top-1">{errors.endDate}</p>}
                        </div>
                    </div>

                </div>
            )
        },
        {
            id: 'settings',
            title: 'Advanced Settings',
            subtitle: 'Navigation & Plagiarism',
            icon: Copy,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            content: (
                <div className="flex flex-col gap-6 h-full">
                    {/* Navigation Settings */}
                    <div className="p-5 border border-border rounded-xl bg-muted/10">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
                            <Navigation size={14} className="text-blue-500" />
                            Navigation Controls
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Allow Previous Navigation</span>
                                <div
                                    onClick={() => updateNavigation('allowPreviousNavigation', !config.navigation.allowPreviousNavigation)}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.navigation.allowPreviousNavigation ? 'bg-primary' : 'bg-muted border border-border'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.navigation.allowPreviousNavigation ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plagiarism Detection Settings */}
                    <div className="p-5 border border-border rounded-xl bg-muted/10 flex-1">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
                            <Copy size={14} className="text-red-500" />
                            Plagiarism Detection
                        </h3>
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm font-medium text-foreground">Enable Plagiarism Detection</span>
                            <div
                                onClick={() => togglePlagiarismEnabled(!plagiarismEnabled)}
                                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${plagiarismEnabled ? 'bg-primary' : 'bg-muted border border-border'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${plagiarismEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {plagiarismEnabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Strictness</label>
                                        <select
                                            value={plagiarismConfig.strictness}
                                            onChange={(e) => updatePlagiarismSetting('strictness', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">AI Sensitivity</label>
                                        <select
                                            value={plagiarismConfig.aiSensitivity}
                                            onChange={(e) => updatePlagiarismSetting('aiSensitivity', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Similarity Threshold</label>
                                        <span className="text-xs font-bold text-primary">{plagiarismConfig.similarityThreshold}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={plagiarismConfig.similarityThreshold}
                                        onChange={(e) => updatePlagiarismSetting('similarityThreshold', parseInt(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowPlagiarismModal(true)}
                                    className="w-full py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                >
                                    Configure Advanced Report Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            id: 'proctoring',
            title: 'Proctoring Settings',
            subtitle: 'Security & monitoring controls',
            icon: Shield,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            content: (
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex flex-col gap-2 px-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Global Enable</span>
                                <div
                                    onClick={() => {
                                        updateProctoring('enabled', !config.proctoring.enabled);
                                        if (errors.proctoring) setErrors({ ...errors, proctoring: '' });
                                    }}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${config.proctoring.enabled ? 'bg-primary shadow-md shadow-primary/20' : 'bg-muted border border-border hover:border-primary/50'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.proctoring.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-sm">
                                {enabledCount} active
                            </div>
                        </div>
                        {errors.proctoring && (
                            <div className="flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/10 px-3 py-2 rounded-lg animate-in slide-in-from-top-1 border border-red-500/20">
                                <Info size={14} />
                                {errors.proctoring}
                            </div>
                        )}
                    </div>

                    <div className={`flex-1 overflow-y-auto pr-2 space-y-3 transition-opacity ${!config.proctoring.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <GroupCard
                                    title="Visual Monitoring"
                                    icon={Video}
                                    color="emerald"
                                    onToggleAll={() => toggleProctoringGroup('visual')}
                                    isAllSelected={isGroupSelected('visual')}
                                >
                                    <ToggleRow label="Video Monitoring" isActive={config.proctoring.videoMonitoring} onClick={() => updateProctoring('videoMonitoring', !config.proctoring.videoMonitoring)} />
                                    <ToggleRow label="Screen Recording" isActive={config.proctoring.screenRecording} onClick={() => updateProctoring('screenRecording', !config.proctoring.screenRecording)} />
                                    <ToggleRow label="Image Snapshots" isActive={config.proctoring.imageMonitoring} onClick={() => updateProctoring('imageMonitoring', !config.proctoring.imageMonitoring)} />
                                </GroupCard>

                                <GroupCard
                                    title="AI Detection"
                                    icon={Scan}
                                    color="purple"
                                    onToggleAll={() => toggleProctoringGroup('ai')}
                                    isAllSelected={isGroupSelected('ai')}
                                >
                                    <ToggleRow label="Face Match" isActive={config.proctoring.faceDetection} onClick={() => updateProctoring('faceDetection', !config.proctoring.faceDetection)} />
                                    <ToggleRow label="Multi-Person" isActive={config.proctoring.personDetection} onClick={() => updateProctoring('personDetection', !config.proctoring.personDetection)} />
                                    <ToggleRow label="Eye Tracking" isActive={config.proctoring.eyeTracking} onClick={() => updateProctoring('eyeTracking', !config.proctoring.eyeTracking)} />
                                    <ToggleRow label="Object Detection" isActive={config.proctoring.objectDetection} onClick={() => updateProctoring('objectDetection', !config.proctoring.objectDetection)} />
                                    <ToggleRow label="Noise Detection" isActive={config.proctoring.noiseDetection} onClick={() => updateProctoring('noiseDetection', !config.proctoring.noiseDetection)} />
                                </GroupCard>
                            </div>

                            <div className="space-y-3">
                                <GroupCard
                                    title="System Lockdown"
                                    icon={Lock}
                                    color="blue"
                                    onToggleAll={() => toggleProctoringGroup('lockdown')}
                                    isAllSelected={isGroupSelected('lockdown')}
                                >
                                    <ToggleRow label="Force Fullscreen" isActive={config.proctoring.fullscreen} onClick={() => updateProctoring('fullscreen', !config.proctoring.fullscreen)} />
                                    <ToggleRow label="Audio Monitor" isActive={config.proctoring.audioMonitoring} onClick={() => updateProctoring('audioMonitoring', !config.proctoring.audioMonitoring)} />
                                    <ToggleRow label="Audio Record" isActive={config.proctoring.audioRecording} onClick={() => updateProctoring('audioRecording', !config.proctoring.audioRecording)} />
                                    <ToggleRow label="Disable Copy/Paste" isActive={config.proctoring.disableCopyPaste} onClick={() => updateProctoring('disableCopyPaste', !config.proctoring.disableCopyPaste)} />
                                    <ToggleRow label="Block Right Click" isActive={config.proctoring.blockRightClick} onClick={() => updateProctoring('blockRightClick', !config.proctoring.blockRightClick)} />
                                    <ToggleRow label="Block Ext. Monitor" isActive={config.proctoring.blockExternalMonitor} onClick={() => updateProctoring('blockExternalMonitor', !config.proctoring.blockExternalMonitor)} />
                                </GroupCard>

                                <GroupCard
                                    title="Verification & Limits"
                                    icon={Fingerprint}
                                    color="orange"
                                    onToggleAll={() => toggleProctoringGroup('verification')}
                                    isAllSelected={isGroupSelected('verification')}
                                >
                                    <ToggleRow label="ID Card Verify" isActive={config.proctoring.verifyIDCard} onClick={() => updateProctoring('verifyIDCard', !config.proctoring.verifyIDCard)} />
                                    <ToggleRow label="Face Verification" isActive={config.proctoring.verifyFace} onClick={() => updateProctoring('verifyFace', !config.proctoring.verifyFace)} />
                                    <div className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-background/50 transition-colors">
                                        <span className="text-sm font-medium text-foreground">Tab Switch Limit</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={config.proctoring.tabSwitchLimit}
                                            onChange={(e) => updateProctoring('tabSwitchLimit', parseInt(e.target.value) || 0)}
                                            className="w-14 h-8 bg-background border border-border rounded-md text-center font-bold text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </GroupCard>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                localStorage.removeItem(`assessmentSetupStep_${assessmentId || 'new'}`);
                onNext();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <>
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background/50">
                {/* Background Decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                {/* Page Title */}
                <div className="absolute  top-2 left-0 right-0 text-center z-20">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Create Assessment</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure your assessment details and settings</p>
                </div>

                <div className="w-full max-w-[95%] h-[93vh] relative flex items-center justify-center mt-14" style={{ perspective: '1000px' }}>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`absolute left-4 md:left-12 z-30 p-4 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 group ${currentStep === 0 ? 'opacity-0 pointer-events-none -translate-x-10' : 'opacity-100 translate-x-0'
                            }`}
                    >
                        <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={nextStep}
                        className="absolute right-4 md:right-12 z-30 p-4 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 group"
                    >
                        <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <AnimatePresence mode="popLayout">
                        {steps.map((step, index) => {
                            // Only render current and immediate neighbors
                            if (Math.abs(currentStep - index) > 1) return null;

                            const isCurrent = currentStep === index;
                            const offset = index - currentStep; // -1, 0, 1

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{
                                        scale: 0.8,
                                        opacity: 0,
                                        x: offset * 300,
                                        z: -100,
                                        rotateY: offset * -10
                                    }}
                                    animate={{
                                        scale: isCurrent ? 1 : 0.85,
                                        opacity: isCurrent ? 1 : 0.6,
                                        x: isCurrent ? 0 : offset * 160, // Peek out distance
                                        z: isCurrent ? 0 : -100,
                                        rotateY: isCurrent ? 0 : offset * -5,
                                        zIndex: isCurrent ? 20 : 10,
                                        filter: isCurrent ? 'blur(0px)' : 'blur(4px)',
                                    }}
                                    exit={{
                                        scale: 0.8,
                                        opacity: 0,
                                        z: -100
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 25
                                    }}
                                    className={`absolute w-full max-w-5xl h-full bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden ${!isCurrent ? 'pointer-events-none' : ''}`}
                                >
                                    {/* Card Header */}
                                    <div className="px-8 py-6 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center shadow-sm`}>
                                                <step.icon size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                                                <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                                            <span className="text-xs text-muted-foreground">/ {steps.length}</span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="flex-1 p-8 overflow-y-auto">
                                        {step.content}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-8 py-6 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between">
                                        <button
                                            onClick={prevStep}
                                            disabled={currentStep === 0}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStep === 0
                                                ? 'opacity-0 pointer-events-none'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                }`}
                                        >
                                            <ChevronLeft size={18} />
                                            Back
                                        </button>

                                        <div className="flex gap-2">
                                            {steps.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-primary w-8' : 'bg-border w-2'
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={nextStep}
                                            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                        >
                                            {currentStep === steps.length - 1 ? 'Finish Setup' : 'Next Step'}
                                            {currentStep === steps.length - 1 ? <ArrowRight size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Plagiarism Modal */}
            {showPlagiarismModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300 [&::-webkit-scrollbar]:hidden">
                        <div className="sticky top-0 px-8 py-6 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-sm">
                                    <Copy size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Plagiarism Detection</h2>
                                    <p className="text-sm text-muted-foreground">Configure advanced detection rules</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPlagiarismModal(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors"
                            >
                                <X size={24} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Strictness & Sensitivity Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-muted/30 border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
                                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">1</span>
                                        Strictness Level
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                                            <span>Lenient</span>
                                            <span>Balanced</span>
                                            <span>Strict</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="1"
                                            value={plagiarismConfig.strictness === 'Low' ? 0 : plagiarismConfig.strictness === 'Medium' ? 1 : 2}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updatePlagiarismSetting('strictness', val === 0 ? 'Low' : val === 1 ? 'Medium' : 'High');
                                            }}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Current: <span className="font-bold text-foreground">{plagiarismConfig.strictness}</span> -
                                            {plagiarismConfig.strictness === 'Low' ? ' Allows minor similarities' : plagiarismConfig.strictness === 'Medium' ? ' Standard academic check' : ' Zero tolerance policy'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted/30 border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
                                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-bold">2</span>
                                        AI Sensitivity
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                                            <span>Pattern</span>
                                            <span>Standard</span>
                                            <span>Advanced</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="1"
                                            value={plagiarismConfig.aiSensitivity === 'Low' ? 0 : plagiarismConfig.aiSensitivity === 'Medium' ? 1 : 2}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updatePlagiarismSetting('aiSensitivity', val === 0 ? 'Low' : val === 1 ? 'Medium' : 'High');
                                            }}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Current: <span className="font-bold text-foreground">{plagiarismConfig.aiSensitivity}</span> -
                                            {plagiarismConfig.aiSensitivity === 'Low' ? ' Basic pattern matching' : plagiarismConfig.aiSensitivity === 'Medium' ? ' Standard AI detection' : ' Deep learning analysis'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Threshold Slider */}
                            <div className="bg-muted/30 border border-border rounded-2xl p-6 hover:border-primary/20 transition-colors">
                                <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">3</span>
                                    Similarity Threshold
                                </h3>
                                <div className="space-y-6">
                                    <div className="relative pt-6 pb-2">
                                        <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs font-medium text-muted-foreground">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={plagiarismConfig.similarityThreshold}
                                            onChange={(e) => updatePlagiarismSetting('similarityThreshold', parseInt(e.target.value))}
                                            className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                        <div
                                            className="absolute top-8 transform -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded shadow-lg"
                                            style={{ left: `${plagiarismConfig.similarityThreshold}%` }}
                                        >
                                            {plagiarismConfig.similarityThreshold}%
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Submissions with similarity score above <span className="font-bold text-foreground">{plagiarismConfig.similarityThreshold}%</span> will be automatically flagged for review.
                                    </p>
                                </div>
                            </div>

                            {/* Report Configuration */}
                            <div className="bg-muted/30 border border-border rounded-2xl p-6 hover:border-primary/20 transition-colors">
                                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">4</span>
                                    Report Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ReportToggle
                                        label="Include Source Code"
                                        isActive={plagiarismConfig.reportConfig.includeSourceCode}
                                        onChange={() => updatePlagiarismReportConfig('includeSourceCode', !plagiarismConfig.reportConfig.includeSourceCode)}
                                    />
                                    <ReportToggle
                                        label="Include Matched Sources"
                                        isActive={plagiarismConfig.reportConfig.includeMatches}
                                        onChange={() => updatePlagiarismReportConfig('includeMatches', !plagiarismConfig.reportConfig.includeMatches)}
                                    />
                                    <ReportToggle
                                        label="Include AI Analysis"
                                        isActive={plagiarismConfig.reportConfig.includeAiAnalysis}
                                        onChange={() => updatePlagiarismReportConfig('includeAiAnalysis', !plagiarismConfig.reportConfig.includeAiAnalysis)}
                                    />
                                    <ReportToggle
                                        label="Include Verdict"
                                        isActive={plagiarismConfig.reportConfig.includeVerdict}
                                        onChange={() => updatePlagiarismReportConfig('includeVerdict', !plagiarismConfig.reportConfig.includeVerdict)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 px-8 py-6 border-t border-border bg-card/95 backdrop-blur-sm flex gap-3 justify-end rounded-b-3xl">
                            <button
                                onClick={() => setShowPlagiarismModal(false)}
                                className="px-6 py-3 bg-muted text-foreground rounded-xl font-semibold text-sm hover:bg-muted/80 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    savePlagiarismConfig();
                                    setShowPlagiarismModal(false);
                                }}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


export default AssessmentSetup;
