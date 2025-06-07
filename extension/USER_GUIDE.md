# TuVung Dictionary Helper Extension

## 📖 Mô tả
TuVung Dictionary Helper là extension Chrome/Edge giúp bạn thêm từ vựng tiếng Anh vào ứng dụng TuVung một cách nhanh chóng và tiện lợi khi duyệt web.

## ✨ Tính năng chính

### 🎯 Thêm từ nhanh chóng
- **Right-click menu**: Chọn từ → Right click → "Thêm vào TuVung"
- **Double-click**: Double-click vào từ để hiện quick add button
- **Floating button**: Chọn từ sẽ hiện floating button để thêm
- **Keyboard shortcut**: `Ctrl+Shift+A` (Windows) hoặc `Cmd+Shift+A` (Mac)

### 🔍 Tra từ tự động
- Tự động tra nghĩa từ Free Dictionary API
- Điền phát âm, loại từ, ví dụ tự động
- Gợi ý chủ đề phù hợp

### 💾 Quản lý dữ liệu
- Lưu trữ local với Chrome Storage API
- Export/Import dữ liệu (.json)
- Đồng bộ với ứng dụng TuVung chính
- Thống kê từ đã thêm

### 🎨 Giao diện thân thiện
- Dark mode support
- Responsive design
- Beautiful animations
- Notification system

## 🚀 Cài đặt

### Cách 1: Developer Mode (Khuyến nghị)
1. Mở Chrome/Edge và vào `chrome://extensions/` hoặc `edge://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked" và chọn thư mục `extension`
4. Extension sẽ xuất hiện trong danh sách

### Cách 2: Pack Extension
1. Vào `chrome://extensions/`
2. Click "Pack extension"
3. Chọn thư mục extension làm "Extension root directory"
4. Click "Pack Extension" để tạo file .crx
5. Kéo thả file .crx vào trang extensions

## 📱 Cách sử dụng

### Thêm từ cơ bản
1. Highlight/chọn từ tiếng Anh trên trang web
2. Right-click và chọn "Thêm '%s' vào TuVung"
3. Dialog sẽ mở với từ đã được điền sẵn
4. Chờ hệ thống tự động tra từ (nếu bật)
5. Kiểm tra và chỉnh sửa thông tin
6. Click "Lưu từ" hoặc `Ctrl+Enter`

### Sử dụng floating button
1. Chọn từ trên trang web
2. Floating button "📚 Thêm từ" sẽ xuất hiện
3. Click vào button để mở dialog

### Sử dụng phím tắt
1. Chọn từ trên trang web
2. Nhấn `Ctrl+Shift+A` (Windows) hoặc `Cmd+Shift+A` (Mac)
3. Dialog sẽ mở hoặc hiện tooltip hướng dẫn

### Quản lý từ vựng
1. Click vào icon extension trên toolbar
2. Xem thống kê và từ gần đây
3. Đồng bộ với TuVung app
4. Export/Import dữ liệu
5. Cài đặt tùy chọn

## ⚙️ Cài đặt

### Auto-lookup
- Bật/tắt tự động tra từ khi thêm
- Mặc định: Bật

### Notifications
- Hiển thị thông báo khi thêm từ thành công
- Mặc định: Bật

### Default Topic
- Chủ đề mặc định khi thêm từ
- Mặc định: Tổng quát

## 🔄 Đồng bộ với TuVung App

1. Mở ứng dụng TuVung trong tab khác
2. Trong popup extension, click "🔄 Đồng bộ với TuVung"
3. Dữ liệu sẽ được gửi sang app chính
4. Kiểm tra trong app để xác nhận

## 📤 Export/Import

### Export
1. Mở popup extension
2. Click "📤 Xuất dữ liệu"
3. File JSON sẽ được tải về

### Import
1. Mở popup extension
2. Click "📥 Import dữ liệu"
3. Chọn file JSON đã export trước đó
4. Xác nhận import

## 🛠️ Troubleshooting

### Extension không hoạt động
- Kiểm tra extension đã được enable
- Refresh trang web
- Restart browser

### Không tra được từ
- Kiểm tra kết nối internet
- API có thể tạm thời không khả dụng
- Nhập thông tin thủ công

### Đồng bộ không thành công
- Đảm bảo TuVung app đang mở
- Kiểm tra URL của TuVung app
- Refresh cả extension và app

### Dữ liệu bị mất
- Sử dụng tính năng export để backup
- Kiểm tra Chrome Storage quota
- Import từ file backup

## 🔒 Quyền riêng tư

Extension này:
- ✅ Chỉ lưu dữ liệu local (Chrome Storage)
- ✅ Không gửi dữ liệu lên server
- ✅ Chỉ truy cập Free Dictionary API để tra từ
- ✅ Không thu thập thông tin cá nhân

## 📝 Changelog

### Version 1.0.0
- Thêm từ qua context menu
- Tự động tra từ
- Export/Import dữ liệu
- Đồng bộ với TuVung app
- Dark mode support
- Floating button
- Keyboard shortcuts

## 🤝 Hỗ trợ

Nếu bạn gặp vấn đề hoặc có đề xuất:
1. Kiểm tra console errors (`F12` → Console)
2. Tạo issue trên GitHub repository
3. Cung cấp thông tin chi tiết về lỗi

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
