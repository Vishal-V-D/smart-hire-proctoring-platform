'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Shield, ArrowRight, Loader2, ChevronLeft, UserCheck, Sparkles, Lock, CheckCircle } from 'lucide-react';
import OTPInput from '@/components/contestant/OTPInput';
import { contestantService } from '@/api/contestantService';

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const assessmentId = searchParams.get('assessmentId') || '';
    const emailParam = searchParams.get('email') || '';

    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState(emailParam);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const handleSendOTP = async () => {
        if (!email || !assessmentId) {
            setError('Email and assessment ID are required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await contestantService.sendOTP({ email, assessmentId });
            setStep('otp');
            setResendCountdown(60);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete OTP');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await contestantService.verifyOTP({ email, otp, assessmentId });
            router.push(`/contestant/register?email=${encodeURIComponent(email)}&assessmentId=${assessmentId}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#f8f7ff] via-[#f0eeff] to-[#e8e5ff]">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)`
            }} />

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-5xl flex bg-white rounded-3xl shadow-2xl shadow-purple-200/50 overflow-hidden"
            >
                {/* Left Side - Illustration */}
                <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] p-12 items-center justify-center relative">
                    {/* Logo Branding */}
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-15 h-15 rounded-xl object-contain" />
                        <span className="text-sm font-bold text-gray-800">SecureHire</span>
                    </div>

                    {/* SVG Illustration */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                        className="relative w-full max-w-lg"
                    >
                        <img
                            src="/otp-security.svg"
                            alt="OTP Security"
                            className="w-full h-auto drop-shadow-xl"
                        />
                    </motion.div>

                    {/* Decorative Circles */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-purple-200/50"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                        className="absolute top-20 right-10 w-12 h-12 rounded-full bg-indigo-200/50"
                    />
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 'email' ? (
                            <motion.div
                                key="email-step"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="flex flex-col"
                            >
                                {/* Logo Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="relative mb-6"
                                >
                                   
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    </motion.div>
                                </motion.div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Identity Verification
                                </h1>
                                <p className="text-gray-500 text-sm mb-2">
                                    Please enter the email address where you received the assessment invitation.
                                </p>
                                <p className="text-purple-600 text-xs font-medium mb-6 bg-purple-50 px-3 py-2 rounded-lg">
                                    ✉️ Use the same email from your invitation link
                                </p>

                                <div className="space-y-4">
                                    {/* Email Input */}
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                                            placeholder="your.email@company.com"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-900"
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    {/* Submit Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSendOTP}
                                        disabled={loading || !email}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Send Verification Code
                                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-xs text-gray-500 text-center pt-2">
                                        Need help? <button className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">Contact Support</button>
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="flex flex-col"
                            >
                                <button
                                    onClick={() => setStep('email')}
                                    className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-6"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>

                                {/* Logo Icon */}
                               
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Enter Verification Code
                                </h1>
                                <p className="text-gray-500 text-sm mb-8">
                                    We sent a 6-digit code to<br />
                                    <span className="font-semibold text-purple-600">{email}</span>
                                </p>

                                <div className="space-y-6">
                                    <OTPInput
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={loading}
                                    />

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otp.length !== 6}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Shield className="w-5 h-5" />
                                                Verify & Continue
                                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>

                                    <div className="text-sm text-gray-500 text-center">
                                        Didn't receive the code?{' '}
                                        {resendCountdown > 0 ? (
                                            <span className="font-semibold text-gray-700">
                                                Resend in <span className="text-purple-600">{resendCountdown}s</span>
                                            </span>
                                        ) : (
                                            <button onClick={handleSendOTP} className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                                                Resend Code
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            End-to-End Encrypted
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}