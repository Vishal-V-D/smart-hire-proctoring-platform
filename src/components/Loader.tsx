import React from "react";
import { Loader2 } from "lucide-react";

type LoaderProps = {
    message?: string;
    fullscreen?: boolean;
};

const Loader: React.FC<LoaderProps> = ({
    message = "Loading...",
    fullscreen = false,
}) => {
    const containerClasses = fullscreen
        ? "min-h-screen flex items-center justify-center bg-gray-950"
        : "w-full flex items-center justify-center py-10";

    return (
        <div className={`${containerClasses} text-gray-400`}>
            <div className="flex flex-col items-center gap-6 rounded-3xl bg-gray-900/60 px-10 py-8 shadow-2xl backdrop-blur border border-gray-800">
                <div className="relative flex items-center justify-center">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl scale-150" />

                    {/* Animated Icon */}
                    <Loader2 className="w-16 h-16 text-cyan-500 animate-spin relative z-10" />
                </div>
                <p className="text-sm font-bold tracking-[0.2em] text-gray-200 uppercase animate-pulse">{message}</p>
            </div>
        </div>
    );
};

export default Loader;
