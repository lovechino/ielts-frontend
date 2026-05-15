'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, Course } from '@/lib/api';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', level: 'beginner', price: 0 });

  const loadCourses = useCallback(async () => {
    try {
      const data = await api.courses.list();
      setCourses(data);
    } catch {
      // Silence err if unused
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.courses.create(newCourse);
      setShowCreateForm(false);
      setNewCourse({ title: '', description: '', level: 'beginner', price: 0 });
      loadCourses();
    } catch (err) {
      alert("Failed to create course");
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Course Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create New Course'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
              <input
                type="text" required
                value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. IELTS Reading Mastery"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Brief description of the course..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <select
                  value={newCourse.level} onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700">
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
            <div className="h-32 bg-slate-100 relative">
              {course.thumbnail_url ? (
                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image</div>
              )}
            </div>
            <div className="p-6">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-full mb-3 inline-block">
                {course.level}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{course.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description || "No description"}</p>
              <Link href={`/admin/courses/${course.id}`} className="block w-full text-center bg-slate-50 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors">
                Manage Lessons &rarr;
              </Link>
            </div>
          </div>
        ))}

        {courses.length === 0 && !showCreateForm && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 font-medium">No courses found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
