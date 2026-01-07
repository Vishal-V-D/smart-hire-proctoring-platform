"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    ArrowRight,
    Command,
    Moon,
    Sun,
    Laptop,
    Plus,
    LayoutDashboard,
    Settings,
    Monitor,
    FileText,
    Code
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock Actions Data
const ACTIONS = [
    // --- NAVIGATION ---
    {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        icon: LayoutDashboard,
        shortcut: ['Alt', 'D'],
        section: 'Navigation',
        action: (router: any) => router.push('/organizer')
    },
    {
        id: 'nav-assessments',
        label: 'Go to Assessments',
        icon: FileText,
        shortcut: ['Alt', 'A'],
        section: 'Navigation',
        action: (router: any) => router.push('/organizer/assessments')
    },
    {
        id: 'nav-monitor',
        label: 'Live Monitor',
        icon: Monitor,
        shortcut: ['Alt', 'L'],
        section: 'Navigation',
        action: (router: any) => router.push('/organizer/live-monitor')
    },
    {
        id: 'nav-settings',
        label: 'Platform Settings',
        icon: Settings,
        shortcut: ['Alt', 'S'],
        section: 'Navigation',
        action: (router: any) => router.push('/organizer/settings')
    },

    // --- CREATE ACTIONS ---
    {
        id: 'act-create',
        label: 'Create New Assessment',
        icon: Plus,
        shortcut: ['Alt', 'N'],
        section: 'Create',
        action: (router: any) => router.push('/organizer/new-assessment')
    },
    {
        id: 'act-create-code',
        label: 'Create Coding Challenge',
        icon: Code,
        shortcut: ['Alt', 'C'],
        section: 'Create',
        action: (router: any) => router.push('/organizer/new-assessment/coding')
    },

    // --- THEME ---
    {
        id: 'act-theme-dark',
        label: 'Switch to Dark Mode',
        icon: Moon,
        shortcut: ['Alt', 'K'],
        section: 'Theme',
        action: (_: any, setTheme: any) => setTheme('dark')
    },
    {
        id: 'act-theme-light',
        label: 'Switch to Light Mode',
        icon: Sun,
        shortcut: ['Alt', 'J'],
        section: 'Theme',
        action: (_: any, setTheme: any) => setTheme('light')
    },
];

interface CommandPaletteProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    currentThemeContext?: any; // Pass theme context if needed
}

const CommandPalette = ({ isOpen, setIsOpen, currentThemeContext }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Filter actions
    const filteredActions = ACTIONS.filter(action =>
        action.label.toLowerCase().includes(query.toLowerCase()) ||
        action.section.toLowerCase().includes(query.toLowerCase())
    );

    // Execute action
    const executeAction = useCallback((actionItem: any) => {
        if (actionItem.action) {
            actionItem.action(router, currentThemeContext?.setTheme);
        }
        setIsOpen(false);
        setQuery('');
    }, [router, currentThemeContext, setIsOpen]);

    // Keyboard Navigation & Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Priority: Check Global Alt Shortcuts first (Alt + Key) - works even when palette is closed
            if (e.altKey && !e.ctrlKey && !e.metaKey) {
                const action = ACTIONS.find(a =>
                    a.shortcut[0] === 'Alt' &&
                    a.shortcut[1].toLowerCase() === e.key.toLowerCase()
                );
                if (action) {
                    e.preventDefault();
                    e.stopPropagation();
                    executeAction(action);
                    return;
                }
            }

            // Global Open Shortcut (Ctrl+K or Cmd+K) - works when palette is closed
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
                return;
            }

            // Below shortcuts only work when palette is open
            if (!isOpen) return;

            // Navigation within the palette
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredActions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredActions[selectedIndex]) {
                    executeAction(filteredActions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, filteredActions, selectedIndex, setIsOpen, executeAction]);

    // Reset selection on query change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-border">
                            <Search className="w-5 h-5 text-muted-foreground mr-3" />
                            <input
                                type="text"
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="flex items-center gap-2">
                                <kbd className="hidden md:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">ESC</span>
                                </kbd>
                            </div>
                        </div>

                        {/* Actions List */}
                        <div className="overflow-y-auto p-2 scrollbar-hide">
                            {filteredActions.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-sm">
                                    No results found.
                                </div>
                            ) : (
                                filteredActions.map((action, index) => (
                                    <div
                                        key={action.id}
                                        onClick={() => executeAction(action)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${index === selectedIndex ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-background' : 'bg-muted'}`}>
                                                <action.icon size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{action.label}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                                    {action.section}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Keyboard Shortcuts */}
                                        <div className="flex items-center gap-1">
                                            {action.shortcut.map((key: string, i: number) => (
                                                <kbd
                                                    key={i}
                                                    className={`hidden md:inline-flex h-5 select-none items-center justify-center rounded border px-1.5 font-mono text-[10px] font-medium shadow-sm ${index === selectedIndex
                                                        ? 'bg-background border-primary/20 text-foreground'
                                                        : 'bg-muted border-border text-muted-foreground'
                                                        }`}
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex justify-between px-6">
                            <span>Protip: You can perform actions directly without leaving your keyboard.</span>
                            <div className="flex gap-4">
                                <span>Use <span className="font-bold">↑↓</span> to navigate</span>
                                <span>Use <span className="font-bold">Enter</span> to select</span>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
