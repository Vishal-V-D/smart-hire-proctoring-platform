'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import {
    Bell,
    CheckCheck,
    Info,
    Building2,
    Shield,
    Check,
    Clock,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthContext } from '@/components/AuthProviderClient';
import { useContext, useEffect } from 'react';

export default function NotificationsView() {
    const { notifications, markAllAsRead, markAsRead, unreadCount } = useNotifications();
    const authContext = useContext(AuthContext);
    const userRole = authContext?.user?.role;

    useEffect(() => {
        console.log("Current User Role:", userRole);
    }, [userRole]);

    // Helper: Safe Date Formatting
    // Helper: Safe Date Formatting
    const formatTime = (notif: any) => {
        // Try logical fields
        const dateInput = notif.timestamp || notif.createdAt || notif.date;

        try {
            if (!dateInput) return 'Unknown Date';

            const date = new Date(dateInput);

            // Check if valid
            if (isNaN(date.getTime())) {
                console.warn("⚠️ Invalid Date Input:", dateInput);
                return String(dateInput); // Show raw string if invalid so we can see it
            }

            return date.toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } catch (e) {
            console.error("Date formatting error:", e);
            return 'Error';
        }
    };

    // Helper: Contextual Icon
    const getIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('company')) return <Building2 size={20} />;
        if (t.includes('admin')) return <Shield size={20} />;
        if (t.includes('assessment')) return <Briefcase size={20} />;
        return <Info size={20} />;
    };

    // Helper: Contextual Colors
    const getStyles = (type: string, isRead: boolean) => {
        const t = (type || '').toLowerCase();

        let bgIcon = 'bg-blue-500/10 text-blue-600';
        let border = 'border-l-blue-500';

        if (t.includes('approved') || t.includes('success')) {
            bgIcon = 'bg-green-500/10 text-green-600';
            border = 'border-l-green-500';
        } else if (t.includes('request') || t.includes('pending')) {
            bgIcon = 'bg-amber-500/10 text-amber-600';
            border = 'border-l-amber-500';
        } else if (t.includes('error') || t.includes('fail')) {
            bgIcon = 'bg-red-500/10 text-red-600';
            border = 'border-l-red-500';
        }

        if (isRead) {
            return {
                container: 'bg-card/50 border-transparent hover:bg-muted/50 opacity-80',
                icon: 'bg-muted text-muted-foreground',
                text: 'text-muted-foreground font-medium'
            };
        }

        return {
            container: `bg-card border-l-4 ${border} shadow-sm hover:shadow-md hover:translate-x-1`,
            icon: bgIcon,
            text: 'text-foreground font-bold'
        };
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl text-primary-foreground shadow-lg shadow-primary/25">
                        <Bell size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground mt-1">Updates, alerts, and activity logs.</p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all border border-primary/10 hover:border-primary/20 shadow-sm"
                    >
                        <CheckCheck size={16} />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border border-dashed rounded-[32px] p-16 text-center flex flex-col items-center justify-center gap-6"
                        >
                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground/40 ring-8 ring-muted/20">
                                <Bell size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">All caught up!</h3>
                                <p className="text-muted-foreground mt-1">You have no new notifications at the moment.</p>
                            </div>
                        </motion.div>
                    ) : (
                        notifications.map((notif) => {
                            const styles = getStyles(notif.type || '', !!notif.isRead);

                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                                    className={`
                                        relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                                        ${styles.container}
                                    `}
                                >
                                    <div className="flex gap-5">
                                        {/* Icon Box */}
                                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${styles.icon}`}>
                                            {getIcon(notif.type || '')}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-start justify-between gap-4 mb-1">
                                                <h3 className={`text-lg truncate pr-4 ${styles.text}`}>
                                                    {notif.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Clock size={12} className="text-muted-foreground" />
                                                    <span className="text-xs font-medium text-muted-foreground/80">
                                                        {formatTime(notif)}
                                                    </span>
                                                    {!notif.isRead && (
                                                        <span className="ml-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-primary/50 animate-pulse" />
                                                    )}
                                                </div>
                                            </div>

                                            <p className={`${notif.isRead ? 'text-muted-foreground' : 'text-foreground/80'} leading-relaxed text-sm`}>
                                                {notif.message}
                                            </p>

                                            {/* Data Badge */}

                                        </div>

                                        {/* Hover Action */}
                                        {!notif.isRead && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notif.id);
                                                    }}
                                                    className="p-3 bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary shadow-lg rounded-full transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
