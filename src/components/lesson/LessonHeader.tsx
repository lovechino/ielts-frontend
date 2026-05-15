'use client';

import React from 'react';

interface LessonHeaderProps {
  title: string;
  lessonType: string;
  timeLeft: number | null;
  showResults: boolean;
  answeredCount: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onExit: () => void;
  onSubmit: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function LessonHeader({
  title,
  lessonType,
  timeLeft,
  showResults,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onExit,
  onSubmit,
}: LessonHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-900 transition-colors">
          &larr; Exit
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">{title}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            IELTS {lessonType?.toUpperCase() || 'READING'} PRACTICE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {!showResults && timeLeft !== null && (
          <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl border-2 transition-colors ${
            timeLeft < 300
              ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
              : 'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-xl font-black">{formatTime(timeLeft)}</span>
          </div>
        )}

        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
          <span className="font-mono font-bold text-indigo-600">{answeredCount} / {totalQuestions}</span>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || showResults}
          className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 ${
            showResults 
              ? 'bg-slate-900 text-white cursor-default'
              : (answeredCount === 0 || isSubmitting)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {showResults ? 'REVIEW RESULTS' : 'SUBMIT TEST'}
        </button>
      </div>
    </header>
  );
}
