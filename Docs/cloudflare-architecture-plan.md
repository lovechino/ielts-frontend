# Kế hoạch Kiến trúc Hệ thống Thi IELTS/TOEIC (Cloudflare Stack Adaptation)

Dựa trên bản thiết kế hệ thống gốc, tài liệu này đã được tinh chỉnh để **áp dụng 100% vào hạ tầng Serverless của Cloudflare** (Workers + D1 + R2) hiện tại của dự án. 

Mục tiêu cốt lõi: Không render file PDF trực tiếp cho học viên (Student). PDF chỉ là file nguồn dành cho Admin bóc tách thành dữ liệu có cấu trúc (Structured Data) để phục vụ việc làm bài tương tác, tự động chấm điểm và tính năng phân tích (Analytics).

---

## 1. Kiến Trúc Tổng Thể

```text
1. PDF Processing Engine -> Cloudflare R2 (Storage)
2. Test Builder Engine   -> Cloudflare D1 (Database) + Hono
3. Test Delivery Engine  -> Next.js App Router (Student UI)
4. Answer & Scoring Engine -> Hono + D1 + Cloudflare Queues
5. Analytics & Admin CMS -> Next.js (Admin UI)
```

---

## 2. Tech Stack Tương Đương (So với bản gốc)

| Thành phần trong Plan gốc | Thay thế bằng Cloudflare Stack | Ưu điểm / Lý do chọn |
| :--- | :--- | :--- |
| **Backend:** NestJS + Express | **Hono (Cloudflare Workers)** | Chạy trên Edge Server toàn cầu, tốc độ phản hồi tính bằng ms, chi phí gần như bằng 0. |
| **Database:** PostgreSQL | **Cloudflare D1 (SQLite)** | Database Serverless cực nhẹ, đọc dữ liệu siêu nhanh, tự động scale không cần maintain máy chủ. |
| **Queue:** BullMQ + Redis | **Cloudflare Queues** | Có sẵn trong hệ sinh thái Cloudflare, chịu tải cao, dùng để xử lý chấm điểm AI ngầm (Background Task). |
| **Storage:** AWS S3 | **Cloudflare R2** | Không tính phí egress băng thông, load file PDF/Images tốc độ cao. |
| **Frontend:** Next.js | **Next.js 15 (App Router)** | Giữ nguyên (Framework mạnh nhất hiện tại). |

---

## 3. Cấu Trúc Dữ Liệu (Structured Data Modeling)

Thay vì lưu file PDF, hệ thống sẽ tổ chức dữ liệu trong D1 Database như sau:

* **Tests (Khóa học / Đề thi)**
  * Chứa nhiều Sections.
* **Sections (Phần thi)**
  * Ví dụ: Reading Passage 1, Listening Part 2.
  * Thông số: time_limit, instructions.
* **Passages (Đoạn văn)**
  * Chứa nội dung dạng HTML/Markdown.
* **Question Groups (Nhóm câu hỏi)**
  * Ví dụ: Câu 1-5 (Matching Heading), Câu 6-10 (TFNG).
* **Questions (Câu hỏi đơn lẻ)**
  * `type`: multiple_choice, tfng, matching...
  * `options`: JSON data.
  * `correct_answer`: Đáp án để máy chấm.
  * `explanation`: Giải thích.

---

## 4. Lộ Trình Phát Triển (Roadmap)

### Phase 1 — MVP (Nền tảng Tương tác Cơ bản)
Tập trung vào Tool bóc tách PDF và trải nghiệm làm bài cốt lõi.

**Admin App:**
* Upload file PDF (lên R2).
* Giao diện Manual Split Tool: 
  * Cột trái: PDF Viewer toàn màn hình.
  * Cột phải: Form nhập liệu tạo Passage, tạo Question Group (copy/paste từ PDF).

**Student App:**
* Xóa bỏ hoàn toàn PDF Viewer.
* Render bài làm dạng tương tác: 
  * Trái: Đoạn văn (Scrollable).
  * Phải: Danh sách câu hỏi.
* Chấm điểm tự động (Objective Questions: Multiple Choice, TFNG).

### Phase 2 — Trải Nghiệm Nâng Cao (Test Delivery Engine)
* Autosave (Lưu bài 5s/lần qua API).
* Hệ thống Timer (Đếm ngược 10/20/60 phút).
* Dashboard kết quả thi.

### Phase 3 — Tự Động Hóa (AI & OCR)
* Tích hợp **Cloudflare AI** (Llama Vision) để quét tự động OCR đoạn văn từ file PDF, giảm thiểu việc Admin phải gõ tay/copy-paste.
* Tự động sinh giải thích câu hỏi (AI Explanation).

### Phase 4 — Chấm Điểm Chủ Quan (Writing/Speaking)
* Tích hợp hệ thống ghi âm.
* Tích hợp AI Scoring chấm điểm Writing task 1, 2 và Speaking theo rubric của Cambridge.

---

## 5. Các Loại Câu Hỏi Hỗ Trợ (Question Types)

Dữ liệu JSON cho mỗi type cần được định hình rõ ràng ở Backend để Frontend có thể sử dụng Dynamic Renderer.

1. `multiple_choice` (Trắc nghiệm 4 đáp án)
2. `true_false_not_given` (TFNG)
3. `yes_no_not_given` (YNNG)
4. `matching_heading` (Ghép tiêu đề)
5. `matching_information` (Ghép thông tin)
6. `sentence_completion` (Điền từ vào câu)
7. `summary_completion` (Điền từ tóm tắt)

---

## 6. Sơ Đồ Thiết Kế Giao Diện Student (UI Layout)

Trang làm bài của Student (Desktop) sẽ luôn duy trì tỷ lệ:

```text
---------------------------------------------------
| Đoạn văn (Passage)      | Câu hỏi (Questions)   |
| (Khoảng 50-60% width)   | (Khoảng 40-50% width) |
|                         |                       |
| Cuộn chuột độc lập      | Trả lời trực tiếp     |
| Có nút Highlight text   | Chọn đáp án (A,B,C,D) |
|                         |                       |
---------------------------------------------------
| Footer: Timer, Navigation, Nút Nộp Bài          |
---------------------------------------------------
```
