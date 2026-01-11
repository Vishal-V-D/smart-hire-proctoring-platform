'use client';

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, Suspense } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SplitScreenLayout } from "../SplitScreenLayout";
import { showToast } from "@/utils/toast";
import {
    FaLock,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
} from "react-icons/fa";
import { companyService } from "@/api/companyService";

const setupPasswordSchema = yup.object({
    password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required("Confirm password is required"),
});

type SetupPasswordFormData = yup.InferType<typeof setupPasswordSchema>;

function SetupPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SetupPasswordFormData>({
        resolver: yupResolver(setupPasswordSchema),
    });

    const onSubmit = async (data: SetupPasswordFormData) => {
        if (!token) {
            showToast("Invalid or missing token.", "error");
            return;
        }

        setLoading(true);
        try {
            await companyService.setupPassword({
                token,
                password: data.password
            });
            setSuccess(true);
            showToast("Password set successfully! You can now login.", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to set password.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-sm text-center animate-fade-in-slide-up">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">You're All Set!</h2>
                <p className="text-muted-foreground mb-8">
                    Your password has been set successfully. You can now access your account.
                </p>
                <Link
                    href="/login"
                    className="button-theme w-full inline-block py-3"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="text-center">
                <h1 className="text-xl font-bold text-red-500 mb-2">Invalid Link</h1>
                <p className="text-muted-foreground">This setup link is invalid or missing a token.</p>
                <Link href="/login" className="mt-4 block text-theme-primary hover:underline">
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto animate-fade-in-slide-up pb-10">
            <h1 className="text-3xl font-bold mb-2 text-theme-primary text-center">
                Set Your Password
            </h1>
            <p className="text-theme-secondary text-center mb-8">
                Create a secure password to access your account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Password */}
                <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        {...register("password")}
                        className="w-full h-12 pl-12 pr-14 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && <p className="text-[hsl(var(--color-error))] text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary opacity-60" />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        {...register("confirmPassword")}
                        className="w-full h-12 pl-12 pr-14 border border-theme rounded-xl bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.confirmPassword && <p className="text-[hsl(var(--color-error))] text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="button-theme w-full disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
                    >
                        {loading ? "Setting Password..." : "Set Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function SetupPassword() {
    return (
        <SplitScreenLayout
            isLogin={false}
            formSide={
                <Suspense fallback={<div>Loading...</div>}>
                    <SetupPasswordForm />
                </Suspense>
            }
        />
    );
}
