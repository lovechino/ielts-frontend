'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Lesson, Course } from '@/lib/api';

// ── helpers ──────────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { emoji: string; color: string; bg: string }> = {
  reading:   { emoji: '📖', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  listening: { emoji: '🎧', color: 'text-amber-700',   bg: 'bg-amber-50'   },
  writing:   { emoji: '✍️', color: 'text-indigo-700',  bg: 'bg-indigo-50'  },
  speaking:  { emoji: '🎤', color: 'text-violet-700',  bg: 'bg-violet-50'  },
};

const TYPE_META: Record<string, { label: string; color: string }> = {
  mini:     { label: 'Mini',     color: 'bg-orange-100 text-orange-700' },
  full:     { label: 'Full',     color: 'bg-red-100 text-red-700'       },
  practice: { label: 'Practice', color: 'bg-blue-100 text-blue-700'     },
};

// ── Modal: New Test ───────────────────────────────────────────────────────────

interface NewTestModalProps {
  courses: Course[];
  defaultCourseId?: string;
  onClose: () => void;
  onCreated: (lessonId: string) => void;
}

const ALL_PARTS = [1, 2, 3];
const PARTS_FOR_SKILL: Record<string, number[]> = {
  reading:   [1, 2, 3],
  listening: [1, 2, 3, 4],
  writing:   [1, 2],
  speaking:  [1, 2, 3],
};

function NewTestModal({ courses, defaultCourseId, onClose, onCreated }: NewTestModalProps) {
  const [form, setForm] = useState({
    title: '',
    lesson_type: 'reading' as 'reading' | 'listening' | 'writing' | 'speaking',
    test_type: 'mini' as 'mini' | 'full' | 'practice',
    time_limit: 60,
    course_id: defaultCourseId ?? '',
    lesson_parts: [1, 2, 3] as number[],
  });
  const [saving, setSaving] = useState(false);

  // When skill changes, reset parts to all parts for that skill
  const handleSkillChange = (skill: typeof form.lesson_type) => {
    setForm(f => ({ ...f, lesson_type: skill, lesson_parts: PARTS_FOR_SKILL[skill] ?? [1] }));
  };

  const togglePart = (p: number) => {
    setForm(f => ({
      ...f,
      lesson_parts: f.lesson_parts.includes(p)
        ? f.lesson_parts.filter(x => x !== p)
        : [...f.lesson_parts, p].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.lesson_parts.length === 0) {
      alert('Please select at least one part.');
      return;
    }
    setSaving(true);
    try {
      const lesson = await api.lessons.create({
        title: form.title,
        lesson_type: form.lesson_type,
        test_type: form.test_type,
        time_limit: form.time_limit,
        course_id: form.course_id || (null as any),
        lesson_parts: form.lesson_parts,
        is_test: true,
      });
      onCreated(lesson.id);
    } catch (err: any) {
      alert('Failed to create test: ' + (err?.message ?? 'unknown error'));
      setSaving(false);
    }
  };

  const availableParts = PARTS_FOR_SKILL[form.lesson_type] ?? ALL_PARTS;
  const isReadingOrListening = form.lesson_type === 'reading' || form.lesson_type === 'listening';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <h2 className="text-white font-black text-lg">New Test</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Title</label>
            <input
              type="text" required placeholder="e.g. Reading Test 1"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Skill + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Skill</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.lesson_type} onChange={e => handleSkillChange(e.target.value as any)}
              >
                <option value="reading">📖 Reading</option>
                <option value="listening">🎧 Listening</option>
                <option value="writing">✍️ Writing</option>
                <option value="speaking">🎤 Speaking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Type</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.test_type} onChange={e => setForm({ ...form, test_type: e.target.value as any })}
              >
                <option value="mini">Mini Test</option>
                <option value="full">Full Mock</option>
                <option value="practice">Practice</option>
              </select>
            </div>
          </div>

          {/* Parts selector */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">
              Active Parts
              <span className="ml-1.5 text-slate-400 normal-case font-medium">(chọn part có trong bài test)</span>
            </label>
            <div className="flex gap-2">
              {availableParts.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePart(p)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${
                    form.lesson_parts.includes(p)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-400'
                  }`}
                >
                  {form.lesson_type === 'writing' ? `Task ${p}` : `Part ${p}`}
                </button>
              ))}
            </div>
            {form.lesson_parts.length === 0 && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">Chọn ít nhất 1 part</p>
            )}
          </div>

          {/* Test Set + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Test Set (optional)</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
              >
                <option value="">— No Set —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Time (mins)</label>
              <input
                type="number" min={5} max={240}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.time_limit} onChange={e => setForm({ ...form, time_limit: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm">
              Cancel
            </button>
            <button
              type="submit" disabled={saving || form.lesson_parts.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm disabled:opacity-60 transition-colors"
            >
              {saving ? 'Creating...' : 'Create & Edit →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: New Test Set ───────────────────────────────────────────────────────

interface NewSetModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewSetModal({ onClose, onCreated }: NewSetModalProps) {
  const [form, setForm] = useState({ title: '', description: '', level: 'B2' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.courses.create(form);
      onCreated();
    } catch {
      alert('Failed to create set');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <h2 className="text-white font-black text-lg">New Test Set</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text" required placeholder="e.g. Cambridge IELTS 19"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="text" placeholder="Level (e.g. B2, C1)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Create Set'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Quick Import ───────────────────────────────────────────────────────

interface QuickImportModalProps {
  courses: Course[];
  defaultCourseId?: string;
  onClose: () => void;
  onStarted: (lessonId: string, jobId: string) => void;
}

function QuickImportModal({ courses, defaultCourseId, onClose, onStarted }: QuickImportModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [previewData, setPreviewData] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    lesson_type: 'reading',
    test_type: 'mini',
    course_id: defaultCourseId ?? '',
    test_set_title: '',
    raw_text: '',
  });
  const [saving, setSaving] = useState(false);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.raw_text.trim()) { alert('Paste exam content first.'); return; }
    setSaving(true);
    try {
      const res = await api.lessons.quickImportPreview({
        raw_text: form.raw_text,
        lesson_type: form.lesson_type
      });
      setPreviewData(res);
      setStep(2);
    } catch {
      alert('Preview failed. Check AI logs.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmImport = async () => {
    setSaving(true);
    try {
      // resolve test set: prefer course_id, fall back to title
      const selectedCourse = courses.find(c => c.id === form.course_id);
      const res = await api.lessons.quickImport({
        title: form.title,
        lesson_type: form.lesson_type,
        test_type: form.test_type,
        raw_text: form.raw_text,
        test_set_title: selectedCourse?.title || form.test_set_title || undefined,
        course_id: form.course_id || undefined,
      });
      onStarted(res.lesson.id, res.job_id);
    } catch {
      alert('Quick Import failed');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">⚡ AI Quick Import</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Paste raw text from PDF — AI will build passages & questions automatically</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePreview} className="p-6 space-y-5 overflow-y-auto">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Title</label>
                <input
                  type="text" required placeholder="e.g. Reading Practice 01"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Test Set</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                >
                  <option value="">— Create new set —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {!form.course_id && (
                  <input
                    type="text" placeholder="New set name (optional)"
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={form.test_set_title} onChange={e => setForm({ ...form, test_set_title: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Skill</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.lesson_type} onChange={e => setForm({ ...form, lesson_type: e.target.value })}
                >
                  <option value="reading">📖 Reading</option>
                  <option value="listening">🎧 Listening</option>
                  <option value="writing">✍️ Writing</option>
                  <option value="speaking">🎤 Speaking</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Type</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.test_type} onChange={e => setForm({ ...form, test_type: e.target.value })}
                >
                  <option value="mini">Mini Test</option>
                  <option value="full">Full Mock</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
            </div>

            {/* Raw text */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1.5">Raw Exam Text (from PDF)</label>
              <textarea
                required rows={10}
                placeholder="Paste everything here: passage text, questions, answer options..."
                className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={form.raw_text} onChange={e => setForm({ ...form, raw_text: e.target.value })}
              />
            </div>

            <button
              type="submit" disabled={saving}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 text-sm"
            >
              {saving ? '🤖 AI is analyzing...' : 'Step 1: Next (Preview)'}
            </button>
          </form>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl font-medium text-sm border border-emerald-200">
              <p className="font-bold flex items-center gap-2 mb-2">
                <span>🤖</span> AI Analysis Complete
              </p>
              <p>Total Parts: <span className="font-black">{previewData?.total_parts}</span></p>
              <p>Total Questions: <span className="font-black">{previewData?.total_questions}</span></p>
            </div>

            <div className="space-y-4">
              {previewData?.sections?.map((s: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-sm">
                    Part {s.part_number} · {s.passage_title}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {s.groups?.map((g: any, gIdx: number) => (
                      <div key={gIdx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">Questions {g.range}</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{g.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button" disabled={saving} onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all text-sm disabled:opacity-50"
              >
                ← Back & Edit
              </button>
              <button
                type="button" disabled={saving} onClick={handleConfirmImport}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 text-sm flex justify-center items-center gap-2"
              >
                {saving ? 'Creating...' : '✅ Confirm & Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminTestManagementPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected set filter: null = show all
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Modals
  const [showNewTest, setShowNewTest] = useState(false);
  const [showNewSet, setShowNewSet] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, coursesRes] = await Promise.all([api.tests.list(), api.courses.list()]);
      setTests(testsRes || []);
      setCourses(coursesRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Delete this test?')) return;
    try {
      await api.lessons.delete(id);
      setTests(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  // Derived
  const selectedSet = courses.find(c => c.id === selectedSetId) ?? null;
  const visibleTests = selectedSetId
    ? tests.filter(t => t.course_id === selectedSetId)
    : tests;

  const countForSet = (id: string) => tests.filter(t => t.course_id === id).length;
  const orphanCount = tests.filter(t => !t.course_id).length;

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 -m-8">

      {/* ── Left sidebar: Test Sets ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">Test Sets</h2>
          <button
            onClick={() => setShowNewSet(true)}
            className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-lg leading-none flex items-center justify-center transition-colors"
            title="New Test Set"
          >
            +
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* "All Tests" entry */}
          <button
            onClick={() => setSelectedSetId(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
              selectedSetId === null
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="font-bold text-sm">All Tests</span>
            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${selectedSetId === null ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {tests.length}
            </span>
          </button>

          {/* Set entries */}
          {courses.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedSetId(c.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                selectedSetId === c.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="font-bold text-sm truncate mr-2">{c.title}</span>
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full shrink-0 ${selectedSetId === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {countForSet(c.id)}
              </span>
            </button>
          ))}

          {/* Orphan tests (no set) */}
          {orphanCount > 0 && (
            <button
              onClick={() => setSelectedSetId('__orphan__')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                selectedSetId === '__orphan__'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="font-bold text-sm italic">No Set</span>
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full shrink-0 ${selectedSetId === '__orphan__' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {orphanCount}
              </span>
            </button>
          )}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-black text-slate-900 text-xl">
              {selectedSetId === null
                ? 'All Tests'
                : selectedSetId === '__orphan__'
                  ? 'Tests without a Set'
                  : selectedSet?.title ?? 'Tests'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              {visibleTests.length} test{visibleTests.length !== 1 ? 's' : ''}
              {selectedSet && ` · ${selectedSet.level}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickImport(true); setShowNewTest(false); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-100"
            >
              ⚡ Quick Import (AI)
            </button>
            <button
              onClick={() => { setShowNewTest(true); setShowQuickImport(false); }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
            >
              + New Test
            </button>
          </div>
        </div>

        {/* Test list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : visibleTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-black text-slate-700 text-lg">No tests here yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-6">Create one manually or use AI Quick Import.</p>
              <button
                onClick={() => setShowNewTest(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700"
              >
                + Create First Test
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleTests.map(test => {
                const skill = SKILL_META[test.lesson_type ?? 'reading'] ?? SKILL_META.reading;
                const type  = TYPE_META[test.test_type ?? 'practice'] ?? TYPE_META.practice;
                const set   = courses.find(c => c.id === test.course_id);

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-4 px-4 py-3"
                  >
                    {/* Skill icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${skill.bg}`}>
                      {skill.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{test.title}</p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${skill.bg} ${skill.color}`}>
                          {test.lesson_type}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${type.color}`}>
                          {type.label}
                        </span>
                        {test.lesson_parts && test.lesson_parts.length > 0 && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            Parts {test.lesson_parts.join('+')}
                          </span>
                        )}
                        {set && selectedSetId === null && (
                          <span className="text-[10px] font-medium text-slate-400 truncate">
                            {set.title}
                          </span>
                        )}
                        {test.pdf_url && (
                          <span className="text-[10px] text-slate-400">📄 PDF</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      {test.time_limit ?? 60}m
                    </span>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <Link
                        href={`/admin/lessons/${test.id}/questions`}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 text-red-400 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showNewTest && (
        <NewTestModal
          courses={courses}
          defaultCourseId={selectedSetId && selectedSetId !== '__orphan__' ? selectedSetId : undefined}
          onClose={() => setShowNewTest(false)}
          onCreated={(id) => router.push(`/admin/lessons/${id}/questions`)}
        />
      )}

      {showNewSet && (
        <NewSetModal
          onClose={() => setShowNewSet(false)}
          onCreated={() => { setShowNewSet(false); loadData(); }}
        />
      )}

      {showQuickImport && (
        <QuickImportModal
          courses={courses}
          defaultCourseId={selectedSetId && selectedSetId !== '__orphan__' ? selectedSetId : undefined}
          onClose={() => setShowQuickImport(false)}
          onStarted={(lessonId, jobId) => router.push(`/admin/lessons/${lessonId}/questions?job_id=${jobId}`)}
        />
      )}
    </div>
  );
}
