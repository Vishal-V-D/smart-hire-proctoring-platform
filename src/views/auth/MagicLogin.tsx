// src/views/auth/MagicLogin.tsx
'use client'

import { useContext, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from "@/components/AuthProviderClient";
import { showToast } from "@/utils/toast";
import { SplitScreenLayout } from "../SplitScreenLayout";

export default function MagicLogin() {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const attempted = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            showToast("Magic link token is missing.", "error");
            return;
        }

        // Prevent double execution in StrictMode or re-renders
        if (attempted.current) return;

        // Wait for auth context to be ready
        if (!auth) return;

        attempted.current = true;

        const performMagicLogin = async () => {
            try {
                if (!auth) return;
                const loggedUser = await auth.magicLogin(token);
                setStatus('success');
                showToast("Magic login successful!", "success");

                if (loggedUser.requiresPasswordSetup) {
                    setTimeout(() => router.push("/auth/set-password"), 1500);
                } else {
                    const targetPath = loggedUser.role === "admin" ? "/admin/dashboard" : "/organizer/assessment-hub";
                    setTimeout(() => router.push(targetPath), 1500);
                }
            } catch (err) {
                console.error("Magic login failed:", err);
                setStatus('error');
                showToast("Invalid or expired magic link.", "error");
            }
        };

        performMagicLogin();
    }, [token, auth, router]);

    const formSide = (
        <div className="w-full max-w-sm animate-fade-in-slide-up text-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-6">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                    <h1 className="text-2xl font-bold text-foreground">Authenticating...</h1>
                    <p className="text-muted-foreground text-sm">Please wait while we sign you in.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Authentication Failed</h1>
                    <p className="text-muted-foreground text-sm">The magic link may have expired or is invalid.</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 px-6 py-3 rounded-xl font-bold transition-all w-full"
                    >
                        Go to Login
                    </button>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Success!</h1>
                    <p className="text-muted-foreground text-sm">Redirecting you to your dashboard...</p>
                </div>
            )}
        </div>
    );

    return (
        <SplitScreenLayout
            isLogin
            formSide={formSide}
        />
    );
}
