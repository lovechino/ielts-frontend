import Link from 'next/link';

export default function VocabularyLandingPage() {
  const levels = [
    { level: "A1", ielts: "3.0 - 4.0", title: "Beginner", icon: "🌱", color: "from-green-400 to-emerald-500" },
    { level: "A2", ielts: "4.0 - 5.0", title: "Elementary", icon: "🌿", color: "from-teal-400 to-cyan-500" },
    { level: "B1", ielts: "5.0 - 6.0", title: "Intermediate", icon: "🚀", color: "from-blue-400 to-indigo-500" },
    { level: "B2", ielts: "6.0 - 7.0", title: "Upper Intermediate", icon: "🎯", color: "from-indigo-500 to-purple-600" },
    { level: "C1", ielts: "7.0 - 8.0+", title: "Advanced", icon: "💎", color: "from-purple-500 to-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Vocabulary Vault</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Explore 5,000+ academic words categorized by CEFR levels and IELTS bands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {levels.map((item) => (
            <Link 
              key={item.level}
              href={`/vocabulary/${item.level}`}
              className="group relative bg-white rounded-[2rem] p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden border border-transparent hover:border-indigo-100"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 rounded-bl-[4rem] group-hover:scale-150 transition-transform`}></div>
              
              <div className="text-4xl mb-6">{item.icon}</div>
              <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-[10px] font-black mb-3 uppercase tracking-tighter`}>
                {item.level} • BAND {item.ielts}
              </div>
              <h2 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h2>

              <div className="mt-6 flex items-center text-indigo-600 text-xs font-black gap-1 group-hover:gap-2 transition-all">
                Study Now
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}