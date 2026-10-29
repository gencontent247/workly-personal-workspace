# Personal Workspace v1.5 — Windows offline

## Chạy local

- Cài Node.js LTS, mở PowerShell trong thư mục này.
- `npm install` rồi `npm run dev`, hoặc `start.bat`.

## Build bộ cài Windows

- Nhấp đúp `build-windows.bat` (hoặc chạy `scripts/build-windows.ps1`).
- File Setup.exe xuất hiện trong `release/` khi build thành công. Source này không kèm bộ cài dựng sẵn.
- Installer không tự mở app sau khi cài. Hãy mở từ shortcut Desktop/Start Menu để app chạy theo quyền thông thường như UniKey.

## Build ứng dụng Android

- Cài Android Studio (Android SDK API 36 và build tools), JDK 17 trở lên, rồi đặt `ANDROID_HOME` và `JAVA_HOME`.
- Nhấp đúp `build-android.bat` để tạo APK debug. File kết quả nằm tại `release/android/PersonalWorkspace-debug.apk`; có thể cài thử trực tiếp trên điện thoại. Bản phát hành trên Play Store cần ký riêng trong Android Studio.
- Dự án Android nằm trong `android/`. Script tự build web, đồng bộ Capacitor và chạy Gradle. Source web của Android và Windows dùng chung nhưng dữ liệu lưu riêng trên từng thiết bị.

## Nhập tiếng Việt

- Các ô chữ dùng `NativeInput` trong `src/app/NativeInput.tsx`. Electron/Chromium xử lý trực tiếp phím của UniKey; ứng dụng chỉ lưu nội dung khi rời ô hoặc gửi form. Ô tìm kiếm cập nhật sau một nhịp ngắn.
- Áp dụng cho công việc, tìm kiếm, thu chi và tên danh mục.
- Nếu UniKey vẫn không hoạt động trong bản Electron mới, kiểm tra ứng dụng và UniKey có chạy cùng mức quyền Windows.
- UniKey chạy quyền thông thường không gõ dấu vào ứng dụng đang chạy quyền Administrator. Khi gặp trường hợp này, đóng hẳn ứng dụng rồi mở lại từ shortcut; không chọn “Run as administrator”.

## Ngôn ngữ và mật khẩu

- Nút `VI`/`EN` ở góc trên bên phải chuyển giữa tiếng Việt và tiếng Anh; lựa chọn được lưu trên máy.
- Cài đặt cho phép đặt, đổi và gỡ mật khẩu. Sau khi đặt, ứng dụng yêu cầu mật khẩu khi mở lại.
- Công việc, thu chi và danh mục vẫn lưu trong localStorage trên từng thiết bị. Trên Windows, mật khẩu được băm bằng `scrypt` và lưu ở thư mục `userData` của Electron. Trên Android, mật khẩu được băm bằng PBKDF2 và lưu trong vùng dữ liệu ứng dụng. Đây là khóa giao diện, không mã hóa dữ liệu lưu trên thiết bị.
- Quên mật khẩu: màn hình mở khóa cho phép reset toàn bộ dữ liệu ứng dụng. Trên Windows, thao tác xóa localStorage, mật khẩu và thư mục `Documents/Personal Workspace/data`; trên Android, thao tác xóa dữ liệu localStorage của ứng dụng. Không thể khôi phục nếu không có bản sao lưu.
- SQLite, backup, ngân sách và chuyển lịch tự động chưa triển khai.
