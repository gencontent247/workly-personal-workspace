# Personal Workspace v1.5 — Windows offline

## Chạy local

- Cài Node.js LTS, mở PowerShell trong thư mục này.
- `npm install` rồi `npm run dev`, hoặc `start.bat`. Nếu báo lỗi thì chạy lại quyền Admin.

## Build bộ cài Windows

- Nhấp đúp `build-windows.bat` (hoặc chạy `scripts/build-windows.ps1`).
- File Setup.exe xuất hiện trong `release/` khi build thành công. Source này không kèm bộ cài dựng sẵn.
- Installer không tự mở app sau khi cài. Hãy mở từ shortcut Desktop/Start Menu để app chạy theo quyền thông thường như UniKey.

## Nhập tiếng Việt

- Nếu UniKey vẫn không hoạt động trong bản Electron mới, kiểm tra ứng dụng và UniKey có chạy cùng mức quyền Windows.
- UniKey chạy quyền thông thường không gõ dấu vào ứng dụng đang chạy quyền Administrator. Khi gặp trường hợp này, đóng hẳn ứng dụng rồi mở lại từ shortcut; không chọn “Run as administrator”.
- Hãy thử ở cả bản local và bản windows app.

## Ngôn ngữ và mật khẩu

- Nút `VI`/`EN` ở góc trên bên phải chuyển giữa tiếng Việt và tiếng Anh; lựa chọn được lưu trên máy.
- Cài đặt cho phép đặt, đổi và gỡ mật khẩu. Sau khi đặt, ứng dụng yêu cầu mật khẩu khi mở lại.
- Công việc, thu chi và danh mục vẫn lưu trong localStorage trên từng thiết bị. Trên Windows, mật khẩu được băm bằng `scrypt` và lưu ở thư mục `userData` của Electron. Đây là khóa giao diện, không mã hóa dữ liệu lưu trên thiết bị.
- Quên mật khẩu: màn hình mở khóa cho phép reset toàn bộ dữ liệu ứng dụng. Trên Windows, thao tác xóa localStorage, mật khẩu và thư mục `Documents/Personal Workspace/data`; trên Android, thao tác xóa dữ liệu localStorage của ứng dụng. Không thể khôi phục nếu không có bản sao lưu.
