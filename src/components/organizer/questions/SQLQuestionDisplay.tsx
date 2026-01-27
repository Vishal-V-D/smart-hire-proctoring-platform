import React from 'react';
import { Database, Terminal, Code2, AlertCircle, Tag, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SQLQuestionDisplayProps {
    question: {
        title: string;
        description: string;
        dialect?: string;
        difficulty?: string;
        topic?: string;
        inputTables?: string | any;
        expectedResult?: string | any;
        expectedQuery?: string;
        hint?: string;
        tags?: string[];
        subdivision?: string;
        samples?: string | any;
        schemaSetup?: string;
    };
    className?: string;
}

const SQLQuestionDisplay: React.FC<SQLQuestionDisplayProps> = ({ question, className = '' }) => {
    // Helper to render tables (Schema & Expected Result)
    const renderTable = (identifier: string | any, title: string, icon: React.ReactNode, isExpected = false) => {
        try {
            const data = typeof identifier === 'string' ? JSON.parse(identifier) : identifier;
            let tablesToRender: any[] = [];

            if (Array.isArray(data)) {
                if (data.length > 0) {
                    const firstItem = data[0];
                    if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem) && 'rows' in firstItem && 'columns' in firstItem) {
                        tablesToRender = data;
                    } else {
                        // Raw output or array of arrays
                        let columns: string[] = [];
                        if (Array.isArray(firstItem)) {
                            columns = firstItem.map((_, i) => `Col ${i + 1}`);
                        } else if (typeof firstItem === 'object') {
                            columns = Object.keys(firstItem);
                        }

                        tablesToRender = [{
                            name: isExpected ? 'Result Set' : 'Table',
                            columns,
                            rows: data
                        }];
                    }
                }
            } else if (data && typeof data === 'object') {
                if ('rows' in data && 'columns' in data) {
                    tablesToRender = [data];
                }
                // Handle nested table structure: { table: { header: [...], rows: [...] } }
                else if (data.table && data.table.header && data.table.rows) {
                    tablesToRender = [{
                        name: data.name || data.table_name || 'Table',
                        info: data.info,
                        columns: data.table.header,
                        rows: data.table.rows
                    }];
                }
            }

            // Special handling for array of schema objects in the "inputTables" format
            // [{ table: {...}, name: "..." }, ...]
            if (Array.isArray(data) && data.length > 0 && data[0].table) {
                tablesToRender = data.map((d: any) => ({
                    name: d.name || d.table_name || 'Table',
                    info: d.info,
                    columns: d.table?.header || [],
                    rows: d.table?.rows || []
                }));
            }

            if (tablesToRender.length === 0) return null;

            return (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-600">
                        {icon} {title}
                    </h3>
                    <div className="space-y-4">
                        {tablesToRender.map((table: any, idx: number) => (
                            <div key={idx} className="rounded-lg border overflow-hidden bg-white border-gray-200 shadow-sm">
                                <div className="px-4 py-2.5 text-sm font-bold border-b flex flex-col gap-1 bg-gray-50 border-gray-200 text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{table.name || 'Table'}</span>
                                        {table.rows && <span className="text-[10px] opacity-60 font-normal">({table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'})</span>}
                                    </div>
                                    {table.info && (
                                        <div className="text-xs opacity-70 font-normal text-gray-600">
                                            {table.info}
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                    <th key={cIdx} className="px-4 py-2.5 text-left font-mono font-semibold border-b border-gray-200 text-gray-700">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.rows && table.rows.map((row: any, rIdx: number) => (
                                                <tr key={rIdx} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors">
                                                    {table.columns && table.columns.map((col: string, cIdx: number) => {
                                                        // Handle both object-based and array-based rows
                                                        let cellValue: any;
                                                        if (Array.isArray(row)) {
                                                            cellValue = row[cIdx];
                                                        } else {
                                                            cellValue = row[col];
                                                        }

                                                        return (
                                                            <td key={cIdx} className="px-4 py-2 font-mono text-gray-700">
                                                                {cellValue !== undefined ? String(cellValue) : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } catch (e) {
            console.error("Failed to render table:", e);
            return null;
        }
    };

    const renderSampleData = () => {
        if (!question.schemaSetup) return null;

        try {
            const insertRegex = /INSERT INTO\s+([`'"]?(\w+)[`'"]?)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gmi;
            const tables: any[] = [];
            let match;

            const regex = new RegExp(insertRegex);

            while ((match = regex.exec(question.schemaSetup)) !== null) {
                const tableName = match[2];
                const columns = match[3].split(',').map(c => c.trim().replace(/[`'"]/g, ''));
                const valuesBlock = match[4];

                const rows = valuesBlock.split(/\)\s*,\s*\(/).map(rowStr => {
                    let cleanRow = rowStr.trim();
                    if (cleanRow.startsWith('(')) cleanRow = cleanRow.substring(1);
                    if (cleanRow.endsWith(')')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);

                    return cleanRow.split(',').map(v => {
                        const val = v.trim();
                        if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
                        return val;
                    });
                });

                tables.push({ name: tableName, columns, rows });
            }

            if (tables.length === 0) return null;

            return (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-600">
                        <Database size={14} /> Sample Data
                    </h3>
                    <div className="space-y-4">
                        {tables.map((table: any, idx: number) => (
                            <div key={idx} className="rounded-lg border overflow-hidden bg-white border-gray-200 shadow-sm">
                                <div className="px-4 py-2.5 text-sm font-bold border-b flex flex-col gap-1 bg-gray-50 border-gray-200 text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{table.name}</span>
                                        {table.rows && <span className="text-[10px] opacity-60 font-normal">({table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'})</span>}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                    <th key={cIdx} className="px-4 py-2.5 text-left font-mono font-semibold border-b border-gray-200 text-gray-700">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.rows && table.rows.map((row: any, rIdx: number) => (
                                                <tr key={rIdx} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors">
                                                    {table.columns && table.columns.map((col: string, cIdx: number) => {
                                                        const cellValue = row[cIdx];
                                                        return (
                                                            <td key={cIdx} className="px-4 py-2 font-mono text-gray-700">
                                                                {cellValue !== undefined ? String(cellValue) : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } catch (e) {
            console.error("Failed to render sample data:", e);
            return null;
        }
    };

    const renderSamples = () => {
        if (!question.samples) return null;
        try {
            const samples = typeof question.samples === 'string' ? JSON.parse(question.samples) : question.samples;
            if (!Array.isArray(samples) || samples.length === 0) return null;

            return (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-600">
                        <Terminal size={14} /> Test Cases
                    </h3>
                    <div className="space-y-4">
                        {samples.map((sample: any, idx: number) => (
                            <div key={idx} className="rounded-lg border overflow-hidden bg-white border-gray-200 shadow-sm">
                                <div className="px-4 py-2 text-xs font-bold border-b opacity-70 flex justify-between bg-gray-100 border-gray-200 text-gray-900">
                                    <span>Case {idx + 1}</span>
                                </div>
                                <div className="p-3 space-y-3">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Input</div>
                                        <div className="p-2 rounded font-mono text-xs whitespace-pre-wrap bg-gray-50">{sample.input}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Output</div>
                                        <div className="p-2 rounded font-mono text-xs whitespace-pre-wrap bg-gray-50">{sample.output}</div>
                                    </div>
                                    {sample.explanation && (
                                        <div>
                                            <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Explanation</div>
                                            <div className="text-xs opacity-80">{sample.explanation}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } catch (e) {
            console.error("Failed to render samples:", e);
            return null;
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Info */}
            <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {question.difficulty && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${question.difficulty === 'Easy' ? 'bg-green-50 text-green-600 border-green-200' :
                            question.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                'bg-red-50 text-red-600 border-red-200'
                            }`}>
                            {question.difficulty}
                        </span>
                    )}
                    {question.dialect && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-600 border border-blue-200">
                            {question.dialect}
                        </span>
                    )}
                    {question.subdivision && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-50 text-gray-600 border border-gray-200">
                            {question.subdivision}
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-gray-500" />
                    {question.title}
                </h3>

                {/* Topic and Tags */}
                {(question.topic || (question.tags && question.tags.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        {question.topic && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                                <BookOpen size={12} />
                                {question.topic}
                            </span>
                        )}
                        {question.tags && question.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-md">
                                <Tag size={12} />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Problem Statement Header */}
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-600">
                Problem Statement
            </h3>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.description}
                </ReactMarkdown>
            </div>

            {/* Input Tables (Renamed to Schema Information when rendered via helper but keeping usage consistent) */}
            {question.inputTables && renderTable(question.inputTables, 'Schema Information', <Database size={14} />)}

            {/* Sample Data from Schema Setup */}
            {renderSampleData()}

            {/* Test Cases (Samples) */}
            {renderSamples()}

            {/* Expected Result */}
            {question.expectedResult && renderTable(question.expectedResult, 'Expected Result', <Database size={14} />, true)}

            {/* Expected Query (Solution) */}
            {question.expectedQuery && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-600">
                        <Terminal size={14} /> Expected Query
                    </h3>
                    <div className="bg-[#1e1e1e] text-gray-200 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-sm">
                        <pre>{question.expectedQuery}</pre>
                    </div>
                </div>
            )}

            {/* Hint */}
            {question.hint && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                        <span className="font-bold block mb-1">Hint:</span>
                        {question.hint}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SQLQuestionDisplay;
