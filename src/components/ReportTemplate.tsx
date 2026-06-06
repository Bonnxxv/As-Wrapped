import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Sparkles, 
  AlertTriangle, 
  Eye, 
  Zap, 
  Tv, 
  FileText
} from 'lucide-react';
import { ContentEntry, PlatformProfiles } from '../types';
import { GeminiReportResponse } from '../utils/geminiService';
import { InstagramIcon, TikTokIcon } from './MacSidebar';

interface ReportTemplateProps {
  periodType: 'month' | 'year';
  periodLabel: string;
  profiles: PlatformProfiles;
  entries: ContentEntry[];
  aiAnalysis: GeminiReportResponse | null;
  chartData: any[]; // Data tren harian (untuk bulanan) atau bulanan (untuk tahunan)
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({
  periodType,
  periodLabel,
  profiles,
  entries,
  aiAnalysis,
  chartData
}) => {
  if (!aiAnalysis) return null;

  // Calculate high-level summary metrics
  const totalIgViews = entries.reduce((s, e) => s + e.instagram.views, 0);
  const totalTtViews = entries.reduce((s, e) => s + e.tiktok.views, 0);
  const totalViews = totalIgViews + totalTtViews;

  const totalIgLikes = entries.reduce((s, e) => s + e.instagram.likes, 0);
  const totalTtLikes = entries.reduce((s, e) => s + e.tiktok.likes, 0);
  const totalLikes = totalIgLikes + totalTtLikes;

  const totalIgComments = entries.reduce((s, e) => s + e.instagram.comments, 0);
  const totalTtComments = entries.reduce((s, e) => s + e.tiktok.comments, 0);
  const totalComments = totalIgComments + totalTtComments;

  const totalUploads = entries.length;
  const fypHits = entries.filter(e => e.instagram.views > 20000 || e.tiktok.views > 20000).length;

  const engagementRate = totalViews > 0 
    ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2) 
    : '0.00';

  const igFollowers = profiles.instagram.followers;
  const ttFollowers = profiles.tiktok.followers;

  // Modern UI/UX guidelines:
  // - Soft off-white page background (#F9FAFB) to avoid glare
  // - Neutral dark gray text (#1F2937) for primary reading
  // - No hard borders, soft elevation shadow and rounded corners (rounded-2xl)
  // - Explicit page size of 1120px x 790px for high-res printing
  const pageStyle = "w-[1120px] h-[790px] bg-[#F9FAFB] text-[#1F2937] flex flex-col p-16 relative overflow-hidden shrink-0 border-b border-gray-200 box-sizing";

  return (
    <div 
      id="aswrapped-report-container" 
      className="flex flex-col bg-gray-600 gap-8" 
      style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px',
        width: '1120px',
        overflow: 'hidden'
      }}
    >
      
      {/* ─── Halaman 1: Cover ────────────────────────────────────────────────── */}
      <div id="report-page-1" className={`${pageStyle} justify-between bg-gradient-to-tr from-gray-100 to-[#F9FAFB]`}>
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500 opacity-5 blur-[80px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-amber-500 opacity-5 blur-[60px] -ml-20 -mb-20" />

        {/* Header bar */}
        <div className="flex justify-between items-center z-10">
          <span className="text-[13px] font-bold uppercase tracking-[2px] text-blue-600">
            As-Wrapped Analytics Report
          </span>
          <span className="text-[12px] font-medium text-gray-500">
            Offline-first Personal Dashboard
          </span>
        </div>

        {/* Title (Headings leading-tight / leading-[1.25]) */}
        <div className="my-auto z-10 flex flex-col items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 uppercase tracking-wider">
            <Sparkles size={12} />
            Laporan Kinerja Berbasis AI
          </div>
          <h1 
            className="text-[48px] font-extrabold leading-[1.2] tracking-tight text-[#1F2937]"
            style={{ fontFamily: "'Google Sans Display', sans-serif" }}
          >
            {periodType === 'month' ? 'Laporan Analisis Bulanan' : 'Laporan Analisis Tahunan (YTD)'}
          </h1>
          <p className="text-[20px] text-gray-500 mt-3 font-medium leading-[1.3]">
            Periode Tinjauan: {periodLabel}
          </p>
        </div>

        {/* Footer & profiles summary */}
        <div className="flex justify-between items-end border-t border-gray-200 pt-6 z-10">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <InstagramIcon size={22} className="text-[#1F2937]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#1F2937]">@{profiles.instagram.username}</span>
                <span className="text-xs text-gray-500">{igFollowers.toLocaleString('id-ID')} Pengikut</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TikTokIcon size={22} className="text-[#1F2937]" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#1F2937]">@{profiles.tiktok.username}</span>
                <span className="text-xs text-gray-500">{ttFollowers.toLocaleString('id-ID')} Pengikut</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Dibuat otomatis oleh</p>
            <p className="text-sm font-bold text-blue-600">As-Wrapped Tracker</p>
          </div>
        </div>
      </div>

      {/* ─── Halaman 2: Kinerja Metrik & Tren ─────────────────────────────────── */}
      <div id="report-page-2" className={pageStyle}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[24px] font-bold tracking-tight text-[#1F2937] leading-[1.25]" style={{ fontFamily: "'Google Sans Display', sans-serif" }}>
              Ringkasan Kinerja & Tren Views
            </h2>
            <p className="text-[14px] font-normal text-gray-500 mt-1">
              Visualisasi performa tayangan dan rangkuman metrik utama.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Halaman 2 / 5
          </span>
        </div>

        {/* 4 Stats Cards (Whitespace System & Typography Scale & Soft Elevation) */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between h-[110px] border-none text-left">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-normal text-gray-500">Total Views</span>
              <Eye size={16} className="text-blue-500" />
            </div>
            <span className="text-[32px] font-bold tracking-tight text-[#1F2937] leading-none mt-2">
              {totalViews.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between h-[110px] border-none text-left">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-normal text-gray-500">Engagement Rate</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <span className="text-[32px] font-bold tracking-tight text-[#1F2937] leading-none mt-2">
              {engagementRate}%
            </span>
          </div>

          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between h-[110px] border-none text-left">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-normal text-gray-500">Total Uploads</span>
              <Tv size={16} className="text-cyan-500" />
            </div>
            <span className="text-[32px] font-bold tracking-tight text-[#1F2937] leading-none mt-2">
              {totalUploads}
            </span>
          </div>

          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between h-[110px] border-none text-left">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-normal text-gray-500">FYP Hits</span>
              <Sparkles size={16} className="text-indigo-500" />
            </div>
            <span className="text-[32px] font-bold tracking-tight text-[#1F2937] leading-none mt-2">
              {fypHits}
            </span>
          </div>
        </div>

        {/* Chart area (Soft Elevation & Whitespace System) */}
        <div className="flex-1 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col border-none text-left">
          <span className="text-sm font-semibold mb-4 text-[#1F2937]">
            {periodType === 'month' ? 'Tren Views Konten Harian' : 'Tren Views Konten Bulanan'}
          </span>
          <div className="flex-1 w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                <XAxis 
                  dataKey={periodType === 'month' ? 'label' : 'shortName'} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#1a73e8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Halaman 3: Deteksi Anomali ──────────────────────────────────────── */}
      <div id="report-page-3" className={pageStyle}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[24px] font-bold tracking-tight text-[#1F2937] leading-[1.25]" style={{ fontFamily: "'Google Sans Display', sans-serif" }}>
              🔍 Deteksi & Analisis Anomali
            </h2>
            <p className="text-[14px] font-normal text-gray-500 mt-1">
              Mendeteksi keganjilan statistik atau lonjakan performa konten secara spasial.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Halaman 3 / 5
          </span>
        </div>

        {/* Executive summary block (Left-aligned text & Context-based Line Height & Line Length limit) */}
        <div className="p-6 rounded-2xl bg-blue-50/70 border-none mb-8 text-left">
          <p className="font-bold uppercase tracking-wider text-[11px] text-blue-800 mb-2 opacity-90">
            Ringkasan Eksekutif AI
          </p>
          <div className="text-[14px] leading-[1.6] text-gray-700 max-w-[72ch] text-left">
            {aiAnalysis.executiveSummary}
          </div>
        </div>

        {/* Anomalies list (Whitespace & Soft Elevation) */}
        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
          {aiAnalysis.anomalies.slice(0, 4).map((anomaly, idx) => {
            const isPositive = anomaly.type === 'positive_outlier';
            return (
              <div 
                key={idx} 
                className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between border-none text-left"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-bold text-[#1F2937] truncate leading-tight">
                      {anomaly.title}
                    </span>
                    <span className="text-[12px] text-gray-500 mt-1.5 font-normal">
                      Hari ke-{anomaly.day} • Platform: <span className="capitalize">{anomaly.platform}</span>
                    </span>
                  </div>
                  <div className={`
                    p-2 rounded-full shrink-0
                    ${isPositive 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-amber-50 text-amber-700'
                    }
                  `}>
                    {isPositive ? <Sparkles size={14} /> : <AlertTriangle size={14} />}
                  </div>
                </div>

                <div className="mt-4 text-[13px] leading-[1.6] text-gray-600 border-t border-gray-100 pt-3 flex-1 text-left max-w-[70ch]">
                  <span className={`font-bold uppercase text-[10px] tracking-wider block mb-1.5 ${isPositive ? 'text-green-700' : 'text-amber-700'}`}>
                    {anomaly.type.replace('_', ' ')}
                  </span>
                  {anomaly.description}
                </div>
              </div>
            );
          })}

          {aiAnalysis.anomalies.length === 0 && (
            <div className="col-span-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl flex flex-col items-center justify-center p-8 text-center border-none">
              <AlertTriangle size={36} className="text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-[#1F2937]">Tidak Ada Anomali Terdeteksi</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-[1.6] max-w-[50ch]">
                Seluruh statistik konten berjalan stabil dalam batas wajar selama periode ini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Halaman 4: Analisis Tipologi Konten ───────────────────────────────── */}
      <div id="report-page-4" className={pageStyle}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[24px] font-bold tracking-tight text-[#1F2937] leading-[1.25]" style={{ fontFamily: "'Google Sans Display', sans-serif" }}>
              💡 Analisis Tipologi & Kategori Konten
            </h2>
            <p className="text-[14px] font-normal text-gray-500 mt-1">
              Mengklasifikasi topik sukses vs kurang sukses berdasarkan pola kata kunci judul.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Halaman 4 / 5
          </span>
        </div>

        {/* Platforms breakdown cards (Whitespace & Soft Elevation) */}
        <div className="grid grid-cols-2 gap-8 items-stretch flex-1 min-h-0 text-left">
          {/* Typologies list */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
              Tipologi Konten Ditemukan:
            </span>
            {aiAnalysis.contentTypology.slice(0, 3).map((typ, idx) => {
              const isHigh = typ.performanceLevel === 'high';
              const isMedium = typ.performanceLevel === 'medium';
              return (
                <div 
                  key={idx} 
                  className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-5 border-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#1F2937]">{typ.patternName}</span>
                      <span className={`
                        text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${isHigh 
                          ? 'bg-green-50 text-green-700' 
                          : isMedium 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-red-50 text-red-700'
                        }
                      `}>
                        {typ.performanceLevel}
                      </span>
                    </div>

                    <p className="text-[13px] leading-[1.6] text-gray-600 mt-2 max-w-[70ch]">
                      {typ.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-gray-500">Kata Kunci:</span>
                    {typ.associatedKeywords.map((kw, kIdx) => (
                      <span key={kIdx} className="text-[10px] px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                        {kw}
                      </span>
                    ))}
                    <span className="text-[11px] font-bold text-blue-600 ml-auto">
                      Rata-rata: {typ.averageViews.toLocaleString('id-ID')} views
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform Preference & Strengths */}
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex flex-col justify-between border-none">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
                Kombinasi Preferensi Platform
              </span>
              <p className="text-[14px] font-semibold text-[#1F2937] leading-[1.6] mb-5 max-w-[70ch]">
                {aiAnalysis.platformComparison.platformPreference}
              </p>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex gap-3 items-start">
                  <InstagramIcon size={16} className="shrink-0 mt-1 text-[#1F2937]" />
                  <div className="flex flex-col text-[13px] leading-[1.6]">
                    <span className="font-bold text-[#1F2937]">Kekuatan Instagram:</span>
                    <span className="text-gray-600 max-w-[70ch]">{aiAnalysis.platformComparison.instagramStrengths}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <TikTokIcon size={16} className="shrink-0 mt-1 text-[#1F2937]" />
                  <div className="flex flex-col text-[13px] leading-[1.6]">
                    <span className="font-bold text-[#1F2937]">Kekuatan TikTok:</span>
                    <span className="text-gray-600 max-w-[70ch]">{aiAnalysis.platformComparison.tiktokStrengths}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 text-[13px] text-blue-600 leading-[1.6] font-medium flex gap-2">
              <span className="font-bold shrink-0">Saran Sinkronisasi:</span>
              <span className="text-gray-700 font-normal max-w-[70ch]">{aiAnalysis.platformComparison.recommendation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Halaman 5: Rekomendasi Aksi Strategis ──────────────────────────────── */}
      <div id="report-page-5" className={`${pageStyle} justify-between text-left`}>
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#1F2937] leading-[1.25]" style={{ fontFamily: "'Google Sans Display', sans-serif" }}>
              🎯 Rekomendasi Strategis Konten
            </h2>
            <p className="text-[14px] font-normal text-gray-500 mt-1">
              Rekomendasi taktis berbasis AI yang berorientasi pada hasil dan pertumbuhan berkelanjutan.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Halaman 5 / 5
          </span>
        </div>

        {/* Action recommendations checklist boxes (Whitespace & Soft Elevation) */}
        <div className="flex-1 flex flex-col gap-6 justify-center py-4">
          {aiAnalysis.actionRecommendations.slice(0, 3).map((rec, idx) => (
            <div 
              key={idx} 
              className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-2xl p-6 flex gap-5 items-start border-none"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Rencana Taktis #{idx + 1}
                </p>
                <p className="text-[14px] leading-[1.6] text-gray-600 max-w-[72ch] text-left">
                  {rec}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing details */}
        <div className="border-t border-gray-200 pt-6 flex justify-between items-center shrink-0 text-xs">
          <div className="flex gap-2 items-center text-gray-500">
            <FileText size={14} />
            <span>Dokumen ini diterbitkan oleh As-Wrapped secara offline di perangkat lokal.</span>
          </div>
          <span className="font-semibold text-blue-600">
            © 2026 As-Wrapped Tracker. All rights reserved.
          </span>
        </div>
      </div>

    </div>
  );
};
