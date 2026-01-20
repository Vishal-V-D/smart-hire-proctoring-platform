import { BarChart3, Binary, BookOpen, Box, Brain, Calculator, CheckCircle, Code, Cpu, Database, FileCode2, GitBranch, Grid, Layers, Network, Server, Settings, Sparkles, Type } from "lucide-react";
import { AssessmentCategory, AssessmentSection, Difficulty, SectionType } from "../types";

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
    {
        id: 'mcq_apt',
        label: 'MCQ Aptitude',
        icon: Calculator,
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600',
        sectionType: 'aptitude',
        expandedBorder: 'border-purple-500/50',
        expandedBg: 'bg-gradient-to-br from-purple-500/5 via-transparent to-transparent',
        expandedShadow: 'shadow-lg shadow-purple-500/10',
        selectedBorder: 'border-purple-500/50',
        selectedBg: 'bg-purple-500/10',
        checkboxBorder: 'border-purple-500',
        checkboxBg: 'bg-purple-500',
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-600 dark:text-purple-400',
        subCategories: [
            { id: 'quant', label: 'Quantitative', icon: Calculator, description: 'Percentages, Ratios, Profit/Loss' },
            { id: 'reasoning', label: 'Logical Reasoning', icon: Brain, description: 'Puzzles, Patterns, Syllogisms' },
            { id: 'verbal', label: 'Verbal Ability', icon: BookOpen, description: 'Grammar, Comprehension, Vocab' },
        ]
    },
    {
        id: 'mcq_pseudo',
        label: 'MCQ Pseudo Code',
        icon: FileCode2,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        sectionType: 'technical',
        expandedBorder: 'border-blue-500/50',
        expandedBg: 'bg-gradient-to-br from-blue-500/5 via-transparent to-transparent',
        expandedShadow: 'shadow-lg shadow-blue-500/10',
        selectedBorder: 'border-blue-500/50',
        selectedBg: 'bg-blue-500/10',
        checkboxBorder: 'border-blue-500',
        checkboxBg: 'bg-blue-500',
        badgeBg: 'bg-blue-500/20',
        badgeText: 'text-blue-600 dark:text-blue-400',
        subCategories: [
            { id: 'output', label: 'Output Prediction', icon: CheckCircle, description: 'Predict program output' },
            { id: 'debug', label: 'Debug Code', icon: Settings, description: 'Find and fix errors' },
            { id: 'trace', label: 'Trace Execution', icon: GitBranch, description: 'Step through code flow' },
        ]
    },
    {
        id: 'mcq_tech',
        label: 'MCQ Technical',
        icon: Cpu,
        color: 'orange',
        gradient: 'from-orange-500 to-amber-600',
        sectionType: 'technical',
        expandedBorder: 'border-orange-500/50',
        expandedBg: 'bg-gradient-to-br from-orange-500/5 via-transparent to-transparent',
        expandedShadow: 'shadow-lg shadow-orange-500/10',
        selectedBorder: 'border-orange-500/50',
        selectedBg: 'bg-orange-500/10',
        checkboxBorder: 'border-orange-500',
        checkboxBg: 'bg-orange-500',
        badgeBg: 'bg-orange-500/20',
        badgeText: 'text-orange-600 dark:text-orange-400',
        subCategories: [
            { id: 'dsa_theory', label: 'DSA Theory', icon: BarChart3, description: 'Time/Space complexity, Concepts' },
            { id: 'oop', label: 'OOP Concepts', icon: Box, description: 'Inheritance, Polymorphism, SOLID' },
            { id: 'dbms', label: 'DBMS', icon: Database, description: 'SQL, Normalization, Transactions' },
            { id: 'os', label: 'Operating Systems', icon: Server, description: 'Processes, Memory, Scheduling' },
            { id: 'networks', label: 'Computer Networks', icon: Network, description: 'OSI, TCP/IP, Protocols' },
            { id: 'system_design', label: 'System Design', icon: Layers, description: 'Scalability, Architecture' },
        ]
    },
    {
        id: 'dsa',
        label: 'DSA (Coding)',
        icon: Code,
        color: 'green',
        gradient: 'from-emerald-500 to-green-600',
        sectionType: 'coding',
        expandedBorder: 'border-green-500/50',
        expandedBg: 'bg-gradient-to-br from-green-500/5 via-transparent to-transparent',
        expandedShadow: 'shadow-lg shadow-green-500/10',
        selectedBorder: 'border-green-500/50',
        selectedBg: 'bg-green-500/10',
        checkboxBorder: 'border-green-500',
        checkboxBg: 'bg-green-500',
        badgeBg: 'bg-green-500/20',
        badgeText: 'text-green-600 dark:text-green-400',
        subCategories: [
            { id: 'arrays', label: 'Arrays', icon: Grid, description: 'Array manipulation, Two pointers' },
            { id: 'linked_list', label: 'Linked Lists', icon: GitBranch, description: 'Singly, Doubly, Circular' },
            { id: 'trees', label: 'Trees & BST', icon: Network, description: 'Binary Trees, BST, Heaps' },
            { id: 'graphs', label: 'Graphs', icon: Network, description: 'BFS, DFS, Shortest Path' },
            { id: 'dp', label: 'Dynamic Programming', icon: Box, description: 'Memoization, Tabulation' },
            { id: 'sorting', label: 'Sorting & Searching', icon: BarChart3, description: 'Quick, Merge, Binary Search' },
            { id: 'strings', label: 'Strings', icon: Type, description: 'Pattern matching, Manipulation' },
            { id: 'stacks', label: 'Stacks & Queues', icon: Layers, description: 'LIFO, FIFO, Priority Queue' },
            { id: 'recursion', label: 'Recursion', icon: Binary, description: 'Backtracking, Divide & Conquer' },
            { id: 'general', label: 'General / Mixed', icon: Sparkles, description: 'Mixed DSA problems' },
        ]
    },
    {
        id: 'sql_questions',
        label: 'SQL Questions',
        icon: Database,
        color: 'cyan',
        gradient: 'from-cyan-500 to-blue-500',
        sectionType: 'sql',
        expandedBorder: 'border-cyan-500/50',
        expandedBg: 'bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent',
        expandedShadow: 'shadow-lg shadow-cyan-500/10',
        selectedBorder: 'border-cyan-500/50',
        selectedBg: 'bg-cyan-500/10',
        checkboxBorder: 'border-cyan-500',
        checkboxBg: 'bg-cyan-500',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-600 dark:text-cyan-400',
        subCategories: [
            { id: 'sql_basic', label: 'SQL', icon: Database, description: 'Queries, Joins, Procedures' }
        ]
    }
];

export const getSectionDefaults = (type: SectionType): Omit<AssessmentSection, 'id' | 'type'> => {
    const common = {
        timeLimit: 15,
        questionCount: 10,
        marksPerQuestion: 1,
        negativeMarking: 0,
        enabledPatterns: [],
        difficulty: 'Medium' as Difficulty,
        questions: [],
        themeColor: 'gray'
    };

    switch (type) {
        case 'aptitude': return {
            ...common,
            title: 'General Aptitude',
            description: 'Logical & Quant',
            enabledPatterns: ['multiple_choice'],
            themeColor: 'purple'
        };
        case 'technical': return {
            ...common,
            title: 'Technical Core',
            description: 'CS Fundamentals',
            questionCount: 15,
            marksPerQuestion: 2,
            enabledPatterns: ['mcq_single']
        };
        case 'coding': return {
            ...common,
            title: 'Coding Challenge',
            description: 'DSA Problems',
            questionCount: 2,
            marksPerQuestion: 20,
            timeLimit: 45,
            enabledPatterns: ['coding'],
            themeColor: 'green'
        };
        case 'subjective': return {
            ...common,
            title: 'Essay Writing',
            description: 'Long form',
            questionCount: 1,
            marksPerQuestion: 10,
            enabledPatterns: ['essay']
        };
        case 'sql': return {
            ...common,
            title: 'SQL Challenge',
            description: 'Database Queries',
            questionCount: 3,
            marksPerQuestion: 10,
            timeLimit: 25,
            enabledPatterns: ['sql'],
            themeColor: 'cyan'
        };
        default: return { ...common, title: 'Section', description: '', questions: [] };
    }
};
