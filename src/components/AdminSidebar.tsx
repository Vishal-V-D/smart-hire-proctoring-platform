// src/components/AdminSidebar.tsx
"use client";

import React, { useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/components/AuthProviderClient';
import { useNotifications } from '@/context/NotificationContext';
import { contestService } from '@/api/contestService';
import {
    LayoutDashboard,
    Shield,
    FileBarChart,
    LogOut,
    ChevronLeft,
    Settings,
    Menu,
    List,
    Users,
    Bell,
    Gem,
    Database,
    PlusCircle,
    Building2
} from 'lucide-react';
// import { ThemeContext } from '@/context/ThemeContext'; // Removing unnecessary import

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

                {/* Mini Notification Dot for Collapsed State */}
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

export default function AdminSidebar() {
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

    const [companyInfo, setCompanyInfo] = useState<any>(null);

    React.useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await contestService.getCompanyDetails();
                setCompanyInfo(res.data);
            } catch (error) {
                console.error("Failed to fetch company info in sidebar", error);
            }
        };
        fetchCompany();
    }, []);

    const displayCompany = companyInfo || auth?.user?.company;

    const user = {
        companyName: displayCompany?.name || auth?.user?.companyName || auth?.user?.organizationName || "SmartHire",
        companyWebsite: displayCompany?.website || auth?.user?.companyWebsite || "",
        adminName: auth?.user?.fullName || auth?.user?.username || "Admin",
        email: auth?.user?.email || "",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            displayCompany?.name || auth?.user?.companyName || auth?.user?.organizationName || auth?.user?.fullName || "Admin"
        )}&background=random`
    };

    // Debug: Log user permissions
    React.useEffect(() => {
        if (auth?.user) {
            console.log("🔐 [AdminSidebar] User Permissions Debug:");
            console.log("   Role:", auth.user.role);
            console.log("   Company:", auth.user.company?.name);
            console.log("   Company Permissions:", auth.user.company?.permissions);
            console.log("   Legacy Company Permissions:", auth.user.companyPermissions);
            console.log("   ✅ Can Create Assessment:",
                auth.user.company?.permissions?.createAssessment || auth.user.companyPermissions?.createAssessment || false
            );
            console.log("   ✅ Can Delete Assessment:",
                auth.user.company?.permissions?.deleteAssessment || auth.user.companyPermissions?.deleteAssessment || false
            );
            console.log("   ✅ Can View All Assessments:",
                auth.user.company?.permissions?.viewAllAssessments || auth.user.companyPermissions?.viewAllAssessments || false
            );
        }
    }, [auth?.user]);

    return (
        <>
            <aside
                className={`
                    h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 ease-in-out z-40 shadow-sm
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="h-[72px] flex items-center justify-between px-4 border-b border-sidebar-border">
                        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} transition-all duration-300`}>
                            <img src={user.avatar} alt="User" className="w-9 h-9 rounded-lg border border-sidebar-border shadow-sm shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <h3 className="font-bold text-sm text-sidebar-foreground truncate leading-tight" title={user.companyName}>{user.companyName}</h3>
                                <div className="flex flex-col mt-1">
                                    <span className="text-[11px] font-medium text-sidebar-foreground/80 truncate leading-tight">{user.adminName}</span>
                                    <span className="text-[10px] text-sidebar-foreground/50 truncate leading-tight" title={user.email}>{user.email}</span>
                                </div>
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

                        {(auth?.user?.company?.permissions?.createAssessment || auth?.user?.companyPermissions?.createAssessment) && (
                            <>
                                <NavItem
                                    icon={<PlusCircle />}
                                    text="New Assessment"
                                    href="/assessments/create"
                                    active={pathname?.startsWith('/assessments/create')}
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
                            </>
                        )}
                        <NavItem
                            icon={<Shield />}
                            text="Team Management"
                            href="/company/team"
                            active={pathname?.startsWith('/company/team')}
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />
                        <NavItem
                            icon={<Building2 />}
                            text="Company Profile"
                            href="/admin/company"
                            active={pathname === '/admin/company'}
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
                            icon={<Bell />}
                            text="Notifications"
                            href="/admin/notifications"
                            active={pathname?.startsWith('/admin/notifications')}
                            badge={unreadCount > 0 ? unreadCount.toString() : undefined}
                            badgeColor="bg-blue-500/10 text-blue-500"
                            isCollapsed={isCollapsed}
                            onHover={handleHover}
                        />

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
