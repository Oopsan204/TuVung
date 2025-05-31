// Module quản lý giao diện người dùng
const UIManager = {
    // Khởi tạo UI
    init() {
        this.setupTabs();
        this.loadSavedTheme();
        this.setupEventListeners();
    },    // Thiết lập tabs
    setupTabs() {
        console.log('UIManager: setupTabs được gọi');
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-pane');

        console.log('UIManager: Tìm thấy', tabButtons.length, 'tab buttons và', tabContents.length, 'tab contents');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                console.log('UIManager: Tab button clicked, targetTab:', targetTab);
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                    console.log('UIManager: Activated tab content:', targetTab);
                } else {
                    console.error('UIManager: Không tìm thấy tab content với id:', targetTab);
                }
                
                // Initialize tab-specific functionality
                this.initializeTab(targetTab);
            });
        });
    },// Khởi tạo chức năng riêng cho từng tab
    initializeTab(tabId) {
        console.log('UIManager: initializeTab được gọi với tabId:', tabId);
        switch(tabId) {
            case 'learn':
                console.log('UIManager: Switching to learn tab');
                // Already handled in main app
                break;
            case 'flashcard':
                console.log('UIManager: Switching to flashcard tab');
                // Call FlashcardManager to reload when tab is activated
                if (window.FlashcardManager) {
                    console.log('UIManager: Gọi FlashcardManager.loadWords()');
                    window.FlashcardManager.loadWords();
                } else {
                    console.warn('UIManager: FlashcardManager chưa được khởi tạo');
                }
                break;
            case 'quiz':
                console.log('UIManager: Switching to quiz tab');
                // Already handled in main app
                break;
            case 'dictionary':
                console.log('UIManager: Switching to dictionary tab');
                this.initDictionaryTab();
                break;
            case 'topics':
                console.log('UIManager: Switching to topics tab');
                // Already handled in main app
                break;
            case 'synonyms-tab':
                // Already handled in main app
                break;
            case 'srs-tab':
                // Already handled in main app
                break;            case 'cloud':
                console.log('UIManager: Switching to cloud tab');
                this.updateGitHubAuthStatus();
                this.updateDataStatistics();
                break;
            case 'settings-tab':
                // Already handled in main app
                break;
        }
    },

    // Hiển thị thông báo toast
    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

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
    },

    // Cập nhật thanh tiến trình
    updateProgress(progressBarId, percentage) {
        const progressBar = document.getElementById(progressBarId);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    },

    // Cập nhật văn bản tiến trình
    updateProgressText(textElementId, current, total, learned = 0) {
        const textElement = document.getElementById(textElementId);
        if (textElement) {
            const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
            textElement.textContent = `Từ ${current}/${total} - Đã học: ${learned} (${percentage}%)`;
        }
    },

    // Áp dụng theme
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
        } else if (theme === 'auto') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
        localStorage.setItem('theme', theme);
    },

    // Tải theme đã lưu
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
        this.applyTheme(savedTheme);
    },

    // Cập nhật màu nền
    updateBackgroundColor() {
        const colorInput = document.getElementById('background-color');
        if (colorInput) {
            const color = colorInput.value;
            document.body.style.backgroundColor = color;
            localStorage.setItem('backgroundColor', color);
        }
    },

    // Xử lý upload ảnh nền
    handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('Vui lòng chọn file ảnh hợp lệ!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            document.body.style.backgroundImage = `url(${imageUrl})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            
            const preview = document.getElementById('background-preview');
            if (preview) {
                preview.style.backgroundImage = `url(${imageUrl})`;
            }
            
            localStorage.setItem('backgroundImage', imageUrl);
            this.showToast('Đã cập nhật ảnh nền!', 'success');
        };
        reader.readAsDataURL(file);
    },

    // Xóa ảnh nền
    removeBackgroundImage() {
        document.body.style.backgroundImage = 'none';
        const preview = document.getElementById('background-preview');
        if (preview) {
            preview.style.backgroundImage = 'none';
        }
        localStorage.removeItem('backgroundImage');
        this.showToast('Đã xóa ảnh nền!', 'info');
    },

    // Thiết lập event listeners
    setupEventListeners() {
        // Theme events
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        }

        // Background events
        const backgroundColorInput = document.getElementById('background-color');
        if (backgroundColorInput) {
            backgroundColorInput.addEventListener('input', () => this.updateBackgroundColor());
        }

        const backgroundUpload = document.getElementById('background-upload');
        if (backgroundUpload) {
            backgroundUpload.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        }

        const selectBackgroundBtn = document.getElementById('select-background');
        if (selectBackgroundBtn) {
            selectBackgroundBtn.addEventListener('click', () => {
                if (backgroundUpload) backgroundUpload.click();
            });
        }

        const removeBackgroundBtn = document.getElementById('remove-background');
        if (removeBackgroundBtn) {
            removeBackgroundBtn.addEventListener('click', () => this.removeBackgroundImage());
        }
    },

    // Khởi tạo Dictionary tab
    initDictionaryTab() {
        this.loadDictionaryWords();
    },

    // Tải từ vựng cho dictionary
    loadDictionaryWords() {
        const dictionaryBody = document.getElementById('dictionary-body');
        if (!dictionaryBody || !window.vocabulary) return;

        dictionaryBody.innerHTML = '';
        const words = Object.keys(window.vocabulary);

        words.forEach((word, index) => {
            const row = document.createElement('tr');

            const indexCell = document.createElement('td');
            indexCell.textContent = index + 1;

            const engCell = document.createElement('td');
            engCell.textContent = word;

            const vietCell = document.createElement('td');
            vietCell.textContent = window.vocabulary[word];

            const actionCell = document.createElement('td');
            
            // Nút phát âm
            const speakBtn = document.createElement('button');
            speakBtn.className = 'word-action-btn';
            speakBtn.title = 'Phát âm';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakBtn.onclick = () => {
                if (window.AudioManager) {
                    window.AudioManager.speakWord(word);
                }
            };

            // Nút xóa từ
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'word-action-btn';
            deleteBtn.title = 'Xóa từ';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => this.deleteWord(word);

            actionCell.appendChild(speakBtn);
            actionCell.appendChild(deleteBtn);

            row.appendChild(indexCell);
            row.appendChild(engCell);
            row.appendChild(vietCell);
            row.appendChild(actionCell);

            dictionaryBody.appendChild(row);
        });
    },    // Tìm kiếm trong dictionary
    async searchDictionary() {
        const searchInput = document.getElementById('dictionary-search');
        const dictionaryBody = document.getElementById('dictionary-body');
        
        if (!searchInput || !dictionaryBody) return;

        const query = searchInput.value.toLowerCase().trim();
        const rows = dictionaryBody.querySelectorAll('tr');

        // Hide API result initially
        const apiResult = document.getElementById('api-lookup-result');
        if (apiResult) {
            apiResult.style.display = 'none';
        }

        // Search in local dictionary first
        let foundLocalResults = false;
        rows.forEach(row => {
            const engWord = row.cells[1]?.textContent.toLowerCase() || '';
            const vietMeaning = row.cells[2]?.textContent.toLowerCase() || '';
            
            if (engWord.includes(query) || vietMeaning.includes(query)) {
                row.style.display = '';
                foundLocalResults = true;
            } else {
                row.style.display = 'none';
            }
        });

        // Debounce API search
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // If no local results and query is a single English word, search API after delay
        if (!foundLocalResults && query && query.split(' ').length === 1 && /^[a-zA-Z]+$/.test(query)) {
            this.searchTimeout = setTimeout(async () => {
                await this.searchWordAPI(query);
            }, 1000); // Wait 1 second after user stops typing
        }
    },    // Xóa tìm kiếm dictionary
    clearDictionarySearch() {
        const searchInput = document.getElementById('dictionary-search');
        const apiResult = document.getElementById('api-lookup-result');
        
        if (searchInput) {
            searchInput.value = '';
            this.searchDictionary();
        }
        
        // Hide API results when clearing search
        if (apiResult) {
            apiResult.style.display = 'none';
        }
    },

    // Xóa từ
    deleteWord(word) {
        if (!confirm(`Bạn có chắc muốn xóa từ "${word}" không?`)) return;

        if (window.VocabularyManager) {
            window.VocabularyManager.removeWord(word);
            this.loadDictionaryWords();
            this.showToast(`Đã xóa từ "${word}"!`, 'success');
        }
    },    // Thêm từ mới vào dictionary
    async addNewWordToDictionary() {
        const englishInput = document.getElementById('dict-word-english');
        const vietnameseInput = document.getElementById('dict-word-vietnamese');
        const topicSelect = document.getElementById('dict-topic-select');
        
        if (!englishInput || !vietnameseInput) {
            console.error('Dictionary input elements not found');
            return;
        }

        const english = englishInput.value.trim();
        const vietnamese = vietnameseInput.value.trim();
        const selectedTopic = topicSelect ? topicSelect.value : null;

        if (!english || !vietnamese) {
            this.showToast('Vui lòng nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt!', 'warning');
            return;
        }

        if (window.vocabulary && window.vocabulary[english]) {
            this.showToast('Từ này đã tồn tại trong từ điển!', 'warning');
            return;
        }

        if (window.VocabularyManager) {
            // Add word with topic if selected
            window.VocabularyManager.addWord(english, vietnamese, selectedTopic);
            this.loadDictionaryWords();
            
            let message = `Đã thêm từ "${english}" vào từ điển!`;
            if (selectedTopic) {
                message += ` (Chủ đề: ${selectedTopic})`;
            }
            this.showToast(message, 'success');
            
            // Clear inputs
            englishInput.value = '';
            vietnameseInput.value = '';
            if (topicSelect) topicSelect.value = '';
        }
    },

    // Cập nhật trạng thái xác thực GitHub
    updateGitHubAuthStatus() {
        const token = localStorage.getItem('githubToken');
        const statusElement = document.getElementById('github-auth-status');
        const loginBtn = document.getElementById('github-login');
        const logoutBtn = document.getElementById('github-logout');

        if (statusElement) {
            if (token) {
                statusElement.innerHTML = '<span class="badge online">Đã kết nối</span>';
            } else {
                statusElement.innerHTML = '<span class="badge offline">Chưa kết nối</span>';
            }
        }

        if (loginBtn) {
            loginBtn.style.display = token ? 'none' : 'inline-block';
        }
        if (logoutBtn) {
            logoutBtn.style.display = token ? 'inline-block' : 'none';
        }
    },

    // Cập nhật thống kê dữ liệu
    updateDataStatistics() {
        const vocabCount = document.getElementById('cloud-vocab-count');
        const topicCount = document.getElementById('cloud-topic-count');
        const synonymCount = document.getElementById('cloud-synonym-count');
        const lastUpdate = document.getElementById('cloud-last-update');

        if (vocabCount && window.vocabulary) {
            vocabCount.textContent = Object.keys(window.vocabulary).length;
        }
        if (topicCount && window.wordTopics) {
            topicCount.textContent = Object.keys(window.wordTopics).length;
        }
        if (synonymCount && window.wordSynonyms) {
            synonymCount.textContent = Object.keys(window.wordSynonyms).length;
        }
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleString();
        }
    },

    // Hiển thị dialog
    showDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'block';
        }
    },

    // Ẩn dialog
    hideDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.style.display = 'none';
        }
    },

    // Search word using API
    async searchWordAPI(word) {
        const apiResult = document.getElementById('api-lookup-result');
        const apiContent = document.getElementById('api-lookup-content');
        const apiMeaningBox = document.getElementById('api-vn-meaning-box');
        const addApiWordBtn = document.getElementById('add-api-word-btn');
        
        if (!apiResult || !apiContent) return;

        try {
            // Show loading state
            apiContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm từ điển online...</p>';
            apiResult.style.display = 'block';

            // Use Free Dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                throw new Error('Word not found');
            }

            const data = await response.json();
            const wordData = data[0];

            // Format the API result
            let resultHTML = `<h4><i class="fas fa-globe"></i> Kết quả từ từ điển online</h4>`;
            resultHTML += `<div style="background: white; padding: 12px; border-radius: 6px; margin: 8px 0;">`;
            resultHTML += `<h5>${wordData.word}</h5>`;

            // Add phonetics if available
            if (wordData.phonetics && wordData.phonetics.length > 0) {
                const phonetic = wordData.phonetics.find(p => p.text) || wordData.phonetics[0];
                if (phonetic.text) {
                    resultHTML += `<p><strong>Phát âm:</strong> ${phonetic.text}`;
                    if (phonetic.audio) {
                        resultHTML += ` <button onclick="this.nextElementSibling.play()" style="background: none; border: none; color: #007bff; cursor: pointer;"><i class="fas fa-volume-up"></i></button>`;
                        resultHTML += `<audio><source src="${phonetic.audio}" type="audio/mpeg"></audio>`;
                    }
                    resultHTML += `</p>`;
                }
            }

            // Add meanings
            wordData.meanings.forEach((meaning, index) => {
                resultHTML += `<div style="margin: 8px 0;">`;
                resultHTML += `<strong>${meaning.partOfSpeech}</strong><br>`;
                
                meaning.definitions.slice(0, 3).forEach((def, defIndex) => {
                    resultHTML += `<span style="margin-left: 12px;">${defIndex + 1}. ${def.definition}</span><br>`;
                    if (def.example) {
                        resultHTML += `<span style="margin-left: 24px; font-style: italic; color: #666;">Ví dụ: ${def.example}</span><br>`;
                    }
                });
                resultHTML += `</div>`;
            });

            resultHTML += `</div>`;
            apiContent.innerHTML = resultHTML;

            // Show input box for Vietnamese meaning
            if (apiMeaningBox && addApiWordBtn) {
                apiMeaningBox.style.display = 'block';
                addApiWordBtn.style.display = 'block';
                
                // Store word data for adding to vocabulary
                addApiWordBtn.onclick = () => this.addWordFromAPI(wordData);
            }

        } catch (error) {
            console.error('API search error:', error);
            apiContent.innerHTML = `
                <h4><i class="fas fa-exclamation-triangle"></i> Không tìm thấy kết quả</h4>
                <p>Không tìm thấy từ "${word}" trong từ điển online. Vui lòng kiểm tra chính tả hoặc thử từ khác.</p>
            `;
            
            if (apiMeaningBox && addApiWordBtn) {
                apiMeaningBox.style.display = 'none';
                addApiWordBtn.style.display = 'none';
            }
        }
    },

    // Add word from API to vocabulary
    async addWordFromAPI(wordData) {
        const apiMeaningInput = document.getElementById('api-vn-meaning');
        const apiTopicSelect = document.getElementById('api-topic-select');
        
        if (!apiMeaningInput) return;

        const englishWord = wordData.word;
        const vietnameseMeaning = apiMeaningInput.value.trim();
        const selectedTopic = apiTopicSelect ? apiTopicSelect.value : null;

        if (!vietnameseMeaning) {
            this.showToast('Vui lòng nhập nghĩa tiếng Việt cho từ này!', 'warning');
            return;
        }

        if (window.vocabulary && window.vocabulary[englishWord]) {
            this.showToast('Từ này đã tồn tại trong từ điển!', 'warning');
            return;
        }

        if (window.VocabularyManager) {
            // Create examples from API data
            let examples = [];
            if (wordData.meanings && wordData.meanings.length > 0) {
                wordData.meanings.forEach(meaning => {
                    meaning.definitions.slice(0, 2).forEach(def => {
                        if (def.example) {
                            examples.push(def.example);
                        }
                    });
                });
            }

            // Add word with examples
            window.VocabularyManager.addWord(englishWord, vietnameseMeaning, selectedTopic, examples);
            this.loadDictionaryWords();
            
            let message = `Đã thêm từ "${englishWord}" từ từ điển online!`;
            if (selectedTopic) {
                message += ` (Chủ đề: ${selectedTopic})`;
            }
            this.showToast(message, 'success');
            
            // Clear inputs and hide API result
            apiMeaningInput.value = '';
            if (apiTopicSelect) apiTopicSelect.value = '';
            
            const apiResult = document.getElementById('api-lookup-result');
            if (apiResult) {
                apiResult.style.display = 'none';
            }

            // Clear search and reload dictionary
            const searchInput = document.getElementById('dictionary-search');
            if (searchInput) {
                searchInput.value = '';
                this.searchDictionary();
            }
        }
    }
};

// Export UIManager
window.UIManager = UIManager;
