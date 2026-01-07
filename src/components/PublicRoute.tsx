'use client'

import { useContext, useEffect, type ReactNode } from "react";
import { useRouter } from 'next/navigation';
import { AuthContext } from "@/components/AuthProviderClient";

interface PublicRouteProps {
    children: ReactNode;
    redirectToDashboard?: boolean;
}

export default function PublicRoute({
    children,
    redirectToDashboard = true,
}: PublicRouteProps) {
    const auth = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (auth && !auth.loading && auth.user && redirectToDashboard) {
            const actualRole = auth.user.role?.toLowerCase();
            console.log("✅ [PublicRoute] User found. Redirecting based on role:", actualRole);

            const searchParams = new URLSearchParams(window.location.search);
            const redirectPath = searchParams.get('redirect');

            if (redirectPath) {
                console.log("🚀 [PublicRoute] Redirecting to param:", redirectPath);
                router.replace(redirectPath);
            } else {
                router.replace(actualRole === "organizer" ? "/organizer" : "/contestant");
            }
        }
    }, [auth, redirectToDashboard, router]);

    if (!auth || auth.loading) return <div>Loading...</div>;

    // If user is logged in and we are redirecting, don't render children
    if (auth.user && redirectToDashboard) {
        return null;
    }

    return <>{children}</>;
}
