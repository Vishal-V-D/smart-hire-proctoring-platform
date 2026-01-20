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
                    if (firstItem && typeof firstItem === 'object' && 'rows' in firstItem && 'columns' in firstItem) {
                        tablesToRender = data;
                    } else {
                        const columns = firstItem ? Object.keys(firstItem) : [];
                        tablesToRender = [{ name: isExpected ? 'Result Set' : 'Table', columns, rows: data }];
                    }
                }
            } else if (data && typeof data === 'object') {
                if ('rows' in data && 'columns' in data) {
                    tablesToRender = [data];
                }
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
                                <div className="px-4 py-2.5 text-sm font-bold border-b flex items-center gap-2 bg-gray-50 border-gray-200 text-gray-900">
                                    <span className="font-mono">{table.name || 'Table'}</span>
                                    {table.rows && <span className="text-[10px] opacity-60 font-normal">({table.rows.length} rows)</span>}
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
                                                    {table.columns && table.columns.map((col: string, cIdx: number) => (
                                                        <td key={cIdx} className="px-4 py-2 font-mono text-gray-700">
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
                </div>
            );
        } catch (e) {
            console.error("Failed to render table:", e);
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

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.description}
                </ReactMarkdown>
            </div>

            {/* Input Tables */}
            {question.inputTables && renderTable(question.inputTables, 'Input Tables', <Database size={14} />)}

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
