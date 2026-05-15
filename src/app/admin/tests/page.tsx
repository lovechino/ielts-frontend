'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Lesson } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  level: string;
  description: string;
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTest, setNewTest] = useState({
    title: '',
    test_type: 'full' as 'mini' | 'full',
    time_limit: 60,
    lesson_type: 'reading',
    content: '',
    pdf_url: ''
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const loadTests = useCallback(async () => {
    try {
      const [testsRes, coursesData] = await Promise.all([
        api.tests.list(),
        api.courses.list()
      ]);
      setTests(testsRes || []);
      setCourses(coursesData || []);
    } catch {
      // Silence err if unused
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    setIsScanning(true);

    try {
      // Dynamic import pdfjs only on client side
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      // 1. Upload to storage
      const res = await api.upload(file);
      if (res.success) {
        setNewTest(prev => ({ ...prev, pdf_url: res.url }));
        
        // 2. Extract Text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: unknown) => (item as { str: string }).str).join(' ');
          fullText += pageText + '\n\n';
        }
        
        setNewTest(prev => ({ ...prev, content: fullText }));
      }
    } catch (err) {
      console.error("PDF Scan Error:", err);
      alert("Failed to scan PDF text. Please paste manually.");
    } finally {
      setUploadingPdf(false);
      setIsScanning(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (courses.length === 0) {
      alert("No courses found. Please create a course first.");
      return;
    }

    const defaultCourseId = courses[0].id;
    setLoading(true);

    try {
      // 1. Create the Lesson
      const lessonResult = await api.courses.createLesson(defaultCourseId, { 
        ...newTest, 
        is_test: true,
        course_id: defaultCourseId 
      });
      const lesson = Array.isArray(lessonResult) ? lessonResult[0] : lessonResult;

      // 2. If there's content, trigger AI Auto-generate
      let jobId = '';
      if (newTest.content.trim()) {
        try {
          const res = await api.lessons.autoGenerate(lesson.id, newTest.content);
          jobId = res.job_id;
        } catch (aiErr) {
          console.error("AI Generation failed but lesson was created:", aiErr);
        }
      }

      // 3. Redirect to the editor
      router.push(`/admin/lessons/${lesson.id}/questions${jobId ? `?job_id=${jobId}` : ''}`);
      
    } catch (err: unknown) {
      const error = err as Error;
      alert("Failed to create test: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Test Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Create and manage Mini Tests and Full Mock Tests.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {showCreate ? 'Cancel' : '+ Create New Test'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-black text-slate-900 mb-6">Setup New Exam</h3>
          <form onSubmit={handleCreateTest} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Test Title</label>
                <input 
                  type="text" required
                  value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="e.g. Cambridge IELTS 19 - Test 1"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Test Category</label>
                <select 
                  value={newTest.test_type} onChange={e => setNewTest({...newTest, test_type: e.target.value as 'mini' | 'full'})}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                >
                  <option value="mini">Mini Test (Short Practice)</option>
                  <option value="full">Full Mock Test (Standard)</option>
                </select>
              </div>
              {newTest.test_type === 'mini' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Skill</label>
                  <select 
                    value={newTest.lesson_type} onChange={e => setNewTest({...newTest, lesson_type: e.target.value as 'reading' | 'listening' | 'writing' | 'speaking'})}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                    <option value="speaking">Speaking</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Minutes)</label>
                <input 
                  type="number"
                  value={newTest.time_limit} 
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setNewTest({...newTest, time_limit: isNaN(val) ? 0 : val});
                  }}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Test PDF (Optional)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" accept=".pdf"
                    onChange={handleFileUpload}
                    className="flex-1 px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all text-sm"
                  />
                  {uploadingPdf && <span className="text-indigo-600 animate-pulse font-bold text-sm">Uploading...</span>}
                  {isScanning && <span className="text-orange-600 animate-pulse font-bold text-sm">Scanning Text...</span>}
                  {newTest.pdf_url && !isScanning && <span className="text-green-600 font-bold text-sm">✓ Scanned successfully</span>}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Extracted Content / Reading Passage
                  {isScanning && <span className="ml-2 text-orange-500 text-xs">(Reading PDF...)</span>}
                </label>
                <textarea 
                  rows={8}
                  value={newTest.content} onChange={e => setNewTest({...newTest, content: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                  placeholder="Extracted text will appear here..."
                ></textarea>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || isScanning}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing with AI...' : 'Save and Start AI Parsing'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100"></div>)}
          </div>
        ) : (
          tests.map((test, idx) => (
            <div key={test.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all group">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{test.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      test.test_type === 'full' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {test.test_type} Test
                    </span>
                    {test.test_type === 'mini' ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-600">
                        {test.lesson_type}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                        All Skills
                      </span>
                    )}
                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      {test.time_limit} mins
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href={`/admin/lessons/${test.id}/questions`}
                  className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Edit Content & AI Builder &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
