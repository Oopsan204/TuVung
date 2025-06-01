// TuVung Extension Content Script

// Lắng nghe tin nhắn từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addWord") {
        showWordDialog(request.word, request.source);
        sendResponse({success: true});
    } else if (request.action === "importToTuVung") {
        // Import từ extension vào TuVung app
        importWordsToTuVung(request.words);
        sendResponse({success: true});
    }
});

// Tạo dialog thêm từ
function showWordDialog(word, source) {
    // Kiểm tra nếu dialog đã tồn tại thì không tạo mới
    if (document.getElementById('tuvung-overlay')) {
        return;
    }
    
    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.id = 'tuvung-overlay';
    overlay.innerHTML = `
        <div class="tuvung-dialog">
            <div class="tuvung-header">
                <h3>🌟 Thêm từ vào TuVung</h3>
                <button class="close-btn" title="Đóng">&times;</button>
            </div>
            <div class="tuvung-content">
                <div class="form-group">
                    <label>📝 Từ:</label>
                    <input type="text" id="word-input" value="${word}" readonly>
                </div>
                <div class="form-group">
                    <label>🇻🇳 Nghĩa tiếng Việt:</label>
                    <textarea id="meaning-input" placeholder="Nhập nghĩa của từ..." rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>🔊 Phát âm (IPA):</label>
                    <input type="text" id="pronunciation-input" placeholder="/wɜːrd/">
                </div>
                <div class="form-group">
                    <label>📖 Ví dụ:</label>
                    <textarea id="example-input" placeholder="Câu ví dụ sử dụng từ này..." rows="2"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>📚 Chủ đề:</label>
                        <select id="topic-select">
                            <option value="General">Tổng quát</option>
                            <option value="Business">Kinh doanh</option>
                            <option value="Technology">Công nghệ</option>
                            <option value="Education">Giáo dục</option>
                            <option value="Travel">Du lịch</option>
                            <option value="Food">Ẩm thực</option>
                            <option value="Sports">Thể thao</option>
                            <option value="Health">Sức khỏe</option>
                            <option value="Science">Khoa học</option>
                            <option value="Art">Nghệ thuật</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>🔤 Loại từ:</label>
                        <select id="pos-select">
                            <option value="">Chọn loại từ</option>
                            <option value="noun">Danh từ</option>
                            <option value="verb">Động từ</option>
                            <option value="adjective">Tính từ</option>
                            <option value="adverb">Trạng từ</option>
                            <option value="preposition">Giới từ</option>
                            <option value="conjunction">Liên từ</option>
                            <option value="interjection">Thán từ</option>
                        </select>
                    </div>
                </div>
                <div class="button-group">
                    <button id="lookup-btn" class="btn secondary">🔍 Tra từ</button>
                    <button id="save-btn" class="btn primary">💾 Lưu từ</button>
                </div>
                <div class="source-info">
                    📍 Nguồn: ${getDomainFromUrl(source)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    overlay.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    // Tra từ tự động
    overlay.querySelector('#lookup-btn').addEventListener('click', () => {
        lookupWord(word);
    });
    
    // Lưu từ
    overlay.querySelector('#save-btn').addEventListener('click', () => {
        saveWord(overlay, source);
    });
    
    // Focus vào ô nghĩa
    overlay.querySelector('#meaning-input').focus();
    
    // Tự động tra từ khi mở dialog
    setTimeout(() => {
        lookupWord(word);
    }, 500);
    
    // Xử lý phím tắt
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
        } else if (e.key === 'Enter' && e.ctrlKey) {
            saveWord(overlay, source);
        }
    });
}

// Tra từ online sử dụng API miễn phí
async function lookupWord(word) {
    const lookupBtn = document.getElementById('lookup-btn');
    if (lookupBtn) {
        lookupBtn.textContent = '🔄 Đang tra...';
        lookupBtn.disabled = true;
    }
    
    try {
        // Sử dụng Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (response.ok) {
            const data = await response.json();
            const entry = data[0];
            
            // Điền nghĩa
            if (entry.meanings && entry.meanings.length > 0) {
                const meanings = entry.meanings.map(meaning => {
                    const partOfSpeech = meaning.partOfSpeech;
                    const definitions = meaning.definitions.slice(0, 3).map(def => def.definition);
                    return `${partOfSpeech}: ${definitions.join('; ')}`;
                }).join('\n');
                
                const meaningInput = document.getElementById('meaning-input');
                if (meaningInput && !meaningInput.value.trim()) {
                    meaningInput.value = meanings;
                }
                
                // Điền loại từ
                const posSelect = document.getElementById('pos-select');
                if (posSelect && entry.meanings[0]) {
                    const firstPos = entry.meanings[0].partOfSpeech;
                    if (posSelect.querySelector(`option[value="${firstPos}"]`)) {
                        posSelect.value = firstPos;
                    }
                }
            }
            
            // Điền phát âm
            if (entry.phonetics && entry.phonetics.length > 0) {
                const phonetic = entry.phonetics.find(p => p.text) || entry.phonetics[0];
                if (phonetic && phonetic.text) {
                    const pronunciationInput = document.getElementById('pronunciation-input');
                    if (pronunciationInput && !pronunciationInput.value.trim()) {
                        pronunciationInput.value = phonetic.text;
                    }
                }
            }
            
            // Điền ví dụ
            if (entry.meanings[0] && entry.meanings[0].definitions[0] && entry.meanings[0].definitions[0].example) {
                const exampleInput = document.getElementById('example-input');
                if (exampleInput && !exampleInput.value.trim()) {
                    exampleInput.value = entry.meanings[0].definitions[0].example;
                }
            }
            
        } else {
            console.log('Không tìm thấy từ trong từ điển online');
        }
    } catch (error) {
        console.error('Lỗi khi tra từ:', error);
    } finally {
        if (lookupBtn) {
            lookupBtn.textContent = '🔍 Tra từ';
            lookupBtn.disabled = false;
        }
    }
}

// Lưu từ
function saveWord(overlay, source) {
    const wordData = {
        word: document.getElementById('word-input').value.trim(),
        meaning: document.getElementById('meaning-input').value.trim(),
        pronunciation: document.getElementById('pronunciation-input').value.trim(),
        example: document.getElementById('example-input').value.trim(),
        topic: document.getElementById('topic-select').value,
        partOfSpeech: document.getElementById('pos-select').value,
        source: source || window.location.href
    };
    
    if (!wordData.word || !wordData.meaning) {
        alert('⚠️ Vui lòng nhập từ và nghĩa!');
        return;
    }
    
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.textContent = '💾 Đang lưu...';
        saveBtn.disabled = true;
    }
    
    // Gửi đến background script
    chrome.runtime.sendMessage({
        action: "saveToTuVung",
        wordData: wordData
    }, (response) => {
        if (response && response.success) {
            document.body.removeChild(overlay);
        } else {
            if (saveBtn) {
                saveBtn.textContent = '💾 Lưu từ';
                saveBtn.disabled = false;
            }
        }
    });
}

// Import từ vào TuVung app (nếu đang ở trang TuVung)
function importWordsToTuVung(words) {
    // Kiểm tra xem có phải trang TuVung không
    if (window.location.href.includes('TuVung') || window.VocabularyManager) {
        // Gửi message đến window để VocabularyManager xử lý
        window.postMessage({
            action: 'importFromExtension',
            words: words
        }, '*');
        
        console.log('Đã gửi yêu cầu import từ extension đến TuVung');
    } else {
        console.log('Không phải trang TuVung, không thể import trực tiếp');
    }
}

// Utility function
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return 'Unknown';
    }
}
