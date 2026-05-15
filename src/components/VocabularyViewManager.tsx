'use client';

import React, { Suspense } from 'react';
import { Vocabulary } from '@/lib/api';
import VocabularyFlashcards from './VocabularyFlashcards';
import VocabularyQuiz from './VocabularyQuiz';

interface VocabularyViewManagerProps {
  displayWords: Vocabulary[];
  currentMode: string;
  currentTopic: string;
  loading?: boolean;
}

export default function VocabularyViewManager({ 
  displayWords, 
  currentMode, 
  currentTopic,
  loading 
}: VocabularyViewManagerProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading Vocabulary Content...</div>}>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {currentMode === 'flashcards' ? (
            <VocabularyFlashcards words={displayWords} />
          ) : currentMode === 'quiz' ? (
            <VocabularyQuiz words={displayWords} topic={currentTopic} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayWords.map((v) => (
                <div
                  key={v.id}
                  className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {v.word}
                    </h3>
                    {v.level && (
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                        {v.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    {v.topic && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {v.topic}
                      </span>
                    )}
                    {v.pronunciation && (
                      <span className="text-sm font-medium text-indigo-400 font-serif">
                        {v.pronunciation}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed mb-6">
                    {v.definition}
                  </p>
                  {v.example && (
                    <div className="pt-4 border-t border-gray-50 text-gray-500 italic text-sm">
                      &quot;{v.example}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
}
