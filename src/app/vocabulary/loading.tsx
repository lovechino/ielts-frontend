// F3: Skeleton loading for vocabulary pages
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb skeleton */}
        <div className="h-5 w-32 bg-gray-200 rounded-xl animate-pulse mb-8" />

        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="h-6 w-28 bg-indigo-100 rounded-lg animate-pulse" />
            <div className="h-10 w-64 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
          <div className="h-12 w-72 bg-white rounded-2xl animate-pulse border border-gray-100" />
        </div>

        {/* Topic tabs skeleton */}
        <div className="flex gap-2 mb-10 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-white rounded-2xl animate-pulse border border-gray-100 flex-shrink-0" />
          ))}
        </div>

        {/* Word cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100">
              <div className="flex justify-between mb-4">
                <div className="h-8 w-32 bg-indigo-100 rounded-xl animate-pulse" />
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
