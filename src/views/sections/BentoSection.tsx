"use client"

import { CheckCircle, TrendingUp, Users } from 'lucide-react';

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

export default function BentoSection() {
    return (
        <section id="product" className="py-24 relative z-10">
            <div className="container mx-auto px-6 md:px-12">
                <SectionHeading title="Actionable Candidate Insights" subtitle="Stop reviewing resumes. Start reviewing code. Make data-driven hiring decisions faster." />

                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

                    {/* Card 1: World Map */}
                    <GlowCard className="md:col-span-2 relative">
                        <h3 className="text-4xl font-bold mb-1 text-white">150+ <span className="text-cyan-400">Countries</span></h3>
                        <p className="text-zinc-400 mb-6">Global Talent Pool Access</p>
                        <div className="absolute right-0 top-10 w-2/3 h-full opacity-60">
                            <div className="absolute top-10 right-20 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
                            <div className="absolute top-32 right-40 w-2 h-2 bg-white rounded-full"></div>
                            <div className="absolute bottom-20 right-10 w-2 h-2 bg-white rounded-full"></div>
                            <svg viewBox="0 0 400 300" className="w-full h-full fill-zinc-800/30 stroke-zinc-700/30"><path d="M 50 100 Q 150 50 250 120 T 380 80" fill="none" strokeWidth="2" strokeDasharray="5,5" /></svg>
                        </div>
                    </GlowCard>

                    {/* Card 2: Language Proficiency */}
                    <GlowCard>
                        <h3 className="text-lg font-bold mb-4 text-white">Language Proficiency</h3>
                        <p className="text-xs text-zinc-400 mb-8">Benchmark candidates across 70+ languages and frameworks.</p>
                        <div className="flex items-end justify-between h-32 gap-2">
                            {[{ h: 40, l: 'Py' }, { h: 70, l: 'JS' }, { h: 50, l: 'Go' }, { h: 90, l: 'Rust' }, { h: 60, l: 'Java' }].map((item, i) => (
                                <div key={i} className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full bg-zinc-800/50 rounded-t-lg relative group overflow-hidden" style={{ height: `${item.h}%` }}>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-500/50 to-transparent h-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">{item.l}</span>
                                </div>
                            ))}
                        </div>
                    </GlowCard>

                    {/* Card 3: Recent Submissions */}
                    <GlowCard>
                        <div className="flex gap-2 mb-6 scale-75 origin-top-left opacity-60">
                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs flex items-center gap-1 text-white"><CheckCircle size={10} className="text-green-500" /> Auto-Graded</span>
                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-white">Plagiarism Check</span>
                        </div>
                        <h3 className="text-lg font-bold mb-4 text-white">Recent Submissions</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs text-zinc-300">
                                <CheckCircle size={14} className="text-cyan-400" />
                                <span>Frontend React Test completed</span>
                                <span className="ml-auto text-zinc-500">2m ago</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-300">
                                <CheckCircle size={14} className="text-purple-400" />
                                <span>Python Algo III submitted</span>
                                <span className="ml-auto text-zinc-500">15m ago</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-300">
                                <div className="w-3.5 h-3.5 border-2 border-zinc-600 rounded-full"></div>
                                <span>DevOps Scenario started</span>
                                <span className="ml-auto text-zinc-500">1h ago</span>
                            </div>
                        </div>
                    </GlowCard>

                    {/* Card 4: Hiring Velocity */}
                    <GlowCard>
                        <div className="flex justify-between h-full">
                            <div className="flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-bold text-yellow-500 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Time-to-Hire</p>
                                    <p className="text-sm text-zinc-400">Reduced significantly</p>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-white">-45%</h3>
                                    <p className="text-xs text-zinc-500">avg. reduction</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between pl-6 border-l border-white/10">
                                <div>
                                    <p className="text-xs font-bold text-cyan-500 mb-1 flex items-center gap-1"><Users size={12} /> Qualified</p>
                                    <p className="text-sm text-zinc-400">Candidates pipeline</p>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-white">3x</h3>
                                    <p className="text-xs text-zinc-500">faster sourcing</p>
                                </div>
                            </div>
                        </div>
                    </GlowCard>

                    {/* Card 5: Skill Trend Analysis */}
                    <GlowCard className="flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-1 text-white">Skill Trend Analysis</h3>
                            <p className="text-xs text-zinc-400">Identify emerging technologies and demand for specific roles.</p>
                        </div>
                        <div className="mt-6 flex items-end justify-center gap-4 h-32">
                            <div className="w-8 bg-red-500/80 h-[40%] rounded-t-sm relative group"><span className="absolute -top-6 left-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">Ruby</span></div>
                            <div className="w-8 bg-zinc-200/80 h-[80%] rounded-t-sm relative group"><span className="absolute -top-6 left-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-1 rounded">React</span></div>
                            <div className="w-8 bg-zinc-700/80 h-[30%] rounded-t-sm relative group"><span className="absolute -top-6 left-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">PHP</span></div>
                            <div className="w-8 bg-cyan-800/80 h-[50%] rounded-t-sm relative group"><span className="absolute -top-6 left-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">Go</span></div>
                        </div>
                    </GlowCard>
                </div>
            </div>
        </section>
    );
}
