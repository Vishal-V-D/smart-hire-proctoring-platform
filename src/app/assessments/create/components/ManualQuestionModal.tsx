import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, PenTool, Upload, X, Code, Type, List, CheckSquare, Image as ImageIcon, Trash2, Database, Search, Filter, ChevronLeft, ChevronRight, Download, Archive, FileText, Zap, Loader2 } from 'lucide-react';
import { Question, SectionType, QuestionType } from '../types';
import { questionBankService, QuestionBankQuestion, QuestionBankFilters, FilterOptions } from '@/api/questionBankService';

interface ManualQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questions: Question | Question[]) => void;
    type: SectionType;
    division?: string;
    subdivision?: string;
}

const ManualQuestionModal: React.FC<ManualQuestionModalProps> = ({ isOpen, onClose, onSave, type, division, subdivision }) => {
    const [activeTab, setActiveTab] = useState<'manual' | 'file' | 'bank' | 'randomize'>('bank');
    const [qType, setQType] = useState<QuestionType>('single_choice');

    // Randomize State
    const [randomCount, setRandomCount] = useState(5);
    const [randomDifficulty, setRandomDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
    const [isRandomizing, setIsRandomizing] = useState(false);

    // Question Bank State
    const [bankQuestions, setBankQuestions] = useState<QuestionBankQuestion[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [filters, setFilters] = useState<QuestionBankFilters>({
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [isLoadingBank, setIsLoadingBank] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());

    // Form State
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>(['', '', '', '']);
    const [correctOption, setCorrectOption] = useState<number>(0);
    const [correctOptions, setCorrectOptions] = useState<number[]>([]);
    const [correctAnswerText, setCorrectAnswerText] = useState('');
    const [codeStub, setCodeStub] = useState('// Write your solution here\nfunction solve(input) {\n    return input;\n}');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkUploadRef = useRef<HTMLInputElement>(null);

    // Bulk Upload State
    const [uploadDivision, setUploadDivision] = useState('');
    const [uploadSubdivision, setUploadSubdivision] = useState('');
    const [uploadTopic, setUploadTopic] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dynamicSubdivisions, setDynamicSubdivisions] = useState<string[]>([]);

    // Determine available types based on Section Type
    const availableTypes: QuestionType[] = type === 'coding'
        ? ['coding']
        : ['single_choice', 'multiple_choice', 'fill_in_the_blank'];

    useEffect(() => {
        if (isOpen) {
            // Reset to default valid type for this section
            if (type === 'coding') setQType('coding');
            else setQType('single_choice');
            resetForm();

            // Clear previous data and show loading state
            setBankQuestions([]);
            setFilterOptions(null);
            setSelectedBankQuestions(new Set());
            setIsLoadingBank(true);

            // Debug: Log received props
            console.log('🎯 ManualQuestionModal opened with props:');
            console.log('   - type:', type);
            console.log('   - division:', division);
            console.log('   - subdivision:', subdivision);

            // Fetch filter options filtered by division (for cascading dropdowns)
            fetchFilterOptions(division);

            // Filter by question type based on section type:
            // - Coding sections: only show 'coding' type questions
            // - Other sections: show MCQ types ('single_choice', 'multiple_choice', 'fill_in_the_blank')
            const questionTypeFilter = type === 'coding' ? 'coding' : undefined;

            const newFilters: QuestionBankFilters = {
                page: 1,
                limit: 20,
                division: division || undefined,
                type: questionTypeFilter
            };

            console.log('🔍 Setting filters:', newFilters);
            setFilters(newFilters);

            // Set upload division based on section context
            setUploadDivision(division || '');
            setUploadSubdivision(subdivision || '');

            // If division is present, fetch its subdivisions immediately
            if (division) {
                fetchSubdivisionsForDivision(division);
            }

            // Update filters with subdivision if present
            setFilters(prev => ({
                ...prev,
                subdivision: subdivision || undefined
            }));
        }
    }, [isOpen, type, division, subdivision]);

    const fetchSubdivisionsForDivision = async (div: string) => {
        try {
            const res = await questionBankService.getFilterOptions(div);
            setDynamicSubdivisions(res.data.subdivisions);
        } catch (error) {
            console.error('Failed to fetch subdivisions:', error);
        }
    };

    // Fetch questions when filters change
    useEffect(() => {
        if (activeTab === 'bank' && isOpen) {
            fetchQuestions();
        }
    }, [filters, activeTab, isOpen]);

    // Debug: Log state changes
    useEffect(() => {
        console.log('🔄 State Update - bankQuestions:', bankQuestions);
        console.log('🔄 State Update - bankQuestions.length:', bankQuestions.length);
        console.log('🔄 State Update - isLoadingBank:', isLoadingBank);
        console.log('🔄 State Update - pagination:', pagination);
    }, [bankQuestions, isLoadingBank, pagination]);

    // Fetch filter options (with optional division for cascading filters)
    const fetchFilterOptions = async (forDivision?: string) => {
        try {
            console.log('🔍 Fetching filter options for division:', forDivision || 'ALL');
            const response = await questionBankService.getFilterOptions(forDivision);
            console.log('✅ Filter options response:', response);
            console.log('📊 Filter options data:', response.data);
            console.log('   📁 Divisions:', response.data?.divisions);
            console.log('   📂 Subdivisions:', response.data?.subdivisions);
            console.log('   📝 Topics:', response.data?.topics);
            console.log('   🏷️ Tags:', response.data?.tags);
            setFilterOptions(response.data);
        } catch (error) {
            console.error('❌ Failed to fetch filter options:', error);
        }
    };

    // Fetch questions from bank
    const fetchQuestions = async () => {
        setIsLoadingBank(true);
        try {
            console.log('🔍 Fetching questions with filters:', filters);
            const response = await questionBankService.listQuestions(filters);
            console.log('✅ Questions response:', response);
            console.log('📊 Response data:', response.data);
            console.log('📝 Questions array:', response.data?.questions);
            console.log('📄 Pagination:', response.data?.pagination);

            setBankQuestions(response.data.questions || []);
            setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('❌ Failed to fetch questions:', error);
            setBankQuestions([]);
        } finally {
            setIsLoadingBank(false);
        }
    };

    const handleRandomize = async () => {
        if (randomCount <= 0) return;
        setIsRandomizing(true);
        try {
            // Determine type filter based on section
            const questionTypeFilter = type === 'coding' ? 'coding' : undefined;

            // Fetch a larger pool to randomize from
            const response = await questionBankService.listQuestions({
                page: 1,
                limit: 100, // Fetch up to 100 to sample from
                division: division || undefined,
                subdivision: subdivision || undefined,
                difficulty: randomDifficulty || undefined,
                type: questionTypeFilter
            });

            const pool = response.data.questions || [];

            if (pool.length === 0) {
                alert('No questions found matching your criteria.');
                setIsRandomizing(false);
                return;
            }

            // Shuffle
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, randomCount);

            console.log(`🎲 Randomly selected ${selected.length} questions from pool of ${pool.length}`);

            // Import
            const importedQuestions: Question[] = selected.map(bankQ => ({
                id: crypto.randomUUID(),
                text: bankQ.text || '',
                image: bankQ.image || undefined,
                type: bankQ.type,
                options: bankQ.options || undefined,
                correctAnswer: bankQ.correctAnswer || undefined,
                marks: bankQ.marks || 1,
                codeStub: (bankQ as any).codeStub || undefined,
                problemData: (bankQ as any).problemData || (bankQ as any).data || undefined,
                pseudocode: (bankQ as any).pseudocode || undefined
            }));

            onSave(importedQuestions);
            onClose();

        } catch (error) {
            console.error("Randomize failed:", error);
            alert("Failed to fetch random questions.");
        } finally {
            setIsRandomizing(false);
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

    const handleSave = () => {
        if (activeTab === 'manual') {
            if (!text.trim()) return;

            const newQuestion: Question = {
                id: crypto.randomUUID(),
                text,
                image: image || undefined, // Add image if present
                type: qType,
                marks: type === 'coding' ? 10 : 1
            };

            if (qType === 'single_choice') {
                newQuestion.options = options;
                newQuestion.correctAnswer = String(correctOption);
            } else if (qType === 'multiple_choice') {
                newQuestion.options = options;
                newQuestion.correctAnswer = correctOptions.map(String);
            } else if (qType === 'fill_in_the_blank') {
                newQuestion.correctAnswer = correctAnswerText;
            } else if (qType === 'coding') {
                newQuestion.codeStub = codeStub;
            }

            onSave(newQuestion);
            onClose();
        } else if (activeTab === 'bank') {
            // Import selected questions from bank - pass all at once
            const selectedQuestions = bankQuestions.filter(q => selectedBankQuestions.has(q.id));
            console.log('📥 Importing questions:', selectedQuestions);

            const importedQuestions: Question[] = selectedQuestions.map(bankQ => {
                console.log('📥 Bank question:', bankQ);

                const importedQuestion: Question = {
                    id: crypto.randomUUID(), // Generate new ID for local use
                    text: bankQ.text || '',
                    image: bankQ.image || undefined,
                    type: bankQ.type,
                    options: bankQ.options || undefined,
                    correctAnswer: bankQ.correctAnswer || undefined,
                    marks: bankQ.marks || 1,
                    codeStub: (bankQ as any).codeStub || undefined,
                    problemData: (bankQ as any).problemData || (bankQ as any).data || undefined,
                    pseudocode: (bankQ as any).pseudocode || undefined
                };

                console.log('📥 Imported question:', importedQuestion);
                return importedQuestion;
            });

            // Pass all questions at once
            onSave(importedQuestions);
            setSelectedBankQuestions(new Set());
            onClose();
        } else {
            console.log("File Upload not implemented");
            onClose();
        }
    };

    const resetForm = () => {
        setText('');
        setImage(null);
        setOptions(['', '', '', '']);
        setCorrectOption(0);
        setCorrectOptions([]);
        setCorrectAnswerText('');
        // Keep code stub defaults
    };

    const getTypeIcon = (t: QuestionType) => {
        switch (t) {
            case 'coding': return <Code size={16} />;
            case 'single_choice': return <List size={16} />;
            case 'multiple_choice': return <CheckSquare size={16} />;
            case 'fill_in_the_blank': return <Type size={16} />;
        }
    };

    // Handle bulk file upload
    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadDivision) {
            alert('Please select a division and file');
            return;
        }

        setIsUploading(true);
        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'csv') {
                await questionBankService.uploadCSV(file, uploadDivision, uploadSubdivision, uploadTopic);
                alert('CSV uploaded successfully!');
            } else if (fileExtension === 'zip') {
                await questionBankService.uploadZIP(file, uploadDivision, uploadSubdivision, uploadTopic);
                alert('ZIP uploaded successfully!');
            } else {
                alert('Please upload a CSV or ZIP file');
                return;
            }

            // Refresh question bank
            fetchQuestions();
            setActiveTab('bank');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-5xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            Add Question <span className="text-muted-foreground text-sm font-normal">to {division || type} section</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border shrink-0">
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'bank' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Database size={16} /> Question Bank
                    </button>
                    <button
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'file' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Upload size={16} /> Bulk Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <PenTool size={16} /> Manual Input
                    </button>
                    <button
                        onClick={() => setActiveTab('randomize')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'randomize' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                    >
                        <Zap size={16} /> Randomize
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'randomize' && (
                        <div className="p-4 max-w-2xl mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold">Random Question Generator</h3>
                                <p className="text-muted-foreground">Automatically select {division || 'questions'} based on your criteria</p>
                            </div>

                            <div className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Number of Questions</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={randomCount}
                                            onChange={(e) => setRandomCount(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="w-12 h-10 border border-border rounded-lg flex items-center justify-center font-bold text-lg bg-background">
                                            {randomCount}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Difficulty</label>
                                        <select
                                            value={randomDifficulty}
                                            onChange={(e) => setRandomDifficulty(e.target.value as any)}
                                            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                                        >
                                            <option value="">Any Difficulty</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subdivision</label>
                                        <input
                                            type="text"
                                            value={subdivision || "Any Subdivision"}
                                            disabled
                                            className="w-full p-2.5 rounded-lg border border-border bg-muted/50 text-sm outline-none text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
                                    <p><strong>Note:</strong> This will select unique questions from the bank matching:
                                        <br />• Division: {division || 'Any'}
                                        <br />• Subdivision: {subdivision || 'Any'}
                                        <br />• Type: {type === 'coding' ? 'Coding' : 'MCQ/Fill-in'}
                                    </p>
                                </div>

                                <button
                                    onClick={handleRandomize}
                                    disabled={isRandomizing}
                                    className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isRandomizing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Generating Selection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={20} fill="currentColor" />
                                            Generate & Add Questions
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'manual' ? (
                        <div className="space-y-6">

                            {/* Type Selector (Only if more than 1 options) */}
                            {availableTypes.length > 1 && (
                                <div className="flex gap-2 p-1 bg-muted/30 rounded-lg overflow-x-auto">
                                    {availableTypes.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setQType(t)}
                                            className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${qType === t ? 'bg-background shadow-sm text-primary ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {getTypeIcon(t)} {t.replace(/_/g, ' ').toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Question Text & Image */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Question Text</label>
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
                                        className="w-full bg-muted/20 border border-border rounded-xl p-4 text-sm min-h-[100px] focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-y"
                                        placeholder="Enter the question statement..."
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        autoFocus
                                    />

                                    {/* Image Preview */}
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
                            </div>

                            {/* Dynamic Inputs based on Type */}
                            <AnimatePresence mode="wait">
                                {qType === 'coding' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Initial Code Stub</label>
                                        <div className="relative">
                                            <Code className="absolute top-3 right-3 text-muted-foreground opacity-50" size={16} />
                                            <textarea
                                                className="w-full bg-zinc-950 text-emerald-400 font-mono text-xs border border-border rounded-xl p-4 min-h-[150px] focus:border-primary outline-none custom-scrollbar"
                                                value={codeStub}
                                                onChange={e => setCodeStub(e.target.value)}
                                                spellCheck={false}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {(qType === 'single_choice' || qType === 'multiple_choice') && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-3">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Options</label>
                                        {options.map((opt, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold transition-colors cursor-pointer
                                                    ${(qType === 'single_choice' ? correctOption === idx : correctOptions.includes(idx))
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'bg-muted border-border text-muted-foreground hover:border-foreground'}`}
                                                    onClick={() => {
                                                        if (qType === 'single_choice') setCorrectOption(idx);
                                                        else {
                                                            setCorrectOptions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                                                        }
                                                    }}
                                                >
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <input
                                                    className={`w-full bg-muted/20 border rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all
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
                                            className="w-full bg-muted/20 border border-border rounded-xl p-4 text-sm font-bold focus:border-primary outline-none"
                                            placeholder="The correct answer matching exactly..."
                                            value={correctAnswerText}
                                            onChange={e => setCorrectAnswerText(e.target.value)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : activeTab === 'file' ? (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center py-4">
                                <Upload size={40} className="mx-auto text-primary mb-3" />
                                <h3 className="text-lg font-bold text-foreground mb-1">Bulk Upload Questions</h3>
                                <p className="text-sm text-muted-foreground">Import multiple questions via CSV or ZIP files</p>
                            </div>

                            {/* Division Selection */}
                            <div>
                                <label className="text-sm font-bold text-foreground mb-2 block">
                                    Main Division (Section) <span className="text-xs text-muted-foreground font-normal">(Auto-Locked)</span>
                                </label>
                                <input
                                    type="text"
                                    value={uploadDivision}
                                    disabled
                                    className="w-full bg-muted border border-border rounded-lg py-2.5 px-3 text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Questions will be added to the <strong>{uploadDivision}</strong> section.</p>
                            </div>

                            {/* Subdivision Selection */}
                            <div>
                                <label className="text-sm font-bold text-foreground mb-2 block">
                                    Subdivision (Topic) <span className="text-muted-foreground font-normal">(Optional if 'Subtopic' column exists)</span>
                                </label>
                                <input
                                    type="text"
                                    list="subdivisions-list-modal"
                                    value={uploadSubdivision}
                                    onChange={(e) => setUploadSubdivision(e.target.value)}
                                    placeholder={`e.g. OS, Select for ${uploadDivision}...`}
                                    className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                />
                                <datalist id="subdivisions-list-modal">
                                    {dynamicSubdivisions.map((sub, idx) => (
                                        <option key={idx} value={sub} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {subdivision ? `Auto-selected based on current section: ${subdivision}` : 'Select or type a main topic/subtype'}
                                </p>
                            </div>

                            {/* Topic Selection */}
                            <div>
                                <label className="text-sm font-bold text-foreground mb-2 block">
                                    Specific Topic <span className="text-muted-foreground font-normal">(Optional if 'Topic' column exists)</span>
                                </label>
                                <input
                                    type="text"
                                    list="topics-list-modal"
                                    value={uploadTopic}
                                    onChange={(e) => setUploadTopic(e.target.value)}
                                    placeholder="e.g. Arrays, Pointers, Profit & Loss..."
                                    className="w-full bg-background border border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary outline-none"
                                />
                                <datalist id="topics-list-modal">
                                    {/* Show subdivisions as topics suggestions too, as requested */}
                                    {dynamicSubdivisions.map((sub, idx) => (
                                        <option key={`sub-${idx}`} value={sub} />
                                    ))}
                                    {/* Also include specific topics if available */}
                                    {filterOptions?.topics?.map((top, idx) => (
                                        <option key={`top-${idx}`} value={top} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-muted-foreground mt-1">Select or type a specific topic</p>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CSV Format Card */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                        <FileText size={16} /> CSV Format
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload text-only questions without images</p>

                                    <div className="bg-background/80 rounded-lg p-3 space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Required Columns:</p>
                                        <div className="text-xs text-foreground font-mono space-y-1">
                                            <div>• <span className="text-emerald-600">Topic</span> - Question topic</div>
                                            <div>• <span className="text-emerald-600">Subtopic</span> - Sub-category</div>
                                            <div>• <span className="text-emerald-600">Level</span> - easy/medium/hard</div>
                                            <div>• <span className="text-emerald-600">Question</span> - Question text</div>
                                            <div>• <span className="text-emerald-600">Options (JSON)</span> - {"'{\"1\":\"...\",\"2\":\"...\"...}'"}</div>
                                            <div>• <span className="text-emerald-600">Solution</span> - Correct option (1-4)</div>
                                        </div>
                                    </div>

                                    <a
                                        href="/CS_Fundamentals_50_MCQs.csv"
                                        download
                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Download size={14} /> Download Sample CSV
                                    </a>
                                </div>

                                {/* ZIP Format Card */}
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                        <Archive size={16} /> ZIP Format
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload questions with images (max 25MB)</p>

                                    <div className="bg-background/80 rounded-lg p-3 space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Folder Structure:</p>
                                        <div className="text-xs font-mono text-foreground bg-zinc-900 text-zinc-300 rounded p-2">
                                            <div>📦 questions.zip</div>
                                            <div className="pl-4">├── 📄 questions.csv</div>
                                            <div className="pl-4">└── 📁 images/</div>
                                            <div className="pl-8">├── q1.png</div>
                                            <div className="pl-8">├── q2.jpg</div>
                                            <div className="pl-8">└── ...</div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-muted-foreground space-y-1">
                                        <div>• Reference images as <code className="bg-muted px-1 rounded">images/filename.png</code></div>
                                        <div>• Supported: PNG, JPG, JPEG, GIF, WebP</div>
                                        <div>• Max size: <span className="font-bold text-blue-600">25MB</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Button */}
                            <div className="pt-2">
                                <input
                                    ref={bulkUploadRef}
                                    type="file"
                                    accept=".csv,.zip"
                                    onChange={handleBulkUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => bulkUploadRef.current?.click()}
                                    disabled={!uploadDivision || isUploading}
                                    className="w-full py-3.5 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Choose File (CSV or ZIP)
                                        </>
                                    )}
                                </button>
                                {!uploadDivision && (
                                    <p className="text-xs text-amber-600 mt-2 text-center">
                                        ⚠️ Select a division first to upload
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'bank' ? (
                        <div className="space-y-4 h-full flex flex-col">
                            {/* Filters Section */}
                            <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                    <Filter size={14} /> Filters
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Search */}
                                    <div className="col-span-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search questions..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setFilters({ ...filters, search: e.target.value, page: 1 });
                                                }}
                                                className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Division Filter */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Division</label>
                                        <select
                                            value={filters.division || ''}
                                            onChange={(e) => {
                                                const newDiv = e.target.value || undefined;
                                                setFilters({ ...filters, division: newDiv, page: 1 });
                                                // Refresh filter options for the new division context
                                                fetchFilterOptions(newDiv);
                                            }}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                        >
                                            <option value="">All Divisions</option>
                                            {filterOptions?.divisions?.map((div, idx) => (
                                                <option key={idx} value={div}>{div}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subdivision Filter */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Subdivision</label>
                                        <select
                                            value={filters.subdivision || ''}
                                            onChange={(e) => setFilters({ ...filters, subdivision: e.target.value || undefined, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                            disabled={!!subdivision} // Lock if passed from props
                                        >
                                            <option value="">All Subdivisions</option>
                                            {filterOptions?.subdivisions.map((sub, idx) => (
                                                <option key={idx} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Topic Filter */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Topic</label>
                                        <select
                                            value={filters.topic || ''}
                                            onChange={(e) => setFilters({ ...filters, topic: e.target.value || undefined, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                        >
                                            <option value="">All Topics</option>
                                            {filterOptions?.topics?.map((topic, idx) => (
                                                <option key={idx} value={topic}>{topic}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Difficulty Filter */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Difficulty</label>
                                        <select
                                            value={filters.difficulty || ''}
                                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as any, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                        >
                                            <option value="">All</option>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Type Filter - Only show relevant types based on section */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                                        <select
                                            value={filters.type || ''}
                                            onChange={(e) => setFilters({ ...filters, type: e.target.value as any, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                            disabled={type === 'coding'} // Disable for coding sections as only coding type is valid
                                        >
                                            {type === 'coding' ? (
                                                <option value="coding">Coding</option>
                                            ) : (
                                                <>
                                                    <option value="">All Types</option>
                                                    <option value="single_choice">Single Choice</option>
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="fill_in_the_blank">Fill in the Blank</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Tags Filter */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tags</label>
                                        <select
                                            value={filters.tags?.[0] || ''}
                                            onChange={(e) => setFilters({ ...filters, tags: e.target.value ? [e.target.value] : undefined, page: 1 })}
                                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                                        >
                                            <option value="">All Tags</option>
                                            {filterOptions?.tags?.map((tag, idx) => (
                                                <option key={idx} value={tag}>{tag}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Clear Filters */}
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                // Reset filters but keep type filter based on section type
                                                setFilters({
                                                    page: 1,
                                                    limit: 20,
                                                    division: division || undefined,
                                                    type: type === 'coding' ? 'coding' : undefined
                                                });
                                            }}
                                            className="w-full py-2 px-3 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>


                            </div>

                            {/* Questions List */}
                            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                                {(() => {
                                    console.log('🎨 Rendering questions list - isLoadingBank:', isLoadingBank, 'bankQuestions.length:', bankQuestions.length);
                                    return null;
                                })()}
                                {isLoadingBank ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground">Loading questions...</p>
                                        </div>
                                    </div>
                                ) : bankQuestions.length === 0 ? (
                                    <div className="flex items-center justify-center py-20 border-2 border-dashed border-border rounded-xl">
                                        <div className="text-center">
                                            <Database size={40} className="mx-auto text-muted-foreground/50 mb-3" />
                                            <p className="text-sm font-bold text-foreground">No questions found</p>
                                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                                        </div>
                                    </div>
                                ) : (
                                    bankQuestions.map((q) => {
                                        const isSelected = selectedBankQuestions.has(q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                onClick={() => {
                                                    const newSet = new Set(selectedBankQuestions);
                                                    if (isSelected) {
                                                        newSet.delete(q.id);
                                                    } else {
                                                        newSet.add(q.id);
                                                    }
                                                    setSelectedBankQuestions(newSet);
                                                }}
                                                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border bg-card hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                        ? 'bg-primary border-primary'
                                                        : 'border-muted-foreground/30'
                                                        }`}>
                                                        {isSelected && <CheckCircle size={12} className="text-primary-foreground" />}
                                                    </div>

                                                    {/* Question Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">
                                                                {q.text}
                                                            </p>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {getTypeIcon(q.type)}
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-600' :
                                                                    q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-600' :
                                                                        'bg-red-500/10 text-red-600'
                                                                    }`}>
                                                                    {q.difficulty}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Image Preview - Only show if image exists and is valid */}
                                                        {q.image && q.image.trim() !== '' && q.image !== 'null' && q.image !== 'undefined' && (
                                                            <img
                                                                src={q.image}
                                                                alt="Question"
                                                                className="w-20 h-20 object-cover rounded-lg border border-border mb-2"
                                                                onError={(e) => {
                                                                    // Hide image if it fails to load
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        )}

                                                        {/* Meta Info */}
                                                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                                            <span className="px-2 py-0.5 bg-muted rounded">{q.topic}</span>
                                                            <span className="px-2 py-0.5 bg-muted rounded">{q.type.replace(/_/g, ' ')}</span>
                                                            <span className="px-2 py-0.5 bg-muted rounded">{q.marks} marks</span>
                                                            {(q.tags || []).slice(0, 2).map((tag, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pagination */}
                            {!isLoadingBank && bankQuestions.length > 0 && (
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                                            disabled={pagination.page === 1}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs font-bold px-3">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer group">
                            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h4 className="font-bold text-foreground text-lg">Click to upload</h4>
                            <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">Supported formats: .csv, .xlsx<br />Max file size: 5MB</p>
                            <button className="mt-8 px-5 py-2.5 bg-background border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors shadow-sm">
                                Download Template
                            </button>
                        </div>
                    )}
                </div>


                {/* Footer */}
                <div className="p-5 border-t border-border bg-muted/30 flex justify-between items-center gap-4 shrink-0">
                    <div>
                        {activeTab === 'bank' && selectedBankQuestions.size > 0 && (
                            <span className="text-sm font-bold text-primary">
                                {selectedBankQuestions.size} question{selectedBankQuestions.size !== 1 ? 's' : ''} selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={activeTab === 'bank' && selectedBankQuestions.size === 0}
                            className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={16} /> {activeTab === 'bank' ? 'Import Selected' : 'Save Question'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ManualQuestionModal;
