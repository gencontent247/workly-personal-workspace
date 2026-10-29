## v1.5 — UniKey input
- Thay thế component VietnameseInput, không viết lớp xử lý song song.
- Không ghi input.value khi ô đang focus.
- Commit khi blur/Enter; tìm kiếm debounce 450ms.
- Chưa kiểm chứng trực tiếp với UniKey trên Windows.

## 1.4.0
- Audit VietnameseInput: replaced previous composition/onChange implementation in place, no duplicate IME handlers.
- Uses native onInput, compositionstart/end and blur synchronization; never overwrite DOM value during composition.
- Applies to task title, search, transaction description and category name.
- Added build-windows.bat and scripts/build-windows.ps1 for Windows installer generation.
- Retains category management and finance functions.

## 1.3.0
- Danh mục tùy chỉnh: thêm, đổi tên, xóa cho Công việc / Thu / Chi.
- Đồng bộ danh mục với dropdown trong form công việc và thu chi.
- Đổi tên danh mục cập nhật các bản ghi đã sử dụng; không cho xóa danh mục đang có dữ liệu.
- Lưu danh mục offline bằng localStorage.
- Giữ các chức năng từ v1.2.

## 1.2.0
- Ẩn hoàn toàn menu File/Edit/View mặc định Electron.
- Tắt spellchecker Chromium trong ứng dụng.
- Thêm VietnameseInput bảo vệ sự kiện compositionstart/compositionend khi nhập Unicode qua IME.
- Áp dụng cho công việc, tìm kiếm và nội dung thu chi.
- Cần xác nhận thực tế trên Windows với Unikey/EVKey.

# Changelog

## 1.1.0 — Dashboard, công việc và thu chi
- Hỗ trợ nhập tiếng Việt qua input chuẩn, không gửi khi IME đang ghép chữ.
- Dashboard: chọn ngày trên lịch, xem danh sách đúng ngày, chọn phân loại và ưu tiên.
- Công việc: thêm, tìm, đánh dấu, đổi trạng thái, xóa; dữ liệu được lưu localStorage.
- Thu chi: hai bảng riêng Chi (trái), Thu (phải), danh mục, ngày, số tiền; báo cáo và biểu đồ tháng.
- Sửa cấu hình Electron CommonJS output.
- Chưa có SQLite, ngân sách giới hạn, tự động chuyển lịch, lịch sử trạng thái, import/export.

## 1.0.0 — Stage 1
- Giao diện Electron + React.
