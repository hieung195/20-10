# Thư Nhà

Website gửi lời chúc và lời nhắn cho gia đình. Nội dung thư mặc định được đọc từ JSON; khi chạy trên Vercel, dữ liệu phát sinh lưu ở Upstash Redis và ảnh đính kèm lưu ở Cloudinary.

## Chạy trên máy cá nhân

Cần cài Node.js và npm. Từ thư mục gốc của dự án, chạy:

```bash
npm run setup
```

Lệnh này cài lại thư viện cho backend và frontend từ các lockfile. Nếu chưa có file môi trường, tạo chúng từ mẫu:

```bash
cp 20-10be/.env.example 20-10be/.env
cp 20-10fe/.env.example 20-10fe/.env
```

Trong `20-10be/.env`, đặt `ADMIN_USERNAME`, `ADMIN_PASSWORD` và `JWT_SECRET`. Khi chạy local, có thể để trống hai biến Upstash; dữ liệu sẽ được lưu dạng JSON trong `database/`. Không cần cấu hình Cloudinary để gửi lời nhắn không kèm ảnh. Nếu muốn tải ảnh khi chạy local, điền đủ ba biến Cloudinary.

Mở hai terminal tại thư mục gốc dự án. Chạy backend ở terminal thứ nhất:

```bash
npm start
```

Chạy frontend ở terminal thứ hai:

```bash
npm run dev
```

Mở địa chỉ Vite in ra trong terminal, thường là `http://localhost:5173`. Backend mặc định chạy tại `http://localhost:5001`; frontend local đã được cấu hình để gọi backend này.

## Các trang

- `/` — trang chính, nhập tên người thân để mở thư.
- `/celebrate/<tên>` — thư và lời nhắn công khai gửi đến người đó.
- `/login` — đăng nhập bằng thông tin đã đặt trong biến môi trường backend.
- `/admin` — quản lý phản hồi, ảnh, lượt truy cập, địa chỉ IP và lời chúc tùy chỉnh.

## Chạy kiểm tra và build

Các lệnh sau chạy từ thư mục gốc:

```bash
npm test
npm test --prefix 20-10fe
npm run lint --prefix 20-10fe
npm run build
```

`npm test` chạy kiểm thử backend; lệnh test thứ hai chạy kiểm thử frontend. Bản build frontend được tạo trong `20-10fe/dist/` và có thể tạo lại bằng `npm run build`.

## Deploy lên Vercel

Dự án đã có `vercel.json` để cài thư viện, build frontend và chuyển các yêu cầu `/api/*` tới backend serverless. Trong Project Settings → Environment Variables, khai báo:

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `ADMIN_USERNAME` | Có | Tên đăng nhập quản trị |
| `ADMIN_PASSWORD` | Có | Mật khẩu quản trị |
| `JWT_SECRET` | Có | Khóa ký phiên đăng nhập; dùng chuỗi ngẫu nhiên dài |
| `UPSTASH_REDIS_REST_URL` | Có | REST URL của Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Có | REST token của Upstash Redis |
| `CLOUDINARY_CLOUD_NAME` | Cần nếu có tải ảnh | Cloud name của Cloudinary |
| `CLOUDINARY_API_KEY` | Cần nếu có tải ảnh | API key của Cloudinary |
| `CLOUDINARY_API_SECRET` | Cần nếu có tải ảnh | API secret dùng phía máy chủ để ký upload |

Thiết lập các biến cho Production, Preview hoặc cả hai tùy môi trường cần dùng, rồi redeploy. Không thêm tiền tố `VITE_` vào Redis token, Cloudinary API key/secret hoặc thông tin quản trị. Để `VITE_API_BASE_URL` trống hoặc không khai báo trên Vercel để frontend gọi API cùng domain.

Upstash là bắt buộc trên Vercel vì hệ thống tệp của serverless không dùng làm nơi lưu dữ liệu lâu dài. Cloudinary cần thiết nếu muốn tải ảnh lên; không cấu hình Cloudinary thì người dùng vẫn có thể gửi lời nhắn dạng văn bản.

## Dữ liệu và thư mục

- `database/greetings.json` — lời chúc mặc định và quy tắc xưng hô.
- `database/custom-greetings.json` — bộ lời chúc tùy chỉnh ban đầu.
- Khi chạy local, các dữ liệu phát sinh được lưu dạng JSON trong `database/`; ảnh local nằm trong `database/uploads/`.
- Khi chạy trên Vercel, dữ liệu phát sinh lưu ở Upstash Redis. Ảnh tải lên lưu ở Cloudinary; Redis chỉ lưu thông tin ảnh gắn với phản hồi.
- `shared/familyGreetings.mjs` — xử lý tên người nhận và nội dung lời chúc dùng chung cho frontend/backend.

Git bỏ qua các file `.env` và những tệp runtime như `admins.json`, `feedback.json`, `visits.json` cùng thư mục ảnh tải lên. Không commit thông tin đăng nhập, Redis token hoặc Cloudinary API secret.
