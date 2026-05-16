"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setChecking(false);
        setIsEnrolled(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.courses.checkEnrollment(courseId, token);
          setIsEnrolled(res?.enrolled || false);
        }
      } catch (err) {
        console.error("Failed to check enrollment status:", err);
      } finally {
        setChecking(false);
      }
    }
    
    if (!loading) {
      checkStatus();
    }
  }, [courseId, user, loading]);

  const handleEnrollClick = async () => {
    if (loading || checking) return;

    if (!user) {
      // User not logged in, redirect to login
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }

    if (isEnrolled) {
      // Optional: Redirect to the first lesson. Right now, to dashboard.
      router.push('/dashboard');
      return;
    }

    setEnrolling(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.courses.enroll(courseId, token);
        setIsEnrolled(true);
      } else {
        alert("Authentication token missing. Please log in again.");
      }
    } catch (error) {
      console.error("Enroll failed:", error);
      alert("Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  };

  if (checking) {
    return (
      <button disabled className="px-8 py-3 rounded-full font-bold shadow-md bg-gray-200 text-gray-500 cursor-wait">
        Checking...
      </button>
    );
  }

  return (
    <button
      onClick={handleEnrollClick}
      disabled={loading || enrolling}
      className={`px-8 py-3 rounded-full font-bold shadow-md transition-all active:scale-95 ${
        enrolling 
          ? "bg-indigo-400 text-white cursor-not-allowed" 
          : isEnrolled
            ? "bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600 hover:shadow-lg"
            : "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg"
      }`}
    >
      {enrolling ? "Đang xử lý..." : isEnrolled ? "Tiếp Tục Học" : "Đăng Ký Học"}
    </button>
  );
}
