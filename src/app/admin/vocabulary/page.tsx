'use client';

import React, { useEffect, useState } from 'react';
import { api, VocabularyCourse, Vocabulary } from '@/lib/api';

export default function AdminVocabularyPage() {
  const [courses, setCourses] = useState<VocabularyCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'list' | 'add' | 'bulk'>('courses');
  const [loading, setLoading] = useState(true);

  // Form states
  const [courseForm, setCourseForm] = useState({ id: '', title: '', slug: '', description: '' });
  const [vocabForm, setVocabForm] = useState({
    id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '',
    topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1', vocab_course_id: ''
  });
  const [bulkText, setBulkText] = useState('');
  const [bulkCourseId, setBulkCourseId] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await api.vocabulary.listCourses();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
        setBulkCourseId(data[0].id);
        loadWords(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWords(courseId: string) {
    try {
      const data = await api.vocabulary.list({ vocab_course_id: courseId });
      setWords(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (courseForm.id) {
        await api.vocabulary.updateCourse(courseForm.id, courseForm);
      } else {
        await api.vocabulary.createCourse(courseForm);
      }
      setCourseForm({ id: '', title: '', slug: '', description: '' });
      loadCourses();
    } catch (err) {
      alert("Lỗi khi lưu khóa học.");
    }
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này? Tất cả từ vựng trong đó cũng sẽ bị xóa.")) return;
    try {
      await api.vocabulary.deleteCourse(id);
      loadCourses();
    } catch (err) {
      alert("Lỗi khi xóa khóa học.");
    }
  }

  async function handleSaveVocab(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...vocabForm, vocab_course_id: vocabForm.vocab_course_id || selectedCourseId };
      await api.vocabulary.upsert(payload);
      setVocabForm({
        id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '',
        topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1', vocab_course_id: selectedCourseId
      });
      loadWords(selectedCourseId);
      setActiveTab('list');
    } catch (err) {
      alert("Lỗi khi lưu từ vựng.");
    }
  }

  async function handleDeleteVocab(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa từ vựng này?")) return;
    try {
      await api.vocabulary.delete(id);
      loadWords(selectedCourseId);
    } catch (err) {
      alert("Lỗi khi xóa từ vựng.");
    }
  }

  function parseBulkWords(text: string) {
    try {
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        return JSON.parse(text);
      }
      return text.trim().split('\n').map(line => {
        const [word, def, defVi, ex, exVi, pos, pron, lvl, tpc] = line.split('|');
        return {
          word: word?.trim(),
          definition: def?.trim() || '',
          definition_vi: defVi?.trim() || '',
          example: ex?.trim() || '',
          example_vi: exVi?.trim() || '',
          part_of_speech: pos?.trim() || 'N',
          pronunciation: pron?.trim() || '',
          level: lvl?.trim() || 'A1',
          topic: tpc?.trim() || 'General'
        };
      }).filter(w => w.word);
    } catch (e) {
      throw new Error("Định dạng dữ liệu không hợp lệ.");
    }
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    try {
      const parsed = parseBulkWords(bulkText);
      await api.vocabulary.bulkImport(bulkCourseId, parsed);
      setBulkText('');
      alert(`Đã nhập thành công ${parsed.length} từ vựng!`);
      setSelectedCourseId(bulkCourseId);
      loadWords(bulkCourseId);
      setActiveTab('list');
    } catch (err: any) {
      alert(err.message || "Lỗi khi nhập hàng loạt.");
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Vocabulary Manager</h1>
          <p className="text-slate-500 font-medium">Hệ thống quản lý từ vựng và đa khóa học từ vựng cho IELTS, TOEIC...</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['courses', 'list', 'add', 'bulk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-black transition-all border-b-2 uppercase tracking-wider ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'courses' ? 'Khóa Học từ vựng' : tab === 'list' ? 'Danh Sách Từ Vựng' : tab === 'add' ? 'Thêm Từ Thủ Công' : 'Nhập Hàng Loạt'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h2 className="text-lg font-black text-slate-900 mb-6">
              {courseForm.id ? 'Cập Nhật Khóa Học' : 'Tạo Khóa Học Mới'}
            </h2>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Tên Khóa Học</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g. TOEIC Essential Words"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Slug</label>
                <input
                  type="text"
                  required
                  value={courseForm.slug}
                  onChange={e => setCourseForm({ ...courseForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                  placeholder="e.g. toeic"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Mô Tả</label>
                <textarea
                  value={courseForm.description}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt nội dung..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition-all"
              >
                Lưu Khóa Học
              </button>
            </form>
          </div>

          {/* Courses List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6">Danh Sách Khóa Học Hiện Có</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase">Tên</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase">Slug</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-all">
                      <td className="p-4 font-black text-slate-800">{course.title}</td>
                      <td className="p-4 font-semibold text-indigo-600">/{course.slug}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setCourseForm({ id: course.id, title: course.title, slug: course.slug, description: course.description || '' })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-black transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-black transition-all"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="flex gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-400 uppercase">Chọn Khóa Học:</span>
              <select
                value={selectedCourseId}
                onChange={e => {
                  setSelectedCourseId(e.target.value);
                  loadWords(e.target.value);
                }}
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-600 focus:outline-none"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <span className="text-xs font-bold text-slate-400">{words.length} từ vựng</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[15%]">Từ</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[10%]">Loại</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[10%]">Level</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[25%]">Định Nghĩa</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[25%]">Bản Dịch</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase text-right w-[15%]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map(w => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                      <td className="p-4 font-black text-slate-800">{w.word}</td>
                      <td className="p-4 font-bold text-slate-500">{w.part_of_speech}</td>
                      <td className="p-4 font-bold text-indigo-600">{w.level}</td>
                      <td className="p-4 text-sm text-slate-600 line-clamp-2">{w.definition}</td>
                      <td className="p-4 text-sm text-slate-600">{w.definition_vi}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setVocabForm({ ...w, vocab_course_id: w.vocab_course_id || selectedCourseId } as any);
                            setActiveTab('add');
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-black transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteVocab(w.id)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-black transition-all"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleSaveVocab} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900">
            {vocabForm.id ? 'Cập Nhật Từ Vựng' : 'Thêm Từ Vựng Thủ Công'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Khóa Học Đích</label>
              <select
                value={vocabForm.vocab_course_id || selectedCourseId}
                onChange={e => setVocabForm({ ...vocabForm, vocab_course_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Từ Vựng</label>
              <input
                type="text"
                required
                value={vocabForm.word}
                onChange={e => setVocabForm({ ...vocabForm, word: e.target.value })}
                placeholder="e.g. meticulous"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Phiên Âm</label>
              <input
                type="text"
                value={vocabForm.pronunciation}
                onChange={e => setVocabForm({ ...vocabForm, pronunciation: e.target.value })}
                placeholder="e.g. /məˈtɪkjələs/"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loại Từ (Part of speech)</label>
              <select
                value={vocabForm.part_of_speech}
                onChange={e => setVocabForm({ ...vocabForm, part_of_speech: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600"
              >
                <option value="N">Danh từ (Noun)</option>
                <option value="V">Động từ (Verb)</option>
                <option value="ADJ">Tính từ (Adjective)</option>
                <option value="ADV">Trạng từ (Adverb)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Trình Độ (CEFR)</label>
              <select
                value={vocabForm.level}
                onChange={e => setVocabForm({ ...vocabForm, level: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Chủ Đề (Topic)</label>
              <input
                type="text"
                value={vocabForm.topic}
                onChange={e => setVocabForm({ ...vocabForm, topic: e.target.value })}
                placeholder="e.g. Education, Technology"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Định Nghĩa Tiếng Anh</label>
              <textarea
                required
                value={vocabForm.definition}
                onChange={e => setVocabForm({ ...vocabForm, definition: e.target.value })}
                placeholder="English definition..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Dịch Tiếng Việt</label>
              <textarea
                required
                value={vocabForm.definition_vi}
                onChange={e => setVocabForm({ ...vocabForm, definition_vi: e.target.value })}
                placeholder="Nghĩa tiếng Việt..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Ví Dụ Tiếng Anh</label>
              <textarea
                value={vocabForm.example}
                onChange={e => setVocabForm({ ...vocabForm, example: e.target.value })}
                placeholder="English example sentence..."
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Ví Dụ Dịch Tiếng Việt</label>
              <textarea
                value={vocabForm.example_vi}
                onChange={e => setVocabForm({ ...vocabForm, example_vi: e.target.value })}
                placeholder="Ví dụ dịch tiếng Việt..."
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all"
          >
            Lưu Từ Vựng
          </button>
        </form>
      )}

      {activeTab === 'bulk' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900">Nhập Từ Vựng Hàng Loạt</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Chọn Khóa Học Đích</label>
              <select
                value={bulkCourseId}
                onChange={e => setBulkCourseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="font-black text-slate-600 uppercase block mb-1">Hướng dẫn định dạng Pipe-separated:</span>
              <code className="block bg-slate-50 p-2 rounded-lg font-mono">
                word | definition | definition_vi | example | example_vi | part_of_speech | pronunciation | level | topic
              </code>
              <span className="block mt-1">Hoặc có thể nhập trực tiếp mảng JSON tiêu chuẩn.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Dữ Liệu Nhập</label>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={`Apple | A round red fruit | Quả táo | I ate an apple | Tôi đã ăn một quả táo | N | /ˈæp.əl/ | A1 | Food\nBanana | A long yellow fruit | Quả chuối | Monkeys like bananas | Khỉ thích chuối | N | /bəˈnæn.ə/ | A1 | Food`}
              rows={12}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:outline-none focus:bg-white focus:border-indigo-300 transition-all"
            />
          </div>

          <button
            onClick={handleBulkImport}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-sm"
          >
            Tiến Hành Nhập Hàng Loạt
          </button>
        </div>
      )}
    </div>
  );
}
