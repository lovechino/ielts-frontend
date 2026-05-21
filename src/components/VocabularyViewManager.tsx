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

const posStyles: Record<string, { bg: string; text: string; label: string }> = {
  N: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Danh từ' },
  V: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', label: 'Động từ' },
  ADJ: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', label: 'Tính từ' },
  ADV: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Trạng từ' },
};

function playPronunciation(word: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.414 4.243 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

function PartOfSpeechBadge({ pos }: { pos?: string }) {
  if (!pos) return null;
  const cleanPos = pos.toUpperCase().trim();
  const styles = posStyles[cleanPos] || {
    bg: 'bg-slate-50 border-slate-100',
    text: 'text-slate-600',
    label: cleanPos
  };
  
  return (
    <span className={`px-2.5 py-0.5 border text-[10px] font-black rounded-lg ${styles.bg} ${styles.text}`}>
      {styles.label}
    </span>
  );
}

interface VocabularyRowProps {
  vocab: Vocabulary;
  isMastered: boolean;
  onToggle: (id: string) => void;
}

function VocabularyRow({ vocab, isMastered, onToggle }: VocabularyRowProps) {
  const definitionVi = vocab.definition_vi || vocab.definition;
  
  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 duration-300">
      <td className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => playPronunciation(vocab.word)}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center"
            title="Nghe phát âm"
          >
            <SpeakerIcon />
          </button>
          <div>
            <div className="text-base font-black text-slate-800">{vocab.word}</div>
            {vocab.pronunciation && (
              <div className="text-xs font-semibold text-slate-400 font-serif mt-0.5">
                {vocab.pronunciation}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 sm:p-5">
        <div className="text-sm font-black text-slate-800 leading-relaxed">
          {definitionVi}
        </div>
      </td>
      <td className="p-4 sm:p-5">
        <PartOfSpeechBadge pos={vocab.part_of_speech} />
      </td>
      <td className="p-4 sm:p-5">
        <div className="space-y-1">
          {vocab.example && (
            <div className="text-sm font-medium text-slate-700">
              {vocab.example}
            </div>
          )}
          {vocab.example_vi && (
            <div className="text-xs text-slate-400 italic font-semibold">
              ({vocab.example_vi})
            </div>
          )}
        </div>
      </td>
      <td className="p-4 sm:p-5">
        <button
          onClick={() => onToggle(vocab.id)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
            isMastered ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              isMastered ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </td>
    </tr>
  );
}

interface VocabularyListProps {
  words: Vocabulary[];
  masteredIds: Record<string, boolean>;
  onToggle: (id: string) => void;
}

function VocabularyList({ words, masteredIds, onToggle }: VocabularyListProps) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'mastered' | 'unlearned'>('all');

  const filtered = React.useMemo(() => {
    return words.filter((w) => {
      const mastered = !!masteredIds[w.id];
      if (filter === 'mastered' && !mastered) return false;
      if (filter === 'unlearned' && mastered) return false;
      
      const term = search.toLowerCase();
      return (
        w.word.toLowerCase().includes(term) ||
        (w.definition_vi || w.definition).toLowerCase().includes(term)
      );
    });
  }, [words, search, filter, masteredIds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng hoặc nghĩa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all duration-300"
          />
          <div className="absolute left-3 top-3.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all duration-300"
        >
          <option value="all">Tất cả từ vựng</option>
          <option value="mastered">Đã thuộc lòng</option>
          <option value="unlearned">Chưa thuộc lòng</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-4 sm:p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[20%]">Từ vựng</th>
                <th className="p-4 sm:p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[30%]">Định nghĩa (Việt)</th>
                <th className="p-4 sm:p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[12%]">Loại từ</th>
                <th className="p-4 sm:p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[28%]">Ví dụ thực tế</th>
                <th className="p-4 sm:p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[10%]">Thuộc</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((w) => (
                  <VocabularyRow
                    key={w.id}
                    vocab={w}
                    isMastered={!!masteredIds[w.id]}
                    onToggle={onToggle}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                    Không tìm thấy từ vựng nào khớp với điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function VocabularyViewManager({ 
  displayWords, 
  currentMode, 
  currentTopic,
  loading 
}: VocabularyViewManagerProps) {
  const [masteredIds, setMasteredIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const saved = localStorage.getItem('mastered_vocab');
    if (saved) {
      try {
        setMasteredIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleMastery = (id: string) => {
    setMasteredIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('mastered_vocab', JSON.stringify(updated));
      return updated;
    });
  };

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
            <VocabularyList
              words={displayWords}
              masteredIds={masteredIds}
              onToggle={toggleMastery}
            />
          )}
        </div>
      )}
    </Suspense>
  );
}
