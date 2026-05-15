'use client';

import React from 'react';
import { Question } from '@/lib/api';

interface WritingSectionProps {
  question: Question | undefined;
  taskIndex: number;
  selectedAnswer: string;
  showResults: boolean;
  result: { feedback?: { criteria_scores?: Record<string, number>; feedback?: string; suggested_version?: string }; results?: { question_id: string; feedback?: Record<string, unknown> }[] } | null;
  onAnswerChange: (questionId: string, value: string) => void;
}

function WritingFeedback({ feedback }: { feedback: { criteria_scores?: Record<string, number>; feedback?: string; suggested_version?: string } | undefined }) {
  if (!feedback) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h4 className="text-xl font-black text-slate-900 mb-2">AI is analyzing your response...</h4>
        <p className="text-slate-500 font-medium">This usually takes 10-20 seconds. Please stay on this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(feedback.criteria_scores || {}).map(([key, score]) => (
          <div key={key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {key.replace('_', ' ')}
            </p>
            <p className="text-2xl font-black text-indigo-600">Band {score}</p>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100">
        <h4 className="text-lg font-black mb-4 flex items-center gap-2">
          <span>💡</span> AI Feedback & Comments
        </h4>
        <p className="text-indigo-50 leading-relaxed font-medium">{feedback.feedback}</p>
      </div>

      {feedback.suggested_version && (
        <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem]">
          <h4 className="text-emerald-900 text-lg font-black mb-4 flex items-center gap-2">
            <span>✨</span> Suggested Band 8+ Version
          </h4>
          <div className="text-emerald-800 leading-relaxed font-serif text-lg whitespace-pre-wrap">
            {feedback.suggested_version}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WritingSection({
  question: q,
  taskIndex,
  selectedAnswer,
  showResults,
  result,
  onAnswerChange,
}: WritingSectionProps) {
  if (!q) return null;

  const wordCount = (selectedAnswer || '').trim().split(/\s+/).filter(Boolean).length;
  
  // Try to find feedback in either direct property or inside results array
  let feedback = result?.feedback;
  if (!feedback && result?.results && result.results.length > 0) {
    feedback = result.results[0].feedback as any;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase">
            Task {taskIndex + 1}
          </span>
          <h3 className="text-xl font-black text-slate-900">Your Response</h3>
        </div>
        <textarea
          disabled={showResults}
          value={selectedAnswer || ''}
          onChange={(e) => onAnswerChange(q.id, e.target.value)}
          className={`w-full h-[500px] p-6 rounded-2xl border font-serif text-lg leading-relaxed transition-all outline-none resize-none ${
            showResults 
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70' 
              : 'bg-slate-50 text-slate-800 border-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
          }`}
          placeholder={showResults ? "No response submitted." : "Type your essay here..."}
        />
        <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Word Count: {wordCount}</span>
          <span>{showResults ? 'Submitted' : 'Autosaved'}</span>
        </div>
      </div>

      {showResults && <WritingFeedback feedback={feedback} />}
    </div>
  );
}
