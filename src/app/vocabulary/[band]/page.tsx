import { api, Vocabulary } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import VocabularyViewManager from '@/components/VocabularyViewManager';

interface BandPageProps {
  params: Promise<{ band: string }>;
  searchParams: Promise<{ mode?: string; topic?: string; course?: string }>;
}

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "ALL"];

const MODES = [
  { id: 'list', label: 'List' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz Test' }
];

async function fetchAndGroupVocabulary(level: string, courseSlugOrId?: string) {
  try {
    const courses = await api.vocabulary.listCourses().catch(() => []);
    const activeCourse = courses.find(c => c.slug === courseSlugOrId || c.id === courseSlugOrId) || courses.find(c => c.slug === 'ielts') || courses[0];
    const allWords = await api.vocabulary.list({ level: level === "ALL" ? undefined : level, vocab_course_id: activeCourse?.id });
    const vocabByTopic = allWords.reduce((acc: Record<string, Vocabulary[]>, curr: Vocabulary) => {
      const topic = curr.topic || "General";
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(curr);
      return acc;
    }, {} as Record<string, Vocabulary[]>);
    return { courseTitle: activeCourse?.title || "Vocabulary", vocabByTopic, topics: Object.keys(vocabByTopic).sort(), totalCount: allWords.length };
  } catch {
    return { courseTitle: "Vocabulary", vocabByTopic: {}, topics: [], totalCount: 0 };
  }
}

function Breadcrumbs({ isAll }: { isAll: boolean }) {
  return (
    <Link href="/vocabulary" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-8 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      {isAll ? "Quay lại danh mục" : "Back to Levels"}
    </Link>
  );
}

interface ModeSelectorProps {
  currentMode: string;
  currentTopic: string;
  courseParam: string;
}

function ModeSelector({ currentMode, currentTopic, courseParam }: ModeSelectorProps) {
  return (
    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
      {MODES.map(m => (
        <Link
          key={m.id}
          href={`?mode=${m.id}&topic=${currentTopic}&course=${courseParam}`}
          className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${currentMode === m.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}

interface HeaderProps {
  level: string;
  totalCount: number;
  courseTitle: string;
  currentMode: string;
  currentTopic: string;
  courseParam: string;
}

function Header({ level, totalCount, courseTitle, currentMode, currentTopic, courseParam }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
            {level === "ALL" ? "Học theo chủ đề" : `Level ${level}`}
          </span>
          <span className="text-gray-400 text-sm font-bold">• {totalCount} Words Total</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 leading-tight">{courseTitle}</h1>
      </div>
      <ModeSelector currentMode={currentMode} currentTopic={currentTopic} courseParam={courseParam} />
    </div>
  );
}

function EmptyState({ level }: { level: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
      <div className="text-6xl mb-4">⏳</div>
      <h3 className="text-xl font-bold text-gray-800">No data found for Level {level}.</h3>
      <p className="text-gray-500 mt-2">Run the scraper to populate this level:</p>
      <code className="mt-4 block bg-gray-100 p-3 rounded-xl text-sm text-indigo-600 font-mono mx-auto max-w-md">
        python app/scripts/scrape_vocab_by_cefr.py --level {level}
      </code>
    </div>
  );
}

interface TopicTabsProps {
  topics: string[];
  currentMode: string;
  currentTopic: string;
  courseParam: string;
  vocabByTopic: Record<string, Vocabulary[]>;
}

function TopicTabs({ topics, currentMode, currentTopic, courseParam, vocabByTopic }: TopicTabsProps) {
  return (
    <div className="flex overflow-x-auto pb-4 mb-10 gap-2 no-scrollbar scroll-smooth">
      {topics.map((t) => {
        const active = currentTopic === t;
        const count = vocabByTopic[t].length;
        return (
          <Link
            key={t}
            href={`?mode=${currentMode}&topic=${t}&course=${courseParam}`}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black transition-all border ${active ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm ring-2 ring-indigo-600/10' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'}`}
          >
            {t}
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
          </Link>
        );
      })}
    </div>
  );
}

interface VocabularyViewProps {
  level: string;
  totalCount: number;
  courseTitle: string;
  currentMode: string;
  currentTopic: string;
  courseParam: string;
  topics: string[];
  vocabByTopic: Record<string, Vocabulary[]>;
  displayWords: Vocabulary[];
}

function VocabularyView({ level, totalCount, courseTitle, currentMode, currentTopic, courseParam, topics, vocabByTopic, displayWords }: VocabularyViewProps) {
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs isAll={level === "ALL"} />
      <Header level={level} totalCount={totalCount} courseTitle={courseTitle} currentMode={currentMode} currentTopic={currentTopic} courseParam={courseParam} />
      {totalCount === 0 ? (
        <EmptyState level={level} />
      ) : (
        <>
          <TopicTabs topics={topics} currentMode={currentMode} currentTopic={currentTopic} courseParam={courseParam} vocabByTopic={vocabByTopic} />
          <div className="min-h-[400px]">
            <VocabularyViewManager currentMode={currentMode} currentTopic={currentTopic} displayWords={displayWords} />
          </div>
        </>
      )}
    </div>
  );
}

export default async function VocabularyBandPage({ params, searchParams }: BandPageProps) {
  const { band } = await params;
  const { mode = 'list', topic, course = 'ielts' } = await searchParams;
  const level = band.toUpperCase();
  if (!VALID_LEVELS.includes(level)) return notFound();

  const { courseTitle, vocabByTopic, topics, totalCount } = await fetchAndGroupVocabulary(level, course);
  const currentTopic = topic || topics[0] || "General";
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <VocabularyView
        level={level} totalCount={totalCount} courseTitle={courseTitle}
        currentMode={mode} currentTopic={currentTopic} courseParam={course}
        topics={topics} vocabByTopic={vocabByTopic} displayWords={vocabByTopic[currentTopic] || []}
      />
    </div>
  );
}
