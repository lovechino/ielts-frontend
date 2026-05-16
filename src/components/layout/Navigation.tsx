"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function Navigation() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-lg border-b border-white/30">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 tracking-tighter">
            IELTS AI
          </Link>
          <Link href="/admin" className="hidden md:block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
            Admin
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Courses</Link>
          <Link href="/mini-tests" className="hover:text-indigo-600 transition-colors">Mini Test</Link>
          <Link href="/full-tests" className="hover:text-indigo-600 transition-colors">Full Test</Link>
          <Link href="/vocabulary" className="hover:text-indigo-600 transition-colors">Vocabulary</Link>
          
          {!loading && user ? (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="hover:text-indigo-600 transition-colors text-sm font-bold bg-slate-100 px-4 py-2 rounded-full">My Progress</Link>
              <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">Logout</button>
            </div>
          ) : (
            !loading && (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-sm font-medium hover:text-indigo-600 transition-colors">Sign In</Link>
                <Link href="/register" className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-full shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95">Sign Up</Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
