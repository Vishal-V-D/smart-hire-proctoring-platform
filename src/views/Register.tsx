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
        .oneOf(["organizer", "contestant"], "Invalid role")
        .required("Role is required") as yup.Schema<"organizer" | "contestant">,
    organizationName: yup.string().optional(),
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

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset,
        watch,
    } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema) as any, // Cast to any to avoid optionality mismatch issue
        defaultValues: {
            role: "contestant",
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
        // Manual validation for organization name
        if (data.role === 'organizer' && !data.organizationName?.trim()) {
            setError('organizationName', { type: 'manual', message: 'Organization name is required' });
            return;
        }

        setLoading(true);
        try {
            await registerUser({
                username: data.name,
                email: data.email,
                password: data.password,
                role: data.role as "organizer" | "contestant",
                organizationName: data.organizationName,
            });

            showToast("Registration successful! Please check your email to verify your account.", "success");
            reset();

            const loginUrl = redirectPath
                ? `/login?redirect=${encodeURIComponent(redirectPath)}`
                : "/login";

            console.log("🚀 [Register] Redirecting to:", loginUrl);
            router.push(loginUrl);

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

                {/* Role Selection Card */}
                <div className="bg-theme-secondary border border-theme rounded-xl p-3 shadow-md">
                    <p className="text-xs font-medium text-theme-primary mb-2 text-center">
                        Select your role
                    </p>

                    <div className="flex items-center justify-between gap-3">

                        {/* Organizer */}
                        <label
                            className={`flex-1 border rounded-lg p-2 cursor-pointer text-center transition 
                ${selectedRole === "organizer"
                                    ? "border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.1)]"
                                    : "border-theme"
                                }`}
                        >
                            <input
                                type="radio"
                                value="organizer"
                                {...register("role")}
                                className="hidden"
                            />
                            <span className="font-medium text-sm">Organizer</span>
                        </label>

                        {/* Contestant */}
                        <label
                            className={`flex-1 border rounded-lg p-2 cursor-pointer text-center transition 
                ${selectedRole === "contestant"
                                    ? "border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.1)]"
                                    : "border-theme"
                                }`}
                        >
                            <input
                                type="radio"
                                value="contestant"
                                {...register("role")}
                                className="hidden"
                            />
                            <span className="font-medium text-sm">Contestant</span>
                        </label>
                    </div>

                    {errors.role && (
                        <p className="text-[hsl(var(--color-error))] text-xs mt-1">
                            {errors.role.message}
                        </p>
                    )}
                </div>

                <GoogleAuthButton role={selectedRole as "organizer" | "contestant"} text="signup_with" />

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
                        placeholder={
                            selectedRole === "organizer" ? "Organizer Name" : "Full Name"
                        }
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
                {selectedRole === "organizer" && (
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
                )}

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

    return <SplitScreenLayout formSide={formSide} isLogin={false} />;
}
