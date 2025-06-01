# TuVung Dictionary Helper Extension

Một browser extension giúp bạn thêm từ vào từ điển TuVung một cách nhanh chóng khi duyệt web.

## 🌟 Tính năng

- **Thêm từ nhanh chóng**: Highlight từ trên bất kỳ trang web nào và thêm vào từ điển
- **Tra từ tự động**: Tự động tra nghĩa và phát âm từ API từ điển miễn phí
- **Đồng bộ với TuVung**: Import tất cả từ đã lưu vào ứng dụng TuVung chính
- **Quản lý từ**: Xem danh sách từ đã lưu, thống kê, xuất dữ liệu
- **Cài đặt linh hoạt**: Tùy chỉnh chủ đề mặc định, bật/tắt tự động tra từ

## 📱 Cách sử dụng

### Cài đặt Extension

1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked" và chọn thư mục `extension`
4. Extension sẽ xuất hiện trên thanh công cụ

### Thêm từ

**Cách 1: Context Menu**
1. Highlight từ bất kỳ trên trang web
2. Right-click và chọn "Thêm '[từ]' vào TuVung"
3. Dialog sẽ hiện với thông tin từ được tự động điền
4. Chỉnh sửa thông tin nếu cần và click "Lưu từ"

**Cách 2: Extension Popup**
1. Click vào icon TuVung Helper trên thanh công cụ
2. Xem thống kê và từ đã lưu gần đây

### Đồng bộ với TuVung App

1. Mở ứng dụng TuVung trong tab khác
2. Click vào icon extension và chọn "Đồng bộ với TuVung"
3. Tất cả từ sẽ được import vào ứng dụng chính

### Xuất dữ liệu

1. Click vào icon extension
2. Chọn "Xuất dữ liệu" để tải file JSON backup
3. File có thể được import vào TuVung hoặc sử dụng làm backup

## 🔧 Cài đặt

- **Tự động tra từ**: Bật/tắt tự động tra nghĩa khi thêm từ
- **Hiển thị thông báo**: Bật/tắt thông báo khi thêm từ thành công
- **Chủ đề mặc định**: Chọn chủ đề mặc định cho từ mới

## 🛠️ Phát triển

### Cấu trúc thư mục

```
extension/
├── manifest.json        # Manifest của extension
├── background.js        # Service worker
├── content.js          # Content script
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── styles.css          # Styles cho content script
├── popup-styles.css    # Styles cho popup
└── README.md           # Tài liệu này
```

### API sử dụng

- **Free Dictionary API**: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
- **Chrome Extensions API**: storage, contextMenus, notifications, tabs

### Permissions

- `activeTab`: Để inject content script vào trang hiện tại
- `storage`: Lưu trữ từ và cài đặt
- `contextMenus`: Tạo menu chuột phải
- `notifications`: Hiển thị thông báo

## 🚀 Tương lai

- [ ] Sync với Google Drive/Dropbox
- [ ] Hỗ trợ nhiều ngôn ngữ
- [ ] Flashcard mode trong extension
- [ ] Thống kê học tập
- [ ] Dark mode
- [ ] Keyboard shortcuts

## 📝 Ghi chú

- Extension hoạt động offline sau khi từ đã được lưu
- Dữ liệu được lưu trong Chrome storage
- Tương thích với Chrome, Edge, và các browser Chromium khác

## 🐛 Báo lỗi

Nếu gặp lỗi, hãy:
1. Kiểm tra Console trong Developer Tools
2. Verify extension permissions
3. Restart extension nếu cần thiết
