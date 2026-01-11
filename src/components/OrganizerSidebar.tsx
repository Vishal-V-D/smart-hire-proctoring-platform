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

                {isCollapsed && badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </div>

            {!isCollapsed && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
                >
                    <span className="font-medium text-sm">{text}</span>
                    {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-sidebar-primary-foreground text-sidebar-primary' : badgeColor}`}>
                            {badge}
                        </span>
                    )}
                </motion.div>
            )}
        </Link>
    );
};

// --- Main Sidebar Component ---
export default function OrganizerSidebar() {
    const auth = useContext(AuthContext);
    const { unreadCount } = useNotifications();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
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
                    h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 ease-in-out z-40 shadow-sm
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Header */}
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

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
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