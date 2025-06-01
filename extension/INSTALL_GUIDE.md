# TuVung Dictionary Helper - Chrome Extension

Tiện ích mở rộng Chrome giúp bạn nhanh chóng thêm từ vào từ điển TuVung khi duyệt web.

## Tính năng

### 🚀 Tính năng chính
- **Thêm từ nhanh**: Bôi đen từ trên bất kỳ trang web nào → Right-click → "Add to TuVung"
- **Tra cứu tự động**: Tự động tra cứu nghĩa tiếng Việt từ Free Dictionary API
- **Đồng bộ tự động**: Tự động đồng bộ với ứng dụng TuVung chính qua GitHub Gist
- **Quản lý từ**: Xem, chỉnh sửa và xóa từ đã lưu ngay trong extension

### 📊 Popup Interface
- **Thống kê**: Hiển thị số từ đã lưu, từ hôm nay, tuần này
- **Danh sách từ gần đây**: 10 từ được thêm gần nhất
- **Cài đặt đồng bộ**: Cấu hình GitHub token và gist ID
- **Export data**: Xuất dữ liệu ra file JSON

### ⚡ Auto-sync với TuVung App
- Tự động đồng bộ từ extension sang app chính
- Tự động tải dữ liệu mới nhất khi khởi động app
- Debounced sync để tránh upload quá nhiều

## Cài đặt

### Cách 1: Load Unpacked Extension (Development)
1. Mở Chrome/Edge và truy cập `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked" và chọn thư mục `extension/`
4. Extension sẽ xuất hiện trong thanh công cụ

### Cách 2: Tạo file .crx (Khuyến nghị)
1. Trong trang Extensions, click "Pack extension"
2. Chọn thư mục `extension/` làm Extension root directory
3. Click "Pack Extension" để tạo file .crx
4. Kéo thả file .crx vào trang Extensions để cài đặt

## Thiết lập ban đầu

### 1. Tạo GitHub Personal Access Token
1. Truy cập [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Chọn scope: `gist` (để tạo và chỉnh sửa gist)
4. Copy token đã tạo

### 2. Tạo GitHub Gist
1. Truy cập [gist.github.com](https://gist.github.com)
2. Tạo gist mới với file `vocabulary_data.json`
3. Nội dung file có thể để trống: `{}`
4. Copy Gist ID từ URL (phần sau `/`)

### 3. Cấu hình Extension
1. Click vào icon TuVung trong thanh công cụ
2. Click "Settings" trong popup
3. Nhập GitHub Token và Gist ID
4. Click "Save Settings"

## Cách sử dụng

### Thêm từ từ trang web
1. **Bôi đen từ** bạn muốn thêm trên bất kỳ trang web nào
2. **Right-click** và chọn "Add to TuVung Dictionary"
3. **Dialog xuất hiện** với từ đã được tra cứu tự động
4. **Chỉnh sửa** nghĩa, phát âm, ví dụ nếu cần
5. **Click "Add Word"** để lưu từ

### Quản lý từ trong Popup
1. **Click icon TuVung** để mở popup
2. **Xem thống kê** và danh sách từ gần đây
3. **Click vào từ** để xem chi tiết và chỉnh sửa
4. **Sử dụng nút Export** để sao lưu dữ liệu

### Đồng bộ với TuVung App
- Extension **tự động đồng bộ** với GitHub Gist
- Mở **TuVung app chính** để xem từ đã thêm
- App sẽ **tự động tải dữ liệu mới nhất** khi khởi động

## Cấu trúc file

```
extension/
├── manifest.json          # Cấu hình extension
├── background.js          # Service worker, context menu
├── content.js            # Script chạy trên mọi trang web
├── popup.html            # Giao diện popup
├── popup.js              # Logic popup
├── styles.css            # CSS cho content script
├── popup-styles.css      # CSS cho popup
├── icon16.png            # Icon 16x16
├── icon48.png            # Icon 48x48
├── icon128.png           # Icon 128x128
└── README.md             # File này
```

## API tích hợp

### Free Dictionary API
- **Endpoint**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **Tự động tra cứu**: Phát âm, định nghĩa, ví dụ
- **Fallback**: Nếu không có kết quả, cho phép nhập thủ công

### GitHub Gist API
- **Auto-sync**: Tự động upload/download dữ liệu
- **Debounced**: Chờ 2 giây sau thay đổi cuối cùng
- **Error handling**: Xử lý lỗi mạng và token

## Troubleshooting

### Extension không hoạt động
1. Kiểm tra extension đã được enable
2. Refresh trang web và thử lại
3. Kiểm tra Console cho errors

### Không đồng bộ được
1. Kiểm tra GitHub token còn hiệu lực
2. Kiểm tra Gist ID đúng định dạng
3. Kiểm tra kết nối Internet

### Không tra cứu được từ
1. Kiểm tra kết nối Internet
2. Thử từ khác (API có thể không có từ hiếm)
3. Nhập nghĩa thủ công nếu cần

## Development

### Test Extension
1. Mở Chrome DevTools trong popup: Right-click popup → "Inspect"
2. Mở Console trong trang web để xem content script logs
3. Kiểm tra Background script: `chrome://extensions/` → "Service Worker"

### Update Extension
1. Thay đổi code
2. Truy cập `chrome://extensions/`
3. Click nút "Reload" trên extension

## Changelog

### Version 1.0 (Current)
- ✅ Basic word addition from web pages
- ✅ Auto dictionary lookup
- ✅ GitHub Gist sync
- ✅ Popup interface
- ✅ Local storage management
- ✅ Integration with TuVung main app

### Planned Features
- [ ] Bulk word import
- [ ] Offline mode
- [ ] Custom dictionary sources
- [ ] Word pronunciation audio
- [ ] Spaced repetition integration

## Hỗ trợ

Nếu gặp vấn đề hoặc có đề xuất, vui lòng:
1. Kiểm tra phần Troubleshooting ở trên
2. Mở issue trong repository
3. Cung cấp thông tin: Chrome version, error messages, steps to reproduce
