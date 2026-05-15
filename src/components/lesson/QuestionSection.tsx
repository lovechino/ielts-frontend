'use client';

import React from 'react';
import { Question, QuestionGroup } from '@/lib/api';

interface QuestionSectionProps {
  questions: Question[];
  questionGroups: QuestionGroup[];
  activePassageId: string | undefined;
  selectedAnswers: Record<string, string>;
  showResults: boolean;
  submissionResult: { results?: { question_id: string; is_correct: boolean; correct_answer?: string }[] } | null;
  onAnswerSelect: (questionId: string, answer: string) => void;
}

interface AnswerButtonProps {
  optionKey: string;
  value: string;
  isSelected: boolean;
  showResults: boolean;
  correctAnswer?: string;
}

function AnswerButton({ optionKey, value, isSelected, showResults, correctAnswer }: AnswerButtonProps) {
  const isActuallyCorrect = optionKey === correctAnswer;

  let btnClass = 'bg-slate-50 border-slate-50 text-slate-600';
  if (showResults) {
    if (isActuallyCorrect) btnClass = 'bg-emerald-600 border-emerald-600 text-white';
    else if (isSelected) btnClass = 'bg-rose-600 border-rose-600 text-white';
  } else if (isSelected) {
    btnClass = 'bg-indigo-600 border-indigo-600 text-white';
  }

  return (
    <span className={`p-4 rounded-2xl border-2 text-left flex items-center gap-4 font-bold ${btnClass}`}>
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm text-slate-900'}`}>
        {optionKey}
      </span>
      {value}
    </span>
  );
}

interface SingleQuestionProps {
  question: Question;
  qIdx: number;
  selectedAnswer: string | undefined;
  showResults: boolean;
  result: { is_correct: boolean; correct_answer?: string } | undefined;
  onSelect: (questionId: string, answer: string) => void;
}

function SingleQuestion({ question: q, qIdx, selectedAnswer, showResults, result, onSelect }: SingleQuestionProps) {
  const isCorrect = result?.is_correct;

  return (
    <div className={`p-8 rounded-[2rem] border-2 transition-all ${
      showResults
        ? isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        : 'bg-white border-white shadow-md shadow-slate-200/50'
    }`}>
      <div className="flex gap-4 mb-6">
        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
          showResults ? (isCorrect ? 'bg-emerald-600' : 'bg-rose-600') : 'bg-slate-900'
        } text-white`}>
          {qIdx + 1}
        </span>
        <p className="text-lg font-bold text-slate-800 leading-tight">{q.content}</p>
      </div>

      {q.options ? (
        <div className="grid grid-cols-1 gap-3 ml-12">
          {Object.entries(q.options).map(([key, value]) => (
            <button
              key={key}
              disabled={showResults}
              onClick={() => onSelect(q.id, key)}
              className={!showResults ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'}
            >
              <AnswerButton
                optionKey={key}
                value={value as string}
                isSelected={selectedAnswer === key}
                showResults={showResults}
                correctAnswer={result?.correct_answer}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="ml-12 mt-4">
          <input
            type="text"
            disabled={showResults}
            value={selectedAnswer || ''}
            onChange={(e) => onSelect(q.id, e.target.value)}
            className={`w-full p-4 rounded-xl border-2 font-bold transition-all outline-none focus:ring-2 ${
              showResults 
                ? (isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700') 
                : 'bg-white border-slate-100 focus:border-indigo-500 text-slate-800'
            }`}
            placeholder="Type your answer here..."
          />
          {showResults && !isCorrect && result?.correct_answer && (
            <div className="mt-2 text-sm font-bold text-emerald-600 px-2">
              Correct Answer: {result.correct_answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionSection({
  questions,
  questionGroups,
  activePassageId,
  selectedAnswers,
  showResults,
  submissionResult,
  onAnswerSelect,
}: QuestionSectionProps) {
  const filteredGroups = questionGroups.filter(g => g.passage_id === activePassageId);

  return (
    <>
      {filteredGroups.map((group) => (
        <section key={group.id} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">{group.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{group.instruction}</p>
          </div>

          <div className="space-y-6">
            {questions
              .filter(q => q.group_id === group.id)
              .map((q, qIdx) => {
                const results = submissionResult?.results as { question_id: string; is_correct: boolean; correct_answer?: string }[] | undefined;
                const result = results?.find((r) => r.question_id === q.id);
                return (
                  <SingleQuestion
                    key={q.id}
                    question={q}
                    qIdx={qIdx}
                    selectedAnswer={selectedAnswers[q.id]}
                    showResults={showResults}
                    result={result}
                    onSelect={onAnswerSelect}
                  />
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}
