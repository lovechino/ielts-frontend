'use client';

import { useState, useEffect } from 'react';
import { Vocabulary } from '@/lib/api';

interface FlashcardsProps {
  words: Vocabulary[];
}

export default function VocabularyFlashcards({ words }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync with props if words change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [words]);

  if (!words || words.length === 0) return null;

  const currentWord = words[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center py-10 w-full max-w-2xl mx-auto">
      {/* Simple Progress Bar */}
      <div className="w-full mb-8">
        <div className="flex justify-between items-end mb-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>Card {currentIndex + 1} of {words.length}</span>
          <span>{currentWord.topic}</span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Card Container */}
      <div 
        className="relative w-full h-[450px] cursor-pointer group perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden glass-card flex flex-col items-center justify-center p-12 text-center shadow-xl border-2 border-indigo-50">
            <span className="text-sm font-black text-indigo-400 mb-6 uppercase tracking-widest">IELTS Vocabulary</span>
            <h2 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter">{currentWord.word}</h2>
            {currentWord.pronunciation && (
              <p className="text-xl text-gray-400 font-medium font-mono">{currentWord.pronunciation}</p>
            )}
            <div className="mt-12 flex items-center gap-2 text-indigo-600 font-bold animate-bounce opacity-70">
              <span>Tap to flip</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-2xl flex flex-col p-12 border-4 border-indigo-600 overflow-y-auto">
            <div className="mb-8">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Definition</h4>
              <p className="text-2xl font-bold text-gray-800 leading-tight">
                {currentWord.definition}
              </p>
            </div>

            {currentWord.example && (
              <div className="mb-8">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Example</h4>
                <p className="text-lg text-gray-600 italic leading-relaxed border-l-4 border-indigo-100 pl-4">
                  &quot;{currentWord.example}&quot;
                </p>
              </div>
            )}

            <div className="mt-auto pt-6 text-center text-gray-300 text-xs font-bold uppercase">
              Tap to see word again
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6 mt-12">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all border border-gray-100 hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          className="btn-primary px-12 py-4 text-lg shadow-xl shadow-indigo-100"
        >
          {isFlipped ? 'Show Word' : 'Show Meaning'}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all border border-gray-100 hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <p className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-widest">
        Switch to &quot;Quiz Test&quot; tab to check your knowledge
      </p>
    </div>
  );
}
