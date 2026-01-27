'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, ShieldCheck, BarChart3, Globe, Cpu, Zap } from "lucide-react";

interface SplitScreenLayoutProps {
    formSide: React.ReactNode;
    isLogin: boolean;
    customMarketingContent?: React.ReactNode;
    leftPanelWidth?: string;
    rightPanelMaxWidth?: string;
}

const features = [
    {
        title: "Advanced Proctoring",
        description: "AI-driven integrity checks ensure fair assessments every time.",

        color: "text-emerald-400"
    },
    {
        title: "Real-time Code Execution",
        description: "Support for 40+ languages with instant feedback and test cases.",

        color: "text-blue-400"
    },
    {
        title: "Deep Analytics",
        description: "Gain actionable insights into candidate performance and skills.",

        color: "text-purple-400"
    },
    {
        title: "Global Infrastructure",
  
        color: "text-cyan-400"
    }
];

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
    formSide,
    isLogin,
    customMarketingContent,
    leftPanelWidth = isLogin ? "md:w-[60%] lg:w-[60%]" : "md:w-[40%] lg:w-[40%]",
    rightPanelMaxWidth = "max-w-3xl",
}) => {
    const [currentFeature, setCurrentFeature] = useState(0);

    // Auto-rotate features
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">

            {/* Left Panel - Interactive Showcase (Dark/Professional) */}
            <div className={`w-full ${leftPanelWidth} bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground relative overflow-hidden flex flex-col p-12 justify-between hidden md:flex`}>

                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-foreground/5 opacity-10"></div>
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                {/* Logo Area */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white mb-2">

                        <span>HirePlatform</span>
                    </div>
                    <p className="text-primary-foreground/60 text-sm font-medium ml-1">Enterprise Assessment Suite</p>
                </div>

                {/* Interactive Feature Carousel */}
                <div className="relative z-10 my-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentFeature}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >


                            <div>
                                <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                                    {features[currentFeature].title}
                                </h2>
                                <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-sm">
                                    {features[currentFeature].description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress Indicators */}
                    <div className="flex gap-2 mt-12">
                        {features.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentFeature ? "w-8 bg-white" : "w-2 bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer/Trust */}
                <div className="relative z-10 flex items-center gap-4 text-xs font-medium text-primary-foreground/50 uppercase tracking-widest">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-white/5" />
                        ))}
                    </div>
                    <span>Trusted by 500+ Engineering Teams</span>
                </div>
            </div>

            {/* Right Panel - Login/Register Form (Clean) */}
            <div className={`flex-1 flex flex-col justify-center items-center p-2 md:p-4 relative ${isLogin ? "login-form-padding" : ""}`}>
                <div className={`w-full ${rightPanelMaxWidth} space-y-8`}>
                    {formSide}
                </div>

                {/* Mobile Footer */}
                <div className="mt-8 text-center text-xs text-muted-foreground md:absolute md:bottom-8">
                    &copy; {new Date().getFullYear()} HirePlatform Inc. All rights reserved.
                </div>
            </div>

        </div>
    );
};
