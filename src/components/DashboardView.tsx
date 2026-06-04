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
  Sparkles,
  Zap,
  Video,
  Crown,
  Maximize2,
  X
} from 'lucide-react';
import { FolderDataState, PlatformProfiles, ContentEntry } from '../types';
import { MONTH_NAMES, getDaysInMonth } from '../utils/initialState';
import { MacDropdown } from './MacDropdown';

const InstagramIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23-.7.17-1.42.27-2.14.3-1.02.02-2.03-.02-3.05.03v5.11c-.05 1.76-1.05 3.39-2.61 4.19-1.92.93-4.39.52-5.88-1-.07-.07-.15-.15-.22-.22-1.5-1.78-1.52-4.49-.07-6.3 1.25-1.59 3.39-2.31 5.41-1.85V.22a7.99 7.99 0 0 0-5.89 2.56c-2.91 3.2-2.73 8.22.42 11.21 2.97 2.8 7.69 2.76 10.6-.08 1.48-1.4 2.27-3.37 2.22-5.44V5.41c1.21.82 2.64 1.34 4.13 1.45V2.95a5.955 5.955 0 0 1-3.69-2.48c-.41-.59-.72-1.24-.91-1.92-.88.02-1.76.01-2.65.02v1.45z" />
  </svg>
);

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
          <div key={d} className="text-[9px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-[color:var(--md-sys-color-outline-variant)] rounded-xl overflow-hidden bg-[color:var(--md-sys-color-background)]">
        {totalSlots.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="h-10 border-r border-b border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-background)]" />;
          }
          const hasContent = daysWithContent.has(day);
          return (
            <div
              key={day}
              className="h-10 flex flex-col items-center justify-center border-r border-b border-[color:var(--md-sys-color-outline-variant)] text-[11px] hover:bg-[color:var(--md-sys-color-surface-container-high)] transition-colors duration-150 relative cursor-pointer"
            >
              <div className={`w-7 h-7 flex flex-col items-center justify-center rounded-full text-xs font-semibold ${
                hasContent ? 'bg-[#0064e0] text-white font-bold' : 'text-[color:var(--md-sys-color-on-surface)]'
              }`}>
                {day}
              </div>
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

  const getThemeClasses = () => {
    switch (activeView) {
      case 'instagram':
        return {
          iconBg: 'bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)]',
          hoverBorder: 'hover:border-[color:var(--md-sys-color-error)]',
        };
      case 'tiktok':
        return {
          iconBg: 'bg-[color:var(--md-sys-color-cyan-container)] text-[color:var(--md-sys-color-on-cyan-container)]',
          hoverBorder: 'hover:border-[color:var(--md-sys-color-cyan)]',
        };
      case 'dashboard':
      default:
        return {
          iconBg: 'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]',
          hoverBorder: 'hover:border-[color:var(--md-sys-color-primary)]',
        };
    }
  };

  const chartColors = {
    blue: isDarkMode ? '#aecbfa' : '#1a73e8',
    red: isDarkMode ? '#f28b82' : '#ea4335',
    cyan: isDarkMode ? '#80deea' : '#00acc1',
    green: isDarkMode ? '#a8dab5' : '#34a853',
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? '#303134' : '#ffffff',
      border: `1px solid ${isDarkMode ? '#3c4043' : '#dadce0'}`,
      borderRadius: '8px',
      color: isDarkMode ? '#e8eaed' : '#202124',
      fontSize: '11px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    labelStyle: {
      color: isDarkMode ? '#9aa0a6' : '#5f6368',
      fontWeight: 600
    },
  };

  const renderYearSummaryCards = (isDashboard: boolean) => {
    const { iconBg, hoverBorder } = getThemeClasses();

    if (isDashboard) {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Impressions Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'views' })}
            className={`stat-card p-5 flex flex-col justify-between gap-3 w-full group ${hoverBorder}`}
          >
            <div className="flex items-center gap-3 z-10 min-w-0 w-full">
              <div className={`p-2 rounded-full ${iconBg} shrink-0`}>
                <Eye size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Views</span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(yearTotalViews)}</span>
                  {yearViewsGrowth !== 0 && (
                    <span className={`text-[9px] font-bold flex items-center gap-0.5 shrink-0 ${yearViewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {yearViewsGrowth >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {yearViewsGrowth > 0 ? '+' : ''}{yearViewsGrowth.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-full border-t border-[color:var(--md-sys-color-outline-variant)] pt-2 z-10">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)]">
                <span>IG: {fmt(yearIgViews)} ({yearIgPct}%)</span>
                <span>TT: {fmt(yearTtViews)} ({yearTtPct}%)</span>
              </div>
              <div className="h-1.5 w-full bg-[color:var(--md-sys-color-surface-variant)] rounded-full overflow-hidden flex">
                <div style={{ width: `${yearIgPct}%` }} className="h-full bg-[#ea4335]" />
                <div style={{ width: `${yearTtPct}%` }} className="h-full bg-[#00acc1]" />
              </div>
            </div>
          </div>

          {/* Uploads Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'uploads' })}
            className={`stat-card p-5 flex items-center gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Video size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Uploads</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{yearTotalUploads}</span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Videos</span>
              </div>
            </div>
          </div>

          {/* Engagement Rate Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'engagement' })}
            className={`stat-card p-5 items-center flex gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Zap size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Engagement</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">
                  {yearTotalViews > 0 ? ((yearTotalLikes + yearTotalComments) / yearTotalViews * 100).toFixed(2) : '0.00'}%
                </span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Avg</span>
              </div>
            </div>
          </div>

          {/* FYP Hits Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'year', metric: 'fyp' })}
            className={`stat-card p-5 items-center flex gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">FYP Hits</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{yearFypCount}</span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">&gt; 20K Views</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Vertical Cards for Individual Platforms
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
        {/* Views */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'views' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Views</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Eye size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(yearTotalViews)}</span>
            {yearViewsGrowth !== 0 ? (
              <span className="text-[9px] font-bold flex items-center gap-1 shrink-0 text-green-500 font-sans">
                <TrendingUp size={10} />+{yearViewsGrowth.toFixed(0)}% vs LY
              </span>
            ) : (
              <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] invisible font-sans">—</span>
            )}
          </div>
        </div>

        {/* Likes */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'fyp' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 group ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Likes</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Heart size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(yearTotalLikes)}</span>
            {yearLikesGrowth !== 0 ? (
              <span className="text-[9px] font-bold flex items-center gap-1 shrink-0 text-green-500 font-sans">
                <TrendingUp size={10} />+{yearLikesGrowth.toFixed(0)}% vs LY
              </span>
            ) : (
              <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] invisible font-sans">—</span>
            )}
          </div>
        </div>

        {/* Uploads */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'uploads' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Uploads</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Video size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{yearTotalUploads}</span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Videos</span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'engagement' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Engagement</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Zap size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">
              {yearTotalViews > 0 ? ((yearTotalLikes + yearTotalComments) / yearTotalViews * 100).toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Avg</span>
          </div>
        </div>

        {/* FYP Hits */}
        <div 
          onClick={() => setExpandedCard({ period: 'year', metric: 'fyp' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 group ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">FYP Hits</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Sparkles size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{yearFypCount}</span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">&gt; 20K Views</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthSummaryCards = (isDashboard: boolean) => {
    const { iconBg, hoverBorder } = getThemeClasses();

    if (isDashboard) {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Month Impressions Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'views' })}
            className={`stat-card p-5 flex flex-col justify-between gap-3 w-full group ${hoverBorder}`}
          >
            <div className="flex items-center gap-3 z-10 min-w-0 w-full">
              <div className={`p-2 rounded-full ${iconBg} shrink-0`}>
                <Eye size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Views</span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(monthTotalViews)}</span>
                  {monthViewsGrowth !== 0 && (
                    <span className={`text-[9px] font-bold flex items-center gap-0.5 shrink-0 ${monthViewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthViewsGrowth >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {monthViewsGrowth > 0 ? '+' : ''}{monthViewsGrowth.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-full border-t border-[color:var(--md-sys-color-outline-variant)] pt-2 z-10">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)]">
                <span className="text-[color:var(--md-sys-color-error)]">IG: {fmt(monthIgViews)} ({monthIgPct}%)</span>
                <span className="text-[#00acc1]">TT: {fmt(monthTtViews)} ({monthTtPct}%)</span>
              </div>
              <div className="h-1.5 w-full bg-[color:var(--md-sys-color-surface-variant)] rounded-full overflow-hidden flex">
                <div style={{ width: `${monthIgPct}%` }} className="h-full bg-[#ea4335]" />
                <div style={{ width: `${monthTtPct}%` }} className="h-full bg-[#00acc1]" />
              </div>
            </div>
          </div>

          {/* Uploads Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'uploads' })}
            className={`stat-card p-5 items-center flex gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Video size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Uploads</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{monthTotalUploads}</span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Videos</span>
              </div>
            </div>
          </div>

          {/* Engagement Rate Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'engagement' })}
            className={`stat-card p-5 items-center flex gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Zap size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Engagement</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">
                  {monthTotalViews > 0 ? ((monthTotalLikes + monthTotalComments) / monthTotalViews * 100).toFixed(2) : '0.00'}%
                </span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Avg</span>
              </div>
            </div>
          </div>

          {/* FYP Hits Card */}
          <div 
            onClick={() => setExpandedCard({ period: 'month', metric: 'fyp' })}
            className={`stat-card p-5 items-center flex gap-3 w-full group ${hoverBorder}`}
          >
            <div className={`p-2 rounded-full ${iconBg} shrink-0 z-10`}>
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">FYP Hits</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{monthFypCount}</span>
                <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">&gt; 20K Views</span>
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
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Views</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Eye size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(monthTotalViews)}</span>
            {monthViewsGrowth !== 0 ? (
              <span className="text-[9px] font-bold flex items-center gap-1 shrink-0 text-green-500 font-sans">
                <TrendingUp size={10} />+{monthViewsGrowth.toFixed(0)}% vs LM
              </span>
            ) : (
              <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] invisible font-sans">—</span>
            )}
          </div>
        </div>

        {/* Total Likes Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'fyp' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 group ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Likes</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Heart size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{fmt(monthTotalLikes)}</span>
            {monthLikesGrowth !== 0 ? (
              <span className="text-[9px] font-bold flex items-center gap-1 shrink-0 text-green-500 font-sans">
                <TrendingUp size={10} />+{monthLikesGrowth.toFixed(0)}% vs LM
              </span>
            ) : (
              <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] invisible font-sans">—</span>
            )}
          </div>
        </div>

        {/* Uploads Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'uploads' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Uploads</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Video size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{monthTotalUploads}</span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Videos</span>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'engagement' })}
          className={`stat-card p-5 flex flex-col justify-between gap-3 ${hoverBorder}`}
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Engagement</span>
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <Zap size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">
              {monthTotalViews > 0 ? ((monthTotalLikes + monthTotalComments) / monthTotalViews * 100).toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">Avg</span>
          </div>
        </div>

        {/* FYP Hits Card */}
        <div 
          onClick={() => setExpandedCard({ period: 'month', metric: 'fyp' })}
          className="stat-card p-5 flex flex-col justify-between gap-3 group"
        >
          <div className="flex items-center justify-between z-10 gap-2">
            <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">FYP Hits</span>
            <div className="p-1.5 rounded-full bg-[#f2a918]/10 text-[#f2a918] shrink-0">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 z-10">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--md-sys-color-on-surface)]">{monthFypCount}</span>
            <span className="text-[10px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-sans">&gt; 20K Views</span>
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
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#3c4043' : '#dadce0'} vertical={false} />
          <XAxis dataKey="shortName" tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [fmtFull(value), name === 'views' ? 'Gabungan' : name === 'igViews' ? 'Instagram' : name === 'ttViews' ? 'TikTok' : name]} />
          <Line type="monotone" dataKey="views" name="Gabungan" stroke={chartColors.blue} strokeWidth={4} dot={{ fill: chartColors.blue, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="igViews" name="igViews" stroke={chartColors.red} strokeWidth={2} strokeDasharray="4 4" dot={{ fill: chartColors.red, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="ttViews" name="ttViews" stroke={chartColors.cyan} strokeWidth={2} strokeDasharray="4 4" dot={{ fill: chartColors.cyan, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'monthly-platform') {
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Tren Tayangan Bulanan ${selectedYear}`;
      chartData = momChartData;
      const strokeColor = activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#3c4043' : '#dadce0'} vertical={false} />
          <XAxis dataKey="shortName" tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} />
          <Line type="monotone" dataKey="views" stroke={strokeColor} strokeWidth={3} dot={{ fill: strokeColor, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'daily') {
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Tren Tayangan Harian - ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
      chartData = dailyChartData;
      showMonthSelector = true;
      const strokeColor = activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#3c4043' : '#dadce0'} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} labelFormatter={(label) => `Day ${label}`} />
          <Line type="monotone" dataKey="views" stroke={strokeColor} strokeWidth={3} dot={{ fill: strokeColor, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    } else if (expandedChart === 'cycle') {
      const activeWeekLabel = activeWeekRange ? activeWeekRange.label : '';
      title = `${activeView === 'instagram' ? 'Instagram' : 'TikTok'} - Cycle Chart (${activeWeekLabel}) - ${selectedYear}`;
      chartData = cycleChartData;
      showMonthSelector = true;
      const strokeColor = activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.green;
      chartElement = (
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#3c4043' : '#dadce0'} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }} tickLine={false} />
          <YAxis width={60} tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} />
          <Line type="monotone" dataKey="views" stroke={strokeColor} strokeWidth={3} dot={{ fill: strokeColor, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      );
    }

    return (
      <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 md-backdrop-enter">
        <div className="bg-[color:var(--md-sys-color-surface)] border border-[color:var(--md-sys-color-outline-variant)] w-full max-w-4xl overflow-hidden rounded-3xl shadow-[var(--md-elevation-3)] md-dialog-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[color:var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <h2 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">{title}</h2>
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
                className="md-icon-btn"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Expanded Chart Content */}
          <div className="p-6 bg-[color:var(--md-sys-color-surface)] flex flex-col gap-4">
            <div className="h-[450px] w-full bg-[color:var(--md-sys-color-background)] border border-[color:var(--md-sys-color-outline-variant)] rounded-lg p-4">
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
        // List of 12 months in this year
        const monthlyStats = MONTH_NAMES.map((mName, mIdx) => {
          const mContents = folders[selectedYear]?.[mIdx] || [];
          const ig = mContents.reduce((sum, item) => sum + item.instagram.views, 0);
          const tt = mContents.reduce((sum, item) => sum + item.tiktok.views, 0);
          const total = activeView === 'instagram' ? ig : activeView === 'tiktok' ? tt : (ig + tt);
          return { mIdx, name: mName, ig, tt, total };
        });

        const bestMonth = [...monthlyStats].sort((a, b) => b.total - a.total)[0];
        const maxTotal = monthlyStats.length > 0 ? Math.max(...monthlyStats.map(row => row.total)) : 1;

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.total > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-[color:var(--md-sys-color-primary-container)]/30 border border-[color:var(--md-sys-color-primary-container)]/50 rounded-2xl">
                <Crown size={16} className="text-[color:var(--md-sys-color-primary)] shrink-0" />
                <span className="text-xs font-medium text-[color:var(--md-sys-color-on-surface)]">
                  Bulan terbaik Anda adalah <strong className="text-[color:var(--md-sys-color-primary)] font-semibold">{bestMonth.name}</strong> dengan total <strong className="text-[color:var(--md-sys-color-primary)] font-semibold">{fmtFull(bestMonth.total)}</strong> tayangan.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Bulan</span>
                <span>Views / Distribusi</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {monthlyStats.map((row) => {
                  const percent = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
                  const totalSum = (row.ig + row.tt) || 1;
                  const igPercent = (row.ig / totalSum) * 100;
                  const ttPercent = (row.tt / totalSum) * 100;
                  return (
                    <div 
                      key={row.mIdx} 
                      className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)]">{row.name}</span>
                        <div className="flex items-center gap-3 text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                          {activeView !== 'tiktok' && (
                            <span className="flex items-center gap-1">
                              <InstagramIcon size={12} className="text-red-500" />
                              <strong className="font-mono font-medium">{fmtFull(row.ig)}</strong>
                            </span>
                          )}
                          {activeView !== 'instagram' && (
                            <span className="flex items-center gap-1">
                              <TikTokIcon size={11} className="text-[#00acc1]" />
                              <strong className="font-mono font-medium">{fmtFull(row.tt)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-4">
                        <span className="font-bold text-sm text-[color:var(--md-sys-color-on-surface)] font-mono">{fmtFull(row.total)}</span>
                        <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5 flex">
                          {activeView === 'dashboard' ? (
                            row.total > 0 ? (
                              <>
                                <div className="h-full bg-red-500" style={{ width: `${igPercent}%` }} />
                                <div className="h-full bg-[#00acc1]" style={{ width: `${ttPercent}%` }} />
                              </>
                            ) : (
                              <div className="h-full bg-[color:var(--md-sys-color-surface-container-highest)] w-full" />
                            )
                          ) : (
                            <div 
                              className={`h-full ${activeView === 'instagram' ? 'bg-red-500' : 'bg-[#00acc1]'}`} 
                              style={{ width: `${percent}%` }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      } else {
        // List of contents in this month, sorted by views descending
        const items = [...selectedMonthContents].sort((a, b) => getMetrics(b).views - getMetrics(a).views);
        const maxViews = items.length > 0 ? Math.max(...items.map(item => getMetrics(item).views)) : 1;

        contentNode = (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Konten</span>
                <span>Views / Distribusi</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-center py-10 text-[color:var(--md-sys-color-on-surface-variant)] text-xs">Belum ada data konten di bulan ini.</p>
                ) : (
                  items.map((item) => {
                    const totalViews = getMetrics(item).views;
                    const percent = maxViews > 0 ? (totalViews / maxViews) * 100 : 0;
                    const igViews = item.instagram.views;
                    const ttViews = item.tiktok.views;
                    const rowSum = (igViews + ttViews) || 1;
                    const igPercent = (igViews / rowSum) * 100;
                    const ttPercent = (ttViews / rowSum) * 100;
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[color:var(--md-sys-color-on-surface-variant)] font-mono">{item.day}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)] truncate max-w-[280px]" title={item.title}>
                              {item.title}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                              {activeView !== 'tiktok' && (
                                <span className="flex items-center gap-1">
                                  <InstagramIcon size={12} className="text-red-500" />
                                  <strong className="font-mono font-medium">{fmtFull(igViews)}</strong>
                                </span>
                              )}
                              {activeView !== 'instagram' && (
                                <span className="flex items-center gap-1">
                                  <TikTokIcon size={11} className="text-[#00acc1]" />
                                  <strong className="font-mono font-medium">{fmtFull(ttViews)}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 pl-4">
                          <span className="font-bold text-sm text-[color:var(--md-sys-color-on-surface)] font-mono">{fmtFull(totalViews)}</span>
                          <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5 flex">
                            {activeView === 'dashboard' ? (
                              totalViews > 0 ? (
                                <>
                                  <div className="h-full bg-red-500" style={{ width: `${igPercent}%` }} />
                                  <div className="h-full bg-[#00acc1]" style={{ width: `${ttPercent}%` }} />
                                </>
                              ) : (
                                <div className="h-full bg-[color:var(--md-sys-color-surface-container-highest)] w-full" />
                              )
                            ) : (
                              <div 
                                className={`h-full ${activeView === 'instagram' ? 'bg-red-500' : 'bg-[#00acc1]'}`} 
                                style={{ width: `${percent}%` }} 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }
    } else if (metric === 'uploads') {
      title = `Detail Unggahan - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Informasi kuantitas video yang dipublikasikan pada periode ${activeLabel}.`;

      if (isYear) {
        const monthlyStats = MONTH_NAMES.map((mName, mIdx) => {
          const mContents = folders[selectedYear]?.[mIdx] || [];
          return { mIdx, name: mName, count: mContents.length };
        });

        const bestMonth = [...monthlyStats].sort((a, b) => b.count - a.count)[0];
        const maxCount = monthlyStats.length > 0 ? Math.max(...monthlyStats.map(row => row.count)) : 1;

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.count > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-[color:var(--md-sys-color-secondary-container)]/30 border border-[color:var(--md-sys-color-secondary-container)]/50 rounded-2xl">
                <Video size={16} className="text-[color:var(--md-sys-color-secondary)] shrink-0" />
                <span className="text-xs font-medium text-[color:var(--md-sys-color-on-surface)]">
                  Bulan paling produktif Anda adalah <strong className="text-[color:var(--md-sys-color-secondary)] font-semibold">{bestMonth.name}</strong> dengan memposting <strong className="text-[color:var(--md-sys-color-secondary)] font-semibold">{bestMonth.count}</strong> video.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Bulan</span>
                <span>Jumlah Unggahan</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {monthlyStats.map((row) => {
                  const percent = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
                  return (
                    <div 
                      key={row.mIdx} 
                      className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                    >
                      <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)]">{row.name}</span>
                      <div className="flex flex-col items-end shrink-0 pl-4">
                        <span className="font-bold text-sm text-[color:var(--md-sys-color-secondary)] font-mono">{row.count} video</span>
                        <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full bg-[color:var(--md-sys-color-secondary)]" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      } else {
        contentNode = (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Konten</span>
                <span>Status Terbit</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {selectedMonthContents.length === 0 ? (
                  <p className="text-center py-10 text-[color:var(--md-sys-color-on-surface-variant)] text-xs">Belum ada konten diunggah di bulan ini.</p>
                ) : (
                  selectedMonthContents.map((item) => {
                    const hasIG = item.instagram.views > 0;
                    const hasTT = item.tiktok.views > 0;
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[color:var(--md-sys-color-on-surface-variant)] font-mono">{item.day}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)] truncate max-w-[280px]" title={item.title}>
                              {item.title}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                              {hasIG && (
                                <span className="flex items-center gap-1 bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] px-2 py-0.5 rounded-full font-medium text-[10px]">
                                  <InstagramIcon size={10} /> Instagram
                                </span>
                              )}
                              {hasTT && (
                                <span className="flex items-center gap-1 bg-[color:var(--md-sys-color-cyan-container)] text-[color:var(--md-sys-color-on-cyan-container)] px-2 py-0.5 rounded-full font-medium text-[10px]">
                                  <TikTokIcon size={9} /> TikTok
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0 pl-4">
                          <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full font-semibold">
                            Terbit
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }
    } else if (metric === 'engagement') {
      title = `Detail Interaksi - ${isYear ? 'Tahunan' : 'Bulanan'} (${activeLabel})`;
      description = `Analisis rasio keterlibatan pemirsa (Likes + Comments + Saves + Shares)/Views pada periode ${activeLabel}.`;

      if (isYear) {
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
        const maxRate = monthlyStats.length > 0 ? Math.max(...monthlyStats.map(row => row.rate)) : 1;

        contentNode = (
          <div className="flex flex-col gap-4">
            {bestMonth.rate > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
                <Zap size={16} className="text-teal-500 shrink-0" />
                <span className="text-xs font-medium text-[color:var(--md-sys-color-on-surface)]">
                  Interaksi tertinggi dicapai pada bulan <strong className="text-teal-500 font-semibold">{bestMonth.name}</strong> dengan rasio interaksi rata-rata <strong className="text-teal-500 font-semibold">{bestMonth.rate.toFixed(2)}%</strong>.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Bulan</span>
                <span>Engagement Rate (ER)</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {monthlyStats.map((row) => {
                  const percent = maxRate > 0 ? (row.rate / maxRate) * 100 : 0;
                  return (
                    <div 
                      key={row.mIdx} 
                      className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)]">{row.name}</span>
                        <span className="text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                          Views: <strong className="font-mono font-medium">{fmtFull(row.totalViews)}</strong>
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-4">
                        <span className="font-bold text-sm text-teal-500 font-mono">{row.rate.toFixed(2)}%</span>
                        <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full bg-teal-500" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      } else {
        const items = [...selectedMonthContents]
          .map(item => ({ ...item, rate: getEngagementRate(item) }))
          .sort((a, b) => b.rate - a.rate);
        const maxRate = items.length > 0 ? Math.max(...items.map(item => item.rate)) : 1;

        contentNode = (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                <span>Konten</span>
                <span>Engagement Rate</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-center py-10 text-[color:var(--md-sys-color-on-surface-variant)] text-xs">Belum ada konten diunggah di bulan ini.</p>
                ) : (
                  items.map((item) => {
                    const m = getMetrics(item);
                    const interaksi = m.likes + m.comments + m.saves + m.shares;
                    const percent = maxRate > 0 ? (item.rate / maxRate) * 100 : 0;
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[color:var(--md-sys-color-on-surface-variant)] font-mono">{item.day}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)] truncate max-w-[250px]" title={item.title}>
                              {item.title}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                              <span>Views: <strong className="font-mono font-medium">{fmtFull(m.views)}</strong></span>
                              <span className="text-[color:var(--md-sys-color-outline)]/40">•</span>
                              <span>Interaksi: <strong className="font-mono font-medium">{fmtFull(interaksi)}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 pl-4">
                          <span className="font-bold text-sm text-teal-500 font-mono">{item.rate.toFixed(2)}%</span>
                          <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-teal-500" 
                              style={{ width: `${percent}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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

      fypContents.sort((a, b) => getMetrics(b).views - getMetrics(a).views);
      const maxViews = fypContents.length > 0 ? Math.max(...fypContents.map(item => getMetrics(item).views)) : 1;

      contentNode = (
        <div className="flex flex-col gap-4">
          {fypContents.length > 0 && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-[color:var(--md-sys-color-on-surface)]">
                Hebat! Ada <strong className="text-amber-500 font-semibold">{fypContents.length}</strong> konten yang sukses melampaui target FYP &gt; 20K.
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] font-bold px-4 pb-1 border-b border-[color:var(--md-sys-color-outline-variant)]/30">
              <span>{isYear ? 'Tanggal / Bulan' : 'Konten'}</span>
              <span>Views / Distribusi</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {fypContents.length === 0 ? (
                <p className="text-center py-10 text-[color:var(--md-sys-color-on-surface-variant)] text-xs">Belum ada konten yang menembus target FYP (&gt; 20K views) pada periode ini.</p>
              ) : (
                fypContents.map((item) => {
                  const m = getMetrics(item);
                  let dateLabel = `${item.day}`;
                  if (isYear) {
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
                  const percent = maxViews > 0 ? (m.views / maxViews) * 100 : 0;
                  const rowSum = (item.instagram.views + item.tiktok.views) || 1;
                  const igPercent = (item.instagram.views / rowSum) * 100;
                  const ttPercent = (item.tiktok.views / rowSum) * 100;

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3.5 bg-[color:var(--md-sys-color-surface-container-low)] hover:bg-[color:var(--md-sys-color-surface-container-high)] rounded-2xl transition-colors duration-150 border border-[color:var(--md-sys-color-outline-variant)]/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-8 rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] font-mono whitespace-nowrap px-1">{dateLabel}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-[color:var(--md-sys-color-on-surface)] truncate max-w-[280px]" title={item.title}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                            {activeView !== 'tiktok' && (
                              <span className="flex items-center gap-1">
                                <InstagramIcon size={12} className="text-red-500" />
                                <strong className="font-mono font-medium">{fmtFull(item.instagram.views)}</strong>
                              </span>
                            )}
                            {activeView !== 'instagram' && (
                              <span className="flex items-center gap-1">
                                <TikTokIcon size={11} className="text-[#00acc1]" />
                                <strong className="font-mono font-medium">{fmtFull(item.tiktok.views)}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-4">
                        <span className="font-bold text-sm text-amber-500 font-mono">{fmtFull(m.views)}</span>
                        <div className="w-24 h-1.5 bg-[color:var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden mt-1.5 flex">
                          {activeView === 'dashboard' ? (
                            m.views > 0 ? (
                              <>
                                <div className="h-full bg-red-500" style={{ width: `${igPercent}%` }} />
                                <div className="h-full bg-[#00acc1]" style={{ width: `${ttPercent}%` }} />
                              </>
                            ) : (
                              <div className="h-full bg-[color:var(--md-sys-color-surface-container-highest)] w-full" />
                            )
                          ) : (
                            <div 
                              className="h-full bg-amber-500" 
                              style={{ width: `${percent}%` }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 md-backdrop-enter">
        <div className="bg-[color:var(--md-sys-color-surface)] border border-[color:var(--md-sys-color-outline-variant)] w-full max-w-3xl overflow-hidden rounded-3xl shadow-[var(--md-elevation-3)] md-dialog-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[color:var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-2">
              <h2 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">{title}</h2>
            </div>
            <button
              type="button"
              onClick={() => setExpandedCard(null)}
              className="md-icon-btn"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col gap-4 text-sm bg-[color:var(--md-sys-color-surface)] text-[color:var(--md-sys-color-on-surface)]">
            <div>
              <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)]">{description}</p>
            </div>
            {contentNode}
            <div className="flex justify-end mt-2 pt-3 border-t border-[color:var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setExpandedCard(null)}
                className="gai-btn-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[color:var(--md-sys-color-background)] text-[color:var(--md-sys-color-on-surface)]">

      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center justify-end py-3 px-6 shrink-0 border-b border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)]">
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
            className="md-icon-btn"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* Title Area */}
        <div className="flex justify-between items-end">
          <div>
            <h1
              className="text-[28px] font-semibold tracking-tight text-[color:var(--md-sys-color-on-surface)]"
              style={{ fontFamily: "'Google Sans Display', sans-serif" }}
            >
              {activeView === 'instagram' ? 'Instagram' : activeView === 'tiktok' ? 'TikTok' : 'Dashboard'}
            </h1>
            <p className="text-sm text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
              Performance overview for {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
          {activeView !== 'dashboard' && (
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight">{fmtFull(currentFollowers)}</span>
              <span className="text-xs text-[color:var(--md-sys-color-on-surface-variant)] uppercase block">Followers</span>
            </div>
          )}
        </div>

        {/* SECTION: STAT CARDS GRID */}
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-3 mb-5">
            <h3 className="md-label-large text-[color:var(--md-sys-color-on-surface-variant)] select-none">
              {summaryPeriod === 'month'
                ? `${MONTH_NAMES[selectedMonth]} ${selectedYear} Performance`
                : `${selectedYear} Annual Performance`
              }
            </h3>
            {/* Segmented button: Monthly / Annual */}
            <div className="flex border border-[color:var(--md-sys-color-outline)] rounded-full p-0.5 self-start sm:self-auto select-none">
              <button
                type="button"
                onClick={() => setSummaryPeriod('month')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 cursor-pointer ${
                  summaryPeriod === 'month'
                    ? 'bg-[color:var(--md-sys-color-secondary-container,var(--md-sys-color-surface-variant))] text-[color:var(--md-sys-color-on-secondary-container,var(--md-sys-color-primary))]'
                    : 'text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-container-high)]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSummaryPeriod('year')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 cursor-pointer ${
                  summaryPeriod === 'year'
                    ? 'bg-[color:var(--md-sys-color-secondary-container,var(--md-sys-color-surface-variant))] text-[color:var(--md-sys-color-on-secondary-container,var(--md-sys-color-primary))]'
                    : 'text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-container-high)]'
                }`}
              >
                Annual
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

        {/* SECTION: DASHBOARD MAIN LAYOUT */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* === LEFT COLUMN === */}
            <div className="flex flex-col gap-6 lg:border-r border-[color:var(--md-sys-color-outline-variant)] lg:pr-8">
              {/* Top Performing Content Leaderboard */}
              <div>
                <h3 className="md-label-large text-[color:var(--md-sys-color-on-surface-variant)] mb-4 pb-2 border-b border-[color:var(--md-sys-color-outline-variant)]">
                  Top Content — {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h3>
                {bestContents.length === 0 ? (
                  <p className="text-sm text-[color:var(--md-sys-color-on-surface-variant)] py-2">No content available for this month.</p>
                ) : (
                  <div className="space-y-3 py-2">
                    {bestContents.map((content, idx) => {
                      const igViews = content.instagram.views;
                      const ttViews = content.tiktok.views;
                      const totalViews = igViews + ttViews;
                      const igPct = totalViews > 0 ? Math.round((igViews / totalViews) * 100) : 0;
                      const ttPct = totalViews > 0 ? (100 - igPct) : 0;

                      const isFirst = idx === 0;

                      return (
                      <div key={content.id} className="relative">
                        <div
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg transition-all duration-150 select-none cursor-default bg-[color:var(--md-sys-color-surface)] border shadow-[var(--md-elevation-1)] ${
                            isFirst
                              ? 'border-[color:var(--md-sys-color-primary)]'
                              : 'border-[color:var(--md-sys-color-outline-variant)] hover:border-[color:var(--md-sys-color-primary)]/40'
                          }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Rank Badge */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isFirst
                                  ? 'bg-[color:var(--md-sys-color-primary)] text-[color:var(--md-sys-color-on-primary)]'
                                  : 'bg-[color:var(--md-sys-color-surface-container)] text-[color:var(--md-sys-color-on-surface)] border border-[color:var(--md-sys-color-outline-variant)]'
                              }`}>
                                {idx + 1}
                              </div>
                              
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[color:var(--md-sys-color-on-surface)] hover:text-[color:var(--md-sys-color-primary)] transition-colors duration-150">
                                    {content.title}
                                  </span>
                                  {isFirst && <Crown size={14} className="text-[#f2a918] shrink-0" />}
                                </div>

                                <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1 uppercase">
                                  MIRRORED · DAY {content.day}
                                </span>

                                {/* Leaderboard Views Ratio Progress Bar */}
                                <div className="flex flex-col gap-1.5 mt-2.5 max-w-xs">
                                  <div className="h-1.5 w-full bg-[color:var(--md-sys-color-surface-variant)] rounded-full overflow-hidden flex">
                                    <div style={{ width: `${igPct}%` }} className="h-full bg-[#ea4335]" />
                                    <div style={{ width: `${ttPct}%` }} className="h-full bg-[#00acc1]" />
                                  </div>
                                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)]">
                                    <span>IG: {fmt(igViews)} ({igPct}%)</span>
                                    <span>TT: {fmt(ttViews)} ({ttPct}%)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 self-end sm:self-center shrink-0 border-t border-[color:var(--md-sys-color-outline-variant)] sm:border-0 pt-2 sm:pt-0">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(getMetrics(content).views)}</span>
                                <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                                  Views
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(getMetrics(content).likes)}</span>
                                <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                                  Likes
                                </span>
                              </div>
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
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[color:var(--md-sys-color-outline-variant)]">
                  <h3 className="md-label-large text-[color:var(--md-sys-color-on-surface-variant)]">
                    Monthly Views Trend
                  </h3>
                  <button
                    onClick={() => setExpandedChart('monthly-combined')}
                    className="md-icon-btn-sm"
                    title="Expand Chart"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="h-48 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={momChartData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? '#3c4043' : '#dadce0'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                        axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }}
                        tickLine={false}
                      />
                      <YAxis
                        width={40}
                        tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
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
                        stroke={chartColors.blue}
                        strokeWidth={2}
                        dot={{ fill: chartColors.blue, strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="igViews"
                        name="igViews"
                        stroke={chartColors.red}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={{ fill: chartColors.red, strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ttViews"
                        name="ttViews"
                        stroke={chartColors.cyan}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={{ fill: chartColors.cyan, strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="text-[11px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5">
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
            <div className="border border-[color:var(--md-sys-color-outline-variant)] rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5">
                <h3 className="text-[11px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Monthly Views Trend
                </h3>
                <button
                  onClick={() => setExpandedChart('monthly-platform')}
                  className="p-1 rounded hover:bg-[color:var(--md-sys-color-surface-variant)] text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)] transition-all duration-150"
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
                      stroke={isDarkMode ? '#3c4043' : '#dadce0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={40}
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtFull(v), 'Views']} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue}
                      strokeWidth={2}
                      dot={{ fill: activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Views Trend */}
            <div className="border border-[color:var(--md-sys-color-outline-variant)] rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5">
                <h3 className="text-[11px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Daily Views Trend
                </h3>
                <button
                  onClick={() => setExpandedChart('daily')}
                  className="p-1 rounded hover:bg-[color:var(--md-sys-color-surface-variant)] text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)] transition-all duration-150"
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
                      stroke={isDarkMode ? '#3c4043' : '#dadce0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={40}
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: any) => [fmtFull(value), 'Views']}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue}
                      strokeWidth={2}
                      dot={{ fill: activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.blue, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Cycle Trend */}
            <div className="border border-[color:var(--md-sys-color-outline-variant)] rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5 gap-2">
                <h3 className="text-[11px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider shrink-0">
                  Weekly Cycle
                </h3>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MacDropdown
                    value={safeWeekIndex}
                    onChange={setSelectedCycleWeek}
                    options={weekOptions}
                    size="sm"
                    className="max-w-[140px]"
                  />
                  <button
                    onClick={() => setExpandedChart('cycle')}
                    className="p-1 rounded hover:bg-[color:var(--md-sys-color-surface-variant)] text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)] transition-all duration-150 shrink-0"
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
                      stroke={isDarkMode ? '#3c4043' : '#dadce0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
                      axisLine={{ stroke: isDarkMode ? '#3c4043' : '#dadce0' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={50}
                      tick={{ fill: isDarkMode ? '#bdc1c6' : '#5f6368', fontSize: 11 }}
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
                      stroke={activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.green}
                      strokeWidth={2}
                      dot={{ fill: activeView === 'instagram' ? chartColors.red : activeView === 'tiktok' ? chartColors.cyan : chartColors.green, strokeWidth: 0, r: 3 }}
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
            <h3 className="text-[11px] font-semibold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5">
              Top Performing Content - {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            {bestContents.length === 0 ? (
              <p className="text-sm text-[color:var(--md-sys-color-on-surface-variant)] py-2">No content available for this month.</p>
            ) : (
              <div className="space-y-3 py-2">
                {bestContents.map((content, idx) => {
                  const metrics = getMetrics(content);
                  const isFirst = idx === 0;

                  return (
                    <div key={content.id} className="relative">
                      <div 
                        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl transition-all duration-150 select-none cursor-default bg-[color:var(--md-sys-color-surface)] border shadow-[var(--md-elevation-1)] ${
                          isFirst 
                            ? 'border-[color:var(--md-sys-color-primary)]' 
                            : 'border-[color:var(--md-sys-color-outline-variant)] hover:border-[color:var(--md-sys-color-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isFirst 
                              ? 'bg-[color:var(--md-sys-color-primary)] text-white' 
                              : 'bg-[color:var(--md-sys-color-surface-variant)] text-[color:var(--md-sys-color-on-surface)] border border-[color:var(--md-sys-color-outline-variant)]'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)] hover:text-[color:var(--md-sys-color-primary)] transition-colors duration-150">
                                {content.title}
                              </span>
                              {isFirst && <Crown size={14} className="text-[#f2a918] shrink-0" />}
                            </div>

                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-1">
                              {activeView.toUpperCase()} • DAY {content.day}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end shrink-0 border-t border-[color:var(--md-sys-color-outline-variant)] lg:border-0 pt-2 lg:pt-0">
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(metrics.views)}</span>
                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                              Views
                            </span>
                          </div>
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(metrics.likes)}</span>
                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                              Likes
                            </span>
                          </div>
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(metrics.comments)}</span>
                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                              Comments
                            </span>
                          </div>
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(metrics.saves)}</span>
                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                              Saves
                            </span>
                          </div>
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-sm font-bold text-[color:var(--md-sys-color-on-surface)]">{fmtFull(metrics.shares)}</span>
                            <span className="text-[9px] font-bold text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mt-0.5">
                              Shares
                            </span>
                          </div>
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
