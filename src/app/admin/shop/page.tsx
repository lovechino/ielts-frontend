'use client';

import React, { useEffect, useState } from 'react';
import { api, ShopItem } from '@/lib/api';

export default function ShopAdminPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<ShopItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await api.shop.adminList();
      setItems(data);
    } catch (error) {
      console.error('Failed to load shop items', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingItem) return;
    try {
      if (editingItem.id) {
        await api.shop.update(editingItem.id, editingItem);
      } else {
        await api.shop.create(editingItem);
      }
      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      alert('Failed to save item');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.shop.delete(id);
      loadItems();
    } catch (error) {
      alert('Failed to delete item');
    }
  }

  const openModal = (item: Partial<ShopItem> | null = null) => {
    setEditingItem(item || { item_type: 'avatar', price_coins: 0, price_gems: 0, is_active: true });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Shop Management</h1>
          <p className="text-slate-500 font-medium">Quản lý vật phẩm, giá cả và kho đồ hệ thống.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          + Thêm Vật Phẩm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
          ))
        ) : items.map(item => (
          <div key={item.id} className={`bg-white p-6 rounded-3xl border ${item.is_active ? 'border-slate-100' : 'border-red-100 bg-red-50/30'} shadow-sm flex flex-col`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-black">?</div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  item.item_type === 'avatar' ? 'bg-blue-100 text-blue-600' :
                  item.item_type === 'protection' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {item.item_type}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-600' :
                  item.rarity === 'epic' ? 'bg-indigo-100 text-indigo-600' :
                  item.rarity === 'rare' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {item.rarity || 'common'}
                </span>
                {item.sub_type === 'animated' && <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded text-[10px] font-black uppercase">Animated</span>}
                {!item.is_active && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-black uppercase">Inactive</span>}
              </div>
              <h3 className="text-xl font-black text-slate-900">{item.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-4">{item.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-500 font-black">●</span>
                <span className="text-sm font-black text-slate-700">{item.price_coins}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500 font-black">◆</span>
                <span className="text-sm font-black text-slate-700">{item.price_gems}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl space-y-6">
            <h2 className="text-2xl font-black text-slate-900">{editingItem.id ? 'Edit Item' : 'New Shop Item'}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Tên vật phẩm</label>
                <input 
                  type="text" 
                  value={editingItem.name || ''}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Mô tả</label>
                <textarea 
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loại</label>
                  <select 
                    value={editingItem.item_type}
                    onChange={e => setEditingItem({...editingItem, item_type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  >
                    <option value="avatar">Avatar</option>
                    <option value="booster">XP Booster</option>
                    <option value="protection">Streak Freeze</option>
                    <option value="expansion">Vault Expansion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Trạng thái</label>
                  <select 
                    value={editingItem.is_active ? 'true' : 'false'}
                    onChange={e => setEditingItem({...editingItem, is_active: e.target.value === 'true'})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Kiểu dáng</label>
                  <select 
                    value={editingItem.sub_type || 'static'}
                    onChange={e => setEditingItem({...editingItem, sub_type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  >
                    <option value="static">Tĩnh (Static)</option>
                    <option value="animated">Động (Animated)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Độ hiếm</label>
                  <select 
                    value={editingItem.rarity || 'common'}
                    onChange={e => setEditingItem({...editingItem, rarity: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  >
                    <option value="common">Phổ biến</option>
                    <option value="rare">Hiếm</option>
                    <option value="epic">Sử thi</option>
                    <option value="legendary">Huyền thoại</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Giá Coins</label>
                  <input 
                    type="number" 
                    value={editingItem.price_coins}
                    onChange={e => setEditingItem({...editingItem, price_coins: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Giá Gems</label>
                  <input 
                    type="number" 
                    value={editingItem.price_gems}
                    onChange={e => setEditingItem({...editingItem, price_gems: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={editingItem.image_url || ''}
                  onChange={e => setEditingItem({...editingItem, image_url: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Lưu Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
