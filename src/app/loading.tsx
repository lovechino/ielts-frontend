// F3: Skeleton loading for home/courses page
export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <section className="mb-16 text-center">
        <div className="h-16 w-2/3 mx-auto bg-gray-200 rounded-2xl animate-pulse mb-4" />
        <div className="h-6 w-1/2 mx-auto bg-gray-100 rounded-xl animate-pulse" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
            <div className="h-48 bg-gradient-to-tr from-gray-100 to-gray-200 animate-pulse" />
            <div className="p-6 space-y-3">
              <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-indigo-100 rounded-2xl animate-pulse mt-4" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
