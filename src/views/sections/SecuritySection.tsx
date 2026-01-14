"use client"

import { Lock, Shield, Cpu } from 'lucide-react';

const GlowCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md rounded-3xl overflow-hidden group shadow-none ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none block"></div>
        <div className="relative z-10 p-6 h-full">
            {children}
        </div>
    </div>
);

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 mb-4">
            {title}
        </h2>
        {subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-lg">{subtitle}</p>}
    </div>
);

export default function SecuritySection() {
    return (
        <section id="enterprise" className="py-24 relative z-10">
            <div className="container mx-auto px-6 md:px-12">
                <SectionHeading title="Enterprise-Grade Assessment Integrity" subtitle="Ensure fair play and reliable results with advanced proctoring and secure infrastructure." />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <GlowCard className="text-center">
                        <div className="w-16 h-16 mx-auto bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-400">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">AI-Powered Proctoring</h3>
                        <p className="text-zinc-400">Advanced webcam monitoring, browser lockdown, and behavioral analysis to flag suspicious activity.</p>
                    </GlowCard>
                    <GlowCard className="text-center">
                        <div className="w-16 h-16 mx-auto bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Plagiarism Detection</h3>
                        <p className="text-zinc-400">Compare candidate code against billions of lines on the web and your internal IP database.</p>
                    </GlowCard>
                    <GlowCard className="text-center">
                        <div className="w-16 h-16 mx-auto bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                            <Cpu size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Secure Sandbox</h3>
                        <p className="text-zinc-400">Isolated execution containers ensure malicious code cannot affect your infrastructure.</p>
                    </GlowCard>
                </div>
            </div>
        </section>
    );
}
