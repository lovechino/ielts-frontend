# Sprint Checklist — IELTS Learning Platform

> **Cập nhật:** 2026-05-11  
> **Agent:** Cập nhật file này mỗi khi hoàn thành hoặc bắt đầu một task mới.

---

## 📍 Current Sprint: Sprint 1A — Architecture & Design

**Phase:** 1 — Foundation  
**Tuần:** 1–2  
**Mục tiêu:** Toàn bộ team đồng thuận về kiến trúc trước khi viết một dòng code nào.

### Checklist Sprint 1A

- [ ] **ERD hoàn chỉnh** — thiết kế và review toàn bộ schema PostgreSQL
- [ ] **OpenAPI spec v1 frozen** — dùng Stoplight Studio hoặc swagger-editor, freeze trước sprint 1B
- [ ] **ADR viết xong** — cho: FastAPI vs NestJS, pgvector vs Pinecone, Railway vs AWS
- [ ] **Repo structure** — tạo monorepo hoặc 2 repo riêng, branch strategy: `main`/`dev`/`feature/*`/`hotfix/*`
- [ ] **Docker Compose** — local dev chạy được với hot-reload: PostgreSQL, Redis, FastAPI, Next.js
- [ ] **GitHub Actions** — CI cơ bản: lint + test khi push lên `dev`
- [ ] **`.env.example`** — đủ tất cả biến, không commit `.env` thật

### Deliverable Sprint 1A

- [ ] `docker-compose up` → toàn bộ service chạy
- [ ] ERD diagram export PDF → `/docs/erd.pdf`
- [ ] OpenAPI spec → `/docs/openapi-v1.yaml`
- [ ] `README.md` — người mới setup xong trong 15 phút

---

## ⏳ Sprint 1B — Auth & User Service (Tuần 3–4)

**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Authentication hoàn chỉnh, production-ready.

### Checklist Sprint 1B

- [ ] `POST /api/v1/auth/register`
- [ ] `POST /api/v1/auth/login` — access_token (15 phút) + refresh_token (30 ngày) HTTP-only cookie
- [ ] `POST /api/v1/auth/refresh`
- [ ] `POST /api/v1/auth/logout`
- [ ] `GET /api/v1/auth/google` — OAuth2 redirect
- [ ] `GET /api/v1/auth/google/callback`
- [ ] `GET /api/v1/users/me`
- [ ] `PATCH /api/v1/users/me`
- [ ] `POST /api/v1/users/me/avatar` — upload → R2
- [ ] Rate limiting: `slowapi` — 10 req/phút auth, 100 req/phút rest
- [ ] bcrypt cost factor 12
- [ ] Unit test coverage ≥ 80% auth module

### Deliverable Sprint 1B

- [ ] Postman collection / `.http` file test 9 endpoints
- [ ] `pytest` pass ≥ 80% coverage
- [ ] Google OAuth hoạt động trên localhost

---

## ⏳ Sprint 1C — Content Engine (Tuần 5–6)

**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** CRUD hoàn chỉnh cho content, có seed data để Frontend dùng.

### Checklist Sprint 1C

**Courses & Lessons**
- [ ] `GET /api/v1/courses` — filter skill, level, pagination
- [ ] `GET /api/v1/courses/{id}` — kèm lesson list
- [ ] `POST /api/v1/courses` — role: teacher, admin
- [ ] `PATCH /api/v1/courses/{id}`
- [ ] `DELETE /api/v1/courses/{id}` — soft delete
- [ ] `GET /api/v1/lessons/{id}` — kèm questions
- [ ] `POST /api/v1/lessons`
- [ ] `PATCH /api/v1/lessons/{id}/reorder`

**Questions**
- [ ] `GET /api/v1/questions/{id}`
- [ ] `POST /api/v1/questions` — validate JSONB content theo type
- [ ] `PATCH /api/v1/questions/{id}`
- [ ] `DELETE /api/v1/questions/{id}`

**Progress**
- [ ] `POST /api/v1/progress/submit` — MCQ/Matching/Fill tính điểm ngay; Writing/Speaking → 202 + job_id
- [ ] `GET /api/v1/progress/me`
- [ ] `GET /api/v1/progress/me/lessons/{lesson_id}`

**Vocabulary**
- [ ] `GET /api/v1/vocabulary` — search, filter band_level, category
- [ ] `POST /api/v1/vocabulary/bulk` — import CSV

**File Upload**
- [ ] `POST /api/v1/uploads/audio` — ≤ 50MB → R2
- [ ] `POST /api/v1/uploads/image` — ≤ 5MB, resize 800px → R2

**Seed Data**
- [ ] `seed.py` tạo: 5 courses, 20 lessons, 100 questions, 500 vocabulary
- [ ] 1 full Reading mock test

### Deliverable Sprint 1C

- [ ] Swagger UI live tại `/api/v1/docs`
- [ ] `python seed.py` chạy tạo đủ data
- [ ] Integration test luồng submit MCQ → nhận điểm

---

## ⏳ Sprint 1D — Frontend MVP (Tuần 7–8)

**Trạng thái:** Chưa bắt đầu

### Checklist Sprint 1D

**Onboarding**
- [ ] `/register` — form + Google OAuth
- [ ] `/login`
- [ ] Onboarding wizard 3 bước
- [ ] Redirect middleware sau login

**Dashboard**
- [ ] Band score + target card
- [ ] Streak counter (UI-only)
- [ ] Danh sách khóa học + recommended lesson
- [ ] Recent activity (5 bài gần nhất)

**Học bài**
- [ ] `/courses` — grid listing với filter skill
- [ ] `/courses/{id}` — lesson list + progress indicator
- [ ] `/lessons/{id}` — text + audio player (custom HTML5)
- [ ] Exercise renderer: MCQ, Matching (drag & drop), Fill-in-blank
- [ ] Submit → kết quả (correct/incorrect + explanation)

**Technical**
- [ ] Axios interceptor auto refresh token 401
- [ ] React Query data fetching + cache
- [ ] Responsive ≥ 375px
- [ ] Loading skeleton

### Không build trong sprint này (Out of Scope)

- ❌ AI chatbot
- ❌ Writing/Speaking submission
- ❌ Leaderboard
- ❌ Dark mode
- ❌ Mobile app

### Deliverable Sprint 1D

- [ ] Demo luồng: Register → Onboarding → Dashboard → Lesson → MCQ → Kết quả
- [ ] Lighthouse Performance score ≥ 70 desktop

---

## 📅 Phase 2 — AI Integration (Tuần 9–16)

| Sprint | Tuần | Mục tiêu |
|---|---|---|
| 2A | 9–10 | Content Automation Pipeline |
| 2B | 11–12 | RAG & AI Tutor |
| 2C | 13–14 | AI Scoring Writing (Local LLM) |
| 2D | 15–16 | Integration & Testing (**KHÔNG ĐƯỢC SKIP**) |

---

## 📅 Phase 3 — Scale & Security (Tuần 17–24)

| Sprint | Tuần | Mục tiêu |
|---|---|---|
| 3A | 17–18 | Caching & Performance |
| 3B | 19–20 | Async Worker System |
| 3C | 21–22 | Observability & Infrastructure |
| 3D | 23–24 | Security Hardening (**KHÔNG ĐƯỢC SKIP**) |

---

## 📅 Phase 4 — Launch (Tuần 25–32+)

| Sprint | Tuần | Mục tiêu |
|---|---|---|
| 4A | 25–26 | Gamification System |
| 4B | 27–28 | Community & Payment |
| 4C | 29–30 | Beta Launch |
| 4D | 31+ | Iterate & Public Launch |

---

## 🎯 Definition of Done (Nhắc lại)

Task được coi là **Done** khi:

1. ✅ Code được review ít nhất 1 người
2. ✅ Unit test viết, pass, không break test cũ
3. ✅ Không có `console.log` hoặc debug code
4. ✅ API endpoint có trong Swagger docs
5. ✅ Không có hardcoded secret
6. ✅ Chạy được trên staging
7. ✅ Happy path E2E test pass
