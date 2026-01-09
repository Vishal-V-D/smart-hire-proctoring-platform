import React from "react";

interface PseudoCodeDisplayProps {
    code: string;
    className?: string;
}

const PseudoCodeDisplay: React.FC<PseudoCodeDisplayProps> = ({
    code,
    className,
}) => {
    if (!code) return null;

    return (
        <div
            className={`relative w-full rounded-lg overflow-hidden border my-4 text-sm font-mono leading-relaxed transition-colors ${className} 
      bg-[#f4f4f4] border-[#e0e0e0] text-[#161616] 
      dark:bg-[#1e1e1e] dark:border-[#393939] dark:text-[#d4d4d4]`}
        >
            <div
                className={`flex items-center justify-between px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wider transition-colors
        bg-[#e0e0e0] border-[#c6c6c6] text-[#6f6f6f]
        dark:bg-[#2d2d2d] dark:border-[#393939] dark:text-[#a8a8a8]`}
            >
                <span>Pseudo Code</span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="whitespace-pre-wrap font-mono">{code}</pre>
            </div>
        </div>
    );
};

export default PseudoCodeDisplay;
