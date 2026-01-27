'use client'

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SplitScreenLayout } from "../SplitScreenLayout";
import { showToast } from "@/utils/toast";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaBuilding,
    FaGlobe,
    FaInfoCircle,
    FaCheckCircle,
    FaPhone,
} from "react-icons/fa";
import { companyService } from "@/api/companyService";

const partnerSchema = yup.object({
    companyName: yup.string().required("Company name is required"),
    website: yup.string().transform((value) => (!value ? null : value)).url("Must be a valid URL").nullable().notRequired(),
    details: yup.string().nullable().notRequired(),
    contactEmail: yup.string().email("Must be a valid email").required("Company contact email is required"),
    contactPhone: yup.string().required("Company contact phone is required"),
    adminName: yup.string().min(3, "Admin name must be at least 3 characters").required("Admin name is required"),
    adminEmail: yup.string().email("Must be a valid email").required("Admin email is required"),
});

interface PartnerFormData {
    companyName: string;
    website?: string | null;
    details?: string | null;
    contactEmail: string;
    contactPhone: string;
    adminName: string;
    adminEmail: string;
}

export default function PartnerSignup() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PartnerFormData>({
        resolver: yupResolver(partnerSchema) as any,
    });

    const onSubmit = async (data: PartnerFormData) => {
        setLoading(true);
        try {
            await companyService.register(data);
            setSuccess(true);
            showToast("Registration successful! Check your email for next steps.", "success");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Registration failed!", "error");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-xl animate-fade-in-slide-up">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Registration Received</h2>
                    <p className="text-muted-foreground mb-8">
                        Your company registration has been submitted successfully.
                        Once approved by an organizer, you will receive an <strong>email with a link to set your password</strong> and access your account.
                    </p>
                    <Link
                        href="/login"
                        className="button-theme w-full inline-block py-3"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    const formSide = (
        <div className="w-full partner-signup-form mx-auto flex flex-col justify-center h-full text-xs">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                    Partner Registration
                </h1>
                <p className="text-muted-foreground text-xs">
                    Join our network of 500+ enterprises. No credit card required.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

                {/* Section 1: Company Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest border-b border-border pb-2 mb-3 mt-2">
                        Company Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-foreground uppercase mb-2 block">Company Name</label>
                            <div className="relative group">
                                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={13} />
                                <input
                                    type="text"
                                    placeholder="Acme Inc."
                                    {...register("companyName")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border border-border/60 hover:border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-xs shadow-sm"
                                />
                            </div>
                            {errors.companyName && <p className="text-destructive text-[10px] font-semibold mt-1">{errors.companyName.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">
                                Website URL <span className="text-muted-foreground ml-1 font-normal normal-case">(Optional)</span>
                            </label>
                            <div className="relative group">
                                <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="url"
                                    placeholder="https://acme.com"
                                    {...register("website")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">Contact Email</label>
                            <div className="relative group">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="contact@acme.com"
                                    {...register("contactEmail")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm shadow-sm"
                                />
                            </div>
                            {errors.contactEmail && <p className="text-destructive text-xs font-semibold mt-1">{errors.contactEmail.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">Phone Number</label>
                            <div className="relative group">
                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    {...register("contactPhone")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm shadow-sm"
                                />
                            </div>
                            {errors.contactPhone && <p className="text-destructive text-xs font-semibold mt-1">{errors.contactPhone.message}</p>}
                        </div>

                        {/* Details - Full Width */}
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">
                                About the Company <span className="text-muted-foreground ml-1 font-normal normal-case">(Optional)</span>
                            </label>
                            <div className="relative group">
                                <FaInfoCircle className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <textarea
                                    placeholder="Tell us a bit about your company..."
                                    {...register("details")}
                                    className="w-full h-20 pl-12 pr-4 py-3 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm resize-none shadow-sm"
                                />
                            </div>
                            {errors.details && <p className="text-destructive text-xs font-semibold mt-1">{errors.details.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <hr className="border-t border-border/50" />

                {/* Section 2: Admin Account */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest border-b border-border pb-2 mb-3">
                        Administrator Account
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">Admin Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    {...register("adminName")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm shadow-sm"
                                />
                            </div>
                            {errors.adminName && <p className="text-destructive text-xs font-semibold mt-1">{errors.adminName.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase mb-2 block">Admin Email</label>
                            <div className="relative group">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="admin@acme.com"
                                    {...register("adminEmail")}
                                    className="w-full h-12 pl-12 pr-4 bg-background border-2 border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm shadow-sm"
                                />
                            </div>
                            {errors.adminEmail && <p className="text-destructive text-xs font-semibold mt-1">{errors.adminEmail.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-br from-[#7F56D9] to-[#4F46E5] text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                    >
                        {loading ? "Registering..." : "Create Partner Account"}
                    </button>
                    <p className="mt-4 text-center text-muted-foreground text-md mb-2 font-medium">
                        Already a partner?{" "}
                        <Link
                            href="/login"
                            className="text-primary font-bold hover:underline transition-colors"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );

    const partnershipContent = (
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <FaGlobe className="text-3xl text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">
                Global Impact
            </h2>
            <p className="text-sm leading-relaxed max-w-xs text-white/80">
                Join our mission to democratize technical hiring worldwide.
            </p>
        </div>
    );

    return (
        <SplitScreenLayout
            isLogin={false}
            formSide={formSide}
            customMarketingContent={partnershipContent}
            leftPanelWidth="md:w-[40%] lg:w-[40%]"
        />
    );
}
