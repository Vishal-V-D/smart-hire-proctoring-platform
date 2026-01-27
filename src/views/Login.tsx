// src/views/Login.tsx
'use client'

import { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from "@/components/AuthProviderClient";
import Cookies from "js-cookie";
import { showToast } from "@/utils/toast";
import { SplitScreenLayout } from "./SplitScreenLayout";
import { FaEnvelope, FaLock, FaUserShield, FaEye, FaEyeSlash } from "react-icons/fa";

const loginSchema = yup.object({
    email: yup.string().email("Must be a valid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: yupResolver(loginSchema) });

    // Handle case where AuthContext is still loading
    if (!auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-primary">
                <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--color-accent))] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { login } = auth;

    // Client-side Guard: If already logged in, redirect immediately
    useEffect(() => {
        if (auth.user && !auth.loading) {
            console.log("✅ [Login] Already logged in. Redirecting...");
            if (redirectPath) {
                router.replace(redirectPath);
            } else {
                const role = (auth.user.role || '').toLowerCase();
                if (role === "organizer") {
                    router.replace("/organizer");
                } else if (role === "admin" || role === "company") {
                    router.replace("/admin/dashboard");
                } else {
                    router.replace("/contestant");
                }
            }
        }
    }, [auth.user, auth.loading, redirectPath, router]);

    const onSubmit = async (data: { email: string; password: string }) => {
        setLoading(true);
        try {
            const loggedUser = await login(data);
            showToast("Logged in!", "success");

            console.log("✅ [Login] Login successful, user:", loggedUser);

            // Wait for cookie to be set
            let retries = 0;
            while (!Cookies.get("token") && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 50));
                retries++;
            }

            // Navigate based on redirect param or user role
            if (redirectPath) {
                console.log("🚀 [Login] Redirecting to:", redirectPath);
                router.push(redirectPath);
            } else {
                const role = (loggedUser.role || '').toLowerCase();
                if (role === "organizer") {
                    console.log("🚀 [Login] Navigating to /organizer");
                    router.push("/organizer");
                } else if (role === "admin" || role === "company") {
                    console.log("🚀 [Login] Navigating to /admin/dashboard");
                    router.push("/admin/dashboard");
                } else {
                    console.log("🚀 [Login] Navigating to /contestant");
                    router.push("/contestant");
                }
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number } };
            if (axiosError?.response?.status === 403) {
                showToast("Your email is not verified. Please check your inbox.", "error");
            } else {
                showToast("Invalid credentials", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword((p) => !p);

    const formSide = (
        <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold mb-2 text-foreground text-center tracking-tight">
                Welcome Back
            </h1>
            <p className="text-muted-foreground text-center mb-10 text-sm">
                Enter your credentials to access your account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide ml-1">Email Address</label>
                    <div className="relative group">
                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="email"
                            placeholder="name@company.com"
                            {...register("email")}
                            className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        />
                    </div>
                    {errors.email && <p className="text-destructive text-xs font-semibold ml-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Password</label>
                        <Link href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
                    </div>

                    <div className="relative group">
                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("password")}
                            className="w-full h-12 pl-12 pr-14 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs font-semibold ml-1">{errors.password.message}</p>}
                </div>

                <div className="flex items-center gap-2 my-2">
                    <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-primary" />
                    <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">Remember for 30 days</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            Sign In <FaUserShield />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-foreground">
                Don't have an account?{" "}
                <Link
                    href="/partner-signup"
                    className="text-primary font-bold hover:underline"
                >
                    Sign up
                </Link>
            </div>
        </div >
    );

    return (
        <SplitScreenLayout
            isLogin
            formSide={formSide}
        />
    );
}
