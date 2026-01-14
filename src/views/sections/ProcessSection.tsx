"use client"

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AssessmentEngine = dynamic(() => import('@/components/AssessmentEngine'), { ssr: false });

// Lazy load icons
import { Shield, Zap } from 'lucide-react';

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 mb-4">
            {title}
        </h2>
        {subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-lg">{subtitle}</p>}
    </div>
);

export default function ProcessSection() {
    return (
        <section id="solutions" className="pt-24 pb-24 bg-black relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-4 md:px-8 text-center">
                <SectionHeading title="Assessment Engine" subtitle="A fully automated, high-fidelity pipeline for technical hiring." />

                <div className="mt-0 mb-4">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-24">
                            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                        </div>
                    }>
                        <AssessmentEngine />
                    </Suspense>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-12">
                    {['AI Proctoring', 'Real-time IDE', 'Plagiarism Detection', 'Automated Grading', '70+ Languages', 'Role-Based Tests', 'Team Collaboration'].map((tag, i) => (
                        <span key={i} className={`px-4 py-2 rounded-full text-xs border flex items-center gap-2 ${tag === 'Automated Grading' ? 'bg-white text-black border-white font-bold' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                            {tag === 'Automated Grading' && <Zap size={12} className="fill-black" />}
                            {tag === 'AI Proctoring' && <Shield size={12} className="text-cyan-500" />}
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
