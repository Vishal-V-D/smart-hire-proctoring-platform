"use client";

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/components/AuthProviderClient";

interface Props {
    permission?: 'createAssessment' | 'deleteAssessment' | 'viewAllAssessments';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const PermissionGuard = ({ permission, children, fallback }: Props) => {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const user = auth?.user;

    // Wait for auth to load? Assuming auth is ready or user is checked by parent ProtectedRoute.
    // If we want to be safe:
    if (auth?.loading) return null; // Or a spinner
    if (!user) {
        // router.push("/login"); // Don't redirect here, let parent handle or show nothing
        return null;
    }

    const role = user.role?.toUpperCase();

    console.log("🛡️ [PermissionGuard] Checking access:", {
        permission,
        userRole: role,
        companyStatus: (user.company as any)?.status,
        hasCompanyPermissions: !!user.company?.permissions,
        specificPermission: permission ? user.company?.permissions?.[permission] : 'N/A'
    });

    // 1. Organizers ALWAYS have access
    if (role === 'ORGANIZER') {
        console.log("✅ [PermissionGuard] Access GRANTED - User is Organizer");
        return <>{children}</>;
    }

    // 2. Company Admins: Check specific permission
    // Logic: 
    // - Must be ADMIN or COMPANY role
    // - Must have valid permission in EITHER user.company.permissions OR user.companyPermissions
    // - Status check is relaxed to avoid blocking valid users if status string is missing/mismatched, 
    //   but we still prefer 'APPROVED' if present.

    if (role === 'ADMIN' || role === 'COMPANY') {
        const companyStatus = (user.company as any)?.status;

        // If status is present, warn if not APPROVED but don't strictly block if they have permissions?
        // Actually, if they have permissions set to TRUE, we assume they are allowed.
        // Let's rely on the permission flags primarily.

        const hasPermission = !permission || // No specific permission required
            user.company?.permissions?.[permission] || // Check nested object
            user.companyPermissions?.[permission];     // Check flat object (fallback)

        if (hasPermission) {
            console.log(`✅ [PermissionGuard] Access GRANTED - Permission validated (Status: ${companyStatus || 'Unknown'})`);
            return <>{children}</>;
        } else {
            console.log(`❌ [PermissionGuard] Access DENIED - Missing '${permission}' permission`);
        }
    } else {
        console.log("❌ [PermissionGuard] Access DENIED - Invalid role");
    }

    // Access Denied
    if (fallback) return <>{fallback}</>;

    // If this is a page usage, we might want to redirect.
    // If this is a component usage (conditional rendering), we return null.
    // The user's example wraps routes, so AccessDeniedPage is returned.
    // Since we don't have a generic AccessDeniedPage handy in the snippet, we'll redirect or show a message.

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access this resource.</p>
        </div>
    );
};

export default PermissionGuard;
