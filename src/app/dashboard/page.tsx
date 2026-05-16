"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading, updateUser } = useAuth();
  const [isUpdatingPersona, setIsUpdatingPersona] = useState(false);

  const handlePersonaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPersona = e.target.value;
    setIsUpdatingPersona(true);
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        await api.auth.updateProfile({ ai_persona: newPersona }, token);
        updateUser({ ai_persona: newPersona });
      }
    } catch (error) {
      console.error("Failed to update AI Persona:", error);
      alert("Failed to update AI Persona");
    } finally {
      setIsUpdatingPersona(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Not Authenticated</h1>
        <p className="text-gray-600 mb-6">Please log in to view your dashboard.</p>
        <Link href="/login" className="btn-primary">Go to Login</Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <section className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
            Welcome back, {user.full_name || 'Student'}!
          </h1>
          <p className="text-lg text-gray-600">
            Here is an overview of your IELTS learning progress.
          </p>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <label htmlFor="ai-persona" className="font-medium text-gray-700 whitespace-nowrap">
            AI Tutor Persona:
          </label>
          <select 
            id="ai-persona"
            value={user.ai_persona || 'professional'}
            onChange={handlePersonaChange}
            disabled={isUpdatingPersona}
            className="form-input py-1.5 min-w-[140px] text-sm"
          >
            <option value="professional">🤵 Professional</option>
            <option value="humorous">🎭 Humorous</option>
            <option value="strict">📏 Strict</option>
            <option value="encouraging">🌟 Encouraging</option>
          </select>
          {isUpdatingPersona && <span className="text-sm text-indigo-500 animate-pulse">Saving...</span>}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Target Band</h3>
          <p className="text-3xl font-extrabold text-indigo-600">{user.target_band || 'N/A'}</p>
        </div>
        
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Tests Completed</h3>
          <p className="text-3xl font-extrabold text-pink-500">0</p>
        </div>
        
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Current Streak</h3>
          <p className="text-3xl font-extrabold text-amber-500">1 Day</p>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Continue Learning</h2>
        {user.enrolled_courses && user.enrolled_courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {user.enrolled_courses.map(course => (
              <Link href={`/courses/${course.id}`} key={course.id} className="block group">
                <div className="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="h-40 bg-gray-200 relative">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {course.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {course.status === 'completed' ? 'Completed' : 'Enrolled'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't started any courses yet.</p>
            <Link href="/" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
