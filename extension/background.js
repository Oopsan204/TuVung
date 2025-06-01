// TuVung Extension Background Script

// Tạo context menu khi cài đặt extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToTuVung",
        title: "Thêm '%s' vào TuVung",
        contexts: ["selection"]
    });
    
    console.log('TuVung Extension đã được cài đặt!');
});

// Xử lý khi click context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToTuVung") {
        const selectedText = info.selectionText.trim();
        
        if (selectedText && selectedText.length > 0) {
            // Gửi từ được chọn đến content script
            chrome.tabs.sendMessage(tab.id, {
                action: "addWord",
                word: selectedText,
                source: tab.url
            });
        }
    }
});

// Lắng nghe tin nhắn từ popup hoặc content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveToTuVung") {
        // Lưu từ vào storage
        saveWordToTuVung(request.wordData);
        sendResponse({success: true});
    } else if (request.action === "getWords") {
        // Lấy danh sách từ đã lưu
        getStoredWords().then(words => {
            sendResponse({words: words});
        });
        return true; // Để response async
    } else if (request.action === "exportToTuVung") {
        // Xuất dữ liệu để import vào TuVung
        exportToTuVungFormat().then(data => {
            sendResponse({data: data});
        });
        return true;
    } else if (request.action === "clearStorage") {
        // Xóa tất cả từ đã lưu
        chrome.storage.local.clear(() => {
            sendResponse({success: true});
        });
        return true;
    }
});

// Lưu từ vào Chrome storage
async function saveWordToTuVung(wordData) {
    try {
        const result = await chrome.storage.local.get(['tuvung_words']);
        const words = result.tuvung_words || {};
        
        // Tạo key duy nhất cho từ
        const wordKey = wordData.word.toLowerCase();
        
        words[wordKey] = {
            word: wordData.word,
            meaning: wordData.meaning,
            pronunciation: wordData.pronunciation || '',
            example: wordData.example || '',
            topic: wordData.topic || 'General',
            addedDate: new Date().toISOString(),
            source: wordData.source || '',
            partOfSpeech: wordData.partOfSpeech || ''
        };
        
        await chrome.storage.local.set({ tuvung_words: words });
        
        // Thông báo thành công
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'TuVung Helper',
            message: `Đã thêm từ "${wordData.word}" vào từ điển!`
        });
        
        console.log(`Đã lưu từ: ${wordData.word}`);
        
    } catch (error) {
        console.error('Lỗi khi lưu từ:', error);
    }
}

// Lấy từ đã lưu
async function getStoredWords() {
    try {
        const result = await chrome.storage.local.get(['tuvung_words']);
        return result.tuvung_words || {};
    } catch (error) {
        console.error('Lỗi khi lấy từ:', error);
        return {};
    }
}

// Xuất dữ liệu theo định dạng TuVung
async function exportToTuVungFormat() {
    try {
        const words = await getStoredWords();
        const tuvungFormat = {};
        
        // Chuyển đổi sang định dạng TuVung
        Object.values(words).forEach(word => {
            tuvungFormat[word.word] = {
                meaning: word.meaning,
                pronunciation: word.pronunciation,
                example: word.example,
                topic: word.topic,
                addedDate: word.addedDate,
                source: `Extension: ${word.source}`
            };
        });
        
        return {
            vocabulary: tuvungFormat,
            metadata: {
                exportDate: new Date().toISOString(),
                source: 'TuVung Extension',
                wordCount: Object.keys(tuvungFormat).length
            }
        };
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu:', error);
        return { vocabulary: {}, metadata: {} };
    }
}
