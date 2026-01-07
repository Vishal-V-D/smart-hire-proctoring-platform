// src/components/AdminSidebar.tsx
"use client";

import React, { useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/components/AuthProviderClient';
import {
    LayoutDashboard,
    Shield,
    FileBarChart,
    LogOut,
    ChevronLeft,
    Settings,
    Menu,
    List
} from 'lucide-react';

type NavItemProps = {
    icon: React.ReactElement;
    text: string;
    href: string;
    active?: boolean;
    isCollapsed: boolean;
    onHover: (text: string | null, top: number | null) => void;
};

const NavItem = ({ icon, text, href, active, isCollapsed, onHover }: NavItemProps) => {
    const itemRef = useRef<HTMLAnchorElement>(null);
    const handleMouseEnter = () => {
        if (isCollapsed && itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            onHover(text, rect.top);
        }
    };

    return (
        <Link
            ref={itemRef}
            href={href || '#'}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => onHover(null, null)}
            className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200
                ${active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-indigo-200/50'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
        >
            <div className="relative z-10 flex items-center justify-center">
                {React.cloneElement(icon, {
                    size: 22,
                    className: active ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'
                } as any)}
            </div>
            {!isCollapsed && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
                >
                    <span className="font-medium text-sm">{text}</span>
                </motion.div>
            )}
        </Link>
    );
};

export default function AdminSidebar() {
    const auth = useContext(AuthContext);
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredText, setHoveredText] = useState<string | null>(null);
    const [tooltipTop, setTooltipTop] = useState<number | null>(null);

    const handleHover = (text: string | null, top: number | null) => {
        setHoveredText(text);
        setTooltipTop(top);
    };

    const user = {
        name: auth?.user?.fullName || auth?.user?.username || "Admin",
        role: "Team Admin",
        avatar: `https://ui-avatars.com/api/?name=${auth?.user?.fullName || "Admin"}&background=random`
    };

    return (
        <>
            <aside
                className={`
                    h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 ease-in-out z-40 shadow-sm
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} transition-all duration-300`}>
                            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-sidebar-border shadow-sm" />
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm text-sidebar-foreground whitespace-nowrap">{user.name}</h3>
                                <p className="text-[10px] text-sidebar-foreground/60 whitespace-nowrap uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                            {isCollapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                        <NavItem
                            icon={<LayoutDashboard />}
                            text="Dashboard"
                            href="/admin/dashboard"
                            active={pathname === '/admin/dashboard'}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<List />}
                            text="Assessments"
                            href="/admin/assessments"
                            active={pathname?.startsWith('/admin/assessments')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<FileBarChart />}
                            text="Reports & Analytics"
                            href="/admin/reports"
                            active={pathname?.startsWith('/admin/reports')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <div className={`my-4 h-px bg-sidebar-border ${isCollapsed ? 'mx-2' : 'mx-0'}`}></div>
                        <NavItem
                            icon={<Settings />}
                            text="Settings"
                            href="/admin/settings"
                            active={pathname?.startsWith('/admin/settings')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                    </nav>
                </div>

                <div className="p-3 bg-sidebar border-t border-sidebar-border">
                    <button
                        onClick={() => auth?.logout()}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>

            <AnimatePresence>
                {isCollapsed && hoveredText && tooltipTop !== null && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        style={{ position: 'fixed', top: tooltipTop + 7, left: 90, zIndex: 9999 }}
                        className="pointer-events-none"
                    >
                        <div className="bg-popover text-popover-foreground text-xs font-semibold px-3 py-2 rounded-lg shadow-xl border border-border">
                            {hoveredText}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
