# Rules: ĐƯỢC Làm — IELTS Platform

> Danh sách hành vi và pattern được khuyến khích / bắt buộc trong dự án này.

---

## ✅ Architecture

- **ĐƯỢC** tách biệt hoàn toàn: `api/` chỉ receive/validate/return, `services/` chứa toàn bộ business logic
- **ĐƯỢC** dùng Dependency Injection của FastAPI (`Depends()`) cho auth, db session, permissions
- **ĐƯỢC** dùng `APIRouter` với `prefix` và `tags` để nhóm endpoint rõ ràng
- **ĐƯỢC** tạo version mới (`v2/`) khi có breaking change (đổi schema, remove field, đổi auth)
- **ĐƯỢC** dùng `pgvector` cho similarity search thay vì Pinecone — đã được chốt trong ADR
- **ĐƯỢC** dùng Railway/Fly.io + Docker Compose — không K8s cho đến khi > 10,000 DAU

---

## ✅ Code Quality

- **ĐƯỢC** viết file tối đa **400 dòng** — nếu vượt phải tách module
- **ĐƯỢC** viết function tối đa **20 dòng** — nếu dài hơn phải extract helper
- **ĐƯỢC** viết type annotation đầy đủ cho mọi function Python (input + return type)
- **ĐƯỢC** dùng Pydantic v2 cho tất cả schema validation
- **ĐƯỢC** dùng `async/await` cho tất cả I/O operations (DB, HTTP, file)
- **ĐƯỢC** raise `HTTPException` với status code và error code chuẩn từ danh sách trong roadmap

---

## ✅ Database

- **ĐƯỢC** dùng Alembic cho tất cả database migration — không bao giờ alter table thủ công
- **ĐƯỢC** dùng `UUID` làm primary key (gen_random_uuid())
- **ĐƯỢC** dùng `TIMESTAMPTZ` cho tất cả timestamp column
- **ĐƯỢC** dùng `JSONB` cho flexible/structured data (question content, feedback)
- **ĐƯỢC** thêm index trên foreign key và các column hay filter/sort
- **ĐƯỢC** dùng `ON DELETE CASCADE` cho child records

---

## ✅ Security

- **ĐƯỢC** hash password với `bcrypt`, cost factor 12
- **ĐƯỢC** lưu refresh token dạng hash trong DB, không lưu plaintext
- **ĐƯỢC** dùng HTTP-only cookie cho `refresh_token`
- **ĐƯỢC** dùng JWT với `jti` (unique token ID) để có thể blacklist khi cần
- **ĐƯỢC** dùng `slowapi` cho rate limiting: 10 req/phút cho auth, 100 req/phút cho các endpoint khác
- **ĐƯỢC** validate tất cả user input qua Pydantic trước khi xử lý
- **ĐƯỢC** dùng SQLAlchemy parameterized queries — không bao giờ string concatenation SQL
- **ĐƯỢC** log audit trail cho tất cả thao tác admin (user_id + action + timestamp)

---

## ✅ AI Integration

- **ĐƯỢC** version control prompt template trong `prompts/` folder (vd: `writing_scorer_v1.txt`)
- **ĐƯỢC** validate AI response bằng Pydantic trước khi lưu DB
- **ĐƯỢC** retry tối đa 3 lần khi AI parse thất bại (với exponential backoff)
- **ĐƯỢC** log tất cả AI usage: user_id, input_tokens, output_tokens, model, timestamp
- **ĐƯỢC** dùng local GPU (Ollama/vLLM) cho inference
- **ĐƯỢC** dùng RAG fallback response khi similarity score < 0.75
- **ĐƯỢC** giới hạn conversation history tối đa 10 turns gửi lên API
- **ĐƯỢC** giới hạn tổng token context ≤ 4000 tokens (context + question + history)

---

## ✅ Async Jobs

- **ĐƯỢC** dùng Celery + Redis cho tất cả AI tasks (scoring, transcription, embedding)
- **ĐƯỢC** enqueue job → trả về `job_id` ngay lập tức (202 Accepted)
- **ĐƯỢC** implement Dead Letter Queue cho jobs thất bại sau tất cả retry
- **ĐƯỢC** alert Slack khi job vào DLQ
- **ĐƯỢC** expose `/api/v1/jobs/{job_id}` endpoint để polling status

---

## ✅ Frontend

- **ĐƯỢC** dùng Axios interceptor để tự động refresh token khi nhận 401
- **ĐƯỢC** dùng React Query cho data fetching và cache management
- **ĐƯỢC** dùng Loading Skeleton thay vì spinner trắng
- **ĐƯỢC** responsive từ 375px trở lên
- **ĐƯỢC** dùng Server-Sent Events (SSE) cho AI tutor chat stream
- **ĐƯỢC** polling mỗi 3 giây cho AI job status (đến khi `completed` hoặc `failed`)

---

## ✅ Content & Media

- **ĐƯỢC** dùng NewsAPI.org hoặc Common Crawl với license rõ ràng
- **ĐƯỢC** document license nguồn tại `docs/content-sources.md`
- **ĐƯỢC** deduplication bằng SHA-256 hash trước khi insert content mới
- **ĐƯỢC** filter bài 300–900 từ, Flesch readability 30–60
- **ĐƯỢC** resize image ≤ 800px trước khi upload R2
- **ĐƯỢC** giới hạn audio upload ≤ 25MB (Speaking), image ≤ 5MB

---

## ✅ Testing

- **ĐƯỢC** coverage ≥ 80% cho mọi module mới
- **ĐƯỢC** viết integration test cho luồng submit MCQ → nhận điểm
- **ĐƯỢC** E2E test Playwright cho happy path mỗi sprint
- **ĐƯỢC** load test p95 < 2s với 50 concurrent users trước Phase 3
- **ĐƯỢC** test AI scoring consistency: cùng bài, 3 lần chạy, score không chênh > 0.5

---

## ✅ Observability

- **ĐƯỢC** structured logging JSON với fields: timestamp, level, service, request_id, user_id, duration_ms, message
- **ĐƯỢC** expose Prometheus metrics endpoint
- **ĐƯỢC** tạo Grafana dashboard cho: System Overview, AI Performance, Business Metrics
- **ĐƯỢC** alert Slack khi error rate > 1% trong 5 phút
- **ĐƯỢC** `GET /health` trả về: `{ status, db, redis, version, uptime }`

---

## ✅ Documentation

- **ĐƯỢC** tạo ADR trong `docs/adr/` cho mọi quyết định kiến trúc quan trọng
- **ĐƯỢC** update `docs/api-changelog.md` mỗi khi thay đổi API
- **ĐƯỢC** commit Postman collection vào repo
- **ĐƯỢC** maintain Swagger UI live tại `/api/v1/docs`
