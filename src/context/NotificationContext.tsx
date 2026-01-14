// src/context/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { socketService } from '@/api/socketService';
import { notificationService } from '@/api/notificationService';
import { AuthContext } from '@/components/AuthProviderClient';

// --- Types ---

export interface NotificationPayload {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    isRead?: boolean;
    data?: any;
    type?: string;
}

export interface OrganizerNotificationPayload extends NotificationPayload {
    type: "new_company_request" | "new_admin_request";
}

export interface CompanyNotificationPayload extends NotificationPayload {
    type: "company_approved" | "admin_approved" | "admin_added";
    data: {
        companyId: string;
        approvedBy?: string;
        [key: string]: any;
    };
}

interface NotificationContextType {
    isConnected: boolean;
    notifications: NotificationPayload[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

    // --- Actions ---

    const fetchNotifications = useCallback(async () => {
        if (!auth?.user) return;
        try {
            const res = await notificationService.getNotifications();
            console.log("🔔 [NotificationContext] Raw API Response:", res);

            let list: any[] = [];
            const d = res.data;

            // Robust Extraction Logic
            if (Array.isArray(d)) {
                list = d;
            } else if (d && Array.isArray(d.notifications)) {
                list = d.notifications;
            } else if (d && d.data && Array.isArray(d.data)) {
                list = d.data;
            } else if (d && d.data && Array.isArray(d.data.notifications)) {
                list = d.data.notifications;
            }

            console.log("🔔 [NotificationContext] Processed List:", list);
            setNotifications(list);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [auth?.user]);

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await notificationService.markAsRead(id);
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            await notificationService.markAllAsRead();
            toast.success("All notifications marked as read", { position: "top-right", theme: "colored" });
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    // --- Helper: Show Clickable Toast ---
    const showClickableToast = (title: string, message: string, route: string, type: 'info' | 'success' = 'info', timestamp?: Date | string) => {
        const timeStr = timestamp
            ? new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : 'Just now';

        toast[type](
            <div onClick={() => router.push(route)} className="cursor-pointer">
                <div className="flex justify-between items-start gap-2">
                    <strong>{title}</strong>
                    <span className="text-[10px] opacity-60 whitespace-nowrap mt-0.5">{timeStr}</span>
                </div>
                <p className="text-sm mt-1">{message}</p>
            </div>,
            {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            }
        );
    };

    // --- Socket & Setup ---

    useEffect(() => {
        if (auth?.user) {
            fetchNotifications();
        }
    }, [auth?.user, fetchNotifications]);

    useEffect(() => {
        const socket = socketService.connect();

        const onConnect = () => {
            setIsConnected(true);
            toast.success('Connected to server', {
                position: 'bottom-right',
                autoClose: 2000,
                hideProgressBar: true,
                theme: 'colored',
            });
        };

        const onDisconnect = () => {
            setIsConnected(false);
            toast.error('Disconnected from server', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: true,
                theme: 'colored',
            });
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        const cleanups: (() => void)[] = [];

        if (auth?.user) {
            const user = auth.user;
            const role = user.role as string;
            const companyId = user.companyId;

            // ORGANIZERS
            if (role === 'organizer') {
                socketService.joinOrganizerRoom();

                const handleOrganizerNotification = (payload: OrganizerNotificationPayload) => {
                    console.log('🔔 Organizer Notification:', payload);
                    setNotifications(prev => [payload, ...prev]);
                    playNotificationSound();

                    showClickableToast(
                        payload.title,
                        payload.message,
                        '/organizer/notifications',
                        'info',
                        payload.timestamp
                    );
                };

                socket.on('organizer_notification', handleOrganizerNotification);
                cleanups.push(() => {
                    socket.off('organizer_notification', handleOrganizerNotification);
                    socketService.leaveOrganizerRoom();
                });
            }

            // COMPANY ADMINS
            if ((role === 'admin' || role === 'organizer') && companyId) {
                socketService.joinCompanyRoom(companyId);

                const handleCompanyNotification = (payload: CompanyNotificationPayload) => {
                    console.log('🔔 Company Notification:', payload);
                    setNotifications(prev => [payload, ...prev]);
                    playNotificationSound();

                    showClickableToast(
                        payload.title,
                        payload.message,
                        '/admin/notifications', // Or /organizer/notifications if organizer
                        'success',
                        payload.timestamp
                    );

                    if (payload.type === 'company_approved' || payload.type === 'admin_approved') {
                        auth.refreshUser?.();
                    }
                };

                socket.on('company_notification', handleCompanyNotification);
                cleanups.push(() => {
                    socket.off('company_notification', handleCompanyNotification);
                    socketService.leaveCompanyRoom(companyId);
                });
            }
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            cleanups.forEach(cleanup => cleanup());
        };
    }, [auth?.user?.id, auth?.user?.role, auth?.user?.companyId, router]);

    const playNotificationSound = () => {
        try {
            // Using a online reliable sound (Mixkit 'Happy Bell')
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

    return (
        <NotificationContext.Provider value={{
            isConnected,
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
