# Kích hoạt đồng bộ Firebase

Demo mặc định dùng tài khoản cục bộ mã hóa và không yêu cầu Firebase. Chỉ làm các bước dưới khi muốn đồng bộ mô hình giữa các máy.

1. Chọn hoặc tạo Firebase project thuộc tài khoản quản trị của bạn, thêm Web app.
2. Authentication → Sign-in method → bật Email/Password. Thêm domain `nckh-longt.github.io` trong Authorized domains. Không cần bật anonymous hoặc Google sign-in cho ứng dụng này.
3. Tạo Firestore database `(default)` ở region phù hợp. Không dùng quy tắc cho phép đọc/ghi công khai.
4. Deploy `firestore.rules` và `firestore.indexes.json` trong repository bằng Firebase CLI đã đăng nhập vào đúng project:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

5. Lấy Web app SDK config từ Firebase Project settings. Cập nhật `public/firebase-config.json`:

```json
{
  "apiKey": "PUBLIC_WEB_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "appId": "PUBLIC_WEB_APP_ID"
}
```

Đây là web client config công khai, không phải service-account JSON. Tuyệt đối không đưa `private_key`, service-account key hoặc mật khẩu tài khoản vào mã nguồn. Quyền dữ liệu phải do Security Rules kiểm soát.

6. Commit/push để GitHub Pages build lại. Ở trang đăng nhập chọn Firebase nếu trước đó đã chọn lưu cục bộ. Email là tên đăng nhập của chế độ Firebase.
7. Kiểm tra bằng hai tài khoản riêng: mỗi tài khoản chỉ nhìn thấy mô hình của mình; chưa đăng nhập không mở editor hoặc đọc Firestore.

## Schema

`users/{uid}/projects/{projectId}`:

- `ownerUid`, `schemaVersion: 1`, `name`, `model` (JSON string, tối đa 700 KB).
- `revision` bắt đầu 1, mỗi update tăng đúng 1; `archived` để lưu trữ/khôi phục.
- `createdAt`, `updatedAt` server timestamps; createdAt bất biến.
- Không lưu mật khẩu trong Firestore. Không cho delete vĩnh viễn qua client.

Quy tắc cho phép đọc/ghi đúng UID đường dẫn, kiểm tra schema và revision. Adapter dùng transaction để chặn ghi đè phiên khác. Quy tắc đã kiểm thử trên emulator; vẫn cần deploy vào project thật trước khi dùng cloud.

## Chuyển dữ liệu

Tài khoản cục bộ và Firebase là hai nơi lưu độc lập. Đăng nhập local → xuất từng mô hình JSON → đăng xuất → chọn Firebase → đăng nhập → Nhập JSON thành mô hình mới. File JSON là bản rõ; tự giữ và chia sẻ theo ý muốn. Không tự động tải các mô hình local lên tài khoản Firebase.

## Lưu ý vận hành

Kiểm tra quota và chính sách Authentication/Firestore của project trước khi mở rộng số người dùng. Không cần bật dịch vụ trả phí để chạy phần frontend trên GitHub Pages. Trạng thái cloud chỉ được coi là sẵn sàng khi cấu hình, provider và rules đã được xác minh trên project thật.
