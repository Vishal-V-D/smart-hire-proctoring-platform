"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  CheckCircle2,
  Briefcase,
  Zap,
  Plus,
  Users,
  Eye,
  ArrowRight,
  Maximize2,
  Mic,
  LayoutGrid,
  TrendingUp,
  Activity,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

import { ThemeContext } from '@/context/ThemeContext';

import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILITIES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- MODERN CSS STYLES ---
const customStyles = `
  /* Calendar Reset */
  .react-calendar { width: 100%; background: transparent; border: none; font-family: inherit; min-height: 280px; }
  .react-calendar__navigation { display: flex; margin-bottom: 0.75rem; height: 36px; align-items: center; }
  .react-calendar__navigation button { min-width: 36px; background: none; font-size: 14px; font-weight: 600; color: hsl(var(--foreground)); padding: 4px 8px; border-radius: 8px; }
  .react-calendar__navigation button:enabled:hover { background-color: hsl(var(--muted)); }
  .react-calendar__navigation button:disabled { background-color: transparent; }
  .react-calendar__month-view__weekdays { text-align: center; text-transform: uppercase; font-weight: 700; font-size: 0.65rem; color: hsl(var(--muted-foreground)); letter-spacing: 0.05em; padding-bottom: 8px; text-decoration: none; }
  .react-calendar__month-view__days__day { font-size: 0.8rem; font-weight: 500; padding: 0; color: hsl(var(--foreground)); height: 36px; width: 32px; display: flex; align-items: center; justify-content: center; margin: 2px auto; position: relative; }
  .react-calendar__tile { border-radius: 8px; transition: all 0.2s; }
  .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: hsl(var(--muted)); color: hsl(var(--foreground)); }
  .react-calendar__tile--active { background: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0,0,0, 0.1); }
  .react-calendar__tile--now { background: hsl(var(--muted)); color: hsl(var(--primary)); font-weight: 600; }
  .react-calendar__year-view__months__month, .react-calendar__decade-view__years__year, .react-calendar__century-view__decades__decade { padding: 12px 4px !important; font-size: 0.85rem; font-weight: 500; border-radius: 8px; }
  abbr[title] { text-decoration: none; }

  /* --- MODERN NOISE TEXTURE --- 
     Adds a premium 'frosted' feel to gradients 
  */
  .bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
    background-blend-mode: overlay;
  }

  /* --- SLEEK ZIG ZAG OVERLAY --- */
  .pattern-zigzag {
    background-color: transparent;
    background-image: linear-gradient(135deg, #ffffff 25%, transparent 25%), linear-gradient(225deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(315deg, #ffffff 25%, transparent 25%);
    background-position:  10px 0, 10px 0, 0 0, 0 0;
    background-size: 20px 20px;
    background-repeat: repeat;
    opacity: 0.1;
  }
`;

// --- DATA ---
const barData = [
  { name: 'Mon', candidates: 120 },
  { name: 'Tue', candidates: 200 },
  { name: 'Wed', candidates: 150 },
  { name: 'Thu', candidates: 280 },
  { name: 'Fri', candidates: 190 },
  { name: 'Sat', candidates: 90 },
  { name: 'Sun', candidates: 50 },
];

const pieData = [
  { name: 'Clean', value: 70, color: '#7B5CFA' },
  { name: 'Suspicious', value: 20, color: '#f59e0b' },
  { name: 'Violation', value: 10, color: '#ef4444' },
];

// Updated Card Data with specific shadow colors for the glow effect
const adminCards = [
  {
    id: 1,
    type: 'Create',
    title: "New Assessment",
    mainValue: "Create Now",
    subText: "Setup Coding / MCQ",
    gradient: "bg-gradient-to-br from-violet-600 to-indigo-600",
    shadowColor: "shadow-indigo-500/50",
    icon: Plus,
    path: "/organizer/new-assessment"
  },
  {
    id: 2,
    type: 'Monitor',
    title: "Live Exam: Python",
    mainValue: "142 Active",
    subText: "Ends in 45m",
    gradient: "bg-gradient-to-br from-blue-600 to-cyan-600",
    shadowColor: "shadow-blue-500/50",
    icon: Activity,
    path: "/organizer/live-monitor"
  },
  {
    id: 3,
    type: 'Result',
    title: "Review: Aptitude",
    mainValue: "Pending",
    subText: "12 Flags Found",
    gradient: "bg-gradient-to-br from-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/50",
    icon: TrendingUp,
    path: "/organizer/results"
  }
];

// --- COMPONENTS ---

const TimelineItem = ({ time, title, sub, status, isLast }: { time: string, title: string, sub: string, status: 'done' | 'active' | 'pending', isLast?: boolean }) => {
  return (
    <div className="flex gap-3 relative group">
      <div className="w-10 text-right pt-0.5 flex-shrink-0">
        <span className={cn("text-xs font-mono font-medium", status === 'active' ? "text-primary" : "text-muted-foreground")}>{time}</span>
      </div>
      <div className="relative flex flex-col items-center px-1">
        <div className={cn(
          "w-2 h-2 rounded-full z-10 flex-shrink-0 transition-colors duration-300",
          status === 'done' && "bg-muted-foreground/30",
          status === 'active' && "bg-primary ring-2 ring-primary/20",
          status === 'pending' && "bg-card border border-border"
        )}></div>
        {!isLast && <div className={cn("w-[1px] h-full absolute top-2 bg-border")}></div>}
      </div>
      <div className="flex-1 pb-6">
        <div className={cn(
          "px-3 py-2 rounded-lg border transition-all duration-200 cursor-default",
          status === 'active' ? "bg-card border-primary/30 shadow-sm transform translate-x-1" : "border-transparent group-hover:bg-muted/50"
        )}>
          <h4 className={cn("text-xs font-semibold", status === 'active' ? "text-foreground" : "text-card-foreground")}>{title}</h4>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
};

import Link from 'next/link';
import { assessmentService } from '@/api/assessmentService';

type Assessment = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  totalQuestions: number;
};

const AdminDashboard = () => {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const [date, setDate] = useState<any>(new Date());
  const [cardIndex, setCardIndex] = useState(0);
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);

  // Fetch assessments on mount
  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoadingAssessments(true);
      try {
        const response = await assessmentService.listAssessments({ limit: 50 });
        setAssessments(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      } finally {
        setIsLoadingAssessments(false);
      }
    };
    fetchAssessments();
  }, []);

  // Get dates that have assessments
  const datesWithAssessments = React.useMemo(() => {
    const dates = new Set<string>();
    assessments.forEach(a => {
      if (a.startDate) {
        dates.add(new Date(a.startDate).toDateString());
      }
    });
    return dates;
  }, [assessments]);

  // Filter assessments for selected date - show all with dates if no match
  const filteredAssessments = React.useMemo(() => {
    if (!selectedDate) {
      // No date selected - show all assessments
      return assessments;
    }
    const dateStr = selectedDate.toDateString();
    const filtered = assessments.filter(a =>
      a.startDate && new Date(a.startDate).toDateString() === dateStr
    );
    // If filtered has results, show only those, otherwise show all
    return filtered.length > 0 ? filtered : assessments;
  }, [selectedDate, assessments]);

  // Handle calendar date change
  const handleDateChange = (newDate: any) => {
    setDate(newDate);
    setSelectedDate(newDate);
  };

  // Custom tile content to show indicator for dates with assessments
  const tileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
    if (view === 'month' && datesWithAssessments.has(tileDate.toDateString())) {
      return (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>
      );
    }
    return null;
  };

  // Cycle cards
  const handleNextCard = () => {
    setCardIndex((prev) => (prev + 1) % adminCards.length);
  };

  const handlePrevCard = () => {
    setCardIndex((prev) => (prev - 1 + adminCards.length) % adminCards.length);
  };

  const currentCard = adminCards[cardIndex];
  const nextCard = adminCards[(cardIndex + 1) % adminCards.length];
  const thirdCard = adminCards[(cardIndex + 2) % adminCards.length];

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-background p-6 font-sans text-foreground overflow-x-hidden transition-colors duration-300">

        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitoring & Assessment Hub 👋</p>
          </div>

          <div className="flex items-center gap-6">

            {/* THEME TOGGLE */}
            <div className="bg-card p-1 rounded-xl border border-border shadow-sm flex items-center gap-1">
              <button
                onClick={() => setTheme('light')}
                className={cn("p-2 rounded-lg transition-all", theme === 'light' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn("p-2 rounded-lg transition-all", theme === 'dark' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                <Moon size={18} />
              </button>
              <button
                onClick={() => setTheme('legacy')}
                title="Legacy Mode"
                className={cn("p-2 rounded-lg transition-all", theme === 'legacy' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                <Laptop size={18} />
              </button>
            </div>

            <div className="relative hidden md:block group cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}>
              <input
                type="text"
                readOnly // Make it read-only so clicking opens the modal
                placeholder="Search command... (Ctrl+K)"
                className="bg-card pl-4 pr-10 py-3 rounded-xl text-sm shadow-sm focus:outline-none w-64 border border-transparent focus:border-primary transition-all text-foreground placeholder:text-muted-foreground cursor-pointer"
              />
              <Search className="absolute right-3 top-3 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <div className="absolute right-10 top-3 hidden group-hover:block transition-opacity">
                <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘K</span>
                </kbd>
              </div>
            </div>
            <button className="p-3 bg-card rounded-xl shadow-sm hover:bg-muted border border-transparent hover:border-border transition-all relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-card shadow-md cursor-pointer hover:shadow-lg transition-shadow">
              AD
            </div>
          </div>
        </header>

        {/* --- MAIN PAGE GRID --- */}
        <div className="grid grid-cols-12 gap-6">

          {/* =========================================
              LEFT COLUMN (MAIN CONTENT) - Spans 9
          ========================================== */}
          <div className="col-span-12 xl:col-span-9 flex flex-col gap-6">

            {/* ROW 1: MODERN STACKED CARDS + MONITORING */}
            <div className="grid grid-cols-12 gap-6">

              <div className="col-span-12 lg:col-span-4 relative min-h-[310px] top-2 h-full perspective-1000">
                <div className="relative w-full h-[310px]">
                  <AnimatePresence mode='popLayout'>
                    {/* We render 3 cards: current, next, and the one after */}
                    {[0, 1, 2].map((offset) => {
                      const index = (cardIndex + offset) % adminCards.length;
                      const card = adminCards[index];

                      // Visual state based on stack position
                      const isFront = offset === 0;
                      const isSecond = offset === 1;
                      const isThird = offset === 2;

                      return (
                        <motion.div
                          key={card.id} // reliable key is needed, assuming ids are unique
                          layout
                          initial={{ scale: 0.9, y: -20, opacity: 0 }}
                          animate={{
                            scale: isFront ? 1 : isSecond ? 1 : 0.99, // Equal height/width look
                            y: isFront ? 0 : isSecond ? -8 : -16, // Tighter stacking
                            opacity: isFront ? 1 : isSecond ? 0.9 : 0.8, // More visible stack
                            zIndex: isFront ? 30 : isSecond ? 20 : 10,
                            filter: isFront ? 'blur(0px)' : 'blur(0px)'
                          }}
                          exit={{ x: 200, opacity: 0, scale: 1.1, rotate: 10, transition: { duration: 0.4 } }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                          className={cn(
                            "absolute top-0 left-0 right-0 h-full w-full rounded-[32px] p-7 text-white overflow-hidden cursor-pointer shadow-2xl transition-shadow duration-300 group",
                            card.gradient,
                            isFront ? card.shadowColor : "shadow-none",
                            "border border-white/20 backdrop-blur-xl"
                          )}
                          onClick={() => {
                            if (isFront) {
                              router.push(card.path);
                            } else {
                              handleNextCard();
                            }
                          }}
                        >
                          {/* TEXTURE LAYERS */}
                          <div className="bg-noise absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"></div>
                          <div className="pattern-zigzag absolute inset-0 mix-blend-soft-light pointer-events-none opacity-30"></div>

                          {/* GLOW EFFECTS - Only visible properly on front card usually, but good to have on all for transition smoothness */}
                          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white opacity-20 blur-[50px] rounded-full mix-blend-overlay"></div>
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-10 blur-[40px] rounded-full"></div>

                          {/* CONTENT */}
                          <div className="relative z-10 flex justify-between items-start h-full flex-col">
                            <div className="w-full">
                              <div className="flex items-center justify-between w-full mb-3">
                                <div className="px-2.5 py-1 rounded-full bg-black/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5 self-start">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{card.type}</span>
                                </div>
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/40 shadow-inner">
                                  <card.icon className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                              </div>
                              <motion.h2 layoutId={`title-${card.id}`} className="text-4xl font-extrabold tracking-tight drop-shadow-sm mt-1">{card.mainValue}</motion.h2>
                              <p className="text-white/80 text-sm font-medium mt-1 ml-0.5">{card.title}</p>
                            </div>

                            <div className="w-full relative z-10 flex justify-between items-end mt-auto">
                              <div>
                                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">Details</p>
                                <p className="font-semibold text-lg tracking-wide text-white drop-shadow-sm">{card.subText}</p>
                              </div>

                              {/* Navigation Controls (Visible on Front Card) */}
                              {isFront ? (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                                    className="w-8 h-8 rounded-full bg-black/20 hover:bg-white hover:text-indigo-600 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                                    className="w-8 h-8 rounded-full bg-black/20 hover:bg-white hover:text-indigo-600 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all duration-300 group-hover:scale-110"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    }).reverse()}
                    {/* We reverse so that the first item (offset 0, z-index 30) is rendered LAST in the DOM, appearing on top physically if z-index fails, but z-index handles it mostly. 
                          Actually with absolute positioning and z-index, DOM order matters less for stacking context if z-index is explicit, but reverse helps with default paint order. 
                      */}
                  </AnimatePresence>
                </div>
              </div>

              {/* --- CARD 2: ADMIN MONITORING CONSOLE (MODERN GRID) --- */}
              <div className="col-span-12 lg:col-span-8">
                <div className="h-full bg-card rounded-[32px] p-6 shadow-sm border border-border flex flex-col relative overflow-hidden min-h-[320px]">

                  {/* Header Row */}
                  <div className="flex justify-between items-center mb-5 z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-xl">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground leading-none">Live Proctoring</h2>
                        <p className="text-xs text-muted-foreground mt-1">Monitoring 142 Active Candidates</p>
                      </div>
                    </div>

                    <div className="flex bg-muted p-1 rounded-xl border border-border">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-card shadow-sm rounded-lg text-xs font-semibold text-foreground">
                        <LayoutGrid size={14} /> Grid
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                        <Maximize2 size={14} /> Focus
                      </button>
                    </div>
                  </div>

                  {/* Modern Candidate Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 z-10">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="relative rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer shadow-sm hover:shadow-md transition-all border border-transparent hover:border-indigo-200">

                        {/* Image Feed */}
                        <img
                          src={`https://images.unsplash.com/photo-${i === 1 ? '1535713875002-d1d0cf377fde' : i === 2 ? '1580489944761-15a19d654956' : i === 3 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&q=80&w=300`}
                          alt={`Cam ${i}`}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />

                        {/* Glassmorphism Overlay (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Candidate</p>
                              <p className="text-xs text-white font-bold">Vishal V.</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                          </div>
                        </div>

                        {/* Top Right Controls (Appear on Hover) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-5px] group-hover:translate-y-0 duration-300">
                          <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/40 text-white">
                            <Mic size={12} />
                          </div>
                        </div>

                        {/* Warning Badge */}
                        {i === 2 && (
                          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[9px] py-1 px-2 rounded-lg font-bold flex items-center gap-1 shadow-sm border border-red-400">
                            <AlertTriangle size={10} /> Face Hidden
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Link */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity z-20">
                    <button className="bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      View All Streams <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: LOGS & CHARTS */}
            <div className="grid grid-cols-12 gap-6">

              {/* ADMIN LOGS & PALETTE */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">

                {/* FLAGGED INCIDENTS LOG */}
                <div className="bg-card rounded-[32px] p-6 shadow-sm flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-foreground">Flagged Incidents</h3>
                    <MoreHorizontal className="text-muted-foreground w-5 h-5 cursor-pointer" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Multiple Voices</p>
                          <p className="text-xs text-muted-foreground">ID: 8821 • 12 Jan 09:34</p>
                        </div>
                      </div>
                      <button className="text-xs border border-red-200/50 text-red-500 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-colors font-medium">Review</button>
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-orange-500/10 rounded-2xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-sm">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Browser Focus Lost</p>
                          <p className="text-xs text-muted-foreground">ID: 9942 • 12 Jan 09:40</p>
                        </div>
                      </div>
                      <button className="text-xs border border-orange-200/50 text-orange-500 px-3 py-1 rounded-full hover:bg-orange-500 hover:text-white transition-colors font-medium">Log</button>
                    </div>
                    {/* Skeleton Fillers */}
                    {[1, 2].map((i) => (
                      <div key={`skel-${i}`} className="flex items-center justify-between p-3 rounded-2xl animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted" />
                          <div className="space-y-2">
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-2 w-32 bg-muted/60 rounded" />
                          </div>
                        </div>
                        <div className="h-6 w-14 bg-muted rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="bg-card rounded-[32px] p-6 shadow-sm">
                  <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
                  <div className="flex gap-4 mb-4">
                    <button className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 p-3 rounded-2xl flex flex-col items-center gap-2 transition-colors group">
                      <Users className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-muted-foreground">Users</span>
                    </button>
                    <button className="flex-1 bg-pink-500/10 hover:bg-pink-500/20 p-3 rounded-2xl flex flex-col items-center gap-2 transition-colors group">
                      <AlertTriangle className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-muted-foreground">Reports</span>
                    </button>
                    <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 p-3 rounded-2xl flex flex-col items-center gap-2 transition-colors group">
                      <CheckCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-muted-foreground">Results</span>
                    </button>
                  </div>
                  <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                    <Plus size={18} /> Create New Assessment
                  </button>
                </div>
              </div>

              {/* CHARTS */}
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">

                {/* Bar Chart */}
                <div className="bg-card p-6 rounded-[32px] shadow-sm border border-border">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><Briefcase size={16} /></div>
                      <h3 className="font-bold text-foreground">Assessment Traffic</h3>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <RechartsTooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                        />
                        <Bar dataKey="candidates" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-card p-6 rounded-[32px] shadow-sm flex-1 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><Zap size={16} /></div>
                      <h3 className="font-bold text-foreground">Proctoring Flags</h3>
                    </div>
                    <MoreHorizontal size={14} className="text-muted-foreground cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="h-[160px] w-[160px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" cornerRadius={6} stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-foreground">100</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-3">
                      {pieData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-card shadow-sm" style={{ background: item.color }}></div>
                            <span className="text-xs text-muted-foreground font-semibold">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* =========================================
              RIGHT SIDEBAR (Calendar/Agenda)
          ========================================== */}
          <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">

            {/* Calendar Widget */}
            <div className="bg-card rounded-[32px] p-6 shadow-sm border border-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">Calendar</h3>
                <Clock size={16} className="text-muted-foreground" />
              </div>
              <div className="rounded-xl overflow-hidden">
                <Calendar
                  onChange={handleDateChange}
                  value={date}
                  next2Label={null}
                  prev2Label={null}
                  prevLabel={<span className="text-lg text-muted-foreground hover:text-primary transition-colors">‹</span>}
                  nextLabel={<span className="text-lg text-muted-foreground hover:text-primary transition-colors">›</span>}
                  tileContent={tileContent}
                />
              </div>
            </div>

            {/* Timeline / Agenda */}
            <div className="bg-card rounded-[30px] p-4 shadow-sm flex flex-col border border-border flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground">
                  {selectedDate ? 'Assessments' : "Today's Agenda"}
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-full font-bold border border-indigo-200/50">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="pl-1 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isLoadingAssessments ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-4 bg-muted rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted/60 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const today = new Date().toDateString();
                  const displayDate = selectedDate ? selectedDate.toDateString() : today;
                  const dateAssessments = assessments.filter(a =>
                    a.startDate && new Date(a.startDate).toDateString() === displayDate
                  );
                  const hasNoAssessmentsForDate = dateAssessments.length === 0;

                  return (
                    <>
                      {hasNoAssessmentsForDate && (
                        <div className="text-xs text-muted-foreground mb-4 py-2 px-3 bg-muted/30 rounded-lg border border-border/50">
                          No assessment for {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'today'}
                        </div>
                      )}
                      {filteredAssessments.length > 0 ? (
                        <>
                          {filteredAssessments
                            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                            .slice(0, 5)
                            .map((assessment, idx) => {
                              const startTime = new Date(assessment.startDate);
                              const now = new Date();
                              const isActive = assessment.status === 'PUBLISHED' && startTime <= now;
                              const isPast = startTime < now && assessment.status !== 'PUBLISHED';
                              const status: 'done' | 'active' | 'pending' = isPast ? 'done' : isActive ? 'active' : 'pending';

                              return (
                                <TimelineItem
                                  key={assessment.id}
                                  time={startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  title={assessment.title}
                                  sub={`${assessment.totalQuestions || 0} Questions • ${assessment.status}`}
                                  status={status}
                                  isLast={idx === filteredAssessments.length - 1 && filteredAssessments.length >= 3}
                                />
                              );
                            })}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground/60 text-center py-4">
                          No assessments scheduled
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* System Health Compact */}
              <div className="mt-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-card rounded-full text-emerald-500 shadow-sm">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">System Operational</p>
                      <p className="text-[10px] text-emerald-600 font-medium">99.9% Uptime</p>
                    </div>
                  </div>
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;