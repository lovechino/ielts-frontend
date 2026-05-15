'use client';

import { useEffect, useState } from 'react';
import { api, Lesson } from '@/lib/api';
import Link from 'next/link';

export default function FullTestsPage() {
  const [tests, setTests] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tests.list('full').then(res => {
      setTests(res || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-red-500/20 text-red-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Exam Mode</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Full Reading Mock Tests</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-800 rounded-3xl animate-pulse border border-slate-700"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <Link 
                key={test.id} 
                href={`/lessons/${test.id}`}
                className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-700 hover:border-red-500/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {test.time_limit}
                    </div>
                    <span className="text-slate-400 font-bold text-sm">Minutes</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-red-400 transition-colors">{test.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                    Full Reading Test with 3 passages and 40 questions. Experience the real IELTS exam.
                  </p>
                  <div className="flex items-center text-red-500 font-black text-sm group-hover:gap-2 transition-all">
                    START FULL MOCK <span className="ml-1">&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && tests.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-[3rem] border-2 border-dashed border-slate-700">
            <p className="text-slate-500 font-bold text-lg">No full tests available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
