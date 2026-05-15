# Tool Cắt PDF Thủ Công Có Preview Trước/Sau

## Mục tiêu
Tạo một tool desktop/web giúp:

- Upload file PDF
- Preview toàn bộ trang PDF
- Chọn điểm cắt thủ công
- Cắt thành nhiều file PDF nhỏ
- Preview kết quả sau khi cắt
- Download từng file hoặc download tất cả

Phù hợp cho trường hợp:
- Mỗi chương có số trang khác nhau
- Không thể auto split theo số trang cố định
- Cần đối chiếu trực quan trước khi export

---

# Công nghệ đề xuất

## Frontend
- React + Vite
- TailwindCSS
- pdf.js → render preview PDF
- pdf-lib → cắt và tạo file PDF mới

## Nếu muốn app desktop
Dùng:
- Electron + React

=> Có thể chạy như app Windows độc lập.

---

# Flow hoạt động

## 1. Upload PDF
Người dùng upload file PDF.

## 2. Render preview
Render thumbnail tất cả các trang.

Ví dụ:

[1] [2] [3] [4] [5] [6] ...

## 3. Chọn điểm cắt
Ví dụ:

- File 1: trang 1 → 12
- File 2: trang 13 → 25
- File 3: trang 26 → 40

UI dạng:

| Tên file | Từ trang | Đến trang |
|---|---|---|
| chapter-1 | 1 | 12 |
| chapter-2 | 13 | 25 |

Có thể:
- Add block
- Remove block
- Validate overlap

---

# Preview Sau Khi Cắt

Mỗi block sẽ có preview:

## chapter-1.pdf
Preview:
- trang đầu
- tổng số trang

## chapter-2.pdf
Preview:
- trang đầu
- tổng số trang

=> giúp đối chiếu trước khi export.

---

# Chức năng quan trọng

## 1. Zoom preview
- zoom in/out
- fit width

## 2. Drag scroll
PDF dài cần scroll mượt.

## 3. Highlight vùng đang chọn
Ví dụ:
- block 1 tô xanh
- block 2 tô vàng

=> rất dễ kiểm tra.

---

# Thư viện chính

## pdf.js
Render PDF:

```bash
npm install pdfjs-dist
```

## pdf-lib
Cắt và export PDF:

```bash
npm install pdf-lib
```

---

# Logic Cắt PDF

Ví dụ:

```ts
const pdfDoc = await PDFDocument.load(arrayBuffer)

const newPdf = await PDFDocument.create()

const pages = await newPdf.copyPages(
  pdfDoc,
  [0,1,2,3]
)

pages.forEach((page) => {
  newPdf.addPage(page)
})

const bytes = await newPdf.save()
```

---

# UI Gợi Ý

## Bên trái
Preview toàn bộ PDF.

## Bên phải
Danh sách block cắt.

```text
------------------------------------------------
| Preview PDF | Split Config                  |
|              |------------------------------|
| Trang 1      | chapter-1  [1 - 12]          |
| Trang 2      | chapter-2  [13 - 25]         |
| Trang 3      | [+ Add Block]                |
------------------------------------------------
```

---

# Chức năng nâng cao nên có

## Auto detect chapter (optional)
Có thể đọc:
- bookmark PDF
- mục lục

để suggest điểm cắt.

---

# Export

## Download từng file
Ví dụ:
- chapter-1.pdf
- chapter-2.pdf

## Download ZIP
Dùng:

```bash
npm install jszip file-saver
```

---

# Kiến trúc thư mục React

```text
src/
 ├── components/
 │    ├── PdfPreview.tsx
 │    ├── SplitEditor.tsx
 │    ├── SplitPreview.tsx
 │    └── Toolbar.tsx
 │
 ├── utils/
 │    ├── pdfSplitter.ts
 │    └── pdfRenderer.ts
 │
 ├── pages/
 │    └── Home.tsx
 │
 └── App.tsx
```

---

# Khuyến nghị tốt nhất

Nếu bạn muốn dùng lâu dài trên Windows:

## Nên làm:

Electron + React

Vì:
- chạy offline
- kéo thả file nhanh
- thao tác file lớn tốt hơn browser
- dễ build exe

---

# Tính năng nên ưu tiên làm trước

## MVP

- Upload PDF
- Render preview
- Chọn range thủ công
- Export PDF
- Preview sau cắt

## Version 2

- drag chọn trang
- bookmark detect
- export zip
- rename hàng loạt
- dark mode

---

# Stack đề xuất hoàn chỉnh

## Frontend
- React
- TypeScript
- Tailwind
- pdf.js
- pdf-lib

## Desktop
- Electron

## UI
- shadcn/ui

---

# Kết luận

Đây là hướng tối ưu nhất cho nhu cầu:

- Cắt PDF thủ công
- Mỗi phần số trang khác nhau
- Có preview trước và sau khi cắt
- Dễ đối chiếu
- Có thể nâng cấp thành tool chuyên nghiệp sau này

Nếu muốn, bước tiếp theo tôi có thể giúp bạn:

1. Tạo full source React + Tailwind
2. Tạo Electron app chạy Windows
3. Làm drag-and-drop chọn range
4. Tạo preview thumbnail đẹp như Adobe
5. Build thành file .exe
6. Làm auto detect chapter từ mục lục PDF

