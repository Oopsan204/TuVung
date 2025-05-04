// Nạp dữ liệu từ vựng từ file JSON (dạng fetch tĩnh cho GitHub Pages)
let vocabulary = {};
let wordPackages = {};
let wordTopics = {};
let wordSynonyms = {};

// Kiểm tra trạng thái kết nối
let isOnline = navigator.onLine;

// Các biến cho GitHub Gist
let githubToken = '';
let gistId = '';

// Hàm lưu token và gistId vào localStorage
function saveGitHubCredentials(token, id) {
    if (token) localStorage.setItem('githubToken', token);
    if (id) localStorage.setItem('gistId', id);
    
    githubToken = token || githubToken;
    gistId = id || gistId;
}

// Hàm tải token và gistId từ localStorage
function loadGitHubCredentials() {
    githubToken = localStorage.getItem('githubToken') || '';
    gistId = localStorage.getItem('gistId') || '';
    return { githubToken, gistId };
}

// Hàm xác thực với GitHub Gist
async function authenticateGitHub() {
    const token = prompt('Nhập GitHub Personal Access Token của bạn:', githubToken);
    if (!token) return false;
    
    try {
        // Kiểm tra xem token có hợp lệ không bằng cách thử liệt kê các gist
        const response = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token không hợp lệ hoặc không có quyền truy cập Gist');
        }
        
        // Lưu token nếu xác thực thành công
        saveGitHubCredentials(token, null);
        showToast('Xác thực GitHub thành công!', 'success');
        return true;
    } catch (error) {
        console.error('Lỗi xác thực GitHub:', error);
        showToast('Xác thực GitHub thất bại: ' + error.message, 'error');
        return false;
    }
}

// Hàm tạo mới một Gist để lưu dữ liệu từ vựng
async function createVocabularyGist() {
    if (!githubToken) {
        const authenticated = await authenticateGitHub();
        if (!authenticated) return null;
    }
    
    try {
        // Chuẩn bị dữ liệu để tạo Gist
        const data = {
            description: "Dữ liệu từ vựng tiếng Anh",
            public: false, // Gist riêng tư
            files: {
                "vocabulary_data.json": {
                    content: JSON.stringify(vocabulary, null, 2)
                },
                "word_packages.json": {
                    content: JSON.stringify(wordPackages, null, 2)
                },
                "word_topics.json": {
                    content: JSON.stringify(wordTopics, null, 2)
                },
                "word_synonyms.json": {
                    content: JSON.stringify(wordSynonyms, null, 2)
                },
                "metadata.json": {
                    content: JSON.stringify({
                        lastUpdated: new Date().toISOString(),
                        deviceInfo: navigator.userAgent
                    }, null, 2)
                }
            }
        };
        
        // Gọi API để tạo Gist
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Không thể tạo Gist');
        }
        
        const result = await response.json();
        const newGistId = result.id;
        
        // Lưu ID của Gist vừa tạo
        saveGitHubCredentials(null, newGistId);
        showToast('Đã tạo Gist mới thành công!', 'success');
        return newGistId;
    } catch (error) {
        console.error('Lỗi khi tạo Gist:', error);
        showToast('Không thể tạo Gist: ' + error.message, 'error');
        return null;
    }
}

// Hàm cập nhật dữ liệu vào Gist đã có
async function updateVocabularyGist() {
    // Kiểm tra xác thực và Gist ID
    if (!githubToken) {
        const authenticated = await authenticateGitHub();
        if (!authenticated) return false;
    }
    
    if (!gistId) {
        const useExisting = confirm('Bạn chưa chọn Gist để lưu dữ liệu. Bạn có muốn nhập ID Gist không?');
        if (useExisting) {
            const id = prompt('Nhập ID của Gist:');
            if (!id) return false;
            saveGitHubCredentials(null, id);
        } else {
            // Tạo Gist mới nếu người dùng không muốn nhập ID
            const newId = await createVocabularyGist();
            if (!newId) return false;
        }
    }
    
    try {
        // Chuẩn bị dữ liệu để cập nhật
        const data = {
            description: "Dữ liệu từ vựng tiếng Anh (Cập nhật: " + new Date().toLocaleString() + ")",
            files: {
                "vocabulary_data.json": {
                    content: JSON.stringify(vocabulary, null, 2)
                },
                "word_packages.json": {
                    content: JSON.stringify(wordPackages, null, 2)
                },
                "word_topics.json": {
                    content: JSON.stringify(wordTopics, null, 2)
                },
                "word_synonyms.json": {
                    content: JSON.stringify(wordSynonyms, null, 2)
                },
                "metadata.json": {
                    content: JSON.stringify({
                        lastUpdated: new Date().toISOString(),
                        deviceInfo: navigator.userAgent,
                        wordCount: Object.keys(vocabulary).length,
                        topicCount: Object.keys(wordTopics).length,
                        synonymCount: Object.keys(wordSynonyms).length
                    }, null, 2)
                }
            }
        };
        
        // Gọi API để cập nhật Gist
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Không thể cập nhật Gist');
        }
        
        showToast('Đã cập nhật dữ liệu lên GitHub Gist!', 'success');
        return true;
    } catch (error) {
        console.error('Lỗi khi cập nhật Gist:', error);
        showToast('Không thể cập nhật Gist: ' + error.message, 'error');
        return false;
    }
}

// Hàm tải dữ liệu từ Gist
async function loadFromGist() {
    // Kiểm tra xác thực
    if (!githubToken) {
        const authenticated = await authenticateGitHub();
        if (!authenticated) return false;
    }
    
    // Kiểm tra Gist ID
    let gistToLoad = gistId;
    if (!gistToLoad) {
        // Nếu chưa có Gist ID, hỏi người dùng
        const id = prompt('Nhập ID của Gist chứa dữ liệu từ vựng:');
        if (!id) return false;
        gistToLoad = id;
    }
    
    try {
        // Gọi API để lấy Gist
        const response = await fetch(`https://api.github.com/gists/${gistToLoad}`, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu từ Gist');
        }
        
        const gistData = await response.json();
        
        // Kiểm tra và tải các file dữ liệu
        let dataLoaded = false;
        
        if (gistData.files['vocabulary_data.json']) {
            try {
                const vocabContent = JSON.parse(gistData.files['vocabulary_data.json'].content);
                vocabulary = vocabContent;
                dataLoaded = true;
            } catch (e) {
                console.error('Lỗi parsing vocabulary_data.json:', e);
            }
        }
        
        if (gistData.files['word_packages.json']) {
            try {
                const packagesContent = JSON.parse(gistData.files['word_packages.json'].content);
                wordPackages = packagesContent;
            } catch (e) {
                console.error('Lỗi parsing word_packages.json:', e);
            }
        }
        
        if (gistData.files['word_topics.json']) {
            try {
                const topicsContent = JSON.parse(gistData.files['word_topics.json'].content);
                wordTopics = topicsContent;
            } catch (e) {
                console.error('Lỗi parsing word_topics.json:', e);
            }
        }
        
        if (gistData.files['word_synonyms.json']) {
            try {
                const synonymsContent = JSON.parse(gistData.files['word_synonyms.json'].content);
                wordSynonyms = synonymsContent;
            } catch (e) {
                console.error('Lỗi parsing word_synonyms.json:', e);
            }
        }
        
        if (dataLoaded) {
            // Lưu Gist ID nếu tải thành công
            saveGitHubCredentials(null, gistToLoad);
            
            // Lưu dữ liệu vào localStorage
            saveAllDataToLocalStorage();
            
            // Cập nhật giao diện
            refreshAllViews();
            showToast('Đã tải dữ liệu từ GitHub Gist thành công!', 'success');
            return true;
        } else {
            throw new Error('Không tìm thấy dữ liệu từ vựng trong Gist');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu từ Gist:', error);
        showToast('Không thể tải từ Gist: ' + error.message, 'error');
        return false;
    }
}

// Hàm liệt kê tất cả các Gist của người dùng
async function listUserGists() {
    // Kiểm tra xác thực
    if (!githubToken) {
        const authenticated = await authenticateGitHub();
        if (!authenticated) return null;
    }
    
    try {
        // Gọi API để lấy danh sách Gist
        const response = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách Gist');
        }
        
        const gists = await response.json();
        
        // Lọc ra các Gist có thể chứa dữ liệu từ vựng
        const vocabularyGists = gists.filter(gist => {
            return gist.files && (
                gist.files['vocabulary_data.json'] ||
                gist.description.toLowerCase().includes('từ vựng') ||
                gist.description.toLowerCase().includes('vocabulary')
            );
        });
        
        return vocabularyGists;
    } catch (error) {
        console.error('Lỗi khi liệt kê Gist:', error);
        showToast('Không thể tải danh sách Gist: ' + error.message, 'error');
        return null;
    }
}

// Hiển thị danh sách các Gist để người dùng chọn
async function showGistSelector() {
    const gists = await listUserGists();
    if (!gists || gists.length === 0) {
        showToast('Không tìm thấy Gist nào. Hãy tạo Gist mới!', 'warning');
        return null;
    }
    
    // Tạo dialog chọn Gist
    let html = `<div id="gist-selector" class="dialog">
        <div class="dialog-content">
            <span class="close-dialog" id="close-gist-selector">&times;</span>
            <h2>Chọn GitHub Gist</h2>
            <div class="gist-list">
                <table>
                    <thead>
                        <tr>
                            <th>Mô tả</th>
                            <th>Cập nhật lần cuối</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    gists.forEach(gist => {
        const updated = new Date(gist.updated_at).toLocaleString();
        html += `
            <tr>
                <td>${gist.description || 'Không có mô tả'}</td>
                <td>${updated}</td>
                <td>
                    <button class="btn primary select-gist" data-id="${gist.id}">Chọn</button>
                </td>
            </tr>`;
    });
    
    html += `</tbody>
                </table>
            </div>
            <button id="cancel-gist-selection" class="btn secondary">Hủy</button>
        </div>
    </div>`;
    
    // Thêm dialog vào DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv.firstChild);
    
    // Hiển thị dialog
    const dialog = document.getElementById('gist-selector');
    dialog.style.display = 'block';
    
    // Xử lý sự kiện
    return new Promise((resolve) => {
        // Xử lý khi chọn một Gist
        document.querySelectorAll('.select-gist').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                dialog.style.display = 'none';
                document.body.removeChild(dialog);
                resolve(id);
            });
        });
        
        // Xử lý khi đóng dialog
        document.getElementById('close-gist-selector').addEventListener('click', function() {
            dialog.style.display = 'none';
            document.body.removeChild(dialog);
            resolve(null);
        });
        
        document.getElementById('cancel-gist-selection').addEventListener('click', function() {
            dialog.style.display = 'none';
            document.body.removeChild(dialog);
            resolve(null);
        });
        
        // Đóng dialog khi click ra ngoài
        window.addEventListener('click', function(event) {
            if (event.target === dialog) {
                dialog.style.display = 'none';
                document.body.removeChild(dialog);
                resolve(null);
            }
        });
    });
}

// Tải GitHub credentials khi khởi động
window.addEventListener('DOMContentLoaded', function() {
    // Tải token và gistId từ localStorage
    loadGitHubCredentials();
    
    // Tự động điền token GitHub (chỉ dùng cho phát triển, xóa dòng này khi triển khai)
    if (!githubToken) {
        // Token đã được cài đặt trước (thay YOUR_TOKEN_HERE bằng token của bạn)
        const defaultToken = "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";
        saveGitHubCredentials(defaultToken, null);
        githubToken = defaultToken;
        console.log("Đã tự động thiết lập token GitHub");
        
        // Sau khi thiết lập token, cập nhật hiển thị trạng thái
        setTimeout(() => {
            if (typeof updateGitHubAuthStatus === 'function') {
                updateGitHubAuthStatus();
            }
        }, 500);
    }
});

// Hàm làm mới tất cả các views
function refreshAllViews() {
    // Cập nhật lại tất cả các phần của ứng dụng
    if (document.getElementById('dictionary-body')) loadDictionaryWords();
    if (document.getElementById('topics-list')) loadTopicsList();
    if (document.getElementById('synonyms-list')) loadSynonymsList();
    if (document.getElementById('cloud-vocab-count')) updateDataStatistics();

    // Cập nhật danh sách từ cho học tập
    wordList = Object.keys(vocabulary);

    // Cập nhật wordList cho flashcard nếu đang hiển thị
    if (document.getElementById('flashcard-word')) loadFlashcardWords();
}

// Module quản lý dữ liệu từ vựng
const VocabularyManager = {
    // Lưu trữ dữ liệu
    data: {
        vocabulary: {},
        wordPackages: {},
        wordTopics: {},
        wordSynonyms: {}
    },

    // Các đường dẫn thử nghiệm
    PATHS: [
        'data/',
        './data/',
        '/data/',
        '../data/'
    ],

    // Lưu dữ liệu vào localStorage
    saveToLocalStorage(updateTimestamp = true) {
        try {
            localStorage.setItem('vocabularyData', JSON.stringify(this.data.vocabulary));
            localStorage.setItem('wordPackages', JSON.stringify(this.data.wordPackages));
            localStorage.setItem('wordTopics', JSON.stringify(this.data.wordTopics));
            localStorage.setItem('wordSynonyms', JSON.stringify(this.data.wordSynonyms));
            
            if (updateTimestamp) {
                localStorage.setItem('lastUpdated', new Date().toISOString());
            }
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu vào localStorage:", error);
            return false;
        }
    },

    // Tải dữ liệu từ localStorage
    loadFromLocalStorage() {
        try {
            const savedVocabulary = localStorage.getItem('vocabularyData');
            if (savedVocabulary) {
                this.data.vocabulary = JSON.parse(savedVocabulary);
            }

            const savedPackages = localStorage.getItem('wordPackages');
            if (savedPackages) {
                this.data.wordPackages = JSON.parse(savedPackages);
            }

            const savedTopics = localStorage.getItem('wordTopics');
            if (savedTopics) {
                this.data.wordTopics = JSON.parse(savedTopics);
            }

            const savedSynonyms = localStorage.getItem('wordSynonyms');
            if (savedSynonyms) {
                this.data.wordSynonyms = JSON.parse(savedSynonyms);
            }

            return Object.keys(this.data.vocabulary).length > 0;
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ localStorage:", error);
            return false;
        }
    },

    // Tải một file JSON từ đường dẫn
    async loadJSONFile(filename) {
        for (const basePath of this.PATHS) {
            try {
                const path = basePath + filename;
                const response = await fetch(path);
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.log(`Không thể tải từ ${basePath + filename}:`, error.message);
            }
        }
        return null;
    },
    
    // Tải tất cả dữ liệu từ các file
    async loadFromFiles() {
        try {
            // Tải song song các tệp để cải thiện hiệu suất
            const [vocab, packages, topics, synonyms] = await Promise.all([
                this.loadJSONFile('vocabulary_data.json'),
                this.loadJSONFile('word_packages.json'),
                this.loadJSONFile('word_topics.json'),
                this.loadJSONFile('word_synonyms.json')
            ]);
            
            if (vocab) this.data.vocabulary = vocab;
            if (packages) this.data.wordPackages = packages;
            if (topics) this.data.wordTopics = topics;
            if (synonyms) this.data.wordSynonyms = synonyms;
            
            return Object.keys(this.data.vocabulary).length > 0;
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ file:", error);
            return false;
        }
    },
    
    // Tạo dữ liệu mẫu cơ bản
    createSampleData() {
        this.data.vocabulary = {
            "hello": "xin chào",
            "goodbye": "tạm biệt",
            "thank you": "cảm ơn",
            "yes": "có",
            "no": "không",
            "please": "làm ơn, vui lòng",
            "sorry": "xin lỗi",
            "good": "tốt",
            "bad": "xấu",
            "learn": "học"
        };
        
        this.data.wordPackages = {
            "Cơ bản": ["hello", "goodbye", "thank you", "yes", "no", "please", "sorry"]
        };
        
        this.data.wordTopics = {
            "Giao tiếp": ["hello", "goodbye", "thank you", "yes", "no", "please", "sorry"]
        };
        
        this.data.wordSynonyms = {
            "good_group": ["good"],
            "bad_group": ["bad"]
        };
        
        return true;
    },
    
    // Tạo dữ liệu mẫu nâng cao
    createExtendedSampleData() {
        this.data.vocabulary = {
            "hello": "xin chào",
            "goodbye": "tạm biệt",
            "thank you": "cảm ơn",
            "yes": "có",
            "no": "không",
            "please": "làm ơn, vui lòng",
            "sorry": "xin lỗi",
            "good": "tốt",
            "bad": "xấu",
            "learn": "học",
            "english": "tiếng Anh",
            "vietnamese": "tiếng Việt",
            "vocabulary": "từ vựng",
            "practice": "luyện tập",
            "word": "từ",
            "meaning": "ý nghĩa",
            "dictionary": "từ điển",
            "language": "ngôn ngữ",
            "translate": "dịch"
        };
        
        this.data.wordPackages = {
            "Cơ bản": ["hello", "goodbye", "thank you", "yes", "no", "please", "sorry"],
            "Học tập": ["learn", "english", "vietnamese", "vocabulary", "practice", "word", "meaning", "dictionary", "language", "translate"]
        };
        
        this.data.wordTopics = {
            "Giao tiếp": ["hello", "goodbye", "thank you", "yes", "no", "please", "sorry"],
            "Giáo dục": ["learn", "english", "vietnamese", "vocabulary", "practice", "word", "meaning", "dictionary", "language", "translate"]
        };
        
        this.data.wordSynonyms = {
            "good_group": ["good"],
            "bad_group": ["bad"]
        };
        
        return true;
    },
    
    // Phương thức chính để tải dữ liệu
    async load() {
        // Bước 1: Thử tải từ localStorage
        const localLoaded = this.loadFromLocalStorage();
        if (localLoaded) {
            console.log("Đã tải dữ liệu từ localStorage:", Object.keys(this.data.vocabulary).length, "từ");
            return true;
        }
        
        // Bước 2: Thử tải từ file
        console.log("Không có dữ liệu trong localStorage, đang tải từ file...");
        const fileLoaded = await this.loadFromFiles();
        if (fileLoaded) {
            console.log("Đã tải dữ liệu từ file:", Object.keys(this.data.vocabulary).length, "từ");
            this.saveToLocalStorage();
            return true;
        }
        
        // Bước 3: Tạo dữ liệu mẫu nếu không tải được
        console.log("Không thể tải dữ liệu, tạo dữ liệu mẫu...");
        this.createExtendedSampleData();
        this.saveToLocalStorage();
        console.log("Đã tạo dữ liệu mẫu:", Object.keys(this.data.vocabulary).length, "từ");
        return true;
    }
};

// Cập nhật biến toàn cục để tương thích với mã hiện tại
function updateGlobalVariables() {
    vocabulary = VocabularyManager.data.vocabulary;
    wordPackages = VocabularyManager.data.wordPackages;
    wordTopics = VocabularyManager.data.wordTopics;
    wordSynonyms = VocabularyManager.data.wordSynonyms;
    
    window.vocabulary = vocabulary;
    window.wordPackages = wordPackages;
    window.wordTopics = wordTopics;
    window.wordSynonyms = wordSynonyms;
}

// Hàm mới tải dữ liệu từ vựng sử dụng VocabularyManager
async function loadVocabulary() {
    try {
        await VocabularyManager.load();
        updateGlobalVariables();
        
        // Hiển thị số lượng từ vựng đã tải
        console.log("Tổng số từ vựng đã tải:", Object.keys(vocabulary).length);
        
        // Khởi tạo các tab
        initLearnTab();
        initDictionaryTab();
        initQuizTab();
        initFlashcardTab();
        initTopicsTab();
        initSynonymsTab();
        initSettingsTab();
        initCloudTab();
        
        showToast(`Đã tải ${Object.keys(vocabulary).length} từ vựng thành công!`, 'success');
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ vựng:", error);
        showToast('Đã xảy ra lỗi khi tải dữ liệu từ vựng!', 'error');
    }
}

// Lưu tất cả dữ liệu vào localStorage và cập nhật thời gian
function saveAllDataToLocalStorage(updateTimestamp = true) {
    localStorage.setItem('vocabularyData', JSON.stringify(vocabulary));
    localStorage.setItem('wordPackages', JSON.stringify(wordPackages));
    localStorage.setItem('wordTopics', JSON.stringify(wordTopics));
    localStorage.setItem('wordSynonyms', JSON.stringify(wordSynonyms));

    if (updateTimestamp) {
        localStorage.setItem('lastUpdated', new Date().toISOString());
    }
}

// Thay thế hàm saveVocabulary cũ
function saveVocabulary() {
    localStorage.setItem('vocabularyData', JSON.stringify(vocabulary));
    localStorage.setItem('lastUpdated', new Date().toISOString());
}

// Thay thế hàm saveTopics cũ
function saveTopics() {
    localStorage.setItem('wordTopics', JSON.stringify(wordTopics));
    localStorage.setItem('lastUpdated', new Date().toISOString());
}

// Thay thế hàm saveSynonyms cũ
function saveSynonyms() {
    localStorage.setItem('wordSynonyms', JSON.stringify(wordSynonyms));
    localStorage.setItem('lastUpdated', new Date().toISOString());
}

// Chuyển tab giao diện
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

// Hiển thị từ vựng random
let wordList = [];
let currentIndex = 0;

// Chức năng học từ mới nâng cao
function initLearnTab() {
    // Khởi tạo danh sách gói từ vựng cho phần học từ mới
    const packageSelect = document.getElementById('learn-package');
    packageSelect.innerHTML = '<option value="all">Tất cả từ vựng</option>';

    // Thêm các gói từ vựng
    for (const pack in wordPackages) {
        const option = document.createElement('option');
        option.value = pack;
        option.textContent = pack;
        packageSelect.appendChild(option);
    }

    // Thêm các chủ đề như là các gói
    for (const topic in wordTopics) {
        const option = document.createElement('option');
        option.value = 'topic:' + topic;
        option.textContent = 'Chủ đề: ' + topic;
        packageSelect.appendChild(option);
    }

    // Khởi tạo danh sách từ
    wordList = Object.keys(vocabulary);
    shuffleArray(wordList);
    currentIndex = 0;
    learnedWordsCount = 0;

    // Event listeners cho các nút chuyển đổi kiểu luyện tập
    var btnDictation = document.getElementById('task-dictation');
    if (btnDictation) btnDictation.addEventListener('click', function () {
        switchLearnTask('dictation-task');
    });
    var btnTranslation = document.getElementById('task-translation');
    if (btnTranslation) btnTranslation.addEventListener('click', function () {
        switchLearnTask('translation-task');
    });

    // Event listeners cho task nghe viết từ
    var btnDictSpeak = document.getElementById('dictation-speak');
    if (btnDictSpeak) btnDictSpeak.addEventListener('click', speakCurrentWord);
    var btnCheckDict = document.getElementById('check-dictation');
    if (btnCheckDict) btnCheckDict.addEventListener('click', checkDictation);
    var btnDictNext = document.getElementById('dictation-next');
    if (btnDictNext) btnDictNext.addEventListener('click', nextWord);

    // Task xem nghĩa viết từ
    var btnCheckWord = document.getElementById('check-word');
    if (btnCheckWord) btnCheckWord.addEventListener('click', checkTranslationTask);
    var btnTransNext = document.getElementById('translation-next');
    if (btnTransNext) btnTransNext.addEventListener('click', nextWordTranslationTask);

    // Sự kiện khi thay đổi gói từ vựng
    var selLearnPkg = document.getElementById('learn-package');
    if (selLearnPkg) selLearnPkg.addEventListener('change', changeLearnPackage);

    // Thêm sự kiện phím tắt cho phần học từ mới
    document.addEventListener('keydown', handleLearnKeydown);

    // Sự kiện cho nút phát âm từ hiện tại
    var btnWordSpeak = document.getElementById('word-speak');
    if (btnWordSpeak) btnWordSpeak.addEventListener('click', speakCurrentWord);

    // Thêm sự kiện Enter khi nhập từ
    var inpDict = document.getElementById('dictation-input');
    if (inpDict) inpDict.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') checkDictation();
    });

    var inpWord = document.getElementById('word-input');
    if (inpWord) inpWord.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') checkTranslationTask();
    });

    // Hiển thị từ đầu tiên
    showCurrentWord();
    showTranslationTask();
    updateLearnProgress();
}

function switchLearnTask(taskId) {
    // Bỏ active tất cả các nút và task
    document.querySelectorAll('.task-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.practice-section').forEach(section => section.classList.remove('active-task'));

    // Active nút và task mới
    let btnId;
    if (taskId === 'dictation-task') btnId = 'task-dictation';
    else if (taskId === 'translation-task') btnId = 'task-translation';

    document.getElementById(btnId).classList.add('active');
    document.getElementById(taskId).classList.add('active-task');

    // Cập nhật giao diện dựa vào task được chọn
    if (taskId === 'dictation-task') {
        prepareNewWord();
    } else if (taskId === 'translation-task') {
        showTranslationTask();
    }
}

function changeLearnPackage() {
    const packageValue = document.getElementById('learn-package').value;

    // Lấy danh sách từ dựa trên gói/chủ đề đã chọn
    if (packageValue === 'all') {
        wordList = Object.keys(vocabulary);
    } else if (packageValue.startsWith('topic:')) {
        const topicName = packageValue.substring(6);
        wordList = wordTopics[topicName] || [];
    } else {
        wordList = wordPackages[packageValue] || [];
    }

    if (wordList.length === 0) {
        showToast('Không có từ vựng nào trong gói này!', 'warning');
        return;
    }

    // Random từ vựng
    shuffleArray(wordList);
    currentIndex = 0;

    // Hiển thị từ đầu tiên
    showCurrentWord();
    showTranslationTask();
    updateLearnProgress();
}

function prepareNewWord() {
    if (wordList.length === 0) return;

    // Reset input và kết quả cho dictation
    document.getElementById('dictation-input').value = '';
    document.getElementById('dictation-result').textContent = '';
}

function showCurrentWord() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];

    // Hiển thị từ hiện tại trong thẻ từ vựng chính
    var elCurrentWord = document.getElementById('current-word');
    if (elCurrentWord) elCurrentWord.textContent = word;
    var elWordTranslation = document.getElementById('word-translation');
    if (elWordTranslation) elWordTranslation.textContent = vocabulary[word] || '';

    // Reset các input và kết quả
    prepareNewWord();
}

function nextWord() {
    currentIndex = (currentIndex + 1) % wordList.length;
    showCurrentWord();
    showTranslationTask();
    updateLearnProgress();
}

function showTranslationTask() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];
    document.getElementById('meaning-text').textContent = vocabulary[word] || '';
    document.getElementById('word-input').value = '';
    document.getElementById('word-result').textContent = '';
}

function nextWordTranslationTask() {
    nextWord();
}

function speakCurrentWord() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];

    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';

        // Sử dụng voice đã chọn trong cài đặt (nếu có)
        const selectedVoice = localStorage.getItem('selectedVoice');
        if (selectedVoice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) utter.voice = voice;
        }

        // Sử dụng tốc độ đọc từ cài đặt (nếu có)
        const speechRate = localStorage.getItem('speechRate');
        if (speechRate) {
            utter.rate = parseFloat(speechRate);
        }

        window.speechSynthesis.speak(utter);
    }
}

function checkDictation() {
    const userInput = document.getElementById('dictation-input').value.trim().toLowerCase();
    const currentWord = wordList[currentIndex].toLowerCase();
    const resultBox = document.getElementById('dictation-result');

    if (userInput === '') {
        resultBox.textContent = 'Vui lòng nhập từ bạn nghe được!';
        resultBox.className = 'result-box';
        return;
    }

    if (userInput === currentWord) {
        resultBox.textContent = '✓ Chính xác!';
        resultBox.className = 'result-box correct';
        markWordAsLearned();
    } else {
        resultBox.textContent = `✗ Không chính xác! Từ đúng là "${currentWord}".`;
        resultBox.className = 'result-box incorrect';
    }

    updateLearnProgress();
}

function checkTranslationTask() {
    const userInput = document.getElementById('word-input').value.trim().toLowerCase();
    const currentWord = wordList[currentIndex].toLowerCase();
    const resultBox = document.getElementById('word-result');

    if (userInput === '') {
        resultBox.textContent = 'Vui lòng nhập từ tiếng Anh!';
        resultBox.className = 'result-box';
        return;
    }

    if (userInput === currentWord) {
        resultBox.textContent = '✓ Chính xác!';
        resultBox.className = 'result-box correct';
        markWordAsLearned();
    } else {
        resultBox.textContent = `✗ Không chính xác! Từ đúng là "${currentWord}".`;
        resultBox.className = 'result-box incorrect';
    }

    updateLearnProgress();
}

// Thêm logic cho Flashcard nhanh
function showQuickCard() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];

    document.getElementById('quick-card-word').textContent = word;
    document.getElementById('quick-card-translation').textContent = vocabulary[word] || '';

    // Reset về mặt trước của thẻ
    document.getElementById('quick-card-front').classList.add('active');
    document.getElementById('quick-card-back').classList.remove('active');
}

function flipQuickCard() {
    const frontCard = document.getElementById('quick-card-front');
    const backCard = document.getElementById('quick-card-back');

    if (frontCard.classList.contains('active')) {
        frontCard.classList.remove('active');
        backCard.classList.add('active');
    } else {
        frontCard.classList.add('active');
        backCard.classList.remove('active');
    }
}

function nextQuickCard() {
    nextWord();
}

function prevQuickCard() {
    currentIndex = (currentIndex - 1 + wordList.length) % wordList.length;
    showCurrentWord();
    showTranslationTask();
    showQuickCard();
    updateLearnProgress();
}

function handleLearnKeydown(e) {
    // Kiểm tra xem tab học từ mới có đang hiển thị không
    const learnTab = document.getElementById('learn');
    if (!learnTab.closest('.tab-pane').classList.contains('active')) return;

    // Xử lý phím tắt
    if (e.code === 'ArrowRight') {
        nextWord();
    } else if (e.code === 'ArrowLeft') {
        prevQuickCard();
    }
    // Đã loại bỏ phần xử lý phím Space cho quick-flashcard-task vì phần này không còn tồn tại
}

// Đánh dấu từ đã học
let learnedWords = new Set();
let learnedWordsCount = 0;

function markWordAsLearned() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];

    if (!learnedWords.has(word)) {
        learnedWords.add(word);
        learnedWordsCount++;
        saveLearnedWords();
    }
}

function updateLearnProgress() {
    if (wordList.length === 0) return;

    const percentage = Math.round((learnedWordsCount / wordList.length) * 100);

    document.getElementById('learn-word-count').textContent =
        `Từ ${currentIndex + 1}/${wordList.length} - Đã học: ${learnedWordsCount} (${percentage}%)`;

    document.getElementById('learning-progress').style.width = `${percentage}%`;
}

function showWord() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];
    document.getElementById('current-word').textContent = word;
    document.getElementById('word-translation').textContent = '...';
    // Reset input và kết quả cho dictation
    document.getElementById('dictation-input').value = '';
    document.getElementById('dictation-result').textContent = '';
    // Hiển thị từ cho task nghe viết từ
    document.getElementById('dictation-input').value = '';
    document.getElementById('dictation-result').textContent = '';
}

// Chức năng Quiz (kiểm tra từ vựng)
let quizQuestions = [];
let currentQuestion = 0;
let selectedAnswer = null;
let quizAnswers = [];

function initQuizTab() {
    // Khởi tạo danh sách gói từ vựng
    const packageSelect = document.getElementById('quiz-package');
    packageSelect.innerHTML = '<option value="all">Tất cả từ vựng</option>';

    for (const pack in wordPackages) {
        const option = document.createElement('option');
        option.value = pack;
        option.textContent = pack;
        packageSelect.appendChild(option);
    }

    // Thêm các chủ đề như là các gói
    for (const topic in wordTopics) {
        const option = document.createElement('option');
        option.value = 'topic:' + topic;
        option.textContent = 'Chủ đề: ' + topic;
        packageSelect.appendChild(option);
    }

    document.getElementById('start-quiz').addEventListener('click', startQuiz);
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('submit-quiz').addEventListener('click', submitQuiz);
    document.getElementById('view-details').addEventListener('click', showQuizDetails);
    document.getElementById('close-quiz-details').addEventListener('click', closeQuizDetails);
}

function startQuiz() {
    const packageValue = document.getElementById('quiz-package').value;
    const quizCount = document.getElementById('quiz-count').value;
    const quizType = document.querySelector('input[name="quiz-type"]:checked').value;

    // Lấy danh sách từ dựa trên gói/chủ đề đã chọn
    let quizWordList = [];

    if (packageValue === 'all') {
        quizWordList = Object.keys(vocabulary);
    } else if (packageValue.startsWith('topic:')) {
        const topicName = packageValue.substring(6);
        quizWordList = wordTopics[topicName] || [];
    } else {
        quizWordList = wordPackages[packageValue] || [];
    }

    if (quizWordList.length === 0) {
        showToast('Không có từ vựng nào trong gói này!', 'warning');
        return;
    }

    // Random từ vựng
    shuffleArray(quizWordList);

    // Giới hạn số lượng câu hỏi
    if (quizCount !== 'all' && quizWordList.length > parseInt(quizCount)) {
        quizWordList = quizWordList.slice(0, parseInt(quizCount));
    }

    // Tạo câu hỏi
    quizQuestions = [];

    for (const word of quizWordList) {
        if (!vocabulary[word]) continue; // Bỏ qua nếu từ không có trong từ điển

        const correctAnswer = quizType === 'eng_to_viet' ? vocabulary[word] : word;
        const question = quizType === 'eng_to_viet' ? word : vocabulary[word];

        // Tạo các lựa chọn
        let options = [correctAnswer];

        // Thêm 3 lựa chọn ngẫu nhiên
        if (quizType === 'eng_to_viet') {
            // Lấy các nghĩa tiếng Việt khác làm lựa chọn
            const otherAnswers = Object.values(vocabulary).filter(
                value => value !== correctAnswer
            );
            shuffleArray(otherAnswers);
            options = options.concat(otherAnswers.slice(0, 3));
        } else {
            // Lấy các từ tiếng Anh khác làm lựa chọn
            const otherAnswers = Object.keys(vocabulary).filter(
                key => key !== word
            );
            shuffleArray(otherAnswers);
            options = options.concat(otherAnswers.slice(0, 3));
        }

        // Random thứ tự các lựa chọn
        shuffleArray(options);

        quizQuestions.push({
            question: question,
            options: options,
            correct: correctAnswer,
            type: quizType
        });
    }

    // Bắt đầu quiz
    currentQuestion = 0;
    quizAnswers = Array(quizQuestions.length).fill(null);
    showQuestion();

    document.getElementById('next-question').disabled = true;
    document.getElementById('submit-quiz').disabled = quizQuestions.length <= 1;

    // Cập nhật trạng thái
    updateQuizStatus();
}

function showQuestion() {
    if (currentQuestion >= quizQuestions.length) return;

    const q = quizQuestions[currentQuestion];
    document.getElementById('quiz-question-text').textContent = q.type === 'eng_to_viet'
        ? `Từ "${q.question}" có nghĩa là gì?`
        : `"${q.question}" trong tiếng Anh là gì?`;

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    q.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.dataset.index = index;

        const radioCircle = document.createElement('div');
        radioCircle.className = 'radio-circle';

        const optionText = document.createElement('div');
        optionText.textContent = option;

        optionDiv.appendChild(radioCircle);
        optionDiv.appendChild(optionText);

        optionDiv.addEventListener('click', () => selectOption(index));

        optionsContainer.appendChild(optionDiv);
    });

    // Phục hồi câu trả lời đã chọn (nếu có)
    if (quizAnswers[currentQuestion] !== null) {
        const savedOption = document.querySelector(`.quiz-option[data-index="${quizAnswers[currentQuestion]}"]`);
        if (savedOption) {
            savedOption.classList.add('selected');
            selectedAnswer = quizAnswers[currentQuestion];
            document.getElementById('next-question').disabled = false;
        }
    } else {
        selectedAnswer = null;
        document.getElementById('next-question').disabled = true;
    }

    updateQuizStatus();
}

function selectOption(index) {
    // Bỏ chọn tất cả các lựa chọn
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Chọn lựa chọn mới
    document.querySelector(`.quiz-option[data-index="${index}"]`).classList.add('selected');

    selectedAnswer = index;
    quizAnswers[currentQuestion] = index;

    document.getElementById('next-question').disabled = false;
}

function nextQuestion() {
    if (currentQuestion < quizQuestions.length - 1) {
        currentQuestion++;
        showQuestion();
    }
}

function submitQuiz() {
    // Kiểm tra xem đã trả lời hết câu hỏi chưa
    const unanswered = quizAnswers.filter(answer => answer === null).length;

    if (unanswered > 0) {
        const confirmSubmit = confirm(`Bạn chưa trả lời ${unanswered} câu hỏi. Bạn có chắc muốn nộp bài không?`);
        if (!confirmSubmit) return;
    }

    // Tính điểm
    let correct = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
        if (quizAnswers[i] !== null) {
            const selectedOption = quizQuestions[i].options[quizAnswers[i]];
            if (selectedOption === quizQuestions[i].correct) {
                correct++;
            }
        }
    }

    const score = Math.round((correct / quizQuestions.length) * 100);

    // Hiển thị kết quả
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.innerHTML = `
        <div>Đã hoàn thành: ${quizQuestions.length - unanswered}/${quizQuestions.length}</div>
        <div>Đúng: ${correct}/${quizQuestions.length} (${score}%)</div>
    `;

    // Hiển thị nút xem chi tiết
    document.getElementById('view-details').disabled = false;
}

function showQuizDetails() {
    // Hiển thị hộp thoại kết quả chi tiết
    const detailsContent = document.getElementById('quiz-details-content');
    detailsContent.innerHTML = '';

    for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        const selectedOption = quizAnswers[i] !== null ? q.options[quizAnswers[i]] : 'Không trả lời';
        const isCorrect = selectedOption === q.correct;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-detail-item';
        questionDiv.innerHTML = `
            <h4>Câu ${i + 1}: ${q.type === 'eng_to_viet' ? q.question : q.question}</h4>
            <div>Câu trả lời của bạn: <span class="${isCorrect ? 'correct' : 'incorrect'}">${selectedOption}</span></div>
            ${!isCorrect ? `<div>Đáp án đúng: <span class="correct">${q.correct}</span></div>` : ''}
        `;

        detailsContent.appendChild(questionDiv);
    }

    // Hiển thị hộp thoại
    document.getElementById('quiz-details-dialog').style.display = 'block';
}

function closeQuizDetails() {
    document.getElementById('quiz-details-dialog').style.display = 'none';
}

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateQuizStatus() {
    // Cập nhật trạng thái của quiz
    const answered = quizAnswers.filter(answer => answer !== null).length;
    document.getElementById('quiz-status').textContent =
        `Câu hỏi ${currentQuestion + 1}/${quizQuestions.length} - Đã trả lời: ${answered}/${quizQuestions.length}`;
}

// Toast notification
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = 1;
    }, 10);
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Flashcard Feature (Thẻ ghi nhớ)
let flashcardWords = [];
let currentFlashcardIndex = 0;

function initFlashcardTab() {
    // Khởi tạo danh sách gói từ vựng cho flashcard
    const packageSelect = document.getElementById('flashcard-package');
    packageSelect.innerHTML = '<option value="all">Tất cả từ vựng</option>';

    // Thêm các gói từ vựng
    for (const pack in wordPackages) {
        const option = document.createElement('option');
        option.value = pack;
        option.textContent = pack;
        packageSelect.appendChild(option);
    }

    // Thêm các chủ đề như là các gói
    for (const topic in wordTopics) {
        const option = document.createElement('option');
        option.value = 'topic:' + topic;
        option.textContent = 'Chủ đề: ' + topic;
        packageSelect.appendChild(option);
    }

    // Load từ đã học từ localStorage
    try {
        const savedLearnedWords = JSON.parse(localStorage.getItem('learnedWords')) || [];
        learnedWords = new Set(savedLearnedWords);
    } catch (e) {
        learnedWords = new Set();
    }

    // Khởi tạo flashcard đầu tiên
    document.getElementById('flashcard-package').addEventListener('change', loadFlashcardWords);
    document.getElementById('prev-flashcard').addEventListener('click', prevFlashcard);
    document.getElementById('next-flashcard').addEventListener('click', nextFlashcard);
    document.getElementById('flip-flashcard').addEventListener('click', flipFlashcard);
    document.getElementById('mark-learned').addEventListener('click', toggleMarkLearned);
    document.getElementById('flashcard-speak').addEventListener('click', speakFlashcardWord);
    document.getElementById('toggle-hint').addEventListener('click', toggleHint);

    // Thêm sự kiện click để lật thẻ khi nhấp vào flashcard
    document.getElementById('flashcard-front').addEventListener('click', function (e) {
        // Chỉ lật khi không nhấp vào nút phát âm
        if (e.target.id !== 'flashcard-speak' &&
            !e.target.closest('#flashcard-speak')) {
            flipFlashcard();
        }
    });

    document.getElementById('flashcard-back').addEventListener('click', flipFlashcard);

    // Thêm sự kiện phím tắt
    document.addEventListener('keydown', function (e) {
        const flashcardTab = document.getElementById('flashcard');
        if (flashcardTab.closest('.tab-pane').classList.contains('active')) {
            if (e.code === 'Space') {
                flipFlashcard();
                e.preventDefault();
            } else if (e.code === 'ArrowLeft') {
                prevFlashcard();
            } else if (e.code === 'ArrowRight') {
                nextFlashcard();
            } else if (e.code === 'KeyL') {
                toggleMarkLearned();
            }
        }
    });

    loadFlashcardWords();
}

function loadFlashcardWords() {
    const packageValue = document.getElementById('flashcard-package').value;

    // Lấy danh sách từ dựa trên gói/chủ đề đã chọn
    if (packageValue === 'all') {
        flashcardWords = Object.keys(vocabulary);
    } else if (packageValue.startsWith('topic:')) {
        const topicName = packageValue.substring(6);
        flashcardWords = wordTopics[topicName] || [];
    } else {
        flashcardWords = wordPackages[packageValue] || [];
    }

    if (flashcardWords.length === 0) {
        showToast('Không có từ vựng nào trong gói này!', 'warning');
        return;
    }

    // Random từ vựng
    shuffleArray(flashcardWords);

    // Sắp xếp từ: đưa những từ chưa học lên đầu
    flashcardWords.sort((a, b) => {
        const aLearned = learnedWords.has(a);
        const bLearned = learnedWords.has(b);
        return aLearned === bLearned ? 0 : aLearned ? 1 : -1;
    });

    currentFlashcardIndex = 0;
    showFlashcard();
}

function showFlashcard() {
    if (flashcardWords.length === 0) {
        showToast('Không có từ vựng nào để hiển thị!', 'warning');
        return;
    }

    const word = flashcardWords[currentFlashcardIndex];
    document.getElementById('flashcard-word').textContent = word;
    document.getElementById('flashcard-translation').textContent = vocabulary[word] || '';

    // Đặt ví dụ mẫu cho từ
    const example = generateExample(word);
    document.getElementById('flashcard-example').textContent = example;

    // Cập nhật UI phản ánh trạng thái đã học hay chưa
    updateLearnedState();

    // Reset flashcard về trạng thái mặt trước
    document.getElementById('flashcard-front').classList.add('active');
    document.getElementById('flashcard-back').classList.remove('active');

    // Cập nhật thanh tiến trình
    updateFlashcardProgress();
}

function generateExample(word) {
    // Hàm tạo câu ví dụ đơn giản
    const exampleTemplates = [
        `This is an example sentence with the word "${word}".`,
        `Can you use "${word}" in a sentence?`,
        `The word "${word}" is important in this context.`,
        `Let me show you how to use "${word}" correctly.`,
        `"${word}" is a word you should remember.`
    ];

    return exampleTemplates[Math.floor(Math.random() * exampleTemplates.length)];
}

function flipFlashcard() {
    // Sử dụng phương pháp hiển thị/ẩn đơn giản với các thẻ riêng biệt
    const frontCard = document.getElementById('flashcard-front');
    const backCard = document.getElementById('flashcard-back');

    if (frontCard.classList.contains('active')) {
        frontCard.classList.remove('active');
        backCard.classList.add('active');
    } else {
        frontCard.classList.add('active');
        backCard.classList.remove('active');
    }

    console.log('Đã lật thẻ - phương pháp mới!');
}

function nextFlashcard() {
    if (currentFlashcardIndex < flashcardWords.length - 1) {
        currentFlashcardIndex++;
        showFlashcard();
    } else {
        // Quay lại từ đầu tiên khi đến từ cuối cùng
        showToast('Đã đến từ cuối cùng, quay lại từ đầu tiên!', 'info');
        currentFlashcardIndex = 0;
        showFlashcard();
    }
}

function prevFlashcard() {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
        showFlashcard();
    } else {
        // Đi đến từ cuối cùng khi đang ở từ đầu tiên và nhấn nút lùi
        showToast('Đã đến từ đầu tiên, quay lại từ cuối cùng!', 'info');
        currentFlashcardIndex = flashcardWords.length - 1;
        showFlashcard();
    }
}

function toggleMarkLearned() {
    const word = flashcardWords[currentFlashcardIndex];

    if (learnedWords.has(word)) {
        learnedWords.delete(word);
        showToast(`Đã bỏ đánh dấu từ "${word}" khỏi danh sách đã học!`, 'info');
    } else {
        learnedWords.add(word);
        showToast(`Đã đánh dấu từ "${word}" là đã học!`, 'success');
    }

    updateLearnedState();
    saveLearnedWords();
    updateFlashcardProgress();
}

function updateLearnedState() {
    const word = flashcardWords[currentFlashcardIndex];
    const markButton = document.getElementById('mark-learned');

    if (learnedWords.has(word)) {
        markButton.textContent = 'Bỏ đánh dấu';
        markButton.classList.remove('success');
        markButton.classList.add('secondary');
    } else {
        markButton.textContent = 'Đánh dấu đã học';
        markButton.classList.remove('secondary');
        markButton.classList.add('success');
    }
}

function saveLearnedWords() {
    localStorage.setItem('learnedWords', JSON.stringify([...learnedWords]));
}

function updateFlashcardProgress() {
    const learnedCount = flashcardWords.filter(word => learnedWords.has(word)).length;
    const percentage = Math.round((learnedCount / flashcardWords.length) * 100);

    document.getElementById('flashcard-progress').textContent =
        `Từ ${currentFlashcardIndex + 1}/${flashcardWords.length} - Đã học: ${learnedCount} (${percentage}%)`;

    document.getElementById('learn-progress').style.width = `${percentage}%`;
}

function speakFlashcardWord() {
    const word = flashcardWords[currentFlashcardIndex];

    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';

        // Sử dụng voice đã chọn trong cài đặt (nếu có)
        const selectedVoice = localStorage.getItem('selectedVoice');
        if (selectedVoice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) utter.voice = voice;
        }

        // Sử dụng tốc độ đọc từ cài đặt (nếu có)
        const speechRate = localStorage.getItem('speechRate');
        if (speechRate) {
            utter.rate = parseFloat(speechRate);
        }

        window.speechSynthesis.speak(utter);
    }
}

function toggleHint() {
    const example = document.getElementById('flashcard-example');

    if (example.style.display === 'none') {
        example.style.display = 'block';
        document.getElementById('toggle-hint').textContent = 'Ẩn gợi ý';
    } else {
        example.style.display = 'none';
        document.getElementById('toggle-hint').textContent = 'Hiện gợi ý';
    }
}

// Topics Management (Quản lý chủ đề)
function initTopicsTab() {
    loadTopicsList();

    // Event listeners
    document.getElementById('new-topic').addEventListener('click', createNewTopic);
    document.getElementById('delete-topic').addEventListener('click', deleteTopic);
    document.getElementById('add-to-topic').addEventListener('click', showAddToTopicDialog);
    document.getElementById('remove-from-topic').addEventListener('click', removeFromTopic);
    document.getElementById('auto-classify').addEventListener('click', autoClassifyWords);
}

function loadTopicsList() {
    const topicsList = document.getElementById('topics-list');
    topicsList.innerHTML = '';

    // Tạo danh sách các chủ đề
    for (const topic in wordTopics) {
        const li = document.createElement('li');
        li.textContent = topic;
        li.dataset.topic = topic;
        li.onclick = function () {
            document.querySelectorAll('#topics-list li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
            loadTopicWords(topic);
        };
        topicsList.appendChild(li);
    }
}

function loadTopicWords(topic) {
    const topicWordsList = document.getElementById('topic-words-list');
    topicWordsList.innerHTML = '';

    if (!wordTopics[topic]) return;

    // Hiển thị danh sách từ trong chủ đề
    wordTopics[topic].forEach(word => {
        if (!vocabulary[word]) return; // Bỏ qua nếu từ không tồn tại trong từ điển

        const li = document.createElement('li');
        li.textContent = word + ' - ' + vocabulary[word];
        li.dataset.word = word;
        li.onclick = function () {
            document.querySelectorAll('#topic-words-list li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
        };
        topicWordsList.appendChild(li);
    });
}

function createNewTopic() {
    const topicName = prompt('Nhập tên chủ đề mới:');
    if (!topicName) return;

    if (wordTopics[topicName]) {
        showToast('Chủ đề này đã tồn tại!', 'warning');
        return;
    }

    // Tạo chủ đề mới
    wordTopics[topicName] = [];
    saveTopics();

    // Cập nhật giao diện
    loadTopicsList();
    showToast(`Đã tạo chủ đề "${topicName}" thành công!`, 'success');
}

function deleteTopic() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        showToast('Vui lòng chọn một chủ đề để xóa!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;
    const confirmDelete = confirm(`Bạn có chắc muốn xóa chủ đề "${topicName}" không?`);
    if (!confirmDelete) return;

    // Xóa chủ đề
    delete wordTopics[topicName];
    saveTopics();

    // Cập nhật giao diện
    loadTopicsList();
    document.getElementById('topic-words-list').innerHTML = '';
    showToast(`Đã xóa chủ đề "${topicName}"!`, 'success');
}

function showAddToTopicDialog() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        showToast('Vui lòng chọn một chủ đề trước!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;

    // Chuẩn bị hộp thoại chọn từ
    document.getElementById('selector-dialog-title').textContent = `Chọn từ để thêm vào chủ đề "${topicName}"`;

    const tableBody = document.getElementById('word-selector-body');
    tableBody.innerHTML = '';

    // Lấy danh sách từ đã có trong chủ đề
    const topicWords = new Set(wordTopics[topicName] || []);

    // Hiển thị tất cả từ trong từ điển
    Object.keys(vocabulary).forEach(word => {
        const row = document.createElement('tr');

        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.word = word;
        checkbox.checked = topicWords.has(word);
        checkboxCell.appendChild(checkbox);

        const engCell = document.createElement('td');
        engCell.textContent = word;

        const vietCell = document.createElement('td');
        vietCell.textContent = vocabulary[word];

        row.appendChild(checkboxCell);
        row.appendChild(engCell);
        row.appendChild(vietCell);
        tableBody.appendChild(row);
    });

    // Cài đặt các nút trong hộp thoại
    document.getElementById('select-all').onclick = function () {
        document.querySelectorAll('#word-selector-body input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
    };

    document.getElementById('deselect-all').onclick = function () {
        document.querySelectorAll('#word-selector-body input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    };

    document.getElementById('save-selection').onclick = function () {
        saveWordsToTopic(topicName);
    };

    document.getElementById('cancel-selection').onclick = function () {
        document.getElementById('word-selector-dialog').style.display = 'none';
    };

    // Filter function cho ô tìm kiếm
    document.getElementById('search-words').oninput = function () {
        const searchText = this.value.trim().toLowerCase();
        document.querySelectorAll('#word-selector-body tr').forEach(row => {
            const word = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const meaning = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

            if (word.includes(searchText) || meaning.includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    // Hiển thị hộp thoại
    document.getElementById('word-selector-dialog').style.display = 'block';
}

function saveWordsToTopic(topicName) {
    const selectedWords = [];

    document.querySelectorAll('#word-selector-body input[type="checkbox"]:checked').forEach(cb => {
        selectedWords.push(cb.dataset.word);
    });

    // Cập nhật chủ đề
    wordTopics[topicName] = selectedWords;
    saveTopics();

    // Cập nhật giao diện
    loadTopicWords(topicName);
    document.getElementById('word-selector-dialog').style.display = 'none';
    showToast(`Đã cập nhật từ vựng trong chủ đề "${topicName}"!`, 'success');
}

function removeFromTopic() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    const selectedWord = document.querySelector('#topic-words-list li.selected');

    if (!selectedTopic || !selectedWord) {
        showToast('Vui lòng chọn chủ đề và từ cần xóa!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;
    const word = selectedWord.dataset.word;

    // Xóa từ khỏi chủ đề
    if (wordTopics[topicName]) {
        wordTopics[topicName] = wordTopics[topicName].filter(w => w !== word);
        saveTopics();

        // Cập nhật giao diện
        loadTopicWords(topicName);
        showToast(`Đã xóa từ "${word}" khỏi chủ đề "${topicName}"!`, 'success');
    }
}

function autoClassifyWords() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        showToast('Vui lòng chọn một chủ đề để phân loại tự động!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;

    // Chức năng phân loại tự động sẽ cần logic phức tạp hơn
    // Trong version web này, chúng ta sẽ chỉ làm mẫu với một số từ khóa đơn giản

    const keywords = {
        "Giao tiếp cơ bản": ["hello", "goodbye", "thank", "sorry", "greet"],
        "Công việc & Sự nghiệp": ["work", "job", "career", "office", "employee", "salary"],
        "Giáo dục & Học tập": ["school", "student", "learn", "book", "study"],
        "Sản xuất & Công nghiệp": ["factory", "machine", "product", "industry"],
        "Nghề nghiệp": ["doctor", "teacher", "engineer", "nurse", "chef"],
        "Cảm xúc & Tính cách": ["happy", "sad", "angry", "feel", "emotion"],
        "Công nghệ & Máy móc": ["computer", "phone", "technology", "software", "device"],
    };

    // Lấy các từ khóa cho chủ đề được chọn
    const topicKeywords = keywords[topicName] || [];

    if (topicKeywords.length === 0) {
        showToast(`Không có từ khóa để phân loại tự động cho chủ đề "${topicName}"!`, 'warning');
        return;
    }

    // Tìm các từ phù hợp với chủ đề
    const suggestedWords = Object.keys(vocabulary).filter(word => {
        const lowerWord = word.toLowerCase();
        return topicKeywords.some(keyword => lowerWord.includes(keyword.toLowerCase()));
    });

    if (suggestedWords.length === 0) {
        showToast('Không tìm thấy từ nào phù hợp với chủ đề này!', 'warning');
        return;
    }

    // Cập nhật chủ đề với các từ được đề xuất
    wordTopics[topicName] = [...new Set([...wordTopics[topicName] || [], ...suggestedWords])];
    saveTopics();

    // Cập nhật giao diện
    loadTopicWords(topicName);
    showToast(`Đã thêm ${suggestedWords.length} từ vào chủ đề "${topicName}"!`, 'success');
}

// Synonyms Management (Quản lý từ đồng nghĩa)
function initSynonymsTab() {
    loadSynonymsList();

    // Event listeners
    document.getElementById('new-synonym-group').addEventListener('click', createNewSynonymGroup);
    document.getElementById('delete-synonym-group').addEventListener('click', deleteSynonymGroup);
    document.getElementById('add-to-synonym').addEventListener('click', showAddToSynonymDialog);
    document.getElementById('remove-from-synonym').addEventListener('click', removeFromSynonym);
    document.getElementById('auto-update-synonyms').addEventListener('click', autoUpdateSynonyms);
}

function loadSynonymsList() {
    const synonymsList = document.getElementById('synonyms-list');
    synonymsList.innerHTML = '';

    // Tạo danh sách các nhóm từ đồng nghĩa
    for (const group in wordSynonyms) {
        const li = document.createElement('li');
        li.textContent = group;
        li.dataset.group = group;
        li.onclick = function () {
            document.querySelectorAll('#synonyms-list li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
            loadSynonymWords(group);
        };
        synonymsList.appendChild(li);
    }
}

function loadSynonymWords(group) {
    const synonymWordsList = document.getElementById('synonym-words-list');
    synonymWordsList.innerHTML = '';

    if (!wordSynonyms[group]) return;

    // Hiển thị danh sách từ trong nhóm đồng nghĩa
    wordSynonyms[group].forEach(word => {
        if (!vocabulary[word]) return; // Bỏ qua nếu từ không tồn tại trong từ điển

        const li = document.createElement('li');
        li.textContent = word + ' - ' + vocabulary[word];
        li.dataset.word = word;
        li.onclick = function () {
            document.querySelectorAll('#synonym-words-list li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
        };
        synonymWordsList.appendChild(li);
    });
}

function createNewSynonymGroup() {
    const groupName = prompt('Nhập tên nhóm từ đồng nghĩa mới:');
    if (!groupName) return;

    if (wordSynonyms[groupName]) {
        showToast('Nhóm từ đồng nghĩa này đã tồn tại!', 'warning');
        return;
    }

    // Tạo nhóm từ đồng nghĩa mới
    wordSynonyms[groupName] = [];
    saveSynonyms();

    // Cập nhật giao diện
    loadSynonymsList();
    showToast(`Đã tạo nhóm từ đồng nghĩa "${groupName}" thành công!`, 'success');
}

function deleteSynonymGroup() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        showToast('Vui lòng chọn một nhóm từ đồng nghĩa để xóa!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;
    const confirmDelete = confirm(`Bạn có chắc muốn xóa nhóm từ đồng nghĩa "${groupName}" không?`);
    if (!confirmDelete) return;

    // Xóa nhóm từ đồng nghĩa
    delete wordSynonyms[groupName];
    saveSynonyms();

    // Cập nhật giao diện
    loadSynonymsList();
    document.getElementById('synonym-words-list').innerHTML = '';
    showToast(`Đã xóa nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

function showAddToSynonymDialog() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        showToast('Vui lòng chọn một nhóm từ đồng nghĩa trước!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;

    // Chuẩn bị hộp thoại chọn từ
    document.getElementById('selector-dialog-title').textContent = `Chọn từ để thêm vào nhóm từ đồng nghĩa "${groupName}"`;

    const tableBody = document.getElementById('word-selector-body');
    tableBody.innerHTML = '';

    // Lấy danh sách từ đã có trong nhóm từ đồng nghĩa
    const groupWords = new Set(wordSynonyms[groupName] || []);

    // Hiển thị tất cả từ trong từ điển
    Object.keys(vocabulary).forEach(word => {
        const row = document.createElement('tr');

        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.word = word;
        checkbox.checked = groupWords.has(word);
        checkboxCell.appendChild(checkbox);

        const engCell = document.createElement('td');
        engCell.textContent = word;

        const vietCell = document.createElement('td');
        vietCell.textContent = vocabulary[word];

        row.appendChild(checkboxCell);
        row.appendChild(engCell);
        row.appendChild(vietCell);
        tableBody.appendChild(row);
    });

    // Cài đặt các nút trong hộp thoại
    document.getElementById('select-all').onclick = function () {
        document.querySelectorAll('#word-selector-body input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
    };

    document.getElementById('deselect-all').onclick = function () {
        document.querySelectorAll('#word-selector-body input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    };

    document.getElementById('save-selection').onclick = function () {
        saveWordsToSynonymGroup(groupName);
    };

    document.getElementById('cancel-selection').onclick = function () {
        document.getElementById('word-selector-dialog').style.display = 'none';
    };

    // Filter function cho ô tìm kiếm
    document.getElementById('search-words').oninput = function () {
        const searchText = this.value.trim().toLowerCase();
        document.querySelectorAll('#word-selector-body tr').forEach(row => {
            const word = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const meaning = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

            if (word.includes(searchText) || meaning.includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    // Hiển thị hộp thoại
    document.getElementById('word-selector-dialog').style.display = 'block';
}

function saveWordsToSynonymGroup(groupName) {
    const selectedWords = [];

    document.querySelectorAll('#word-selector-body input[type="checkbox"]:checked').forEach(cb => {
        selectedWords.push(cb.dataset.word);
    });

    // Cập nhật nhóm từ đồng nghĩa
    wordSynonyms[groupName] = selectedWords;
    saveSynonyms();

    // Cập nhật giao diện
    loadSynonymWords(groupName);
    document.getElementById('word-selector-dialog').style.display = 'none';
    showToast(`Đã cập nhật từ vựng trong nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

function removeFromSynonym() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    const selectedWord = document.querySelector('#synonym-words-list li.selected');

    if (!selectedGroup || !selectedWord) {
        showToast('Vui lòng chọn nhóm từ đồng nghĩa và từ cần xóa!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;
    const word = selectedWord.dataset.word;

    // Xóa từ khỏi nhóm từ đồng nghĩa
    if (wordSynonyms[groupName]) {
        wordSynonyms[groupName] = wordSynonyms[groupName].filter(w => w !== word);
        saveSynonyms();

        // Cập nhật giao diện
        loadSynonymWords(groupName);
        showToast(`Đã xóa từ "${word}" khỏi nhóm từ đồng nghĩa "${groupName}"!`, 'success');
    }
}

function autoUpdateSynonyms() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        showToast('Vui lòng chọn một nhóm từ đồng nghĩa để cập nhật tự động!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;

    // Một số nhóm từ đồng nghĩa phổ biến
    const commonSynonyms = {
        'work_group': ['work', 'job', 'career', 'employment', 'occupation', 'profession'],
        'factory_group': ['factory', 'mill', 'plant', 'workshop', 'industrial facility'],
        'happy_group': ['happy', 'joyful', 'delighted', 'pleased', 'glad', 'cheerful'],
        'sad_group': ['sad', 'unhappy', 'depressed', 'sorrowful', 'gloomy', 'melancholy'],
        'big_group': ['big', 'large', 'great', 'huge', 'enormous', 'gigantic', 'massive'],
        'small_group': ['small', 'little', 'tiny', 'miniature', 'petite', 'microscopic']
    };

    // Thử tìm các từ đồng nghĩa phù hợp
    const synonymSet = commonSynonyms[groupName];
    if (!synonymSet) {
        showToast('Không có dữ liệu về từ đồng nghĩa cho nhóm này!', 'warning');
        return;
    }

    // Tìm các từ trong từ điển có trong danh sách từ đồng nghĩa
    const matchedWords = Object.keys(vocabulary).filter(word => {
        const lowerWord = word.toLowerCase();
        return synonymSet.some(syn => lowerWord === syn.toLowerCase() || lowerWord.includes(syn.toLowerCase()));
    });

    if (matchedWords.length === 0) {
        showToast('Không tìm thấy từ đồng nghĩa phù hợp trong từ điển!', 'warning');
        return;
    }

    // Cập nhật nhóm từ đồng nghĩa
    wordSynonyms[groupName] = [...new Set([...wordSynonyms[groupName] || [], ...matchedWords])];
    saveSynonyms();

    // Cập nhật giao diện
    loadSynonymWords(groupName);
    showToast(`Đã thêm ${matchedWords.length} từ vào nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

// Settings (Cài đặt)
function initSettingsTab() {
    // Khởi tạo danh sách giọng đọc
    loadVoicesList();

    // Load cài đặt đã lưu
    loadSavedSettings();

    // Thêm event listeners
    document.getElementById('speech-speed').addEventListener('input', updateSpeedValue);
    document.getElementById('voice-select').addEventListener('change', updateSelectedVoice);
    document.getElementById('theme-select').addEventListener('change', updateTheme);
    document.getElementById('background-color').addEventListener('input', updateBackgroundColor);
    document.getElementById('select-background').addEventListener('click', selectBackgroundImage);
    document.getElementById('remove-background').addEventListener('click', removeBackgroundImage);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('reset-settings').addEventListener('click', resetSettings);

    // Sự kiện cho input file
    document.getElementById('background-upload').addEventListener('change', handleBackgroundUpload);
}

function loadVoicesList() {
    const voiceSelect = document.getElementById('voice-select');

    // Hàm tải danh sách giọng đọc
    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';

        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - Default' : ''}`;
            voiceSelect.appendChild(option);
        });

        // Chọn giọng đã được lưu (nếu có)
        const savedVoice = localStorage.getItem('selectedVoice');
        if (savedVoice) {
            voiceSelect.value = savedVoice;
        }
    }

    // Load voices khi sẵn sàng
    if ('speechSynthesis' in window) {
        // Chrome yêu cầu cách xử lý đặc biệt
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Thử tải ngay lập tức (đối với Firefox)
        loadVoices();
    }
}

function loadSavedSettings() {
    // Tốc độ đọc
    const savedSpeed = localStorage.getItem('speechRate') || '1';
    document.getElementById('speech-speed').value = savedSpeed;
    document.getElementById('speed-value').textContent = savedSpeed + 'x';

    // Giao diện (theme)
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.getElementById('theme-select').value = savedTheme;
    applyTheme(savedTheme);

    // Màu nền
    const savedBgColor = localStorage.getItem('backgroundColor') || '#f5f5f5';
    document.getElementById('background-color').value = savedBgColor;

    // Ảnh nền (nếu có)
    const savedBgImage = localStorage.getItem('backgroundImage');
    if (savedBgImage) {
        document.getElementById('background-preview').style.backgroundImage = `url(${savedBgImage})`;
    }
}

function updateSpeedValue() {
    const speed = document.getElementById('speech-speed').value;
    document.getElementById('speed-value').textContent = speed + 'x';
}

function updateSelectedVoice() {
    const selectedVoice = document.getElementById('voice-select').value;
    localStorage.setItem('selectedVoice', selectedVoice);
}

function updateTheme() {
    const theme = document.getElementById('theme-select').value;
    applyTheme(theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
        // Auto theme dựa trên cài đặt hệ thống
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

function updateBackgroundColor() {
    const color = document.getElementById('background-color').value;
    document.body.style.backgroundColor = color;
}

function selectBackgroundImage() {
    document.getElementById('background-upload').click();
}

function handleBackgroundUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn một tệp hình ảnh!', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const imgData = event.target.result;
        document.getElementById('background-preview').style.backgroundImage = `url(${imgData})`;
        document.body.style.backgroundImage = `url(${imgData})`;
        localStorage.setItem('backgroundImage', imgData);
    };
    reader.readAsDataURL(file);
}

function removeBackgroundImage() {
    document.getElementById('background-preview').style.backgroundImage = 'none';
    document.body.style.backgroundImage = 'none';
    localStorage.removeItem('backgroundImage');
}

function saveSettings() {
    // Lưu tất cả cài đặt
    localStorage.setItem('speechRate', document.getElementById('speech-speed').value);
    localStorage.setItem('theme', document.getElementById('theme-select').value);
    localStorage.setItem('backgroundColor', document.getElementById('background-color').value);

    showToast('Đã lưu cài đặt thành công!', 'success');
}

function resetSettings() {
    const confirmReset = confirm('Bạn có chắc muốn khôi phục tất cả cài đặt về mặc định không?');
    if (!confirmReset) return;

    // Xóa tất cả cài đặt đã lưu
    localStorage.removeItem('speechRate');
    localStorage.removeItem('selectedVoice');
    localStorage.removeItem('theme');
    localStorage.removeItem('backgroundColor');
    localStorage.removeItem('backgroundImage');

    // Reset giao diện
    document.getElementById('speech-speed').value = '1';
    document.getElementById('speed-value').textContent = '1x';
    document.getElementById('theme-select').value = 'light';
    document.getElementById('background-color').value = '#f5f5f5';
    document.getElementById('background-preview').style.backgroundImage = 'none';

    // Áp dụng cài đặt mặc định
    document.body.classList.remove('dark-theme');
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.backgroundImage = 'none';

    showToast('Đã khôi phục cài đặt mặc định!', 'info');
}

// Dictionary Tab (Tab từ điển)
function initDictionaryTab() {
    // Hiển thị danh sách từ vựng ban đầu
    loadDictionaryWords();

    // Thêm sự kiện cho thanh tìm kiếm
    document.getElementById('dictionary-search').addEventListener('input', searchDictionary);
    document.getElementById('clear-search').addEventListener('click', clearDictionarySearch);

    // Thêm sự kiện cho nút thêm từ mới
    document.getElementById('dict-add-new-word').addEventListener('click', addNewWordToDictionary);
}

function loadDictionaryWords() {
    const dictionaryBody = document.getElementById('dictionary-body');
    dictionaryBody.innerHTML = '';

    const allWords = Object.keys(vocabulary);
    document.getElementById('dictionary-count').textContent = allWords.length;

    // Sắp xếp từ vựng theo thứ tự alphabet
    allWords.sort();

    allWords.forEach((word, index) => {
        const row = document.createElement('tr');

        const indexCell = document.createElement('td');
        indexCell.textContent = index + 1;

        const engCell = document.createElement('td');
        engCell.textContent = word;

        const vietCell = document.createElement('td');
        vietCell.textContent = vocabulary[word];

        const actionCell = document.createElement('td');

        // Nút phát âm
        const speakBtn = document.createElement('button');
        speakBtn.className = 'word-action-btn';
        speakBtn.title = 'Phát âm';
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        speakBtn.onclick = function () {
            speakWord(word);
        };

        // Nút xóa từ
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'word-action-btn';
        deleteBtn.title = 'Xóa từ';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.onclick = function () {
            deleteWord(word);
        };

        actionCell.appendChild(speakBtn);
        actionCell.appendChild(deleteBtn);

        row.appendChild(indexCell);
        row.appendChild(engCell);
        row.appendChild(vietCell);
        row.appendChild(actionCell);

        dictionaryBody.appendChild(row);
    });
}

function searchDictionary() {
    const searchTerm = document.getElementById('dictionary-search').value.trim().toLowerCase();
    const rows = document.querySelectorAll('#dictionary-body tr');

    let visibleCount = 0;

    rows.forEach(row => {
        const englishWord = row.cells[1].textContent.toLowerCase();
        const vietnameseWord = row.cells[2].textContent.toLowerCase();

        if (englishWord.includes(searchTerm) || vietnameseWord.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('dictionary-count').textContent = visibleCount;
}

function clearDictionarySearch() {
    document.getElementById('dictionary-search').value = '';
    searchDictionary();
}

function addNewWordToDictionary() {
    const engWord = document.getElementById('dict-word-english').value.trim().toLowerCase();
    const vietWord = document.getElementById('dict-word-vietnamese').value.trim();

    if (engWord === '' || vietWord === '') {
        showToast('Vui lòng nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt!', 'warning');
        return;
    }

    // Kiểm tra từ đã tồn tại chưa
    if (vocabulary[engWord]) {
        const confirmOverwrite = confirm(`Từ "${engWord}" đã tồn tại với nghĩa "${vocabulary[engWord]}". Bạn có muốn cập nhật nghĩa mới không?`);
        if (!confirmOverwrite) return;
    }

    // Thêm từ mới hoặc cập nhật nghĩa
    vocabulary[engWord] = vietWord;

    // Cập nhật danh sách từ vựng
    loadDictionaryWords();

    // Xóa trống ô input
    document.getElementById('dict-word-english').value = '';
    document.getElementById('dict-word-vietnamese').value = '';

    // Lưu từ vựng
    saveVocabulary();
    showToast(`Đã ${vocabulary[engWord] ? 'cập nhật' : 'thêm'} từ "${engWord}" thành công!`, 'success');

    // Cập nhật wordList cho phần học từ
    if (!wordList.includes(engWord)) {
        wordList.push(engWord);
    }
}

function speakWord(word) {
    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';

        // Sử dụng voice đã chọn trong cài đặt (nếu có)
        const selectedVoice = localStorage.getItem('selectedVoice');
        if (selectedVoice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) utter.voice = voice;
        }

        // Sử dụng tốc độ đọc từ cài đặt (nếu có)
        const speechRate = localStorage.getItem('speechRate');
        if (speechRate) {
            utter.rate = parseFloat(speechRate);
        }

        window.speechSynthesis.speak(utter);
    }
}

function deleteWord(word) {
    const confirmDelete = confirm(`Bạn có chắc muốn xóa từ "${word}" không?`);
    if (!confirmDelete) return;

    // Xóa từ khỏi từ điển
    delete vocabulary[word];

    // Xóa từ khỏi wordList
    wordList = wordList.filter(w => w !== word);

    // Cập nhật danh sách từ vựng
    loadDictionaryWords();

    // Lưu từ vựng
    saveVocabulary();
    showToast(`Đã xóa từ "${word}" thành công!`, 'success');
}

function prepareNewWord() {
    if (wordList.length === 0) return;
    const word = wordList[currentIndex];
    // Reset input và kết quả cho dictation
    document.getElementById('dictation-input').value = '';
    document.getElementById('dictation-result').textContent = '';
    // Hiển thị từ cho task nghe viết từ
    document.getElementById('dictation-input').value = '';
    document.getElementById('dictation-result').textContent = '';
}

// Cloud tab (Tab đám mây)
function initCloudTab() {
    // Kiểm tra và cập nhật trạng thái kết nối mạng
    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    // Thêm sự kiện cho các nút sao lưu
    document.getElementById('btn-backup-download').addEventListener('click', downloadBackup);
    document.getElementById('btn-backup-restore').addEventListener('click', clickRestoreBackup);
    document.getElementById('backup-file-input').addEventListener('change', handleBackupFile);

    // GitHub Gist
    setupGithubGistEventListeners();
    updateGitHubAuthStatus();

    // Cập nhật thông tin thống kê
    updateDataStatistics();
}

function updateConnectionStatus() {
    const status = document.getElementById('cloud-connection-status');
    if (navigator.onLine) {
        status.textContent = 'Đã kết nối';
        status.classList.add('online');
        status.classList.remove('offline');
    } else {
        status.textContent = 'Ngoại tuyến';
        status.classList.add('offline');
        status.classList.remove('online');
    }
}

function updateDataStatistics() {
    // Cập nhật các con số thống kê
    document.getElementById('cloud-vocab-count').textContent = Object.keys(vocabulary).length;
    document.getElementById('cloud-topic-count').textContent = Object.keys(wordTopics).length;
    document.getElementById('cloud-synonym-count').textContent = Object.keys(wordSynonyms).length;

    // Cập nhật thời gian cập nhật cuối
    const lastUpdated = localStorage.getItem('lastUpdated');
    if (lastUpdated) {
        const date = new Date(lastUpdated);
        document.getElementById('cloud-last-update').textContent = formatDateTime(date);
    }
}

function formatDateTime(date) {
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Tải xuống bản sao lưu
function downloadBackup() {
    const backupData = {
        vocabulary: vocabulary,
        wordPackages: wordPackages,
        wordTopics: wordTopics,
        wordSynonyms: wordSynonyms,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.download = `vocabulary_backup_${date}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Đã tải xuống bản sao lưu!', 'success');
}

// Kích hoạt tệp đầu vào để khôi phục
function clickRestoreBackup() {
    document.getElementById('backup-file-input').click();
}

// Xử lý tệp sao lưu được chọn
function handleBackupFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            // Kiểm tra định dạng dữ liệu
            if (!data.vocabulary || !data.wordTopics || !data.wordSynonyms) {
                throw new Error('Định dạng tệp sao lưu không hợp lệ!');
            }

            // Hỏi xác nhận từ người dùng
            const confirmRestore = confirm(
                `Khôi phục dữ liệu từ bản sao lưu này?\n` +
                `- Từ vựng: ${Object.keys(data.vocabulary).length} từ\n` +
                `- Chủ đề: ${Object.keys(data.wordTopics).length} chủ đề\n` +
                `- Nhóm đồng nghĩa: ${Object.keys(data.wordSynonyms).length} nhóm\n\n` +
                `Thao tác này sẽ thay thế dữ liệu hiện tại của bạn!`
            );

            if (confirmRestore) {
                restoreFromBackup(data);
            }
        } catch (error) {
            console.error("Lỗi khi đọc tệp sao lưu:", error);
            showToast('Tệp sao lưu không hợp lệ: ' + error.message, 'error');
        }

        // Reset input để có thể chọn lại tệp tương tự
        event.target.value = "";
    };

    reader.readAsText(file);
}

// Khôi phục dữ liệu từ bản sao lưu
async function restoreFromBackup(data) {
    // Khôi phục dữ liệu
    vocabulary = data.vocabulary || {};
    wordPackages = data.wordPackages || {};
    wordTopics = data.wordTopics || {};
    wordSynonyms = data.wordSynonyms || {};

    // Lưu dữ liệu vào localStorage
    saveAllDataToLocalStorage();

    // Cập nhật giao diện người dùng
    loadDictionaryWords();
    loadTopicsList();
    loadSynonymsList();
    updateDataStatistics();

    showToast('Đã khôi phục dữ liệu từ bản sao lưu thành công!', 'success');
}

// Các event listeners cho GitHub Gist
function setupGithubGistEventListeners() {
    // Nút xác thực GitHub
    document.getElementById('github-auth-btn').addEventListener('click', async function() {
        const success = await authenticateGitHub();
        if (success) {
            updateGitHubAuthStatus();
        }
    });

    // Nút liệt kê Gists
    document.getElementById('github-list-gists-btn').addEventListener('click', async function() {
        const gistId = await showGistSelector();
        if (gistId) {
            saveGitHubCredentials(null, gistId);
            showToast('Đã chọn Gist: ' + gistId, 'success');
            updateGitHubAuthStatus();
        }
    });

    // Nút tạo Gist mới
    document.getElementById('github-create-gist-btn').addEventListener('click', async function() {
        const newGistId = await createVocabularyGist();
        if (newGistId) {
            showToast('Đã tạo Gist mới với ID: ' + newGistId, 'success');
            updateGitHubAuthStatus();
        }
    });

    // Nút cập nhật lên Gist
    document.getElementById('github-update-gist-btn').addEventListener('click', async function() {
        const success = await updateVocabularyGist();
        if (success) {
            showToast('Đã cập nhật dữ liệu từ vựng lên Gist', 'success');
        }
    });

    // Nút tải từ Gist
    document.getElementById('github-load-gist-btn').addEventListener('click', async function() {
        const success = await loadFromGist();
        if (success) {
            showToast('Đã tải dữ liệu từ vựng từ Gist', 'success');
            updateDataStatistics();
        }
    });
}

// Cập nhật hiển thị trạng thái xác thực GitHub
function updateGitHubAuthStatus() {
    const authStatusElem = document.getElementById('github-auth-status');
    const gistIdElem = document.getElementById('github-gist-id');
    
    // Tải thông tin xác thực
    const { githubToken, gistId } = loadGitHubCredentials();
    
    if (githubToken) {
        authStatusElem.textContent = 'Đã xác thực';
        authStatusElem.className = 'authenticated';
        
        if (gistId) {
            gistIdElem.textContent = gistId;
        } else {
            gistIdElem.textContent = 'Chưa chọn';
        }
    } else {
        authStatusElem.textContent = 'Chưa xác thực';
        authStatusElem.className = 'not-authenticated';
        gistIdElem.textContent = 'Chưa có';
    }
}

// Cập nhật thống kê dữ liệu
function updateDataStatistics() {
    document.getElementById('cloud-vocab-count').textContent = Object.keys(vocabulary).length;
    document.getElementById('cloud-topic-count').textContent = Object.keys(wordTopics).length;
    document.getElementById('cloud-synonym-count').textContent = Object.keys(wordSynonyms).length;
    document.getElementById('cloud-last-update').textContent = new Date().toLocaleString();
}

// Thêm vào hàm init
function init() {
    // ...existing code...
    
    // Setup GitHub Gist
    setupGithubGistEventListeners();
    updateGitHubAuthStatus();
    updateDataStatistics();
    
    // ...existing code...
}

// Khởi động ứng dụng
window.onload = function () {
    setupTabs();
    loadVocabulary();
    
    // Thêm khởi tạo các nút GitHub Gist
    setupGithubGistEventListeners();
    updateGitHubAuthStatus();

    // Đóng dialog khi nhấp vào nút đóng hoặc bên ngoài dialog
    document.querySelectorAll('.close-dialog').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            this.closest('.dialog').style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        document.querySelectorAll('.dialog').forEach(dialog => {
            if (event.target === dialog) {
                dialog.style.display = 'none';
            }
        });
    });
};