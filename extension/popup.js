// TuVung Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    // Tải dữ liệu
    await loadWordStats();
    await loadRecentWords();
    await loadSettings();
    
    // Event listeners
    document.getElementById('sync-btn').addEventListener('click', syncWithTuVung);
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('clear-btn').addEventListener('click', clearAllWords);
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    document.getElementById('close-settings').addEventListener('click', hideSettings);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
});

// Tải thống kê từ
async function loadWordStats() {
    chrome.runtime.sendMessage({action: "getWords"}, (response) => {
        const words = response.words || {};
        const wordCount = Object.keys(words).length;
        
        // Đếm từ thêm hôm nay
        const today = new Date().toDateString();
        const todayCount = Object.values(words).filter(word => {
            const addedDate = new Date(word.addedDate).toDateString();
            return addedDate === today;
        }).length;
        
        document.getElementById('word-count').textContent = wordCount;
        document.getElementById('today-count').textContent = todayCount;
    });
}

// Tải từ gần đây
async function loadRecentWords() {
    chrome.runtime.sendMessage({action: "getWords"}, (response) => {
        const words = response.words || {};
        const recentWords = Object.values(words)
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, 5);
        
        const recentList = document.getElementById('recent-list');
        
        if (recentWords.length === 0) {
            recentList.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có từ nào được lưu</p>
                    <small>Highlight từ trên trang web và click chuột phải để thêm từ</small>
                </div>
            `;
            return;
        }
        
        recentList.innerHTML = '';
        
        recentWords.forEach(wordData => {
            const item = document.createElement('div');
            item.className = 'word-item';
            
            const meaningPreview = wordData.meaning.length > 40 
                ? wordData.meaning.substring(0, 40) + '...' 
                : wordData.meaning;
            
            const timeAgo = getTimeAgo(new Date(wordData.addedDate));
            
            item.innerHTML = `
                <div class="word-header">
                    <strong class="word-text">${wordData.word}</strong>
                    <span class="word-topic">${wordData.topic}</span>
                </div>
                <div class="word-meaning">${meaningPreview}</div>
                <div class="word-meta">
                    <span class="word-time">${timeAgo}</span>
                    ${wordData.pronunciation ? `<span class="word-pronunciation">${wordData.pronunciation}</span>` : ''}
                </div>
            `;
            
            recentList.appendChild(item);
        });
    });
}

// Đồng bộ với TuVung
async function syncWithTuVung() {
    const syncBtn = document.getElementById('sync-btn');
    const originalText = syncBtn.innerHTML;
    
    syncBtn.innerHTML = '<span class="btn-icon">🔄</span> Đang đồng bộ...';
    syncBtn.disabled = true;
    
    try {
        // Tìm tab TuVung
        const tabs = await chrome.tabs.query({url: "*://*/TuVung/*"});
        
        if (tabs.length === 0) {
            // Mở TuVung trong tab mới
            const confirm = window.confirm('Không tìm thấy TuVung đang mở. Bạn có muốn mở TuVung?');
            if (confirm) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('../index.html') // Nếu TuVung cùng thư mục
                });
            }
            return;
        }
        
        // Lấy dữ liệu để xuất
        chrome.runtime.sendMessage({action: "exportToTuVung"}, async (response) => {
            if (response && response.data) {
                // Gửi dữ liệu đến TuVung
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "importToTuVung",
                    words: response.data.vocabulary
                });
                
                showNotification(`Đã đồng bộ ${Object.keys(response.data.vocabulary).length} từ với TuVung!`, 'success');
            }
        });
        
    } catch (error) {
        console.error('Lỗi đồng bộ:', error);
        showNotification('Lỗi khi đồng bộ dữ liệu!', 'error');
    } finally {
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
    }
}

// Xuất dữ liệu
function exportData() {
    chrome.runtime.sendMessage({action: "getWords"}, (response) => {
        const words = response.words || {};
        const exportData = {
            tuvung_extension_data: words,
            export_info: {
                date: new Date().toISOString(),
                count: Object.keys(words).length,
                version: '1.0'
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tuvung-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Đã xuất dữ liệu thành công!', 'success');
    });
}

// Xóa tất cả từ
function clearAllWords() {
    if (confirm('🗑️ Bạn có chắc chắn muốn xóa tất cả từ đã lưu?\nHành động này không thể hoàn tác!')) {
        chrome.runtime.sendMessage({action: "clearStorage"}, (response) => {
            if (response && response.success) {
                loadWordStats();
                loadRecentWords();
                showNotification('Đã xóa tất cả từ!', 'info');
            }
        });
    }
}

// Hiển thị cài đặt
function showSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

// Ẩn cài đặt
function hideSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// Tải cài đặt
async function loadSettings() {
    const result = await chrome.storage.local.get(['extension_settings']);
    const settings = result.extension_settings || {
        autoLookup: true,
        showNotifications: true,
        defaultTopic: 'General'
    };
    
    document.getElementById('auto-lookup').checked = settings.autoLookup;
    document.getElementById('show-notifications').checked = settings.showNotifications;
    document.getElementById('default-topic').value = settings.defaultTopic;
}

// Lưu cài đặt
async function saveSettings() {
    const settings = {
        autoLookup: document.getElementById('auto-lookup').checked,
        showNotifications: document.getElementById('show-notifications').checked,
        defaultTopic: document.getElementById('default-topic').value
    };
    
    await chrome.storage.local.set({ extension_settings: settings });
    hideSettings();
    showNotification('Đã lưu cài đặt!', 'success');
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Utility: Tính thời gian
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
}
