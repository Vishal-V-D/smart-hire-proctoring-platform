"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, ArrowLeft, Code, Type, List, CheckSquare,
    Image as ImageIcon, X, Download, Archive, FileText,
    CheckCircle, PenTool, Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { questionBankService, FilterOptions } from '@/api/questionBankService';

type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_in_the_blank' | 'coding';

export default function AddQuestionPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'bulk' | 'manual'>('bulk');

    // Manual Form State
    const [qType, setQType] = useState<QuestionType>('single_choice');
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>(['', '', '', '']);
    const [correctOption, setCorrectOption] = useState<number>(0);
    const [correctOptions, setCorrectOptions] = useState<number[]>([]);
    const [correctAnswerText, setCorrectAnswerText] = useState('');
    const [codeStub, setCodeStub] = useState('// Write your solution here\nfunction solve(input) {\n    return input;\n}');
    const [division, setDivision] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [marks, setMarks] = useState(1);

    // Bulk Upload State
    const [uploadDivision, setUploadDivision] = useState('');
    const [uploadSubdivision, setUploadSubdivision] = useState('');
    const [uploadTopic, setUploadTopic] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkUploadRef = useRef<HTMLInputElement>(null);

    // Dynamic filtering for subdivisions based on selected division
    const [dynamicSubdivisions, setDynamicSubdivisions] = useState<string[]>([]);

    const availableTypes: QuestionType[] = ['single_choice', 'multiple_choice', 'fill_in_the_blank', 'coding'];

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    // Update dynamic subdivisions when uploadDivision changes
    useEffect(() => {
        const updateSubdivisions = async () => {
            if (uploadDivision && filterOptions?.divisions.includes(uploadDivision)) {
                try {
                    // Fetch subdivisions specific to this division
                    const res = await questionBankService.getFilterOptions(uploadDivision);
                    setDynamicSubdivisions(res.data.subdivisions);
                } catch (error) {
                    console.error('Failed to update subdivisions:', error);
                }
            } else if (filterOptions) {
                // Reset to all subdivisions if no division selected or unknown division
                setDynamicSubdivisions(filterOptions.subdivisions);
            }
        };

        const timeoutId = setTimeout(updateSubdivisions, 300);
        return () => clearTimeout(timeoutId);
    }, [uploadDivision, filterOptions]);

    const fetchFilterOptions = async () => {
        try {
            const response = await questionBankService.getFilterOptions();
            setFilterOptions(response.data);
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            alert('Please select a file');
            return;
        }

        setIsUploading(true);
        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'csv') {
                const response = await questionBankService.uploadCSV(file, uploadDivision, uploadSubdivision, uploadTopic);
                console.log('✅ CSV Upload Success:', response.data);
                alert('CSV uploaded successfully! check console for details.');
            } else if (fileExtension === 'zip') {
                const response = await questionBankService.uploadZIP(file, uploadDivision, uploadSubdivision, uploadTopic);
                console.log('✅ ZIP Upload Success:', response.data);
                alert('ZIP uploaded successfully! check console for details.');
            } else {
                alert('Please upload a CSV or ZIP file');
                return;
            }

            router.push('/question-bank');
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploading(false);
            if (bulkUploadRef.current) {
                bulkUploadRef.current.value = '';
            }
        }
    };

    const handleSaveQuestion = async () => {
        if (!text.trim() || !division) {
            alert('Please fill in the question text and select a division');
            return;
        }

        try {
            const questionData: any = {
                text,
                type: qType,
                division,
                topic: topic || division,
                difficulty,
                marks,
                image: image || undefined,
            };

            if (qType === 'single_choice') {
                questionData.options = options;
                questionData.correctAnswer = options[correctOption];
            } else if (qType === 'multiple_choice') {
                questionData.options = options;
                questionData.correctAnswer = correctOptions.map(i => options[i]);
            } else if (qType === 'fill_in_the_blank') {
                questionData.correctAnswer = correctAnswerText;
            } else if (qType === 'coding') {
                questionData.codeStub = codeStub;
            }

            // Call API to create question
            await questionBankService.createQuestion(questionData);
            alert('Question created successfully!');
            router.push('/question-bank');
        } catch (error: any) {
            console.error('Failed to create question:', error);
            alert(`Failed to create question: ${error.response?.data?.message || error.message}`);
        }
    };

    const getTypeIcon = (t: QuestionType) => {
        switch (t) {
            case 'coding': return <Code size={16} />;
            case 'single_choice': return <List size={16} />;
            case 'multiple_choice': return <CheckSquare size={16} />;
            case 'fill_in_the_blank': return <Type size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Add Questions</h1>
                                <p className="text-sm text-muted-foreground">Add new questions to the question bank</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit mb-6">
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'bulk'
                            ? 'bg-card shadow-sm text-primary ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Upload size={16} /> Bulk Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'manual'
                            ? 'bg-card shadow-sm text-primary ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <PenTool size={16} /> Manual Creation
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'bulk' ? (
                        <motion.div
                            key="bulk"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Header */}
                                <div className="text-center py-4">
                                    <Upload size={48} className="mx-auto text-primary mb-4" />
                                    <h2 className="text-xl font-bold text-foreground mb-2">Bulk Upload Questions</h2>
                                    <p className="text-sm text-muted-foreground">Import multiple questions via CSV or ZIP files</p>
                                </div>

                                {/* Division Selection */}
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-2 block">
                                        Main Division (Section) <span className="text-muted-foreground font-normal">(Optional if 'Division' column exists)</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="divisions-list-bulk"
                                        value={uploadDivision}
                                        onChange={(e) => setUploadDivision(e.target.value)}
                                        placeholder="e.g. Technical, Aptitude, Pseudo Code..."
                                        className="w-full bg-background border border-border rounded-lg py-3 px-4 text-sm focus:border-primary outline-none"
                                    />
                                    <datalist id="divisions-list-bulk">
                                        {filterOptions?.divisions.map((div, idx) => (
                                            <option key={idx} value={div} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs text-muted-foreground mt-1">Select the main section (Aptitude, Technical, etc.)</p>
                                </div>

                                {/* Subdivision Selection */}
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-2 block">
                                        Subdivision (Topic) <span className="text-muted-foreground font-normal">(Optional if 'Subtopic' column exists)</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="subdivisions-list-bulk"
                                        value={uploadSubdivision}
                                        onChange={(e) => setUploadSubdivision(e.target.value)}
                                        placeholder="e.g. OS, Select Division first to see options..."
                                        className="w-full bg-background border border-border rounded-lg py-3 px-4 text-sm focus:border-primary outline-none"
                                    />
                                    <datalist id="subdivisions-list-bulk">
                                        {dynamicSubdivisions.map((sub, idx) => (
                                            <option key={idx} value={sub} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {uploadDivision ? `Available topics for ${uploadDivision}` : 'Select a division to filter topics'}
                                    </p>
                                </div>

                                {/* Topic Selection */}
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-2 block">
                                        Specific Topic <span className="text-muted-foreground font-normal">(Optional if 'Topic' column exists)</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="topics-list-bulk"
                                        value={uploadTopic}
                                        onChange={(e) => setUploadTopic(e.target.value)}
                                        placeholder="e.g. Arrays, Pointers, Profit & Loss..."
                                        className="w-full bg-background border border-border rounded-lg py-3 px-4 text-sm focus:border-primary outline-none"
                                    />
                                    <datalist id="topics-list-bulk">
                                        {filterOptions?.topics.map((top, idx) => (
                                            <option key={idx} value={top} />
                                        ))}
                                    </datalist>
                                    <p className="text-xs text-muted-foreground mt-1">Type a specific topic</p>
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* CSV Format Card */}
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                            <FileText size={18} /> CSV Format
                                        </div>
                                        <p className="text-sm text-muted-foreground">Upload text-only questions without images</p>

                                        <div className="bg-background/80 rounded-lg p-4 space-y-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Required Columns:</p>
                                            <div className="text-sm text-foreground font-mono space-y-1">
                                                <div>• <span className="text-emerald-600">Division</span> - Optional (overrides selection)</div>
                                                <div>• <span className="text-emerald-600">Subtopic</span> - Optional (overrides selection)</div>
                                                <div>• <span className="text-emerald-600">Topic</span> - Optional (overrides selection)</div>
                                                <div>• <span className="text-emerald-600">Level</span> - easy/medium/hard</div>
                                                <div>• <span className="text-emerald-600">Question</span> - Question text</div>
                                                <div>• <span className="text-emerald-600">Options (JSON)</span> - {"'{\"1\":\"...\",\"2\":\"...\"...}'"}</div>
                                                <div>• <span className="text-emerald-600">Solution</span> - Correct option (1-4)</div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-500/10 text-amber-600 text-xs p-3 rounded-lg flex gap-2 items-start">
                                            <span className="font-bold">Note:</span> Columns in CSV take priority over the dropdown selections above.
                                        </div>

                                        <a
                                            href="/CS_Fundamentals_50_MCQs.csv"
                                            download
                                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Download size={16} /> Download Sample CSV
                                        </a>
                                    </div>

                                    {/* ZIP Format Card */}
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-4">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                                            <Archive size={18} /> ZIP Format
                                        </div>
                                        <p className="text-sm text-muted-foreground">Upload questions with images (max 25MB)</p>

                                        <div className="bg-background/80 rounded-lg p-4 space-y-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folder Structure:</p>
                                            <div className="text-sm font-mono bg-zinc-900 text-zinc-300 rounded p-3">
                                                <div>📦 questions.zip</div>
                                                <div className="pl-4">├── 📄 questions.csv</div>
                                                <div className="pl-4">└── 📁 images/</div>
                                                <div className="pl-8">├── q1.png</div>
                                                <div className="pl-8">├── q2.jpg</div>
                                                <div className="pl-8">└── ...</div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <div>• Reference images as <code className="bg-muted px-1.5 py-0.5 rounded">images/filename.png</code></div>
                                            <div>• Supported: PNG, JPG, JPEG, GIF, WebP</div>
                                            <div>• Max size: <span className="font-bold text-blue-600">25MB</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Button */}
                                <div className="pt-4">
                                    <input
                                        ref={bulkUploadRef}
                                        type="file"
                                        accept=".csv,.zip"
                                        onChange={handleBulkUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => bulkUploadRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={20} />
                                                Choose File (CSV or ZIP)
                                            </>
                                        )}
                                    </button>
                                    {!uploadDivision && !uploadSubdivision && !uploadTopic && (
                                        <p className="text-xs text-muted-foreground mt-3 text-center">
                                            ℹ️ If no global filters are selected here, your CSV <strong>must</strong> have 'Division', 'Subtopic', and 'Topic' columns.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="manual"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Type Selector */}
                                <div className="flex gap-2 p-1 bg-muted/30 rounded-lg overflow-x-auto">
                                    {availableTypes.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setQType(t)}
                                            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${qType === t
                                                ? 'bg-background shadow-sm text-primary ring-1 ring-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {getTypeIcon(t)} {t.replace(/_/g, ' ').toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                {/* Meta Info Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Division *</label>
                                        <input
                                            type="text"
                                            list="divisions-list-manual"
                                            value={division}
                                            onChange={(e) => setDivision(e.target.value)}
                                            placeholder="e.g. Technical"
                                            className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        />
                                        <datalist id="divisions-list-manual">
                                            {filterOptions?.divisions.map((div, idx) => (
                                                <option key={idx} value={div} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Topic</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g. Arrays"
                                            className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Difficulty</label>
                                        <select
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value as any)}
                                            className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Marks</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={marks}
                                            onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                                            className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Question Text *</label>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                        >
                                            <ImageIcon size={14} /> {image ? 'Change Image' : 'Add Image'}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl p-4 text-sm min-h-[120px] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-y"
                                        placeholder="Enter the question statement..."
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                    />
                                    {image && (
                                        <div className="relative inline-block mt-2 group">
                                            <img src={image} alt="Question Preview" className="h-32 w-auto rounded-lg border border-border object-cover" />
                                            <button
                                                onClick={() => setImage(null)}
                                                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Inputs based on Type */}
                                <AnimatePresence mode="wait">
                                    {qType === 'coding' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Initial Code Stub</label>
                                            <textarea
                                                className="w-full bg-zinc-950 text-emerald-400 font-mono text-sm border border-border rounded-xl p-4 min-h-[180px] focus:border-primary outline-none"
                                                value={codeStub}
                                                onChange={e => setCodeStub(e.target.value)}
                                                spellCheck={false}
                                            />
                                        </motion.div>
                                    )}

                                    {(qType === 'single_choice' || qType === 'multiple_choice') && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Options (click letter to mark correct)</label>
                                            {options.map((opt, idx) => (
                                                <div key={idx} className="relative">
                                                    <div
                                                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer
                                                        ${(qType === 'single_choice' ? correctOption === idx : correctOptions.includes(idx))
                                                                ? 'bg-green-500 border-green-500 text-white'
                                                                : 'bg-muted border-border text-muted-foreground hover:border-foreground'}`}
                                                        onClick={() => {
                                                            if (qType === 'single_choice') setCorrectOption(idx);
                                                            else setCorrectOptions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                                                        }}
                                                    >
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <input
                                                        className={`w-full bg-background border rounded-xl py-3 pl-14 pr-4 text-sm focus:border-primary outline-none transition-all
                                                        ${(qType === 'single_choice' ? correctOption === idx : correctOptions.includes(idx))
                                                                ? 'border-green-500/50 bg-green-500/5'
                                                                : 'border-border'}`}
                                                        placeholder={`Option ${idx + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...options];
                                                            newOpts[idx] = e.target.value;
                                                            setOptions(newOpts);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {qType === 'fill_in_the_blank' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Correct Answer</label>
                                            <input
                                                className="w-full bg-background border border-border rounded-xl p-4 text-sm font-bold focus:border-primary outline-none"
                                                placeholder="The correct answer matching exactly..."
                                                value={correctAnswerText}
                                                onChange={e => setCorrectAnswerText(e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Save Button */}
                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={() => router.back()}
                                        className="flex-1 py-3.5 px-6 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveQuestion}
                                        disabled={!text.trim() || !division}
                                        className="flex-1 py-3.5 px-6 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Save Question
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
