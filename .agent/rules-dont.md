# Rules: KHÔNG Được Làm — IELTS Platform

> Đây là danh sách các hành vi bị CẤM trong dự án. Vi phạm bất kỳ rule nào dưới đây là Blocker — phải sửa ngay lập tức trước khi merge.

---

## 🚫 Security — Blocker tuyệt đối

- **KHÔNG** commit secret, API key, password, connection string lên Git (dù là private repo)
  - Sử dụng `.env.example` với placeholder, dùng Railway Secrets / Doppler cho giá trị thật
  - Pre-commit hook `gitleaks` phải được cài và bật
- **KHÔNG** deploy thẳng lên production — mọi thứ phải qua staging tối thiểu 24 giờ
- **KHÔNG** log PII (email, họ tên, số điện thoại) trong application logs
- **KHÔNG** lưu refresh token dạng plaintext trong DB — phải hash trước
- **KHÔNG** dùng string concatenation để build SQL query — luôn dùng parameterized query
- **KHÔNG** bỏ qua Sprint 3D (Security Hardening) dù có deadline nào — ship security hole = rủi ro toàn bộ user data
- **KHÔNG** skip OWASP ZAP scan trước public launch

---

## 🚫 Architecture — Blocker

- **KHÔNG** viết business logic trong `api/` layer — phải chuyển vào `services/`
- **KHÔNG** gọi trực tiếp DB từ router — phải qua service layer
- **KHÔNG** breaking change trên API version đang có users — tạo `/api/v2/` mới
- **KHÔNG** deprecate endpoint mà không thông báo tối thiểu 4 tuần
- **KHÔNG** dùng Kubernetes cho đến khi > 10,000 DAU và có DevOps dedicated
- **KHÔNG** build feature mới khi còn bug critical chưa fix
- **KHÔNG** skip Sprint 2D (Integration & Testing) dù áp lực deadline thế nào
- **KHÔNG** tight coupling giữa modules — dùng interface/dependency injection

---

## 🚫 Code Quality — Blocker

- **KHÔNG** để file source code vượt quá **400 dòng**
- **KHÔNG** để function/method vượt quá **20 dòng**
- **KHÔNG** để lại `print()`, `console.log()`, debug statement trong code commit
- **KHÔNG** hardcode giá trị config (URL, timeout, TTL) trong code — dùng `core/config.py`
- **KHÔNG** dùng `Any` type annotation trong Python nếu có thể tránh
- **KHÔNG** bỏ qua type annotation — mọi function phải có input type + return type

---

## 🚫 Database — Blocker

- **KHÔNG** alter table trực tiếp bằng SQL thủ công — luôn dùng Alembic migration
- **KHÔNG** xóa column cũ mà không có deprecation plan (data có thể mất)
- **KHÔNG** lưu file binary (audio, image) trong DB — upload lên Cloudflare R2
- **KHÔNG** bỏ index trên foreign key columns
- **KHÔNG** dùng `SELECT *` trong production query — luôn chỉ định column cần thiết

---

## 🚫 AI Integration — Blocker

- **KHÔNG** gửi real-time mouse coordinates hoặc raw event stream lên AI API
- **KHÔNG** dùng AI response trực tiếp mà không validate qua Pydantic schema
- **KHÔNG** để AI job chạy synchronous trong request-response cycle — phải async qua queue
- **KHÔNG** bỏ retry logic cho AI scoring (retry ≤ 3 lần với exponential backoff)
- **KHÔNG** hardcode system prompt trong code — lưu trong `prompts/` folder
- **KHÔNG** dùng API response từ AI mà không kiểm tra `overall` score hợp lệ (phải ≈ avg 4 criteria ± 0.5)
- **KHÔNG** trả về AI response thô cho user nếu parse JSON thất bại — mark job `failed` và alert admin

---

## 🚫 Content & Copyright — Blocker pháp lý

- **KHÔNG** scrape BBC, The Guardian, hoặc bất kỳ site nào không có license rõ ràng cho commercial use
- **KHÔNG** dùng nội dung bản quyền IELTS Cambridge test papers mà không có license
- **KHÔNG** dùng content mà không document license tại `docs/content-sources.md`

---

## 🚫 Frontend — Blocker

- **KHÔNG** lưu access token trong `localStorage` hoặc `sessionStorage` — dùng memory + HTTP-only cookie cho refresh token
- **KHÔNG** hiển thị raw error message từ server cho user — dùng user-friendly message
- **KHÔNG** gọi API trực tiếp từ component — dùng React Query hooks hoặc service module
- **KHÔNG** hardcode API base URL trong component — dùng env variable

---

## 🚫 Payment — Blocker

- **KHÔNG** xử lý payment state chỉ dựa vào frontend — luôn verify qua Stripe webhook phía server
- **KHÔNG** bỏ qua free tier enforcement — phải check `ai_usage_logs` trước mỗi AI call
- **KHÔNG** log thông tin thẻ tín dụng — Stripe handle toàn bộ, không pass qua backend

---

## 🚫 Infrastructure — Warning (fix trong sprint)

- **KHÔNG** dùng `docker run` thủ công trên production — tất cả phải qua Docker Compose hoặc Railway deploy
- **KHÔNG** để `.env` thật vào repo (kể cả trong `.gitignore` — double check)
- **KHÔNG** để staging và production dùng chung database
- **KHÔNG** thiếu backup — PostgreSQL dump phải chạy tự động mỗi 6 giờ lên R2
- **KHÔNG** bỏ qua `GET /health` endpoint — phải có trên mọi service

---

## 🚫 Gamification — Warning

- **KHÔNG** build virtual pet hoặc bất kỳ feature nào ngoài scope roadmap mà không được approve
- **KHÔNG** hardcode badge/achievement logic — phải dùng badge engine linh hoạt
- **KHÔNG** reset weekly leaderboard sai thời điểm — chỉ Thứ Hai 00:00 UTC

---

## 🚫 Tổng Hợp: 8 Quy Tắc Bất Di Bất Dịch (từ Roadmap)

> Những quy tắc này không có exception. Muốn bypass phải thảo luận toàn team.

1. **KHÔNG** commit secret/API key lên Git
2. **KHÔNG** deploy thẳng lên production (thiếu staging 24h)
3. **KHÔNG** skip Sprint 2D — Integration Test Sprint
4. **KHÔNG** skip Sprint 3D — Security Hardening Sprint
5. **KHÔNG** scrape BBC, Guardian, hay site không có license
6. **KHÔNG** dùng Kubernetes khi chưa đủ điều kiện
7. **KHÔNG** build feature mới khi còn critical bug
8. **KHÔNG** tạo endpoint thiếu prefix `/api/v{N}/`, không có exception
