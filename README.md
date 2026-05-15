# 🎨 IELTS Learning Platform - Frontend (Next.js)

Giao diện người dùng hiện đại, tương tác cao cho nền tảng học IELTS, được tối ưu hóa cho trải nghiệm học tập và ôn luyện 4 kỹ năng.

## 🛠 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/).
- **State Management:** React Hooks & Context API.
- **Icons:** [Lucide React](https://lucide.dev/).
- **Animation:** CSS Transitions & Framer Motion (nếu có).
- **Data Fetching:** Axios.

## ✨ Tính Năng Nổi Bật

- **Interactive Lessons:** Hỗ trợ đầy đủ Reading, Writing với giao diện làm bài chuyên nghiệp.
- **AI Feedback System:** Tích hợp Modal xem điểm và nhận xét chi tiết từ AI.
- **Vocabulary Manager:** Hệ thống học từ vựng thông minh (Flashcards, Quiz).
- **Admin Dashboard:** Quản lý khóa học, bài học và câu hỏi trực quan.

## 📂 Cấu Trúc Thư Mục

- `src/app/`: Cấu trúc routing và các trang chính (Dashboard, Lessons, Admin).
- `src/components/`: Các UI components dùng chung và các component đặc thù cho bài học (Lesson, WritingSection, etc.).
- `src/lib/`: Cấu trúc API client và các hàm tiện ích.
- `public/`: Chứa các tài nguyên tĩnh (Images, Fonts).

## 🚀 Hướng Dẫn Chạy Local

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env.local` và điền URL của API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8787/api/v1
   ```

3. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```

## 🏗 Build & Deploy

- Build cho production: `npm run build`
- Deploy: Phù hợp nhất khi triển khai trên **Vercel** hoặc **Cloudflare Pages**.

---
*Phát triển bởi IELTS AI Team*
