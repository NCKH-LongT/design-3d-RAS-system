# Checklist Liêm RAS Studio

## Bản 1.0

- [x] Kiểm tra repository và tạo README.md, checklist.md trước khi viết ứng dụng.
- [x] Mô hình dữ liệu thiết bị, cổng và đường ống có phiên bản; kiểm tra JSON nhập.
- [x] Mặt bằng 2D kéo thả; lưới theo mét; chỉnh kích thước và mực nước.
- [x] Thêm, nhân bản, xoay, xóa thiết bị; nối cổng và chỉnh điểm gấp tuyến.
- [x] Đổi đường kính trong, loại tuyến, chiều dài bổ sung, K và trạng thái van.
- [x] Hiển thị Three.js từ cùng dữ liệu; có chế độ 3D SVG dự phòng đã kiểm tra.
- [x] Tính thể tích, sinh khối, thức ăn, tải TAN và điện năng.
- [x] Tính giới hạn mật độ, vi sinh, oxy theo đầu vào, có dự phòng và cảnh báo dữ liệu thiếu.
- [x] Chỉ tính vi sinh thuộc vòng nước kín; chặn kết luận khi lưu lượng dưới mục tiêu.
- [x] Ước tính đường bơm đơn và tổn thất tuyến đẩy nối tiếp; ghi rõ phạm vi áp dụng.
- [x] Lưu tự động, nhập/xuất JSON và xuất danh mục thiết bị/tuyến ống CSV.
- [x] Hoàn tác/làm lại, phím tắt và CSS responsive.
- [x] Kiểm thử công thức, dữ liệu nhập và build production tại máy phát triển.
- [x] Kiểm thử trình duyệt: sửa bể, kéo bể, thêm lọc, nối ống, đổi cỡ, đóng van, xem phân tích, undo, JSON/CSV và 3D dự phòng.
- [ ] Xác minh trực quan WebGL 3D trên trình duyệt có GPU (môi trường kiểm thử hiện tắt WebGL).
- [x] Deploy GitHub Pages bằng GitHub Actions; sửa base Vite theo đường dẫn repository.
- [x] Xác minh demo công khai, tải 2D và mô-đun 3D: https://nckh-longt.github.io/design-3d-RAS-system/
- Vercel không triển khai; theo yêu cầu mới, dùng GitHub Pages.

## Các bước mở rộng, chưa nằm trong bản 1.0

- [ ] Co T, co góc, thu cỡ, van và manifold là đối tượng CAD có nhiều cổng riêng.
- [ ] Cao độ từng cổng và từng điểm tuyến thay cho cao độ tâm nước ước tính.
- [ ] Giải lưu lượng mạng chia nhánh và tự chảy, tính mực nước giữa các bể.
- [ ] Đường bơm nhiều điểm, đường hút/NPSH và đường đặc tính máy khí theo áp suất.
- [ ] Phân phối khí, nhu cầu oxy riêng từng bể và nhu cầu đảo giá thể.
- [ ] Hiệu chỉnh hệ số theo nhiệt độ, pH, độ mặn, loài cá và chất lượng thức ăn.
- [ ] Cân bằng CO₂/NO₂/NO₃, khử khí và tăng trưởng cá theo ngày.
- [ ] Mô phỏng mất điện, nước hồi bồn bơm, hút ngược, tắc lọc và oxy dự phòng.
- [ ] So sánh các phương án, tự đề xuất nâng cấp và xuất báo cáo PDF/bản vẽ kích thước.
- [ ] Đăng nhập, đồng bộ, lưu phiên bản và chia sẻ thiết kế.

## Bản 1.1–1.2 — Tài khoản, nhiều mô hình & mô phỏng

- [x] Đăng nhập/đăng ký/đăng xuất trước khi mở editor; không nhúng tài khoản/mật khẩu chung.
- [x] Tài khoản cục bộ IndexedDB; AES-256-GCM + PBKDF2 600.000 vòng, khóa chỉ ở bộ nhớ phiên.
- [x] Tạo/mở/đổi tên/nhân bản/lưu trữ/khôi phục nhiều mô hình theo tài khoản.
- [x] Tự lưu tuần tự, trạng thái, revision và bảo toàn bản nháp khi có xung đột; chờ lưu trước khi chuyển.
- [x] Adapter Firebase Auth/Firestore + luật UID, schema, revision; kiểm thử emulator chặn truy cập chéo.
- [ ] Kích hoạt Firebase trên project thật (chưa kết nối/cấu hình; demo dùng lưu cục bộ).
- [x] Thu gọn thư viện, thuộc tính, tổng quan và từng nhóm; chế độ tập trung viewer.
- [x] Cao độ riêng hai đầu ống, độ dốc, chiều dài 3D, dung tích, áp suất, vận tốc, phản lực tia và công suất thủy lực.
- [x] Kết luận tổng hợp Đạt / Chưa đạt / Chưa đủ dữ liệu, nguyên nhân và hướng khắc phục định lượng.
- [x] Mô phỏng cân bằng lượng nước, một tuyến bơm nối tiếp, dòng đầy ống, đóng van/tắt bơm, cạn và tràn.
- [x] Mô phỏng TAN-N, DO, cặn, hoạt tính vi sinh theo giả định; thay số cá/thức ăn; biểu đồ và phát lại diễn biến.
- [x] 27 unit tests đạt; 3 Firestore emulator tests đạt; kiểm tra build không chứa QA login hoặc admin credential.
- [x] Kiểm thử UI development: nhiều mô hình, chuyển mô hình, thu gọn/focus, kết luận, mô phỏng vận hành/mất điện.
- [x] Deploy và xác minh bản 1.2 trên GitHub Pages: màn hình đăng nhập cục bộ hiển thị, editor không mở khi chưa xác thực. CI kiểm thử ứng dụng và quy tắc Firestore đều thành công.

## Những giới hạn còn lại

- [ ] Giải mạng tự chảy không đầy, khí cuốn, siphon, NPSH và thủy lực co T thực.
- [ ] Nhiều bơm, đường bơm nhiều điểm, phân phối khí riêng và đảo giá thể.
- [ ] Hiệu chỉnh/kiểm chứng hệ số theo dữ liệu đo, loài cá, nhiệt độ, pH và độ mặn.
- [ ] NH₃ độc, NO₂/NO₃, CO₂, tắc lọc, dự phòng oxy và thời gian sống khi sự cố.
- [ ] CAD co T, co góc, van, thu cỡ độc lập; bản vẽ thi công và xuất báo cáo PDF.

- [x] Đổi tên hiển thị thành Liêm RAS Studio, giữ khóa dữ liệu cũ.
- [x] Nâng cấp vật liệu/ánh sáng và animation minh họa 3D; hỗ trợ giảm chuyển động.
- [x] Cột phải gọn, cuộn độc lập và mở/thu gọn toàn bộ nhóm.
- [x] Màn hình nhỏ dùng ngăn thuộc tính bên phải thay vì đẩy xuống dưới.
- [ ] Kiểm tra hình ảnh WebGL trên thiết bị thật (trình duyệt QA chỉ có SVG tương thích).

- [x] Chọn ống và nâng hạ riêng đầu A/B trực tiếp trong 3D WebGL/SVG.
- [x] Cao độ, độ dốc và chiều dài cập nhật ngay; lưu khi thả và hoàn tác một lần kéo.
- [x] Kiểm tra trình duyệt SVG: kéo A từ 0,40 lên 1,32 m, Ctrl+Z trả về 0,40 m; đầu B chỉnh được bằng bàn phím.
- [ ] Kiểm tra tay nắm WebGL trên thiết bị thật (QA không hỗ trợ WebGL).
