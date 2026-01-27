"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import {
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Briefcase,
  Zap,
  Plus,
  Users,
  ArrowRight,
  Maximize2,
  LayoutGrid,
  TrendingUp,
  Activity,
  Sun,
  Moon,
  Laptop,
  CalendarDays,
  PlayCircle,
  BarChart3,
  Building2,
  FileCode2
} from 'lucide-react';

import { ThemeContext } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
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
import { assessmentService } from '@/api/assessmentService';
import { adminService } from '@/api/adminService';
import { companyService } from '@/api/companyService';
import { contestService } from '@/api/contestService';

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

  /* --- MODERN NOISE TEXTURE --- */
  .bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
    background-blend-mode: overlay;
  }

  .pattern-zigzag {
    background-color: transparent;
    background-image: linear-gradient(135deg, #ffffff 25%, transparent 25%), linear-gradient(225deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(315deg, #ffffff 25%, transparent 25%);
    background-position:  10px 0, 10px 0, 0 0, 0 0;
    background-size: 20px 20px;
    background-repeat: repeat;
    opacity: 0.1;
  }
`;

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
          status === 'active' && "bg-gradient-to-br from-indigo-600 to-violet-600 ring-2 ring-primary/20",
          status === 'pending' && "bg-card border border-border"
        )}></div>
        {!isLast && <div className={cn("w-[1px] h-full absolute top-2 bg-border")}></div>}
      </div>
      <div className="flex-1 pb-6">
        <div className={cn(
          "px-3 py-2 rounded-lg border transition-all duration-200 cursor-default",
          status === 'active' && "bg-card border-primary/30 shadow-sm"
        )}>
          <h4 className={cn("text-xs font-semibold", status === 'active' ? "text-foreground" : "text-card-foreground")}>{title}</h4>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
};

// Types
type Assessment = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  totalQuestions: number;
  duration: number;
};

const AdminDashboard = () => {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const { unreadCount } = useNotifications();
  const [date, setDate] = useState<any>(new Date());
  const [cardIndex, setCardIndex] = useState(0);
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    activeCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    totalCount: 0
  });

  // Chart Data
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // Platform Stats
  const [platformStats, setPlatformStats] = useState({
    companyCount: 0,
    adminCount: 0,
    totalQuestions: 0,
    totalSubmissions: 0
  });

  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  // Fetch assessments metrics & Platform Stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [assessmentsRes, metricsRes, companiesRes, adminsRes, submissionsRes] = await Promise.allSettled([
          assessmentService.listAssessments({ limit: 100 }),
          contestService.getOrganizerMetrics(),
          companyService.getCompanies(),
          adminService.listAdmins(),
          contestService.getRecentSubmissions(5)
        ]);

        // Process Assessments
        if (assessmentsRes.status === 'fulfilled') {
          const allAssessments = assessmentsRes.value.data.data || assessmentsRes.value.data.assessments || [];
          setAssessments(allAssessments);

          const now = new Date();
          let active = 0;
          let upcoming = 0;
          let completed = 0;

          allAssessments.forEach((a: Assessment) => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            if (now >= start && now <= end && a.status === 'PUBLISHED') active++;
            else if (now < start) upcoming++;
            else completed++;
          });

          setStats({
            activeCount: active,
            upcomingCount: upcoming,
            completedCount: completed,
            totalCount: allAssessments.length
          });

          // Weekly Data
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const weekly = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dayName = days[d.getDay()];
            const dateStr = d.toDateString();
            const count = allAssessments.filter((a: Assessment) => new Date(a.startDate).toDateString() === dateStr).length;
            return { name: dayName, count };
          });
          setWeeklyData(weekly);

          // Status Data
          setStatusData([
            { name: 'Active', value: active, color: '#10b981' },
            { name: 'Upcoming', value: upcoming, color: '#6366f1' },
            { name: 'Ended', value: completed, color: '#64748b' },
          ]);
        }

        // Process Platform Stats
        let qCount = 0;
        let sCount = 0;
        let cCount = 0;
        let aCount = 0;

        if (metricsRes.status === 'fulfilled') {
          qCount = metricsRes.value.data.totalQuestions || 0;
          sCount = metricsRes.value.data.totalSubmissions || 0;
        }
        if (companiesRes.status === 'fulfilled') {
          const cData = companiesRes.value.data;
          const cList = Array.isArray(cData) ? cData : (cData.data || cData.companies || []);
          cCount = cList.length;
        }
        if (adminsRes.status === 'fulfilled') {
          const aData = adminsRes.value.data;
          const aList = Array.isArray(aData) ? aData : (aData.data?.admins || aData.admins || []);
          aCount = aList.length;
        }

        setPlatformStats({
          companyCount: cCount,
          adminCount: aCount,
          totalQuestions: qCount,
          totalSubmissions: sCount
        });

        if (submissionsRes.status === 'fulfilled') {
          setRecentSubmissions(submissionsRes.value.data.data || submissionsRes.value.data || []);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter assessments for selected date
  const filteredAssessments = useMemo(() => {
    if (!selectedDate) return assessments;
    const dateStr = selectedDate.toDateString();
    const filtered = assessments.filter(a =>
      a.startDate && new Date(a.startDate).toDateString() === dateStr
    );
    return filtered.length > 0 ? filtered : assessments;
  }, [selectedDate, assessments]);

  const handleDateChange = (newDate: any) => {
    setDate(newDate);
    setSelectedDate(newDate);
  };

  const tileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
    const hasAssessment = assessments.some(a => new Date(a.startDate).toDateString() === tileDate.toDateString());
    if (view === 'month' && hasAssessment) {
      return (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600" />
        </div>
      );
    }
    return null;
  };

  // Cards Data (Dynamic Platform Stats)
  const adminCards = useMemo(() => [
    {
      id: 1,
      type: 'Platform',
      title: "Active Partners",
      mainValue: `${platformStats.companyCount} Companies`,
      subText: "Registered Organizations",
      gradient: "bg-gradient-to-br from-indigo-600 to-violet-700",
      shadowColor: "shadow-indigo-500/50",
      icon: Building2,
      path: "/organizer/companies"
    },
    {
      id: 2,
      type: 'Team',
      title: "Collaborators",
      mainValue: `${platformStats.adminCount} Admins`,
      subText: "Team Management",
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      shadowColor: "shadow-emerald-500/50",
      icon: Users,
      path: "/organizer/admins"
    },
    {
      id: 3,
      type: 'Content',
      title: "Shared Library",
      mainValue: `${platformStats.totalQuestions} Questions`,
      subText: "Question Bank Size",
      gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/50",
      icon: FileCode2, // I need to make sure FileCode2 is imported or used appropriately
      path: "/organizer/questions"
    }
  ], [platformStats]);

  // Card cycling
  const handleNextCard = () => setCardIndex((prev) => (prev + 1) % adminCards.length);
  const handlePrevCard = () => setCardIndex((prev) => (prev - 1 + adminCards.length) % adminCards.length);

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-background p-6 font-sans text-foreground overflow-x-hidden transition-colors duration-300">

        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-6 px-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Organizer Console</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitoring & Assessment Hub 👋</p>
          </div>

          <div className="flex items-center gap-6">
            {/* THEME TOGGLE */}
            <div className="bg-card p-1 rounded-xl border border-border shadow-sm flex items-center gap-1">
              <button onClick={() => setTheme('light')} className={cn("p-2 rounded-lg transition-all", theme === 'light' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}> <Sun size={18} /> </button>
              <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-lg transition-all", theme === 'dark' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}> <Moon size={18} /> </button>
              <button onClick={() => setTheme('legacy')} className={cn("p-2 rounded-lg transition-all", theme === 'legacy' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}> <Laptop size={18} /> </button>
            </div>

            <div className="relative hidden md:block group cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}>
              <input type="text" readOnly placeholder="Search command... (Ctrl+K)" className="bg-card pl-4 pr-10 py-3 rounded-xl text-sm shadow-sm focus:outline-none w-64 border border-transparent focus:border-primary transition-all text-foreground placeholder:text-muted-foreground cursor-pointer" />
              <Search className="absolute right-3 top-3 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
            </div>

            <button onClick={() => router.push('/organizer/notifications')} className="p-3 bg-card rounded-xl shadow-sm hover:bg-muted border border-transparent hover:border-border transition-all relative group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm">{unreadCount}</span>}
            </button>

            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-card shadow-md cursor-pointer hover:shadow-lg transition-shadow"> AD </div>
          </div>
        </header>

        {/* --- MAIN PAGE GRID --- */}
        <div className="grid grid-cols-12 gap-6">

          {/* LEFT COLUMN (MAIN CONTENT) */}
          <div className="col-span-12 xl:col-span-9 flex flex-col gap-6">

            {/* ROW 1: CARDS + LIVE ASSESSMENTS */}
            <div className="grid grid-cols-12 gap-6">

              {/* Stacked Cards */}
              <div className="col-span-12 lg:col-span-4 relative min-h-[310px] top-2 h-full perspective-1000">
                <div className="relative w-full h-[310px]">
                  <AnimatePresence mode='popLayout'>
                    {[0, 1, 2].map((offset) => {
                      const index = (cardIndex + offset) % adminCards.length;
                      const card = adminCards[index];
                      const isFront = offset === 0;
                      return (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ scale: 0.9, y: -20, opacity: 0 }}
                          animate={{ scale: isFront ? 1 : offset === 1 ? 1 : 0.99, y: isFront ? 0 : offset === 1 ? -8 : -16, opacity: isFront ? 1 : offset === 1 ? 0.9 : 0.8, zIndex: isFront ? 30 : offset === 1 ? 20 : 10 }}
                          exit={{ x: 200, opacity: 0, scale: 1.1, rotate: 10, transition: { duration: 0.4 } }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          className={cn("absolute top-0 left-0 right-0 h-full w-full rounded-[32px] p-7 text-white overflow-hidden cursor-pointer shadow-2xl transition-shadow duration-300 group", card.gradient, isFront ? card.shadowColor : "shadow-none", "border border-white/20 backdrop-blur-xl")}
                          onClick={() => { if (isFront) router.push(card.path); else handleNextCard(); }}
                        >
                          <div className="bg-noise absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"></div>
                          <div className="pattern-zigzag absolute inset-0 mix-blend-soft-light pointer-events-none opacity-30"></div>
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
                              {isFront ? (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                  <button onClick={(e) => { e.stopPropagation(); handlePrevCard(); }} className="w-8 h-8 rounded-full bg-black/20 hover:bg-white hover:text-indigo-600 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"><ChevronLeft className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleNextCard(); }} className="w-8 h-8 rounded-full bg-black/20 hover:bg-white hover:text-indigo-600 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                              ) : (<button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    }).reverse()}
                  </AnimatePresence>
                </div>
              </div>

              {/* LIVE ASSESSMENTS LIST (Replaces Fake Grid) */}
              <div className="col-span-12 lg:col-span-8">
                <div className="h-full bg-card rounded-[32px] p-6 shadow-sm border border-border flex flex-col relative overflow-hidden min-h-[320px]">
                  <div className="flex justify-between items-center mb-5 z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground leading-none">Active Assessments</h2>
                        <p className="text-xs text-muted-foreground mt-1">Happening right now</p>
                      </div>
                    </div>
                    <button onClick={() => router.push('/organizer/assessments?status=PUBLISHED')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 z-10 pr-1 custom-scrollbar">
                    {stats.activeCount > 0 ? (
                      assessments.filter(a => {
                        const now = new Date();
                        return new Date(a.startDate) <= now && new Date(a.endDate) >= now && a.status === 'PUBLISHED';
                      }).slice(0, 4).map(a => (
                        <div key={a.id} className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                              <Activity size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>Ends {new Date(a.endDate).toLocaleDateString()}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <span>{a.totalQuestions} Questions</span>
                              </p>
                            </div>
                          </div>
                          <button onClick={() => router.push(`/organizer/assessments`)} className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold hover:bg-gradient-to-br from-indigo-600 to-violet-600 hover:text-primary-foreground transition-all shadow-sm">
                            Manage
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center opacity-70">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                          <CalendarDays size={24} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">No Active Assessments</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">Create an assessment to start monitoring live candidate progress.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: CHARTS & LOGS */}
            <div className="grid grid-cols-12 gap-6">

              {/* RECENT ACTIVITY LOG */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                <div className="bg-card rounded-[32px] p-6 shadow-sm flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-foreground">Recently Created</h3>
                    <MoreHorizontal className="text-muted-foreground w-5 h-5 cursor-pointer" />
                  </div>
                  <div className="space-y-4 flex-1">
                    {assessments.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform shadow-sm">
                            <PlayCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(a.startDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold border",
                          a.status === 'PUBLISHED' ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {assessments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No recent activity.</p>}
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
                      <BarChart3 className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-muted-foreground">Reports</span>
                    </button>
                    <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 p-3 rounded-2xl flex flex-col items-center gap-2 transition-colors group">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-muted-foreground">Results</span>
                    </button>
                  </div>
                  <button onClick={() => router.push('/assessments/create')} className="w-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:bg-gradient-to-br from-indigo-600 to-violet-600/90 text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
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
                      <h3 className="font-bold text-foreground">Scheduled This Week</h3>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-card p-6 rounded-[32px] shadow-sm flex-1 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><Zap size={16} /></div>
                      <h3 className="font-bold text-foreground">Status Overview</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="h-[160px] w-[160px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" cornerRadius={6} stroke="none">
                            {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-foreground">{stats.totalCount}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-3">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-card shadow-sm" style={{ background: item.color }}></div>
                            <span className="text-xs text-muted-foreground font-semibold">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Calendar (Already Functional) - Keep as is but use stats */}
          <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
            <div className="bg-card rounded-[32px] p-6 shadow-sm border border-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">Calendar</h3>
                <Clock size={16} className="text-muted-foreground" />
              </div>
              <div className="rounded-xl overflow-hidden">
                <Calendar onChange={handleDateChange} value={date} next2Label={null} prev2Label={null}
                  prevLabel={<span className="text-lg text-muted-foreground hover:text-primary transition-colors">‹</span>}
                  nextLabel={<span className="text-lg text-muted-foreground hover:text-primary transition-colors">›</span>}
                  tileContent={tileContent}
                />
              </div>
            </div>

            <div className="bg-card rounded-[30px] p-4 shadow-sm flex flex-col border border-border flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground">
                  {selectedDate && selectedDate.toDateString() === new Date().toDateString() ? "Today's Agenda" : "Assessments"}
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-full font-bold border border-indigo-200/50">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="pl-1 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-4 bg-muted rounded" />
                        <div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted/60 rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  filteredAssessments.length > 0 ? (
                    filteredAssessments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5).map((assessment, idx) => {
                      const startTime = new Date(assessment.startDate);
                      const now = new Date();
                      const isActive = assessment.status === 'PUBLISHED' && startTime <= now;
                      const isPast = startTime < now && assessment.status !== 'PUBLISHED';
                      return <TimelineItem key={assessment.id} time={startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} title={assessment.title} sub={`${assessment.totalQuestions || 0} Questions • ${assessment.status}`} status={isPast ? 'done' : isActive ? 'active' : 'pending'} isLast={idx === filteredAssessments.length - 1} />;
                    })
                  ) : (<div className="text-xs text-muted-foreground/60 text-center py-4">No assessments scheduled</div>)
                )}
              </div>
              {/* System Health Compact - Static but visually pleasing */}
              <div className="mt-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-card rounded-full text-emerald-500 shadow-sm"><CheckCircle2 size={16} /></div>
                    <div><p className="text-xs font-bold text-foreground">System Operational</p><p className="text-[10px] text-emerald-600 font-medium">99.9% Uptime</p></div>
                  </div>
                  <div className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></div>
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