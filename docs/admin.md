# Quản trị BrewLite

Mở `http://localhost:5173/login` cho cả khách hàng và quản trị viên. Sau đăng nhập, tài khoản ADMIN được chuyển tới `/admin/ingredients`; tài khoản CUSTOMER trở về trang khách hàng. Đường dẫn cũ `/admin/login` chuyển về `/login`. Trang khách không có liên kết quản trị. Các màn hình `/admin/*` nằm ngoài Layout khách hàng, không có thanh menu, giỏ hàng hay footer của khách. Giao diện theo màu sắc và bố cục `wweb/src/pages/AdminPage.tsx`, sử dụng dữ liệu thật.

## Tài khoản phát triển

```powershell
docker compose up -d
docker compose exec -T api pnpm --filter api exec tsx prisma/seed-admin.ts
docker compose restart api
```

Seed tạo `admin@brewlite.test`, mật khẩu thử `BrewLite@Admin2026!`. Không chạy ở production, không nâng quyền tài khoản khách trùng email và không đặt lại mật khẩu của admin đã có. Không có chức năng đăng ký admin công khai.

## Chức năng

- Nguyên liệu: xem tồn thực tế/đang giữ/khả dụng, giá trị tồn và cảnh báo; thêm nguyên liệu, sửa thông tin, kiểm kê tồn, bật/tắt. Không giảm tồn xuống dưới lượng đang giữ. Không đổi đơn vị của nguyên liệu đã được dùng trong công thức hoặc còn tồn.
- Khách hàng: tìm theo tên/email, xem điểm khả dụng/đang giữ, 100 đơn gần nhất. Danh sách giới hạn 500 khách mới nhất. Không cung cấp sửa điểm hoặc nâng quyền từ giao diện này.
- Sản phẩm: thêm/sửa tên, mô tả, ảnh, danh mục, giá, bật/tắt; chỉnh công thức và giá cộng thêm riêng cho S/M/L. Món mới chưa có công thức sẽ chưa bán được. Chỉ NL011 được điều chỉnh theo mức đường. Đơn đã đặt tiếp tục dùng snapshot cũ.
- Khuyến mãi: thêm/sửa mã, phần trăm hoặc số tiền, đơn tối thiểu, giảm tối đa, ngày hiệu lực và trạng thái. Mã mới áp dụng toàn menu; sửa mã hiện có giữ nguyên phạm vi sản phẩm đã cấu hình.

API `/api/admin/*` kiểm tra JWT và quyền ADMIN hiện tại trong database trên mỗi yêu cầu. Cả hai loại tài khoản dùng `/api/auth/login` và một phiên `brewlite_access_token`. Quyền được lấy từ database, không nhận quyền do người dùng tự gửi. Đăng xuất trong quản trị cũng kết thúc phiên chung. Không có API đăng nhập quản trị riêng. Chỉ ẩn giao diện không thay thế kiểm tra quyền ở backend.

Các form gửi thời điểm cập nhật để phát hiện chỉnh sửa đồng thời. Kho khóa bản ghi và kiểm tra lại tồn đang giữ trong transaction. Đây là chức năng kiểm kê trực tiếp; chưa có phiếu nhập/xuất, lịch sử chỉnh sửa hoặc quản lý lô/hạn dùng.

## Thanh toán hiện tại

Ứng dụng dùng thẻ nội địa VNPay sandbox và QR ZaloPay sandbox. Kết quả được backend xác minh, sau đó quyết toán nguyên liệu và điểm trong transaction. Đã bỏ các API tự xác nhận chuyển khoản và thẻ demo. Xem [kiểm thử thanh toán](TEST_PAYMENT_API.md) và [cấu hình ZaloPay](CHUAN_BI_ZALOPAY.md).

Cấu hình VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`. Return local phải đúng `http://localhost:5173/payments/return`. Sau đổi biến môi trường, tạo lại API bằng `docker compose up -d --no-deps --force-recreate api`.

Hoàn tiền có cấu hình GATEWAY/SIMULATION riêng. SIMULATION không chuyển tiền trở lại ví hay ngân hàng; cần trình bày đúng chế độ đang sử dụng.
