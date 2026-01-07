'use client';

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { contestService } from "../../api/contestService";
import { showToast } from "../../utils/toast";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Loader from "../../components/Loader";

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("Verifying your email...");

    // Prevent double execution in React Strict Mode
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        if (hasVerified.current) return;
        hasVerified.current = true;

        const verify = async () => {
            try {
                await contestService.verifyEmail(token);
                setStatus("success");
                setMessage("Email verified successfully! Redirecting to login...");
                showToast("Email verified successfully!", "success");

                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } catch (err: any) {
                // If the error says "already verified", treat it as success or a specific state
                // But for now, we'll just show the error message from backend
                setStatus("error");
                setMessage(err?.response?.data?.message || "Verification failed. Link may be invalid or expired.");
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-theme-bg p-4">
            <div className="bg-theme-secondary border border-theme rounded-2xl p-8 max-w-md w-full text-center shadow-lg animate-fade-in-slide-up">

                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader message="Verifying..." />
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <FaCheckCircle className="text-5xl text-green-500 animate-scale-in" />
                        <h2 className="text-2xl font-bold text-theme-primary">Verified!</h2>
                        <p className="text-theme-secondary">{message}</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <FaTimesCircle className="text-5xl text-[hsl(var(--color-error))] animate-scale-in" />
                        <h2 className="text-2xl font-bold text-theme-primary">Verification Failed</h2>
                        <p className="text-theme-secondary">{message}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="button-theme mt-4"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
