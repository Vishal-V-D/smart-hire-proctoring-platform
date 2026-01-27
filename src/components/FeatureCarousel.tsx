'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, Shield, BarChart3, Globe } from 'lucide-react';

const features = [
    {
        id: 1,
        title: "AI Code Analysis",
        description: "Deep semantic understanding of code quality, efficiency, and robustness.",
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800",
        icon: <Zap className="w-6 h-6 text-yellow-400" />
    },
    {
        id: 2,
        title: "Live Proctoring",
        description: "Real-time behavioral monitoring to ensure absolute assessment integrity.",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800",
        icon: <Shield className="w-6 h-6 text-green-400" />
    },
    {
        id: 3,
        title: "Insightful Reporting",
        description: "Granular analytics that reveal candidate strengths beyond just pass/fail.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        icon: <BarChart3 className="w-6 h-6 text-blue-400" />
    },
    {
        id: 4,
        title: "Global Compliance",
        description: "Built-in GDPR and CCPA compliance for hiring anywhere in the world.",
        image: "https://images.unsplash.com/photo-1526304640156-50e56598c1cd?auto=format&fit=crop&q=80&w=800",
        icon: <Globe className="w-6 h-6 text-purple-400" />
    }
];

export const FeatureCarousel = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Built for the future.
                    </h2>
                    <p className="text-xl text-zinc-500 dark:text-zinc-400 mt-4 max-w-lg">
                        Powerful tools designed to make your hiring process faster, fairer, and more fun.
                    </p>
                </div>
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => containerRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                        className="p-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <button
                        onClick={() => containerRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                        className="p-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 scrollbar-hide -mx-6 md:mx-0 ps-6 md:ps-[max(calc((100vw-80rem)/2),1.5rem)]"
                style={{ scrollBehavior: 'smooth' }}
            >
                {features.map((feature) => (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{
                            scale: 1.02,
                            y: -8,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                        transition={{ duration: 0.3 }}
                        className="snap-center shrink-0 w-[85vw] md:w-[400px] h-[500px] relative rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-xl group cursor-pointer"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={feature.image}
                                alt={feature.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20"
                            >
                                {feature.icon}
                            </motion.div>

                            <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-zinc-300 text-lg leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                                {feature.description}
                            </p>

                            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                Learn more <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
                {/* Spacer for right padding */}
                <div className="snap-center shrink-0 w-6 md:w-[calc((100vw-80rem)/2)]" />
            </div>
        </section>
    );
};
