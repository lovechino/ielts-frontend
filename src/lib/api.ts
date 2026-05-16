import { bearerHeaders, setAccessToken } from './auth-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787/api/v1';

// TTL constants (in seconds) — used with next.js fetch revalidation
const TTL_STATIC = 300;   // 5 min — courses, lessons (read-heavy, rarely changes)
const TTL_VOCAB = 3600;  // 1 hour — vocabulary (extremely static)

/**
 * Base fetcher — dynamic data only (progress, submissions, auth).
 * No caching: always fetches fresh data from the server.
 */
export async function fetcher<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

   
  return handleResponse<T>(res);
}

/**
 * Cached fetcher — for static/read-heavy data (courses, lessons, vocabulary).
 * Leverages Next.js Data Cache with ISR revalidation.
 */
export async function cachedFetcher<T = unknown>(endpoint: string, ttl: number): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: ttl },
  });

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errorData = await res.json() as Record<string, unknown>;
      const errorObj = errorData.error as Record<string, unknown> | undefined;
      errorMsg = (errorObj?.message as string) || (errorData.message as string) || res.statusText;
    } catch {
      // Not a JSON error, fallback to statusText
    }
    throw new Error(`API Error: ${errorMsg}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Unwrap the standard response envelope { success: true, data: ... }
  if (data && typeof data === 'object' && data.success === true && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail_url?: string;
  price: number;
}

export interface Vocabulary {
  id: string;
  word: string;
  definition: string;
  example?: string;
  topic?: string;
  pronunciation?: string;
  synonyms?: string[];
  antonyms?: string[];
  level?: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  order?: number;
  lesson_type?: string;
  pdf_url?: string;
  time_limit?: number;
  is_test?: boolean;
  test_type?: 'mini' | 'full' | 'practice';
  passages?: Passage[];
  question_groups?: QuestionGroup[];
}

export interface Passage {
  id: string;
  lesson_id: string;
  title?: string;
  content_html?: string;
  order?: number;
}

export interface QuestionGroup {
  id: string;
  lesson_id: string;
  passage_id?: string;
  title?: string;
  instruction?: string;
  group_type?: string;
  order?: number;
}

export interface Question {
  id: string;
  content: string;
  question_type: string;
  options?: Record<string, string>;
  correct_answer?: string;
  lesson_id: string;
  group_id?: string;
}

export interface Job {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  progress?: number;
  result?: unknown;
  error?: string;
  updated_at: number;
}

export const api = {
  courses: {
    // F1: Static data — use ISR cache (5 min)
    list: () => cachedFetcher<Course[]>('/courses/', TTL_STATIC),
    get: (id: string) => cachedFetcher<Course>(`/courses/${id}`, TTL_STATIC),
    lessons: (id: string) => cachedFetcher<Lesson[]>(`/courses/${id}/lessons`, TTL_STATIC),
    // Write operations — no cache
    create: (data: Partial<Course>) => fetcher<Course>('/courses/', { method: 'POST', body: JSON.stringify(data) }),
    createLesson: (courseId: string, data: Partial<Lesson> | Partial<Lesson>[]) => fetcher<Lesson | Lesson[]>(`/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),
    updateLesson: (lessonId: string, data: Partial<Lesson>) => fetcher<Lesson>(`/courses/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(data) }),
    enroll: (courseId: string, token: string) => fetcher<{ id: string, status: string }>(`/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
    checkEnrollment: (courseId: string, token: string) => fetcher<{ enrolled: boolean, status?: string }>(`/courses/${courseId}/enroll-status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  },
  lessons: {
    get: (id: string) => cachedFetcher<Lesson>(`/courses/lessons/${id}`, TTL_STATIC),
    questions: (id: string) => cachedFetcher<Question[]>(`/courses/lessons/${id}/questions`, TTL_STATIC),
    createQuestion: (lessonId: string, data: Partial<Question>) => fetcher<Question>(`/courses/lessons/${lessonId}/questions`, { method: 'POST', body: JSON.stringify(data) }),

    // Passages
    createPassage: (lessonId: string, data: Partial<Passage>) => fetcher<Passage>(`/courses/lessons/${lessonId}/passages`, { method: 'POST', body: JSON.stringify(data) }),
    passages: (lessonId: string) => cachedFetcher<Passage[]>(`/courses/lessons/${lessonId}/passages`, TTL_STATIC),

    // Question Groups
    createQuestionGroup: (lessonId: string, data: Partial<QuestionGroup>) => fetcher<QuestionGroup>(`/courses/lessons/${lessonId}/question-groups`, { method: 'POST', body: JSON.stringify(data) }),
    questionGroups: (lessonId: string) => cachedFetcher<QuestionGroup[]>(`/courses/lessons/${lessonId}/question-groups`, TTL_STATIC),

    // AI
    autoGenerate: (lessonId: string, rawText: string) => fetcher<{ job_id: string }>(`/courses/lessons/${lessonId}/auto-generate`, { method: 'POST', body: JSON.stringify({ raw_text: rawText }) }),
  },
  tests: {
    list: (type?: 'mini' | 'full') => cachedFetcher<Lesson[]>(`/tests${type ? `?type=${type}` : ''}`, TTL_STATIC),
  },
  vocabulary: {
    // F1: Vocabulary is extremely static — cache 1 hour
    list: (params?: { level?: string; topic?: string; offset?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.level) searchParams.append('level', params.level);
      if (params?.topic) searchParams.append('topic', params.topic);
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return cachedFetcher<Vocabulary[]>(`/vocabulary/?${searchParams.toString()}`, TTL_VOCAB);
    },
    get: (word: string) => cachedFetcher<Vocabulary>(`/vocabulary/${word}`, TTL_VOCAB),
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  // Progress is always dynamic — no caching (requires JWT; user from token)
  progress: {
    get: (lessonId: string) =>
      fetcher<unknown>(`/progress/${lessonId}`, { headers: bearerHeaders() }),
    saveDraft: (data: { lesson_id: string; draft_answers: Record<string, unknown>; time_left: number; status?: string }) =>
      fetcher<unknown>('/progress/save-draft', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: bearerHeaders(),
      }),
    submit: (data: { lesson_id: string; answers: unknown[] }) =>
      fetcher<unknown>('/progress/submit', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: bearerHeaders(),
      }),
    mine: () => fetcher<unknown[]>('/progress/me', { headers: bearerHeaders() }),
  },
  jobs: {
    get: (id: string) => fetcher<{ data: Job }>(`/jobs/${id}`),
    waitForJob: async (id: string, onProgress?: (job: Job) => void): Promise<Job> => {
      const poll = async (): Promise<Job> => {
        const res = await api.jobs.get(id);
        const job = res.data;
        if (onProgress) onProgress(job);
        if (job.status === 'completed' || job.status === 'failed') return job;
        await new Promise(r => setTimeout(r, 2000));
        return poll();
      };
      return poll();
    }
  },
  auth: {
    login: async (data: any) => {
      const res = await fetcher<{ token: string; user: unknown }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (typeof window !== 'undefined' && res?.token) setAccessToken(res.token);
      return res;
    },
    register: (data: any) => fetcher<{ id: string, email: string, full_name: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: (token: string) => fetcher<{ id: string, email: string, full_name: string, role: string, avatar_url?: string, target_band?: number, ai_persona?: string }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
    updateProfile: (data: any, token: string) => fetcher<{ id: string }>('/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    }),
  }
};

