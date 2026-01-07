'use client'

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/components/AuthProviderClient";

interface ProtectedRouteProps {
    role?: "organizer" | "contestant" | "admin";
    children: React.ReactNode;
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
    const auth = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!auth) return;
        const { user, loading } = auth;

        if (!loading) {
            if (!user) {
                console.log("🚫 [ProtectedRoute] No user found. Redirecting to login.");
                router.push("/login");
                return;
            }

            const actualRole = user?.role?.toLowerCase();
            console.log("✅ [ProtectedRoute] Checking role:", { expected: role, actual: actualRole });

            if (role && actualRole !== role.toLowerCase()) {
                console.log(`🚫 [ProtectedRoute] Role mismatch. Expected ${role}, got ${actualRole}. Redirecting...`);
                let target = "/login";
                if (actualRole === "organizer") target = "/organizer/assessment-hub";
                else if (actualRole === "contestant") target = "/contestant";
                else if (actualRole === "admin") target = "/admin/dashboard";

                router.push(target);
            }
        }
    }, [auth, role, router]);

    // Show loading state while auth is being checked
    if (!auth || auth.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--color-accent))] border-t-transparent rounded-full"></div>
                    <span className="text-theme-secondary">Verifying access...</span>
                </div>
            </div>
        );
    }

    // If no user, show loading while redirect happens
    if (!auth.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--color-accent))] border-t-transparent rounded-full"></div>
                    <span className="text-theme-secondary">Redirecting to login...</span>
                </div>
            </div>
        );
    }

    // Check role mismatch
    const actualRole = auth.user?.role?.toLowerCase();
    if (role && actualRole !== role.toLowerCase()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--color-accent))] border-t-transparent rounded-full"></div>
                    <span className="text-theme-secondary">Redirecting...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
