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
    website: yup.string().url("Must be a valid URL").required("Website is required"),
    details: yup.string().required("Company details are required"),
    contactEmail: yup.string().email("Must be a valid email").required("Company contact email is required"),
    contactPhone: yup.string().required("Company contact phone is required"),
    adminName: yup.string().min(3, "Admin name must be at least 3 characters").required("Admin name is required"),
    adminEmail: yup.string().email("Must be a valid email").required("Admin email is required"),
});

type PartnerFormData = yup.InferType<typeof partnerSchema>;

export default function PartnerSignup() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PartnerFormData>({
        resolver: yupResolver(partnerSchema),
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
        <div className="w-full max-w-md mx-auto animate-fade-in-slide-up">
            <h1 className="text-2xl font-bold mb-1.5 text-theme-primary text-center">
                Partner Registration
            </h1>
            <p className="text-theme-secondary text-center mb-5 text-sm">
                Register your company. No password required yet.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">

                {/* Company Details Section */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider border-b border-theme pb-1.5">
                        Company Details
                    </h3>

                    {/* Company Name & Website in a row */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <div className="relative">
                                <FaBuilding className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    {...register("companyName")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.companyName && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.companyName.message}</p>}
                        </div>

                        <div>
                            <div className="relative">
                                <FaGlobe className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="url"
                                    placeholder="Website URL"
                                    {...register("website")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.website && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.website.message}</p>}
                        </div>
                    </div>

                    {/* Contact Email & Phone in a row */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="email"
                                    placeholder="Contact Email"
                                    {...register("contactEmail")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.contactEmail && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.contactEmail.message}</p>}
                        </div>

                        <div>
                            <div className="relative">
                                <FaPhone className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="tel"
                                    placeholder="Contact Phone"
                                    {...register("contactPhone")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.contactPhone && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.contactPhone.message}</p>}
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <div className="relative">
                            <FaInfoCircle className="absolute left-3.5 top-3.5 text-theme-secondary opacity-60" />
                            <textarea
                                placeholder="Tell us about your company..."
                                {...register("details")}
                                className="w-full h-20 pl-10 pr-3 py-2.5 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all resize-none"
                            />
                        </div>
                        {errors.details && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.details.message}</p>}
                    </div>
                </div>

                {/* Admin Details Section */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider border-b border-theme pb-1.5">
                        Admin Account
                    </h3>

                    {/* Admin Name & Email in a row */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <div className="relative">
                                <FaUser className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="text"
                                    placeholder="Admin Name"
                                    {...register("adminName")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.adminName && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.adminName.message}</p>}
                        </div>

                        <div>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3.5 top-[14px] text-theme-secondary opacity-60" />
                                <input
                                    type="email"
                                    placeholder="Admin Email"
                                    {...register("adminEmail")}
                                    className="w-full h-11 pl-10 pr-3 text-base border border-theme rounded-lg bg-theme-secondary text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-all"
                                />
                            </div>
                            {errors.adminEmail && <p className="text-[hsl(var(--color-error))] text-[10px] mt-0.5 leading-tight">{errors.adminEmail.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="pt-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="button-theme w-full disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-base font-semibold tracking-wide uppercase transition-all duration-300 border-2 border-[hsl(var(--color-accent))] hover:shadow-lg hover:scale-[1.02] hover:border-[hsl(var(--color-accent))]/80 active:scale-[0.98]"
                    >
                        {loading ? "Registering..." : "Submit Registration"}
                    </button>
                    <p className="mt-3.5 text-center text-theme-secondary text-xs">
                        Already a partner?{" "}
                        <Link
                            href="/login"
                            className="text-[hsl(var(--color-accent))] font-medium hover:underline transition-colors"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );

    const partnershipContent = (
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-8">
            <div className="w-16 h-16 bg-primary-foreground/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <FaBuilding className="text-4xl text-primary-foreground" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
                Partner With Us
            </h2>
            <p className="text-lg leading-relaxed max-w-md text-primary-foreground/90 mb-8">
                Join our growing network of companies and unlock powerful hiring solutions.
            </p>

            <div className="space-y-4 max-w-md w-full">
                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-left border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaGlobe className="text-primary-foreground text-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary-foreground mb-1">Global Reach</h3>
                            <p className="text-sm text-primary-foreground/80">Access top talent from around the world</p>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-left border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaCheckCircle className="text-primary-foreground text-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary-foreground mb-1">Dedicated Support</h3>
                            <p className="text-sm text-primary-foreground/80">24/7 assistance for your hiring needs</p>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-left border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaInfoCircle className="text-primary-foreground text-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-primary-foreground mb-1">Advanced Tools</h3>
                            <p className="text-sm text-primary-foreground/80">AI-powered proctoring and analytics</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <SplitScreenLayout
            isLogin={false}
            formSide={formSide}
            customMarketingContent={partnershipContent}
        />
    );
}
