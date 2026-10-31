# Checklist RAS Studio

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
- [ ] Xác minh URL Vercel production sau deployment.
  - Kết nối hiện chưa được cấp quyền vào team `longtruongs-projects` (Vercel trả 403); cần chủ tài khoản chấp thuận quyền team.

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
