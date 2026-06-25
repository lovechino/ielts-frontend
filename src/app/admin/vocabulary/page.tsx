'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, BulkImportResult, VocabularyCourse, Vocabulary } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkValidationResult {
  valid: number;
  duplicates: string[];
  errors: string[];
  preview: Partial<Vocabulary>[];
}

type BulkImportSummary = {
  count: number;
  mapped?: number;
  failed: number;
  missing?: string[];
  missing_count?: number;
  errors: BulkImportResult['errors'];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBulkWords(text: string): Partial<Vocabulary>[] {
  if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  return text.trim().split('\n')
    .map(line => {
      const delimiter = line.includes('|') ? '|' : ',';
      const [word, def, defVi, ex, exVi, pos, pron, lvl, tpc] = splitBulkLine(line, delimiter);
      return {
        word: word?.trim(),
        definition: def?.trim() || '',
        definition_vi: defVi?.trim() || '',
        example: ex?.trim() || '',
        example_vi: exVi?.trim() || '',
        part_of_speech: pos?.trim() || 'N',
        pronunciation: pron?.trim() || '',
        level: lvl?.trim() || 'A1',
        topic: tpc?.trim() || 'General',
      };
    })
    .filter(w => w.word);
}

function splitBulkLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function validateBulkWords(words: Partial<Vocabulary>[]): BulkValidationResult {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const errors: string[] = [];
  const valid: Partial<Vocabulary>[] = [];

  words.forEach((w, i) => {
    if (!w.word?.trim()) { errors.push(`Dòng ${i + 1}: thiếu từ`); return; }
    if (seen.has(w.word.toLowerCase())) {
      duplicates.push(w.word); return;
    }
    seen.add(w.word.toLowerCase());
    valid.push(w);
  });

  return { valid: valid.length, duplicates, errors, preview: valid.slice(0, 5) };
}

function getValidBulkWords(words: Partial<Vocabulary>[]) {
  const seen = new Set<string>();
  return words.filter((w) => {
    const word = w.word?.trim();
    if (!word) return false;
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminVocabularyPage() {
  const [courses, setCourses] = useState<VocabularyCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'list' | 'add' | 'attach' | 'bulk' | 'export' | 'publish'>('courses');
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Publish state
  const [draftCount, setDraftCount] = useState(0);
  const [publishing, setPublishing] = useState(false);

  // Course form
  const [courseForm, setCourseForm] = useState({ id: '', title: '', slug: '', description: '' });

  // Vocab form
  const [vocabForm, setVocabForm] = useState({
    id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '',
    topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1', vocab_course_id: '',
    is_priority: false, is_academic: false,
  });

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [bulkValidation, setBulkValidation] = useState<BulkValidationResult | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0); // 0-100
  const [bulkDone, setBulkDone] = useState<BulkImportSummary | null>(null);

  // Attach existing master words to a course
  const [attachQuery, setAttachQuery] = useState('');
  const [attachResults, setAttachResults] = useState<Vocabulary[]>([]);
  const [attachSelected, setAttachSelected] = useState<Record<string, Vocabulary>>({});
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachCourseId, setAttachCourseId] = useState('');
  const [attachMessage, setAttachMessage] = useState('');

  // Export state
  const [exportCourseId, setExportCourseId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // Word list search/filter
  const [wordSearch, setWordSearch] = useState('');
  const [wordPage, setWordPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => { 
    loadCourses(); 
    checkDrafts();
  }, []);

  async function checkDrafts() {
    try {
      const allWords = await api.vocabulary.searchAdmin('');
      const count = allWords.filter(w => w.status === 'draft').length;
      setDraftCount(count);
    } catch {}
  }

  async function handlePublish() {
    if (!confirm(`Bạn có chắc muốn phát hành ${draftCount} từ vựng mới?`)) return;
    setPublishing(true);
    try {
      await api.vocabulary.publish();
      alert('Phát hành thành công!');
      checkDrafts();
      if (selectedCourseId) loadWords(selectedCourseId);
    } catch {
      alert('Lỗi khi phát hành.');
    } finally {
      setPublishing(false);
    }
  }

  async function loadCourses(forceSelectId?: string) {
    setLoading(true);
    try {
      const data = await api.vocabulary.listCourses();
      setCourses(data);
      if (data.length > 0) {
        // Keep selected course if it still exists or force select new one, otherwise default to first course
        const targetId = forceSelectId || (selectedCourseId && data.find(c => c.id === selectedCourseId) ? selectedCourseId : data[0].id);
        const shouldReloadWords = targetId !== selectedCourseId || forceSelectId;
        setSelectedCourseId(targetId);
        setBulkCourseId(targetId);
        setAttachCourseId(targetId);
        setExportCourseId(targetId);
        if (shouldReloadWords) loadWords(targetId);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadWords(courseId: string) {
    setWordsLoading(true);
    setWordPage(0);
    try {
      const data = await api.vocabulary.list({ vocab_course_id: courseId, limit: 2000 });
      setWords(data);
    } catch (err) { console.error(err); }
    finally { setWordsLoading(false); }
  }

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        title: courseForm.title.trim(),
        slug: courseForm.slug.trim(),
        description: courseForm.description.trim(),
      };
      if (courseForm.id) await api.vocabulary.updateCourse(courseForm.id, payload);
      else await api.vocabulary.createCourse(payload);
      setCourseForm({ id: '', title: '', slug: '', description: '' });
      loadCourses();
    } catch { alert('Lỗi khi lưu khóa học.'); }
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('Xóa khóa học này? Tất cả từ vựng trong đó cũng sẽ bị xóa.')) return;
    try { await api.vocabulary.deleteCourse(id); loadCourses(); }
    catch { alert('Lỗi khi xóa khóa học.'); }
  }

  function selectCourseForAction(courseId: string, tab: 'list' | 'add' | 'attach' | 'bulk') {
    setSelectedCourseId(courseId);
    setBulkCourseId(courseId);
    setAttachCourseId(courseId);
    setExportCourseId(courseId);
    setBulkDone(null);
    setAttachMessage('');
    if (tab === 'add') {
      setVocabForm({
        id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '',
        topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1',
        vocab_course_id: courseId, is_priority: false, is_academic: false,
      });
    }
    if (tab === 'list') loadWords(courseId);
    setActiveTab(tab);
  }

  async function handleSaveVocab(e: React.FormEvent) {
    e.preventDefault();
    try {
      const targetCourseId = vocabForm.vocab_course_id || selectedCourseId;
      const { vocab_course_id: _ignoredCourseId, ...masterWord } = vocabForm;
      await api.vocabulary.upsert(masterWord);
      if (targetCourseId && masterWord.word) {
        await api.vocabulary.bulkImport(targetCourseId, [{ word: masterWord.word }]);
      }
      setVocabForm({ 
        id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '', 
        topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1', 
        vocab_course_id: targetCourseId, is_priority: false, is_academic: false 
      });
      loadWords(targetCourseId);
      checkDrafts();
      setActiveTab('list');
    } catch { alert('Loi khi luu tu vung.'); }
  }

  async function handleDeleteVocab(id: string) {
    if (!confirm('Go tu nay khoi khoa hoc hien tai? Tu goc trong master dictionary van duoc giu lai.')) return;
    try { await api.vocabulary.removeFromCourse(selectedCourseId, id); loadWords(selectedCourseId); loadCourses(selectedCourseId); }
    catch { alert('Loi khi go tu khoi khoa hoc.'); }
  }

  // ── Bulk Import Pro ──────────────────────────────────────────────────────────

  function handleBulkTextChange(text: string) {
    setBulkText(text);
    setBulkDone(null);
    if (!text.trim()) { setBulkValidation(null); return; }
    try {
      const parsed = parseBulkWords(text);
      setBulkValidation(validateBulkWords(parsed));
    } catch {
      setBulkValidation({ valid: 0, duplicates: [], errors: ['Định dạng JSON không hợp lệ'], preview: [] });
    }
  }

  async function handleBulkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleBulkTextChange(text);
    e.target.value = '';
  }

  async function handleBulkImport() {
    if (!bulkText.trim() || !bulkValidation || bulkValidation.valid === 0) return;
    setBulkImporting(true);
    setBulkProgress(0);
    setBulkDone(null);

    try {
      const allWords = parseBulkWords(bulkText);
      const validWords = getValidBulkWords(allWords);

      // Chunk into Worker-safe request sizes while keeping imports fast.
      const CHUNK = 500;
      let imported = 0;
      let processed = 0;
      let failed = 0;
      const importErrors: BulkImportResult['errors'] = [];
      for (let i = 0; i < validWords.length; i += CHUNK) {
        const chunk = validWords.slice(i, i + CHUNK);
        const result = await api.vocabulary.bulkImport(bulkCourseId, chunk);
        imported += result.mapped ?? result.count;
        processed += chunk.length;
        failed += result.failed || result.missing_count || 0;
        importErrors.push(...(result.errors || []).map(error => ({ ...error, index: error.index + i })));
        if (result.missing?.length) {
          importErrors.push(...result.missing.slice(0, 20).map((word, index) => ({
            index: i + index,
            word,
            message: 'Not found in master dictionary',
          })));
        }
        setBulkProgress(Math.round((processed / validWords.length) * 100));
      }

      setBulkDone({ count: imported, mapped: imported, failed, errors: importErrors.slice(0, 20) });
      setBulkText('');
      setBulkValidation(null);
      setSelectedCourseId(bulkCourseId);
      loadWords(bulkCourseId);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập hàng loạt.');
    } finally {
      setBulkImporting(false);
      setBulkProgress(0);
    }
  }

  // ── Dictionary Export ────────────────────────────────────────────────────────

  async function handleAttachSearch() {
    const query = attachQuery.trim();
    if (!query) return;
    setAttachLoading(true);
    setAttachMessage('');
    try {
      const results = await api.vocabulary.searchAdmin(query);
      setAttachResults(results.slice(0, 80));
    } catch (err: any) {
      setAttachMessage(err.message || 'Search failed.');
    } finally {
      setAttachLoading(false);
    }
  }

  function toggleAttachWord(word: Vocabulary) {
    setAttachSelected((prev) => {
      const next = { ...prev };
      if (next[word.id]) delete next[word.id];
      else next[word.id] = word;
      return next;
    });
  }

  async function handleAttachSelected() {
    const selected = Object.values(attachSelected);
    if (!attachCourseId || selected.length === 0) return;
    setAttachLoading(true);
    setAttachMessage('');
    try {
      const result = await api.vocabulary.bulkImport(attachCourseId, selected.map((item) => ({ word: item.word })));
      setAttachSelected({});
      setAttachMessage(`Mapped ${result.mapped ?? result.count} words. Missing ${result.missing_count || 0}.`);
      setSelectedCourseId(attachCourseId);
      await loadWords(attachCourseId);
      await loadCourses(attachCourseId);
    } catch (err: any) {
      setAttachMessage(err.message || 'Attach failed.');
    } finally {
      setAttachLoading(false);
    }
  }

  async function handleExportSQL() {
    setExporting(true);
    setExportMsg('Đang tạo file SQL...');
    try {
      const token = getAccessToken();
      const url = api.vocabulary.exportSqlUrl(exportCourseId || undefined);
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dictionary_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(a.href);
      setExportMsg('✓ Tải xuống thành công! Dùng file .sql này để đóng gói dictionary.db.');
    } catch (err: any) {
      setExportMsg(`Lỗi: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  // ── Filtered word list ───────────────────────────────────────────────────────

  const filteredWords = words.filter(w =>
    !wordSearch || w.word.toLowerCase().includes(wordSearch.toLowerCase()) ||
    (w.definition_vi || '').toLowerCase().includes(wordSearch.toLowerCase())
  );
  const pagedWords = filteredWords.slice(wordPage * PAGE_SIZE, (wordPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredWords.length / PAGE_SIZE);

  // ── Render ───────────────────────────────────────────────────────────────────

  const TABS = [
    { key: 'courses', label: 'Khóa Học' },
    { key: 'list',    label: 'Danh Sách Từ' },
    { key: 'publish', label: `🚀 Phát Hành (${draftCount})` },
    { key: 'add',     label: 'Thêm Thủ Công' },
    { key: 'attach',  label: 'Gan Tu Goc' },
    { key: 'bulk',    label: 'Nhập Hàng Loạt' },
    { key: 'export',  label: '📦 Xuất Dictionary' },
  ] as const;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Vocabulary Command Center</h1>
          <p className="text-slate-500 font-medium">Quản lý từ vựng, bulk import, và đóng gói dictionary.db cho Mobile.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-indigo-600">{words.length.toLocaleString()}</p>
          <p className="text-xs font-black text-slate-400 uppercase">từ trong khóa hiện tại</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`pb-4 px-4 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: COURSES ── */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h2 className="text-lg font-black text-slate-900 mb-6">{courseForm.id ? 'Cập Nhật' : 'Tạo Khóa Học Mới'}</h2>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              {(['title', 'slug', 'description'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">{field === 'title' ? 'Tên' : field === 'slug' ? 'Slug' : 'Mô Tả'}</label>
                  {field === 'description' ? (
                    <textarea rows={3} value={courseForm[field]} onChange={e => setCourseForm({ ...courseForm, [field]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                  ) : (
                    <input type="text" required value={courseForm[field]}
                      onChange={e => setCourseForm({ ...courseForm, [field]: field === 'slug' ? e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') : e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                  )}
                </div>
              ))}
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition-all">Lưu Khóa Học</button>
              {courseForm.id && <button type="button" onClick={() => setCourseForm({ id: '', title: '', slug: '', description: '' })} className="w-full py-2 text-slate-400 text-sm font-bold">Hủy chỉnh sửa</button>}
            </form>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6">Danh Sách Khóa Học ({courses.length})</h2>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-black text-slate-500 uppercase">Tên</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase">Slug</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase text-right">Thao Tác</th>
              </tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                    <td className="p-4 font-black text-slate-800">{c.title}</td>
                    <td className="p-4 font-semibold text-indigo-600">/{c.slug}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => selectCourseForAction(c.id, 'list')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black transition-all">Xem t&#7915;</button>
                      <button onClick={() => selectCourseForAction(c.id, 'add')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-black transition-all">+ Th&#234;m t&#7915;</button>
                      <button onClick={() => selectCourseForAction(c.id, 'attach')} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-black transition-all">Gan tu goc</button>
                      <button onClick={() => selectCourseForAction(c.id, 'bulk')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-black transition-all">Nh&#7853;p nhanh</button>
                      <button onClick={() => setCourseForm({ id: c.id, title: c.title, slug: c.slug, description: c.description || '' })} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-black transition-all">Sửa</button>
                      <button onClick={() => handleDeleteCourse(c.id)} className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-black transition-all">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: LIST ── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); loadWords(e.target.value); }}
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-600">
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input type="text" placeholder="Tìm từ hoặc nghĩa..." value={wordSearch} onChange={e => { setWordSearch(e.target.value); setWordPage(0); }}
              className="flex-1 min-w-[200px] px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
            <span className="text-xs font-bold text-slate-400">{filteredWords.length.toLocaleString()} / {words.length.toLocaleString()} từ</span>
          </div>

          {wordsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[18%]">Từ</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[8%]">Loại</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[8%]">Level</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[28%]">Định Nghĩa EN</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase w-[28%]">Dịch VI</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase text-right w-[10%]">Thao Tác</th>
                  </tr></thead>
                  <tbody>
                    {pagedWords.map(w => (
                      <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800">{w.word}</span>
                            {w.status === 'draft' && (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-1">DRAFT</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-500 text-xs">{w.part_of_speech}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{w.level}</span>
                            {w.is_priority && <span className="w-2 h-2 rounded-full bg-indigo-500" title="Priority"></span>}
                            {w.is_academic && <span className="w-2 h-2 rounded-full bg-blue-500" title="Academic"></span>}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate">{w.definition}</td>
                        <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate">{w.definition_vi}</td>
                        <td className="p-4 text-right space-x-1">
                          <button onClick={() => { setVocabForm({ ...w, vocab_course_id: w.vocab_course_id || selectedCourseId } as any); setActiveTab('add'); }}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-black transition-all">Sửa</button>
                          <button onClick={() => handleDeleteVocab(w.id)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-black transition-all">Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <button disabled={wordPage === 0} onClick={() => setWordPage(p => p - 1)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-black disabled:opacity-40">← Trước</button>
                  <span className="text-sm font-bold text-slate-500">Trang {wordPage + 1} / {totalPages}</span>
                  <button disabled={wordPage >= totalPages - 1} onClick={() => setWordPage(p => p + 1)} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-black disabled:opacity-40">Sau →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PUBLISH CENTER ── */}
      {activeTab === 'publish' && (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
          <div className="bg-indigo-600 text-white p-12 rounded-[3rem] shadow-xl shadow-indigo-100">
            <h2 className="text-4xl font-black mb-4">Publish Center</h2>
            <p className="text-indigo-100 font-medium mb-8">
              Bạn đang có <span className="text-white font-black text-2xl underline underline-offset-8">{draftCount}</span> từ vựng đang chờ phát hành.
            </p>
            <button onClick={handlePublish} disabled={publishing || draftCount === 0}
              className="px-12 py-5 bg-white text-indigo-600 font-black rounded-2xl text-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
              {publishing ? 'Đang phát hành...' : '🚀 PHÁT HÀNH NGAY'}
            </button>
            <p className="mt-8 text-xs text-indigo-200 font-bold uppercase tracking-widest">
              Sau khi nhấn, tất cả User Mobile sẽ nhận được bản cập nhật Incremental Sync.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-left">
            <h3 className="text-amber-700 font-black text-sm uppercase mb-3">Lưu ý về Incremental Sync</h3>
            <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
              <li>Chỉ những từ có trạng thái <span className="font-bold">published</span> mới được sync xuống Mobile.</li>
              <li>Khi bạn Sửa (Update) một từ, nó sẽ tự động chuyển về <span className="font-bold">draft</span>.</li>
              <li>Bạn phải nhấn Phát hành để chuyển tất cả draft → published và tăng version.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── TAB: ADD ── */}
      {activeTab === 'add' && (
        <form onSubmit={handleSaveVocab} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900">{vocabForm.id ? 'Cập Nhật Từ Vựng' : 'Thêm Từ Vựng Thủ Công'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Khóa Học Đích</label>
              <select value={vocabForm.vocab_course_id || selectedCourseId} onChange={e => setVocabForm({ ...vocabForm, vocab_course_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Từ Vựng *</label>
              <input type="text" required value={vocabForm.word} onChange={e => setVocabForm({ ...vocabForm, word: e.target.value })} placeholder="e.g. meticulous" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Phiên Âm IPA</label>
              <input type="text" value={vocabForm.pronunciation} onChange={e => setVocabForm({ ...vocabForm, pronunciation: e.target.value })} placeholder="/məˈtɪkjələs/" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loại Từ</label>
              <select value={vocabForm.part_of_speech} onChange={e => setVocabForm({ ...vocabForm, part_of_speech: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                <option value="N">Danh từ (N)</option><option value="V">Động từ (V)</option>
                <option value="ADJ">Tính từ (ADJ)</option><option value="ADV">Trạng từ (ADV)</option>
                <option value="PREP">Giới từ (PREP)</option><option value="CONJ">Liên từ (CONJ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Trình Độ CEFR</label>
              <select value={vocabForm.level} onChange={e => setVocabForm({ ...vocabForm, level: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Chủ Đề</label>
              <input type="text" value={vocabForm.topic} onChange={e => setVocabForm({ ...vocabForm, topic: e.target.value })} placeholder="Education, Technology..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={vocabForm.is_priority} onChange={e => setVocabForm({ ...vocabForm, is_priority: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-black text-slate-600 group-hover:text-indigo-600 transition-colors">Priority (Casual/Common)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={vocabForm.is_academic} onChange={e => setVocabForm({ ...vocabForm, is_academic: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-black text-slate-600 group-hover:text-blue-600 transition-colors">Academic (IELTS)</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[['definition','Định Nghĩa Tiếng Anh *','English definition...'],['definition_vi','Dịch Tiếng Việt *','Nghĩa tiếng Việt...'],['example','Ví Dụ Tiếng Anh','English example...'],['example_vi','Ví Dụ Dịch VI','Ví dụ dịch tiếng Việt...']].map(([field, label, ph]) => (
              <div key={field}>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">{label}</label>
                <textarea rows={field.startsWith('example') ? 2 : 3} required={label.endsWith('*')} value={(vocabForm as any)[field]} onChange={e => setVocabForm({ ...vocabForm, [field]: e.target.value })} placeholder={ph} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all">Lưu Từ Vựng</button>
            {vocabForm.id && <button type="button" onClick={() => setVocabForm({ id: '', word: '', definition: '', definition_vi: '', example: '', example_vi: '', topic: 'General', pronunciation: '', part_of_speech: 'N', level: 'A1', vocab_course_id: selectedCourseId, is_priority: false, is_academic: false })} className="px-8 py-4 bg-slate-100 text-slate-600 font-black text-sm rounded-xl">Hủy</button>}
          </div>
        </form>
      )}

      {/* ── TAB: BULK IMPORT PRO ── */}
      {activeTab === 'attach' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Gan tu goc vao khoa</h2>
                <p className="text-slate-500 text-sm mt-1">Tim trong master dictionary 450k va gan vao khoa con bang mapping.</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-600">{Object.keys(attachSelected).length}</p>
                <p className="text-xs font-black text-slate-400 uppercase">da chon</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_auto] gap-3">
              <select value={attachCourseId} onChange={e => setAttachCourseId(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input
                value={attachQuery}
                onChange={e => setAttachQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAttachSearch(); }}
                placeholder="Search master word, e.g. academic"
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
              />
              <button type="button" onClick={handleAttachSearch} disabled={attachLoading || !attachQuery.trim()}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black disabled:opacity-50">
                Search
              </button>
            </div>

            {attachMessage && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
                {attachMessage}
              </div>
            )}

            <div className="max-h-[460px] overflow-auto rounded-2xl border border-slate-100">
              {attachResults.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-slate-400">Search master dictionary to attach words.</div>
              ) : (
                attachResults.map(word => {
                  const selected = Boolean(attachSelected[word.id]);
                  return (
                    <button
                      key={word.id}
                      type="button"
                      onClick={() => toggleAttachWord(word)}
                      className={`flex w-full items-center gap-4 border-b border-slate-100 px-4 py-3 text-left transition-all ${selected ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <span className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs font-black ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent'}`}>✓</span>
                      <span className="w-48 truncate font-black text-slate-800">{word.word}</span>
                      <span className="w-20 rounded-full bg-slate-100 px-2 py-0.5 text-center text-[10px] font-black text-slate-500">{word.level || '-'}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-500">{word.definition_vi || word.definition}</span>
                    </button>
                  );
                })
              )}
            </div>

            <button type="button" onClick={handleAttachSelected} disabled={attachLoading || !attachCourseId || Object.keys(attachSelected).length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-sm">
              {attachLoading ? 'Dang xu ly...' : `Gan ${Object.keys(attachSelected).length} tu vao khoa`}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Bulk Import Pro</h2>
                <p className="text-slate-500 text-sm mt-1">Nhập hàng nghìn từ cùng lúc. Hỗ trợ JSON array và Pipe-separated format.</p>
              </div>
              {bulkDone && (
                <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-center">
                  <p className="text-2xl font-black text-emerald-600">+{bulkDone.count.toLocaleString()}</p>
                  {bulkDone.failed > 0 && <p className="mt-1 text-xs font-black text-red-500">{bulkDone.failed} errors</p>}
                  <p className="text-xs font-black text-emerald-500 uppercase">Từ đã nhập</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Khóa Học Đích</label>
                <select value={bulkCourseId} onChange={e => setBulkCourseId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-100">
                  Upload file .json/.csv/.txt
                  <input type="file" accept=".json,.csv,.txt" onChange={handleBulkFileChange} className="hidden" />
                </label>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl text-xs font-mono text-emerald-400 leading-relaxed">
                <p className="text-slate-400 font-black uppercase mb-2">Pipe format:</p>
                <p>word | definition | definition_vi | example | example_vi | pos | ipa | level | topic</p>
                <p className="text-slate-500 mt-2">JSON array: [&#123;&quot;word&quot;:&quot;...&quot;,&quot;definition_vi&quot;:&quot;...&quot;&#125;]</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-400 uppercase">Dữ Liệu Nhập</label>
                {bulkText && <span className="text-xs text-slate-400">{bulkText.split('\n').filter(Boolean).length} dòng</span>}
              </div>
              <textarea value={bulkText} onChange={e => handleBulkTextChange(e.target.value)} rows={14}
                placeholder="Dán dữ liệu vào đây..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:outline-none focus:bg-white focus:border-indigo-300 transition-all" />
            </div>

            {/* Validation Panel */}
            {bulkValidation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <p className="text-xs font-black text-emerald-500 uppercase mb-1">Hợp lệ</p>
                  <p className="text-3xl font-black text-emerald-600">{bulkValidation.valid.toLocaleString()}</p>
                  <p className="text-xs text-emerald-500 mt-1">từ sẽ được nhập</p>
                </div>
                <div className={`border p-4 rounded-2xl ${bulkValidation.duplicates.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xs font-black text-amber-500 uppercase mb-1">Trùng lặp (bỏ qua)</p>
                  <p className="text-3xl font-black text-amber-600">{bulkValidation.duplicates.length}</p>
                  {bulkValidation.duplicates.length > 0 && <p className="text-xs text-amber-500 mt-1 truncate">{bulkValidation.duplicates.slice(0,3).join(', ')}{bulkValidation.duplicates.length > 3 ? '...' : ''}</p>}
                </div>
                <div className={`border p-4 rounded-2xl ${bulkValidation.errors.length > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xs font-black text-red-500 uppercase mb-1">Lỗi</p>
                  <p className="text-3xl font-black text-red-600">{bulkValidation.errors.length}</p>
                  {bulkValidation.errors.length > 0 && <p className="text-xs text-red-500 mt-1">{bulkValidation.errors[0]}</p>}
                </div>
              </div>
            )}

            {/* Preview */}
            {bulkValidation && bulkValidation.preview.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-black text-slate-400 uppercase mb-3">Preview (5 từ đầu)</p>
                <div className="space-y-2">
                  {bulkValidation.preview.map((w, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100">
                      <span className="font-black text-slate-800 w-32 truncate">{w.word}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black">{w.level || 'A1'}</span>
                      <span className="text-sm text-slate-500 flex-1 truncate">{w.definition_vi || w.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(bulkDone?.errors?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="mb-3 text-xs font-black uppercase text-red-500">Import errors</p>
                <div className="max-h-44 space-y-2 overflow-auto">
                  {(bulkDone?.errors ?? []).map((error, i) => (
                    <div key={`${error.index}-${i}`} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-red-600">
                      Row {error.index + 1}{error.word ? ` (${error.word})` : ''}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress bar */}
            {bulkImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-slate-500">
                  <span>Đang nhập...</span><span>{bulkProgress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }} />
                </div>
              </div>
            )}

            <button onClick={handleBulkImport} disabled={bulkImporting || !bulkValidation || bulkValidation.valid === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-sm">
              {bulkImporting ? `Đang nhập... ${bulkProgress}%` : `Nhập ${bulkValidation?.valid?.toLocaleString() || 0} Từ Vựng`}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: DICTIONARY EXPORT ── */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-black mb-2">📦 Dictionary Export Pipeline</h2>
            <p className="text-slate-400 text-sm mb-6">Đóng gói toàn bộ từ vựng thành file SQL để build dictionary.db cho Mobile app.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Export SQL', desc: 'Tải file .sql chứa toàn bộ INSERT statements', color: 'bg-indigo-500' },
                { step: '2', title: 'Build SQLite', desc: 'Chạy: sqlite3 dictionary.db < file.sql', color: 'bg-violet-500' },
                { step: '3', title: 'Nén file', desc: 'gzip dictionary.db → dictionary.db.gz (~18MB)', color: 'bg-blue-500' },
                { step: '4', title: 'Upload R2', desc: 'Upload lên Cloudflare R2 / CDN', color: 'bg-emerald-500' },
              ].map(s => (
                <div key={s.step} className="bg-white/5 rounded-2xl p-4">
                  <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center font-black text-sm mb-3`}>{s.step}</div>
                  <p className="font-black text-sm mb-1">{s.title}</p>
                  <p className="text-slate-400 text-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900">Tải File SQL Export</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Khóa Học (để trống = xuất tất cả)</label>
                <select value={exportCourseId} onChange={e => setExportCourseId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
                  <option value="">Tất cả khóa học</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <div className="bg-slate-50 rounded-xl p-4 w-full text-sm">
                  <p className="font-black text-slate-700 mb-1">Lệnh build SQLite (macOS/Linux):</p>
                  <code className="text-xs font-mono text-indigo-600 block">sqlite3 dictionary.db &lt; dictionary_YYYY-MM-DD.sql</code>
                </div>
              </div>
            </div>

            {exportMsg && (
              <div className={`p-4 rounded-xl font-bold text-sm ${exportMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {exportMsg}
              </div>
            )}

            <button onClick={handleExportSQL} disabled={exporting}
              className="w-full py-4 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-3">
              {exporting ? (
                <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /><span>Đang tạo file...</span></>
              ) : (
                <><span>⬇</span><span>Tải Xuống dictionary.sql</span></>
              )}
            </button>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-black text-amber-600 uppercase mb-2">⚠ Lưu ý quan trọng</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>File SQL có thể lớn (100k từ ≈ 30-50MB). Quá trình tạo mất 10-30 giây.</li>
                <li>Sau khi build dictionary.db, cần upload lên Cloudflare R2 hoặc CDN.</li>
                <li>Cập nhật URL trong <code className="font-mono bg-amber-100 px-1 rounded">useDownloadStore.ts</code> của Mobile app.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
