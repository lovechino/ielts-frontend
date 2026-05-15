# ADR-001: FastAPI thay vì NestJS

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

## Context
Cần chọn framework backend cho IELTS Platform. Hai ứng viên chính: FastAPI (Python) và NestJS (Node.js/TypeScript).

## Decision
Dùng **FastAPI (Python 3.12)** cho toàn bộ backend.

## Consequences
**Tích cực:**
- Cùng runtime Python với AI libs (spaCy, Whisper, LangChain) — không cần bridge
- Async I/O native với `async/await`
- Auto-generated Swagger UI từ Pydantic schema
- Type hints + Pydantic validation mạnh cho AI response

**Tiêu cực:**
- Team cần biết Python (không dùng TypeScript xuyên suốt)
- GIL có thể là bottleneck CPU-intensive tasks → giải quyết bằng Celery workers
