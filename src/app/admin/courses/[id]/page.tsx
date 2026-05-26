'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, Course, Lesson } from '@/lib/api';

export default function AdminCourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ 
    title: '', 
    content: '', 
    lesson_type: 'reading', 
    pdf_url: '',
    is_test: false,
    test_type: 'practice' as 'practice' | 'mini' | 'full',
    time_limit: 60
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [courseData, lessonsData] = await Promise.all([
        api.courses.get(id),
        api.courses.lessons(id)
      ]);
      setCourse(courseData);
      setLessons(lessonsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [id, loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const res = await api.upload(file);
      if (res.success) {
        setNewLesson(prev => ({ ...prev, pdf_url: res.url }));
      }
    } catch (err) {
      alert("Failed to upload PDF");
      console.error(err);
    } finally {
      setUploadingPdf(false);
    }
  };

  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ title: '', file: null as File | null, pdf_url: '', uploading: false }]);

  const addBulkRow = () => {
    setBulkRows([...bulkRows, { title: '', file: null, pdf_url: '', uploading: false }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkRows(bulkRows.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, data: Partial<(typeof bulkRows)[0]>) => {
    const newRows = [...bulkRows];
    newRows[index] = { ...newRows[index], ...data };
    setBulkRows(newRows);
  };

  const handleBulkCreateLessons = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.title.trim());
    if (validRows.length === 0) return;

    setLoading(true);
    try {
      const lessonsToCreate = [];
      for (let i = 0; i < bulkRows.length; i++) {
        const row = bulkRows[i];
        if (!row.title.trim()) continue;

        let pdf_url = row.pdf_url;
        if (row.file && !pdf_url) {
          updateBulkRow(i, { uploading: true });
          const res = await api.upload(row.file);
          if (res.success) pdf_url = res.url;
          updateBulkRow(i, { uploading: false, pdf_url });
        }

        lessonsToCreate.push({
          title: row.title,
          content: '',
          lesson_type: 'reading',
          pdf_url: pdf_url,
          order: lessons.length + lessonsToCreate.length + 1,
          course_id: id
        });
      }
      
      await api.courses.createLesson(id, lessonsToCreate);
      setShowBulkCreate(false);
      setBulkRows([{ title: '', file: null, pdf_url: '', uploading: false }]);
      loadData();
    } catch (err) {
      alert("Failed to create bulk lessons");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.courses.createLesson(id, { ...newLesson, course_id: id });
      setShowCreateLesson(false);
      setNewLesson({ 
        title: '', 
        content: '', 
        lesson_type: 'reading', 
        pdf_url: '',
        is_test: false,
        test_type: 'practice' as 'practice' | 'mini' | 'full',
        time_limit: 60
      });
      loadData();
    } catch (err) {
      alert("Failed to create lesson");
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50">
          &larr;
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-slate-500">Manage lessons and PDF materials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Lessons List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lessons ({lessons.length})</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowBulkCreate(!showBulkCreate); setShowCreateLesson(false); }}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900"
              >
                {showBulkCreate ? 'Cancel' : 'Bulk Add'}
              </button>
              <button 
                onClick={() => { setShowCreateLesson(!showCreateLesson); setShowBulkCreate(false); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                {showCreateLesson ? 'Cancel' : '+ Add Lesson'}
              </button>
            </div>
          </div>

          {showBulkCreate && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
              <h3 className="font-bold text-slate-900 mb-4">Bulk Create Lessons</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm font-medium text-slate-500 border-b border-slate-200">
                      <th className="pb-3 pr-4">Lesson Title</th>
                      <th className="pb-3 pr-4">PDF File (Optional)</th>
                      <th className="pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, index) => (
                      <tr key={index}>
                        <td className="py-3 pr-4">
                          <input 
                            type="text"
                            value={row.title}
                            onChange={(e) => updateBulkRow(index, { title: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="e.g. Unit 1"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="file"
                              accept=".pdf"
                              onChange={(e) => updateBulkRow(index, { file: e.target.files?.[0] || null })}
                              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {row.uploading && <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>}
                            {row.pdf_url && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => removeBulkRow(index)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button 
                  onClick={addBulkRow}
                  className="text-indigo-600 text-sm font-bold hover:text-indigo-700 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Another Lesson
                </button>
                <button 
                  onClick={handleBulkCreateLessons}
                  disabled={loading}
                  className="bg-slate-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-black transition-colors disabled:bg-slate-400"
                >
                  {loading ? 'Creating...' : `Save ${bulkRows.filter(r => r.title.trim()).length} Lessons`}
                </button>
              </div>
            </div>
          )}

          {showCreateLesson && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6">
              <h3 className="font-bold text-indigo-900 mb-4">Create New Lesson</h3>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Title</label>
                  <input 
                    type="text" required
                    value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Unit 1: Introduction"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Type</label>
                    <select 
                      value={newLesson.lesson_type} onChange={e => setNewLesson({...newLesson, lesson_type: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                      <option value="writing">Writing</option>
                      <option value="speaking">Speaking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                    <input 
                      type="file" accept=".pdf"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="flex items-center gap-2 pb-3">
                    <input 
                      type="checkbox" 
                      id="is_test"
                      checked={newLesson.is_test || false}
                      onChange={e => setNewLesson({...newLesson, is_test: e.target.checked})}
                      className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <label htmlFor="is_test" className="text-sm font-bold text-slate-700">Set as Test</label>
                  </div>
                  {newLesson.is_test && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Test Type</label>
                      <select 
                        value={newLesson.test_type || 'practice'} onChange={e => setNewLesson({...newLesson, test_type: e.target.value as 'practice' | 'mini' | 'full'})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="practice">Practice</option>
                        <option value="mini">Mini Test</option>
                        <option value="full">Full Test</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Notes/Content (Optional Markdown)</label>
                  <textarea 
                    rows={3}
                    value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief theory notes if not using PDF..."
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={uploadingPdf} className="bg-indigo-600 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-bold">
                    Save Lesson
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {lessons.map((lesson, idx) => (
              <div key={lesson.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                    <div className="flex gap-3 text-xs mt-1">
                      <span className="text-indigo-600 uppercase font-bold">{lesson.lesson_type}</span>
                      {lesson.is_test && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          lesson.test_type === 'full' ? 'bg-red-100 text-red-600' : 
                          lesson.test_type === 'mini' ? 'bg-orange-100 text-orange-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {lesson.test_type} Test
                        </span>
                      )}
                      {lesson.pdf_url && <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        PDF Attached
                      </span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button 
                      className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Upload PDF"
                      onClick={() => document.getElementById(`file-upload-${lesson.id}`)?.click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <input 
                      id={`file-upload-${lesson.id}`}
                      type="file" accept=".pdf" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploadRes = await api.upload(file);
                          if (uploadRes.success) {
                            await api.courses.updateLesson(lesson.id, { pdf_url: uploadRes.url });
                            loadData();
                          }
                        } catch {
                          alert("Failed to upload/update PDF");
                        }
                      }}
                    />
                  </div>
                  <Link 
                    href={`/admin/lessons/${lesson.id}/questions`}
                    className="text-slate-400 hover:text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-50 font-medium transition-colors"
                  >
                    Manage Questions &rarr;
                  </Link>
                </div>
              </div>
            ))}
            
            {lessons.length === 0 && !showCreateLesson && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500">No lessons in this course yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Course Info */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl h-fit sticky top-6">
          <h3 className="text-lg font-bold text-indigo-400 mb-4">Course Info</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Level</p>
              <p className="font-medium uppercase">{course.level}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Total Lessons</p>
              <p className="font-medium text-2xl">{lessons.length}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Description</p>
              <p className="text-slate-300 leading-relaxed">{course.description || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
