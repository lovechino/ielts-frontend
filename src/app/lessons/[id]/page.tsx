'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Lesson, Question, Passage, QuestionGroup } from '@/lib/api';
import LessonHeader from '@/components/lesson/LessonHeader';
import PassageSection from '@/components/lesson/PassageSection';
import QuestionSection from '@/components/lesson/QuestionSection';
import WritingSection from '@/components/lesson/WritingSection';
import IeltsModal from '@/components/lesson/IeltsModal';

type ExtendedLesson = Lesson & {
  passages?: Passage[];
  question_groups?: QuestionGroup[];
};

export default function LessonExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lesson, setLesson] = useState<ExtendedLesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [lessonData, questionsData, progressData] = await Promise.all([
          api.lessons.get(id),
          api.lessons.questions(id),
          api.progress.get(id),
        ]);
        setLesson(lessonData);
        setQuestions(questionsData);
        applyProgress(progressData as Record<string, unknown> | null, lessonData);
      } catch (err) {
        console.error('Error loading lesson:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function applyProgress(progressData: Record<string, unknown> | null, lessonData: Lesson) {
    const prog = progressData as Record<string, unknown> | null;
    if (prog?.status === 'completed') {
      setSelectedAnswers((prog.draft_answers as Record<string, string>) || {});
      setSubmissionResult(prog);
      // We don't set showResults(true) anymore by default as per user request
    } else {
      setSelectedAnswers((prog?.draft_answers as Record<string, string>) || {});
      setTimeLeft((prog?.time_left as number) ?? (lessonData.time_limit ? lessonData.time_limit * 60 : 3600));
    }
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    // Validation: Prevent empty manual submission
    if (!isTimeUp) {
      const answerCount = Object.keys(selectedAnswers).length;
      if (answerCount === 0) {
        alert("Please provide at least one answer before submitting.");
        return;
      }

      // Special validation for Writing tasks
      if (lesson?.lesson_type === 'writing') {
        const totalText = Object.values(selectedAnswers).join('').trim();
        if (totalText.length < 10) {
          alert("Your essay is too short. Please write more before submitting.");
          return;
        }
      }

      if (!confirm("Are you sure you want to submit your exam? This action cannot be undone.")) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([qId, ans]) => ({ question_id: qId, answer: ans }));
      const result = await api.progress.submit({ lesson_id: id, answers }) as Record<string, unknown>;
      setSubmissionResult(result);
      setShowResults(true);
      setIsModalOpen(true); // Open the summary modal
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    } catch {
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, isSubmitting, selectedAnswers, lesson?.lesson_type, isTimeUp]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleRetake = async () => {
    if (!confirm("Are you sure you want to retake this test? Your current results will be cleared.")) {
      return;
    }
    setLoading(true);
    try {
      await api.progress.saveDraft({ lesson_id: id, draft_answers: {}, time_left: lesson?.time_limit ? lesson.time_limit * 60 : 3600, status: 'in_progress' });
      setShowResults(false);
      setSubmissionResult(null);
      setSelectedAnswers({});
      setTimeLeft(lesson?.time_limit ? lesson.time_limit * 60 : 3600);
      setIsTimeUp(false);
    } catch (err) {
      alert('Failed to reset test');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || showResults || isTimeUp) return;
    
    async function triggerSubmit() {
      setIsTimeUp(true);
      await handleSubmit();
    }

    if (timeLeft <= 0) {
      triggerSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResults, isTimeUp, handleSubmit]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (showResults) return;
    const timer = setInterval(() => {
      if (Object.keys(selectedAnswers).length > 0) {
        api.progress.saveDraft({ lesson_id: id, draft_answers: selectedAnswers, time_left: timeLeft || 0 });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [selectedAnswers, timeLeft, id, showResults]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Loading Exam...</div>;
  if (!lesson) return <div>Lesson not found</div>;

  const passages = lesson.passages || [];
  const questionGroups = lesson.question_groups || [];
  const activePassageId = passages[activeTabIndex]?.id;
  const isWriting = lesson.lesson_type === 'writing';
  const activeWritingQuestion = isWriting ? questions[activeTabIndex] : undefined;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <LessonHeader
        title={lesson.title}
        lessonType={lesson.lesson_type || 'reading'}
        timeLeft={timeLeft}
        showResults={showResults}
        answeredCount={Object.keys(selectedAnswers).length}
        totalQuestions={questions.length}
        isSubmitting={isSubmitting}
        onExit={() => router.back()}
        onSubmit={handleSubmit}
      />

      {/* Passage Tab Navigation */}
      {passages.length > 1 && (
        <div className="bg-white border-b border-slate-200 px-8 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveTabIndex(idx)}
              className={`px-6 py-4 text-sm font-black border-b-2 transition-all whitespace-nowrap ${
                activeTabIndex === idx
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {isWriting ? `TASK ${idx + 1}` : `PASSAGE ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Split Exam Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Col: Passage */}
        <div className="w-1/2 overflow-y-auto bg-white px-10 py-12 border-r border-slate-200 selection:bg-indigo-100">
          <div className="max-w-2xl mx-auto space-y-16">
            <PassageSection
              passages={passages}
              activeTabIndex={activeTabIndex}
              lessonType={lesson.lesson_type || 'reading'}
            />
          </div>
        </div>

        {/* Right Col: Questions / Writing */}
        <div className="w-1/2 overflow-y-auto px-10 py-12 bg-slate-50/50">
          <div className="max-w-2xl mx-auto space-y-12 pb-32">
            {/* The results will be shown inside QuestionSection or WritingSection when showResults is true */}


            {isWriting ? (
              <WritingSection
                question={activeWritingQuestion}
                taskIndex={activeTabIndex}
                selectedAnswer={activeWritingQuestion ? (selectedAnswers[activeWritingQuestion.id] || '') : ''}
                showResults={showResults}
                result={submissionResult}
                onAnswerChange={handleAnswerSelect}
              />
            ) : (
              <QuestionSection
                questions={questions}
                questionGroups={questionGroups}
                activePassageId={activePassageId}
                selectedAnswers={selectedAnswers}
                showResults={showResults}
                submissionResult={submissionResult}
                onAnswerSelect={handleAnswerSelect}
              />
            )}
          </div>
        </div>
      </div>

      <IeltsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExit={() => router.back()}
        onRetake={handleRetake}
        result={submissionResult}
        lessonType={lesson.lesson_type || 'reading'}
      />

    </div>
  );
}
