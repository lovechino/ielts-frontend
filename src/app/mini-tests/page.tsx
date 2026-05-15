'use client';

import { useEffect, useState } from 'react';
import { api, Lesson } from '@/lib/api';
import Link from 'next/link';

export default function MiniTestsPage() {
  const [allTests, setAllTests] = useState<Lesson[]>([]);
  const [displayTests, setDisplayTests] = useState<Lesson[]>([]);
  const [activeSkill, setActiveSkill] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tests.list('mini').then(res => {
      setAllTests(res || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setDisplayTests(allTests.filter(t => t.lesson_type === activeSkill));
  }, [allTests, activeSkill]);

  const skills = [
    { id: 'reading', label: 'Reading', icon: '📖' },
    { id: 'listening', label: 'Listening', icon: '🎧' },
    { id: 'writing', label: 'Writing', icon: '✍️' },
    { id: 'speaking', label: 'Speaking', icon: '🗣️' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-orange-100 text-orange-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Skill Booster</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Mini Practice Tests</h1>
        
        {/* Skill Tabs */}
        <div className="flex bg-white p-2 rounded-[2rem] shadow-sm mb-12 border border-slate-200 overflow-x-auto no-scrollbar">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setActiveSkill(skill.id as 'reading' | 'listening' | 'writing' | 'speaking')}
              className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-black transition-all whitespace-nowrap ${
                activeSkill === skill.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{skill.icon}</span>
              {skill.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-slate-100"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {displayTests.map((test) => (
              <Link 
                key={test.id} 
                href={`/lessons/${test.id}`}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {test.time_limit}
                    </div>
                    <span className="text-slate-400 font-bold text-sm">Minutes</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{test.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                    Improve your {activeSkill} performance with this focused practice session.
                  </p>
                  <div className="flex items-center text-indigo-600 font-black text-sm group-hover:gap-2 transition-all">
                    START PRACTICE <span className="ml-1">&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && displayTests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-lg">No {activeSkill} practices available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
