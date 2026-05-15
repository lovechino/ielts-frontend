# GEMINI.md — IELTS Learning Platform

> **Dành cho:** AI Agent (Antigravity / Gemini)  
> **Phiên bản:** 1.0 — Tạo ngày 2026-05-11  
> **Nguồn tham chiếu:** `Docs/ielts_platform_roadmap.md`

---

## 1. Tổng Quan Dự Án

**Tên:** IELTS Learning Platform  
**Mục tiêu:** Nền tảng học IELTS AI-powered, hỗ trợ 4 kỹ năng (Reading, Writing, Listening, Speaking), có chấm điểm tự động bằng Claude API và AI Tutor dùng RAG.

**Timeline:** 32 tuần (16 sprint × 2 tuần)  
**Phases:**
- Phase 1 (Tuần 1–8): Foundation — Auth, Content Engine, Frontend MVP
- Phase 2 (Tuần 9–16): AI Integration — Content Pipeline, RAG Tutor, Writing Scorer (Local LLM)
- Phase 3 (Tuần 17–24): Scale & Security — Caching, Workers, Observability, Security Hardening
- Phase 4 (Tuần 25–32+): Launch — Gamification, Community, Payment, Beta → Public
- Phase 5 (Future): Speaking Scorer & Speech Integration

---

## 2. Tech Stack Chuẩn

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| **Backend** | Hono (Cloudflare Workers) | Edge runtime, low latency |
| **Frontend** | Next.js 15 (App Router) + Tailwind | PWA, SSR, SEO |
| **Database** | PostgreSQL 16 + pgvector | Vector search built-in |
| **Cache** | Redis 7 | Session, queue, leaderboard |
| **Queue** | Cloudflare Queues / BullMQ | Async AI scoring |
| **Storage** | Cloudflare R2 | Audio, image uploads |
| **CDN** | Cloudflare | Wrap R2 |
| **AI Scoring** | Local LLM (Llama 3 8B / Mistral 7B) | Tối ưu chi phí, chạy local/self-hosted |
| **AI Speech** | **FUTURE FEATURE** (Local Whisper) | Tạm hoãn |
| **AI Embed** | Local Embedding (BGE-small-en-v1.5) | 384/768 dims, pgvector |
| **Infra** | Railway/Fly.io + Local GPU | Không K8s |
| **CI/CD** | GitHub Actions | lint → test → deploy |
| **Monitoring** | Prometheus + Grafana | Self-hosted |
| **Error Tracking** | Sentry | Free tier |
| **Email** | Resend | Welcome, notification |
| **Payment** | Stripe + PayOS | International + domestic |
| **Testing** | pytest + Playwright | Unit/Integration + E2E |

---

## 3. Cấu Trúc Thư Mục Chuẩn

```
ielts-platform/
├── backend-cloudflare/         # Hono (Cloudflare Workers)
│   ├── src/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── router.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── courses.ts
│   │   │   │   ├── progress.ts
│   │   │   │   ├── tests.ts
│   │   │   │   ├── vocabulary.ts
│   │   │   │   └── jobs.ts
│   │   ├── db/                 # Drizzle ORM Schema & Client
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── services/           # Business logic
│   │   │   ├── ai.service.ts
│   │   │   ├── course.service.ts
│   │   │   ├── lesson.service.ts
│   │   │   └── progress.service.ts
│   │   └── index.ts            # Entry point
│   ├── drizzle/                # DB Migrations
│   ├── package.json
│   └── wrangler.jsonc          # Cloudflare configuration
├── frontend/                   # Next.js 15 App Router
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── lessons/
│   │   └── admin/
│   ├── components/
│   ├── lib/                    # axios instance, api client
│   └── public/
├── docs/
├── .agent/
├── dev.bat                     # Quick dev runner
└── GEMINI.md                   # File này

```

---

## 4. API Conventions

### URL Pattern
```
/api/v{N}/{resource}
```

### Response Format (LUÔN TUÂN THỦ)
```json
// Success
{ "success": true, "data": {...}, "meta": { "page": 1, "per_page": 20, "total": 150 } }

// Error
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "...", "details": null } }
```

### HTTP Status Codes chuẩn
| Tình huống | Code |
|---|---|
| Async AI job đang chạy | `202 Accepted` + `{ job_id }` |
| AI scoring success rate | `200` kèm kết quả đầy đủ |
| Validation lỗi | `422` |
| Rate limit | `429` |
| Hết credit | `402` + `INSUFFICIENT_CREDITS` |

---

## 5. Database Key Models

```sql
users → oauth_accounts (1:N)
users → user_progress (1:N)
users → submissions (1:N)
users → user_streaks (1:1)
courses → lessons (1:N)
lessons → questions (1:N)
questions → submissions (1:N)
document_embeddings → {lessons, questions, vocabulary} (polymorphic via source_type)
```

**Vector column:** `embedding vector(1536)` trong `document_embeddings` — dùng `ivfflat` index.

---

## 6. Current Sprint Context

Cập nhật field này mỗi khi bắt đầu sprint mới:

```
Current Sprint : Sprint 2C — AI Scoring (Writing & Speaking)
Current Phase  : Phase 2 — AI Integration
Week           : 13–14
Focus          : Writing Scorer AI, Feedback UI, Submission Modal, JSON Parsing Resilience
```

---

## 7. Files Quan Trọng Cần Biết

| File | Mục đích |
|---|---|
| `Docs/ielts_platform_roadmap.md` | Source of truth cho toàn bộ plan |
| `.agent/workflow.md` | Workflow step-by-step cho agent |
| `.agent/rules-do.md` | Những gì ĐƯỢC làm |
| `.agent/rules-dont.md` | Những gì KHÔNG được làm |
| `.agent/sprint-checklist.md` | Checklist sprint hiện tại |
| `docs/adr/` | Architecture Decision Records |
| `prompts/` | Prompt templates cho AI (version controlled) |
