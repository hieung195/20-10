# Thư nhà — bản gia đình, lưu JSON

Bản gia đình không dùng MySQL. Khi chạy local, dữ liệu được lưu thành JSON trên đĩa. Khi deploy serverless, có thể lưu JSON trong Upstash Redis và gửi ảnh trực tiếp lên Cloudinary.

## Dữ liệu
- `database/greetings.json`: toàn bộ nội dung thư và bản đồ vai vế. Được dùng chung ở frontend và backend.
- `database/feedback.json`: lời nhắn local. Nếu cấu hình Upstash, các mảng dữ liệu JSON được lưu trong Redis thay cho file local.
- `database/admins.json`: tài khoản quản trị local (mật khẩu được băm). Với Upstash, tài khoản cũng được lưu trong Redis.
- `shared/familyGreetings.mjs`: chuẩn hóa tên, nhận diện mẹ, chọn và ghép nội dung từ JSON.

Phản hồi và ảnh được công khai trên từng trang thư; ai mở cùng trang cũng xem được. Đăng nhập qua `/login` (admin / 1 theo cấu hình gia đình hiện tại), sau đó xem tổng quan tại `/admin`. Không có nút quản trị trên trang công khai. Dự án chỉ giữ chức năng gia đình; mã lớp học, Face ID và SQL đã được loại bỏ.

Ghi file theo hàng đợi và thay file nguyên khối để tránh mất phản hồi khi nhiều người gửi trong cùng một tiến trình. Không sửa file dữ liệu bằng tay khi đang nhận phản hồi. Nếu file bị hỏng, máy chủ báo lỗi thay vì ghi đè mất dữ liệu.

## Chạy và deploy
1. Cài thư viện: `npm ci` trong `20-10be` và `20-10fe`.
2. Tạo `20-10be/.env` theo `.env.example`, đặt mật khẩu admin và JWT secret riêng.
3. Development: `npm start` trong `20-10be`, `npm run dev` trong `20-10fe`.
4. Production: build frontend (`npm run build` trong `20-10fe`), đặt `NODE_ENV=production`, chạy backend. Đưa cả `shared`, `database`, `20-10be`, `20-10fe/dist` lên máy chủ.
5. Khi deploy Vercel, thêm `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, cùng `ADMIN_USERNAME`, `ADMIN_PASSWORD` và `JWT_SECRET` trong Environment Variables. Upstash REST URL và token lấy từ mục REST của database. API Secret chỉ đặt ở cấu hình bí mật phía máy chủ; không dùng tiền tố `VITE_`.

Cloudinary nhận ảnh trực tiếp từ trình duyệt bằng chữ ký tạo ở backend. Việc này tránh gửi tệp qua Vercel Function, vốn giới hạn request/response ở 4.5 MB. Giới hạn và quota lưu trữ của Cloudinary/Upstash vẫn áp dụng.

## Kiểm tra
`node --test test/familyGreetings.test.js test/jsonStore.test.js` trong `20-10be`.

## Các chức năng mới
- Khi chạy local không cấu hình Cloudinary, ảnh gửi kèm phản hồi được lưu trong `database/uploads/`. Khi cấu hình Cloudinary, ảnh được tải thẳng lên Cloudinary; đường dẫn và thông tin ảnh vẫn nằm cùng dữ liệu JSON.
- `database/custom-greetings.json`: lời chúc do admin thêm/sửa; từ khóa không phân biệt hoa thường/dấu, khớp theo cụm từ, ưu tiên cụm dài hơn.
- `database/visits.json`: mỗi lượt mở/chuyển trang công khai, mã phiên và vị trí gần đúng. Admin/login không tính. Mã phiên thay đổi khi mở phiên trình duyệt mới, không phải số người tuyệt đối.
- Vị trí lấy theo IP công khai qua ipwho.is; local/private IP hiển thị mạng nội bộ. Lỗi tra cứu hiển thị chưa xác định. Khi ở sau một reverse proxy đáng tin cậy, đặt TRUST_PROXY=true và cấu hình proxy ghi đè X-Forwarded-For. Không lấy GPS.
- Nhạc thử tự phát, khi trình duyệt chặn sẽ thử lại ngay lần tương tác đầu tiên; vẫn có nút tạm dừng.
- Tài khoản admin đồng bộ từ ADMIN_USERNAME/ADMIN_PASSWORD khi backend khởi động; đổi cấu hình rồi restart sẽ thu hồi token cũ. Không có kiểm tra độ mạnh mật khẩu.
