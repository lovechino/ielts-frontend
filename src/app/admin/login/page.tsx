'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAccessToken, getAccessToken } from '@/lib/auth-token';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu đã có token hợp lệ → redirect thẳng vào admin
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Verify token còn hiệu lực
      api.auth.me(token)
        .then((user) => {
          if (user.role === 'admin') router.replace('/admin');
          else setError('Tài khoản không có quyền admin.');
        })
        .catch(() => {
          // Token expired → xóa, ở lại trang login
          setAccessToken(null);
        });
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Backend trả { access_token, refresh_token, user }
      // api.auth.login unwrap data và auto set token nếu có res.token
      // Handle cả 2 cases: res.token (old) và res.access_token (new)
      const res = await api.auth.login({ email, password }) as any;
      const token = res?.token || res?.access_token;

      if (!token) throw new Error('Không nhận được token từ server.');
      setAccessToken(token);

      const user = await api.auth.me(token);
      if (user.role !== 'admin') {
        setAccessToken(null);
        setError('Tài khoản này không có quyền truy cập Admin.');
        return;
      }

      router.replace('/admin');
    } catch (err: any) {
      setError(err?.message?.replace('API Error: ', '') || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-indigo-400">IELTS Admin</h1>
          <p className="text-slate-400 mt-2 text-sm">Đăng nhập vào hệ thống quản trị</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
