'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface VersionMeta {
  version: string;
  url: string;
  checksum: string | null;
  isFullUpdate: boolean;
  patchUrl: string | null;
  patchSize: number | null;
  updatedAt: string | null;
}

export default function AdminDictionaryPage() {
  const [current, setCurrent] = useState<VersionMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    version: '',
    url: '',
    checksum: '',
    isFullUpdate: true,
    patchUrl: '',
    patchSize: '',
  });

  useEffect(() => {
    api.dictionary.getVersion()
      .then(data => {
        setCurrent(data);
        setForm({
          version: data.version || '',
          url: data.url || '',
          checksum: data.checksum || '',
          isFullUpdate: data.isFullUpdate ?? true,
          patchUrl: data.patchUrl || '',
          patchSize: data.patchSize ? String(data.patchSize) : '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        version: form.version.trim(),
        url: form.url.trim(),
        checksum: form.checksum.trim() || undefined,
        isFullUpdate: form.isFullUpdate,
        patchUrl: form.patchUrl.trim() || undefined,
        patchSize: form.patchSize ? parseInt(form.patchSize) : undefined,
      };
      const updated = await api.dictionary.setVersion(payload);
      setCurrent(updated);
      setMsg({ type: 'success', text: `✓ Đã cập nhật version ${updated.version}` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Lỗi khi lưu version' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Dictionary Version Manager</h1>
        <p className="text-slate-500 font-medium">
          Quản lý phiên bản dictionary.db cho Mobile app. App sẽ tự động tải bản mới khi khởi động.
        </p>
      </div>

      {/* Current version status */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl">
        <h2 className="text-sm font-black text-slate-400 uppercase mb-4">Phiên bản hiện tại trên KV</h2>
        {loading ? (
          <div className="animate-pulse h-8 w-32 bg-white/10 rounded-xl" />
        ) : current ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Version</p>
              <p className="text-2xl font-black text-indigo-400">{current.version || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Loại update</p>
              <p className="text-lg font-black">
                {current.version === '0.0.0' ? '—' : current.isFullUpdate ? 'Full DB' : 'Delta Patch'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Patch size</p>
              <p className="text-lg font-black">
                {current.patchSize ? `${(current.patchSize / 1024).toFixed(0)} KB` : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Cập nhật lúc</p>
              <p className="text-sm font-bold text-slate-300">
                {current.updatedAt ? new Date(current.updatedAt).toLocaleString('vi-VN') : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400">Chưa có version nào được set.</p>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
        <h3 className="font-black text-blue-900 mb-3">📋 Quy trình Delta Update</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-2">
            <p className="font-bold">Full Update (isFullUpdate = true):</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Export SQL từ Admin → build dictionary.db</li>
              <li>Upload lên Cloudflare R2 / CDN</li>
              <li>Set version + url ở đây</li>
              <li>App tải toàn bộ file mới (~18MB)</li>
            </ol>
          </div>
          <div className="space-y-2">
            <p className="font-bold">Delta Patch (isFullUpdate = false):</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Export SQL chỉ chứa từ mới (INSERT OR IGNORE)</li>
              <li>Upload patch file lên R2</li>
              <li>Set version + patchUrl ở đây</li>
              <li>App chỉ tải patch nhỏ (~KB)</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6">Phát hành phiên bản mới</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Version <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                value={form.version}
                onChange={e => setForm({ ...form, version: e.target.value })}
                placeholder="e.g. 1.2.0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Loại Update
              </label>
              <div className="flex gap-4 pt-2">
                {[
                  { val: true, label: 'Full DB (~18MB)' },
                  { val: false, label: 'Delta Patch (nhỏ)' },
                ].map(opt => (
                  <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.isFullUpdate === opt.val}
                      onChange={() => setForm({ ...form, isFullUpdate: opt.val })}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">
              URL tải file <span className="text-red-500">*</span>
              <span className="ml-2 text-slate-400 normal-case font-normal">
                ({form.isFullUpdate ? 'URL của dictionary.db' : 'URL của patch .sql'})
              </span>
            </label>
            <input
              type="url" required
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://r2.example.com/dictionary.db"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                Checksum (tùy chọn)
                <span className="ml-1 text-slate-400 normal-case font-normal">size:NNNN hoặc sha256:...</span>
              </label>
              <input
                type="text"
                value={form.checksum}
                onChange={e => setForm({ ...form, checksum: e.target.value })}
                placeholder="size:18432000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
              />
            </div>
            {!form.isFullUpdate && (
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">
                  Patch Size (bytes)
                </label>
                <input
                  type="number"
                  value={form.patchSize}
                  onChange={e => setForm({ ...form, patchSize: e.target.value })}
                  placeholder="45000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm"
                />
              </div>
            )}
          </div>

          {msg && (
            <div className={`p-4 rounded-xl font-bold text-sm ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all"
          >
            {saving ? 'Đang lưu...' : '🚀 Phát hành phiên bản mới'}
          </button>
        </form>
      </div>
    </div>
  );
}
