# Hướng dẫn Deploy Demo lên Render (Free Tier)

Đây là tài liệu hướng dẫn nhanh để deploy Backend (FastAPI) và Database (PostgreSQL) lên nền tảng Render bằng Blueprint file.

## 📋 Yêu cầu chuẩn bị
- Tài khoản GitHub
- Code đã được push lên một repository trên GitHub.
- File `render.yaml` đã được cấu hình sẵn trong dự án (nằm ở thư mục gốc).
- **Lưu ý quan trọng**: Đảm bảo file `.env` **KHÔNG** được push lên GitHub (kiểm tra file `.gitignore`).

---

## 🚀 Các bước Deploy

### Bước 1: Khởi tạo trên Render
1. Truy cập **[render.com](https://render.com)** và đăng nhập bằng tài khoản GitHub.
2. Trên Dashboard, click nút **"New"** ở góc phải trên cùng.
3. Chọn mục **"Blueprint"** từ menu xổ xuống.
4. Tìm và chọn **repository GitHub** chứa dự án của bạn.

### Bước 2: Quá trình tự động cài đặt
1. Render sẽ tự động đọc file `render.yaml` có trong repo.
2. Click **"Apply"** để xác nhận.
3. Render sẽ tự động thực hiện các bước:
   - Khởi tạo **PostgreSQL database**.
   - Chạy **Pre-deploy command**: `alembic upgrade head` để tự động tạo cấu trúc bảng.
   - Khởi chạy **Web service** cho Backend.

---

## 📥 Cách nạp dữ liệu từ máy Local lên Render

Vì database trên Render khi mới khởi tạo sẽ trống, bạn cần đẩy dữ liệu từ vựng từ máy mình lên:

1. Lấy **External Connection String**:
   - Vào Dashboard Render -> Chọn database `ielts-db`.
   - Trong tab **Info**, tìm mục **External Connection String** (có dạng `postgresql://user:pass@host/db`). Coppy nó.

2. Chạy script nạp dữ liệu từ máy bạn (PowerShell):
   ```powershell
   # Thay chuỗi kết nối của bạn vào đây
   $env:DATABASE_URL="postgresql://user:password@host:port/dbname"; python app/scripts/scrape_vocab_by_cefr.py --level A1
   ```
   *Lưu ý: Nếu dùng macOS/Linux thì dùng lệnh `export DATABASE_URL="..."`.*

---

## 🛠 Troubleshooting (Xử lý lỗi)

Nếu gặp lỗi **500 Internal Server Error** sau khi deploy:
1. Kiểm tra tab **Events**: Xem phần `Pre-deploy` có báo thành công không.
2. Kiểm tra tab **Logs**: Xem log chi tiết của Backend để biết chính xác lỗi ở đâu.
3. Đảm bảo cấu hình `async_database_url` trong `app/core/config.py` đã hỗ trợ cả prefix `postgres://` và `postgresql://`.

---

## ⚠️ Lưu ý về gói Free Tier của Render

Vì đây là gói miễn phí, có một số giới hạn bạn cần lưu ý:

1. **Sleep mode**: Web service sẽ tự động "ngủ" nếu không có truy cập nào trong vòng **15 phút**. Khi có người truy cập lại, sẽ mất khoảng 30-60 giây để server khởi động (cold start).
   - *Mẹo*: Bạn có thể dùng các dịch vụ như [UptimeRobot](https://uptimerobot.com) để tự động gọi vào đường dẫn `/health` mỗi 10 phút, giúp server luôn thức.
2. **Database hết hạn**: PostgreSQL trên gói free sẽ tự động bị xóa sau **90 ngày**. Chỉ nên dùng cho mục đích demo, không lưu trữ dữ liệu thực tế quan trọng.
3. **Không có Redis**: Gói free không cung cấp Redis. Nếu các tính năng sau này cần Redis (như celery, caching), bạn có thể cân nhắc tích hợp Redis miễn phí từ Upstash.
