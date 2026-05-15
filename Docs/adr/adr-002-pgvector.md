# ADR-002: pgvector thay vì Pinecone

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

## Context
RAG pipeline cần vector similarity search. Pinecone là managed service chuyên biệt. pgvector là extension PostgreSQL.

## Decision
Dùng **pgvector** (extension PostgreSQL 16) cho vector search.

## Consequences
**Tích cực:**
- Không cần managed service riêng → đơn giản hoá infra, tiết kiệm chi phí ở MVP stage
- Dữ liệu nằm cùng PostgreSQL → ACID transaction, không cần sync
- `ivfflat` index đủ performance cho dataset < 10M vectors ở giai đoạn đầu

**Tiêu cực:**
- Scale kém hơn Pinecone khi dataset > 10M vectors
- Cần monitor index performance khi data tăng
