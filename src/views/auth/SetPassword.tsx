// src/views/auth/SetPassword.tsx
'use client'

import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from 'next/navigation';
import { AuthContext } from "@/components/AuthProviderClient";
import { contestService } from "@/api/contestService";
import { showToast } from "@/utils/toast";
import { SplitScreenLayout } from "../SplitScreenLayout";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const schema = yup.object({
    password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password')], "Passwords must match")
        .required("Confirm Password is required"),
});

export default function SetPassword() {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: yupResolver(schema) });

    if (!auth?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Unauthorized. Please login first.</p>
            </div>
        );
    }

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await contestService.setPassword({
                newPassword: data.password
            });

            showToast("Password set successfully!", "success");
            await auth.refreshUser();
            if (auth?.user) {
                router.push(auth.user.role === "admin" ? "/admin/dashboard" : "/organizer/assessment-hub");
            }
        } catch (err) {
            console.error("Set password failed:", err);
            showToast("Failed to set password. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const formSide = (
        <div className="w-full max-w-sm animate-fade-in-slide-up">
            <h1 className="text-3xl font-bold mb-4 text-foreground text-center">
                Set Your Password
            </h1>
            <p className="text-muted-foreground text-center mb-10 text-sm">
                Please set a secure password for your account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {/* Password */}
                <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        {...register("password")}
                        className="w-full h-14 pl-12 pr-14 border border-border rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        {...register("confirmPassword")}
                        className="w-full h-14 pl-12 pr-14 border border-border rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 px-6 py-4 rounded-xl font-bold transition-all w-full flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : "Save Password"}
                </button>
            </form>
        </div>
    );

    return (
        <SplitScreenLayout
            isLogin
            formSide={formSide}
        />
    );
}
