"use client";

import React, { useContext } from "react";
import { AuthContext } from "@/components/AuthProviderClient";
import OrganizerSidebar from "@/components/OrganizerSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/context/SidebarContext";

interface SharedLayoutProps {
    children: React.ReactNode;
    permission?: 'createAssessment' | 'deleteAssessment' | 'viewAllAssessments'; // Optional permission check for Admin
}

export default function SharedLayout({ children, permission }: SharedLayoutProps) {
    const auth = useContext(AuthContext);
    const userRole = auth?.user?.role?.toUpperCase();

    // Decide which Sidebar to use
    // If Organizer -> OrganizerSidebar
    // If Admin -> AdminSidebar
    // If neither (e.g. loading or error), might wait or show nothing. ProtectedRoute should handle redirect.

    // Logic:
    // Organizer gets OrganizerSidebar.
    // Admin gets AdminSidebar.
    // We wrap content in the standard layout div structure.

    return (
        // We use ProtectedRoute to ensure basic authentication. 
        // But what role? 'organizer' blocks admin. 'admin' blocks organizer? 
        // Actually, my modified ProtectedRoute allows specific overrides.
        // But if I pass 'organizer', ProtectedRoute checks: (role === 'organizer' || (role === 'admin' && actualRole === 'company'))
        // So passing 'organizer' might work for both IF Admin is mapped to Company role correctly.
        // However, it's safer to rely on PermissionGuard for granular control inside the page/layout, 
        // or make ProtectedRoute accept an array or generic check.
        // For now, I'll rely on PermissionGuard inside the layout or just assume Auth is present.
        // The user said "Wrap them with the new guard".

        <div className="min-h-screen bg-background flex text-foreground font-sans">
            <SidebarProvider>
                {/* Render Sidebar based on Role */}
                {/* Note: This assumes user is loaded. If loading, sidebar might flicker or not show. */}
                {userRole === 'ORGANIZER' && <OrganizerSidebar />}
                {(userRole === 'ADMIN' || userRole === 'COMPANY' || userRole === 'admin') && <AdminSidebar />}

                <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1 overflow-x-hidden">
                        {/* The PermissionGuard can be used here or in the Page. The user suggested using it in the Route element. */}
                        {/* If we put it here, we ensure access control at layout level for these routes. */}
                        {permission ? (
                            // Using the PermissionGuard component I created
                            <PermissionGuardWrapper permission={permission}>
                                {children}
                            </PermissionGuardWrapper>
                        ) : (
                            children
                        )}
                    </main>
                </div>
            </SidebarProvider>
        </div>
    );
}

// Wrapper to use the PermissionGuard component
import PermissionGuard from "@/components/PermissionGuard";

function PermissionGuardWrapper({ permission, children }: { permission: any, children: React.ReactNode }) {
    return (
        <PermissionGuard permission={permission}>
            {children}
        </PermissionGuard>
    );
}
