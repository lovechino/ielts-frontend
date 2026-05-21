'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Lesson, Question, Passage, QuestionGroup } from '@/lib/api';

export default function AdminQuestionBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<(Lesson & { passages?: Passage[], question_groups?: QuestionGroup[] }) | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [activeTab, setActiveTab] = useState<'passage' | 'group' | 'question'>('passage');
  const [showPassageForm, setShowPassageForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Passage Form
  const [passageData, setPassageData] = useState({ title: '', content_html: '', order: 0 });
  // Group Form
  const [groupData, setGroupData] = useState({ title: '', instruction: '', group_type: 'MULTIPLE_CHOICE', passage_id: '', order: 0 });
  // Question Form
  const [questionData, setQuestionData] = useState<Partial<Question>>({
    content: '',
    question_type: 'reading',
    group_id: '',
    correct_answer: '',
    options: {}
  });

  const [optionInputs, setOptionInputs] = useState<{key: string, value: string}[]>([
    { key: 'A', value: '' },
    { key: 'B', value: '' }
  ]);

  const loadData = useCallback(async () => {
    try {
      const [lessonData, questionsData] = await Promise.all([
        api.lessons.get(lessonId),
        api.lessons.questions(lessonId)
      ]);
      setLesson(lessonData);
      setQuestions(questionsData || []);
      
      // Auto select first group if available
      if (lessonData?.question_groups && lessonData.question_groups.length > 0) {
        setQuestionData(prev => ({ 
          ...prev, 
          group_id: lessonData.question_groups![0].id,
          question_type: lessonData.lesson_type || 'reading'
        }));
      } else {
        setQuestionData(prev => ({ 
          ...prev, 
          question_type: lessonData?.lesson_type || 'reading'
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const startJobPolling = useCallback(async (jobId: string) => {
    setIsAiGenerating(true);
    setAiStatus('Syncing AI Results...');
    try {
      const result = await api.jobs.waitForJob(jobId, (job) => {
        setAiStatus(`AI Status: ${job.status}...`);
      });
      if (result.status === 'completed') {
        loadData();
      } else {
        console.error("BG Job Failed:", result.error);
      }
    } catch (err) {
      console.error("Polling Error:", err);
    } finally {
      setIsAiGenerating(false);
      setAiStatus('');
      // Clean up URL
      router.replace(`/admin/lessons/${lessonId}/questions`);
    }
  }, [lessonId, loadData, router]);

  useEffect(() => {
    loadData();
    // Check for job_id in URL to start auto-polling
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');
    if (jobId) {
      startJobPolling(jobId);
    }
  }, [lessonId, loadData, startJobPolling]);

  const handleCreatePassage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.lessons.createPassage(lessonId, passageData);
      setShowPassageForm(false);
      setPassageData({ title: '', content_html: '', order: 0 });
      loadData();
    } catch {
      alert("Failed to create passage");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.lessons.createQuestionGroup(lessonId, groupData);
      setShowGroupForm(false);
      setGroupData({ title: '', instruction: '', group_type: 'MULTIPLE_CHOICE', passage_id: '', order: 0 });
      loadData();
    } catch {
      alert("Failed to create group");
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let formattedOptions = undefined;
      if (lesson?.lesson_type !== 'speaking' && (groupData.group_type === 'MULTIPLE_CHOICE' || !groupData.group_type)) {
        formattedOptions = optionInputs.reduce((acc, opt) => {
          if (opt.value.trim()) acc[opt.key] = opt.value;
          return acc;
        }, {} as Record<string, string>);
      }

      const payload = {
        ...questionData,
        lesson_id: lessonId,
        options: formattedOptions
      };

      await api.lessons.createQuestion(lessonId, payload as unknown as Partial<Question>);
      setShowQuestionForm(false);
      setQuestionData(prev => ({ 
        ...prev, 
        content: '', 
        correct_answer: '', 
        scoring_criteria: '' 
      }));
      loadData();
    } catch {
      alert("Failed to create question");
    }
  };

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('');
  const [rawTextForAi, setRawTextForAi] = useState('');

  const handleAiGenerate = async () => {
    if (!rawTextForAi.trim()) {
      alert("Please paste some raw text from PDF first.");
      return;
    }
    setIsAiGenerating(true);
    setAiStatus('Sending to AI...');
    try {
      const { job_id } = await api.lessons.autoGenerate(lessonId, rawTextForAi);
      setAiStatus('AI is processing (20-40s)...');
      
      const result = await api.jobs.waitForJob(job_id, (job) => {
        if (job.status === 'pending') setAiStatus('Still working...');
      });

      if (result.status === 'completed') {
        alert("AI Generation Successful!");
        setRawTextForAi('');
        loadData();
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("AI Generation Failed: " + error.message);
    } finally {
      setIsAiGenerating(false);
      setAiStatus('');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Builder...</div>;
  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
            &larr; Back
          </button>
          <h1 className="font-bold text-slate-800">Exam Builder: {lesson.title}</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-full mr-4">
            <button onClick={() => setActiveTab('passage')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === 'passage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Passages</button>
            <button onClick={() => setActiveTab('group')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === 'group' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Groups</button>
            <button onClick={() => setActiveTab('question')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === 'question' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Questions</button>
          </div>
          <button 
            onClick={() => router.push('/admin/tests')}
            className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Finish & Publish
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Col: PDF View (Reference) */}
        <div className="w-1/2 border-r border-slate-200 bg-slate-200 flex flex-col">
          {lesson.pdf_url ? (
            <iframe 
              src={`${lesson.pdf_url}#toolbar=0`} 
              className="w-full h-full border-none"
              title="Reference PDF"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <p className="text-slate-500 mb-4">No PDF attached to this lesson.</p>
              <Link href={`/admin/courses/${lesson.course_id}`} className="text-indigo-600 font-bold">Attach PDF &rarr;</Link>
            </div>
          )}
        </div>

        {/* Right Col: Structure Editor */}
        <div className="w-1/2 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* PASSAGES SECTION */}
            {activeTab === 'passage' && (
              <section className="space-y-8">
                {/* AI Magic Box */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-black">AI Auto-Generator</h2>
                  </div>
                  <p className="text-indigo-100 text-sm mb-6 font-medium">Paste the entire content from the PDF (Passage + Questions) and let AI do the work for you.</p>
                  <textarea 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 text-sm font-serif mb-4 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Paste raw text here..."
                    rows={8}
                    value={rawTextForAi}
                    onChange={(e) => setRawTextForAi(e.target.value)}
                  />
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating}
                    className="w-full bg-white text-indigo-600 font-black py-3 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:bg-white/50"
                  >
                    {isAiGenerating ? (aiStatus || 'WORKING...') : '⚡ GENERATE EXAM CONTENT'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Manual Passages</h2>
                  <button onClick={() => setShowPassageForm(!showPassageForm)} className="text-indigo-600 font-bold text-sm">+ Add Manually</button>
                </div>
                
                {showPassageForm && (
                  <form onSubmit={handleCreatePassage} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                    <input 
                      type="text" placeholder="Passage Title (e.g. Reading Passage 1)" required
                      className="w-full px-3 py-2 rounded-lg border"
                      value={passageData.title} onChange={e => setPassageData({...passageData, title: e.target.value})}
                    />
                    <textarea 
                      placeholder="Paste passage text from PDF here..." required rows={10}
                      className="w-full px-3 py-2 rounded-lg border font-serif"
                      value={passageData.content_html} onChange={e => setPassageData({...passageData, content_html: e.target.value})}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowPassageForm(false)} className="px-4 py-2 text-sm">Cancel</button>
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save Passage</button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {lesson.passages?.map(p => (
                    <div key={p.id} className="p-4 border rounded-xl bg-white shadow-sm">
                      <h3 className="font-bold text-slate-900">{p.title}</h3>
                      <div 
                        className="text-sm text-slate-500 mt-1 italic prose prose-sm prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: p.content_html || '' }}
                      />
                    </div>
                  ))}
                  {lesson.passages?.length === 0 && <p className="text-slate-400 text-sm">No passages yet.</p>}
                </div>
              </section>
            )}

            {/* GROUPS SECTION */}
            {activeTab === 'group' && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Question Groups</h2>
                  <button onClick={() => setShowGroupForm(!showGroupForm)} className="text-indigo-600 font-bold text-sm">+ Add Group</button>
                </div>

                {showGroupForm && (
                  <form onSubmit={handleCreateGroup} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                        required className="px-3 py-2 rounded-lg border"
                        value={groupData.passage_id} onChange={e => setGroupData({...groupData, passage_id: e.target.value})}
                      >
                        <option value="">Link to Passage (Optional)</option>
                        {lesson.passages?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                      {lesson.lesson_type === 'speaking' ? (
                        <select 
                          required className="px-3 py-2 rounded-lg border font-bold text-slate-800"
                          value={groupData.group_type} onChange={e => setGroupData({...groupData, group_type: e.target.value})}
                        >
                          <option value="SPEAKING_PART_1">Part 1 - General Interview</option>
                          <option value="SPEAKING_PART_2">Part 2 - Cue Card (Individual)</option>
                          <option value="SPEAKING_PART_3">Part 3 - Discussion (Abstract)</option>
                        </select>
                      ) : (
                        <select 
                          required className="px-3 py-2 rounded-lg border font-medium"
                          value={groupData.group_type} onChange={e => setGroupData({...groupData, group_type: e.target.value})}
                        >
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="TRUE_FALSE_NOT_GIVEN">True/False/Not Given</option>
                          <option value="MATCHING">Matching</option>
                          <option value="FILL_BLANK">Fill Blank</option>
                        </select>
                      )}
                    </div>
                    <input 
                      type="text" placeholder="Group Title (e.g. Questions 1-5)" required
                      className="w-full px-3 py-2 rounded-lg border"
                      value={groupData.title} onChange={e => setGroupData({...groupData, title: e.target.value})}
                    />
                    <textarea 
                      placeholder="Instructions (e.g. Do the following statements agree...)" rows={2}
                      className="w-full px-3 py-2 rounded-lg border"
                      value={groupData.instruction} onChange={e => setGroupData({...groupData, instruction: e.target.value})}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowGroupForm(false)} className="px-4 py-2 text-sm">Cancel</button>
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save Group</button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {lesson.question_groups?.map(g => (
                    <div key={g.id} className="p-4 border rounded-xl bg-white shadow-sm border-l-4 border-l-indigo-400">
                      <h3 className="font-bold text-slate-900">{g.title}</h3>
                      <p className="text-xs text-slate-500 uppercase font-black">{g.group_type}</p>
                    </div>
                  ))}
                  {lesson.question_groups?.length === 0 && <p className="text-slate-400 text-sm">No groups yet.</p>}
                </div>
              </section>
            )}

            {/* QUESTIONS SECTION */}
            {activeTab === 'question' && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Questions</h2>
                  <button onClick={() => setShowQuestionForm(!showQuestionForm)} className="text-indigo-600 font-bold text-sm">+ Add Question</button>
                </div>

                {showQuestionForm && (
                  <form onSubmit={handleCreateQuestion} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                    <select 
                      required className="w-full px-3 py-2 rounded-lg border"
                      value={questionData.group_id} onChange={e => setQuestionData({...questionData, group_id: e.target.value})}
                    >
                      <option value="">Select Group</option>
                      {lesson.question_groups?.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                    
                    <textarea 
                      placeholder="Question Content..." required rows={2}
                      className="w-full px-3 py-2 rounded-lg border"
                      value={questionData.content} onChange={e => setQuestionData({...questionData, content: e.target.value})}
                    />

                    {lesson.lesson_type === 'speaking' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scoring Criteria / Suggested Vocabulary (Optional)</label>
                          <textarea 
                            placeholder="e.g. band 7+ vocabulary requirements, or model phrases to evaluate against..." rows={3}
                            className="w-full px-3 py-2 rounded-lg border text-sm font-medium"
                            value={questionData.scoring_criteria || ''} 
                            onChange={e => setQuestionData({...questionData, scoring_criteria: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Simple Options for MC */
                      <div className="space-y-2">
                        {optionInputs.map((opt, idx) => (
                          <div key={opt.key} className="flex gap-2">
                            <span className="w-6 font-bold">{opt.key}</span>
                            <input 
                              className="flex-1 px-2 py-1 border rounded"
                              value={opt.value} onChange={e => {
                                const newOpts = [...optionInputs];
                                newOpts[idx].value = e.target.value;
                                setOptionInputs(newOpts);
                              }}
                            />
                            <input type="radio" checked={questionData.correct_answer === opt.key} onChange={() => setQuestionData({...questionData, correct_answer: opt.key})} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowQuestionForm(false)} className="px-4 py-2 text-sm">Cancel</button>
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save Question</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const group = lesson.question_groups?.find(g => g.id === q.group_id);
                    return (
                      <div key={q.id} className="p-4 bg-slate-50 rounded-2xl text-sm border border-slate-200 flex flex-col justify-between gap-2 shadow-sm hover:border-slate-300 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span className="font-bold text-slate-800 mr-2">Q{idx + 1}.</span>
                            <span className="font-medium text-slate-700">{q.content}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            group?.group_type?.startsWith('SPEAKING_')
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {group ? (
                              group.group_type?.startsWith('SPEAKING_') 
                                ? group.group_type.replace('SPEAKING_', '').replace('_', ' ') 
                                : group.title
                            ) : 'No Group'}
                          </span>
                        </div>
                        {q.scoring_criteria && (
                          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs font-bold text-emerald-800 flex items-start gap-1.5 mt-1">
                            <span className="text-emerald-500">💡 Criteria:</span>
                            <span className="font-medium flex-1">{q.scoring_criteria}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {questions.length === 0 && (
                    <p className="text-slate-400 font-bold text-center py-6 text-sm">No questions added yet.</p>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
