"use client";

import React, { useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/components/AuthProviderClient';
import {
    LayoutDashboard,
    Shield,
    Trophy,
    Users,
    BarChart3,
    FileBarChart,
    LogOut,
    ChevronLeft,
    Settings,
    Gem,
    Database,
    Menu, // Used for the "Open" icon
    List
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
            // Calculate exact position on screen to ensure tooltip is never clipped
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
            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center">
                {React.cloneElement(icon, {
                    size: 22,
                    className: active ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'
                } as any)}

                {/* Mini Notification Dot for Collapsed State */}
                {isCollapsed && badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </div>

            {/* Expanded Text */}
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
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Tooltip State (Lifted up to avoid clipping)
    const [hoveredText, setHoveredText] = useState<string | null>(null);
    const [tooltipTop, setTooltipTop] = useState<number | null>(null);

    const handleHover = (text: string | null, top: number | null) => {
        setHoveredText(text);
        setTooltipTop(top);
    };

    // User Data from Auth Context
    const user = {
        name: auth?.user?.username || auth?.user?.email?.split('@')[0] || "Organizer",
        role: auth?.user?.role || "Organizer",
        avatar: `https://ui-avatars.com/api/?name=${auth?.user?.username || "Organizer"}&background=random`
    };

    return (
        <>
            <aside
                className={`
                    h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-40 shadow-sm
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                {/* --- TOP HEADER --- */}
                <div className="flex flex-col flex-1 overflow-hidden">

                    {/* Header: Profile & Toggle */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                        {/* User Info (Hidden when collapsed) */}
                        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} transition-all duration-300`}>
                            <img
                                src={user.avatar}
                                alt="User"
                                className="w-8 h-8 rounded-full object-cover border border-sidebar-border shadow-sm"
                            />
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm text-sidebar-foreground whitespace-nowrap">{user.name}</h3>
                                <p className="text-[10px] text-sidebar-foreground/60 whitespace-nowrap uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>

                        {/* Toggle Button (Centered when collapsed, Right when open) */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`
                                p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors
                                ${isCollapsed ? 'w-full flex justify-center' : ''}
                            `}
                        >
                            {isCollapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
                        </button>
                    </div>

                    {/* --- SCROLLABLE NAVIGATION --- */}
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
                            active={pathname?.startsWith('/organizer/assessments') || pathname?.startsWith('/organizer/new-assessment')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Database />}
                            text="Question Bank"
                            href="/organizer/question-bank"
                            active={pathname?.startsWith('/organizer/question-bank')}
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


                        {/* Divider */}
                        <div className={`my-4 h-px bg-sidebar-border ${isCollapsed ? 'mx-2' : 'mx-0'}`}></div>

                        <NavItem
                            icon={<Settings />}
                            text="Platform Settings"
                            href="/organizer/settings"
                            active={pathname?.startsWith('/organizer/settings')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<BarChart3 />}
                            text="Violation Logs"
                            active={pathname?.startsWith('/organizer/violations')}
                            badge="12"
                            badgeColor="bg-red-500/10 text-red-500"
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                            href="/organizer/violations"
                        />
                    </nav>
                </div>

                {/* --- BOTTOM SECTION (Fixed) --- */}
                <div className="p-3 bg-sidebar border-t border-sidebar-border">

                    {/* Upgrade Card */}
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white relative overflow-hidden shadow-lg"
                            >
                                <div className="relative z-10 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                                            <Gem className="w-4 h-4 text-indigo-300" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs leading-tight">Upgrade Plan</h4>
                                        </div>
                                    </div>
                                    <button className="w-full bg-white text-slate-900 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wide hover:bg-slate-100 transition-colors shadow-sm">
                                        View Pricing
                                    </button>
                                </div>
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Logout Button */}
                    <button
                        onClick={() => auth?.logout()}
                        onMouseEnter={(e) => isCollapsed && handleHover("Sign Out", e.currentTarget.getBoundingClientRect().top)}
                        onMouseLeave={() => handleHover(null, null)}
                        className={`
                            flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut size={20} className="group-hover:stroke-destructive transition-colors" />
                        {!isCollapsed && (
                            <span className="font-medium text-sm">Sign Out</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* --- FLOATING TOOLTIP PORTAL --- 
                This sits outside the sidebar structure, fixed to the viewport.
                It will never be clipped by the sidebar scrollbar.
            */}
            <AnimatePresence>
                {isCollapsed && hoveredText && tooltipTop !== null && (
                    <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{
                            position: 'fixed',
                            top: tooltipTop + 7, // Align vertically with icon center (adjust based on padding)
                            left: 90, // Sidebar width (80px) + gap (10px)
                            zIndex: 9999
                        }}
                        className="pointer-events-none"
                    >
                        <div className="bg-popover text-popover-foreground text-xs font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap flex items-center border border-border">
                            {hoveredText}
                            {/* Tiny Arrow pointing left */}
                            <div className="absolute left-0 top-1/2 -translate-x-[4px] -translate-y-1/2 w-2 h-2 bg-popover rotate-45 border-l border-b border-border"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}