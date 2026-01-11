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
        <div className="w-full max-w-sm animate-fade-in-slide-up">
            <h1 className="text-4xl font-bold mb-10 text-theme-primary text-center">
                Sign In
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {/* Email */}
                <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        {...register("email")}
                        className="w-full h-14 pl-12 pr-4 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    {errors.email && <p className="text-[hsl(var(--color-error))] text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...register("password")}
                        className="w-full h-14 pl-12 pr-14 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && <p className="text-[hsl(var(--color-error))] text-sm mt-1">{errors.password.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="button-theme flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <FaUserShield /> Sign In
                        </>
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-sm">
                <Link
                    href="/partner-signup"
                    className="text-theme-secondary hover:text-theme-primary transition-colors hover:underline"
                >
                    Interested in becoming a partner? Register here
                </Link>
            </p>
        </div >
    );

    return (
        <SplitScreenLayout
            isLogin
            formSide={formSide}
        />
    );
}
