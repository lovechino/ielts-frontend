import { api, Lesson } from '@/lib/api';
import Link from 'next/link';

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { id } = await params;
  
  let course;
  let lessons: Lesson[] = [];

  try {
    course = await api.courses.get(id);
    lessons = await api.courses.lessons(id);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to fetch course details:", error);
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error loading course</h1>
        <p className="text-gray-500 mt-2">ID: {id}</p>
        <p className="text-gray-400 text-sm mt-4">{error.message}</p>
        <Link href="/" className="mt-8 inline-block text-indigo-600 font-bold">← Back to Home</Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Course Not Found</h1>
        <p className="text-gray-500 mt-2">The course with ID <code className="bg-gray-100 px-2 py-1 rounded">{id}</code> could not be found in the database.</p>
        <Link href="/" className="mt-8 inline-block text-indigo-600 font-bold">← Back to Home</Link>
      </div>
    );
  }

  // Group lessons by type
  const groupedLessons = {
    reading: lessons.filter(l => l.lesson_type === 'reading'),
    listening: lessons.filter(l => l.lesson_type === 'listening'),
    writing: lessons.filter(l => l.lesson_type === 'writing'),
    speaking: lessons.filter(l => l.lesson_type === 'speaking'),
  };

  const skills = [
    { id: 'reading', label: 'Reading', icon: '📖' },
    { id: 'listening', label: 'Listening', icon: '🎧' },
    { id: 'writing', label: 'Writing', icon: '✍️' },
    { id: 'speaking', label: 'Speaking', icon: '🗣️' },
  ];

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="glass-card p-10 mb-12 flex flex-col md:flex-row gap-10 items-center bg-white shadow-xl border-none">
          <div className="w-full md:w-48 h-48 bg-indigo-600 rounded-3xl flex items-center justify-center text-6xl text-white shadow-2xl shadow-indigo-200">
            {course.level === 'advanced' ? '🔥' : '🌱'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="px-4 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full uppercase tracking-widest mb-4 inline-block">
              IELTS {course.level}
            </span>
            <h1 className="text-4xl font-black text-gray-900 mb-4">{course.title}</h1>
            <p className="text-gray-500 text-lg max-w-2xl">{course.description}</p>
          </div>
        </div>

        {/* 4 Skills Curriculum */}
        <div className="space-y-12">
          {skills.map((skill) => {
            const skillLessons = groupedLessons[skill.id as keyof typeof groupedLessons];
            if (skillLessons.length === 0) return null;

            return (
              <div key={skill.id}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-3xl">{skill.icon}</div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{skill.label}</h2>
                  <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillLessons.map((lesson) => (
                    <Link 
                      key={lesson.id} 
                      href={`/lessons/${lesson.id}`}
                      className="group p-6 bg-white rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all border border-transparent hover:border-indigo-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {lesson.order || '•'}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {lesson.title}
                        </h3>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
