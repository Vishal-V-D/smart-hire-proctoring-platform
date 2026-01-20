import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Database, AlertCircle, Edit, FileJson, Plus, Trash2 } from 'lucide-react';
import { SQLQuestion, sqlQuestionService } from '@/api/sqlQuestionService';

interface SQLQuestionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: SQLQuestion | null;
    onSave: () => void;
}

const SQLQuestionEditModal: React.FC<SQLQuestionEditModalProps> = ({ isOpen, onClose, question, onSave }) => {
    const [formData, setFormData] = useState<Partial<SQLQuestion>>({
        title: '',
        description: '',
        dialect: 'mysql',
        difficulty: 'Easy',
        topic: '',
        tags: [],
        hint: '',
        inputTables: '',
        expectedResult: '',
        expectedQuery: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditingInputTables, setIsEditingInputTables] = useState(false);
    const [isEditingExpectedResult, setIsEditingExpectedResult] = useState(false);

    useEffect(() => {
        if (question && isOpen) {
            setFormData({
                title: question.title || '',
                description: question.description || '',
                dialect: question.dialect || 'mysql',
                difficulty: question.difficulty || 'Easy',
                topic: question.topic || '',
                tags: question.tags || [],
                hint: question.hint || '',
                inputTables: typeof question.inputTables === 'string' ? question.inputTables : JSON.stringify(question.inputTables, null, 2),
                expectedResult: typeof question.expectedResult === 'string' ? question.expectedResult : JSON.stringify(question.expectedResult, null, 2),
                expectedQuery: question.expectedQuery || ''
            });
            setError(null);
        }
    }, [question, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question?.id) return;

        setIsSaving(true);
        setError(null);

        try {
            // Validate JSON fields
            let inputTables = formData.inputTables;
            let expectedResult = formData.expectedResult;

            if (inputTables) {
                try {
                    JSON.parse(inputTables as string);
                } catch {
                    setError('Invalid JSON format in Input Tables');
                    setIsSaving(false);
                    return;
                }
            }

            if (expectedResult) {
                try {
                    JSON.parse(expectedResult as string);
                } catch {
                    setError('Invalid JSON format in Expected Result');
                    setIsSaving(false);
                    return;
                }
            }

            await sqlQuestionService.updateQuestion(question.id, formData);
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update question');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to render table preview
    const renderTablePreview = (jsonString: string | undefined, title: string) => {
        if (!jsonString) return null;

        try {
            const data = JSON.parse(jsonString);
            let tablesToRender: any[] = [];

            if (Array.isArray(data)) {
                if (data.length > 0) {
                    const firstItem = data[0];
                    if (firstItem && typeof firstItem === 'object' && 'rows' in firstItem && 'columns' in firstItem) {
                        tablesToRender = data;
                    } else {
                        const columns = firstItem ? Object.keys(firstItem) : [];
                        tablesToRender = [{ name: title, columns, rows: data }];
                    }
                }
            } else if (data && typeof data === 'object') {
                if ('rows' in data && 'columns' in data) {
                    tablesToRender = [data];
                }
            }

            if (tablesToRender.length === 0) return null;

            return (
                <div className="space-y-3 mt-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Preview</p>
                    {tablesToRender.map((table: any, idx: number) => (
                        <div key={idx} className="rounded-lg border overflow-hidden bg-card shadow-sm">
                            <div className="px-3 py-2 text-xs font-bold border-b flex items-center gap-2 bg-muted">
                                <Database size={12} />
                                <span className="font-mono">{table.name || 'Table'}</span>
                                {table.rows && <span className="text-[10px] opacity-60 font-normal">({table.rows.length} rows)</span>}
                            </div>
                            <div className="overflow-x-auto max-h-48">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                <th key={cIdx} className="px-3 py-2 text-left font-mono font-semibold border-b">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows && table.rows.map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                    <td key={cIdx} className="px-3 py-2 font-mono">
                                                        {row[col] !== undefined ? String(row[col]) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            return (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
                    Invalid JSON format
                </div>
            );
        }
    };

    // Helper to render editable table
    const renderEditableTable = (jsonString: string | undefined, onChange: (value: string) => void) => {
        if (!jsonString) return null;

        try {
            const data = JSON.parse(jsonString);
            let tablesToRender: any[] = [];

            if (Array.isArray(data)) {
                if (data.length > 0) {
                    const firstItem = data[0];
                    if (firstItem && typeof firstItem === 'object' && 'rows' in firstItem && 'columns' in firstItem) {
                        tablesToRender = data;
                    }
                }
            }

            if (tablesToRender.length === 0) return null;

            const updateTableData = (tableIndex: number, rowIndex: number, colName: string, value: string) => {
                const updatedTables = [...tablesToRender];
                updatedTables[tableIndex].rows[rowIndex][colName] = value;
                onChange(JSON.stringify(updatedTables, null, 2));
            };

            const addRow = (tableIndex: number) => {
                const updatedTables = [...tablesToRender];
                const newRow: any = {};
                updatedTables[tableIndex].columns.forEach((col: string) => {
                    newRow[col] = '';
                });
                updatedTables[tableIndex].rows.push(newRow);
                onChange(JSON.stringify(updatedTables, null, 2));
            };

            const deleteRow = (tableIndex: number, rowIndex: number) => {
                const updatedTables = [...tablesToRender];
                updatedTables[tableIndex].rows.splice(rowIndex, 1);
                onChange(JSON.stringify(updatedTables, null, 2));
            };

            return (
                <div className="space-y-4 mt-3">
                    {tablesToRender.map((table: any, tableIdx: number) => (
                        <div key={tableIdx} className="rounded-lg border overflow-hidden bg-card shadow-sm">
                            <div className="px-3 py-2 text-xs font-bold border-b flex items-center justify-between bg-muted">
                                <div className="flex items-center gap-2">
                                    <Database size={12} />
                                    <span className="font-mono">{table.name || 'Table'}</span>
                                    <span className="text-[10px] opacity-60 font-normal">({table.rows.length} rows)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addRow(tableIdx)}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                                >
                                    <Plus size={12} />
                                    <span className="text-[10px] font-bold">Add Row</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                <th key={cIdx} className="px-3 py-2 text-left font-mono font-semibold border-b">
                                                    {col}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2 text-left font-semibold border-b w-16">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows && table.rows.map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                    <td key={cIdx} className="px-2 py-1">
                                                        <input
                                                            type="text"
                                                            value={row[col] !== undefined ? String(row[col]) : ''}
                                                            onChange={(e) => updateTableData(tableIdx, rIdx, col, e.target.value)}
                                                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs font-mono focus:border-primary outline-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-2 py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteRow(tableIdx, rIdx)}
                                                        className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                                        title="Delete Row"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            return (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
                    Invalid JSON format - switch to JSON view to fix
                </div>
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Database size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Edit SQL Question</h3>
                            <p className="text-xs text-muted-foreground">Update question details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-600">
                            <AlertCircle size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none min-h-[120px]"
                            required
                        />
                    </div>

                    {/* Row: Dialect, Difficulty, Topic */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Dialect *</label>
                            <select
                                value={formData.dialect}
                                onChange={(e) => setFormData({ ...formData, dialect: e.target.value as any })}
                                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none"
                            >
                                <option value="mysql">MySQL</option>
                                <option value="postgresql">PostgreSQL</option>
                                <option value="sql">SQL</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Difficulty *</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Topic</label>
                            <input
                                type="text"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* Input Tables (JSON) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-foreground">Input Tables</label>
                            <button
                                type="button"
                                onClick={() => setIsEditingInputTables(!isEditingInputTables)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                            >
                                {isEditingInputTables ? (
                                    <>
                                        <FileJson size={14} />
                                        JSON View
                                    </>
                                ) : (
                                    <>
                                        <Edit size={14} />
                                        Table Editor
                                    </>
                                )}
                            </button>
                        </div>
                        {!isEditingInputTables ? (
                            <>
                                <textarea
                                    value={formData.inputTables as string}
                                    onChange={(e) => setFormData({ ...formData, inputTables: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none min-h-[120px] font-mono"
                                    placeholder='[{"name": "users", "columns": ["id", "name"], "rows": [...]}]'
                                />
                                {renderTablePreview(formData.inputTables as string, 'Input Tables')}
                            </>
                        ) : (
                            renderEditableTable(formData.inputTables as string, (value) => setFormData({ ...formData, inputTables: value }))
                        )}
                    </div>

                    {/* Expected Result (JSON) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-foreground">Expected Result</label>
                            <button
                                type="button"
                                onClick={() => setIsEditingExpectedResult(!isEditingExpectedResult)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                            >
                                {isEditingExpectedResult ? (
                                    <>
                                        <FileJson size={14} />
                                        JSON View
                                    </>
                                ) : (
                                    <>
                                        <Edit size={14} />
                                        Table Editor
                                    </>
                                )}
                            </button>
                        </div>
                        {!isEditingExpectedResult ? (
                            <>
                                <textarea
                                    value={formData.expectedResult as string}
                                    onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none min-h-[120px] font-mono"
                                    placeholder='[{"id": 1, "name": "John"}]'
                                />
                                {renderTablePreview(formData.expectedResult as string, 'Expected Result')}
                            </>
                        ) : (
                            renderEditableTable(formData.expectedResult as string, (value) => setFormData({ ...formData, expectedResult: value }))
                        )}
                    </div>

                    {/* Expected Query */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Expected Query (Solution)</label>
                        <textarea
                            value={formData.expectedQuery}
                            onChange={(e) => setFormData({ ...formData, expectedQuery: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none min-h-[80px] font-mono"
                            placeholder="SELECT * FROM users WHERE id = 1"
                        />
                    </div>

                    {/* Hint */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Hint</label>
                        <textarea
                            value={formData.hint}
                            onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg py-2.5 px-4 text-sm focus:border-primary outline-none min-h-[80px]"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SQLQuestionEditModal;
