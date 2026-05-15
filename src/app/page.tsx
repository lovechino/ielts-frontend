import { api, Course } from '@/lib/api';
import Link from 'next/link';

export default async function HomePage() {
  let courses: Course[] = [];
  try {
    courses = await api.courses.list();
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <section className="mb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Master Your IELTS Journey
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered learning platform with real practice tests and smart vocabulary enrichment.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="glass-card hover:glass-card-hover flex flex-col overflow-hidden">
            <div className="h-48 bg-gradient-to-tr from-indigo-100 to-pink-100 flex items-center justify-center p-8">
               <span className="text-5xl">📚</span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100">
                  {course.level}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                {course.description}
              </p>
              
              <Link 
                href={`/courses/${course.id}`}
                className="mt-auto w-full btn-primary text-center block"
              >
                Start Learning
              </Link>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card">
            <p className="text-gray-400 italic">No courses available yet. Start scraping!</p>
          </div>
        )}
      </div>

      <section className="mt-20">
        <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Vocabulary Vault</h2>
            <p className="text-gray-500">Enrich your word list with AI-powered definitions and examples.</p>
          </div>
          <Link href="/vocabulary" className="mt-6 md:mt-0 btn-secondary">
            Explore Words
          </Link>
        </div>
      </section>
    </main>
  );
}
