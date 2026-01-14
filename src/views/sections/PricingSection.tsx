"use client"

import { CheckCircle } from 'lucide-react';

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 mb-4">
            {title}
        </h2>
        {subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-lg">{subtitle}</p>}
    </div>
);

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-black/40 relative z-10 border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12">
                <SectionHeading title="Flexible Plans for Every Team" subtitle="Scale your technical hiring from startups to large enterprises." />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Tier 1 */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-none">
                        <h3 className="text-lg font-medium text-zinc-400 mb-4">Startup</h3>
                        <div className="text-4xl font-bold mb-6 text-white">Free <span className="text-sm font-normal text-zinc-500">/ forever</span></div>
                        <ul className="space-y-4 mb-8 text-sm text-zinc-300">
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> 5 Tests per Month</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> Basic Question Library</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> 1 Admin User</li>
                        </ul>
                        <button className="w-full py-3 border border-white/20 rounded-xl font-bold hover:bg-white/5 transition text-white">Get Started</button>
                    </div>

                    {/* Tier 2 */}
                    <div className="bg-zinc-800/80 border border-cyan-500/50 rounded-3xl p-8 transform md:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
                        <h3 className="text-lg font-medium text-cyan-400 mb-4">Growth</h3>
                        <div className="text-4xl font-bold mb-6 text-white">$99 <span className="text-sm font-normal text-zinc-500">/ month</span></div>
                        <ul className="space-y-4 mb-8 text-sm text-zinc-200">
                            <li className="flex gap-2"><CheckCircle size={16} className="text-cyan-400" /> Unlimited Tests</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-cyan-400" /> Full Library Access</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-cyan-400" /> Advanced Anti-cheat</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-cyan-400" /> ATS Integration</li>
                        </ul>
                        <button className="w-full py-3 bg-cyan-500 text-black rounded-xl font-bold hover:bg-cyan-400 transition">Start Free Trial</button>
                    </div>

                    {/* Tier 3 */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-none">
                        <h3 className="text-lg font-medium text-zinc-400 mb-4">Enterprise</h3>
                        <div className="text-4xl font-bold mb-6 text-white">Custom</div>
                        <ul className="space-y-4 mb-8 text-sm text-zinc-300">
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> Dedicated Success Manager</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> Custom Challenge Creation</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> SSO & Advanced Roles</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-zinc-600" /> SLA Support</li>
                        </ul>
                        <button className="w-full py-3 border border-white/20 rounded-xl font-bold hover:bg-white/5 transition text-white">Contact Sales</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
