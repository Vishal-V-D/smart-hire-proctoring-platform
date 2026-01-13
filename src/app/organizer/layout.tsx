"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/components/AuthProviderClient";
import {
    Sparkles,
    LayoutDashboard,
    Trophy,
    Users,
    BarChart3,
    LogOut,
    Shield,
    Menu
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrganizerSidebar from "@/components/OrganizerSidebar";
import { ThemeContext } from "@/context/ThemeContext";
import CommandPalette from "@/components/CommandPalette";
import { SidebarProvider } from "@/context/SidebarContext";

export default function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useContext(AuthContext);
    const themeContext = useContext(ThemeContext); // naming it to avoid conflict if 'theme' is used elsewhere, or just pass context
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isCommandOpen, setIsCommandOpen] = React.useState(false);

    // Listen for custom event to open palette from children (e.g. Dashboard Search)
    React.useEffect(() => {
        const handleOpen = () => setIsCommandOpen(true);
        window.addEventListener('open-command-palette', handleOpen);
        return () => window.removeEventListener('open-command-palette', handleOpen);
    }, []);

    const navItems = [
        {
            label: "Dashboard",
            path: "/organizer",
            icon: LayoutDashboard,
        },
        {
            label: "Assessment Hub",
            path: "/organizer/assessment-hub",
            icon: Shield,
        },
        {
            label: "Contests",
            path: "/organizer/contests",
            icon: Trophy,
        },
        {
            label: "Submissions",
            path: "/organizer/submissions",
            icon: Users,
        },
        {
            label: "Reports",
            path: "/organizer/reports",
            icon: BarChart3,
        },
    ];

    const handleLogout = () => {
        auth?.logout();
    };

    return (
        <ProtectedRoute role="organizer">
            <SidebarProvider>
                {/* Global Command Palette */}
                <CommandPalette
                    isOpen={isCommandOpen}
                    setIsOpen={setIsCommandOpen}
                    currentThemeContext={themeContext}
                />

                <div className="min-h-screen bg-theme-primary flex text-theme-primary font-sans">
                    {/* Sidebar - Desktop */}
                    <OrganizerSidebar />

                    {/* Mobile Header & Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Mobile Header */}
                        <header className="lg:hidden h-16 border-b border-theme bg-theme-secondary/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <Sparkles size={20} className="text-theme-accent" />
                                <span>Hire.AI</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg bg-theme-tertiary text-theme-primary"
                            >
                                <Menu size={24} />
                            </button>
                        </header>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="lg:hidden fixed inset-0 z-50 bg-theme-primary/95 backdrop-blur-lg flex flex-col p-6 animate-in slide-in-from-top-10">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xl font-bold">Menu</span>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-theme-tertiary"><Menu size={24} /></button>
                                </div>
                                <nav className="flex-1 space-y-2">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${pathname === item.path
                                                ? "bg-theme-accent text-white"
                                                : "text-theme-secondary bg-theme-tertiary"
                                                }`}
                                        >
                                            <item.icon size={24} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-4 rounded-xl bg-red-500/10 text-red-500 font-medium mt-4"
                                >
                                    <LogOut size={24} />
                                    Sign Out
                                </button>
                            </div>
                        )}

                        {/* Page Content */}
                        <main className="flex-1 overflow-x-hidden">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}
