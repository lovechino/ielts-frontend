'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, AdminStats } from '@/lib/api';

const NAV_CARDS = [
  {
    title: 'Vocabulary Center',
    desc: 'Quan ly 450k tu, bulk import, va dong goi dictionary.db.',
    href: '/admin/vocabulary',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Vocab Contributions',
    desc: 'Duyệt từ vựng do cộng đồng đóng góp và trao thưởng.',
    href: '/admin/vocab-contributions',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Shop & Economy',
    desc: 'Quản lý Avatars, Frames và vật phẩm hỗ trợ.',
    href: '/admin/shop',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Content Lab',
    desc: 'AI-Generated Daily Challenges & automated tasks.',
    href: '/admin/daily-challenges',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    color: 'bg-emerald-100 text-emerald-600',
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
  const money = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const statItems = stats ? [
    { label: 'Total Users',      value: fmt(stats.total_users),           sub: `${fmt(stats.premium_users)} premium` },
    { label: 'Vocabulary in DB', value: fmt(stats.total_words),            sub: `${fmt(stats.published_words)} published` },
    { label: 'Offline Target',   value: fmt(stats.dictionary_target_words), sub: stats.latest_dictionary_version ? `latest ${stats.latest_dictionary_version}` : '450k target' },
    { label: 'Tests Completed',  value: fmt(stats.total_submissions),     sub: 'all time' },
    { label: 'Speaking Sessions',value: fmt(stats.total_speaking_sessions), sub: 'completed' },
    { label: 'Lessons',          value: fmt(stats.total_lessons),         sub: 'in system' },
    { label: "Today's Challenge", value: stats.today_challenge_exists ? '✓ Live' : '✗ Missing', sub: stats.today_challenge_exists ? 'published' : 'needs publishing' },
  ] : [];

  const biItems = stats ? [
    { label: "Today's Revenue",   value: money(stats.today_revenue),      sub: 'from topups/subs' },
    { label: "Lifetime Revenue",  value: money(stats.total_revenue),      sub: 'total earnings' },
    { label: "Ad Views Today",    value: fmt(stats.today_ad_views),       sub: 'video rewards' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Command Center</h1>
          <p className="text-slate-500 font-medium">Chào mừng trở lại! Hôm nay bạn muốn quản lý nội dung nào?</p>
        </div>
        {!statsLoading && (
          <div className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest border-2 ${
            stats?.is_local ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {stats?.is_local ? '🛠 Local Development' : '🚀 Production Environment'}
          </div>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Stats */}
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              System Overview
            </h3>
            {!statsLoading && !statsError && <span className="text-xs text-slate-500 font-bold">Real-time sync</span>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
            {statsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <p className="text-slate-400 text-xs font-black uppercase mb-2">Loading...</p>
                  <StatSkeleton />
                </div>
              ))
            ) : statsError ? (
              <div className="col-span-full text-center py-4 text-slate-400 text-sm">Stats unavailable.</div>
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

        {/* Business Intelligence */}
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-2.101C14.415 14.12 15 12.83 15 11.5c0-1.33-0.585-2.62-1.401-3.399M9 16.5c0-1.33 0.585-2.62 1.401-3.399" />
            </svg>
            Business Intelligence
          </h3>
          
          <div className="space-y-6">
            {statsLoading ? (
               Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              biItems.map(b => (
                <div key={b.label} className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-wider mb-1">{b.label}</p>
                  <p className="text-2xl font-black">{b.value}</p>
                  <p className="text-indigo-200/60 text-[10px] font-bold mt-0.5">{b.sub}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/vocabulary?tab=bulk" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">⬆</div>
          <div><p className="font-black text-slate-800">Bulk Import</p><p className="text-[10px] text-slate-400 uppercase font-black">Vocab Hub</p></div>
        </Link>
        <Link href="/admin/vocabulary?tab=export" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">📦</div>
          <div><p className="font-black text-slate-800">Export SQL</p><p className="text-[10px] text-slate-400 uppercase font-black">Mobile Sync</p></div>
        </Link>
        <Link href="/admin/daily-challenges" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">📅</div>
          <div><p className="font-black text-slate-800">Daily Quest</p><p className="text-[10px] text-slate-400 uppercase font-black">{stats?.today_challenge_exists ? '✓ Active' : '⚠ Missing'}</p></div>
        </Link>
        <Link href="/admin/users" className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">👥</div>
          <div><p className="font-black text-slate-800">User Monitor</p><p className="text-[10px] text-slate-400 uppercase font-black">Live Support</p></div>
        </Link>
      </div>
    </div>
  );
}
