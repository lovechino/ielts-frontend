# Workflow — AI Agent IELTS Platform

> Đây là quy trình làm việc chuẩn mà AI agent phải tuân thủ mỗi khi nhận task trong dự án này.

---

## Bước 1: Đọc Context Trước Khi Code

Trước khi viết BẤT KỲ dòng code nào, agent phải:

1. **Đọc `GEMINI.md`** — nắm current sprint, tech stack, conventions
2. **Đọc `.agent/sprint-checklist.md`** — biết task nào đang pending
3. **Xác định phase hiện tại** trong `Docs/ielts_platform_roadmap.md`
4. **Kiểm tra `docs/adr/`** — xem quyết định kiến trúc nào đã được chốt

---

## Bước 2: Phân Tích Task

Với mỗi task, xác định rõ:

```
Task Type   : [ ] Feature  [ ] Bug Fix  [ ] Refactor  [ ] Doc  [ ] Test
Layer       : [ ] API  [ ] Service  [ ] Model  [ ] Schema  [ ] Frontend  [ ] Worker
Sprint      : Sprint ___
Checklist   : Link đến item trong roadmap
Dependencies: Liệt kê service/module cần sẵn sàng trước
```

---

## Bước 3: Thiết Kế Trước Khi Code

Với feature mới:
- Vẽ sơ bộ data flow (text diagram)
- Liệt kê Pydantic schema (request/response)
- Xác định endpoint URL và HTTP method
- Kiểm tra xem có cần tạo migration (Alembic) không

---

## Bước 4: Implement Theo Layer

```
Order: Schema → Model → Service → API → Test → Doc
```

1. **`schemas/`** — Pydantic models (request + response)
2. **`models/`** — SQLAlchemy ORM (nếu cần bảng mới)
3. **`services/`** — Business logic thuần Python
4. **`api/v1/`** — FastAPI router, chỉ gọi service, không logic
5. **`tests/`** — pytest unit + integration
6. **Swagger** — Verify endpoint hiện ra đúng tại `/api/v1/docs`

---

## Bước 5: Kiểm Tra Trước Khi Done

Checklist bắt buộc trước khi mark task là Done:

- [ ] `pytest` chạy pass, coverage ≥ 80% cho module mới
- [ ] Endpoint có trong Swagger UI
- [ ] Không có hardcoded secret hoặc API key
- [ ] Không có `print()` / `console.log()` debug còn sót
- [ ] Response format đúng chuẩn `{ success, data, meta }`
- [ ] File không vượt 400 dòng
- [ ] Alembic migration được tạo (nếu đổi schema)
- [ ] Chạy được trên `docker-compose up`

---

## Bước 6: Async Jobs — Pattern Bắt Buộc

Với tất cả AI tasks (scoring, transcription, embedding):

```python
# 1. API endpoint — chỉ enqueue, trả về job_id ngay
@router.post("/scoring/writing")
async def submit_writing(body: WritingSubmitRequest) -> dict:
    job = score_writing_task.delay(body.question_id, body.essay_text)
    return {"success": True, "data": {"job_id": job.id}}

# 2. Worker — xử lý async
@celery.task(bind=True, max_retries=3)
def score_writing_task(self, question_id: str, essay_text: str):
    ...

# 3. Polling endpoint — user check status
@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str) -> dict:
    ...
```

---

## Bước 7: Cập Nhật Sau Khi Done

Sau khi hoàn thành task:

1. Cập nhật `sprint-checklist.md` — đánh dấu `[x]` item đã xong
2. Cập nhật `docs/api-changelog.md` — nếu có thay đổi API
3. Tạo ADR trong `docs/adr/` — nếu có quyết định kiến trúc mới
4. Cập nhật `GEMINI.md` section 6 — nếu đổi sprint

---

## Luồng Data Chính

```
User Request
    ↓
Next.js Frontend (App Router)
    ↓ axios (với JWT interceptor)
FastAPI API Layer (/api/v1/)
    ↓ validate Pydantic schema
Service Layer (business logic)
    ↓ SQLAlchemy ORM
PostgreSQL 16 + pgvector
    ↓ cache hit?
Redis 7 (TTL-based caching)

--- Async Path ---
Service Layer → Celery Queue (Redis broker)
    ↓ worker picks up
Celery Worker
    ├── Local LLM (Ollama/vLLM for scoring/generation)
    ├── Local Embedding API
    └── Future: Whisper API (STT)
    ↓ result saved to DB
WebSocket / Email Notification → User
```
