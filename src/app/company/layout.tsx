// src/app/company/layout.tsx
"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background flex text-foreground font-sans">
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1 overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
