// F3: Skeleton loading for lessons page — shows while data is being fetched
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar skeleton */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-7 w-64 bg-gray-300 rounded-xl animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-10 w-32 bg-indigo-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Passage skeleton */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-4">
          <div className="h-6 w-48 bg-indigo-100 rounded-xl animate-pulse mb-6" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-100 rounded-xl animate-pulse`} style={{ width: `${75 + Math.random() * 25}%` }} />
          ))}
        </div>

        {/* Questions skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="h-5 w-4/5 bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-10 w-full bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
