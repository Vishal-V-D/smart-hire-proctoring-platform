import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/components/AuthProviderClient';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCarousel } from '@/components/FeatureCarousel';

import {
  ShieldCheck,
  Cpu,
  Code2,
  Eye,
  Layers,
  Monitor,
  CheckCircle2,
  ChevronRight,
  BrainCircuit,
  Lock,
  Check,
  Zap,
  Twitter,
  Linkedin,
  Github,
  Mail,
  ArrowRight,
  BarChart3,
  Globe
} from 'lucide-react';

// --- Components ---

const TypingEffect = () => {
  const words = ["Technical Hiring.", "AI Proctoring.", "Coding Tests.", "HR Interviews."];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 75 : 150);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span className="text-black dark:text-white">
      {words[index].substring(0, subIndex)}
    </span>
  );
};

const LetterParsing = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

  useEffect(() => {
    let currentIteration = 0;
    const maxIterations = 10;
    const interval = setInterval(() => {
      if (currentIteration < maxIterations) {
        setDisplayText(chars[Math.floor(Math.random() * chars.length)]);
        currentIteration++;
      } else {
        setDisplayText(text[0].toUpperCase());
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="flex flex-col items-center gap-2 group cursor-default">
      <div className="w-16 h-16 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border flex items-center justify-center text-3xl font-Inter text-foreground group-hover:bg-gradient-to-br from-indigo-600 to-violet-600 group-hover:text-primary-foreground transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
        {displayText}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
        {text}
      </span>
    </div>
  );
};

const Navbar = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const getDashboardLink = () => {
    if (!user) return '/login';
    const role = (user.role || '').toLowerCase();
    if (role === 'organizer') return '/organizer/overview';
    if (role === 'contestant') return '/contestant';
    if (role === 'admin' || role === 'company') return '/admin/dashboard';
    return '/login';
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '#'}>
            <span className="text-2xl font-Inter tracking-tighter text-foreground group-hover:text-primary transition-colors">
              SmartHire
            </span>

          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Products', id: 'features' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'About', id: 'about' },
              { label: 'Resources', id: 'carousel' }
            ].map((item) => (
              <a
                key={item.label}
                href={`#${item.id}`}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                onClick={e => {
                  if (item.id === 'carousel' || item.id === 'pricing' || item.id === 'features' || item.id === 'about') {
                    e.preventDefault();
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
             
              <button
                onClick={() => window.location.href = '/login'}
                className="hidden sm:block border-2 border-foreground/10 hover:border-foreground/20 px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
              >
               Log In
              </button>
              <button
                onClick={() => window.location.href = '/partner-signup'}
                className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-md"
              >
                Join as Partner
              </button>
            </>
          ) : (
            <button
              onClick={() => window.location.href = getDashboardLink()}
              className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-md"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

interface PricingCardProps {
  plan: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, features, recommended }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className={`relative p-8 rounded-[32px] border ${recommended ? 'border-primary bg-background shadow-2xl shadow-primary/10 ring-1 ring-primary' : 'border-border bg-card/40 backdrop-blur-sm'}`}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
        Most Popular
      </div>
    )}
    <h4 className="text-xl font-bold mb-2 text-foreground">{plan}</h4>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-4xl font-Inter text-foreground">${price}</span>
      <span className="text-muted-foreground text-sm">/month</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
          <Check size={18} className="text-primary mt-0.5 shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <button className={`w-full py-4 rounded-2xl font-bold transition-all ${recommended ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-primary-foreground hover:bg-gradient-to-br from-indigo-600 to-violet-600/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
      Choose {plan}
    </button>
  </motion.div>
);

const StatsSection = () => {
  const stats = [
    { label: "Assessments Conducted", value: "1M+", icon: <BarChart3 className="text-blue-500" /> },
    { label: "Proctoring Accuracy", value: "99.9%", icon: <ShieldCheck className="text-green-500" /> },
    { label: "Global Partners", value: "500+", icon: <Globe className="text-purple-500" /> },
    { label: "Avg. Setup Time", value: "< 2m", icon: <Zap className="text-yellow-500" /> },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-xl border-y border-border py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 shadow-sm">
              {stat.icon}
            </div>
            <div className="text-3xl font-Inter text-foreground mb-1">{stat.value}</div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function SmartHireLanding() {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const getDashboardLink = () => {
    if (!user) return '/login';
    const role = (user.role || '').toLowerCase();
    if (role === 'organizer') return '/organizer/overview';
    if (role === 'contestant') return '/contestant';
    if (role === 'admin' || role === 'company') return '/admin/dashboard';
    return '/login';
  };

  useEffect(() => {
    window.onscroll = function () {
      var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var scrolled = (winScroll / height) * 100;
      var bar = document.getElementById("progress-bar");
      if (bar) bar.style.width = scrolled + "%";
    };
    return () => {
      window.onscroll = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans">


      {/* Scroll Progress Bar */}
      <div id="progress-bar" className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 z-[100] transition-all duration-300 w-0" style={{ width: '0%' }}></div>

      <Navbar />

      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden">
        {/* Modern Personal Decorative Background (Light theme only) */}
        {/* <div className="absolute inset-0 z-0 pointer-events-none dark:hidden">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-200 via-fuchsia-200 to-pink-100 rounded-full blur-3xl opacity-70 animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-200 via-blue-100 to-violet-200 rounded-full blur-2xl opacity-60 animate-pulse-slower" />
          <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent" />
        </div> */}

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >

            <h1 className="text-5xl md:text-6xl font-mono tracking-tight mb-6 leading-tight  font-Inter italic text-purple-600">
              <span className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-400 bg-clip-text text-transparent">Interviews Made Simple.</span>
              <br />
              <span className="whitespace-nowrap  font-Inter bg-gradient-to-r from-pink-400 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent">Make Hiring Fun.</span> <br />
              <span className="block text-4xl md:text-6xl font-bold text-foreground mt-2 font-Inter"><TypingEffect /></span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-semibold">
              Hire smarter. Hire faster. <span className="text-cyan-500 font-bold">No limits.</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.location.href = getDashboardLink()}
                className="bg-foreground text-background px-8 py-4 rounded-lg text-base font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group"
              >
                Start Hiring
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => window.location.href = '/book-demo'}
                className="border-2 border-foreground/10 hover:border-foreground/20 px-8 py-4 rounded-lg text-base font-bold transition-all"
              >
                Book Demo
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="h-[500px] relative overflow-hidden collage-container rounded-[32px] shadow-2xl  backdrop-blur-md rotate-9 scale-100 hover:scale-105 transition-transform duration-500">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Column 1 - Scroll Up */}
                <div className="space-y-4 animate-scroll-up">
                  {[1, 2, 7, 4, 8, 1, 2, 7, 9, 8].map((num, i) => {
                    const info = [
                      "AI Proctoring", "Multi-Language", "Skill Analytics", "Live Interviews",
                      "Cheat Detection", "Multi-Domain", "Custom Banks", "Global Access"
                    ][i % 8];
                    return (
                      <div key={`col1-${i}`} className="w-[85%] mx-auto rounded-2xl overflow-hidden shadow-lg group relative cursor-help">
                        <img
                          src={`/${num}.png`}
                          className="w-full h-45 object-cover transform group-hover:scale-110 transition-transform duration-700"
                          alt="Platform Interface"
                        />
                        <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-white font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                            {info}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Column 2 - Scroll Down */}
                <div className="space-y-4 animate-scroll-down pt-20">
                  {[5, 6, 7, 8, 5, 6, 7, 8].map((num, i) => {
                    const info = [
                      "Tech & Non-Tech", "Multi-Domain", "Domain Experts", "Seamless UI",
                      "Scalable Hiring", "Global Support", "All Languages", "High Integrity"
                    ][i % 8];
                    return (
                      <div key={`col2-${i}`} className="w-[85%] mx-auto rounded-2xl overflow-hidden shadow-lg group relative cursor-help">
                        <img
                          src={`/${num}.png`}
                          className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700"
                          alt="Platform Features"
                        />
                        <div className="absolute inset-0 bg-purple-600/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-white font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                            {info}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Background Decorative Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full -z-10 blur-3xl opacity-60 dark:hidden" />
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-background/50 border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground mb-12">Trusted by Industry Leaders</h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center w-full">
            <LetterParsing text="Microsoft" />
            <LetterParsing text="Google" />
            <LetterParsing text="Amazon" />
            <LetterParsing text="Accenture" />
            <LetterParsing text="Infosys" />
            <LetterParsing text="TCS" />
            <LetterParsing text="Zoho" />
          </div>
        </div>
      </section>

      <StatsSection />

      {/* NEW: Object Morphing Section */}
      <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="relative flex justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 90, 180, 270, 360],
                borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 20% 80% / 25% 80% 20% 75%", "30% 70% 70% 30% / 30% 30% 70% 70%"]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-blue-400 to-violet-600 opacity-80 blur-2xl absolute"
            />
            <motion.div
              animate={{
                borderRadius: ["60% 40% 30% 70% / 60% 30% 70% 40%", "30% 60% 70% 40% / 50% 60% 30% 60%", "60% 40% 30% 70% / 60% 30% 70% 40%"]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-64 h-64 md:w-96 md:h-96 relative z-10 flex items-center justify-center"
            >
              <span className="text-purple-100 text-3xl md:text-4xl font-Inter tracking-wide drop-shadow-lg select-none" style={{ letterSpacing: '0.04em' }}>
                SmartHire
              </span>
            </motion.div>
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">Fluid Intelligence. <br />Infinite Possibilities.</h2>
            <p className="text-slate-400 text-lg mb-8">
              Our AI engine doesn't just process data; it adapts. Whether you're hiring a React developer or a Financial Analyst, the system morphs its evaluation logic to suit the specific mental models of the role.
            </p>
            <ul className="space-y-4">
              {['Dynamic Difficulty Scaling', 'Context-Aware Analysis', 'Behavioral Pattern Matching'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Check size={14} className="text-blue-400" />
                  </div>
                  <span className="text-slate-200 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Showcase (Kept as requested) */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center mb-32">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}>
            <span className="text-primary font-bold uppercase tracking-widest text-sm">Real-time Guard</span>
            <h2 className="text-4xl font-bold mt-4 mb-6">AI-Based Live Proctoring</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              SmartHire uses advanced computer vision to track eye movement, head position, and background noise. Our AI detects suspicious behavior with 99.9% accuracy, flagging it instantly for your reviewers.
            </p>
          </motion.div>
          <div className="bg-secondary rounded-[40px] aspect-video overflow-hidden shadow-inner border border-background">
            <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="AI Tech" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="order-2 md:order-1 bg-secondary rounded-[40px] aspect-video overflow-hidden shadow-inner border border-background">
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Coding" />
          </div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} className="order-1 md:order-2">
            <span className="text-primary font-bold uppercase tracking-widest text-sm">Deep Evaluation</span>
            <h2 className="text-4xl font-bold mt-4 mb-6">Human-like AI Scoring</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Don't just check if the code runs. Our AI evaluates code quality, complexity, and even logic in descriptive answers, giving you a comprehensive score that mimics a senior engineer's feedback.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section (Kept as requested) */}
      <section id="pricing" className="py-32 px-6 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Scale your hiring without breaking the bank.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              plan="Starter"
              price="49"
              features={["50 Candidates/mo", "Basic Proctoring", "Email Support", "MCQ & SQL Tests"]}
            />
            <PricingCard
              plan="Professional"
              price="149"
              recommended={true}
              features={["250 Candidates/mo", "Advanced AI Proctoring", "Live Coding Interviews", "Priority Support", "Custom Question Bank"]}
            />
            <PricingCard
              plan="Enterprise"
              price="499"
              features={["Unlimited Candidates", "Full White-labeling", "Dedicated Account Manager", "SSO & Custom Integration", "LMS Export"]}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[60px] overflow-hidden rotate-6 shadow-2xl border-8 border-white shrink-0">
              <img src="/avatar.png" className="w-full h-full object-cover" alt="Founder" />
            </div>
            <div>
              <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4 block">A Personal Mission</span>
              <h2 className="text-4xl font-Inter text-foreground mb-6 italic">"As a hiring manager at a Fortune 500, I was tired of interviewing people who passed automated tests but couldn't code a simple loop in person."</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                We built ProctorElite to restore trust in the remote hiring ecosystem. Our platform isn't just about catching cheaters; it's about giving honest, talented developers a fair stage to shine.
              </p>
              <div>
                <div className="font-Inter text-foreground text-2xl uppercase italic">Alex Sterling</div>
                <div className="text-muted-foreground font-bold tracking-widest text-sm uppercase">CEO & Founder, ProctorElite</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Feature Carousel */}
      <section id="carousel">
        <FeatureCarousel />
      </section>

      {/* NEW: Detailed Professional Footer */}
      <footer className="bg-card border-t border-border pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
                  <Zap size={16} fill="currentColor" />
                </div>

              </div>
              <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
                Empowering the next generation of HR teams with ethical AI and precision assessment tools. Built for the future of work.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Github size={18} />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest">Product</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">AI Proctoring</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Coding Sandbox</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Video Interviews</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest">Company</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-sm mb-6 uppercase tracking-widest">Support</h5>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">API Status</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              © 2026 SmartHire AI Inc. Made with ❤️ for recruiters everywhere.
            </p>
            <div className="flex gap-6 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-900">Cookies</a>
              <a href="#" className="hover:text-slate-900">Legal</a>
              <a href="#" className="hover:text-slate-900">Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}