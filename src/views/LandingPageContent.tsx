"use client"

import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { AuthContext } from '@/components/AuthProviderClient';
import dynamic from 'next/dynamic';

// Import only icons needed for initial render
import {
    Code,
    ArrowUpRight,
    ArrowRight,
    Shield,
    ChevronDown,
} from 'lucide-react';

// Lazy load heavy components
const DecryptedText = dynamic(() => import('@/components/DecryptedText'), { ssr: false });
const BackgroundBeamsWithCollision = dynamic(() => import('@/components/ui/background-beams-with-collision').then(mod => ({ default: mod.BackgroundBeamsWithCollision })), { ssr: false });
const GlobeDemo = dynamic(() => import('@/components/ui/globe-demo'), { ssr: false });
const AssessmentEngine = dynamic(() => import('@/components/AssessmentEngine'), { ssr: false });
const LibrarySection = dynamic(() => import('@/components/LibrarySection'), { ssr: false });
const ResourceSection = dynamic(() => import('@/components/ResourceSection'), { ssr: false });

// Lazy load sections that aren't immediately visible
const BentoSection = dynamic(() => import('@/views/sections/BentoSection'), { ssr: false });
const ProcessSection = dynamic(() => import('@/views/sections/ProcessSection'), { ssr: false });
const SecuritySection = dynamic(() => import('@/views/sections/SecuritySection'), { ssr: false });
const PricingSection = dynamic(() => import('@/views/sections/PricingSection'), { ssr: false });

// Footer needs special handling for props
const FooterSectionLazy = dynamic(() => import('@/views/sections/FooterSection'), { ssr: false });

const AssessmentPlatformLandingPage = () => {
    const { user } = useContext(AuthContext) || {};
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('product');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleScrollSpy = () => {
            const sections = ['product', 'solutions', 'library', 'resources', 'pricing'];
            const scrollPosition = window.scrollY + 100;

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

        window.addEventListener('scroll', handleScrollSpy, { passive: true });
        return () => window.removeEventListener('scroll', handleScrollSpy);
    }, []);

    const userHref = !user
        ? "/login"
        : ((user.role || '').toLowerCase() === 'organizer'
            ? '/organizer'
            : (['admin', 'company'].includes((user.role || '').toLowerCase())
                ? '/admin/dashboard'
                : '/contestant-dashboard'));

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
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <Code size={18} className="text-black" />
                        </div>
                        <span className="text-xl font-bold hidden md:block text-white">CodeAssess.io</span>
                    </div>

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

                    <div className="flex items-center gap-4">
                        {!user ? (
                            <>
                                <a href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden md:block">
                                    Log In
                                </a>
                                <a href="/partner-signup" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors shadow-none">
                                    <span>Partner Signup</span>
                                </a>
                            </>
                        ) : (
                            <a
                                href={userHref}
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
                {/* Professional Zigzag Grid */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_70%)]">
                        <div className="absolute inset-0 bg-[size:24px_24px]"></div>
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
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950"></div>
                </div>

                {/* Beams Background - Lazy loaded */}
                <Suspense fallback={null}>
                    <div className="absolute inset-0 pointer-events-none">
                        <BackgroundBeamsWithCollision className="h-full bg-transparent" />
                    </div>
                </Suspense>

                {/* Animated Gradient Orbs */}
                <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-40"></div>

                <div className="container mx-auto px-6 md:px-12 relative z-10 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* Left Column: Text Content */}
                        <div className="pl-4 md:pl-12 flex flex-col items-start text-left">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] font-['Inter',sans-serif]">
                                <Suspense fallback={<span className="text-white">Build Your</span>}>
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
                                </Suspense>
                                <br />
                                <span className="inline-block">
                                    <Suspense fallback={<span className="text-cyan-400">Dream Team</span>}>
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
                                    </Suspense>
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
                                <a
                                    href={userHref}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-base font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                                    <span className="relative flex items-center gap-2">
                                        {!user ? "Start Hiring" : "Start Hiring"}
                                        <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </span>
                                </a>

                                <button className="group relative px-8 py-4 rounded-xl font-semibold text-base text-white border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-400/50 transition-all duration-300 flex items-center gap-2 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center gap-2">
                                        Explore Library
                                        <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Globe - Lazy loaded */}
                        <div className="h-[600px] w-full flex items-center justify-center relative">
                            <Suspense fallback={
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="animate-spin w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                                </div>
                            }>
                                <div className="absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_100%)]">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <GlobeDemo />
                                    </div>
                                </div>
                            </Suspense>
                        </div>
                    </div>
                </div>

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

            {/* Lazy load below-the-fold sections */}
            <Suspense fallback={<div className="py-24 bg-black"></div>}>
                <ProcessSection />
            </Suspense>

            <Suspense fallback={<div className="py-24"></div>}>
                <BentoSection />
            </Suspense>

            <Suspense fallback={<div className="py-24"></div>}>
                <LibrarySection />
            </Suspense>

            <Suspense fallback={<div className="py-24"></div>}>
                <ResourceSection />
            </Suspense>

            <Suspense fallback={<div className="py-24"></div>}>
                <SecuritySection />
            </Suspense>

            <Suspense fallback={<div className="py-24 bg-black/40"></div>}>
                <PricingSection />
            </Suspense>

            <Suspense fallback={<div className="bg-zinc-950 pt-24 pb-12"></div>}>
                <FooterSectionLazy userHref={userHref} />
            </Suspense>

        </div>
    );
};

export default AssessmentPlatformLandingPage;
