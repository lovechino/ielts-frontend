import { api, Vocabulary } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import VocabularyViewManager from '@/components/VocabularyViewManager';

interface BandPageProps {
  params: Promise<{ band: string }>;
  searchParams: Promise<{ mode?: string; topic?: string }>;
}

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export default async function VocabularyBandPage({ params, searchParams }: BandPageProps) {
  const { band } = await params;
  const { mode, topic: activeTopic } = await searchParams;
  const level = band.toUpperCase();
  const currentMode = mode || 'list';

  if (!VALID_LEVELS.includes(level)) return notFound();

  let vocabByTopic: Record<string, Vocabulary[]> = {};
  let totalCount = 0;
  let topics: string[] = [];

  try {
    const allWords = await api.vocabulary.list({ level });
    totalCount = allWords.length;

    vocabByTopic = allWords.reduce((acc: Record<string, Vocabulary[]>, curr: Vocabulary) => {
      const topic = curr.topic || "General";
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(curr);
      return acc;
    }, {} as Record<string, Vocabulary[]>);

    topics = Object.keys(vocabByTopic).sort();
  } catch (error) {
    console.error("Failed to fetch vocabulary:", error);
  }

  const currentTopic = activeTopic || topics[0] || "General";
  const displayWords = vocabByTopic[currentTopic] || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Navigation Breadcrumb */}
        <Link href="/vocabulary" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-8 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Levels
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                Level {level}
              </span>
              <span className="text-gray-400 text-sm font-bold">• {totalCount} Words Total</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">
              IELTS Vocabulary
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <Link 
                href={`?mode=list&topic=${currentTopic}`} 
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${currentMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                List
              </Link>
              <Link 
                href={`?mode=flashcards&topic=${currentTopic}`} 
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${currentMode === 'flashcards' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Flashcards
              </Link>
              <Link 
                href={`?mode=quiz&topic=${currentTopic}`} 
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${currentMode === 'quiz' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Quiz Test
              </Link>
            </div>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-gray-800">No data found for Level {level}.</h3>
            <p className="text-gray-500 mt-2">Run the scraper to populate this level:</p>
            <code className="mt-4 block bg-gray-100 p-3 rounded-xl text-sm text-indigo-600 font-mono mx-auto max-w-md">
              python app/scripts/scrape_vocab_by_cefr.py --level {level}
            </code>
          </div>
        ) : (
          <>
            {/* Topic Tabs */}
            <div className="flex overflow-x-auto pb-4 mb-10 gap-2 no-scrollbar scroll-smooth">
              {topics.map((t) => (
                <Link
                  key={t}
                  href={`?mode=${currentMode}&topic=${t}`}
                  className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black transition-all border ${currentTopic === t
                      ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm ring-2 ring-indigo-600/10'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                >
                  {t}
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-lg ${currentTopic === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {vocabByTopic[t].length}
                  </span>
                </Link>
              ))}
            </div>

            {/* Content Area managed by Client Component */}
            <div className="min-h-[400px]">
              <VocabularyViewManager 
                currentMode={currentMode}
                currentTopic={currentTopic}
                displayWords={displayWords}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
