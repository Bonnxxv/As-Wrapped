import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  Zap,
  Video,
  Crown,
  Maximize2,
  X
} from 'lucide-react';
import { FolderDataState, PlatformProfiles, ContentEntry } from '../types';
import { MONTH_NAMES, getDaysInMonth } from '../utils/initialState';
import { TikTokIcon, InstagramIcon } from './MacSidebar';
import { MacDropdown } from './MacDropdown';

const CalendarWidget = ({ year, monthIndex, activeMonthData }: { year: number, monthIndex: number, activeMonthData: ContentEntry[] }) => {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) to 6 (Sat)

  const blanks = Array.from({ length: firstDay }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const initialSlots = [...blanks, ...days];

  // Pad with trailing blanks to ensure full rows (multiple of 7)
  const trailingCount = (7 - (initialSlots.length % 7)) % 7;
  const trailingBlanks = Array.from({ length: trailingCount }, () => null);
  const totalSlots = [...initialSlots, ...trailingBlanks];

  const daysWithContent = new Set(activeMonthData.map(c => c.day));
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-7 text-center mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-[9px] font-semibold text-mac-muted uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-mac-border/40 rounded-xl overflow-hidden">
        {totalSlots.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="h-10 border-r border-b border-mac-border/40" />;
          }
          const hasContent = daysWithContent.has(day);
          return (
            <div
              key={day}
              className={`h-10 flex flex-col items-center justify-center border-r border-b border-mac-border/40 text-[11px] mac-transition ${hasContent
                ? 'text-mac-accent font-semibold bg-mac-accent/5'
                : 'text-mac-text hover:bg-mac-surface/80 font-medium'
                }`}
            >
              {day}
              {hasContent && (
                <div className="w-1 h-1 rounded-full bg-mac-accent mt-0.5 opacity-80" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DashboardViewProps {
  folders: FolderDataState;
  profiles: PlatformProfiles;
  activeView: 'dashboard' | 'instagram' | 'tiktok';
  selectedYear: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  years: number[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  folders,
  profiles,
  activeView,
  selectedYear,
  selectedMonth,
  onSelectMonth,
  onSelectYear,
  years,
  isDarkMode,
  onToggleTheme
}) => {
  // Expanded states
  const [expandedChart, setExpandedChart] = React.useState<'monthly-combined' | 'monthly-platform' | 'daily' | 'cycle' | null>(null);
  const [summaryPeriod, setSummaryPeriod] = React.useState<'month' | 'year'>('month');
  const [expandedCard, setExpandedCard] = React.useState<{
    period: 'year' | 'month';
    metric: 'views' | 'uploads' | 'engagement' | 'fyp';
  } | null>(null);
  const [selectedCycleWeek, setSelectedCycleWeek] = React.useState<number>(0);

  // Line break calculations based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate(); // 1-31

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('id-ID');
  };

  const fmtFull = (n: number) => {
    return n.toLocaleString('id-ID');
  };

  const getMetrics = (item: ContentEntry) => {
    if (activeView === 'instagram') return item.instagram;
    if (activeView === 'tiktok') return item.tiktok;
    return {
      views: item.instagram.views + item.tiktok.views,
      likes: item.instagram.likes + item.tiktok.likes,
      comments: item.instagram.comments + item.tiktok.comments,
      saves: item.instagram.saves + item.tiktok.saves,
      shares: item.instagram.shares + item.tiktok.shares,
    };
  };

  // 1. YEAR CALCULATIONS
  const getYearContents = (year: number): ContentEntry[] => {
    const list: ContentEntry[] = [];
    for (let m = 0; m < 12; m++) {
      const monthContents = folders[year]?.[m] || [];
      monthContents.forEach(item => {
        list.push(item);
      });
    }
    return list;
  };

  const yearContents = getYearContents(selectedYear);
  const yearTotalViews = yearContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
  const yearTotalLikes = yearContents.reduce((sum, item) => sum + getMetrics(item).likes, 0);
  const yearTotalComments = yearContents.reduce((sum, item) => sum + getMetrics(item).comments, 0);
  const yearTotalUploads = yearContents.length;
  const yearFypCount = yearContents.filter(item => getMetrics(item).views > 20000).length;

  // IG vs TT breakdown for selectedYear
  const yearIgViews = yearContents.reduce((sum, item) => sum + item.instagram.views, 0);
  const yearTtViews = yearContents.reduce((sum, item) => sum + item.tiktok.views, 0);
  const yearTotalViewsCalculated = yearIgViews + yearTtViews;
  const yearIgPct = yearTotalViewsCalculated > 0 ? Math.round((yearIgViews / yearTotalViewsCalculated) * 100) : 0;
  const yearTtPct = yearTotalViewsCalculated > 0 ? (100 - yearIgPct) : 0;

  const prevYearContents = getYearContents(selectedYear - 1);
  const prevYearTotalViews = prevYearContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
  const prevYearTotalLikes = prevYearContents.reduce((sum, item) => sum + getMetrics(item).likes, 0);

  const yearViewsGrowth = prevYearTotalViews > 0 ? ((yearTotalViews - prevYearTotalViews) / prevYearTotalViews) * 100 : 0;
  const yearLikesGrowth = prevYearTotalLikes > 0 ? ((yearTotalLikes - prevYearTotalLikes) / prevYearTotalLikes) * 100 : 0;

  let currentFollowers = 0;
  if (activeView === 'instagram') {
    currentFollowers = profiles.instagram.followers;
  } else if (activeView === 'tiktok') {
    currentFollowers = profiles.tiktok.followers;
  } else {
    currentFollowers = profiles.instagram.followers + profiles.tiktok.followers;
  }

  // 2. MOM CHART DATA
  const momChartData = MONTH_NAMES.map((name, idx) => {
    // Check if month idx in selectedYear is active/inputted (not in the future)
    let isMonthActive = true;
    if (selectedYear > currentYear) {
      isMonthActive = false;
    } else if (selectedYear === currentYear) {
      const maxMonthWithData = Array.from({ length: 12 }, (_, i) => i)
        .reverse()
        .find(m => (folders[selectedYear]?.[m]?.length || 0) > 0) ?? -1;
      const lastActiveMonthLimit = Math.max(currentMonth, maxMonthWithData);
      isMonthActive = idx <= lastActiveMonthLimit;
    } else {
      const maxMonthWithData = Array.from({ length: 12 }, (_, i) => i)
        .reverse()
        .find(m => (folders[selectedYear]?.[m]?.length || 0) > 0) ?? -1;
      isMonthActive = maxMonthWithData === -1 ? true : idx <= maxMonthWithData;
    }

    const mContents = folders[selectedYear]?.[idx] || [];

    const igViews = mContents.reduce((sum, item) => sum + item.instagram.views, 0);
    const ttViews = mContents.reduce((sum, item) => sum + item.tiktok.views, 0);
    const mViews = activeView === 'instagram' ? igViews : activeView === 'tiktok' ? ttViews : (igViews + ttViews);
    const mLikes = mContents.reduce((sum, item) => sum + getMetrics(item).likes, 0);
    const mQuantity = mContents.length;

    let prevMIdx = idx - 1;
    let prevMYr = selectedYear;
    if (prevMIdx < 0) {
      prevMIdx = 11;
      prevMYr = selectedYear - 1;
    }
    const prevMContents = folders[prevMYr]?.[prevMIdx] || [];
    const prevMViews = prevMContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
    const mViewsGrowth = prevMViews > 0 ? ((mViews - prevMViews) / prevMViews) * 100 : 0;

    return {
      index: idx,
      name: name,
      shortName: name.substring(0, 3),
      views: isMonthActive ? mViews : null,
      igViews: isMonthActive ? igViews : null,
      ttViews: isMonthActive ? ttViews : null,
      likes: isMonthActive ? mLikes : null,
      quantity: isMonthActive ? mQuantity : null,
      growth: isMonthActive ? mViewsGrowth : null
    };
  });

  // 3. MONTH CALCULATIONS
  const selectedMonthContents = folders[selectedYear]?.[selectedMonth] || [];

  const monthTotalViews = selectedMonthContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
  const monthTotalLikes = selectedMonthContents.reduce((sum, item) => sum + getMetrics(item).likes, 0);
  const monthTotalComments = selectedMonthContents.reduce((sum, item) => sum + getMetrics(item).comments, 0);
  const monthTotalUploads = selectedMonthContents.length;
  const monthFypCount = selectedMonthContents.filter(item => getMetrics(item).views > 20000).length;

  // IG vs TT breakdown for selectedMonth
  const monthIgViews = selectedMonthContents.reduce((sum, item) => sum + item.instagram.views, 0);
  const monthTtViews = selectedMonthContents.reduce((sum, item) => sum + item.tiktok.views, 0);
  const monthTotalViewsCalculated = monthIgViews + monthTtViews;
  const monthIgPct = monthTotalViewsCalculated > 0 ? Math.round((monthIgViews / monthTotalViewsCalculated) * 100) : 0;
  const monthTtPct = monthTotalViewsCalculated > 0 ? (100 - monthIgPct) : 0;

  let prevMIdx = selectedMonth - 1;
  let prevMYr = selectedYear;
  if (prevMIdx < 0) {
    prevMIdx = 11;
    prevMYr = selectedYear - 1;
  }
  const prevMonthContents = folders[prevMYr]?.[prevMIdx] || [];
  const prevMonthTotalViews = prevMonthContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
  const prevMonthTotalLikes = prevMonthContents.reduce((sum, item) => sum + getMetrics(item).likes, 0);

  const monthViewsGrowth = prevMonthTotalViews > 0 ? ((monthTotalViews - prevMonthTotalViews) / prevMonthTotalViews) * 100 : 0;
  const monthLikesGrowth = prevMonthTotalLikes > 0 ? ((monthTotalLikes - prevMonthTotalLikes) / prevMonthTotalLikes) * 100 : 0;

  const sortedContents = [...selectedMonthContents].sort((a, b) => getMetrics(b).views - getMetrics(a).views);
  const bestContents = activeView === 'dashboard' ? sortedContents.slice(0, 5) : sortedContents.slice(0, 4);

  // 4. DAILY CHART DATA (For activeView !== 'dashboard')
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  let lastActiveDayLimit = daysInMonth;
  if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
    lastActiveDayLimit = 0; // Future month
  } else if (selectedYear === currentYear && selectedMonth === currentMonth) {
    const maxDayWithData = selectedMonthContents.reduce((max, item) => Math.max(max, item.day), 0);
    lastActiveDayLimit = Math.max(currentDay, maxDayWithData);
  }

  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isDayActive = day <= lastActiveDayLimit;
    const dContents = selectedMonthContents.filter(item => item.day === day);
    const dViews = dContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
    return {
      day,
      label: `${day}`,
      views: isDayActive ? dViews : null
    };
  });

  // 5. CYCLE CHART DATA (Weekly cycle: Senin to Minggu for the selected calendar week in the selected month)
  const getWeeksInMonth = (year: number, monthIndex: number) => {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const weeks: { weekIndex: number; label: string; startDay: number; endDay: number }[] = [];
    
    let currentWeekStart = 1;
    let currentWeekIndex = 1;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      
      if (dayOfWeek === 0 || day === daysInMonth) {
        const label = `Minggu ${currentWeekIndex} (${currentWeekStart} - ${day} ${MONTH_NAMES[monthIndex].substring(0, 3)})`;
        weeks.push({
          weekIndex: currentWeekIndex - 1,
          label,
          startDay: currentWeekStart,
          endDay: day
        });
        currentWeekStart = day + 1;
        currentWeekIndex++;
      }
    }
    return weeks;
  };

  const weeksInActiveMonth = getWeeksInMonth(selectedYear, selectedMonth);
  const safeWeekIndex = selectedCycleWeek < weeksInActiveMonth.length ? selectedCycleWeek : 0;
  const activeWeekRange = weeksInActiveMonth[safeWeekIndex];
  const weekOptions = weeksInActiveMonth.map(w => ({ value: w.weekIndex, label: w.label }));

  const cycleDays = [
    { key: 1, name: 'Senin', shortName: 'Sen' },
    { key: 2, name: 'Selasa', shortName: 'Sel' },
    { key: 3, name: 'Rabu', shortName: 'Rab' },
    { key: 4, name: 'Kamis', shortName: 'Kam' },
    { key: 5, name: 'Jumat', shortName: 'Jum' },
    { key: 6, name: 'Sabtu', shortName: 'Sab' },
    { key: 0, name: 'Minggu', shortName: 'Min' }
  ];

  const cycleChartData = cycleDays.map(d => {
    const dContents = selectedMonthContents.filter(item => {
      const date = new Date(selectedYear, selectedMonth, item.day);
      const isCorrectDayOfWeek = date.getDay() === d.key;
      const isInWeekRange = activeWeekRange 
        ? (item.day >= activeWeekRange.startDay && item.day <= activeWeekRange.endDay)
        : false;
      return isCorrectDayOfWeek && isInWeekRange;
    });

    const dViews = dContents.reduce((sum, item) => sum + getMetrics(item).views, 0);

    // Determine if this day of week has actually passed or has data in this week range
    let isDayActive = false;
    if (activeWeekRange) {
      const dayInWeek = Array.from(
        { length: activeWeekRange.endDay - activeWeekRange.startDay + 1 },
        (_, i) => activeWeekRange.startDay + i
      ).find(dayNum => {
        const date = new Date(selectedYear, selectedMonth, dayNum);
        return date.getDay() === d.key;
      });

      if (dayInWeek !== undefined) {
        if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
          isDayActive = false;
        } else if (selectedYear === currentYear && selectedMonth === currentMonth) {
          isDayActive = dayInWeek <= lastActiveDayLimit;
        } else {
          isDayActive = true;
        }
      }
    }

    return {
      name: d.name,
      shortName: d.shortName,
      views: isDayActive ? dViews : null
    };
  });



  const monthOptions = MONTH_NAMES.map((name, idx) => ({ value: idx, label: name }));
  const yearOptions = years.map(yr => ({ value: yr, label: `${yr}` }));

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? '#101a1e' : '#FFFFFF',
      border: isDarkMode ? '1px solid #2e3b43' : '1px solid #ced0d4',
      borderRadius: '8px',
      color: isDarkMode ? '#f1f4f7' : '#0a1317',
      fontSize: '11px',
      boxShadow: isDarkMode ? 'none' : 'rgba(20, 22, 26, 0.12) 0px 4px 12px 0px',
    },
    labelStyle: {
      color: isDarkMode ? '#8595a4' : '#5d6c7b',
      fontWeight: 600
    },
  };

  const renderYearSummaryCards = (isDashboard: boolean) => {
    if (isDashboard) {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Impressions Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'views' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="flex items-center gap-3 z-10 min-w-0 w-full">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 mac-transition shrink-0">
                <Eye size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Views</span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(yearTotalViews)}</span>
                  {yearViewsGrowth !== 0 && (
                    <span className={`text-[8px] sm:text-[9px] font-semibold flex items-center gap-0.5 shrink-0 ${yearViewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {yearViewsGrowth >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {yearViewsGrowth > 0 ? '+' : ''}{yearViewsGrowth.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-full border-t border-mac-border/10 pt-2 z-10">
              <div className="flex justify-between text-[8px] font-bold text-mac-muted">
                <span className="text-pink-500">IG: {fmt(yearIgViews)} ({yearIgPct}%)</span>
                <span className="text-cyan-400">TT: {fmt(yearTtViews)} ({yearTtPct}%)</span>
              </div>
              <div className="h-1 w-full bg-mac-canvas border border-mac-border/30 rounded-full overflow-hidden flex">
                <div style={{ width: `${yearIgPct}%` }} className="h-full bg-pink-500" />
                <div style={{ width: `${yearTtPct}%` }} className="h-full bg-cyan-400" />
              </div>
            </div>
          </div>

          {/* Uploads Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'uploads' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Video size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Uploads</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{yearTotalUploads}</span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Video</span>
              </div>
            </div>
          </div>

          {/* Engagement Rate Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'engagement' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-teal-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Zap size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Engagement</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">
                  {yearTotalViews > 0 ? ((yearTotalLikes + yearTotalComments) / yearTotalViews * 100).toFixed(2) : '0.00'}%
                </span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Rata-rata</span>
              </div>
            </div>
          </div>

          {/* FYP Hits Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'fyp' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-amber-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">FYP Hits</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{yearFypCount}</span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Views &gt; 20K</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Vertical Cards for Individual Platforms
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
        {/* Impressions Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'views' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Views</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 mac-transition shrink-0">
              <Eye size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(yearTotalViews)}</span>
            {yearViewsGrowth !== 0 ? (
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 shrink-0 text-green-500">
                <TrendingUp size={10} />+{yearViewsGrowth.toFixed(0)}% vs LY
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-mac-muted font-medium invisible">—</span>
            )}
          </div>
        </div>

        {/* Total Likes Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'engagement' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-red-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Likes</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 mac-transition shrink-0">
              <Heart size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(yearTotalLikes)}</span>
            {yearLikesGrowth !== 0 ? (
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 shrink-0 text-green-500">
                <TrendingUp size={10} />+{yearLikesGrowth.toFixed(0)}% vs LY
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-mac-muted font-medium invisible">—</span>
            )}
          </div>
        </div>

        {/* Uploads Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'uploads' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Uploads</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 mac-transition shrink-0">
              <Video size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{yearTotalUploads}</span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Video</span>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'engagement' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-teal-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Engagement</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 group-hover:scale-110 mac-transition shrink-0">
              <Zap size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">
              {yearTotalViews > 0 ? ((yearTotalLikes + yearTotalComments) / yearTotalViews * 100).toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Rata-rata</span>
          </div>
        </div>

        {/* FYP Hits Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'fyp' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-amber-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">FYP Hits</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 mac-transition shrink-0">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{yearFypCount}</span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Views &gt; 20K</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthSummaryCards = (isDashboard: boolean) => {
    if (isDashboard) {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Month Impressions Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'views' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="flex items-center gap-3 z-10 min-w-0 w-full">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 mac-transition shrink-0">
                <Eye size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Views</span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(monthTotalViews)}</span>
                  {monthViewsGrowth !== 0 && (
                    <span className={`text-[8px] sm:text-[9px] font-semibold flex items-center gap-0.5 shrink-0 ${monthViewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthViewsGrowth >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {monthViewsGrowth > 0 ? '+' : ''}{monthViewsGrowth.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-full border-t border-mac-border/10 pt-2 z-10">
              <div className="flex justify-between text-[8px] font-bold text-mac-muted">
                <span className="text-pink-500">IG: {fmt(monthIgViews)} ({monthIgPct}%)</span>
                <span className="text-cyan-400">TT: {fmt(monthTtViews)} ({monthTtPct}%)</span>
              </div>
              <div className="h-1 w-full bg-mac-canvas border border-mac-border/30 rounded-full overflow-hidden flex">
                <div style={{ width: `${monthIgPct}%` }} className="h-full bg-pink-500" />
                <div style={{ width: `${monthTtPct}%` }} className="h-full bg-cyan-400" />
              </div>
            </div>
          </div>

          {/* Uploads Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'uploads' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Video size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Uploads</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{monthTotalUploads}</span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Video</span>
              </div>
            </div>
          </div>

          {/* Engagement Rate Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'engagement' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-teal-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Zap size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">Engagement</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">
                  {monthTotalViews > 0 ? ((monthTotalLikes + monthTotalComments) / monthTotalViews * 100).toFixed(2) : '0.00'}%
                </span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Rata-rata</span>
              </div>
            </div>
          </div>

          {/* FYP Hits Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'fyp' })}
            className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0 w-full"
          >
            <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-amber-500/10 blur-xl group-hover:scale-125 mac-transition" />
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 mac-transition shrink-0 z-10">
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-mac-muted uppercase tracking-wider">FYP Hits</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-mac-text whitespace-nowrap">{monthFypCount}</span>
                <span className="text-[8px] sm:text-[9px] text-mac-muted font-medium">Views &gt; 20K</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Vertical Cards for Individual Platforms
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
        {/* Month Impressions Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'views' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Views</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 mac-transition shrink-0">
              <Eye size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(monthTotalViews)}</span>
            {monthViewsGrowth !== 0 ? (
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 shrink-0 text-green-500">
                <TrendingUp size={10} />+{monthViewsGrowth.toFixed(0)}% vs LM
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-mac-muted font-medium invisible">—</span>
            )}
          </div>
        </div>

        {/* Total Likes Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'engagement' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-red-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Likes</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 mac-transition shrink-0">
              <Heart size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{fmt(monthTotalLikes)}</span>
            {monthLikesGrowth !== 0 ? (
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 shrink-0 text-green-500">
                <TrendingUp size={10} />+{monthLikesGrowth.toFixed(0)}% vs LM
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-mac-muted font-medium invisible">—</span>
            )}
          </div>
        </div>

        {/* Uploads Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'uploads' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Uploads</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 mac-transition shrink-0">
              <Video size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{monthTotalUploads}</span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Video</span>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'engagement' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-teal-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">Engagement</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 group-hover:scale-110 mac-transition shrink-0">
              <Zap size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">
              {monthTotalViews > 0 ? ((monthTotalLikes + monthTotalComments) / monthTotalViews * 100).toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Rata-rata</span>
          </div>
        </div>

        {/* FYP Hits Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'fyp' })}
          className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md hover:border-mac-border/60 cursor-pointer active:scale-[0.99] hover:scale-[1.01] hover:bg-mac-panel/60 mac-transition group relative overflow-hidden min-w-0"
        >
          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-amber-500/10 blur-xl group-hover:scale-125 mac-transition" />
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-mac-muted uppercase tracking-wider">FYP Hits</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 mac-transition shrink-0">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-mac-text whitespace-nowrap">{monthFypCount}</span>
            <span className="text-[10px] sm:text-[11px] text-mac-muted mt-0.5 font-medium">Views &gt; 20K</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedChartPopup = () => {
    if (!expandedChart) return null;

    let title = '';
    let chartData: any[] = [];
    let chartElement: React.ReactNode = null;
    let showMonthSelector = false;

    if (expandedChart === 'monthly-combined') {
      title = `Gabungan - Tren Tayangan Bulanan ${selectedYear}`;
      chartData = momChartData;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38383A' : '#E5E5E5'} vertical={false} />
          <XAxis dataKey="shortName" tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [fmtFull(value), name === 'views' ? 'Gabungan' : name === 'igViews' ? 'Instagram' : name === 'ttViews' ? 'TikTok' : name]} />
          <Line type="monotone" dataKey="views" name="Gabungan" stroke={isDarkMode ? "#0A84FF" : "#007AFF"} strokeWidth={4} dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="igViews" name="igViews" stroke="#FF2D55" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: "#FF2D55", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="ttViews" name="ttViews" stroke="#00E5FF" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: "#00E5FF", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'monthly-platform') {
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Tren Tayangan Bulanan ${selectedYear}`;
      chartData = momChartData;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38383A' : '#E5E5E5'} vertical={false} />
          <XAxis dataKey="shortName" tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} />
          <Line type="monotone" dataKey="views" stroke={isDarkMode ? "#0A84FF" : "#007AFF"} strokeWidth={3} dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'daily') {
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Tren Tayangan Harian - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
      chartData = dailyChartData;
      showMonthSelector = true;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38383A' : '#E5E5E5'} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} labelFormatter={(label) => `Day ${label}`} />
          <Line type="monotone" dataKey="views" stroke={isDarkMode ? "#0A84FF" : "#007AFF"} strokeWidth={3} dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'cycle') {
      const activeWeekLabel = activeWeekRange ? activeWeekRange.label : '';
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Cycle Chart (${activeWeekLabel}) - ${selectedYear}`;
      chartData = cycleChartData;
      showMonthSelector = true;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38383A' : '#E5E5E5'} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} />
          <Line type="monotone" dataKey="views" stroke={isDarkMode ? "#0A84FF" : "#007AFF"} strokeWidth={3} dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    }

    return (
      <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-mac-panel border border-mac-border shadow-mac-popover w-full max-w-4xl overflow-hidden mac-spring-popup rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-mac-border/50 bg-mac-sidebar">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-mac-text">{title}</h2>
            </div>
            
            {/* Interactive Selectors inside Popup */}
            <div className="flex items-center gap-3">
              {expandedChart === 'cycle' ? (
                <>
                  <MacDropdown
                    value={selectedMonth}
                    onChange={onSelectMonth}
                    options={monthOptions}
                  />
                  <MacDropdown
                    value={safeWeekIndex}
                    onChange={setSelectedCycleWeek}
                    options={weekOptions}
                  />
                </>
              ) : (
                <>
                  {showMonthSelector && (
                    <MacDropdown
                      value={selectedMonth}
                      onChange={onSelectMonth}
                      options={monthOptions}
                    />
                  )}
                  <MacDropdown
                    value={selectedYear}
                    onChange={onSelectYear}
                    options={yearOptions}
                  />
                </>
              )}
              <button 
                type="button" 
                onClick={() => setExpandedChart(null)} 
                className="text-mac-muted hover:text-mac-text rounded-full p-1 mac-transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Expanded Chart Content */}
          <div className="p-6 bg-mac-canvas flex flex-col gap-4">
            <div className="h-[450px] w-full bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                {chartElement}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryCardDetailPopup = () => {
    if (!expandedCard) return null;

    const { period, metric } = expandedCard;
    let title = '';
    let description = '';
    let contentNode: React.ReactNode = null;

    const isYear = period === 'year';
    const activeLabel = isYear ? `${selectedYear}` : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

    // Helper to calculate content entry engagement rate
    const getEngagementRate = (item: ContentEntry) => {
      const metrics = getMetrics(item);
      if (metrics.views === 0) return 0;
      return ((metrics.likes + metrics.comments + metrics.saves + metrics.shares) / metrics.views) * 100;
    };

    if (metric === 'views') {
      title = `Detail Views - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Rincian statistik tayangan konten Anda pada periode ${activeLabel}.`;

      if (isYear) {
        // Table of 12 months in this year
        const monthlyStats = MONTH_NAMES.map((mName, mIdx) => {
          const mContents = folders[selectedYear]?.[mIdx] || [];
          const ig = mContents.reduce((sum, item) => sum + item.instagram.views, 0);
          const tt = mContents.reduce((sum, item) => sum + item.tiktok.views, 0);
          const total = activeView === 'instagram' ? ig : activeView === 'tiktok' ? tt : (ig + tt);
          return { mIdx, name: mName, ig, tt, total };
        });

        const bestMonth = [...monthlyStats].sort((a, b) => b.total - a.total)[0];

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.total > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <Crown size={16} className="text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-mac-text">
                  Bulan terbaik Anda adalah <strong className="text-blue-500">{bestMonth.name}</strong> dengan total <strong className="text-blue-500">{fmtFull(bestMonth.total)}</strong> tayangan.
                </span>
              </div>
            )}
            <div className="max-h-[350px] overflow-y-auto border border-mac-border/30 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                    <th className="px-4 py-2.5">Bulan</th>
                    {activeView !== 'tiktok' && <th className="px-4 py-2.5 text-right text-pink-500">Instagram</th>}
                    {activeView !== 'instagram' && <th className="px-4 py-2.5 text-right text-cyan-400">TikTok</th>}
                    <th className="px-4 py-2.5 text-right font-bold text-mac-text">Total Gabungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/20">
                  {monthlyStats.map((row) => (
                    <tr key={row.mIdx} className="hover:bg-mac-surface/40 mac-transition">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      {activeView !== 'tiktok' && <td className="px-4 py-2.5 text-right font-mono">{fmtFull(row.ig)}</td>}
                      {activeView !== 'instagram' && <td className="px-4 py-2.5 text-right font-mono">{fmtFull(row.tt)}</td>}
                      <td className="px-4 py-2.5 text-right font-bold font-mono">{fmtFull(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      } else {
        // Table of contents in this month, sorted by views descending
        const items = [...selectedMonthContents].sort((a, b) => getMetrics(b).views - getMetrics(a).views);

        contentNode = (
          <div className="flex flex-col gap-3">
            <div className="max-h-[380px] overflow-y-auto border border-mac-border/30 rounded-xl">
              {items.length === 0 ? (
                <p className="text-center py-8 text-mac-muted text-xs">Belum ada data konten di bulan ini.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                      <th className="px-4 py-2.5 w-12 text-center">Hari</th>
                      <th className="px-4 py-2.5">Judul Konten</th>
                      {activeView !== 'tiktok' && <th className="px-4 py-2.5 text-right text-pink-500">Instagram</th>}
                      {activeView !== 'instagram' && <th className="px-4 py-2.5 text-right text-cyan-400">TikTok</th>}
                      <th className="px-4 py-2.5 text-right font-bold text-mac-text">Total Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mac-border/20">
                    {items.map((item) => {
                      const totalViews = getMetrics(item).views;
                      return (
                        <tr key={item.id} className="hover:bg-mac-surface/40 mac-transition">
                          <td className="px-4 py-2.5 font-bold text-center text-mac-muted font-mono">{item.day}</td>
                          <td className="px-4 py-2.5 font-semibold text-mac-text truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </td>
                          {activeView !== 'tiktok' && <td className="px-4 py-2.5 text-right font-mono text-mac-text/80">{fmtFull(item.instagram.views)}</td>}
                          {activeView !== 'instagram' && <td className="px-4 py-2.5 text-right font-mono text-mac-text/80">{fmtFull(item.tiktok.views)}</td>}
                          <td className="px-4 py-2.5 text-right font-bold font-mono">{fmtFull(totalViews)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      }
    } else if (metric === 'uploads') {
      title = `Detail Unggahan - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Informasi kuantitas video yang dipublikasikan pada periode ${activeLabel}.`;

      if (isYear) {
        // Table of 12 months uploads in this year
        const monthlyStats = MONTH_NAMES.map((mName, mIdx) => {
          const mContents = folders[selectedYear]?.[mIdx] || [];
          return { mIdx, name: mName, count: mContents.length };
        });

        const bestMonth = [...monthlyStats].sort((a, b) => b.count - a.count)[0];

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.count > 0 && (
              <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <Video size={16} className="text-purple-500 shrink-0" />
                <span className="text-xs font-semibold text-mac-text">
                  Bulan paling produktif Anda adalah <strong className="text-purple-500">{bestMonth.name}</strong> dengan memposting <strong className="text-purple-500">{bestMonth.count}</strong> video.
                </span>
              </div>
            )}
            <div className="max-h-[350px] overflow-y-auto border border-mac-border/30 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                    <th className="px-4 py-2.5">Bulan</th>
                    <th className="px-4 py-2.5 text-right text-mac-text font-bold">Jumlah Unggahan (Video)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/20">
                  {monthlyStats.map((row) => (
                    <tr key={row.mIdx} className="hover:bg-mac-surface/40 mac-transition">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-purple-500">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      } else {
        // List of all uploads in the selected month
        contentNode = (
          <div className="flex flex-col gap-3">
            <div className="max-h-[380px] overflow-y-auto border border-mac-border/30 rounded-xl">
              {selectedMonthContents.length === 0 ? (
                <p className="text-center py-8 text-mac-muted text-xs">Belum ada konten diunggah di bulan ini.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                      <th className="px-4 py-2.5 w-12 text-center">Hari</th>
                      <th className="px-4 py-2.5">Judul Konten</th>
                      {activeView !== 'tiktok' && <th className="px-4 py-2.5 text-center text-pink-500">Instagram</th>}
                      {activeView !== 'instagram' && <th className="px-4 py-2.5 text-center text-cyan-400">TikTok</th>}
                      <th className="px-4 py-2.5 text-center">Status Konten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mac-border/20">
                    {selectedMonthContents.map((item) => {
                      const hasIG = item.instagram.views > 0;
                      const hasTT = item.tiktok.views > 0;
                      return (
                        <tr key={item.id} className="hover:bg-mac-surface/40 mac-transition">
                          <td className="px-4 py-2.5 font-bold text-center text-mac-muted font-mono">{item.day}</td>
                          <td className="px-4 py-2.5 font-semibold text-mac-text truncate max-w-[250px]" title={item.title}>
                            {item.title}
                          </td>
                          {activeView !== 'tiktok' && (
                            <td className="px-4 py-2.5 text-center">
                              {hasIG ? <span className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-medium">Aktif</span> : <span className="text-[10px] bg-mac-surface text-mac-muted px-2 py-0.5 rounded-full font-medium">—</span>}
                            </td>
                          )}
                          {activeView !== 'instagram' && (
                            <td className="px-4 py-2.5 text-center">
                              {hasTT ? <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-medium">Aktif</span> : <span className="text-[10px] bg-mac-surface text-mac-muted px-2 py-0.5 rounded-full font-medium">—</span>}
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-center font-bold text-green-500">
                            Terpublikasi
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      }
    } else if (metric === 'engagement') {
      title = `Detail Interaksi - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Analisis rasio keterlibatan pemirsa (Likes + Comments + Saves + Shares)/Views pada periode ${activeLabel}.`;

      if (isYear) {
        // Table of monthly engagement rates
        const monthlyStats = MONTH_NAMES.map((mName, mIdx) => {
          const mContents = folders[selectedYear]?.[mIdx] || [];
          const totalViews = mContents.reduce((sum, item) => sum + getMetrics(item).views, 0);
          const totalEngagement = mContents.reduce((sum, item) => {
            const metrics = getMetrics(item);
            return sum + (metrics.likes + metrics.comments + metrics.saves + metrics.shares);
          }, 0);
          const rate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
          return { mIdx, name: mName, totalViews, rate };
        });

        const bestMonth = [...monthlyStats].sort((a, b) => b.rate - a.rate)[0];

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.rate > 0 && (
              <div className="flex items-center gap-3 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                <Zap size={16} className="text-teal-500 shrink-0" />
                <span className="text-xs font-semibold text-mac-text">
                  Interaksi tertinggi dicapai pada bulan <strong className="text-teal-500">{bestMonth.name}</strong> dengan rasio interaksi rata-rata <strong className="text-teal-500">{bestMonth.rate.toFixed(2)}%</strong>.
                </span>
              </div>
            )}
            <div className="max-h-[350px] overflow-y-auto border border-mac-border/30 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                    <th className="px-4 py-2.5">Bulan</th>
                    <th className="px-4 py-2.5 text-right">Total Tayangan</th>
                    <th className="px-4 py-2.5 text-right text-mac-text font-bold">Rasio Interaksi (ER)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/20">
                  {monthlyStats.map((row) => (
                    <tr key={row.mIdx} className="hover:bg-mac-surface/40 mac-transition">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-mac-muted">{fmtFull(row.totalViews)}</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-teal-500">{row.rate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      } else {
        // List of all uploads in the selected month, sorted by ER descending
        const items = [...selectedMonthContents]
          .map(item => ({ ...item, rate: getEngagementRate(item) }))
          .sort((a, b) => b.rate - a.rate);

        contentNode = (
          <div className="flex flex-col gap-3">
            <div className="max-h-[380px] overflow-y-auto border border-mac-border/30 rounded-xl">
              {items.length === 0 ? (
                <p className="text-center py-8 text-mac-muted text-xs">Belum ada konten diunggah di bulan ini.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                      <th className="px-4 py-2.5 w-12 text-center">Hari</th>
                      <th className="px-4 py-2.5">Judul Konten</th>
                      <th className="px-4 py-2.5 text-right">Views</th>
                      <th className="px-4 py-2.5 text-right">Interaksi (L+C+S+S)</th>
                      <th className="px-4 py-2.5 text-right font-bold text-mac-text">Engagement Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mac-border/20">
                    {items.map((item) => {
                      const m = getMetrics(item);
                      const interaksi = m.likes + m.comments + m.saves + m.shares;
                      return (
                        <tr key={item.id} className="hover:bg-mac-surface/40 mac-transition">
                          <td className="px-4 py-2.5 font-bold text-center text-mac-muted font-mono">{item.day}</td>
                          <td className="px-4 py-2.5 font-semibold text-mac-text truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-mac-muted">{fmtFull(m.views)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-mac-muted">{fmtFull(interaksi)}</td>
                          <td className="px-4 py-2.5 text-right font-bold font-mono text-teal-500">{item.rate.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      }
    } else if (metric === 'fyp') {
      title = `Detail FYP Hits - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Daftar unggahan konten berkinerja tinggi yang melampaui ambang batas > 20.000 tayangan.`;

      // Gather matching contents
      let fypContents: ContentEntry[] = [];
      if (isYear) {
        fypContents = getYearContents(selectedYear).filter(item => getMetrics(item).views > 20000);
      } else {
        fypContents = selectedMonthContents.filter(item => getMetrics(item).views > 20000);
      }

      // Sort by views descending
      fypContents.sort((a, b) => getMetrics(b).views - getMetrics(a).views);

      contentNode = (
        <div className="flex flex-col gap-3">
          {fypContents.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-mac-text">
                Hebat! Ada <strong className="text-amber-500">{fypContents.length}</strong> konten yang sukses melampaui target FYP &gt; 20K.
              </span>
            </div>
          )}
          <div className="max-h-[350px] overflow-y-auto border border-mac-border/30 rounded-xl">
            {fypContents.length === 0 ? (
              <p className="text-center py-8 text-mac-muted text-xs">Belum ada konten yang menembus target FYP (&gt; 20K views) pada periode ini.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-mac-sidebar border-b border-mac-border/30 text-mac-muted font-bold">
                    <th className="px-4 py-2.5 w-16 text-center">{isYear ? 'Bulan/Tgl' : 'Hari'}</th>
                    <th className="px-4 py-2.5">Judul Konten</th>
                    <th className="px-4 py-2.5 text-right text-pink-500">Instagram</th>
                    <th className="px-4 py-2.5 text-right text-cyan-400">TikTok</th>
                    <th className="px-4 py-2.5 text-right font-bold text-mac-text">Total Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/20">
                  {fypContents.map((item) => {
                    const m = getMetrics(item);
                    let dateLabel = `${item.day}`;
                    if (isYear) {
                      // Find which month this entry belongs to
                      let itemMonthName = '';
                      for (let mIdx = 0; mIdx < 12; mIdx++) {
                        const mEntries = folders[selectedYear]?.[mIdx] || [];
                        if (mEntries.some(e => e.id === item.id)) {
                          itemMonthName = MONTH_NAMES[mIdx].substring(0, 3);
                          break;
                        }
                      }
                      dateLabel = `${itemMonthName} ${item.day}`;
                    }

                    return (
                      <tr key={item.id} className="hover:bg-mac-surface/40 mac-transition">
                        <td className="px-4 py-2.5 font-bold text-center text-mac-muted font-mono whitespace-nowrap">{dateLabel}</td>
                        <td className="px-4 py-2.5 font-semibold text-mac-text truncate max-w-[200px]" title={item.title}>
                          {item.title}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-mac-text/80">{fmtFull(item.instagram.views)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-mac-text/80">{fmtFull(item.tiktok.views)}</td>
                        <td className="px-4 py-2.5 text-right font-bold font-mono text-amber-500">{fmtFull(m.views)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-mac-panel border border-mac-border shadow-mac-popover w-full max-w-2xl overflow-hidden mac-spring-popup rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-mac-border/50 bg-mac-sidebar">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-mac-text">{title}</h2>
            </div>
            <button 
              type="button" 
              onClick={() => setExpandedCard(null)} 
              className="text-mac-muted hover:text-mac-text rounded-full p-1 mac-transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-4 text-sm bg-mac-canvas text-mac-text">
            <div>
              <p className="text-xs text-mac-muted">{description}</p>
            </div>
            {contentNode}
            <div className="flex justify-end mt-2 pt-3 border-t border-mac-border/30">
              <button 
                type="button" 
                onClick={() => setExpandedCard(null)} 
                className="px-5 py-1.5 rounded-full border border-mac-border bg-mac-surface hover:bg-mac-border/50 text-mac-text font-bold text-xs mac-transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-mac-canvas text-mac-text">

      {/* 1. Header Toolbar (macOS Style) */}
      <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center justify-end py-2 px-6 shrink-0 border-b border-mac-border/50">
        <div className="flex items-center gap-3">
          <MacDropdown
            value={selectedMonth}
            onChange={onSelectMonth}
            options={monthOptions}
          />
          <MacDropdown
            value={selectedYear}
            onChange={onSelectYear}
            options={yearOptions}
          />


          <button
            onClick={onToggleTheme}
            className="p-1 rounded bg-mac-surface hover:bg-mac-border/50 border border-mac-border text-mac-text mac-transition"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun size={14} className="text-mac-text" /> : <Moon size={14} className="text-mac-text" />}
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* Title Area */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-mac-text">
              {activeView === 'instagram' ? 'Instagram' : activeView === 'tiktok' ? 'TikTok' : 'Dashboard'}
            </h1>
            <p className="text-sm text-mac-muted mt-1">
              Performance overview for {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
          {activeView !== 'dashboard' && (
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight">{fmtFull(currentFollowers)}</span>
              <span className="text-xs text-mac-muted uppercase block">Followers</span>
            </div>
          )}
        </div>

        {/* SECTION: PREMIUM GLASSMORPHIC STAT CARDS GRID (Top full-width rows for All Views) */}
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mac-border/50 pb-2 mb-4">
            <h3 className="text-[11px] font-bold text-mac-muted uppercase tracking-wider select-none">
              {summaryPeriod === 'month' ? `Ringkasan Performa ${MONTH_NAMES[selectedMonth]} ${selectedYear}` : `Ringkasan Performa Tahunan ${selectedYear}`}
            </h3>
            <div className="flex bg-mac-surface border border-mac-border/80 rounded-full p-0.5 shadow-sm self-start sm:self-auto select-none">
              <button
                type="button"
                onClick={() => setSummaryPeriod('month')}
                className={`px-3.5 py-1 text-[10px] font-bold rounded-full mac-transition cursor-pointer ${
                  summaryPeriod === 'month' 
                    ? 'bg-mac-text text-mac-canvas shadow-sm font-bold' 
                    : 'text-mac-text hover:bg-mac-border/30'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setSummaryPeriod('year')}
                className={`px-3.5 py-1 text-[10px] font-bold rounded-full mac-transition cursor-pointer ${
                  summaryPeriod === 'year' 
                    ? 'bg-mac-text text-mac-canvas shadow-sm font-bold' 
                    : 'text-mac-text hover:bg-mac-border/30'
                }`}
              >
                Tahunan
              </button>
            </div>
          </div>
          <div>
            {summaryPeriod === 'month' 
              ? renderMonthSummaryCards(activeView === 'dashboard') 
              : renderYearSummaryCards(activeView === 'dashboard')
            }
          </div>
        </div>

        {/* SECTION: DASHBOARD MAIN LAYOUT (Lower half layout for Dashboard Only) */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* === LEFT COLUMN === */}
            <div className="flex flex-col gap-6 lg:border-r border-mac-border/30 lg:pr-8">
              {/* Top Performing Content Leaderboard */}
              <div>
                <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider mb-3 border-b border-mac-border/50 pb-1.5">
                  Top Performing Content - {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h3>
                {bestContents.length === 0 ? (
                  <p className="text-sm text-mac-muted py-2">No content available for this month.</p>
                ) : (
                  <div className="flex flex-col">
                    {bestContents.map((content, idx) => {
                      const igViews = content.instagram.views;
                      const ttViews = content.tiktok.views;
                      const totalViews = igViews + ttViews;
                      const igPct = totalViews > 0 ? Math.round((igViews / totalViews) * 100) : 0;
                      const ttPct = totalViews > 0 ? (100 - igPct) : 0;

                      const isFirst = idx === 0;

                      return (
                        <div 
                          key={content.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border mb-3 mac-transition select-none hover:-translate-y-0.5 cursor-default ${
                            isFirst 
                              ? 'bg-gradient-to-r from-amber-500/5 to-mac-panel/50 border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.08)]' 
                              : 'bg-mac-panel/30 border-mac-border/20 hover:border-mac-border/50 hover:bg-mac-panel/50'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Rank Badge */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs shadow-sm shrink-0 border ${
                              isFirst 
                                ? 'bg-amber-500 text-white border-amber-400' 
                                : 'bg-mac-surface text-mac-text border-mac-border'
                            }`}>
                              {idx + 1}
                            </div>
                            
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold truncate ${isFirst ? 'text-amber-500 font-bold' : 'text-mac-text'}`}>
                                  {content.title}
                                </span>
                                {isFirst && <Crown size={14} className="text-amber-500 shrink-0" />}
                              </div>

                              <span className="text-[10px] text-mac-muted flex items-center gap-1.5 mt-1 font-medium">
                                <InstagramIcon size={10} /><TikTokIcon size={10} />
                                Mirrored • Day {content.day}
                              </span>

                              {/* Leaderboard Views Ratio Progress Bar */}
                              <div className="flex flex-col gap-1.5 mt-2.5 max-w-xs">
                                <div className="h-1 w-full bg-mac-canvas border border-mac-border/30 rounded-full overflow-hidden flex">
                                  <div style={{ width: `${igPct}%` }} className="h-full bg-pink-500" />
                                  <div style={{ width: `${ttPct}%` }} className="h-full bg-cyan-400" />
                                </div>
                                <div className="flex justify-between text-[8px] text-mac-muted font-bold tracking-wider">
                                  <span className="text-pink-500 uppercase">IG: {fmt(igViews)} ({igPct}%)</span>
                                  <span className="text-cyan-400 uppercase">TT: {fmt(ttViews)} ({ttPct}%)</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 self-end sm:self-center shrink-0 border-t border-mac-border/10 sm:border-0 pt-2 sm:pt-0">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-mac-text">{fmtFull(getMetrics(content).views)}</span>
                              <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                                <Eye size={10} className="text-blue-500" /> Views
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-mac-text">{fmtFull(getMetrics(content).likes)}</span>
                              <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                                <Heart size={10} className="text-red-500" /> Likes
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* === RIGHT COLUMN === */}
            <div className="flex flex-col gap-6">
              
              {/* Chart */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-mac-border/50 pb-1.5">
                  <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider">
                    Monthly Views Trend
                  </h3>
                  <button
                    onClick={() => setExpandedChart('monthly-combined')}
                    className="p-1 rounded hover:bg-mac-surface text-mac-muted hover:text-mac-text mac-transition"
                    title="Perbesar Grafik"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
                <div className="h-48 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={momChartData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? '#38383A' : '#E5E5E5'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                        axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }}
                        tickLine={false}
                      />
                      <YAxis
                        width={50}
                        tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => fmt(v)}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(value: any, name: any) => [fmtFull(value), name === 'views' ? 'Gabungan' : name === 'igViews' ? 'Instagram' : name === 'ttViews' ? 'TikTok' : name]}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        name="Gabungan"
                        stroke={isDarkMode ? "#0A84FF" : "#007AFF"}
                        strokeWidth={3}
                        dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="igViews"
                        name="igViews"
                        stroke="#FF2D55"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={{ fill: "#FF2D55", strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ttViews"
                        name="ttViews"
                        stroke="#00E5FF"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={{ fill: "#00E5FF", strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider mb-3 border-b border-mac-border/50 pb-1.5">
                  Upload Activity - {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h3>
                <CalendarWidget
                  year={selectedYear}
                  monthIndex={selectedMonth}
                  activeMonthData={folders[selectedYear]?.[selectedMonth] || []}
                />
              </div>

            </div>
          </div>
        )}

        {/* SECTION: CHARTS AND MIXED LAYOUT (Individual Accounts Only) */}
        {activeView !== 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Monthly Views Trend */}
            <div className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-mac-border/50 pb-1.5">
                <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider">
                  Monthly Views Trend
                </h3>
                <button
                  onClick={() => setExpandedChart('monthly-platform')}
                  className="p-1 rounded hover:bg-mac-surface text-mac-muted hover:text-mac-text mac-transition"
                  title="Perbesar Grafik"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={momChartData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#38383A' : '#E5E5E5'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={50}
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: any) => [fmtFull(v), 'Views']}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={isDarkMode ? "#0A84FF" : "#007AFF"}
                      strokeWidth={2}
                      dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Views Trend */}
            <div className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-mac-border/50 pb-1.5">
                <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider">
                  Daily Views Trend
                </h3>
                <button
                  onClick={() => setExpandedChart('daily')}
                  className="p-1 rounded hover:bg-mac-surface text-mac-muted hover:text-mac-text mac-transition"
                  title="Perbesar Grafik"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyChartData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#38383A' : '#E5E5E5'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={50}
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: any) => [fmtFull(v), 'Views']}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={isDarkMode ? "#0A84FF" : "#007AFF"}
                      strokeWidth={2}
                      dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Cycle Trend */}
            <div className="bg-mac-panel/40 backdrop-blur-md border border-mac-border/30 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-mac-border/50 pb-1.5 gap-2">
                <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider shrink-0">
                  Weekly Cycle
                </h3>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MacDropdown
                    value={safeWeekIndex}
                    onChange={setSelectedCycleWeek}
                    options={weekOptions}
                    className="text-[10px] py-0.5 px-1.5 max-w-[140px]"
                  />
                  <button
                    onClick={() => setExpandedChart('cycle')}
                    className="p-1 rounded hover:bg-mac-surface text-mac-muted hover:text-mac-text mac-transition shrink-0"
                    title="Perbesar Grafik"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cycleChartData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? '#38383A' : '#E5E5E5'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#38383A' : '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={50}
                      tick={{ fill: isDarkMode ? '#98989D' : '#8A8A8E', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: any) => [fmtFull(v), 'Views']}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={isDarkMode ? "#0A84FF" : "#007AFF"}
                      strokeWidth={2}
                      dot={{ fill: isDarkMode ? "#0A84FF" : "#007AFF", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: TOP CONTENT LIST (For individual accounts, displayed below the charts) */}
        {activeView !== 'dashboard' && (
          <div className="mt-6">
            <h3 className="text-[11px] font-semibold text-mac-muted uppercase tracking-wider mb-3 border-b border-mac-border/50 pb-1.5">
              Top Performing Content - {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            {bestContents.length === 0 ? (
              <p className="text-sm text-mac-muted py-2">No content available for this month.</p>
            ) : (
              <div className="flex flex-col">
                {bestContents.map((content, idx) => {
                  const metrics = getMetrics(content);
                  const isFirst = idx === 0;

                  return (
                    <div 
                      key={content.id} 
                      className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border mb-3 mac-transition select-none hover:-translate-y-0.5 cursor-default ${
                        isFirst 
                          ? 'bg-gradient-to-r from-amber-500/5 to-mac-panel/50 border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.08)]' 
                          : 'bg-mac-panel/30 border-mac-border/20 hover:border-mac-border/50 hover:bg-mac-panel/50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs shadow-sm shrink-0 border ${
                          isFirst 
                            ? 'bg-amber-500 text-white border-amber-400' 
                            : 'bg-mac-surface text-mac-text border-mac-border'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold truncate ${isFirst ? 'text-amber-500 font-bold' : 'text-mac-text'}`}>
                              {content.title}
                            </span>
                            {isFirst && <Crown size={14} className="text-amber-500 shrink-0" />}
                          </div>

                          <span className="text-[10px] text-mac-muted flex items-center gap-1.5 mt-1 font-medium">
                            {activeView === 'instagram' && <InstagramIcon size={10} className="text-pink-500" />}
                            {activeView === 'tiktok' && <TikTokIcon size={10} className="text-cyan-400" />}
                            <span className="capitalize">{activeView}</span> • Day {content.day}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end shrink-0 border-t border-mac-border/10 lg:border-0 pt-2 lg:pt-0">
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-sm font-bold text-mac-text">{fmtFull(metrics.views)}</span>
                          <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                            <Eye size={10} className="text-blue-500" /> Views
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-sm font-bold text-mac-text">{fmtFull(metrics.likes)}</span>
                          <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                            <Heart size={10} className="text-red-500" /> Likes
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-sm font-bold text-mac-text">{fmtFull(metrics.comments)}</span>
                          <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                            <MessageCircle size={10} className="text-green-500" /> Comments
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-sm font-bold text-mac-text">{fmtFull(metrics.saves)}</span>
                          <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                            <Bookmark size={10} className="text-amber-500" /> Saves
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-sm font-bold text-mac-text">{fmtFull(metrics.shares)}</span>
                          <span className="text-[9px] text-mac-muted uppercase font-semibold flex items-center gap-1 mt-0.5">
                            <Share2 size={10} className="text-purple-500" /> Shares
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
      {renderExpandedChartPopup()}
      {renderSummaryCardDetailPopup()}
    </div>
  );
};
