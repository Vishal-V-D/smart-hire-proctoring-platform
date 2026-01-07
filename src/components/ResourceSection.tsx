import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Terminal, ArrowRight } from 'lucide-react';

const ResourceSection = () => {
    return (
        <section id="resources" className="relative py-24 bg-black overflow-hidden border-t border-zinc-900 transition-colors duration-500">
            {/* Background Gradients */}
            <div className="absolute bottom-0 left-0 w-[1000px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="inline-block px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-blue-400 text-sm mb-4"
                        >
                            Developers First
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-bold text-white max-w-xl leading-tight">
                            Build with our <span className="text-zinc-500">infrastructure.</span>
                        </h2>
                    </div>
                    <button className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors mt-8 md:mt-0 shadow-none">
                        View Documentation
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Resource 1 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="h-[320px] bg-zinc-950/80 backdrop-blur-sm rounded-[2rem] p-8 border border-zinc-800 flex flex-col justify-between group overflow-hidden relative shadow-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white mb-6">
                            <BookOpen size={24} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">API Reference</h3>
                            <p className="text-zinc-500 mb-6">Complete endpoints for integrating assessments.</p>
                            <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:bg-white text-zinc-400 group-hover:text-black transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Resource 2 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="h-[320px] bg-zinc-950/80 backdrop-blur-sm rounded-[2rem] p-8 border border-zinc-800 flex flex-col justify-between group overflow-hidden relative shadow-none"
                    >
                        <div className="relative z-10 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white mb-6">
                            <Terminal size={24} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">SDKs & Tools</h3>
                            <p className="text-zinc-500 mb-6">Libraries for Python, Node.js, and Go.</p>
                            <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:bg-white text-zinc-400 group-hover:text-black transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Resource 3 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="h-[320px] bg-zinc-950/80 backdrop-blur-sm rounded-[2rem] p-8 border border-zinc-800 flex flex-col justify-between group overflow-hidden relative shadow-none"
                    >
                        <div className="relative z-10 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white mb-6">
                            <Users size={24} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">Community</h3>
                            <p className="text-zinc-500 mb-6">Join 50k+ developers building on our platform.</p>
                            <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:bg-white text-zinc-400 group-hover:text-black transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ResourceSection;
