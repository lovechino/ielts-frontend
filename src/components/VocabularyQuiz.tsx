'use client';

import { useState, useMemo } from 'react';
import { Vocabulary } from '@/lib/api';

interface QuizProps {
  words: Vocabulary[];
  topic?: string;
}
export default function VocabularyQuiz({ words, topic }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // Generate questions: For each word, pick 3 random definitions from other words as distractors
  const questions = useMemo(() => {
    return words.map((word) => {
      const distractors = words
        .filter((w) => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.definition);

      const options = [...distractors, word.definition].sort(() => 0.5 - Math.random());
      
      return {
        word,
        options,
        correctAnswer: word.definition,
      };
    });
  }, [words]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(option);
    setIsAnswered(true);
    
    if (option === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    const percentage = Math.round((score / words.length) * 100);
    return (
      <div className="flex flex-col items-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="text-8xl mb-8">{percentage >= 80 ? '🏆' : percentage >= 50 ? '🥈' : '📚'}</div>
        <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Results</h2>
        <p className="text-gray-500 text-xl mb-12">You scored {score} out of {words.length}</p>
        
        <div className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100">
           <div className="flex justify-between items-center mb-6">
             <span className="font-bold text-gray-500">Accuracy</span>
             <span className={`text-2xl font-black ${percentage >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
               {percentage}%
             </span>
           </div>
           <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-8">
             <div 
               className={`h-full transition-all duration-1000 ${percentage >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
               style={{ width: `${percentage}%` }}
             ></div>
           </div>

           <button 
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setSelectedAnswer(null);
              setIsAnswered(false);
              setShowResults(false);
            }}
            className="w-full btn-primary py-4 text-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 w-full max-w-3xl mx-auto">
      {/* Progress */}
      <div className="w-full mb-12">
        <div className="flex justify-between items-end mb-2 px-2 text-xs font-black text-gray-400 uppercase tracking-widest">
          <span>Question {currentIndex + 1} of {words.length} {topic && `• ${topic}`}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full bg-white rounded-[3rem] p-12 shadow-sm border border-gray-100 mb-8">
        <span className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-6">
          What is the definition of:
        </span>
        <h2 className="text-5xl font-black text-gray-900 mb-10 tracking-tighter">
          {currentQuestion.word.word}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedAnswer;
            
            let bgColor = 'bg-white hover:bg-slate-50 border-gray-100';
            let textColor = 'text-gray-700';
            let icon = null;

            if (isAnswered) {
              if (isCorrect) {
                bgColor = 'bg-green-50 border-green-200';
                textColor = 'text-green-700';
                icon = '✅';
              } else if (isSelected) {
                bgColor = 'bg-red-50 border-red-200';
                textColor = 'text-red-700';
                icon = '❌';
              } else {
                bgColor = 'bg-white opacity-50 border-gray-50';
                textColor = 'text-gray-300';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${bgColor} ${isSelected ? 'ring-4 ring-indigo-500/10' : ''}`}
              >
                <span className={`text-lg font-bold leading-tight ${textColor}`}>
                  {option}
                </span>
                {icon && <span className="text-xl ml-4">{icon}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="w-full flex justify-end">
        {isAnswered && (
          <button 
            onClick={handleNext}
            className="btn-primary px-10 py-4 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 shadow-xl shadow-indigo-200"
          >
            <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
