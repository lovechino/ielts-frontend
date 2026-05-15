# IELTS Learning Platform — Execution Roadmap v2.0

> **Dành cho:** Development Team  
> **Cập nhật:** 2026  
> **Phiên bản tài liệu:** 2.0  
> **Tổng thời gian:** 32 tuần (16 sprint × 2 tuần)  
> **Quy tắc:** Mỗi sprint phải có ít nhất 1 deliverable demo được trước khi chuyển sprint tiếp theo.

---

## Mục lục

- [Stack Công nghệ](#stack-công-nghệ)
- [API Versioning Strategy](#api-versioning-strategy)
- [Phase 1 — Foundation (Tuần 1–8)](#phase-1--foundation-tuần-18)
- [Phase 2 — AI Integration (Tuần 9–16)](#phase-2--ai-integration-tuần-916)
- [Phase 3 — Scale & Security (Tuần 17–24)](#phase-3--scale--security-tuần-1724)
- [Phase 4 — Launch (Tuần 25–32+)](#phase-4--launch-tuần-2532)
- [Definition of Done](#definition-of-done)
- [Quy tắc không được vi phạm](#quy-tắc-không-được-vi-phạm)

---

## Stack Công nghệ

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| **Backend** | Hono (Cloudflare Workers) | Chạy trên Edge, hiệu năng cao, chi phí thấp |
| **Frontend** | Next.js 15 (App Router) + Tailwind | PWA built-in, SEO, SSR cho landing page |
| **Primary DB** | Cloudflare D1 (SQLite) | SQL Database trên Edge, không cần quản trị server |
| **Cache** | Redis 7 | Session, queue, leaderboard |
| **Queue** | BullMQ (Node) hoặc Celery + Redis (Python) | Async AI scoring, email |
| **Object Storage** | Cloudflare R2 | Rẻ hơn S3, egress miễn phí |
| **CDN** | Cloudflare | Tích hợp với R2 |
| **AI — Scoring** | Local LLM (Llama 3 8B / Mistral 7B via Ollama/vLLM) | Tối ưu chi phí, chạy local/self-hosted |
| **AI — Speech** | **FUTURE FEATURE** (Local Whisper) | Tạm hoãn do vấn đề kinh phí & hạ tầng |
| **AI — Embedding** | Local Embedding (BGE-small-en-v1.5 / HuggingFace) | 384/768 dims, không tốn phí API |
| **Infra** | Railway/Fly.io + Local GPU (hoặc VPS có GPU) | Cần cân nhắc chi phí thuê GPU |
| **CI/CD** | GitHub Actions | Build → Test → Deploy tự động |
| **Monitoring** | Prometheus + Grafana | Self-hosted, miễn phí |
| **Error Tracking** | Sentry | Free tier đủ dùng cho MVP |
| **Email** | Resend (hoặc AWS SES) | Developer-friendly, giá rẻ |
| **Payment** | Stripe + PayOS | International + domestic |
| **Testing** | pytest + Playwright | Unit/Integration + E2E |

---

## API Versioning Strategy

### Nguyên tắc

- Tất cả endpoint đều có prefix `/api/v{N}/`
- **Không bao giờ** breaking change trên version đang có users
- Deprecation phải thông báo tối thiểu **4 tuần** trước khi remove
- Version mới được tạo khi có breaking change (đổi response schema, remove field, đổi auth method)

### Cấu trúc URL

```
https://api.ieltsplatform.com/api/v1/auth/login
https://api.ieltsplatform.com/api/v1/courses
https://api.ieltsplatform.com/api/v1/questions
https://api.ieltsplatform.com/api/v2/scoring/writing   ← breaking change → tạo v2
```

### Triển khai trong FastAPI

```python
# main.py
from fastapi import FastAPI
from app.api.v1.router import router as v1_router
from app.api.v2.router import router as v2_router

app = FastAPI(title="IELTS Platform API")

app.include_router(v1_router, prefix="/api/v1")
app.include_router(v2_router, prefix="/api/v2")
```

```
app/
├── api/
│   ├── v1/
│   │   ├── router.py          # include tất cả sub-router của v1
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── questions.py
│   │   ├── progress.py
│   │   └── scoring.py
│   └── v2/                    # tạo khi cần breaking change
│       └── router.py
├── core/
│   ├── config.py
│   ├── security.py
│   └── dependencies.py
├── models/                    # SQLAlchemy models
├── schemas/                   # Pydantic schemas (request/response)
├── services/                  # Business logic
└── workers/                   # Celery/BullMQ tasks
```

### Response Format chuẩn (áp dụng toàn bộ v1)

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không đúng.",
    "details": null
  }
}
```

### Error Codes chuẩn

| Code | HTTP Status | Mô tả |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Sai email/password |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn |
| `FORBIDDEN` | 403 | Không có quyền truy cập |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `VALIDATION_ERROR` | 422 | Dữ liệu đầu vào không hợp lệ |
| `RATE_LIMITED` | 429 | Vượt quá giới hạn request |
| `AI_PROCESSING` | 202 | Job AI đang xử lý async |
| `INSUFFICIENT_CREDITS` | 402 | Hết lượt dùng (free tier) |
| `INTERNAL_ERROR` | 500 | Lỗi server |

### Versioning cho Swagger UI

```python
# Swagger tách biệt cho từng version
app = FastAPI()

v1_app = FastAPI(title="IELTS API v1", version="1.0.0", docs_url="/docs")
v2_app = FastAPI(title="IELTS API v2", version="2.0.0", docs_url="/docs")

app.mount("/api/v1", v1_app)
app.mount("/api/v2", v2_app)
```

Truy cập docs tại:
- `https://api.ieltsplatform.com/api/v1/docs`
- `https://api.ieltsplatform.com/api/v2/docs`

---

## Phase 1 — Foundation (Tuần 1–8)

### Sprint 1A — Architecture & Design · Tuần 1–2

**Mục tiêu:** Toàn bộ team đồng thuận về kiến trúc trước khi viết một dòng code nào.

#### Checklist

- [x] **ERD hoàn chỉnh** — thiết kế và review toàn bộ schema PostgreSQL (Updated with PDF & Question Format support)
- [x] **OpenAPI spec v1 frozen** — API v1 endpoints for Admin CMS finalized
- [x] **ADR viết xong** — Chốt kiến trúc Course-Lesson-Question
- [x] **Repo structure** — Monorepo structure with FastAPI and Next.js
- [x] **Docker Compose** — Local dev environment running with PostgreSQL
- [x] **GitHub Actions** — CI pipeline basic setup
- [x] **Môi trường** — .env configuration and static file serving set up

#### Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),          -- NULL nếu login bằng OAuth
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(50) DEFAULT 'student',  -- student | teacher | admin
    target_band DECIMAL(2,1),           -- 5.0 ~ 9.0
    avatar_url  TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth providers
CREATE TABLE oauth_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    provider    VARCHAR(50) NOT NULL,   -- google | facebook
    provider_id VARCHAR(255) NOT NULL,
    UNIQUE(provider, provider_id)
);

-- Courses
CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    skill       VARCHAR(50) NOT NULL,   -- reading | writing | listening | speaking
    level       VARCHAR(50),            -- beginner | intermediate | advanced
    is_published BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    content     JSONB,                  -- structured content
    audio_url   TEXT,                   -- cho listening
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,   -- mcq | matching | fill_blank | writing | speaking
    content     JSONB NOT NULL,         -- schema theo từng type
    order_index INTEGER NOT NULL,
    points      INTEGER DEFAULT 1,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Question content JSONB schema theo type:
-- MCQ:       { "text": "...", "options": ["A","B","C","D"], "answer": "A" }
-- Matching:  { "left": ["..."], "right": ["..."], "pairs": [[0,2],[1,0]] }
-- Fill:      { "text": "The ___ is red", "blanks": ["sky"] }
-- Writing:   { "prompt": "...", "min_words": 250, "task_type": "task1|task2" }
-- Speaking:  { "prompt": "...", "prep_seconds": 30, "speak_seconds": 120 }

-- User Progress
CREATE TABLE user_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status          VARCHAR(50) DEFAULT 'not_started', -- not_started | in_progress | completed
    score           DECIMAL(4,1),
    completed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Submissions
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id     UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer          JSONB NOT NULL,     -- câu trả lời của user
    score           DECIMAL(4,1),
    ai_feedback     JSONB,              -- feedback từ AI
    scored_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE user_streaks (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak  INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    last_activity   DATE,
    freeze_count    INTEGER DEFAULT 1,  -- số lần được dùng freeze
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary
CREATE TABLE vocabulary (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word        VARCHAR(255) UNIQUE NOT NULL,
    definition  TEXT,
    examples    JSONB,                  -- ["example 1", "example 2"]
    band_level  DECIMAL(2,1),          -- band score level
    category    VARCHAR(100),           -- academic | general | topic-specific
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE document_embeddings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,   -- lesson | question | vocabulary | article
    source_id   UUID NOT NULL,
    chunk_text  TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding   vector(1536),          -- text-embedding-3-small
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### Deliverable của sprint

- Docker Compose `up` → toàn bộ service chạy
- ERD diagram export ra PDF, commit vào `/docs/erd.pdf`
- OpenAPI spec export ra `/docs/openapi-v1.yaml`
- README.md có hướng dẫn setup local đủ để người mới chạy được trong 15 phút

---

### Sprint 1B — Auth & User Service · Tuần 3–4

**Mục tiêu:** Authentication hoàn chỉnh, production-ready.

#### Checklist

- [x] **POST** `/api/v1/auth/register` — đăng ký, băm mật khẩu bằng bcryptjs
- [x] **POST** `/api/v1/auth/login` — trả về `jwt_token` có thời hạn 24 giờ
- [x] **GET** `/api/v1/auth/me` — lấy thông tin user hiện tại (Protected)
- [ ] **POST** `/api/v1/auth/refresh` — (Tương lai) dùng refresh token lấy access token mới
- [ ] **POST** `/api/v1/auth/logout` — invalidate session
- [ ] **GET** `/api/v1/auth/google` — OAuth2 redirect (Future)
- [x] **PATCH** `/api/v1/users/me` — cập nhật profile (full_name, target_band, avatar)
- [x] **POST** `/api/v1/users/me/avatar` — upload avatar → R2, trả về URL
- [x] Rate limiting: `slowapi` — 10 req/phút cho `/auth/login`, 100 req/phút cho các endpoint khác
- [x] Password hashing: `bcrypt` với cost factor 12
- [x] Unit test coverage ≥ 80% cho toàn bộ auth module

#### Token Strategy

```python
# schemas/auth.py
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Access token payload
{
    "sub": "user_uuid",
    "role": "student",
    "iat": 1234567890,
    "exp": 1234567890,
    "jti": "unique_token_id"   # để blacklist khi cần
}

# Refresh token: lưu hash vào DB, không lưu plaintext
# Rotation: mỗi lần dùng refresh token → tạo token mới + invalidate token cũ
```

#### Deliverable của sprint

- Postman collection (hoặc `.http` file) test được toàn bộ 9 endpoint
- `pytest` chạy pass với ≥ 80% coverage
- Google OAuth hoạt động trên localhost

---

### Sprint 1C — Content Engine · Tuần 5–6

**Mục tiêu:** CRUD hoàn chỉnh cho toàn bộ content, có seed data để Frontend dùng.

#### Checklist

**Courses & Lessons**
- [x] **GET** `/api/v1/courses` — list với filter
- [x] **GET** `/api/v1/courses/{id}` — detail kèm danh sách lessons
- [x] **POST** `/api/v1/courses` — tạo course (Admin CMS)
- [x] **PATCH** `/api/v1/courses/{id}` — cập nhật
- [x] **DELETE** `/api/v1/courses/{id}` — soft delete
- [x] **GET** `/api/v1/lessons/{id}` — lesson detail kèm questions
- [x] **POST** `/api/v1/lessons` — tạo lesson + hỗ trợ pdf_url
- [x] **PATCH** `/api/v1/lessons/{id}/reorder` — thay đổi thứ tự lesson

**Questions**
- [x] **GET** `/api/v1/questions/{id}`
- [x] **POST** `/api/v1/questions` — hỗ trợ image_url và question_format
- [x] **PATCH** `/api/v1/questions/{id}`
- [x] **DELETE** `/api/v1/questions/{id}`

**Progress**
- [x] **POST** `/api/v1/progress/submit`
- [x] **GET** `/api/v1/progress/me`
- [x] **GET** `/api/v1/progress/me/lessons/{lesson_id}`

**Vocabulary**
- [x] **GET** `/api/v1/vocabulary` — search, filter theo level (CEFR sync)
- [x] **POST** `/api/v1/vocabulary/bulk` — import từ file JSON/CSV

**File Upload**
- [x] **POST** `/api/v1/upload` — hỗ trợ PDF và Image upload lên server cục bộ

**Seed Data**
- [x] Script `scrape_web_course.py` & `parse_pdf_course.py` thay thế seed thủ công bằng data thật.
- [x] 1 full Reading mock test mẫu được tạo từ bài báo thực tế.

#### Deliverable của sprint

- Toàn bộ endpoint hoạt động với Swagger UI live tại `/api/v1/docs`
- `python seed.py` chạy được và tạo đủ data
- Integration test cho luồng submit MCQ → nhận điểm

---

### Sprint 1D — Frontend MVP · Tuần 7–8

**Mục tiêu:** Web app dùng được end-to-end cho luồng học cơ bản.

#### Checklist

**Onboarding**
- [x] Trang `/register` — form đăng ký + Google OAuth button
- [x] Trang `/login`
- [x] Onboarding wizard (3 bước): chọn mục tiêu band score → chọn kỹ năng yếu → trang Dashboard
- [x] Redirect sau login về trang trước đó (middleware Next.js)

**Dashboard**
- [x] Overview card: band score hiện tại, target band, % hoàn thành
- [x] Streak counter (UI-only, logic thật ở Phase 4A)
- [x] Danh sách khóa học đang học + recommended next lesson
- [x] Recent activity (5 bài gần nhất)

**Học bài**
- [x] Trang `/courses` — grid listing với filter skill
- [x] Trang `/courses/{id}` — lesson list với progress indicator
- [x] Trang `/lessons/{id}` — Lesson viewer chuyên nghiệp, hỗ trợ Markdown Rendering
- [x] Exercise renderer hỗ trợ 3 loại: MCQ, Fill-in-blank, Matching
- [x] Submit → hiển thị kết quả ngay

**Admin CMS**
- [x] Trang `/admin` Dashboard
- [x] Trang `/admin/courses` Management
- [x] Trang `/admin/courses/[id]` Lesson Management + PDF Upload
- [x] Trang `/admin/lessons/[id]/questions` Question Builder with Image Upload support
- [x] **Unified IeltsModal** — High-end modal for summary and detailed feedback
- [x] **Grading Loading States** — Better UX while waiting for AI results
- [x] **Retake Test Flow** — Ability to reset progress and try again

**Technical**
- [x] Axios instance với interceptor
- [x] React Query cho data fetching
- [x] Responsive design
- [x] Loading skeleton (In-progress)

#### Không build trong sprint này

> ❌ AI chatbot  
> ❌ Writing/Speaking submission  
> ❌ Leaderboard  
> ❌ Dark mode  
> ❌ Mobile app  

#### Deliverable của sprint

- Demo được luồng: Register → Onboarding → Dashboard → Mở lesson → Làm MCQ → Xem kết quả
- Lighthouse Performance score ≥ 70 trên desktop

---

## Phase 2 — AI Integration (Tuần 9–16)

**Content Automation Pipeline**
- [x] **Web Scraper** — Tự động cào bài báo học thuật từ Wikipedia/News nạp vào Lesson
- [x] **PDF Parser** — Tích hợp PyMuPDF để trích xuất nội dung từ giáo trình PDF
- [x] **Human Review Queue** — Thay thế bằng Admin CMS cho phép Admin tự tạo/sửa/duyệt nội dung
- [x] **Scheduler** — Scripts chạy thủ công hoặc theo yêu cầu admin (CLI)

#### Deliverable của sprint

- Chạy pipeline thủ công → sinh ra ≥ 20 bài với câu hỏi, vào review queue
- Admin approve 5 bài → bài xuất hiện trên platform

---

### Sprint 2B — RAG & AI Tutor · Tuần 11–12

**Mục tiêu:** AI Tutor trả lời câu hỏi ngữ pháp/từ vựng dựa trên context bài học.

#### Checklist

**Vector Indexing**
- [ ] Script `embed_all.py` — chunk toàn bộ content (lessons, vocabulary, articles) thành đoạn 512 tokens với overlap 50 tokens
- [ ] Dùng Local Embedding model (BGE-small-en-v1.5), lưu vào `document_embeddings` table (pgvector)
- [ ] Incremental indexing: chỉ embed content mới, không re-embed toàn bộ

**RAG Pipeline**

```python
# services/rag.py — luồng xử lý
async def answer_question(
    question: str,
    lesson_id: UUID,
    conversation_history: list[dict]
) -> AsyncGenerator[str, None]:
    
    # 1. Embed câu hỏi
    query_embedding = await embed(question)
    
    # 2. Semantic search — lấy top 5 chunks liên quan nhất
    chunks = await vector_search(
        embedding=query_embedding,
        filter={"source_id": lesson_id},  # ưu tiên context bài học
        top_k=5
    )
    
    # 3. Re-rank (optional: Cohere rerank API hoặc cross-encoder)
    ranked_chunks = rerank(question, chunks)
    
    # 4. Build prompt với context
    context = "\n\n".join([c.chunk_text for c in ranked_chunks])
    
    # 5. Stream response từ Local LLM (Ollama/vLLM)
    async for token in local_llm_stream(question, context, conversation_history):
        yield token
```

**AI Tutor API**
- [ ] **POST** `/api/v1/tutor/chat` — body: `{ lesson_id, message, conversation_id }`
  - Trả về SSE stream (Server-Sent Events)
  - Mỗi response có `sources: [chunk_id, ...]` để hiển thị citation
- [ ] **GET** `/api/v1/tutor/conversations` — lịch sử chat của user
- [ ] **DELETE** `/api/v1/tutor/conversations/{id}` — xóa conversation

**Context Management**
- [ ] Max 10 turns trong conversation history gửi lên API
- [ ] Tổng token không vượt 4000 tokens (context + question + history)
- [ ] Nếu không tìm được context liên quan (similarity < 0.75) → fallback response

**Usage Tracking**
- [ ] Log mỗi request: `user_id`, `input_tokens`, `output_tokens`, `model`, `timestamp`
- [ ] Bảng `ai_usage_logs` trong DB
- [ ] Alert khi 1 user dùng > 10,000 tokens/ngày

**Frontend**
- [ ] Chat widget floating button ở góc phải trang lesson
- [ ] Hiển thị sources (citation) dưới mỗi câu trả lời
- [ ] Typing indicator khi AI đang stream

#### Deliverable của sprint

- Demo: mở lesson Reading → hỏi AI "từ 'proliferate' nghĩa là gì trong đoạn này?" → AI trả lời có dẫn nguồn từ bài

---

### Sprint 2C — AI Scoring (Writing & Speaking) · Tuần 13–14

**Mục tiêu:** Chấm điểm tự động 2 kỹ năng khó nhất, trả kết quả async.

#### Writing Scorer

**Checklist**
- [x] **POST** `/api/v1/scoring/writing` — body: `{ question_id, essay_text }` → returns scores & feedback (Synchronous/Async support)
- [x] **Robust JSON Parsing** — Enhanced resilience against malformed AI responses with Regex fallback
- [x] **Writing Scorer Prompt v2** — Strict JSON formatting for Llama-3.1-8b
- [ ] Worker xử lý async qua queue (In progress)

**Prompt Template** (lưu tại `/prompts/writing_scorer_v1.txt`)

```
You are an IELTS Writing examiner. Score the following essay strictly according 
to IELTS official band descriptors. Return ONLY valid JSON, no other text.

Task: {task_type} (Task 1 or Task 2)
Question: {question}
Essay: {essay}

Score each criterion from 0 to 9 in 0.5 increments. Return:
{
  "task_response": { "score": 7.0, "feedback": "..." },
  "coherence_cohesion": { "score": 6.5, "feedback": "..." },
  "lexical_resource": { "score": 7.0, "feedback": "..." },
  "grammatical_range": { "score": 6.0, "feedback": "..." },
  "overall": 6.5,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "corrected_excerpt": "..." 
}
```

**Validation**
- [ ] Parse JSON response, validate với Pydantic
- [ ] Nếu parse thất bại → retry tối đa 3 lần với temperature tăng dần
- [ ] Nếu 3 lần đều thất bại → mark job `failed`, alert admin
- [ ] Kiểm tra `overall` = trung bình cộng 4 tiêu chí (±0.5), nếu sai → tính lại

#### Speaking Scorer

**Checklist**
- [ ] **POST** `/api/v1/scoring/speaking` — multipart: `{ question_id, audio_file }` → `{ job_id }`
- [ ] Worker pipeline:
  1. Upload audio lên R2 (backup)
  2. Gửi lên Whisper API → nhận transcript
  3. Gửi transcript + question lên Claude → nhận score
  4. Lưu kết quả, push WebSocket notification cho user
- [ ] Hỗ trợ format: `mp3`, `mp4`, `m4a`, `wav`, `ogg` — tối đa 25MB

**Speaking Scoring Criteria:**
- Fluency & Coherence
- Lexical Resource
- Grammatical Range & Accuracy
- Pronunciation (từ transcript, estimate)

#### Technical Note
- Chuyển Speaking module thành Future Feature.
- Ưu tiên tối ưu Writing Scorer bằng local LLM (fine-tuning nếu cần).

#### Deliverable của sprint

- Demo đầy đủ: submit writing essay → chờ 10–15 giây → nhận điểm 4 tiêu chí + feedback
- Demo speaking: record 1 phút → chờ → nhận transcript + score

---

### Sprint 2D — Integration & Testing · Tuần 15–16

**Mục tiêu:** Kiểm tra toàn diện trước khi bắt đầu Phase 3.

#### Checklist

**Automated Testing**
- [ ] E2E test (Playwright): signup → onboarding → học bài → submit writing → nhận score
- [ ] Load test (Locust hoặc k6): 50 concurrent users, tất cả endpoint phải `p95 < 2s`
- [ ] RAG accuracy test: 20 câu hỏi mẫu, ≥ 70% câu trả lời relevant
- [ ] AI scoring consistency test: cùng 1 bài essay, score giữa 3 lần chạy không chênh quá 0.5

**Bug Fix & Polish**
- [ ] Triage tất cả bug từ testing, fix hết `critical` và `high` trước khi sang Phase 3
- [ ] API response time audit: log slow queries (> 500ms), thêm index nếu cần

**Documentation**
- [ ] Swagger UI live và đầy đủ cho tất cả v1 endpoints
- [ ] `/docs/api-changelog.md` — ghi lại mọi thay đổi API theo date
- [ ] Postman collection export commit vào repo

**Infrastructure**
- [ ] Staging environment deploy lên Railway/Fly.io
- [ ] `.env.staging` config tách biệt với production
- [ ] Database migration script (Alembic) hoạt động trên staging

**Cost Audit**
- [ ] Tính chi phí AI per user session: embedding + RAG + scoring
- [ ] Set spending alert trên OpenAI và Anthropic dashboard
- [ ] Estimate: nếu có 1000 users active/ngày thì tốn bao nhiêu $/ngày?

#### Deliverable của sprint

- Tất cả E2E test pass trên staging
- Cost report document commit vào `/docs/ai-cost-estimate.md`
- Zero critical bugs trên staging

---

## Phase 3 — Scale & Security (Tuần 17–24)

### Sprint 3A — Caching & Performance · Tuần 17–18

**Mục tiêu:** Giảm load DB và tăng tốc response.

#### Checklist

**Redis Caching Strategy**

| Data | TTL | Invalidation |
|---|---|---|
| User session | 15 phút | Khi logout |
| Course list | 1 giờ | Khi admin publish/unpublish course |
| Lesson content | 24 giờ | Khi lesson được edit |
| Leaderboard | 5 phút | Time-based |
| Vocabulary search | 1 giờ | Time-based |

- [ ] Implement cache decorator trong FastAPI:
```python
@cache(ttl=3600, key="course:{course_id}")
async def get_course(course_id: UUID): ...
```
- [ ] Cache invalidation: publish event khi data thay đổi → invalidate key liên quan
- [ ] Cache hit rate monitoring: target ≥ 60% cho course/lesson endpoints

**CDN & Static Assets**
- [ ] Upload toàn bộ audio lesson lên Cloudflare R2
- [ ] Configure Cloudflare Cache Rule: audio/image TTL 30 ngày, api TTL 0
- [ ] Image optimization middleware: resize on-the-fly với Cloudflare Images hoặc Sharp (Node.js)

**Database**
- [ ] Chạy `EXPLAIN ANALYZE` trên 10 query phổ biến nhất
- [ ] Thêm index còn thiếu (đặc biệt trên `user_progress.user_id`, `submissions.user_id`)
- [ ] PgBouncer cho connection pooling (transaction mode, pool size 20)

**API**
- [ ] Enable gzip compression cho tất cả response
- [ ] Pagination enforce: tất cả list endpoint phải có `limit` (max 100) và `cursor`/`offset`

#### Deliverable của sprint

- Response time benchmark before/after: phải cải thiện ≥ 30%
- Cache hit rate hiển thị trên Grafana dashboard

---

### Sprint 3B — Async Worker System · Tuần 19–20

**Mục tiêu:** Toàn bộ tác vụ nặng chạy background, user không bao giờ phải chờ.

#### Checklist

**Queue Architecture**

```
Queues:
├── ai-scoring-high     (priority, AI writing/speaking jobs)
├── ai-scoring-low      (batch grading)
├── content-processing  (auto-generate questions)
├── email               (notifications)
└── cleanup             (delete old logs, temp files)
```

**Worker Jobs**

| Job | Queue | Timeout | Retry |
|---|---|---|---|
| `score_writing` | ai-scoring-high | 60s | 3x exp backoff |
| `score_speaking` | ai-scoring-high | 90s | 3x exp backoff |
| `transcribe_audio` | ai-scoring-high | 120s | 2x |
| `generate_questions` | content-processing | 180s | 2x |
| `send_email` | email | 30s | 5x |
| `embed_content` | content-processing | 300s | 1x |

- [ ] Dead Letter Queue: job thất bại sau tất cả retry → chuyển sang DLQ, alert admin qua Slack
- [ ] Job status API: **GET** `/api/v1/jobs/{job_id}` — `{ status, progress, result, error }`
- [ ] Bull Board (hoặc Flower nếu dùng Celery): dashboard tại `/admin/queues`

**Email Notifications** (Resend hoặc SES)
- [ ] Welcome email khi đăng ký (có link verify email)
- [ ] Writing score ready: gửi khi job hoàn thành
- [ ] Weekly progress report: mỗi Chủ Nhật 9:00 AM — tổng kết tuần học
- [ ] Streak reminder: gửi lúc 21:00 nếu chưa học hôm nay
- [ ] Email template engine: React Email hoặc MJML

**WebSocket**
- [ ] Notification channel: khi AI score job hoàn thành → push notification thời gian thực cho user đang online
- [ ] Dùng Socket.IO hoặc FastAPI WebSocket endpoint

#### Deliverable của sprint

- Demo: submit writing → nhận email + WebSocket notification khi xong
- Dead letter queue dashboard hiển thị được failed jobs

---

### Sprint 3C — Observability & Infrastructure · Tuần 21–22

**Mục tiêu:** Nhìn thấy mọi thứ đang xảy ra trong hệ thống.

#### Checklist

**Structured Logging**
- [ ] Mọi log phải là JSON với các field: `timestamp`, `level`, `service`, `request_id`, `user_id`, `duration_ms`, `message`
- [ ] Request ID tạo ra ở Nginx → truyền qua toàn bộ service chain
- [ ] Log levels: `DEBUG` (local), `INFO` (staging), `WARNING`+ (production)

**Prometheus Metrics**

```python
# metrics cần export
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}  # histogram
ai_job_queue_depth{queue_name}
ai_job_duration_seconds{job_type}
ai_token_usage_total{model, type}               # input/output tokens
db_connection_pool_size
cache_hit_total / cache_miss_total
```

**Grafana Dashboards**
- [ ] Dashboard 1 — System Overview: RPS, error rate, p50/p95/p99 latency, CPU, RAM
- [ ] Dashboard 2 — AI Performance: queue depth, job duration, token usage, cost estimate
- [ ] Dashboard 3 — Business Metrics: DAU, submissions/ngày, score distribution

**Alerting** (gửi vào Slack channel `#alerts`)

| Alert | Condition | Severity |
|---|---|---|
| High error rate | Error rate > 1% trong 5 phút | Critical |
| Slow API | p99 latency > 3s trong 5 phút | Warning |
| Queue backup | Queue depth > 100 jobs | Warning |
| AI cost spike | Token usage > 2x baseline | Warning |
| DB connection | Pool exhausted | Critical |

**Infrastructure**
- [ ] Nginx reverse proxy với upstream health check (`/health` endpoint trên mỗi service)
- [ ] `GET /health` endpoint trả về: `{ status, db, redis, version, uptime }`
- [ ] Không dùng Kubernetes — dùng Docker Compose + Railway/Fly.io auto-scaling

#### Deliverable của sprint

- Grafana dashboard live trên staging
- Simulate 1% error rate → Slack alert xuất hiện trong 5 phút

---

### Sprint 3D — Security Hardening · Tuần 23–24

**Mục tiêu:** Platform đủ secure để đón users thật.

#### Checklist

**OWASP Top 10 Audit**
- [ ] A01 — Broken Access Control: test IDOR trên tất cả endpoint có `{id}`
- [ ] A02 — Cryptographic Failures: verify tất cả sensitive data được encrypt at rest
- [ ] A03 — Injection: Pydantic validate tất cả input, SQLAlchemy parameterized queries
- [ ] A05 — Security Misconfiguration: scan với OWASP ZAP, fix mọi HIGH/CRITICAL finding
- [ ] A07 — Authentication Failures: brute force protection, account lockout sau 5 lần sai

**Headers & HTTPS**
```nginx
# nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
add_header Permissions-Policy "camera=(), microphone=(self)" always;
```

**Secrets Management**
- [ ] Tất cả secrets trong môi trường qua Railway Secrets hoặc Doppler, KHÔNG commit vào Git
- [ ] API key rotation procedure được document tại `/docs/key-rotation.md`
- [ ] Audit log: mọi thao tác admin được log với `user_id` + `action` + `timestamp`

**Data Privacy**
- [ ] **GET** `/api/v1/users/me/data-export` — export toàn bộ data của user (GDPR)
- [ ] **DELETE** `/api/v1/users/me` — xóa account + toàn bộ data (soft delete 30 ngày, sau đó hard delete)
- [ ] Privacy policy page trên Frontend
- [ ] Không log PII (email, tên) trong application logs

**Penetration Testing**
- [ ] Chạy OWASP ZAP automated scan lên staging
- [ ] Fix tất cả HIGH và CRITICAL findings
- [ ] Document kết quả tại `/docs/security-audit.md`

#### Deliverable của sprint

- ZAP scan report: zero HIGH/CRITICAL findings
- Data export endpoint hoạt động
- Security audit document commit vào repo

---

## Phase 4 — Launch (Tuần 25–32+)

### Sprint 4A — Gamification System · Tuần 25–26

**Mục tiêu:** Tăng daily active users thông qua habit loop.

#### Checklist

**Streak System**
- [ ] Logic check-in: hoàn thành ≥ 1 bài tập → cập nhật `last_activity`, tăng `current_streak`
- [ ] Streak freeze: dùng 1 freeze khi bỏ hôm nay → streak không bị reset (tối đa 1 freeze/tuần, tự recover sau 7 ngày)
- [ ] Streak reset: nếu `last_activity < today - 1` và không có freeze → `current_streak = 0`
- [ ] **GET** `/api/v1/gamification/streak` — current + longest streak, freeze count
- [ ] PWA push notification lúc 21:00 nếu `last_activity != today`

**XP & Levels**

| Hành động | XP |
|---|---|
| Hoàn thành 1 bài MCQ | 10 XP |
| Submit Writing (không tính điểm) | 50 XP |
| Submit Speaking | 50 XP |
| Điểm Writing ≥ 7.0 | +30 XP bonus |
| Streak 7 ngày | 100 XP bonus |
| Hoàn thành course | 500 XP |

- [ ] Level thresholds: Level 1 (0), Level 2 (500), Level 3 (1500), Level 5 (5000)... (exponential)
- [ ] Level-up animation trên Frontend (CSS confetti hoặc Lottie)
- [ ] **GET** `/api/v1/gamification/profile` — level, xp, next_level_xp, badges

**Achievements**
- [ ] 20 achievements tối thiểu (implement badge engine linh hoạt, không hardcode từng badge)
- [ ] Trigger check sau mỗi submit: `check_achievements(user_id, event_type, metadata)`
- [ ] **GET** `/api/v1/gamification/achievements` — tất cả badges, earned/unearned
- [ ] Push notification khi unlock badge mới

**Leaderboard**
- [ ] **GET** `/api/v1/leaderboard?type=weekly|all_time&skill=reading|...`
- [ ] Tính bằng Redis Sorted Set: `ZADD leaderboard:{week} {xp} {user_id}`
- [ ] Reset weekly leaderboard mỗi Thứ Hai 00:00 UTC
- [ ] Hiển thị top 100 + vị trí của user hiện tại

> **Lưu ý:** Bỏ virtual pet khỏi scope. Không đủ resource để làm tốt, làm ẩu phản tác dụng.

#### Deliverable của sprint

- Demo: học 5 bài liên tiếp → streak tăng → nhận badge "5-day streak" → lên level → thấy trên leaderboard

---

### Sprint 4B — Community & Analytics · Tuần 27–28

**Mục tiêu:** Users thấy progress của mình, community tạo retention.

#### Checklist

**Discussion System**
- [ ] **GET/POST** `/api/v1/discussions?lesson_id={id}` — thread dưới mỗi bài
- [ ] **POST** `/api/v1/discussions/{id}/replies`
- [ ] **POST** `/api/v1/discussions/{id}/upvote`
- [ ] **POST** `/api/v1/discussions/{id}/report` — report content vi phạm
- [ ] Moderation queue: **GET/PATCH** `/api/v1/admin/moderation`
- [ ] Rate limit posting: tối đa 10 posts/phút per user

**User Analytics Dashboard**
- [ ] Band score progress chart theo thời gian (Line chart, dữ liệu từ Writing/Speaking submissions)
- [ ] Weak skills radar chart: 4 skills, điểm trung bình 30 ngày gần nhất
- [ ] Study time heatmap: calendar view, màu đậm hơn = học nhiều hơn
- [ ] **GET** `/api/v1/analytics/me?period=30d|90d|all`

**Learning Path Recommendation**
- [ ] Rule-based (không cần ML phức tạp): nếu Writing score < 6.0 → suggest Writing courses có rating cao
- [ ] **GET** `/api/v1/recommendations` — trả về 5 lessons được recommend, có explain reason
- [ ] A/B test: 50% users nhận recommendation rule-based, 50% nhận random → so sánh completion rate

**Payment Integration**
- [ ] Stripe: subscription tiers

| Tier | Giá | Tính năng |
|---|---|---|
| Free | 0đ | 5 AI scores/tháng, 20 AI Tutor messages/ngày |
| Pro | $9.99/tháng | Unlimited AI scoring, unlimited tutor, analytics |
| Team | $29.99/tháng | Pro + 5 seats, teacher dashboard |

- [ ] Webhook Stripe: xử lý `checkout.session.completed`, `customer.subscription.deleted`
- [ ] PayOS integration cho thanh toán nội địa (QR code, banking)
- [ ] **GET** `/api/v1/billing/subscription` — trạng thái subscription hiện tại
- [ ] Free tier enforcement: middleware check `ai_usage_logs` trước mỗi AI call
- [ ] Referral: invite link tạo qua **POST** `/api/v1/referrals`, cả 2 được 7 ngày Pro khi người được mời subscribe

#### Deliverable của sprint

- Demo payment: click Upgrade → Stripe checkout → Pro features mở ngay
- Analytics dashboard hiển thị data thật

---

### Sprint 4C — Beta Launch · Tuần 29–30

**Mục tiêu:** Ship lên production với safety nets đầy đủ.

#### Checklist

**Feature Flags**
- [ ] Implement feature flag system (dùng thư viện đơn giản hoặc env var)
- [ ] Wrap các feature mới: AI Tutor, Speaking scorer, Gamification đều có thể tắt nhanh không cần redeploy

**Error Tracking**
- [ ] Sentry integration: `sentry_sdk.init()` trên cả FastAPI và Next.js
- [ ] Source maps cho Next.js để stack trace có line number thật
- [ ] Alert Slack khi có `unhandled_exception` trên production

**Closed Beta**
- [ ] Tuyển 50–100 beta users (có thể qua form Google, Facebook group IELTS VN)
- [ ] Invite-only: beta users nhận Pro miễn phí 3 tháng
- [ ] In-app feedback button: **POST** `/api/v1/feedback` — lưu DB + gửi Slack

**Runbook** (lưu tại `/docs/runbook.md`)
- [ ] Quy trình rollback deploy
- [ ] Quy trình khi DB sập
- [ ] Quy trình khi AI provider down (fallback response)
- [ ] Quy trình khi bị DDoS (Cloudflare rate limit)

**Backup Verification**
- [ ] Cấu hình automated backup: PostgreSQL dump mỗi 6 giờ lên R2
- [ ] Test restore: thực sự restore từ backup lên môi trường test, verify data đúng
- [ ] Backup retention: 30 ngày

**Các metrics cần đạt trước public launch**

| Metric | Target |
|---|---|
| Uptime (30 ngày qua) | ≥ 99.5% |
| API p95 latency | < 500ms |
| AI scoring success rate | ≥ 95% |
| Zero critical security findings | ✅ |
| E2E test pass rate | 100% |

#### Deliverable của sprint

- Closed beta live, 50+ users đang dùng
- Zero critical bugs sau 7 ngày beta

---

### Sprint 4D — Iterate & Public Launch · Tuần 31+

**Mục tiêu:** Dựa trên data thực tế, không đoán mò.

#### Checklist

**Phân tích Beta Feedback**
- [ ] Categorize tất cả feedback: Bug / UX Problem / Missing Feature / Performance
- [ ] Fix tất cả bugs từ beta trước khi public launch
- [ ] Prioritize backlog dựa trên frequency của request, không dựa trên opinion

**A/B Testing Framework**
- [ ] Triển khai basic A/B test infrastructure (feature flag + analytics event)
- [ ] Test đầu tiên: 2 version của onboarding flow → đo completion rate

**SEO & Growth**
- [ ] Landing page: Next.js SSG, Lighthouse SEO score ≥ 90
- [ ] Blog section: content marketing về IELTS tips (mỗi bài được index bởi Google)
- [ ] Open Graph meta tags cho sharing

**Mobile**
- [ ] PWA: `manifest.json` + service worker → users có thể "Add to homescreen"
- [ ] Đánh giá lại Flutter sau khi có data: nếu ≥ 30% users từ mobile → mới đầu tư native app

**Public Launch Checklist**
- [ ] Custom domain với SSL
- [ ] Status page: `status.ieltsplatform.com` (dùng Upptime hoặc BetterUptime)
- [ ] Terms of Service + Privacy Policy có hiệu lực pháp lý
- [ ] GDPR cookie consent banner
- [ ] Google Analytics hoặc Plausible (privacy-friendly)

---

## Definition of Done

Một task được coi là **Done** khi:

1. ✅ Code được review bởi ít nhất 1 người khác
2. ✅ Unit test viết, pass, không làm fail test cũ
3. ✅ Không có `console.log` hoặc debug code còn sót
4. ✅ API endpoint có trong Swagger docs
5. ✅ Không có hardcoded secret hoặc credential
6. ✅ Chạy được trên staging environment
7. ✅ Happy path E2E test pass

---

## Quy tắc không được vi phạm

> Những quy tắc này không có exception. Nếu có lý do muốn bypass, phải thảo luận với toàn team trước.

1. **Không commit secret/API key lên Git** — dùng pre-commit hook `gitleaks` để scan tự động
2. **Không deploy thẳng lên production** — mọi thứ phải qua staging trước tối thiểu 24 giờ
3. **Không skip Integration Test Sprint (2D)** — dù áp lực deadline thế nào
4. **Không skip Security Hardening Sprint (3D)** — ship security hole = rủi ro toàn bộ user data
5. **Không scrape BBC, Guardian, hoặc bất kỳ site nào không có license rõ ràng**
6. **Không dùng Kubernetes** cho đến khi có > 10,000 DAU và team có DevOps dedicated
7. **Không build feature mới khi còn bug critical chưa fix**
8. **API versioning bắt buộc** — mọi endpoint phải có prefix `/api/v{N}/`, không có exception

---

*Tài liệu này là living document. Cập nhật khi có quyết định kiến trúc mới.*  
*Mọi thay đổi lớn phải được ghi vào `/docs/adr/` (Architecture Decision Records).*
