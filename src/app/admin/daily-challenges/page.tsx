'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function ContentLabPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handlePush() {
    if (!jsonInput.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const content = JSON.parse(jsonInput);
      const res = await api.daily.push(date, content);
      
      if (res.success) {
        setMessage({ type: 'success', text: `Đã đẩy thành công bài tập cho ngày ${date}` });
        setJsonInput('');
      } else {
        throw new Error("Lỗi từ server");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Định dạng JSON không hợp lệ" });
    } finally {
      setLoading(false);
    }
  }

  const parsedPreview = () => {
    try {
      return JSON.parse(jsonInput);
    } catch {
      return null;
    }
  };

  const preview = parsedPreview();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Content Lab (Daily Challenge)</h1>
        <p className="text-slate-500 font-medium">Dán dữ liệu JSON từ AI để phát hành bài tập hằng ngày.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Ngày Phát Hành</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Dữ liệu JSON (từ Master Prompt)</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"metadata": {...}, "reading": {...}, "vocabulary": [...]}'
                rows={20}
                className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl font-bold text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handlePush}
              disabled={loading || !jsonInput}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Phát Hành Ngay'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Preview (Mobile View Mockup)
            </h2>

            {!preview ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="font-bold">Nhập JSON hợp lệ để xem trước</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <span className="text-[10px] font-black text-indigo-400 uppercase">Chủ đề</span>
                  <p className="text-indigo-900 font-black">{preview.metadata?.topic}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-xl">{preview.reading?.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-4">
                    {preview.reading?.passage?.substring(0, 200)}...
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Vocabulary Highlights</span>
                  <div className="flex flex-wrap gap-2">
                    {preview.vocabulary?.map((v: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                        {v.word} ({v.pos})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Checklist bài tập</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-[10px] text-white">✓</div>
                      {preview.reading?.questions?.length || 0} câu hỏi Reading
                    </li>
                    <li className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-[10px] text-white">✓</div>
                      {preview.vocabulary?.length || 0} từ vựng mới
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
