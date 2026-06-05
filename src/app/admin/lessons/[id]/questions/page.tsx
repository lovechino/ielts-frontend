'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, Lesson, Question, Passage, QuestionGroup } from '@/lib/api';

const PART_OPTIONS = [1, 2, 3];

const MobileSimulator = ({ lesson, speakingTasks, writingTasks, questions }: any) => {
  const isSpeaking = lesson?.lesson_type === 'speaking';
  const isWriting = lesson?.lesson_type === 'writing';
  const [activePreviewPart, setActivePreviewPart] = useState<string>('1');

  // Simulate the phone container
  return (
    <div className="w-[375px] h-[812px] bg-[#f7f9fb] border-[14px] border-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative shrink-0">
      {/* Notch / Status Bar */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
        <div className="w-32 h-6 bg-slate-900 rounded-b-2xl"></div>
      </div>
      
      {/* Header */}
      <div className="h-14 bg-[#E8F4FC] flex items-end pb-3 px-4 border-b border-[#E2E8F0] shrink-0 mt-6">
        <div className="text-slate-800 font-bold truncate">{lesson?.title || 'Preview'}</div>
      </div>

      {/* Part Toggle (For Speaking/Writing) */}
      {(isSpeaking || isWriting) && (
        <div className="flex px-4 py-2 bg-white border-b border-[#E2E8F0] justify-around items-center">
           {Object.keys(isSpeaking ? speakingTasks : writingTasks).map(part => {
             // Only show toggle for parts that are selected in the config
             if (!lesson?.lesson_parts?.includes(Number(part))) return null;
             return (
               <button
                  key={part}
                  onClick={() => setActivePreviewPart(part)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all ${activePreviewPart === part ? 'bg-[#0058be] text-white shadow-sm' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}
               >
                 {isSpeaking ? `Part ${part}` : `Task ${part}`}
               </button>
             );
           })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isSpeaking && (
          <div className="p-6 flex flex-col items-center min-h-full">
             {(() => {
                const content = speakingTasks[activePreviewPart as any];
                if (!content) return <p className="text-slate-400 mt-10 text-sm">No content for Part {activePreviewPart} yet.</p>;
                return (
                  <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-6 border border-slate-100">
                    <h3 className="font-bold text-[#0058be] mb-4 text-center">Part {activePreviewPart}</h3>
                    <p className="text-[#424754] text-sm whitespace-pre-wrap leading-relaxed">{content as string}</p>
                  </div>
                );
             })()}
             <div className="mt-auto pt-8">
               <div className="w-24 h-24 bg-[#0058be] rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               </div>
             </div>
          </div>
        )}
        
        {isWriting && (
          <div className="p-4 flex flex-col space-y-6">
             {(() => {
                const task = writingTasks[activePreviewPart as any];
                if (!task || !task.content) return <p className="text-slate-400 text-center mt-10 text-sm">No content for Task {activePreviewPart} yet.</p>;
                return (
                  <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-[#0058be]">Task {activePreviewPart}</h3>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">60:00</span>
                    </div>
                    {task.image_url && (
                      <img src={task.image_url} alt="Task Image" className="w-full h-40 object-contain bg-slate-50 rounded-lg mb-4" />
                    )}
                    <div className="text-[#424754] text-sm mb-4" dangerouslySetInnerHTML={{ __html: task.content }} />
                    <div className="h-32 bg-[#f7f9fb] border border-slate-200 rounded-xl p-3 text-slate-400 text-sm">
                      Write your essay here...
                    </div>
                  </div>
                );
             })()}
          </div>
        )}

        {!isSpeaking && !isWriting && (
          <div className="p-4 flex flex-col space-y-4">
             {lesson?.passages?.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                   <h3 className="font-bold text-[#0058be] mb-2">{p.title}</h3>
                   {p.image_url && <img src={p.image_url} className="w-full h-32 object-contain mb-3 rounded" />}
                   <div className="text-sm text-[#424754] max-h-40 overflow-y-auto mb-4" dangerouslySetInnerHTML={{ __html: p.content_html }} />
                   
                   <div className="border-t border-slate-100 pt-4 space-y-4">
                     {lesson?.question_groups?.filter((g: any) => g.passage_id === p.id).map((g: any) => (
                        <div key={g.id}>
                           <p className="font-bold text-xs text-slate-500 mb-2 uppercase">{g.title}</p>
                           <p className="text-xs text-slate-500 mb-3 italic">{g.instruction}</p>
                           {questions.filter((q: any) => q.group_id === g.id).map((q: any, idx: number) => (
                              <div key={q.id} className="bg-[#f7f9fb] p-3 rounded-xl mb-2">
                                <span className="font-bold text-[#0058be] mr-2">{idx + 1}.</span>
                                <span className="text-sm text-[#191c1e]">{q.content}</span>
                              </div>
                           ))}
                        </div>
                     ))}
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PartBadge = ({ part }: { part?: number | null }) => {
  if (!part) return null;
  const colors = ['', 'bg-blue-100 text-blue-700', 'bg-orange-100 text-orange-700', 'bg-green-100 text-green-700'];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${colors[part] ?? 'bg-slate-100 text-slate-600'}`}>
      Part {part}
    </span>
  );
};

export default function AdminQuestionBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<(Lesson & { passages?: Passage[]; question_groups?: QuestionGroup[] }) | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'config' | 'outline'>('outline');
  const [leftTab, setLeftTab] = useState<'pdf' | 'preview'>('pdf');

  const isSpeaking = lesson?.lesson_type === 'speaking';
  const isWriting = lesson?.lesson_type === 'writing';
  const isReadingOrListening = lesson?.lesson_type === 'reading' || lesson?.lesson_type === 'listening';

  useEffect(() => {
    if (isSpeaking || isWriting) {
      setActiveTab('config');
      setLeftTab('preview');
    }
  }, [isSpeaking, isWriting]);

  // ── Config state ────────────────────────────────────────────────────────────
  const [speakingTasks, setSpeakingTasks] = useState<{ [key: number]: string }>({ 1: '', 2: '', 3: '' });
  const [writingTasks, setWritingTasks] = useState<{ [key: number]: { content: string, image_url: string } }>({ 1: { content: '', image_url: '' }, 2: { content: '', image_url: '' } });
  // lesson_parts config for reading/listening
  const [selectedParts, setSelectedParts] = useState<number[]>([]);

  useEffect(() => {
    if (!lesson) return;
    if (isSpeaking && lesson.passages && lesson.question_groups) {
      const getSpeakingContent = (partNum: number) => {
        const group = lesson.question_groups!.find(g => g.part === partNum);
        if (!group) return '';
        const qs = questions.filter(q => q.group_id === group.id);
        if (partNum === 2) {
          const passage = lesson.passages!.find(p => p.id === group.passage_id);
          const prompt = passage?.content_html ? passage.content_html + '\n\n' : '';
          return prompt + qs.map(q => q.content).join('\n');
        } else {
          return qs.map(q => q.content).join('\n');
        }
      };
      setSpeakingTasks({ 1: getSpeakingContent(1), 2: getSpeakingContent(2), 3: getSpeakingContent(3) });
    }
    if (isWriting && lesson.passages) {
       const p1 = lesson.passages.find(p => p.part === 1);
       const p2 = lesson.passages.find(p => p.part === 2);
       setWritingTasks({ 
         1: { content: p1?.content_html || '', image_url: p1?.image_url || '' }, 
         2: { content: p2?.content_html || '', image_url: p2?.image_url || '' } 
       });
    }
    if (lesson.lesson_parts) {
      setSelectedParts(lesson.lesson_parts);
    } else {
      setSelectedParts(isWriting ? [1, 2] : [1, 2, 3]);
    }
  }, [lesson, questions, isSpeaking, isWriting]);

  // ── Passage form state ───────────────────────────────────────────────────────
  const [showPassageForm, setShowPassageForm] = useState(false);
  const [passageData, setPassageData] = useState<Partial<Passage>>({
    title: '', content_html: '', order: 0, part: 1, audio_url: '', transcript: '', image_url: '',
  });
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);

  // ── Group form state ─────────────────────────────────────────────────────────
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupData, setGroupData] = useState<Partial<QuestionGroup>>({
    title: '', instruction: '', group_type: 'MULTIPLE_CHOICE', passage_id: '', order: 0, part: 1,
  });
  const [editingGroup, setEditingGroup] = useState<QuestionGroup | null>(null);

  // ── Question form state ──────────────────────────────────────────────────────
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionData, setQuestionData] = useState<Partial<Question>>({
    content: '', question_type: 'reading', group_id: '', correct_answer: '', options: {},
  });
  const [optionInputs, setOptionInputs] = useState([
    { key: 'A', value: '' }, { key: 'B', value: '' },
  ]);

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [rawTextForAi, setRawTextForAi] = useState('');

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [lessonData, questionsData] = await Promise.all([
        api.lessons.get(lessonId),
        api.lessons.questions(lessonId),
      ]);
      setLesson(lessonData);
      setQuestions(questionsData || []);
      if (lessonData?.question_groups?.length) {
        setQuestionData(prev => ({
          ...prev,
          group_id: lessonData.question_groups![0].id,
          question_type: lessonData.lesson_type || 'reading',
        }));
      } else {
        setQuestionData(prev => ({ ...prev, question_type: lessonData?.lesson_type || 'reading' }));
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
      if (result.status === 'completed') loadData();
      else console.error('BG Job Failed:', result.error);
    } catch (err) {
      console.error('Polling Error:', err);
    } finally {
      setIsAiGenerating(false);
      setAiStatus('');
      router.replace(`/admin/lessons/${lessonId}/questions`);
    }
  }, [lessonId, loadData, router]);

  useEffect(() => {
    loadData();
    const jobId = new URLSearchParams(window.location.search).get('job_id');
    if (jobId) startJobPolling(jobId);
  }, [lessonId, loadData, startJobPolling]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleUpdateConfig = async () => {
    try {
      await api.lessons.update(lessonId, { lesson_parts: selectedParts });

      if (isWriting) {
        // Save Writing Tasks properly through Passage -> Group -> Question
        for (const part of selectedParts) {
          const taskData = writingTasks[part as 1|2];
          if (!taskData.content || !taskData.content.trim()) continue;

          const existingPassages = lesson?.passages?.filter(p => p.part === part) || [];
          let passage = existingPassages[0];
          
          if (passage) {
            await api.lessons.updatePassage(passage.id, { content_html: taskData.content, image_url: taskData.image_url });
            // Clean up any duplicates caused by previous partial failures
            for (let i = 1; i < existingPassages.length; i++) {
              await api.lessons.deletePassage(existingPassages[i].id);
            }
          } else {
            passage = await api.lessons.createPassage(lessonId, { 
              title: `Task ${part}`, 
              part, 
              content_html: taskData.content,
              image_url: taskData.image_url
            });
            const group = await api.lessons.createQuestionGroup(lessonId, {
              passage_id: passage.id,
              group_type: 'WRITING_TASK',
              title: `Task ${part}`,
              part
            });
            await api.lessons.createQuestion(lessonId, {
              group_id: group.id,
              content: `Write your response for Task ${part}`,
              question_type: 'writing',
            });
          }
        }
      } else if (isSpeaking) {
        for (const part of selectedParts) {
          const rawContent = speakingTasks[part as 1|2|3];
          if (!rawContent || !rawContent.trim()) continue;

          // Delete existing passages (will cascade delete group and questions). Delete all in case of duplicates.
          const existingPassages = lesson?.passages?.filter(p => p.part === part) || [];
          for (const ep of existingPassages) {
            await api.lessons.deletePassage(ep.id);
          }

          const lines = rawContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const title = `Speaking Part ${part}`;
          
          let passageContent = '';
          let qs = lines;

          if (part === 2) {
            passageContent = lines[0]; // First line is Cue Card
            qs = lines.slice(1); // Rest are bullet points
          }

          const passage = await api.lessons.createPassage(lessonId, { 
            title, 
            part, 
            content_html: passageContent 
          });

          const group = await api.lessons.createQuestionGroup(lessonId, {
            passage_id: passage.id,
            group_type: `SPEAKING_PART_${part}`,
            title,
            part
          });

          for (const q of qs) {
            await api.lessons.createQuestion(lessonId, {
              group_id: group.id,
              content: q,
              question_type: 'speaking',
            });
          }
        }
      }
      alert('Config updated successfully!');
      loadData();
    } catch {
      alert('Failed to update config');
    }
  };

  const togglePart = (part: number) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part].sort()
    );
  };

  // Passage CRUD
  const handleSavePassage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPassage) {
        await api.lessons.updatePassage(editingPassage.id, passageData);
        setEditingPassage(null);
      } else {
        await api.lessons.createPassage(lessonId, passageData);
      }
      setShowPassageForm(false);
      setPassageData({ title: '', content_html: '', order: 0, part: 1, audio_url: '', transcript: '', image_url: '' });
      loadData();
    } catch {
      alert('Failed to save passage');
    }
  };

  const handleEditPassage = (p: Passage) => {
    setEditingPassage(p);
    setPassageData({ title: p.title, content_html: p.content_html, order: p.order, part: p.part ?? 1, audio_url: p.audio_url ?? '', transcript: p.transcript ?? '', image_url: p.image_url ?? '' });
    setShowPassageForm(true);
  };

  const handleDeletePassage = async (id: string) => {
    if (!confirm('Delete this passage?')) return;
    try {
      await api.lessons.deletePassage(id);
      loadData();
    } catch {
      alert('Failed to delete passage');
    }
  };

  // Group CRUD
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.lessons.updateQuestionGroup(editingGroup.id, groupData);
        setEditingGroup(null);
      } else {
        await api.lessons.createQuestionGroup(lessonId, groupData);
      }
      setShowGroupForm(false);
      setGroupData({ title: '', instruction: '', group_type: 'MULTIPLE_CHOICE', passage_id: '', order: 0, part: 1 });
      loadData();
    } catch {
      alert('Failed to save group');
    }
  };

  const handleEditGroup = (g: QuestionGroup) => {
    setEditingGroup(g);
    setGroupData({ title: g.title, instruction: g.instruction, group_type: g.group_type, passage_id: g.passage_id ?? '', order: g.order, part: g.part ?? 1 });
    setShowGroupForm(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    try {
      await api.lessons.deleteQuestionGroup(id);
      loadData();
    } catch {
      alert('Failed to delete group');
    }
  };

  // Question create
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
      await api.lessons.createQuestion(lessonId, { ...questionData, lesson_id: lessonId, options: formattedOptions } as any);
      setShowQuestionForm(false);
      setQuestionData(prev => ({ ...prev, content: '', correct_answer: '', scoring_criteria: '' }));
      loadData();
    } catch {
      alert('Failed to create question');
    }
  };

  // AI
  const handleAiGenerate = async () => {
    if (!rawTextForAi.trim()) { alert('Please paste some raw text from PDF first.'); return; }
    setIsAiGenerating(true);
    setAiStatus('Sending to AI...');
    try {
      const { job_id } = await api.lessons.autoGenerate(lessonId, rawTextForAi);
      setAiStatus('AI is processing (20-40s)...');
      const result = await api.jobs.waitForJob(job_id, (job) => {
        if (job.status === 'pending') setAiStatus('Still working...');
      });
      if (result.status === 'completed') {
        alert('AI Generation Successful!');
        setRawTextForAi('');
        loadData();
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err: any) {
      alert('AI Generation Failed: ' + err.message);
    } finally {
      setIsAiGenerating(false);
      setAiStatus('');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Builder...</div>;
  if (!lesson) return <div>Lesson not found</div>;

  const isListening = lesson.lesson_type === 'listening';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">&larr; Back</button>
          <h1 className="font-bold text-slate-800">Exam Builder: {lesson.title}</h1>
          {lesson.lesson_parts && lesson.lesson_parts.length > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
              Parts: {lesson.lesson_parts.join(', ')}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-full mr-4">
            {(isSpeaking || isWriting || isReadingOrListening) && (
              <button onClick={() => setActiveTab('config')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Config</button>
            )}
            {!isSpeaking && !isWriting && (
              <button onClick={() => setActiveTab('outline')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === 'outline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Outline</button>
            )}
          </div>
          <button
            onClick={() => router.push('/admin/tests')}
            className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Finish &amp; Publish
          </button>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document / Preview */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-100">
          <div className="flex border-b border-slate-200 bg-white">
            <button onClick={() => setLeftTab('pdf')} className={`flex-1 py-3 text-sm font-bold ${leftTab === 'pdf' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>PDF Document</button>
            <button onClick={() => setLeftTab('preview')} className={`flex-1 py-3 text-sm font-bold ${leftTab === 'preview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Mobile Preview</button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {leftTab === 'pdf' && (
              <div className="absolute inset-0 bg-slate-200">
                {lesson.pdf_url ? (
                  <iframe src={`${lesson.pdf_url}#toolbar=0`} className="w-full h-full border-none" title="Reference PDF" />
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center p-12 text-center">
                    <p className="text-slate-500 mb-4">No PDF attached to this lesson.</p>
                    <Link href={`/admin/test-sets/${lesson.course_id}`} className="text-indigo-600 font-bold">Attach PDF &rarr;</Link>
                  </div>
                )}
              </div>
            )}
            {leftTab === 'preview' && (
              <div className="absolute inset-0 overflow-y-auto p-8 flex items-start justify-center bg-slate-100">
                 <MobileSimulator lesson={lesson} speakingTasks={speakingTasks} writingTasks={writingTasks} questions={questions} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="w-1/2 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* ── CONFIG TAB ── */}
            {activeTab === 'config' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configuration</h2>
                  <button onClick={handleUpdateConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-100">
                    Save Changes
                  </button>
                </div>

                {/* lesson_parts selector for all test types */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Active Parts (lesson_parts)</h3>
                    <p className="text-xs text-slate-500 mt-1">Choose which IELTS parts are included in this test. The mobile app will only render these parts.</p>
                  </div>
                  <div className="flex gap-3">
                    {(isWriting ? [1, 2] : [1, 2, 3]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePart(p)}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
                          selectedParts.includes(p)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {isWriting ? `TASK ${p}` : `PART ${p}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    lesson_parts: [{selectedParts.join(', ')}]
                  </p>
                </div>

                {/* Speaking config */}
                {isSpeaking && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Speaking Content Config</h3>
                    <p className="text-xs text-slate-500 mb-4">Define questions for each part. Put each question on a new line. For Part 2, the first line is the Cue Card prompt, the rest are bullet points.</p>
                    <div className="space-y-4">
                      {selectedParts.map((part) => (
                        <div key={part} className="p-4 bg-white rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-indigo-600 mb-2">Part {part}</h4>
                          <textarea
                            placeholder={part === 2 ? "Describe a book...\n- What is it\n- When did you read it" : `Part ${part} questions (one per line)...`}
                            rows={6}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                            value={speakingTasks[part as 1|2|3] || ''}
                            onChange={(e) => setSpeakingTasks({ ...speakingTasks, [part]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Writing config */}
                {isWriting && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Writing Task Configuration</h3>
                    <div className="space-y-4">
                      {selectedParts.map((task) => (
                        <div key={task} className="p-4 bg-white rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-indigo-600 mb-2">Task {task}</h4>
                          <textarea
                            placeholder={`Task ${task} Prompt/Instruction...`}
                            rows={5}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            value={writingTasks[task as 1|2]?.content || ''}
                            onChange={(e) => setWritingTasks({ ...writingTasks, [task]: { ...writingTasks[task as 1|2], content: e.target.value } })}
                          />
                          <input
                            type="text"
                            placeholder="Image URL for Chart/Diagram (optional)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mt-3 bg-slate-50 focus:bg-white"
                            value={writingTasks[task as 1|2]?.image_url || ''}
                            onChange={(e) => setWritingTasks({ ...writingTasks, [task]: { ...writingTasks[task as 1|2], image_url: e.target.value } })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── OUTLINE TAB ── */}
            {activeTab === 'outline' && (
              <section className="space-y-6">
                {/* AI Box */}
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
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Question Builder Tree</h2>
                </div>

                <div className="space-y-6">
                  {selectedParts.map(part => {
                    const partPassages = lesson.passages?.filter(p => p.part === part) || [];
                    const partGroups = lesson.question_groups?.filter(g => g.part === part) || [];
                    const orphanGroups = partGroups.filter(g => !g.passage_id);

                    if (partPassages.length === 0 && orphanGroups.length === 0) return null;

                    return (
                      <div key={`part-${part}`} className="border-l-4 border-indigo-600 pl-4 space-y-4">
                        <h3 className="font-black text-lg text-slate-800">Part {part}</h3>
                        
                        {/* Render Passages */}
                        {partPassages.map(p => {
                          const groups = partGroups.filter(g => g.passage_id === p.id);
                          return (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-slate-800">📄 {p.title || 'Untitled Passage'}</h4>
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-1 prose" dangerouslySetInnerHTML={{ __html: p.content_html || '' }} />
                                  {p.image_url && <span className="text-xs text-blue-500 font-bold mt-1 block">🖼️ Image Attached</span>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleEditPassage(p)} className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded font-bold">Edit</button>
                                  <button onClick={() => handleDeletePassage(p.id)} className="px-2 py-1 text-xs bg-slate-100 hover:bg-red-50 text-red-500 rounded font-bold">Delete</button>
                                </div>
                              </div>
                              
                              {/* Render Groups in Passage */}
                              <div className="pl-6 space-y-3">
                                {groups.map(g => {
                                  const groupQs = questions.filter(q => q.group_id === g.id);
                                  return (
                                    <div key={g.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-sm text-indigo-700">🧩 {g.title || g.group_type}</h5>
                                      </div>
                                      {/* Render Questions */}
                                      <div className="space-y-1.5 mt-2 pl-4 border-l-2 border-indigo-100">
                                        {groupQs.map((q, idx) => (
                                          <div key={q.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 text-xs">
                                            <span className="font-medium text-slate-700"><span className="font-bold mr-1">Q{idx + 1}.</span> {q.content}</span>
                                            <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{q.correct_answer}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Render Orphan Groups */}
                        {orphanGroups.map(g => {
                          const groupQs = questions.filter(q => q.group_id === g.id);
                          return (
                            <div key={g.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                               <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-bold text-sm text-indigo-700">🧩 {g.title || g.group_type} (No Passage)</h5>
                                </div>
                                <div className="space-y-1.5 mt-2 pl-4 border-l-2 border-indigo-100">
                                  {groupQs.map((q, idx) => (
                                    <div key={q.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 text-xs">
                                      <span className="font-medium text-slate-700"><span className="font-bold mr-1">Q{idx + 1}.</span> {q.content}</span>
                                      <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{q.correct_answer}</span>
                                    </div>
                                  ))}
                                </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>

      {/* ── PASSAGE MODAL ── */}
      {showPassageForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingPassage ? 'Edit Passage' : 'New Passage'}</h2>
            <form onSubmit={handleSavePassage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input type="text" className="w-full border rounded-lg p-2" value={passageData.title} onChange={e => setPassageData({...passageData, title: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Content (HTML allowed)</label>
                <textarea rows={5} className="w-full border rounded-lg p-2" value={passageData.content_html} onChange={e => setPassageData({...passageData, content_html: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Image URL (Optional)</label>
                <input type="text" className="w-full border rounded-lg p-2" value={passageData.image_url} onChange={e => setPassageData({...passageData, image_url: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPassageForm(false)} className="flex-1 bg-slate-100 py-2 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
