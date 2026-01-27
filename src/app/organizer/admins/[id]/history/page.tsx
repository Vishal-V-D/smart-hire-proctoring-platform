'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api/adminService';
import {
    FaHistory,
    FaArrowLeft,
    FaUserShield,
    FaClock,
    FaInfoCircle,
    FaCalendarAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AdminActivityHistoryPage() {
    const { id } = useParams();
    const router = useRouter();

    // Note: Assuming there is a generic activity log endpoint or admin-specific one.
    // If not, we show a clean placeholder or use the details endpoint if it contains history.
    const { data: adminDetails, isLoading } = useQuery({
        queryKey: ['admin-details', id],
        queryFn: async () => {
            const res = await adminService.getAdminDetails(id as string);
            return res.data;
        }
    });

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit group"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Back to Admins</span>
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <FaHistory size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                Activity History
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Recent actions performed by <span className="font-bold text-foreground">
                                    {adminDetails?.admin?.fullName || 'Loading admin...'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm min-h-[400px]">
                <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
                    <FaClock className="text-blue-500" />
                    <h3 className="font-bold text-foreground">Recent Activity Logs</h3>
                </div>

                <div className="p-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto border-4 border-background shadow-inner">
                        <FaHistory size={40} className="text-muted-foreground/30" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-foreground">Activity Logging in Progress</h3>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            Detailed activity tracking for individual admins is currently being initialized. Specific actions like assessment creation, invitation management, and proctoring reviews will be visible here.
                        </p>
                    </div>

                    <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-left">
                            <FaCalendarAlt className="text-primary mb-2" />
                            <span className="text-[10px] uppercase font-Inter text-muted-foreground tracking-widest block mb-1">Last Active</span>
                            <span className="text-sm font-bold text-foreground">
                                {adminDetails?.admin?.lastLogin ? new Date(adminDetails.admin.lastLogin).toLocaleDateString() : 'Just now'}
                            </span>
                        </div>
                        <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-left md:col-span-2">
                            <FaInfoCircle className="text-blue-500 mb-2" />
                            <span className="text-[10px] uppercase font-Inter text-muted-foreground tracking-widest block mb-1">Status Overview</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This user has been part of the team since <strong>{adminDetails?.admin?.createdAt ? new Date(adminDetails.admin.createdAt).toLocaleDateString() : 'recently'}</strong> and maintains active access to the <strong>{adminDetails?.admin?.accessType || 'Standard'}</strong> features.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
