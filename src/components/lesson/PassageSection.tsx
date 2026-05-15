'use client';

import React from 'react';
import { Passage } from '@/lib/api';

interface PassageSectionProps {
  passages: Passage[];
  activeTabIndex: number;
  lessonType: string;
}

export default function PassageSection({ passages, activeTabIndex, lessonType }: PassageSectionProps) {
  if (!passages || passages.length === 0) {
    return (
      <div className="text-center py-40 border-2 border-dashed border-slate-100 rounded-[3rem]">
        <p className="text-slate-400 font-medium italic">
          No interactive content yet. Please use the Admin Tool to bóc tách PDF.
        </p>
      </div>
    );
  }

  const passage = passages[activeTabIndex];
  if (!passage) return null;

  return (
    <article key={passage.id} className="prose prose-slate max-w-none animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-md">
          {lessonType === 'writing' ? `TASK ${activeTabIndex + 1}` : `PASSAGE ${activeTabIndex + 1}`}
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-8 leading-tight">{passage.title}</h2>
      <div className="text-xl text-slate-700 leading-relaxed font-serif space-y-6">
        {passage.content_html?.split('\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
