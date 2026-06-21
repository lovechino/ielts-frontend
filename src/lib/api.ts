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
      ...bearerHeaders(),
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

export interface VocabularyCourse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  structure_type?: 'cefr_levels' | 'direct_topics';
}

export interface Vocabulary {
  id: string;
  vocab_course_id?: string;
  word: string;
  definition: string;
  definition_vi?: string;
  example?: string;
  example_vi?: string;
  topic?: string;
  pronunciation?: string;
  part_of_speech?: string;
  synonyms?: string[];
  antonyms?: string[];
  level?: string;
  is_priority?: boolean;
  is_academic?: boolean;
  status?: 'draft' | 'published';
  updated_at?: number;
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
  lesson_parts?: number[];
  speaking_part?: number;
  metadata?: any;
  passages?: Passage[];
  question_groups?: QuestionGroup[];
}

export interface Passage {
  id: string;
  lesson_id: string;
  title?: string;
  content_html?: string;
  order?: number;
  part?: number;
  audio_url?: string;
  transcript?: string;
  image_url?: string;
}

export interface QuestionGroup {
  id: string;
  lesson_id: string;
  passage_id?: string;
  title?: string;
  instruction?: string;
  group_type?: string;
  order?: number;
  part?: number;
}

export interface Question {
  id: string;
  content: string;
  question_type: string;
  options?: Record<string, string>;
  correct_answer?: string;
  lesson_id: string;
  group_id?: string;
  scoring_criteria?: string;
}

export interface Job {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  progress?: number;
  result?: unknown;
  error?: string;
  updated_at: number;
}

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  topic: string;
  content: {
    metadata: any;
    reading: any;
    vocabulary: any[];
  };
  is_completed?: boolean;
  reward_claimed?: boolean;
}

export interface VersionMeta {
  version: string;
  url: string;
  checksum: string | null;
  isFullUpdate: boolean;
  patchUrl: string | null;
  patchSize: number | null;
  updatedAt: string | null;
}

export interface AdminStats {
  total_users: number;
  premium_users: number;
  total_words: number;
  total_lessons: number;
  total_submissions: number;
  total_speaking_sessions: number;
  today_challenge_exists: boolean;
  // BI Fields
  today_revenue: number;
  total_revenue: number;
  today_ad_views: number;
  environment: 'local' | 'production';
  is_local: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  item_type: 'avatar' | 'booster' | 'protection' | 'expansion';
  sub_type?: 'static' | 'animated';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  price_coins: number;
  price_gems: number;
  image_url?: string;
  metadata?: any;
  is_active: boolean;
  created_at?: string;
}

export const api = {
  courses: {
    // F1: Static data — use ISR cache (5 min)
    list: () => cachedFetcher<Course[]>('/test-sets/', TTL_STATIC),
    get: (id: string) => cachedFetcher<Course>(`/test-sets/${id}`, TTL_STATIC),
    lessons: (id: string) => cachedFetcher<Lesson[]>(`/test-sets/${id}/lessons`, TTL_STATIC),
    // Write operations — no cache (Admin)
    create: (data: Partial<Course>) => fetcher<Course>('/admin/test-sets/', { method: 'POST', body: JSON.stringify(data) }),
    createLesson: (courseId: string, data: Partial<Lesson> | Partial<Lesson>[]) => fetcher<Lesson | Lesson[]>(`/admin/test-sets/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),
    updateLesson: (lessonId: string, data: Partial<Lesson>) => fetcher<Lesson>(`/admin/test-sets/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(data) }),
    enroll: (courseId: string, token: string) => fetcher<{ id: string, status: string }>(`/test-sets/${courseId}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
    checkEnrollment: (courseId: string, token: string) => fetcher<{ enrolled: boolean, status?: string }>(`/test-sets/${courseId}/enroll-status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  },
  lessons: {
    get: (id: string) => cachedFetcher<Lesson>(`/test-sets/lessons/${id}`, TTL_STATIC),
    create: (data: Partial<Lesson>) => fetcher<Lesson>('/admin/test-sets/lessons', { method: 'POST', body: JSON.stringify(data) }),
    quickImport: (data: {
      title: string;
      lesson_type: string;
      test_type: string;
      raw_text: string;
      test_set_title?: string;
      course_id?: string;
    }) => fetcher<{ lesson: Lesson, job_id: string }>('/admin/test-sets/quick-import', { method: 'POST', body: JSON.stringify(data) }),
    quickImportPreview: (data: {
      raw_text: string;
      lesson_type: string;
    }) => fetcher<{
      type: string;
      total_parts: number;
      total_questions: number;
      sections: {
        part_number: number;
        passage_title: string;
        groups: { type: string; range: string; count: number }[];
      }[];
    }>('/admin/test-sets/quick-import/preview', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Lesson>) => fetcher<Lesson>(`/admin/test-sets/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher<{ deleted: boolean }>(`/admin/test-sets/lessons/${id}`, { method: 'DELETE' }),
    questions: (id: string) => cachedFetcher<Question[]>(`/test-sets/lessons/${id}/questions`, TTL_STATIC),
    createQuestion: (lessonId: string, data: Partial<Question>) => fetcher<Question>(`/admin/test-sets/lessons/${lessonId}/questions`, { method: 'POST', body: JSON.stringify(data) }),

    // Passages
    createPassage: (lessonId: string, data: Partial<Passage>) => fetcher<Passage>(`/admin/test-sets/lessons/${lessonId}/passages`, { method: 'POST', body: JSON.stringify(data) }),
    passages: (lessonId: string) => cachedFetcher<Passage[]>(`/test-sets/lessons/${lessonId}/passages`, TTL_STATIC),
    updatePassage: (passageId: string, data: Partial<Passage>) => fetcher<Passage>(`/admin/test-sets/passages/${passageId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePassage: (passageId: string) => fetcher<{ deleted: boolean }>(`/admin/test-sets/passages/${passageId}`, { method: 'DELETE' }),

    // Question Groups
    createQuestionGroup: (lessonId: string, data: Partial<QuestionGroup>) => fetcher<QuestionGroup>(`/admin/test-sets/lessons/${lessonId}/question-groups`, { method: 'POST', body: JSON.stringify(data) }),
    questionGroups: (lessonId: string) => cachedFetcher<QuestionGroup[]>(`/test-sets/lessons/${lessonId}/question-groups`, TTL_STATIC),
    updateQuestionGroup: (groupId: string, data: Partial<QuestionGroup>) => fetcher<QuestionGroup>(`/admin/test-sets/question-groups/${groupId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteQuestionGroup: (groupId: string) => fetcher<{ deleted: boolean }>(`/admin/test-sets/question-groups/${groupId}`, { method: 'DELETE' }),

    // AI
    autoGenerate: (lessonId: string, rawText: string) => fetcher<{ job_id: string }>(`/admin/test-sets/lessons/${lessonId}/auto-generate`, { method: 'POST', body: JSON.stringify({ raw_text: rawText }) }),
  },
  tests: {
    list: (type?: 'mini' | 'full') => fetcher<Lesson[]>(`/tests${type ? `?type=${type}` : ''}`),
  },
  vocabulary: {
    // F1: Vocabulary is extremely static — cache 1 hour
    list: (params?: { level?: string; topic?: string; vocab_course_id?: string; offset?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.level) searchParams.append('level', params.level);
      if (params?.topic) searchParams.append('topic', params.topic);
      if (params?.vocab_course_id) searchParams.append('vocab_course_id', params.vocab_course_id);
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return cachedFetcher<Vocabulary[]>(`/vocabulary/?${searchParams.toString()}`, TTL_VOCAB);
    },
    get: (word: string) => cachedFetcher<Vocabulary>(`/vocabulary/${word}`, TTL_VOCAB),

    // Courses
    listCourses: () => cachedFetcher<VocabularyCourse[]>('/vocabulary/paths', TTL_VOCAB),
    createCourse: (data: Partial<VocabularyCourse>) => fetcher<VocabularyCourse>('/admin/vocabulary/paths', { method: 'POST', body: JSON.stringify(data) }),
    updateCourse: (id: string, data: Partial<VocabularyCourse>) => fetcher<VocabularyCourse>(`/admin/vocabulary/paths/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCourse: (id: string) => fetcher<{ success: boolean }>(`/admin/vocabulary/paths/${id}`, { method: 'DELETE' }),

    // Admin vocab operations
    upsert: (data: Partial<Vocabulary>) => fetcher<Vocabulary>('/admin/vocabulary/', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher<{ success: boolean }>(`/admin/vocabulary/${id}`, { method: 'DELETE' }),
    bulkImport: (vocab_course_id: string, words: Partial<Vocabulary>[]) => fetcher<{ count: number }>('/admin/vocabulary/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ vocab_course_id, words }),
    }),
    /** Tải file SQL export để đóng gói dictionary.db */
    exportSqlUrl: (vocab_course_id?: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const qs = vocab_course_id ? `?vocab_course_id=${vocab_course_id}` : '';
      return `${API_BASE_URL}/admin/vocabulary/export-sql${qs}`;
    },
    // New Sync-related Admin APIs
    searchAdmin: (q: string) => fetcher<Vocabulary[]>(`/dictionary/admin/search?q=${encodeURIComponent(q)}`),
    updateAdmin: (id: string, data: Partial<Vocabulary>) => fetcher<Vocabulary>(`/dictionary/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    publish: () => fetcher<{ version: number }>('/dictionary/admin/publish', { method: 'POST' }),
  },
  daily: {
    getToday: () => fetcher<DailyChallenge>('/daily/today'),
    complete: (challengeId: string) => fetcher<{ success: boolean }>('/daily/complete', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    }),
    claim: (challengeId: string) => fetcher<{ success: boolean, message: string }>('/daily/claim', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    }),
    // Admin generate
    generate: (rawText: string) => fetcher<any>('/admin/daily/generate', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText }),
    }),
    // Admin push
    push: (date: string, content: any) => fetcher<{ success: boolean }>('/admin/daily/push', {
      method: 'POST',
      body: JSON.stringify({ date, content }),
    }),
  },
  shop: {
    list: () => fetcher<ShopItem[]>('/shop/items'),
    buy: (itemId: string, quantity: number = 1) => fetcher<{ success: boolean }>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity }),
    }),
    equip: (inventoryId: string) => fetcher<{ success: boolean }>('/shop/equip', {
      method: 'POST',
      body: JSON.stringify({ inventoryId }),
    }),
    inventory: () => fetcher<any[]>('/shop/inventory'),
    // Admin ops
    adminList: () => fetcher<ShopItem[]>('/admin/shop/items'), 
    create: (data: Partial<ShopItem>) => fetcher<ShopItem>('/admin/shop/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ShopItem>) => fetcher<{ success: boolean }>(`/admin/shop/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetcher<{ success: boolean }>(`/admin/shop/items/${id}`, { method: 'DELETE' }),
  },
  adminUser: {
    list: (params?: { role?: string; tier?: string; query?: string; offset?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.role) searchParams.append('role', params.role);
      if (params?.tier) searchParams.append('tier', params.tier);
      if (params?.query) searchParams.append('query', params.query);
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return fetcher<any[]>(`/admin/users?${searchParams.toString()}`);
    },
    update: (id: string, data: any) => fetcher<{ success: boolean }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  payment: {
    createLink: (amount: number, description: string) => fetcher<{ checkoutUrl: string; orderCode: number }>('/payment/payos/create-link', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
    simulateSuccess: (orderCode: number) => fetcher<{ success: boolean }>('/payment/payos/simulate-success', {
      method: 'POST',
      body: JSON.stringify({ orderCode }),
    }),
  },
  dictionary: {
    getVersion: () => fetcher<VersionMeta>('/dictionary/version'),
    setVersion: (data: Partial<VersionMeta>) => fetcher<VersionMeta>('/dictionary/version', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/admin/upload/`, {
      method: "POST",
      body: formData,
      headers: bearerHeaders(),
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
    get: (id: string) => fetcher<Job>(`/jobs/${id}`),
    waitForJob: async (id: string, onProgress?: (job: Job) => void): Promise<Job> => {
      const poll = async (): Promise<Job> => {
        const job = await api.jobs.get(id);
        if (onProgress) onProgress(job);
        if (job.status === 'completed' || job.status === 'failed') return job;
        await new Promise(r => setTimeout(r, 2000));
        return poll();
      };
      return poll();
    }
  },
  adminStats: {
    overview: () => fetcher<AdminStats>('/admin/stats/overview'),
  },
  auth: {
    login: async (data: any) => {
      const res = await fetcher<{ token: string; user: any }>('/auth/login', {
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
  },
  contributions: {
    listAdmin: (status: string, perPage: number = 50) => fetcher<any[]>(`/vault/contributions?status=${status}&per_page=${perPage}`),
    reviewAdmin: (id: string, action: 'approve' | 'reject') => fetcher<{ success: boolean }>(`/vault/contributions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
  }
};

