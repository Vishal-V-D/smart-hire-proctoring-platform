'use client'

import React from "react";
import { FaLaptopCode, FaRocket } from "react-icons/fa";
import { motion } from "framer-motion";

interface SplitScreenLayoutProps {
    formSide: React.ReactNode;
    isLogin: boolean;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
    formSide,
    isLogin,
}) => {
    const cyanPanelClass =
        "bg-primary text-primary-foreground p-8 md:p-16 flex flex-col justify-center items-center shadow-2xl transition-all duration-700 ease-in-out";

    const whitePanelClass =
        "bg-card text-foreground p-8 md:p-16 flex flex-col justify-center items-center transition-all duration-700 ease-in-out";

    const marketingContent = isLogin
        ? {
            title: "Welcome Back!",
            icon: <FaLaptopCode className="text-6xl mb-4 text-primary-foreground" />,
            text: "Please sign in to access your dashboard and manage your work.",
            cta: "New here? Register now!",
        }
        : {
            title: "Get Started!",
            icon: <FaRocket className="text-6xl mb-4 text-primary-foreground" />,
            text: "Join our platform! Whether you're a contestant or an organizer, we've got you covered.",
            cta: "Already registered? Sign in!",
        };

    const isFormOnLeft = isLogin;

    // Transition settings

    const marketingPanel = (
        <motion.div
            layout
            key="marketing-panel"
            transition={{ type: "spring", stiffness: 70, damping: 20, mass: 1.2 }}
            className={`w-full md:w-1/2 hidden md:flex ${cyanPanelClass} ${isFormOnLeft ? "rounded-bl-[4rem] rounded-tl-[4rem] ml-[-2rem]" : "rounded-br-[4rem] rounded-tr-[4rem] mr-[-2rem]"
                } relative overflow-hidden z-20 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]`}
        >
            <motion.div
                key={isLogin ? "login-marketing" : "register-marketing"}
                initial={{ opacity: 0, x: isFormOnLeft ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isFormOnLeft ? -20 : 20 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center"
            >
                {marketingContent.icon}
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
                    {marketingContent.title}
                </h2>
                <p className="text-lg md:text-xl leading-relaxed max-w-sm text-primary-foreground/80">
                    {marketingContent.text}
                </p>
                <div onClick={() => {
                    // This creates a smoother perceived transition if this was client-side routing
                }}>
                    <p className="mt-8 text-base font-medium underline hover:opacity-80 cursor-pointer">
                        {marketingContent.cta}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );

    const formPanel = (
        <motion.div
            layout
            key="form-panel"
            transition={{ type: "spring", stiffness: 70, damping: 20, mass: 1.2 }}
            className={`w-full md:w-1/2 ${whitePanelClass} max-w-none flex flex-col justify-center relative z-10`}
        >
            <div className="flex flex-col md:hidden mb-6 text-center text-foreground">
                <h2 className="text-3xl font-bold mb-2">{marketingContent.title}</h2>
                <p className="text-lg opacity-90 text-muted-foreground">
                    {marketingContent.text}
                </p>
            </div>

            <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-full max-w-md mx-auto"
            >
                {formSide}
            </motion.div>
        </motion.div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden relative">
            {isFormOnLeft ? (
                <>
                    {formPanel}
                    {marketingPanel}
                </>
            ) : (
                <>
                    {marketingPanel}
                    {formPanel}
                </>
            )}
        </div>
    );
};
