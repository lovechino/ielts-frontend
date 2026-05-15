import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IELTS Learning Platform | AI Powered",
  description: "Improve your IELTS score with AI-powered reading and vocabulary practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
              <Link href="/dashboard" className="hover:text-indigo-600 transition-colors text-sm font-bold bg-slate-100 px-4 py-2 rounded-full">My Progress</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
