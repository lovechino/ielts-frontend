'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  // Không apply auth guard trên trang login
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    api.auth.me(token)
      .then(user => {
        if (user.role !== 'admin') {
          setAccessToken(null);
          router.replace('/admin/login');
        } else {
          setAdminEmail(user.email);
          setChecking(false);
        }
      })
      .catch(() => {
        setAccessToken(null);
        router.replace('/admin/login');
      });
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    setAccessToken(null);
    router.replace('/admin/login');
  };

  // Trang login — render trực tiếp không có sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Đang verify token
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard',           href: '/admin',                     icon: '⊞' },
    { label: 'Vocabulary',          href: '/admin/vocabulary',          icon: '🔤' },
    { label: 'Vocab Contributions', href: '/admin/vocab-contributions', icon: '📝' },
    { label: 'Daily Challenges',    href: '/admin/daily-challenges',    icon: '📅' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-indigo-400">IELTS Admin CMS</h1>
          <p className="text-slate-500 text-xs mt-1 truncate">{adminEmail}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all font-medium text-sm"
          >
            <span>↩</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
