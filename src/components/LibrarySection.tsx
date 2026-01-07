import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Globe } from "lucide-react";

const ProctoringSection = () => {
  return (
    <section id="library" className="relative h-screen w-full overflow-hidden bg-black font-sans text-white transition-colors duration-500">

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-900/20 opacity-40 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-800/20 opacity-20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/10 opacity-10 blur-[80px] rounded-full" />
      </div>

      {/* SVG Lines */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
        <motion.path
          d="M -100 200 Q 600 -100 1400 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 2 }}
        />
        <motion.path
          d="M 600 0 Q 600 600 1200 1000"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.4 }}
        />
        <circle cx="35%" cy="45%" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-40" />
      </svg>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 h-full flex flex-col justify-between py-8">

        {/* Main Content */}
        <div className="flex flex-1 items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">

            {/* Left */}
            <div className="lg:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl lg:text-[6.5rem] leading-[0.9] font-medium tracking-tight"
              >
                <span className="block mb-2 font-light text-white/60">
                  {'}'} AI-Powered
                </span>
                Proctoring
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl mt-6 font-medium leading-tight"
              >
                Secure Online <br />
                Assessments <br />
                <span className="inline-flex items-center">
                  Glob
                  <span className="inline-flex items-center justify-center w-[0.8em] h-[0.8em] border border-white rounded-full mx-1">
                    <Globe size={36} strokeWidth={1} className="animate-spin-slow" />
                  </span>
                  ally
                </span>
              </motion.p>
            </div>

            {/* Right */}
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end text-left lg:text-right mt-8 lg:mt-0">
              <p className="text-sm font-medium text-white/70 max-w-xs mb-8 leading-relaxed">
                {'}'} Conduct cheat-proof online exams using real-time AI
                monitoring, identity verification, browser lockdown, and anomaly
                detection.
              </p>

              <button className="bg-white text-black text-xs tracking-[0.2em] font-bold px-10 py-5 rounded-full hover:scale-105 transition">
                START PROCTORING
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Card 1 */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-5 h-[220px] bg-zinc-900 rounded-[2.5rem] p-8 flex flex-col justify-end relative overflow-hidden"
          >
            <h3 className="text-7xl font-bold text-white">2.4M+</h3>
            <p className="text-zinc-400 text-sm">Exams Proctored</p>
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-600/20 blur-[80px]" />
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-4 h-[220px] bg-zinc-900 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden"
          >
            <h3 className="text-7xl font-bold text-white">1,200+</h3>
            <p className="text-zinc-400 text-sm">Institutions</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-3 h-[180px] bg-zinc-900 rounded-[2.5rem] p-6 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="text-2xl font-bold text-white">50+</div>
            <p className="text-zinc-400 text-xs">Countries Supported</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ProctoringSection;
