'use client';

import React, { useState } from 'react';

interface IeltsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
  onExit?: () => void; // New optional prop for exiting the test/view
  result: any;
  lessonType: string;
}

export default function IeltsModal({
  isOpen,
  onClose,
  onRetake,
  onExit,
  result,
  lessonType
}: IeltsModalProps) {
  const [view, setView] = useState<'summary' | 'review'>('summary');

  if (!isOpen) return null;

  const feedback = result?.feedback || result?.results?.[0]?.feedback;
  
  // Calculate score
  let overallScore: string | number = '-';
  if (feedback?.criteria_scores) {
    const scores = Object.values(feedback.criteria_scores) as number[];
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      overallScore = Math.round(avg * 2) / 2;
    }
  }

  const handleClose = () => {
    setView('summary');
    if (onExit) {
      onExit();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-white w-full ${view === 'summary' ? 'max-w-lg' : 'max-w-4xl'} max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 animate-in zoom-in-95`}>
        
        {view === 'summary' ? (
          /* SUMMARY VIEW */
          <div className="flex flex-col">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Estimated Performance</p>
              <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/20">
                <span className="text-5xl font-black text-white mr-2">{overallScore}</span>
                <span className="text-xl font-bold text-white/80">Band</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">Test Submitted Successfully!</h2>
            </div>
            
            <div className="p-12 space-y-6 text-center">
              <button
                onClick={() => setView('review')}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                REVIEW DETAILED FEEDBACK
              </button>
              <button onClick={handleClose} className="w-full text-slate-400 font-bold hover:text-slate-600">
                Close
              </button>
            </div>
          </div>
        ) : (
          /* DETAILED REVIEW VIEW */
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <button onClick={() => setView('summary')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-colors">
                &larr; Back to Summary
              </button>
              <h2 className="text-xl font-black text-slate-900">Detailed AI Analysis</h2>
              <button onClick={handleClose} className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                &times;
              </button>
            </div>

            <div className="p-8 md:p-12 overflow-y-auto no-scrollbar space-y-12">
              {/* Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(feedback?.criteria_scores || {}).map(([key, score]) => (
                  <div key={key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace('_', ' ')}</p>
                    <p className="text-2xl font-black text-indigo-600">Band {score as number}</p>
                  </div>
                ))}
              </div>

              {/* AI Feedback */}
              <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span>💡</span> AI Feedback & Comments
                </h4>
                <p className="text-indigo-50 leading-relaxed font-medium text-lg">{feedback?.feedback}</p>
              </div>

              {/* Suggested Version */}
              {feedback?.suggested_version && (
                <div className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[3rem]">
                  <h4 className="text-emerald-900 text-xl font-black mb-6 flex items-center gap-3">
                    <span>✨</span> Suggested Band 8+ Version
                  </h4>
                  <div className="text-emerald-800 leading-relaxed font-serif text-lg whitespace-pre-wrap">
                    {feedback.suggested_version}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-8 flex flex-col items-center gap-6 border-t border-slate-100">
                <button
                  onClick={() => { onRetake(); handleClose(); }}
                  className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black hover:bg-black transition-all"
                >
                  START NEW ATTEMPT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
