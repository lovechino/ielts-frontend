# Architecture Decision Records (ADR) Index

> Mỗi quyết định kiến trúc quan trọng phải được ghi lại ở đây.  
> Dùng template bên dưới. Đặt tên file: `adr-NNN-title.md` (VD: `adr-001-database-choice.md`)

---

## ADR Index

| ID | Tiêu đề | Trạng thái | Ngày |
|---|---|---|---|
| ADR-001 | FastAPI thay vì NestJS | Accepted | 2026-05-11 |
| ADR-002 | pgvector thay vì Pinecone | Accepted | 2026-05-11 |
| ADR-003 | Railway/Fly.io thay vì AWS | Accepted | 2026-05-11 |
| ADR-004 | Monorepo vs Multi-repo | Pending | — |

---

## Template ADR

```markdown
# ADR-NNN: [Tiêu đề quyết định]

**Trạng thái:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX  
**Ngày:** YYYY-MM-DD  
**Người đề xuất:** [Tên]

## Context (Bối cảnh)

Mô tả vấn đề cần quyết định và tại sao cần ra quyết định này.

## Decision (Quyết định)

Chúng tôi sẽ dùng [X] vì...

## Consequences (Hệ quả)

**Tích cực:**
- ...

**Tiêu cực / Trade-off:**
- ...

## Alternatives Considered (Các lựa chọn đã xem xét)

| Lựa chọn | Lý do không chọn |
|---|---|
| ... | ... |
```

---

## ADR-001: FastAPI thay vì NestJS

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

### Context

Cần chọn framework backend cho IELTS Platform. Hai ứng viên chính: FastAPI (Python) và NestJS (Node.js/TypeScript).

### Decision

Dùng **FastAPI (Python 3.12)** cho toàn bộ backend.

### Consequences

**Tích cực:**
- Cùng runtime Python với AI libs (spaCy, Whisper, LangChain) — không cần bridge
- Async I/O native với `async/await`
- Auto-generated Swagger UI từ Pydantic schema
- Type hints + Pydantic validation mạnh cho AI response

**Tiêu cực:**
- Team cần biết Python (không dùng TypeScript xuyên suốt)
- GIL có thể là bottleneck CPU-intensive tasks → giải quyết bằng Celery workers

---

## ADR-002: pgvector thay vì Pinecone

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

### Context

RAG pipeline cần vector similarity search. Pinecone là managed service chuyên biệt. pgvector là extension PostgreSQL.

### Decision

Dùng **pgvector** (extension PostgreSQL 16) cho vector search.

### Consequences

**Tích cực:**
- Không cần managed service riêng → đơn giản hoá infra, tiết kiệm chi phí ở MVP stage
- Dữ liệu nằm cùng PostgreSQL → ACID transaction, không cần sync
- `ivfflat` index đủ performance cho dataset < 10M vectors ở giai đoạn đầu

**Tiêu cực:**
- Scale kém hơn Pinecone khi dataset > 10M vectors
- Cần monitor index performance khi data tăng

**Migration path:** Nếu vượt 10M vectors → migrate sang Pinecone hoặc Weaviate, schema đã chuẩn bị sẵn `source_type` + `source_id`.

---

## ADR-003: Railway/Fly.io thay vì AWS

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

### Context

Cần chọn cloud infrastructure. AWS là standard nhưng phức tạp. Railway/Fly.io là PaaS đơn giản hơn.

### Decision

Dùng **Railway** (primary) hoặc **Fly.io** (fallback) + Docker Compose. Không dùng Kubernetes.

### Consequences

**Tích cực:**
- Developer experience tốt hơn nhiều (deploy = git push)
- Không cần DevOps dedicated ở giai đoạn đầu
- Cost thấp hơn AWS cho workload < 10,000 DAU
- Docker Compose local = production parity

**Tiêu cực:**
- Ít control hơn AWS (VPC, custom networking)
- Vendor lock-in nhẹ

**Migration path:** Khi > 10,000 DAU và có DevOps → evaluate AWS ECS hoặc GCP Cloud Run. Docker Compose giúp migration dễ hơn.
