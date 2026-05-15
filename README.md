# 📚 IELTS Learning Platform (AI-Powered)

Nền tảng học IELTS thông minh, hỗ trợ 4 kỹ năng (Reading, Writing, Listening, Speaking) với sự hỗ trợ của AI để chấm điểm và hướng dẫn chi tiết.

## 🚀 Công Nghệ Sử Dụng

- **Backend:** Hono (Cloudflare Workers) - Chạy trên Edge runtime cực nhanh.
- **Database:** PostgreSQL (với Drizzle ORM) + pgvector.
- **Storage:** Cloudflare R2.
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS.
- **AI Integration:** Llama 3.1 8B (via Cloudflare AI) cho việc chấm điểm và feedback tự động.

---

## 🛠 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Yêu Cầu Hệ Thống
- [Node.js 20+](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Để chạy Cloudflare Workers)
- [PostgreSQL](https://www.postgresql.org/) (Local hoặc Cloud)

### 2. Cấu Hình Backend (Cloudflare Workers)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend-cloudflare
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   Tạo file `.dev.vars` (cho môi trường local) và điền các thông tin:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/ielts_db
   JWT_SECRET=your_secret_key
   ```
4. Chạy server local:
   ```bash
   npm run dev
   ```

### 3. Cấu Hình Frontend (Next.js)
1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Chạy server local:
   ```bash
   npm run dev
   ```

---

## 📂 Cấu Trúc Thư Mục

```text
ielts-platform/
├── backend-cloudflare/      # Hono API (Cloudflare Workers)
│   ├── src/
│   │   ├── api/             # API Endpoints (v1)
│   │   ├── db/              # Drizzle Schema & Client
│   │   └── services/        # Logic nghiệp vụ (AI, Scoring, etc.)
│   ├── drizzle/             # Database Migrations
│   └── wrangler.jsonc       # Cấu hình Cloudflare
├── frontend/                # Next.js Application
├── docs/                    # Tài liệu thiết kế & Roadmap
└── dev.bat                  # Script khởi động nhanh cả 2 môi trường
```

## 🛡 Tính Năng Nổi Bật
- **AI Writing Scorer:** Chấm điểm bài viết IELTS dựa trên 4 tiêu chí chính thức với feedback tiếng Việt chi tiết.
- **Unified Results Modal:** Giao diện xem kết quả tập trung, hiện đại và trực quan.
- **Resilient AI Parsing:** Cơ chế xử lý lỗi JSON từ AI giúp hệ thống hoạt động ổn định.
- **Retake Test:** Khả năng reset và làm lại bài thi linh hoạt.

---
*Phát triển bởi Đội ngũ IELTS AI Team*
