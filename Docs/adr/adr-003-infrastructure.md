# ADR-003: Railway/Fly.io thay vì AWS

**Trạng thái:** Accepted  
**Ngày:** 2026-05-11

## Context
Cần chọn cloud infrastructure. AWS là standard nhưng phức tạp. Railway/Fly.io là PaaS đơn giản hơn.

## Decision
Dùng **Railway** (primary) hoặc **Fly.io** (fallback) + Docker Compose. Không dùng Kubernetes.

## Consequences
**Tích cực:**
- Developer experience tốt hơn nhiều (deploy = git push)
- Không cần DevOps dedicated ở giai đoạn đầu
- Cost thấp hơn AWS cho workload < 10,000 DAU
- Docker Compose local = production parity

**Tiêu cực:**
- Ít control hơn AWS (VPC, custom networking)
- Vendor lock-in nhẹ
