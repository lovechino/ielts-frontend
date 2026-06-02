'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, AdminStats } from '@/lib/api';

const NAV_CARDS = [
  {
    title: 'Course Management',
    desc: 'Tạo khóa học, bài học và upload tài liệu PDF.',
    href: '/admin/courses',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'Vocabulary Center',
    desc: 'Quản lý 100k từ, bulk import, và đóng gói dictionary.db.',
    href: '/admin/vocabulary',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Content Lab',
    desc: 'AI-Generated Daily Challenges & automated tasks.',
    href: '/admin/daily-challenges',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'Test Management',
    desc: 'Tạo Full Tests, Mini Tests và Practice tests.',
    href: '/admin/tests',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    color: 'bg-amber-100 text-amber-600',
  },
];

function StatSkeleton() {
  return <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    api.adminStats.overview()
      .then(setStats)
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const statItems = stats ? [
    { label: 'Total Users',      value: fmt(stats.total_users),           sub: `${fmt(stats.premium_users)} premium` },
    { label: 'Words in DB',      value: fmt(stats.total_words),           sub: 'vocabulary entries' },
    { label: 'Tests Completed',  value: fmt(stats.total_submissions),     sub: 'all time' },
    { label: 'Speaking Sessions',value: fmt(stats.total_speaking_sessions), sub: 'completed' },
    { label: 'Lessons',          value: fmt(stats.total_lessons),         sub: 'in system' },
    { label: "Today's Challenge", value: stats.today_challenge_exists ? '✓ Live' : '✗ Missing', sub: stats.today_challenge_exists ? 'published' : 'needs publishing' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Admin Command Center</h1>
        <p className="text-slate-500 font-medium">Chào mừng trở lại! Hôm nay bạn muốn quản lý nội dung nào?</p>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {NAV_CARDS.map(card => (
          <Link key={card.href} href={card.href} className="group">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-100/50 transition-all group-hover:-translate-y-1 h-full">
              <div className={`h-12 w-12 ${card.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">{card.title}</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{card.desc}</p>
              <div className="mt-4 flex items-center text-indigo-600 font-black text-xs uppercase tracking-wider">Manage Now →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Real-time stats */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            System Overview
          </h3>
          {statsError && <span className="text-xs text-red-400 font-bold">⚠ Không thể tải stats — kiểm tra ENABLE_ADMIN</span>}
          {!statsLoading && !statsError && <span className="text-xs text-slate-500 font-bold">Live data</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <p className="text-slate-400 text-xs font-black uppercase mb-2">Loading...</p>
                <StatSkeleton />
              </div>
            ))
          ) : statsError ? (
            <div className="col-span-full text-center py-4">
              <p className="text-slate-400 text-sm">Stats unavailable — admin mode may be disabled in production.</p>
            </div>
          ) : (
            statItems.map(s => (
              <div key={s.label}>
                <p className="text-slate-400 text-xs font-black uppercase mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.value.startsWith('✓') ? 'text-emerald-400' : s.value.startsWith('✗') ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/vocabulary?tab=bulk" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">⬆</div>
          <div><p className="font-black text-slate-800">Bulk Import Vocab</p><p className="text-xs text-slate-400">Nhập hàng nghìn từ cùng lúc</p></div>
        </Link>
        <Link href="/admin/vocabulary?tab=export" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">📦</div>
          <div><p className="font-black text-slate-800">Export Dictionary</p><p className="text-xs text-slate-400">Đóng gói dictionary.db cho Mobile</p></div>
        </Link>
        <Link href="/admin/daily-challenges" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">📅</div>
          <div>
            <p className="font-black text-slate-800">Daily Challenge</p>
            <p className="text-xs text-slate-400">{stats?.today_challenge_exists ? '✓ Hôm nay đã có bài' : '⚠ Chưa có bài hôm nay'}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
