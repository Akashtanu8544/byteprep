import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import {
  Flame,
  Trophy,
  Calendar,
  TrendingUp,
  Video,
  Send,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Award,
} from 'lucide-react';
import {
  TelegramStreakService,
  DailyActivityMetric,
  PostingStreakInfo,
} from '../../services/telegramStreakService';
import { QuestionLoader } from '../../services/questionLoader';

interface TelegramPerformanceDashboardProps {
  onOpenAutoPostTab?: () => void;
  onOpenAiDsssbTab?: () => void;
}

const SUBJECT_COLORS = [
  '#38bdf8', // Sky
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export const TelegramPerformanceDashboard: React.FC<TelegramPerformanceDashboardProps> = ({
  onOpenAutoPostTab,
  onOpenAiDsssbTab,
}) => {
  const [streakInfo, setStreakInfo] = useState<PostingStreakInfo>(TelegramStreakService.getStreakInfo());
  const [metrics, setMetrics] = useState<DailyActivityMetric[]>(TelegramStreakService.get30DayMetricsArray());
  const [activeChartFilter, setActiveChartFilter] = useState<'ALL' | 'QUIZZES' | 'VIDEO' | 'ENGAGEMENT'>('ALL');
  const [activeSubView, setActiveSubView] = useState<'timeline' | 'breakdown' | 'table'>('timeline');

  useEffect(() => {
    const unsub = TelegramStreakService.subscribe(() => {
      setStreakInfo(TelegramStreakService.getStreakInfo());
      setMetrics(TelegramStreakService.get30DayMetricsArray());
    });
    return unsub;
  }, []);

  // Compute 30-day aggregates
  const aggregates = useMemo(() => {
    let totalQuizzes = 0;
    let totalDsssb = 0;
    let totalPollVotes = 0;
    let totalVideoViews = 0;
    let totalVideoLikes = 0;
    let totalVideoShares = 0;
    let totalVideoComments = 0;
    let daysWithPosts = 0;

    metrics.forEach((m) => {
      totalQuizzes += m.quizzesPosted;
      totalDsssb += m.dsssbCount;
      totalPollVotes += m.pollVotes;
      totalVideoViews += m.videoViews;
      totalVideoLikes += m.videoLikes;
      totalVideoShares += m.videoShares;
      totalVideoComments += m.videoComments;
      if (m.isPosted && m.quizzesPosted > 0) {
        daysWithPosts++;
      }
    });

    const totalEngagements = totalVideoLikes + totalVideoShares + totalVideoComments;
    const avgDailyViews = Math.round(totalVideoViews / Math.max(1, metrics.length));
    const avgDailyVotes = Math.round(totalPollVotes / Math.max(1, metrics.length));
    const overallEngagementRate = totalVideoViews > 0
      ? Number(((totalEngagements / totalVideoViews) * 100).toFixed(1))
      : 0;

    return {
      totalQuizzes,
      totalDsssb,
      totalPollVotes,
      totalVideoViews,
      totalEngagements,
      daysWithPosts,
      avgDailyViews,
      avgDailyVotes,
      overallEngagementRate,
    };
  }, [metrics]);

  // Subject distribution of question bank
  const subjectDistribution = useMemo(() => {
    const questions = QuestionLoader.getAllQuestions();
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      const sub = q.subject || 'General CS';
      map[sub] = (map[sub] || 0) + 1;
    });

    const entries = Object.entries(map).map(([name, value]) => ({ name, value }));
    return entries.sort((a, b) => b.value - a.value).slice(0, 6);
  }, []);

  const handleSimulatePost = () => {
    TelegramStreakService.recordPost({ count: 5, isDsssb: true });
  };

  const handleResetBaseline = () => {
    TelegramStreakService.resetBaseline();
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyActivityMetric;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold">
            <span className="text-white">{data.formattedDate} ({data.dayOfWeek})</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
              data.isPosted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {data.isPosted ? 'Posted 🔥' : 'Rest Day'}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-sky-300">
              <span className="flex items-center gap-1">
                <Send className="w-3 h-3 text-sky-400" /> Quizzes Posted:
              </span>
              <span className="font-bold font-mono">{data.quizzesPosted}</span>
            </div>

            {data.dsssbCount > 0 && (
              <div className="flex items-center justify-between text-amber-300/90 text-[11px] pl-4">
                <span>└ DSSSB TGT PYQs:</span>
                <span className="font-bold font-mono">{data.dsssbCount}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-emerald-300">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" /> Student Votes:
              </span>
              <span className="font-bold font-mono">{data.pollVotes.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3 text-indigo-400" /> Video Views:
              </span>
              <span className="font-bold font-mono">{data.videoViews.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-rose-300 text-[11px]">
              <span>Video Likes & Shares:</span>
              <span className="font-bold font-mono">{(data.videoLikes + data.videoShares).toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. DAILY STREAK HIGHLIGHT HERO CARD */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/0 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Streak Counter & Status */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
                <Flame className="w-9 h-9 sm:w-11 sm:h-11 fill-current animate-pulse text-slate-950" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-slate-950 border border-amber-500 text-amber-300 text-[9px] font-black rounded-full uppercase tracking-wide">
                Day
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {streakInfo.currentStreak}
                </span>
                <span className="text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wider">
                  Day Daily Streak
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                  streakInfo.isPostedToday
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : streakInfo.streakStatus === 'AT_RISK'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {streakInfo.isPostedToday ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Today Secured 🔥</span>
                    </>
                  ) : streakInfo.streakStatus === 'AT_RISK' ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>At Risk Today! Post a Quiz</span>
                    </>
                  ) : (
                    <span>Start Today!</span>
                  )}
                </span>
              </div>

              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Consistent daily posting boosts student participation by over <strong className="text-amber-300">4.2x</strong>. Next achievement milestone:{' '}
                <span className="text-white font-bold underline decoration-amber-400">
                  {streakInfo.milestoneTitle} ({streakInfo.nextMilestoneDays} Days)
                </span>
              </p>

              <div className="flex items-center gap-4 text-xs pt-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>All-Time Best: <strong className="text-white">{streakInfo.longestStreak} Days</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>30-Day Consistency: <strong className="text-emerald-400">{streakInfo.monthConsistencyPercent}%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 7-Day Activity Matrix & Quick Action */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5 shrink-0 self-stretch md:self-auto">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Past 7 Days Activity
              </span>
              <span className="text-amber-400">{streakInfo.totalDaysPosted}/30 Days Active</span>
            </div>

            {/* 7-Day Mini Dots */}
            <div className="grid grid-cols-7 gap-1.5">
              {streakInfo.recentDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${
                    day.posted
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                      : day.isToday
                      ? 'bg-slate-900 border-dashed border-amber-500/40 text-slate-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                  title={`${day.date}: ${day.posted ? `${day.quizzesCount} Quizzes Posted` : 'No post'}`}
                >
                  <span className="text-[9px] font-bold uppercase">{day.dayLabel}</span>
                  {day.posted ? (
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-400 mt-0.5" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5" />
                  )}
                  <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                    {day.posted ? `${day.quizzesCount}q` : '-'}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenAiDsssbTab}
                className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>Post 10 DSSSB Qs</span>
              </button>

              <button
                type="button"
                onClick={onOpenAutoPostTab}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                title="Manage Schedule"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 30-DAY STAT KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-1 hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>30-Day Quizzes</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {aggregates.totalQuizzes.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-400 flex items-center gap-1 font-bold">
            <span>{aggregates.totalDsssb} DSSSB TGT PYQs</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-1 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Student Poll Votes</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {aggregates.totalPollVotes.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            Avg ~{aggregates.avgDailyVotes.toLocaleString()} votes / day
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-1 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Video Views (30D)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {aggregates.totalVideoViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-400 font-bold">
            Shorts & Reels Reach
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-1 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Engagement Rate</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {aggregates.overallEngagementRate}%
          </div>
          <div className="text-[11px] text-amber-400 font-bold">
            {aggregates.totalEngagements.toLocaleString()} likes & shares
          </div>
        </div>
      </div>

      {/* 3. RECHARTS VISUALIZATION DASHBOARD */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-2xl">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              30-Day Telegram Quizzes & Video Engagement
            </h3>
            <p className="text-xs text-slate-400">
              Correlated metrics of daily Telegram quiz broadcasting vs audience video engagement
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSubView('timeline')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSubView === 'timeline'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('breakdown')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSubView === 'breakdown'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Breakdown
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('table')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeSubView === 'table'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Logs
              </button>
            </div>

            <button
              type="button"
              onClick={handleSimulatePost}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              title="Add 5 questions to today's count"
            >
              <Flame className="w-3 h-3 text-amber-400 fill-current" />
              <span>+5 Today</span>
            </button>
          </div>
        </div>

        {/* SUBVIEW 1: TIMELINE RECHARTS GRAPH */}
        {activeSubView === 'timeline' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold text-[11px]">Chart Focus:</span>
              {[
                { id: 'ALL', label: 'All Combined (Quizzes + Video)' },
                { id: 'QUIZZES', label: 'Quizzes vs Poll Votes' },
                { id: 'VIDEO', label: 'Video Reach & Engagement' },
                { id: 'ENGAGEMENT', label: 'Engagement Rate (%)' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveChartFilter(filter.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                    activeChartFilter === filter.id
                      ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Recharts ComposedChart */}
            <div className="w-full h-[320px] bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={metrics}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVideo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={3}
                  />
                  {/* Left Axis: Quizzes & Votes */}
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* Right Axis: Video Views */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#818cf8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                  />

                  {/* Render based on filter */}
                  {(activeChartFilter === 'ALL' || activeChartFilter === 'QUIZZES') && (
                    <Bar
                      yAxisId="left"
                      dataKey="quizzesPosted"
                      name="Telegram Quizzes"
                      fill="#38bdf8"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                  )}

                  {(activeChartFilter === 'ALL' || activeChartFilter === 'QUIZZES') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="pollVotes"
                      name="Student Poll Votes"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVotes)"
                    />
                  )}

                  {(activeChartFilter === 'ALL' || activeChartFilter === 'VIDEO') && (
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="videoViews"
                      name="Video Views"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorVideo)"
                    />
                  )}

                  {activeChartFilter === 'ENGAGEMENT' && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="videoEngagementRate"
                      name="Video Engagement Rate (%)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f59e0b' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SUBVIEW 2: BREAKDOWN CHARTS (Quiz types + Subject Donut) */}
        {activeSubView === 'breakdown' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 2A: DSSSB TGT PYQs vs Regular Slots */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/70 rounded-2xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                DSSSB TGT PYQs vs Standard Quiz Batches
              </h4>
              <p className="text-[11px] text-slate-400">
                Comparison of AI generated DSSSB TGT PYQ questions vs standard schedule slots
              </p>
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="dsssbCount" name="DSSSB TGT PYQ (10 Qs)" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="standardCount" name="Standard Bank Slots" fill="#38bdf8" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2B: Subject Coverage Donut */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/70 rounded-2xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-sky-400" />
                Curriculum Topic Distribution
              </h4>
              <p className="text-[11px] text-slate-400">
                Core Computer Science subject weighting across the question bank
              </p>
              <div className="w-full h-[240px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {subjectDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs shadow-xl">
                              <span className="font-bold text-white block">{item.name}</span>
                              <span className="text-sky-400 font-mono">{item.value} Questions</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 3: DAILY LOGS TABLE */}
        {activeSubView === 'table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Showing last 30 daily broadcast & engagement logs</span>
              <button
                type="button"
                onClick={handleResetBaseline}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Simulation</span>
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-300 font-bold sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 px-3">Date</th>
                    <th className="p-2.5 px-3">Status</th>
                    <th className="p-2.5 px-3">Quizzes Posted</th>
                    <th className="p-2.5 px-3">Student Votes</th>
                    <th className="p-2.5 px-3">Video Views</th>
                    <th className="p-2.5 px-3">Engagement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {[...metrics].reverse().map((m) => (
                    <tr key={m.date} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 px-3 font-mono font-medium text-slate-200">
                        {m.date} <span className="text-slate-500">({m.dayOfWeek})</span>
                      </td>
                      <td className="p-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          m.isPosted
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {m.isPosted ? 'Posted 🔥' : 'Rest Day'}
                        </span>
                      </td>
                      <td className="p-2.5 px-3 font-mono font-bold text-sky-300">
                        {m.quizzesPosted > 0 ? `${m.quizzesPosted} Qs` : '0'}
                      </td>
                      <td className="p-2.5 px-3 font-mono text-emerald-400">
                        {m.pollVotes.toLocaleString()}
                      </td>
                      <td className="p-2.5 px-3 font-mono text-indigo-300">
                        {m.videoViews.toLocaleString()}
                      </td>
                      <td className="p-2.5 px-3 font-mono text-amber-400">
                        {m.videoEngagementRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
