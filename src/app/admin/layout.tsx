// src/app/admin/layout.tsx
"use client";

import React, { useContext } from "react";
import { AuthContext } from "@/components/AuthProviderClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import { ThemeContext } from "@/context/ThemeContext";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useContext(AuthContext);
    const themeContext = useContext(ThemeContext);

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
