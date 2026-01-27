'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    BarChart3,
    Zap,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    BookOpen,
    HelpCircle,
    Code,
    Users
} from 'lucide-react';
import Link from 'next/link';

type ViewType = 'Overview' | 'Products' | 'Resources';

const MegaMenu = ({ items }: { items: { title: string; desc: string; icon: any }[] }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute top-full left-0 w-[500px] bg-card rounded-xl shadow-2xl border border-border p-6 mt-2 grid grid-cols-2 gap-4 z-50 overflow-hidden"
    >
        {items.map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:scale-110 transition-transform">
                    <item.icon size={18} />
                </div>
                <div>
                    <div className="font-semibold text-sm text-foreground mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</div>
                </div>
            </div>
        ))}
    </motion.div>
);

export default function OrganizerOverview() {
    const [activeView, setActiveView] = useState<ViewType>('Overview');
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const productItems = [
        { title: "Coding Skills", desc: "Automated coding assessments", icon: Code },
        { title: "AI Proctoring", desc: "Anti-cheat integrity engine", icon: ShieldCheck },
        { title: "Interview Pro", desc: "Structured video interviews", icon: Users },
        { title: "Analytics", desc: "Detailed candidate insights", icon: BarChart3 }
    ];

    const resourceItems = [
        { title: "Documentation", desc: "Full developer guides", icon: BookOpen },
        { title: "Help Center", desc: "24/7 technical support", icon: HelpCircle },
        { title: "API Reference", desc: "REST & Webhook integrations", icon: Zap },
        { title: "Partners", desc: "View our partner network", icon: CheckCircle2 }
    ];

    return (
        <div className="h-screen bg-muted/10 text-foreground font-Inter flex flex-col overflow-hidden">
            {/* HackerRank Style Local Navbar */}
            <nav className="h-20 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-[60]">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-foreground cursor-pointer" onClick={() => setActiveView('Overview')}>

                    </div>

                    <div className="flex items-center gap-8 font-medium text-sm text-muted-foreground">
                        <div
                            className={`flex items-center gap-1 cursor-pointer hover:text-primary transition-colors py-8 relative ${activeView === 'Products' ? 'text-primary' : ''}`}
                            onMouseEnter={() => setHoveredTab('Products')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveView('Products')}
                        >
                            Products <ChevronDown size={14} className={`transition-transform duration-300 ${hoveredTab === 'Products' ? 'rotate-180' : ''}`} />
                            <AnimatePresence>
                                {hoveredTab === 'Products' && <MegaMenu items={productItems} />}
                            </AnimatePresence>
                        </div>

                        <div className={`cursor-pointer hover:text-primary transition-colors py-8 ${activeView === 'Overview' ? 'text-primary' : ''}`} onClick={() => setActiveView('Overview')}>
                            Solutions
                        </div>

                        <div
                            className={`flex items-center gap-1 cursor-pointer hover:text-primary transition-colors py-8 relative ${activeView === 'Resources' ? 'text-primary' : ''}`}
                            onMouseEnter={() => setHoveredTab('Resources')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => setActiveView('Resources')}
                        >
                            Resources <ChevronDown size={14} className={`transition-transform duration-300 ${hoveredTab === 'Resources' ? 'rotate-180' : ''}`} />
                            <AnimatePresence>
                                {hoveredTab === 'Resources' && <MegaMenu items={resourceItems} />}
                            </AnimatePresence>
                        </div>

                        <div className="cursor-pointer hover:text-primary transition-colors py-8 text-muted-foreground font-medium">
                            Pricing
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/organizer">
                        <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mr-2">
                            Skip to Dashboard
                        </button>
                    </Link>
                    <Link href="/organizer">
                        <button className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-md">
                            Enter Dashboard
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex items-center justify-center p-12">
                <AnimatePresence mode="wait">
                    {activeView === 'Overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-700" />
                                <img
                                    src="/work.png"
                                    alt="Work Interface"
                                    className="relative w-full  rounded-xl   hover:-translate-y-1 transition-transform duration-500"
                                />
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="inline-block self-start px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Strong Signal
                                </div>
                                <h1 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
                                    Set it and <br />
                                    <span className="italic text-primary">mostly</span> forget it.
                                </h1>
                                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                                    You don't have time to manually operate an effective skills strategy. And you shouldn't have to. We'll help you automate from start to finish.
                                </p>

                                <ul className="space-y-4 font-medium">
                                    {[
                                        "Need a skills taxonomy out of the box? We've got you covered.",
                                        "Certified assessments are trusted, role-based tests maintained by experts.",
                                        "Bringing your own skills models? Tap our expert services."
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1 group-hover:bg-gradient-to-br from-indigo-600 to-violet-600 group-hover:text-white transition-colors">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <span className="text-muted-foreground group-hover:text-primary transition-colors cursor-default leading-tight flex-1">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/organizer">
                                    <button className="bg-foreground text-background px-8 py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group w-fit">
                                        Start Hiring
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {activeView === 'Products' && (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-7xl w-full flex flex-col items-center"
                        >
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-bold mb-4">Our Premium Tools</h2>
                                <p className="text-muted-foreground font-medium">Everything you need to find the top 1% talent.</p>
                            </div>
                            <div className="grid md:grid-cols-4 gap-8 w-full">
                                {productItems.map((item, i) => (
                                    <div key={i} className="bg-card p-8 rounded-xl shadow-xl border border-border/50 hover:border-primary/20 transition-all hover:scale-105 group">
                                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:rotate-6 transition-transform">
                                            <item.icon size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground font-medium mb-6">{item.desc}</p>
                                        <Link href="/organizer">
                                            <span className="text-primary font-semibold text-xs flex items-center gap-1 cursor-pointer hover:underline">Learn more <ArrowRight size={12} /></span>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            <Link href="/organizer" className="mt-16">
                                <button className="bg-foreground text-background px-8 py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group">
                                    Enter Dashboard
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </motion.div>
                    )}

                    {activeView === 'Resources' && (
                        <motion.div
                            key="resources"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-7xl w-full flex flex-col items-center"
                        >
                            <h2 className="text-4xl font-bold mb-16">Developer & HR Resources</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                {resourceItems.map((item, i) => (
                                    <div key={i} className="bg-card p-8 rounded-xl shadow-lg border border-border/50 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-6 font-Inter">
                                            <item.icon size={28} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground font-medium mb-6">{item.desc}</p>
                                        <Link href="/organizer">
                                            <button className="w-full py-3 rounded-xl border border-border/50 text-xs font-semibold hover:bg-muted/50 transition-colors">Download Docs</button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            <Link href="/organizer" className="mt-20">
                                <button className="bg-foreground text-background px-8 py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group">
                                    View All Resources
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Decorative Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-muted/10">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[150px]" />
            </div>

            <style jsx global>{`
                .modern-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
