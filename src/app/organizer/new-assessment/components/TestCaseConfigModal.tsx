import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, CheckCircle, AlertCircle, Loader2, Sparkles, RefreshCw, Shuffle } from 'lucide-react';
import { testCaseConfigService, TestCaseConfig } from '@/api/testCaseConfigService';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface TestCaseConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionProblemId: string | null;
    problemTitle: string;
    totalTestCases: number;
    problemData?: {
        exampleTestcases?: Array<{ input: string; output: string }>;
        hiddenTestcases?: Array<{ input: string; output: string }>;
    };
    // For pre-publish mode (storing in frontend state)
    initialConfig?: {
        method: 'all' | 'range' | 'indices';
        exampleRange?: { start: number; end: number } | null;
        hiddenRange?: { start: number; end: number } | null;
        exampleIndices?: number[] | null;
        hiddenIndices?: number[] | null;
    } | null;
    onSaveLocal?: (config: {
        method: 'all' | 'range' | 'indices';
        exampleRange?: { start: number; end: number } | null;
        hiddenRange?: { start: number; end: number } | null;
        exampleIndices?: number[] | null;
        hiddenIndices?: number[] | null;
    } | null) => void;
}

const TestCaseConfigModal: React.FC<TestCaseConfigModalProps> = ({
    isOpen,
    onClose,
    sectionProblemId,
    problemTitle,
    totalTestCases,
    problemData,
    initialConfig,
    onSaveLocal
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Method selection
    const [method, setMethod] = useState<'all' | 'range' | 'indices' | 'random'>('all');

    // Range mode state (using start/end arrays for dual-handle slider)
    const [exampleRange, setExampleRange] = useState<[number, number]>([0, 2]);
    const [hiddenRange, setHiddenRange] = useState<[number, number]>([0, 0]);

    // Indices mode state
    const [exampleIndices, setExampleIndices] = useState<Set<number>>(new Set());
    const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set());

    // Random mode state
    const [randomExampleCount, setRandomExampleCount] = useState<number>(0);
    const [randomHiddenCount, setRandomHiddenCount] = useState<number>(0);

    // Get actual test case counts from problemData
    const exampleTestCases = problemData?.exampleTestcases || [];
    const hiddenTestCases = problemData?.hiddenTestcases || [];

    // Initialize random counts when data loads
    useEffect(() => {
        if (exampleTestCases.length > 0) setRandomExampleCount(exampleTestCases.length);
        if (hiddenTestCases.length > 0) setRandomHiddenCount(Math.min(5, hiddenTestCases.length));
    }, [exampleTestCases.length, hiddenTestCases.length]);

    const handleRandomize = () => {
        // Randomize Example
        const exTotal = exampleTestCases.length;
        const exCount = Math.min(Math.max(0, randomExampleCount), exTotal);
        const newEx = new Set<number>();
        // Create an array of all possible indices [0, 1, ... exTotal-1]
        const exPool = Array.from({ length: exTotal }, (_, i) => i);
        // Shuffle pool
        for (let i = exPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [exPool[i], exPool[j]] = [exPool[j], exPool[i]];
        }
        // Take first exCount items
        exPool.slice(0, exCount).forEach(idx => newEx.add(idx));
        setExampleIndices(newEx);

        // Randomize Hidden
        const hidTotal = hiddenTestCases.length;
        const hidCount = Math.min(Math.max(0, randomHiddenCount), hidTotal);
        const newHid = new Set<number>();
        const hidPool = Array.from({ length: hidTotal }, (_, i) => i);
        for (let i = hidPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [hidPool[i], hidPool[j]] = [hidPool[j], hidPool[i]];
        }
        hidPool.slice(0, hidCount).forEach(idx => newHid.add(idx));
        setHiddenIndices(newHid);
    };


    // Calculate safe separate limits
    const safeExampleMax = Math.max(0, exampleTestCases.length - 1);
    const safeHiddenMax = Math.max(0, hiddenTestCases.length - 1);

    // Sync ranges when data changes
    useEffect(() => {
        // If we have actual data, sync to those limits
        if (exampleTestCases.length > 0) {
            setExampleRange(prev => [
                Math.min(prev[0], safeExampleMax),
                Math.min(prev[1], safeExampleMax)
            ]);
        }

        if (hiddenTestCases.length > 0) {
            setHiddenRange(prev => [0, safeHiddenMax]);
        }
    }, [exampleTestCases.length, hiddenTestCases.length, safeExampleMax, safeHiddenMax]);

    // Load existing configuration
    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen, initialConfig, sectionProblemId, totalTestCases]);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);

        try {
            // If we have initialConfig (pre-publish mode), use it
            if (initialConfig !== undefined) {
                if (initialConfig) {
                    setMethod(initialConfig.method || 'all');

                    if (initialConfig.method === 'range') {
                        if (initialConfig.exampleRange) {
                            setExampleRange([initialConfig.exampleRange.start, initialConfig.exampleRange.end]);
                        }
                        if (initialConfig.hiddenRange) {
                            setHiddenRange([initialConfig.hiddenRange.start, initialConfig.hiddenRange.end]);
                        }
                    } else if (initialConfig.method === 'indices') {
                        if (initialConfig.exampleIndices) {
                            setExampleIndices(new Set(initialConfig.exampleIndices));
                        }
                        if (initialConfig.hiddenIndices) {
                            setHiddenIndices(new Set(initialConfig.hiddenIndices));
                        }
                    }
                } else {
                    // Set defaults
                    setMethod('all');
                    setExampleRange([0, Math.min(2, totalTestCases - 1)]);
                    setHiddenRange([0, totalTestCases - 1]);
                    setExampleIndices(new Set());
                    setHiddenIndices(new Set());
                }
            }
            // If we have sectionProblemId (post-publish mode), fetch from API
            else if (sectionProblemId) {
                const config = await testCaseConfigService.getTestCaseConfig(sectionProblemId);

                if (config) {
                    setMethod(config.method || 'all');

                    if (config.method === 'range') {
                        if (config.exampleRange) {
                            setExampleRange([config.exampleRange.start, config.exampleRange.end]);
                        }
                        if (config.hiddenRange) {
                            setHiddenRange([config.hiddenRange.start, config.hiddenRange.end]);
                        }
                    } else if (config.method === 'indices') {
                        if (config.exampleIndices) {
                            setExampleIndices(new Set(config.exampleIndices));
                        }
                        if (config.hiddenIndices) {
                            setHiddenIndices(new Set(config.hiddenIndices));
                        }
                    }
                } else {
                    // Set defaults
                    setMethod('all');
                }
            }
            // No config available, use defaults
            else {
                setMethod('all');
                setExampleRange([0, Math.min(2, totalTestCases - 1)]);
                setHiddenRange([0, totalTestCases - 1]);
            }
        } catch (err: any) {
            console.error('Failed to load test case config:', err);
            setError(err.response?.data?.message || 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation for range method
        if (method === 'range') {
            const exLen = exampleTestCases.length > 0 ? exampleTestCases.length : 0;
            const hidLen = hiddenTestCases.length > 0 ? hiddenTestCases.length : 0;

            if (exLen > 0 && (exampleRange[0] < 0 || exampleRange[1] >= exLen || exampleRange[0] > exampleRange[1])) {
                setError(`Invalid example range. Max index is ${exLen - 1}.`);
                return;
            }
            if (hidLen > 0 && (hiddenRange[0] < 0 || hiddenRange[1] >= hidLen || hiddenRange[0] > hiddenRange[1])) {
                setError(`Invalid hidden range. Max index is ${hidLen - 1}.`);
                return;
            }
        }

        // Validation for indices method
        if (method === 'indices') {
            if (exampleIndices.size === 0 && hiddenIndices.size === 0) {
                setError('Please select at least one test case.');
                return;
            }
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            let config: TestCaseConfig;

            if (method === 'all') {
                config = { method: 'all' };
            } else if (method === 'range') {
                config = {
                    method: 'range',
                    exampleRange: { start: exampleRange[0], end: exampleRange[1] },
                    hiddenRange: { start: hiddenRange[0], end: hiddenRange[1] }
                };
            } else {
                // Indices OR Random (saved as indices)
                config = {
                    method: 'indices',
                    exampleIndices: Array.from(exampleIndices),
                    hiddenIndices: Array.from(hiddenIndices)
                };
            }

            // If we have onSaveLocal (pre-publish mode), save locally
            if (onSaveLocal) {
                onSaveLocal(config);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 800);
            }
            // Otherwise save to API (post-publish mode)
            else if (sectionProblemId) {
                await testCaseConfigService.configureTestCases(sectionProblemId, config);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err: any) {
            console.error('Failed to save test case config:', err);
            setError(err.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        setError(null);

        try {
            // Reset to defaults
            setMethod('all');
            setExampleRange([0, Math.min(2, totalTestCases - 1)]);
            setHiddenRange([0, totalTestCases - 1]);
            setExampleIndices(new Set());
            setHiddenIndices(new Set());

            // If we have onSaveLocal (pre-publish mode), save null locally
            if (onSaveLocal) {
                onSaveLocal(null);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 800);
            }
            // Otherwise reset via API (post-publish mode)
            else if (sectionProblemId) {
                await testCaseConfigService.configureTestCases(sectionProblemId, null);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err: any) {
            console.error('Failed to reset test case config:', err);
            setError(err.response?.data?.message || 'Failed to reset configuration');
        } finally {
            setSaving(false);
        }
    };

    const toggleExampleIndex = (index: number) => {
        const newSet = new Set(exampleIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setExampleIndices(newSet);
    };

    const toggleHiddenIndex = (index: number) => {
        const newSet = new Set(hiddenIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setHiddenIndices(newSet);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border bg-muted/30">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Settings className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Configure Test Cases</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{problemTitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <>
                                {/* Info Banner */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            <p className="font-semibold mb-1">
                                                Total Test Cases: {(exampleTestCases.length + hiddenTestCases.length) || totalTestCases}
                                            </p>
                                            <p className="text-xs opacity-90">
                                                Example: {exampleTestCases.length} | Hidden: {hiddenTestCases.length}
                                            </p>
                                            <p className="text-xs opacity-90 mt-1">
                                                Choose how to configure test case visibility for contestants.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Method Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-foreground">Configuration Method</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        <button
                                            onClick={() => setMethod('all')}
                                            className={`p-4 rounded-xl border-2 transition-all ${method === 'all'
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'all' ? 'border-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {method === 'all' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <span className="text-sm font-bold">All</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-left">
                                                Use all {totalTestCases} test cases
                                            </p>
                                        </button>

                                        <button
                                            onClick={() => setMethod('range')}
                                            className={`p-4 rounded-xl border-2 transition-all ${method === 'range'
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'range' ? 'border-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {method === 'range' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <span className="text-sm font-bold">Range</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-left">
                                                Select by count
                                            </p>
                                        </button>

                                        <button
                                            onClick={() => setMethod('indices')}
                                            className={`p-4 rounded-xl border-2 transition-all ${method === 'indices'
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'indices' ? 'border-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {method === 'indices' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <span className="text-sm font-bold">Specific</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-left">
                                                Pick individual cases
                                            </p>
                                        </button>

                                        <button
                                            onClick={() => setMethod('random')}
                                            className={`p-4 rounded-xl border-2 transition-all ${method === 'random'
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'random' ? 'border-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {method === 'random' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <span className="text-sm font-bold">Random</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-left">
                                                Auto-select
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Configuration based on method */}
                                {method === 'all' && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                                            <div className="text-sm text-green-700 dark:text-green-300">
                                                <p className="font-semibold mb-1">All Test Cases Selected</p>
                                                <p className="text-xs opacity-90">
                                                    All {totalTestCases} test cases will be used for evaluation. This is the recommended setting for production assessments.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {method === 'range' && (
                                    <div className="space-y-6">
                                        {/* Example Range */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-foreground">Example Test Cases</label>
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    Visible to contestants
                                                </span>
                                            </div>


                                            {/* Start and End Inputs */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                        Start Index
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={safeExampleMax}
                                                        value={exampleRange[0] ?? 0}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (input === '') {
                                                                setExampleRange([0, exampleRange[1]]);
                                                                return;
                                                            }
                                                            const val = parseInt(input);
                                                            if (!isNaN(val)) {
                                                                const clampedVal = Math.max(0, Math.min(safeExampleMax, val));
                                                                setExampleRange([clampedVal, exampleRange[1]]);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                        End Index
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={safeExampleMax}
                                                        value={exampleRange[1] ?? 0}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (input === '') {
                                                                setExampleRange([exampleRange[0], 0]);
                                                                return;
                                                            }
                                                            const val = parseInt(input);
                                                            if (!isNaN(val)) {
                                                                const clampedVal = Math.max(0, Math.min(safeExampleMax, val));
                                                                setExampleRange([exampleRange[0], clampedVal]);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                    />
                                                </div>
                                            </div>

                                            {/* Dual Handle Slider */}
                                            <div className="space-y-3 px-2">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    Adjust Range
                                                </label>
                                                <Slider
                                                    range
                                                    min={0}
                                                    max={safeExampleMax}
                                                    value={exampleRange}
                                                    onChange={(value) => setExampleRange(value as [number, number])}
                                                    trackStyle={[{ backgroundColor: '#10b981', height: 6 }]}
                                                    handleStyle={[
                                                        { borderColor: '#10b981', backgroundColor: '#10b981', width: 18, height: 18, marginTop: -6 },
                                                        { borderColor: '#10b981', backgroundColor: '#10b981', width: 18, height: 18, marginTop: -6 }
                                                    ]}
                                                    railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
                                                />
                                            </div>

                                            {/* Count Display */}
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                        Selected Range:
                                                    </span>
                                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                        [{exampleRange[0]} to {exampleRange[1]}] = {exampleRange[1] - exampleRange[0] + 1} test case{exampleRange[1] - exampleRange[0] + 1 !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual Bar */}
                                            <div className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: (exampleTestCases.length + hiddenTestCases.length) || totalTestCases || 0 }, (_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 h-3 rounded-sm transition-colors ${i >= exampleRange[0] && i <= exampleRange[1]
                                                                ? 'bg-emerald-500'
                                                                : 'bg-muted-foreground/20'
                                                                }`}
                                                            title={`Test Case ${i}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hidden Range */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-foreground">Hidden Test Cases</label>
                                                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                                    Used for evaluation
                                                </span>
                                            </div>

                                            {/* Start and End Inputs */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                        Start Index
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={safeHiddenMax}
                                                        value={hiddenRange[0] ?? 0}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (input === '') {
                                                                setHiddenRange([0, hiddenRange[1]]);
                                                                return;
                                                            }
                                                            const val = parseInt(input);
                                                            if (!isNaN(val)) {
                                                                const clampedVal = Math.max(0, Math.min(safeHiddenMax, val));
                                                                setHiddenRange([clampedVal, hiddenRange[1]]);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                        End Index
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={safeHiddenMax}
                                                        value={hiddenRange[1] ?? 0}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (input === '') {
                                                                setHiddenRange([hiddenRange[0], 0]);
                                                                return;
                                                            }
                                                            const val = parseInt(input);
                                                            if (!isNaN(val)) {
                                                                const clampedVal = Math.max(0, Math.min(safeHiddenMax, val));
                                                                setHiddenRange([hiddenRange[0], clampedVal]);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                                    />
                                                </div>
                                            </div>

                                            {/* Dual Handle Slider */}
                                            <div className="space-y-3 px-2">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    Adjust Range
                                                </label>
                                                <Slider
                                                    range
                                                    min={0}
                                                    max={safeHiddenMax}
                                                    value={hiddenRange}
                                                    onChange={(value) => setHiddenRange(value as [number, number])}
                                                    trackStyle={[{ backgroundColor: '#f97316', height: 6 }]}
                                                    handleStyle={[
                                                        { borderColor: '#f97316', backgroundColor: '#f97316', width: 18, height: 18, marginTop: -6 },
                                                        { borderColor: '#f97316', backgroundColor: '#f97316', width: 18, height: 18, marginTop: -6 }
                                                    ]}
                                                    railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
                                                />
                                            </div>

                                            {/* Count Display */}
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                                                        Selected Range:
                                                    </span>
                                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                                        [{hiddenRange[0]} to {hiddenRange[1]}] = {hiddenRange[1] - hiddenRange[0] + 1} test case{hiddenRange[1] - hiddenRange[0] + 1 !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual Bar */}
                                            <div className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: (exampleTestCases.length + hiddenTestCases.length) || totalTestCases || 0 }, (_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 h-3 rounded-sm transition-colors ${i >= hiddenRange[0] && i <= hiddenRange[1]
                                                                ? 'bg-orange-500'
                                                                : 'bg-muted-foreground/20'
                                                                }`}
                                                            title={`Test Case ${i}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {method === 'indices' && (
                                    <div className="space-y-4">
                                        {/* Example Indices */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-foreground">Example Test Cases</label>
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    {exampleIndices.size} of {exampleTestCases.length} selected
                                                </span>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                                {exampleTestCases.length > 0 ? (
                                                    exampleTestCases.map((testCase, i) => (
                                                        <label
                                                            key={i}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${exampleIndices.has(i)
                                                                ? 'border-emerald-500 bg-emerald-500/10'
                                                                : 'border-border hover:border-emerald-500/50'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={exampleIndices.has(i)}
                                                                onChange={() => toggleExampleIndex(i)}
                                                                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer mt-0.5"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium mb-1">
                                                                    Test Case {i}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground space-y-1">
                                                                    <div className="truncate">
                                                                        <span className="font-semibold">Input:</span> {testCase.input.substring(0, 50)}{testCase.input.length > 50 ? '...' : ''}
                                                                    </div>
                                                                    <div className="truncate">
                                                                        <span className="font-semibold">Output:</span> {testCase.output.substring(0, 50)}{testCase.output.length > 50 ? '...' : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-sm text-muted-foreground py-4">
                                                        No example test cases available
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hidden Indices */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-foreground">Hidden Test Cases</label>
                                                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                                    {hiddenIndices.size} of {hiddenTestCases.length} selected
                                                </span>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                                {hiddenTestCases.length > 0 ? (
                                                    hiddenTestCases.map((testCase, i) => (
                                                        <label
                                                            key={i}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${hiddenIndices.has(i)
                                                                ? 'border-orange-500 bg-orange-500/10'
                                                                : 'border-border hover:border-orange-500/50'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={hiddenIndices.has(i)}
                                                                onChange={() => toggleHiddenIndex(i)}
                                                                className="w-4 h-4 rounded accent-orange-500 cursor-pointer mt-0.5"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium mb-1">
                                                                    Hidden Test Case {i}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    <div className="truncate">
                                                                        <span className="font-semibold">Input:</span> {testCase.input.substring(0, 50)}{testCase.input.length > 50 ? '...' : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-sm text-muted-foreground py-4">
                                                        No hidden test cases available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {method === 'random' && (
                                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={18} />
                                                <div className="text-sm text-purple-700 dark:text-purple-300">
                                                    <p className="font-semibold mb-1">Random Selection</p>
                                                    <p className="text-xs opacity-90">
                                                        Enter the number of test cases you want to select. The system will randomly pick them for you.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    Example Cases (Max: {exampleTestCases.length})
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={exampleTestCases.length}
                                                        value={randomExampleCount}
                                                        onChange={(e) => setRandomExampleCount(parseInt(e.target.value) || 0)}
                                                        className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                                    />
                                                    <span className="text-xs font-bold text-muted-foreground">cases</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    Hidden Cases (Max: {hiddenTestCases.length})
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={hiddenTestCases.length}
                                                        value={randomHiddenCount}
                                                        onChange={(e) => setRandomHiddenCount(parseInt(e.target.value) || 0)}
                                                        className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                                    />
                                                    <span className="text-xs font-bold text-muted-foreground">cases</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleRandomize}
                                            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={18} /> Randomize & Select
                                        </button>

                                        <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected Cases Preview</p>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-wider w-20 shrink-0 text-center">Example</span>
                                                    <div className="flex-1 font-mono text-xs break-all bg-background/50 p-2 rounded border border-border/50">
                                                        {exampleIndices.size > 0 
                                                            ? Array.from(exampleIndices).sort((a,b) => a-b).join(', ') 
                                                            : <span className="text-muted-foreground italic">None selected</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs font-bold text-orange-600 bg-orange-500/10 px-2 py-1 rounded uppercase tracking-wider w-20 shrink-0 text-center">Hidden</span>
                                                    <div className="flex-1 font-mono text-xs break-all bg-background/50 p-2 rounded border border-border/50">
                                                        {hiddenIndices.size > 0 
                                                            ? Array.from(hiddenIndices).sort((a,b) => a-b).join(', ') 
                                                            : <span className="text-muted-foreground italic">None selected</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {(exampleIndices.size > 0 || hiddenIndices.size > 0) && (
                                                <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/50">
                                                    These specific indices will be saved for the assessment.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Configuration saved successfully!
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
                        <button
                            onClick={handleReset}
                            disabled={saving || loading}
                            className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset to Default
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TestCaseConfigModal;
