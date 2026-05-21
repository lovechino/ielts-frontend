'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, VocabularyCourse } from '@/lib/api';

function useVocabularyCourses() {
  const [courses, setCourses] = useState<VocabularyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vocabulary.listCourses()
      .then(setCourses)
      .catch(() => setError("Không thể tải danh sách khóa học từ vựng. Vui lòng thử lại sau."))
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading, error };
}

function HeaderSection() {
  return (
    <div className="text-center mb-16">
      <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black tracking-widest uppercase mb-4">
        Từ Vựng Đa Nền Tảng
      </div>
      <h1 className="text-5xl font-black text-slate-950 mb-4 tracking-tight leading-none">
        Vocabulary Vault
      </h1>
      <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
        Khám phá hàng ngàn từ vựng học thuật, TOEIC và IELTS được biên soạn chi tiết kèm phiên âm, phân loại và bản dịch.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {[1, 2].map((i) => (
        <div key={i} className="h-64 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-16 bg-white border border-red-100 rounded-[2.5rem] max-w-2xl mx-auto shadow-sm">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-xl font-black text-slate-800">{error}</h3>
    </div>
  );
}

interface LevelLinkProps {
  item: { level: string; title: string; icon: string };
  courseSlug: string;
}

function LevelLink({ item, courseSlug }: LevelLinkProps) {
  return (
    <Link
      href={`/vocabulary/${item.level}?course=${courseSlug}`}
      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-indigo-600 hover:text-white border border-slate-100 hover:border-transparent transition-all duration-300 hover:scale-105 active:scale-95 group/level"
    >
      <span className="text-lg mb-1 group-hover/level:scale-110 transition-transform duration-300">
        {item.icon}
      </span>
      <span className="text-[10px] font-black uppercase">
        {item.level}
      </span>
    </Link>
  );
}

interface CefrLevelsGridProps {
  courseSlug: string;
  levels: Array<{ level: string; title: string; icon: string }>;
}

function CefrLevelsGrid({ courseSlug, levels }: CefrLevelsGridProps) {
  return (
    <div className="border-t border-slate-50 pt-6 mb-6">
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">
        Chọn trình độ của bạn
      </span>
      <div className="grid grid-cols-5 gap-2.5">
        {levels.map((item) => (
          <LevelLink key={item.level} item={item} courseSlug={courseSlug} />
        ))}
      </div>
    </div>
  );
}

interface DirectTopicsViewProps {
  courseSlug: string;
}

function DirectTopicsView({ courseSlug }: DirectTopicsViewProps) {
  return (
    <div className="border-t border-slate-50 pt-6 mb-6 flex flex-col justify-center items-center py-6 px-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
      <span className="text-2xl mb-2">🏢 ✈️ 💼 💻</span>
      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-1">
        Học Theo Chủ Đề
      </span>
      <p className="text-xs text-slate-400 text-center font-medium">
        Hệ thống từ vựng phân chia theo chủ đề thực tiễn (Office, Travel, Technology, v.v.)
      </p>
    </div>
  );
}

interface CourseCardHeaderProps {
  title: string;
  description?: string;
}

function CourseCardHeader({ title, description }: CourseCardHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="px-3.5 py-1 bg-indigo-600/10 text-indigo-700 text-[10px] font-black rounded-xl uppercase tracking-wider">
          COURSE PACK
        </span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
        {title}
      </h2>
      <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
        {description || "Học từ vựng chất lượng cao cùng các chủ đề đa dạng."}
      </p>
    </div>
  );
}

interface LearnButtonProps {
  href: string;
}

function LearnButton({ href }: LearnButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] gap-2"
    >
      Bắt đầu học ngay
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </Link>
  );
}

interface CourseCardProps {
  course: VocabularyCourse;
  levels: Array<{ level: string; title: string; icon: string }>;
}

function CourseCard({ course, levels }: CourseCardProps) {
  const isCefr = !course.structure_type || course.structure_type === 'cefr_levels';
  const startHref = isCefr ? `/vocabulary/A1?course=${course.slug}` : `/vocabulary/all?course=${course.slug}`;
  return (
    <div className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-[0.03] rounded-bl-[6rem] group-hover:scale-125 transition-transform duration-700" />
      <div className="flex flex-col h-full justify-between">
        <CourseCardHeader title={course.title} description={course.description} />
        <div>
          {isCefr ? <CefrLevelsGrid courseSlug={course.slug} levels={levels} /> : <DirectTopicsView courseSlug={course.slug} />}
          <LearnButton href={startHref} />
        </div>
      </div>
    </div>
  );
}

const LEVELS = [
  { level: "A1", title: "Beginner", icon: "🌱" },
  { level: "A2", title: "Elementary", icon: "🌿" },
  { level: "B1", title: "Intermediate", icon: "🚀" },
  { level: "B2", title: "Upper Intermediate", icon: "🎯" },
  { level: "C1", title: "Advanced", icon: "💎" }
];

export default function VocabularyLandingPage() {
  const { courses, loading, error } = useVocabularyCourses();
  return (
    <div className="min-h-screen bg-slate-50/50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <HeaderSection />
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} levels={LEVELS} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}