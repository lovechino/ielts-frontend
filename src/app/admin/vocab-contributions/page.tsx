'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Contribution = {
  id: string;
  user_id: string;
  word: string;
  phonetic: string | null;
  definition: string | null;
  definition_vi: string | null;
  example: string | null;
  source: string;
  status: string;
  auto_score: number | null;
  reward_paid: number;
  created_at: string;
};

export default function VocabContributionsPage() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.contributions.listAdmin(statusFilter, 50);
      setItems(res as any);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await api.contributions.reviewAdmin(id, action);
      // Remove from list or reload
      setItems(items.filter(i => i.id !== id));
    } catch (e) {
      alert(`Lỗi khi ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'needs_review': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'duplicate': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Duyệt từ vựng đóng góp</h1>
          <p className="text-slate-500">Người dùng đóng góp từ vựng mới để nhận xu.</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'needs_review', 'approved', 'rejected', 'duplicate'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Không có dữ liệu trong mục này.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-slate-700">Từ vựng</th>
                <th className="p-4 font-black text-slate-700">Định nghĩa</th>
                <th className="p-4 font-black text-slate-700">Người nộp</th>
                <th className="p-4 font-black text-slate-700">Score</th>
                <th className="p-4 font-black text-slate-700">Trạng thái</th>
                <th className="p-4 font-black text-slate-700 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{item.word}</p>
                    <p className="text-xs text-slate-500 italic">{item.phonetic}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-800 line-clamp-1">{item.definition_vi}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.definition}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-600 text-xs truncate w-24" title={item.user_id}>{item.user_id}</p>
                    <p className="text-xs font-medium text-emerald-600">Đã trả: {item.reward_paid} xu</p>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {item.auto_score ?? 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {(item.status === 'pending' || item.status === 'needs_review') && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(item.id, 'approve')}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded font-bold hover:bg-emerald-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1 bg-rose-100 text-rose-700 rounded font-bold hover:bg-rose-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
