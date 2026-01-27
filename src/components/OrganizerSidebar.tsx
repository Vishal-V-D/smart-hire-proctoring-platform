// src/components/OrganizerSidebar.tsx
"use client";

import React, { useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/components/AuthProviderClient';
import { useNotifications } from '@/context/NotificationContext';
import {
    LayoutDashboard,
    Shield,
    Users,
    BarChart3,
    LogOut,
    ChevronLeft,
    Settings,
    Gem,
    Database,
    Menu,
    List,
    Bell,
    Building2
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

// --- Types ---
type NavItemProps = {
    icon: React.ReactElement;
    text: string;
    href: string;
    active?: boolean;
    badge?: string;
    badgeColor?: string;
    isCollapsed: boolean;
    onHover: (text: string | null, top: number | null) => void;
};

// --- NavItem Component ---
// --- NavItem Component ---
const NavItem = ({ icon, text, href, active, badge, badgeColor, isCollapsed, onHover }: NavItemProps) => {
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
                group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
                ${active ? '' : 'hover:bg-accent/50'}
            `}
        >
            {/* Active Background Pill - Professional & Solid */}
            {active && (
                <motion.div
                    layoutId="sidebarActiveItem"
                    className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20 rounded-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
            )}

            <div className="relative z-10 flex items-center justify-center">
                {React.cloneElement(icon, {
                    size: 18, // Reduced icon size
                    className: `transition-all duration-200 ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        }`
                } as any)}

                {isCollapsed && badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
            </div>

            {!isCollapsed && (
                <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap pl-2"
                >
                    <span className={`text-[0.85rem] tracking-tight transition-colors duration-200 ${active ? 'font-semibold text-primary-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'
                        }`}>
                        {text}
                    </span>
                    {badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm ${active ? 'bg-gradient-to-br from-indigo-600 to-violet-600-foreground/20 text-primary-foreground' : badgeColor
                            }`}>
                            {badge}
                        </span>
                    )}
                </motion.div>
            )}
        </Link>
    );
};

export default function OrganizerSidebar() {
    const auth = useContext(AuthContext);
    const { unreadCount } = useNotifications();
    const pathname = usePathname();

    // Use the global sidebar context
    const { isCollapsed, setCollapsed: setIsCollapsed } = useSidebar();

    const [hoveredText, setHoveredText] = useState<string | null>(null);
    const [tooltipTop, setTooltipTop] = useState<number | null>(null);

    const handleHover = (text: string | null, top: number | null) => {
        setHoveredText(text);
        setTooltipTop(top);
    };

    const user = {
        name: auth?.user?.username || auth?.user?.email?.split('@')[0] || "Organizer",
        role: auth?.user?.role || "Organizer",
        avatar: `https://ui-avatars.com/api/?name=${auth?.user?.username || "Organizer"}&background=random`
    };

    return (
        <>
            <aside
                className={`
                    h-screen sticky top-0 bg-card border-r border-border/40 flex flex-col justify-between transition-all duration-300 ease-in-out z-40
                    ${isCollapsed ? 'w-[70px]' : 'w-[240px]'}
                `}
            >
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border/40 bg-card/50">
                        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} transition-all duration-300`}>
                            <div className="relative">
                                <img src={user.avatar} alt="User" className="w-8 h-8 rounded-lg border border-border/50 object-cover" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-xs text-foreground whitespace-nowrap leading-none mb-0.5">{user.name}</h3>
                                <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`
                                p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all duration-200
                                ${isCollapsed ? 'w-full flex justify-center' : ''}
                            `}
                        >
                            {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                        <NavItem
                            icon={<LayoutDashboard />}
                            text="Dashboard"
                            href="/organizer"
                            active={pathname === '/organizer'}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<List />}
                            text=" Assessments"
                            href="/organizer/assessments"
                            active={pathname?.startsWith('/organizer/assessments') || pathname?.startsWith('/assessments/create')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Database />}
                            text="Question Bank"
                            href="/question-bank"
                            active={pathname?.startsWith('/question-bank')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Users />}
                            text="Partner Requests"
                            href="/organizer/partner-requests"
                            active={pathname?.startsWith('/organizer/partner-requests')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Building2 />}
                            text="Manage Companies"
                            href="/organizer/companies"
                            active={pathname?.startsWith('/organizer/companies')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Shield />}
                            text="Team Admins"
                            href="/organizer/admins"
                            active={pathname?.startsWith('/organizer/admins')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />

                        <div className={`my-4 h-px bg-sidebar-border ${isCollapsed ? 'mx-2' : 'mx-0'}`}></div>

                        <NavItem
                            icon={<Bell />}
                            text="Notifications"
                            href="/organizer/notifications"
                            active={pathname?.startsWith('/organizer/notifications')}
                            badge={unreadCount > 0 ? unreadCount.toString() : undefined}
                            badgeColor="bg-blue-500/10 text-blue-500"
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />

                        <NavItem
                            icon={<Settings />}
                            text="Platform Settings"
                            href="/organizer/settings"
                            active={pathname?.startsWith('/organizer/settings')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />

                    </nav>
                </div>

                <div className="p-4 bg-background/50 border-t border-border/40 backdrop-blur-sm">
                    <button
                        onClick={() => auth?.logout()}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
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