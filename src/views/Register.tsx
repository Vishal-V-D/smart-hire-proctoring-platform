// src/views/Register.tsx
'use client'

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useContext, useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from "@/components/AuthProviderClient";
import { SplitScreenLayout } from "./SplitScreenLayout";
import { showToast } from "@/utils/toast";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaBuilding,
    FaEnvelopeOpenText,
} from "react-icons/fa";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const registerSchema = yup.object({
    name: yup
        .string()
        .min(3, "Name must be at least 3 characters")
        .required("Name is required"),
    email: yup
        .string()
        .email("Must be a valid email")
        .required("Email is required"),
    password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/[0-9]/, "Must contain at least one number")
        .required("Password is required"),
    role: yup
        .string()
        .oneOf(["organizer"], "Invalid role")
        .default("organizer"),
    organizationName: yup.string().required("Organization name is required"),
});

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    role: "organizer" | "contestant";
    organizationName?: string;
}

export default function Register() {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset,
        watch,
    } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema) as any,
        defaultValues: {
            role: "organizer",
            organizationName: ""
        },
    });

    const selectedRole = watch("role");
    const togglePasswordVisibility = () => setShowPassword((p) => !p);

    // Handle case where AuthContext is still loading
    if (!auth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-primary">
                <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--color-accent))] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { registerUser } = auth;

    // Client-side Guard: If already logged in, redirect immediately
    useEffect(() => {
        if (auth.user && !auth.loading) {
            console.log("✅ [Register] Already logged in. Redirecting...");
            if (redirectPath) {
                router.replace(redirectPath);
            } else {
                router.replace(auth.user.role === "organizer" ? "/organizer" : "/contestant");
            }
        }
    }, [auth.user, auth.loading, redirectPath, router]);

    const onSubmit = async (data: RegisterFormData) => {
        // Force role to organizer
        data.role = "organizer";

        setLoading(true);
        try {
            await registerUser({
                username: data.name,
                email: data.email,
                password: data.password,
                role: data.role as "organizer" | "contestant",
                organizationName: data.organizationName,
            });

            // Store email for the modal and show verification modal
            setRegisteredEmail(data.email);
            reset();
            setShowVerifyModal(true);

        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            showToast(axiosError?.response?.data?.message || "Registration failed!", "error");
        } finally {
            setLoading(false);
        }
    };

    const formSide = (
        <div className="w-full max-w-sm animate-fade-in-slide-up">
            <h1 className="text-3xl font-bold mb-6 text-theme-primary text-center">
                Create Account
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                <GoogleAuthButton role="organizer" text="signup_with" />

                <div className="flex items-center gap-4 my-1">
                    <div className="h-px bg-theme-secondary flex-1"></div>
                    <span className="text-theme-secondary text-xs">OR</span>
                    <div className="h-px bg-theme-secondary flex-1"></div>
                </div>

                {/* Name Field */}
                <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />

                    <input
                        type="text"
                        placeholder="Organizer Name"
                        {...register("name")}
                        className="w-full h-14 pl-12 pr-4 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    {errors.name && (
                        <p className="text-[hsl(var(--color-error))] text-xs mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Organization Name Field */}
                <div className="relative animate-fade-in">
                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type="text"
                        placeholder="Organization Name"
                        {...register("organizationName")}
                        className="w-full h-14 pl-12 pr-4 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    {errors.organizationName && (
                        <p className="text-[hsl(var(--color-error))] text-xs mt-1">
                            {errors.organizationName.message}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type="email"
                        placeholder="Email Address"
                        {...register("email")}
                        className="w-full h-14 pl-12 pr-4 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    {errors.email && (
                        <p className="text-[hsl(var(--color-error))] text-xs mt-1">
                            {errors.email.message}
                        </p>
                    )}
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

                    {errors.password && (
                        <p className="text-[hsl(var(--color-error))] text-xs mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="button-theme mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                5.291A7.962 7.962 0 014 12H0c0 
                3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>

            <p className="mt-4 text-center text-theme-secondary">
                Already registered?{" "}
                <Link
                    href="/login"
                    className="text-[hsl(var(--color-accent))] font-medium hover:underline transition-colors"
                >
                    Sign in!
                </Link>
            </p>
        </div>
    );

    const handleGoToLogin = () => {
        setShowVerifyModal(false);
        const loginUrl = redirectPath
            ? `/login?redirect=${encodeURIComponent(redirectPath)}`
            : "/login";
        router.push(loginUrl);
    };

    // Email Verification Modal
    const verifyEmailModal = showVerifyModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-slide-up">
                {/* Email Icon with Animation */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                        <FaEnvelopeOpenText className="text-4xl text-primary-foreground animate-pulse" />
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[hsl(var(--color-success))] rounded-full opacity-80 animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[hsl(var(--color-accent))] rounded-full opacity-60" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-theme-primary mb-3">
                    Check Your Email
                </h2>

                {/* Message */}
                <p className="text-theme-secondary mb-2">
                    We've sent a verification link to:
                </p>
                <p className="text-[hsl(var(--color-accent))] font-semibold mb-4 break-all">
                    {registeredEmail}
                </p>
                <p className="text-theme-muted text-sm mb-6">
                    Click the verify link in the email to activate your account.
                    Don't forget to check your spam folder!
                </p>

                {/* Divider */}
                <div className="h-px bg-theme mb-6" />

                {/* Action Button */}
                <button
                    onClick={handleGoToLogin}
                    className="w-full button-theme py-3 text-lg font-semibold"
                >
                    Go to Login
                </button>

                {/* Additional Info */}
                <p className="text-theme-muted text-xs mt-4">
                    Didn't receive the email?{" "}
                    <span className="text-[hsl(var(--color-accent))] cursor-pointer hover:underline">
                        Resend verification email
                    </span>
                </p>
            </div>
        </div>
    );

    return (
        <>
            {verifyEmailModal}
            <SplitScreenLayout formSide={formSide} isLogin={false} />
        </>
    );
}
