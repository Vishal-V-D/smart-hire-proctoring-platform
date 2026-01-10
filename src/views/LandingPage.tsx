"use client"

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/components/AuthProviderClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Users,
    Play,
    ArrowUpRight,
    ChevronDown,
    Zap,
    Globe,
    BarChart3,
    Code,
    Lock,
    Server,
    CheckCircle,
    ArrowRight,
    Twitter,
    Linkedin,
    Github,
    Database,
    Terminal,
    Cpu,
    TrendingUp,
    Mail,
    CheckSquare,
    Eye,
    FileText
} from 'lucide-react';
import DecryptedText from '@/components/DecryptedText';
import AssessmentEngine from '@/components/AssessmentEngine';
import LibrarySection from '@/components/LibrarySection';
import ResourceSection from '@/components/ResourceSection';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import GlobeDemo from '@/components/ui/globe-demo';

// --- Shared Components ---

interface GlowCardProps {
    children: React.ReactNode;
    className?: string;
}

// A reusable glowing card component - FORCED DARK MODE
const GlowCard: React.FC<GlowCardProps> = ({ children, className = "" }) => (
    <div className={`relative bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md rounded-3xl overflow-hidden group shadow-none ${className}`}>
        {/* Subtle hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none block"></div>

        <div className="relative z-10 p-6 h-full">
            {children}
        </div>
    </div>
);

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    center?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, center = true }) => (
    <div className={`mb-12 ${center ? 'text-center' : 'text-left'}`}>
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 mb-4">
            {title}
        </h2>
        {subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-lg">{subtitle}</p>}
    </div>
);

// --- Circular Flow Component (Mechanical Chain Style) ---
const CircularFlow = () => {
    const steps = [
        { icon: Mail, label: "INVITE", desc: "SECURE LINK DISPATCH", color: "text-cyan-400", hex: "#22d3ee" },
        { icon: Code, label: "ASSESS", desc: "REAL-TIME SANDBOX", color: "text-white", hex: "#ffffff" },
        { icon: Eye, label: "MONITOR", desc: "AI BEHAVIOR SCAN", color: "text-purple-400", hex: "#c084fc" },
        { icon: CheckCircle, label: "ANALYZE", desc: "AUTO-GRADING CORE", color: "text-green-400", hex: "#4ade80" },
        { icon: FileText, label: "HIRE", desc: "DECISION MATRIX", color: "text-blue-400", hex: "#60a5fa" }
    ];

    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] flex items-center justify-center">

            {/* --- CORE REACTOR --- */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                {/* Counter-rotating rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-dashed border-zinc-700/60"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full border border-zinc-600/30 border-t-zinc-400/80"
                />

                {/* Central Hub Icon */}
                <div className="relative z-20 w-16 h-16 md:w-24 md:h-24 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <motion.div
                        key={activeStep}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {React.createElement(steps[activeStep].icon, {
                            size: 32,
                            className: steps[activeStep].color
                        })}
                    </motion.div>
                </div>
            </div>

            {/* --- SATELLITE SYSTEM --- */}
            {steps.map((step, index) => {
                const angle = (index * 360) / steps.length - 90;
                const radius = 170; // Adjusted for md
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isActive = index === activeStep;

                return (
                    <div key={index} className="absolute inset-0 flex items-center justify-center pointer-events-none">

                        {/* Connecting Chain/Pipe */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible z-0">
                            <line
                                x1="50%" y1="50%"
                                x2={`calc(50% + ${x}px)`}
                                y2={`calc(50% + ${y}px)`}
                                stroke={isActive ? step.hex : "#3f3f46"}
                                strokeWidth={isActive ? 2 : 1}
                                strokeDasharray="5,5"
                                className="transition-colors duration-500 opacity-30"
                            />
                            {isActive && (
                                <motion.circle
                                    r="3" fill={step.hex}
                                    initial={{ offsetDistance: "0%" }}
                                    animate={{ offsetDistance: "100%" }}
                                    style={{
                                        offsetPath: `path('M 50% 50% L calc(50% + ${x}px) calc(50% + ${y}px)')`
                                    }}
                                />
                            )}
                            {/* Simple packet animation simulation */}
                            {isActive && (
                                <motion.circle
                                    cx="50%" cy="50%" r="3" fill={step.hex}
                                    animate={{
                                        cx: `calc(50% + ${x}px)`,
                                        cy: `calc(50% + ${y}px)`,
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            )}
                        </svg>

                        {/* Node */}
                        <motion.div
                            className={`absolute w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center bg-zinc-950 z-10 transition-colors duration-500 ${isActive ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-zinc-800 opacity-50'}`}
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                            animate={{ scale: isActive ? 1.2 : 1 }}
                        >
                            <step.icon size={20} className={isActive ? step.color : 'text-zinc-600'} />
                        </motion.div>

                        {/* HUD Floating Label */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, x: x > 0 ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`absolute whitespace-nowrap z-20 bg-zinc-900/90 border border-zinc-700/50 backdrop-blur-md px-4 py-2 rounded-lg pointer-events-auto`}
                                    style={{
                                        top: `calc(50% + ${y}px)`,
                                        left: `calc(50% + ${x}px)`,
                                        transform: `translate(${x > 0 ? '40px' : '-100%'}, -50%)`, // Offset based on side
                                        marginLeft: x > 0 ? '20px' : '-20px',
                                        marginTop: '-25px' // Fine tune vertical alignment to node center
                                    }}
                                >
                                    <div className={`text-xs font-bold tracking-widest mb-1 ${step.color}`}>{step.label}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono">{step.desc}</div>
                                    {/* Decoration line */}
                                    <div className={`absolute top-1/2 ${x > 0 ? '-left-2' : '-right-2'} w-2 h-[1px] bg-zinc-600`}></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

// --- Main Page Component ---

const AssessmentPlatformLandingPage = () => {
    const { user } = useContext(AuthContext) || {};
    const [scrolled, setScrolled] = useState(false);

    // Handle navbar background on scroll
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scrollspy for Navbar
    const [activeSection, setActiveSection] = useState('product');

    useEffect(() => {
        const handleScrollSpy = () => {
            const sections = ['product', 'solutions', 'library', 'resources', 'pricing'];
            const scrollPosition = window.scrollY + 100; // Offset

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScrollSpy);
        return () => window.removeEventListener('scroll', handleScrollSpy);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">

            {/* Fixed Background Glows (Atmosphere) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] bg-cyan-600/20 rounded-full blur-[120px] opacity-40 mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[150px] opacity-30 mix-blend-screen"></div>
            </div>


            {/* ================= 1. Header / Navbar ================= */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-lg py-3 border-b border-white/5 shadow-none' : 'py-6'}`}>
                <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <Code size={18} className="text-black" />
                        </div>
                        <span className="text-xl font-bold hidden md:block text-white">CodeAssess.io</span>
                    </div>

                    {/* Navigation (Desktop) */}
                    <nav className="hidden lg:flex items-center bg-zinc-900/50 rounded-full p-1 border border-white/10 backdrop-blur-md shadow-none">
                        {['Product', 'Solutions', 'Library', 'Resources', 'Pricing'].map((item) => {
                            const sectionId = item.toLowerCase();
                            const isActive = activeSection === sectionId;
                            return (
                                <a
                                    key={item}
                                    href={`#${sectionId}`}
                                    className={`px-4 py-2 text-sm rounded-full transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {item}
                                </a>
                            );
                        })}
                        <a href="#enterprise" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:text-white border-l border-white/10 ml-2">
                            Enterprise <ArrowUpRight size={14} />
                            <Shield size={14} className="text-cyan-400" />
                        </a>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {!user ? (
                            <>
                                <a href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden md:block">
                                    Log In
                                </a>
                                <a href="/register" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors shadow-none">
                                    <span>Create Account</span>
                                </a>
                            </>
                        ) : (
                            <a
                                href={user.role === 'organizer' ? '/dashboard' : '/contestant-dashboard'}
                                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-zinc-400 transition-colors shadow-none"
                            >
                                <span>Get Started</span>
                                <ArrowRight size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </header>




            {/* ================= 2. Hero Section ================= */}
            <section id="product" className="relative min-h-screen flex items-center pt-20 overflow-hidden">

                {/* Professional Zigzag Grid - Cyan Only (Top Only) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Container with top-only visibility */}
                    <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_70%)]">
                        {/* Base dark grid lines */}
                        <div className="absolute inset-0  bg-[size:24px_24px]"></div>

                        {/* Zigzag Cyan pattern - Diagonal stripes */}
                        <div
                            className="absolute inset-0 opacity-40"
                            style={{
                                backgroundImage: `
                                    repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 24px,
                                        #06b6d420 24px,
                                        #06b6d420 48px,
                                        transparent 48px,
                                        transparent 72px,
                                        #06b6d420 72px,
                                        #06b6d420 96px
                                    )
                                `
                            }}
                        ></div>



                        {/* Random accent dots - Cyan */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `
                                    radial-gradient(circle at 20% 30%, #06b6d430 2px, transparent 2px),
                                    radial-gradient(circle at 60% 20%, #06b6d430 3px, transparent 3px),
                                    radial-gradient(circle at 80% 40%, #06b6d430 2px, transparent 2px),
                                    radial-gradient(circle at 40% 50%, #06b6d430 2px, transparent 2px)
                                `,
                                backgroundSize: '200px 200px'
                            }}
                        ></div>


                    </div>

                    {/* Elegant bottom fade to blend with rest of page */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950"></div>
                </div>

                {/* Beams Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <BackgroundBeamsWithCollision className="h-full bg-transparent" />
                </div>

                {/* Animated Gradient Orbs */}
                <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-40"></div>

                <div className="container mx-auto px-6 md:px-12 relative z-10 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* Left Column: Text Content */}
                        <div className="pl-4 md:pl-12 flex flex-col items-start text-left">

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] font-['Inter',sans-serif]">
                                <DecryptedText
                                    text="Build Your"
                                    speed={100}
                                    maxIterations={20}
                                    characters="ABCD1234!?"
                                    className="text-white"
                                    parentClassName="inline-block"
                                    encryptedClassName="text-zinc-600"
                                    animateOn="view"
                                    revealDirection="start"
                                    sequential={true}
                                    animateInterval={4000}
                                />
                                <br />
                                <span className="inline-block">
                                    <DecryptedText
                                        text="Dream Team"
                                        speed={100}
                                        maxIterations={20}
                                        characters="ABCD1234!?"
                                        className="text-cyan-400"
                                        parentClassName="inline-block"
                                        encryptedClassName="text-zinc-600"
                                        animateOn="view"
                                        revealDirection="start"
                                        sequential={true}
                                        animateInterval={4000}
                                    />
                                </span>
                            </h1>

                            <div className="flex items-center gap-3 text-2xl md:text-3xl text-zinc-500 font-mono mt-2 mb-6">
                                <span>_</span>
                                <span className="text-cyan-400 font-bold">Assess & Hire with AI</span>
                            </div>

                            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed font-light">
                                Evaluate developers with real-world coding challenges in a secure, AI-powered environment.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                {/* Start Hiring Button - Primary CTA */}
                                <a
                                    href={!user ? "/register" : (user.role === 'organizer' ? '/dashboard' : '/contestant-dashboard')}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-base font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95"
                                >
                                    {/* Shine effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                                    <span className="relative flex items-center gap-2">
                                        {!user ? "Start Hiring" : "Start Hiring"}
                                        <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </span>
                                </a>

                                {/* Explore Library Button - Secondary CTA */}
                                <button className="group relative px-8 py-4 rounded-xl font-semibold text-base text-white border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-400/50 transition-all duration-300 flex items-center gap-2 overflow-hidden">
                                    {/* Subtle glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    <span className="relative flex items-center gap-2">
                                        Explore Library
                                        <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Globe */}
                        <div className="h-[600px] w-full flex items-center justify-center relative">
                            <div className="absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_100%)]">
                                <div className="w-full h-full flex items-center justify-center">
                                    <GlobeDemo />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
            </section>

            {/* ================= 3. Partners Section (Logo Strip) ================= */}
            <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="container mx-auto px-6 md:px-12">
                    <p className="text-center text-sm text-zinc-500 mb-6 uppercase tracking-wider">Trusted by engineering teams at</p>
                    <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <span className="text-xl font-bold flex items-center gap-2 text-white"><span className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[15px] border-b-white border-r-[10px] border-r-transparent"></span>Vercel</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">☀ loom</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">$ Cash App</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">◎ Loops</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">_zapier</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">ramp ↗</span>
                        <span className="text-xl font-bold flex items-center gap-2 text-white">◆ Raycast</span>
                    </div>
                </div>
            </section>


            {/* ================= 5. Process Section (Assessment Engine) ================= */}
            <section id="solutions" className="pt-24 pb-24 bg-black relative overflow-hidden transition-colors duration-500">
                {/* Background Radial Gradient */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] -z-10"></div>

                <div className="container mx-auto px-4 md:px-8 text-center">
                    <SectionHeading title="Assessment Engine" subtitle="A fully automated, high-fidelity pipeline for technical hiring." />

                    <div className="mt-0 mb-4">
                        <AssessmentEngine />
                    </div>

                    {/* Bottom Tags (Features) */}
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


            {/* ================= 4. Features & Insights (Bento Grid) ================= */}
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

            {/* ================= Library Section ================= */}
            <LibrarySection />

            {/* ================= Resource Section ================= */}
            <ResourceSection />

            {/* ================= 6. Security Section ================= */}
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


            {/* ================= 7. Pricing Section ================= */}
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


            {/* ================= CTA & Footer ================= */}
            <footer className="bg-zinc-950 pt-24 pb-12 border-t border-white/5 relative z-10">
                <div className="container mx-auto px-6 md:px-12 text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">
                        Ready to build your <br /> dream engineering team?
                    </h2>
                    <button className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors mx-auto shadow-none">
                        Start Assessing Now <ArrowRight size={18} />
                    </button>
                </div>

                <div className="container mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm border-t border-white/10 pt-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center"><Code size={14} className="text-black" /></div>
                            <span className="text-lg font-bold text-white">CodeAssess.io</span>
                        </div>
                        <p className="text-zinc-500 mb-6 pr-8">The leading technical assessment platform for identifying and hiring top developer talent.</p>
                        <div className="flex gap-4 text-zinc-400">
                            <a href="#" className="hover:text-white"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-white"><Linkedin size={20} /></a>
                            <a href="#" className="hover:text-white"><Github size={20} /></a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-white">Platform</h4>
                        <ul className="space-y-2 text-zinc-400">
                            <li><a href="#" className="hover:text-white">Coding Challenges</a></li>
                            <li><a href="#" className="hover:text-white">System Design</a></li>
                            <li><a href="#" className="hover:text-white">Proctoring</a></li>
                            <li><a href="#" className="hover:text-white">Integrations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-white">Resources</h4>
                        <ul className="space-y-2 text-zinc-400">
                            <li><a href="#" className="hover:text-white">Customer Stories</a></li>
                            <li><a href="#" className="hover:text-white">Hiring Guides</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                            <li><a href="#" className="hover:text-white">Help Center</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-white">Company</h4>
                        <ul className="space-y-2 text-zinc-400">
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Contact</a></li>
                            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 md:px-12 mt-12 text-center text-zinc-600 text-xs">
                    <p>© 2024 CodeAssess.io. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
};

export default AssessmentPlatformLandingPage;