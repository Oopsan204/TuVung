// Main Application - Refactored to use modules
// Ứng dụng học từ vựng tiếng Anh - TuVung

// Note: Global variables are declared in js/config.js
// They will be updated by VocabularyManager

// Completion task object
let completionTask;

// SRS Session variables
let currentSRSWords = [];
let currentSRSIndex = 0;
let srsSession = {
    totalWords: 0,
    completedWords: 0,
    correctWords: 0,
    showingAnswer: false
};

// Khởi tạo ứng dụng
async function init() {
    try {
        console.log('Bắt đầu khởi tạo ứng dụng...');
          // Khởi tạo VocabularyManager và tải dữ liệu
        console.log('Đang tải dữ liệu từ VocabularyManager...');
        await VocabularyManager.load();
          // Đảm bảo global variables đã được cập nhật
        VocabularyManager.updateGlobalVariables();
        console.log('Đã tải xong dữ liệu. Vocabulary có', Object.keys(vocabulary).length, 'từ');
        console.log('WordPackages có', Object.keys(wordPackages).length, 'gói');
        console.log('WordTopics có', Object.keys(wordTopics).length, 'chủ đề');
          // Khởi tạo SRS Manager
        console.log('Khởi tạo SRS Manager...');
        SRSManager.loadSRSData();
          // Khởi tạo các module UI và tính năng
        console.log('Khởi tạo các module...');
        UIManager.init();
        AudioManager.init();
        LearningManager.init();
        await CloudManager.init(); // Đợi CloudManager hoàn thành để tự động tải xuống dữ liệu
        QuizManager.init();
        FlashcardManager.init();
          // Khởi tạo các tab        console.log('Khởi tạo các tab...');
        initLearnTab();
        initFlashcardTab();
        initQuizTab();
        initTopicsTab();
        initSynonymsTab();        initSRSTab();
        initDictionaryTab();
        initSettingsTab();
        initGamesTab();
        
        // Update dictionary count after all data is loaded
        updateDictionaryCount();
        
        // Thiết lập event listeners toàn cục
        console.log('Thiết lập event listeners...');
        setupGlobalEventListeners();
        
        console.log('Ứng dụng đã khởi tạo thành công!');
        
    } catch (error) {
        console.error('Lỗi khởi tạo ứng dụng:', error);
        if (window.UIManager) {
            UIManager.showToast('Có lỗi khi khởi tạo ứng dụng!', 'error');
        }
    }
}

// Thiết lập event listeners toàn cục
function setupGlobalEventListeners() {
    // Network status
    window.addEventListener('online', () => {
        isOnline = true;
        UIManager.showToast('Kết nối mạng đã được khôi phục!', 'success');
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        UIManager.showToast('Mất kết nối mạng!', 'warning');
    });

    // Phím tắt toàn cục
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Completion task event listeners
    const checkCompletionBtn = document.getElementById('check-completion');
    if (checkCompletionBtn) {
        checkCompletionBtn.addEventListener('click', () => {
            if (completionTask) {
                completionTask.checkAnswer();
            }
        });
    }
    
    const completionNextBtn = document.getElementById('completion-next');
    if (completionNextBtn) {
        completionNextBtn.addEventListener('click', () => {
            if (completionTask) {
                completionTask.showNextWord();
            }
        });
    }
    
    const completionInput = document.getElementById('completion-input');
    if (completionInput) {
        completionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && completionTask) {
                completionTask.checkAnswer();
            }
        });
    }
    
    // SRS task event listeners
    const startSRSBtn = document.getElementById('start-srs');
    if (startSRSBtn) {
        startSRSBtn.addEventListener('click', startSRSSession);
    }
}

// Xử lý phím tắt toàn cục
function handleGlobalKeydown(e) {
    // Ctrl + S để lưu
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveAllData();
    }
    
    // Escape để đóng dialog
    if (e.key === 'Escape') {
        closeAllDialogs();
    }
}

// Lưu tất cả dữ liệu
function saveAllData() {
    if (VocabularyManager) {
        VocabularyManager.saveToLocalStorage();
    }
    if (SRSManager) {
        SRSManager.saveSRSData();
    }
    if (LearningManager) {
        LearningManager.saveLearnedWords();
    }
    UIManager.showToast('Đã lưu tất cả dữ liệu!', 'success');
}

// Đóng tất cả dialog
function closeAllDialogs() {
    const dialogs = document.querySelectorAll('.dialog');
    dialogs.forEach(dialog => {
        dialog.style.display = 'none';
    });
}

// ============= TAB INITIALIZATION FUNCTIONS =============

function initLearnTab() {
    // Khởi tạo danh sách gói từ vựng
    const packageSelect = document.getElementById('learn-package');
    if (packageSelect) {
        packageSelect.innerHTML = '<option value="all">Tất cả từ vựng</option>';

        // Thêm các gói từ vựng
        for (const pack in wordPackages) {
            const option = document.createElement('option');
            option.value = pack;
            option.textContent = pack;
            packageSelect.appendChild(option);
        }

        // Thêm các chủ đề
        for (const topic in wordTopics) {
            const option = document.createElement('option');
            option.value = 'topic:' + topic;
            option.textContent = 'Chủ đề: ' + topic;
            packageSelect.appendChild(option);
        }

        // Event listener cho việc thay đổi gói
        packageSelect.addEventListener('change', changeLearnPackage);
    }

    // Khởi tạo danh sách từ
    wordList = Object.keys(vocabulary);
    shuffleArray(wordList);
    currentIndex = 0;

    // Khởi tạo với LearningManager
    LearningManager.initializeWordList(wordList);

    // Event listeners cho các task
    setupLearnTaskEventListeners();
    
    // Hiển thị từ đầu tiên
    showCurrentWord();
    updateLearnProgress();
}

function setupLearnTaskEventListeners() {
    // Task buttons
    const taskDictation = document.getElementById('task-dictation');
    if (taskDictation) {
        taskDictation.addEventListener('click', () => switchLearnTask('dictation-task'));
    }

    const taskTranslation = document.getElementById('task-translation');
    if (taskTranslation) {
        taskTranslation.addEventListener('click', () => switchLearnTask('translation-task'));
    }

    const taskCompletion = document.getElementById('task-completion');
    if (taskCompletion) {
        taskCompletion.addEventListener('click', () => switchLearnTask('completion-task'));
    }

    const taskSRS = document.getElementById('task-srs');
    if (taskSRS) {
        taskSRS.addEventListener('click', () => switchLearnTask('srs-task'));
    }
}

function switchLearnTask(taskId) {
    // Remove active class from all task buttons
    document.querySelectorAll('.task-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to current task button
    const activeButton = document.querySelector(`[onclick*="${taskId}"], .task-btn[data-task="${taskId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Hide all practice sections
    document.querySelectorAll('.practice-section').forEach(section => {
        section.classList.remove('active-task');
    });
    
    // Show current task section
    const taskSection = document.getElementById(taskId);
    if (taskSection) {
        taskSection.classList.add('active-task');
    }    // Initialize task-specific functionality
    switch(taskId) {
        case 'dictation-task':
            LearningManager.dictationTask.init(wordList);
            break;
        case 'translation-task':
            LearningManager.translationTask.init(wordList);
            break;
        case 'completion-task':
            if (!completionTask) {
                completionTask = LearningManager.completionTask;
            }
            completionTask.init(wordList);
            break;
        case 'srs-task':
            initSRSSession();
            break;
    }
}

function changeLearnPackage() {
    const packageSelect = document.getElementById('learn-package');
    if (!packageSelect) return;

    const packageValue = packageSelect.value;

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
        UIManager.showToast('Không có từ vựng nào trong gói này!', 'warning');
        return;
    }

    // Shuffle và reset
    shuffleArray(wordList);
    currentIndex = 0;
    LearningManager.initializeWordList(wordList);

    // Hiển thị từ đầu tiên
    showCurrentWord();
    updateLearnProgress();
}

function showCurrentWord() {
    if (wordList.length === 0) return;
    
    const word = wordList[currentIndex];
    const wordElement = document.getElementById('current-word');
    if (wordElement) {
        wordElement.textContent = word;
    }
}

function updateLearnProgress() {
    if (wordList.length === 0) return;

    const learnedCount = wordList.filter(word => LearningManager.isWordLearned(word)).length;
    const percentage = Math.round((learnedCount / wordList.length) * 100);

    UIManager.updateProgressText('learn-word-count', currentIndex + 1, wordList.length, learnedCount);
    UIManager.updateProgress('learning-progress', percentage);
}

function nextWord() {
    if (wordList.length === 0) return;
    currentIndex = (currentIndex + 1) % wordList.length;
    showCurrentWord();
    updateLearnProgress();
}

// Utility function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initFlashcardTab() {
    console.log('initFlashcardTab: Bắt đầu khởi tạo...');
    
    // Initialize the package dropdown first
    const flashcardPackage = document.getElementById('flashcard-package');
    if (flashcardPackage) {
        console.log('initFlashcardTab: Tìm thấy element flashcard-package');
        flashcardPackage.innerHTML = '<option value="all">Tất cả từ vựng</option>';

        // Add word packages
        console.log('initFlashcardTab: Thêm word packages, có', Object.keys(wordPackages).length, 'packages');
        for (const pack in wordPackages) {
            const option = document.createElement('option');
            option.value = pack;
            option.textContent = pack;
            flashcardPackage.appendChild(option);
        }

        // Add topics
        console.log('initFlashcardTab: Thêm topics, có', Object.keys(wordTopics).length, 'topics');
        for (const topic in wordTopics) {
            const option = document.createElement('option');
            option.value = 'topic:' + topic;
            option.textContent = 'Chủ đề: ' + topic;
            flashcardPackage.appendChild(option);
        }

        // Event listener for package change
        flashcardPackage.addEventListener('change', () => {
            console.log('Flashcard package changed to:', flashcardPackage.value);
            FlashcardManager.updatePackage();
        });
    } else {
        console.error('initFlashcardTab: Không tìm thấy element flashcard-package');
    }    // FlashcardManager already initialized, just load words
    console.log('initFlashcardTab: FlashcardManager đã được khởi tạo, load words...');
    FlashcardManager.loadWords();
    console.log('initFlashcardTab: Hoàn thành khởi tạo');
}

function initQuizTab() {
    // Initialize the package dropdown
    const quizPackage = document.getElementById('quiz-package');
    if (quizPackage) {
        quizPackage.innerHTML = '<option value="all">Tất cả từ vựng</option>';

        // Add word packages
        for (const pack in wordPackages) {
            const option = document.createElement('option');
            option.value = pack;
            option.textContent = pack;
            quizPackage.appendChild(option);
        }

        // Add topics
        for (const topic in wordTopics) {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = `Chủ đề: ${topic}`;
            quizPackage.appendChild(option);
        }
    }

    QuizManager.init();
}

function initTopicsTab() {
    loadTopicsList();
    
    // Event listeners
    document.getElementById('new-topic')?.addEventListener('click', createNewTopic);
    document.getElementById('delete-topic')?.addEventListener('click', deleteTopic);
    document.getElementById('add-to-topic')?.addEventListener('click', showAddToTopicDialog);
    document.getElementById('remove-from-topic')?.addEventListener('click', removeFromTopic);
    document.getElementById('auto-classify')?.addEventListener('click', autoClassifyWords);
}

function initSynonymsTab() {
    loadSynonymsList();
    
    // Event listeners
    document.getElementById('new-synonym-group')?.addEventListener('click', createNewSynonymGroup);
    document.getElementById('delete-synonym-group')?.addEventListener('click', deleteSynonymGroup);
    document.getElementById('add-to-synonym')?.addEventListener('click', showAddToSynonymDialog);
    document.getElementById('remove-from-synonym')?.addEventListener('click', removeFromSynonym);
    document.getElementById('auto-update-synonyms')?.addEventListener('click', autoUpdateSynonyms);
}

function initSRSTab() {
    // Event listeners for SRS
    document.getElementById('start-srs')?.addEventListener('click', startSRSSession);
    document.getElementById('srs-show-answer')?.addEventListener('click', showSRSAnswer);
    document.getElementById('srs-again')?.addEventListener('click', () => rateSRSWord(SRS_DIFFICULTY.AGAIN));
    document.getElementById('srs-hard')?.addEventListener('click', () => rateSRSWord(SRS_DIFFICULTY.HARD));
    document.getElementById('srs-good')?.addEventListener('click', () => rateSRSWord(SRS_DIFFICULTY.GOOD));
    document.getElementById('srs-easy')?.addEventListener('click', () => rateSRSWord(SRS_DIFFICULTY.EASY));
      // Dashboard event listeners
    document.getElementById('srs-dashboard-btn')?.addEventListener('click', showSRSDashboard);
    document.getElementById('close-srs-dashboard')?.addEventListener('click', closeSRSDashboard);
    document.getElementById('reset-srs-data')?.addEventListener('click', resetSRSData);
    document.getElementById('export-srs-data')?.addEventListener('click', exportSRSData);
    document.getElementById('sync-srs-data')?.addEventListener('click', syncSRSData);
}

function initDictionaryTab() {
    UIManager.initDictionaryTab();
    
    // Populate topic dropdowns
    const dictTopicSelect = document.getElementById('dict-topic-select');
    const apiTopicSelect = document.getElementById('api-topic-select');
    
    if (dictTopicSelect) {
        dictTopicSelect.innerHTML = '<option value="">--Chọn chủ đề--</option>';
        // Add topics to the dropdown
        for (const topic in wordTopics) {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            dictTopicSelect.appendChild(option);
        }
    }
    
    if (apiTopicSelect) {
        apiTopicSelect.innerHTML = '<option value="">--Chọn chủ đề--</option>';
        // Add topics to the dropdown
        for (const topic in wordTopics) {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            apiTopicSelect.appendChild(option);
        }
    }
    
    // Update dictionary count after vocabulary is loaded
    updateDictionaryCount();    // Event listeners
    document.getElementById('dictionary-search')?.addEventListener('input', async () => await UIManager.searchDictionary());
    document.getElementById('clear-search')?.addEventListener('click', () => UIManager.clearDictionarySearch());
    document.getElementById('dict-add-new-word')?.addEventListener('click', () => UIManager.addNewWordToDictionary());
}

// Add this new function to update the dictionary count
function updateDictionaryCount() {
    const countElement = document.getElementById('dictionary-count');
    if (countElement && vocabulary) {
        const totalWords = Object.keys(vocabulary).length;
        countElement.textContent = totalWords;
    }
}

function initSettingsTab() {
    AudioManager.init();
    
    // Event listeners
    document.getElementById('speech-speed')?.addEventListener('input', () => AudioManager.updateSpeedValue());
    document.getElementById('voice-select')?.addEventListener('change', () => AudioManager.updateSelectedVoice());
    document.getElementById('save-settings')?.addEventListener('click', saveSettings);
    document.getElementById('reset-settings')?.addEventListener('click', resetSettings);
}

function initGamesTab() {
    console.log('Initializing Games tab...');
    
    // Initialize GameManager and render games interface
    if (typeof GameManager !== 'undefined') {
        try {
            // Create GameManager instance if not exists
            if (!window.gameManager) {
                window.gameManager = new GameManager();
            }
            
            // Initialize GameManager with required dependencies
            window.gameManager.init(VocabularyManager, UIManager, AudioManager);
            
            // Show game selection screen
            window.gameManager.showGameSelection();
            
            console.log('GameManager initialized successfully');
        } catch (error) {
            console.error('Error initializing GameManager:', error);
            // Fallback - show a simple message if GameManager fails
            const gamesContainer = document.getElementById('games-container');
            if (gamesContainer) {
                gamesContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h3>🎮 Trò chơi học từ vựng</h3>
                        <p>Đang tải trò chơi...</p>
                        <p style="color: #666; font-size: 0.9em;">Vui lòng thử lại sau hoặc tải lại trang</p>
                    </div>
                `;
            }
        }
    } else {
        console.error('GameManager is not defined');
        const gamesContainer = document.getElementById('games-container');
        if (gamesContainer) {
            gamesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>🎮 Trò chơi học từ vựng</h3>
                    <p style="color: #e74c3c;">Không thể tải trò chơi</p>
                    <p style="color: #666; font-size: 0.9em;">Vui lòng tải lại trang</p>
                </div>
            `;
        }
    }
}

// ============= PLACEHOLDER FUNCTIONS (cần implement) =============

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
        UIManager.showToast('Chủ đề này đã tồn tại!', 'warning');
        return;
    }

    wordTopics[topicName] = [];
    VocabularyManager.saveTopics();

    loadTopicsList();
    UIManager.showToast(`Đã tạo chủ đề "${topicName}" thành công!`, 'success');
}

function deleteTopic() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        UIManager.showToast('Vui lòng chọn một chủ đề để xóa!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;
    const confirmDelete = confirm(`Bạn có chắc muốn xóa chủ đề "${topicName}" không?`);
    if (!confirmDelete) return;

    // Xóa chủ đề
    delete wordTopics[topicName];
    VocabularyManager.saveTopics();

    // Cập nhật giao diện
    loadTopicsList();
    document.getElementById('topic-words-list').innerHTML = '';
    UIManager.showToast(`Đã xóa chủ đề "${topicName}"!`, 'success');
}

function showAddToTopicDialog() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        UIManager.showToast('Vui lòng chọn một chủ đề trước!', 'warning');
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
    };    // Hiển thị hộp thoại
    document.getElementById('word-selector-dialog').style.display = 'block';
}

function saveWordsToTopic(topicName) {
    const selectedWords = [];

    document.querySelectorAll('#word-selector-body input[type="checkbox"]:checked').forEach(cb => {
        selectedWords.push(cb.dataset.word);
    });

    // Cập nhật chủ đề
    wordTopics[topicName] = selectedWords;
    VocabularyManager.saveTopics();

    // Cập nhật giao diện
    loadTopicWords(topicName);
    document.getElementById('word-selector-dialog').style.display = 'none';
    UIManager.showToast(`Đã cập nhật từ vựng trong chủ đề "${topicName}"!`, 'success');
}

function removeFromTopic() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    const selectedWord = document.querySelector('#topic-words-list li.selected');

    if (!selectedTopic || !selectedWord) {
        UIManager.showToast('Vui lòng chọn chủ đề và từ cần xóa!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;
    const word = selectedWord.dataset.word;

    // Xóa từ khỏi chủ đề
    if (wordTopics[topicName]) {
        wordTopics[topicName] = wordTopics[topicName].filter(w => w !== word);
        VocabularyManager.saveTopics();

        // Cập nhật giao diện
        loadTopicWords(topicName);
        UIManager.showToast(`Đã xóa từ "${word}" khỏi chủ đề "${topicName}"!`, 'success');
    }
}

function autoClassifyWords() {
    const selectedTopic = document.querySelector('#topics-list li.selected');
    if (!selectedTopic) {
        UIManager.showToast('Vui lòng chọn một chủ đề để phân loại tự động!', 'warning');
        return;
    }

    const topicName = selectedTopic.dataset.topic;

    // Chức năng phân loại tự động với từ khóa đơn giản
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
        UIManager.showToast(`Không có từ khóa để phân loại tự động cho chủ đề "${topicName}"!`, 'warning');
        return;
    }

    // Tìm các từ phù hợp với chủ đề
    const suggestedWords = Object.keys(vocabulary).filter(word => {
        const lowerWord = word.toLowerCase();
        return topicKeywords.some(keyword => lowerWord.includes(keyword.toLowerCase()));
    });

    if (suggestedWords.length === 0) {
        UIManager.showToast('Không tìm thấy từ nào phù hợp với chủ đề này!', 'warning');
        return;
    }

    // Cập nhật chủ đề với các từ được đề xuất
    wordTopics[topicName] = [...new Set([...wordTopics[topicName] || [], ...suggestedWords])];
    VocabularyManager.saveTopics();

    // Cập nhật giao diện
    loadTopicWords(topicName);
    UIManager.showToast(`Đã thêm ${suggestedWords.length} từ vào chủ đề "${topicName}"!`, 'success');
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
        UIManager.showToast('Nhóm từ đồng nghĩa này đã tồn tại!', 'warning');
        return;
    }

    // Tạo nhóm từ đồng nghĩa mới
    wordSynonyms[groupName] = [];
    VocabularyManager.saveSynonyms();

    // Cập nhật giao diện
    loadSynonymsList();
    UIManager.showToast(`Đã tạo nhóm từ đồng nghĩa "${groupName}" thành công!`, 'success');
}

function deleteSynonymGroup() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        UIManager.showToast('Vui lòng chọn một nhóm từ đồng nghĩa để xóa!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;
    const confirmDelete = confirm(`Bạn có chắc muốn xóa nhóm từ đồng nghĩa "${groupName}" không?`);
    if (!confirmDelete) return;

    // Xóa nhóm từ đồng nghĩa
    delete wordSynonyms[groupName];
    VocabularyManager.saveSynonyms();

    // Cập nhật giao diện
    loadSynonymsList();
    document.getElementById('synonym-words-list').innerHTML = '';
    UIManager.showToast(`Đã xóa nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

function showAddToSynonymDialog() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        UIManager.showToast('Vui lòng chọn một nhóm từ đồng nghĩa trước!', 'warning');
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
        });    };

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
    VocabularyManager.saveSynonyms();

    // Cập nhật giao diện
    loadSynonymWords(groupName);
    document.getElementById('word-selector-dialog').style.display = 'none';
    UIManager.showToast(`Đã cập nhật từ vựng trong nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

function removeFromSynonym() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    const selectedWord = document.querySelector('#synonym-words-list li.selected');

    if (!selectedGroup || !selectedWord) {
        UIManager.showToast('Vui lòng chọn nhóm từ đồng nghĩa và từ cần xóa!', 'warning');
        return;
    }

    const groupName = selectedGroup.dataset.group;
    const word = selectedWord.dataset.word;

    // Xóa từ khỏi nhóm từ đồng nghĩa
    if (wordSynonyms[groupName]) {
        wordSynonyms[groupName] = wordSynonyms[groupName].filter(w => w !== word);
        VocabularyManager.saveSynonyms();

        // Cập nhật giao diện
        loadSynonymWords(groupName);
        UIManager.showToast(`Đã xóa từ "${word}" khỏi nhóm từ đồng nghĩa "${groupName}"!`, 'success');
    }
}

function autoUpdateSynonyms() {
    const selectedGroup = document.querySelector('#synonyms-list li.selected');
    if (!selectedGroup) {
        UIManager.showToast('Vui lòng chọn một nhóm từ đồng nghĩa để cập nhật tự động!', 'warning');
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
        UIManager.showToast('Không có dữ liệu về từ đồng nghĩa cho nhóm này!', 'warning');
        return;
    }

    // Tìm các từ trong từ điển có trong danh sách từ đồng nghĩa
    const matchedWords = Object.keys(vocabulary).filter(word => {
        const lowerWord = word.toLowerCase();
        return synonymSet.some(syn => lowerWord === syn.toLowerCase() || lowerWord.includes(syn.toLowerCase()));
    });

    if (matchedWords.length === 0) {
        UIManager.showToast('Không tìm thấy từ đồng nghĩa phù hợp trong từ điển!', 'warning');
        return;
    }

    // Cập nhật nhóm từ đồng nghĩa
    wordSynonyms[groupName] = [...new Set([...wordSynonyms[groupName] || [], ...matchedWords])];
    VocabularyManager.saveSynonyms();

    // Cập nhật giao diện
    loadSynonymWords(groupName);
    UIManager.showToast(`Đã thêm ${matchedWords.length} từ vào nhóm từ đồng nghĩa "${groupName}"!`, 'success');
}

function startSRSSession() {
    console.log('startSRSSession: Bắt đầu phiên học SRS...');
    
    // Lấy danh sách từ cần ôn tập
    const dueWords = SRSManager.getDueWords();
    console.log('startSRSSession: Tìm thấy', dueWords.length, 'từ cần ôn tập');
    
    if (dueWords.length === 0) {
        showNoWordsMessage();
        return;
    }
    
    // Giới hạn số từ trong một phiên học (tối đa 20 từ)
    currentSRSWords = dueWords.slice(0, 20);
    currentSRSIndex = 0;
    
    // Khởi tạo session
    srsSession = {
        totalWords: currentSRSWords.length,
        completedWords: 0,
        correctWords: 0,
        showingAnswer: false
    };
    
    // Hiển thị từ đầu tiên
    showSRSWord();
    updateSRSProgress();
    console.log('startSRSSession: Đã khởi tạo phiên học SRS thành công');
}

function initSRSSession() {
    console.log('initSRSSession: Khởi tạo giao diện SRS...');
    
    // Reset session
    currentSRSWords = [];
    currentSRSIndex = 0;
    srsSession = {
        totalWords: 0,
        completedWords: 0,
        correctWords: 0,
        showingAnswer: false
    };
    
    // Hiển thị intro và ẩn các thành phần khác
    const srsIntro = document.getElementById('srs-intro');
    const srsCard = document.querySelector('.srs-card');
    const srsControls = document.getElementById('srs-controls');
    
    if (srsIntro) srsIntro.style.display = 'block';
    if (srsCard) {
        srsCard.style.display = 'none';
        srsCard.classList.remove('active');
    }
    if (srsControls) {
        srsControls.style.display = 'none';
        srsControls.classList.remove('active');
    }
    
    // Ẩn các nút đánh giá
    const ratingButtons = document.getElementById('srs-rating-buttons');
    if (ratingButtons) {
        ratingButtons.style.display = 'none';
    }
      // Hiển thị nút show answer
    const showAnswerBtn = document.getElementById('srs-show-answer');
    if (showAnswerBtn) {
        showAnswerBtn.style.display = 'block';
    }
    
    // Reset progress
    updateSRSProgress();
    
    console.log('initSRSSession: Đã khởi tạo giao diện SRS');
}

// Hiển thị từ SRS hiện tại
function showSRSWord() {
    if (currentSRSIndex >= currentSRSWords.length) {
        showSRSSessionComplete();
        return;
    }
    
    // Ẩn intro và hiển thị SRS card
    const srsIntro = document.getElementById('srs-intro');
    const srsCard = document.querySelector('.srs-card');
    const srsControls = document.getElementById('srs-controls');
    
    if (srsIntro) srsIntro.style.display = 'none';
    if (srsCard) {
        srsCard.style.display = 'block';
        srsCard.classList.add('active');
    }
    if (srsControls) {
        srsControls.style.display = 'block';
        srsControls.classList.add('active');
    }
      const currentWordData = currentSRSWords[currentSRSIndex];
    const word = currentWordData.word;
    const wordSRSData = SRSManager.initWord(word);
    
    // Cập nhật UI
    const srsWordElement = document.getElementById('srs-word');
    const srsMeaningElement = document.getElementById('srs-meaning');
    const srsWordInfoElement = document.getElementById('srs-word-info');
    
    if (srsWordElement) srsWordElement.textContent = word;
    if (srsMeaningElement) srsMeaningElement.textContent = vocabulary[word] || '';
    
    // Hiển thị thông tin từ
    let wordInfo = '';
    if (currentWordData.isNew) {
        wordInfo = 'Từ mới';
    } else if (currentWordData.overdueDays > 0) {
        wordInfo = `Quá hạn ${currentWordData.overdueDays} ngày`;
    } else if (wordSRSData) {
        wordInfo = `Lần thứ ${wordSRSData.repetitions + 1}`;
    } else {
        wordInfo = 'Từ mới';
    }
    if (srsWordInfoElement) srsWordInfoElement.textContent = wordInfo;    // Ẩn đáp án và hiện nút "Hiện đáp án"
    const srsAnswerElement = document.getElementById('srs-answer');
    const showAnswerBtn = document.getElementById('srs-show-answer');
    const ratingButtons = document.getElementById('srs-rating-buttons');
    
    if (srsAnswerElement) srsAnswerElement.style.display = 'none';
    if (showAnswerBtn) showAnswerBtn.style.display = 'block';
    if (ratingButtons) ratingButtons.style.display = 'none';
    
    // Hiển thị ví dụ nếu có
    const example = wordExamples[word];
    const srsExampleElement = document.getElementById('srs-example');
    if (example && srsExampleElement) {
        srsExampleElement.textContent = example;
        srsExampleElement.style.display = 'block';
    } else if (srsExampleElement) {
        srsExampleElement.style.display = 'none';
    }
    
    srsSession.showingAnswer = false;
    updateSRSProgress();
}

// Cập nhật thanh tiến trình SRS
function updateSRSProgress() {
    const progressText = document.getElementById('srs-progress-text');
    const progressBar = document.getElementById('srs-progress-bar');
    
    if (srsSession.totalWords === 0) {
        if (progressText) progressText.textContent = 'Không có từ nào cần ôn tập';
        if (progressBar) progressBar.style.width = '100%';
        return;
    }
    
    const percentage = Math.round((srsSession.completedWords / srsSession.totalWords) * 100);
    const accuracy = srsSession.completedWords > 0 ? Math.round((srsSession.correctWords / srsSession.completedWords) * 100) : 0;
    
    if (progressText) {
        progressText.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span><i class="fas fa-book"></i> ${srsSession.completedWords}/${srsSession.totalWords} từ (${percentage}%)</span>
                <span><i class="fas fa-target"></i> Độ chính xác: ${accuracy}%</span>
            </div>
        `;
    }
    if (progressBar) progressBar.style.width = `${percentage}%`;
}

// Hiển thị thông báo không có từ cần ôn tập
function showNoWordsMessage() {
    // Ẩn card và controls
    const srsCard = document.querySelector('.srs-card');
    const srsControls = document.getElementById('srs-controls');
    
    if (srsCard) srsCard.style.display = 'none';
    if (srsControls) srsControls.style.display = 'none';
    
    // Hiển thị message đẹp
    const srsIntro = document.getElementById('srs-intro');
    if (srsIntro) {
        srsIntro.innerHTML = `
            <div class="srs-no-words">
                <div class="icon">🌟</div>
                <h3>Tuyệt vời!</h3>
                <p>Không có từ nào cần ôn tập hôm nay</p>
                <button id="srs-dashboard-btn" class="btn primary">
                    <i class="fas fa-chart-bar"></i> Xem thống kê
                </button>
            </div>
        `;
        srsIntro.style.display = 'block';
        
        // Re-attach event listener for dashboard button
        const dashboardBtn = document.getElementById('srs-dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', showSRSDashboard);
        }
    }
    
    updateSRSProgress();
}

// Hiển thị kết quả hoàn thành phiên học SRS
function showSRSSessionComplete() {
    const accuracy = Math.round((srsSession.correctWords / srsSession.totalWords) * 100);
    
    // Ẩn card và controls
    const srsCard = document.querySelector('.srs-card');
    const srsControls = document.getElementById('srs-controls');
    
    if (srsCard) srsCard.style.display = 'none';
    if (srsControls) srsControls.style.display = 'none';
    
    // Hiển thị completion modal
    showCompletionModal(srsSession.totalWords, srsSession.correctWords, accuracy);
    
    // Show toast message
    let message = `Hoàn thành phiên học SRS!\n\n`;
    message += `Đã ôn tập: ${srsSession.totalWords} từ\n`;
    message += `Trả lời đúng: ${srsSession.correctWords} từ\n`;
    message += `Độ chính xác: ${accuracy}%`;
    
    UIManager.showToast(message, 'success');
}

function showCompletionModal(totalWords, correctWords, accuracy) {
    const modal = document.getElementById('srs-completion-container');
    const icon = document.getElementById('completion-icon');
    const title = document.getElementById('completion-title');
    const subtitle = document.getElementById('completion-subtitle');
    const totalEl = document.getElementById('completion-total');
    const correctEl = document.getElementById('completion-correct');
    const accuracyEl = document.getElementById('completion-accuracy');
    
    if (!modal) return;
    
    // Set icon and title based on accuracy
    let iconClass = '';
    let titleText = '';
    let subtitleText = '';
    
    if (accuracy >= 90) {
        icon.textContent = '👑';
        icon.className = 'completion-icon excellent';
        titleText = 'Xuất sắc!';
        subtitleText = 'Bạn đã thành thạo các từ vựng này';
    } else if (accuracy >= 70) {
        icon.textContent = '🎉';
        icon.className = 'completion-icon good';
        titleText = 'Tốt lắm!';
        subtitleText = 'Tiếp tục cố gắng để đạt kết quả cao hơn';
    } else if (accuracy >= 50) {
        icon.textContent = '👍';
        icon.className = 'completion-icon average';
        titleText = 'Khá tốt!';
        subtitleText = 'Hãy ôn tập thêm để cải thiện';
    } else {
        icon.textContent = '💪';
        icon.className = 'completion-icon poor';
        titleText = 'Cần cố gắng!';
        subtitleText = 'Đừng bỏ cuộc, hãy tiếp tục luyện tập';
    }
    
    title.textContent = titleText;
    subtitle.textContent = subtitleText;
    totalEl.textContent = totalWords;
    correctEl.textContent = correctWords;
    accuracyEl.textContent = accuracy + '%';
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 50);
    
    // Setup event listeners
    setupCompletionModalEvents();
}

function setupCompletionModalEvents() {
    const modal = document.getElementById('srs-completion-container');
    const restartBtn = document.getElementById('completion-restart');
    const dashboardBtn = document.getElementById('completion-dashboard');
    const closeBtn = document.getElementById('completion-close');
    
    if (restartBtn) {
        restartBtn.onclick = () => {
            hideCompletionModal();
            startSRSSession();
        };
    }
    
    if (dashboardBtn) {
        dashboardBtn.onclick = () => {
            hideCompletionModal();
            showSRSDashboard();
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = hideCompletionModal;
    }
    
    // Close on background click
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                hideCompletionModal();
            }
        };
    }
}

function hideCompletionModal() {
    const modal = document.getElementById('srs-completion-container');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 500);
    }
}

function setupSRSEventListeners() {
    // Event listeners đã được thiết lập trong initSRSTab
}

function showSRSAnswer() {
    document.getElementById('srs-answer').style.display = 'block';
    document.getElementById('srs-show-answer').style.display = 'none';
    document.getElementById('srs-rating-buttons').style.display = 'grid';
    
    // Cập nhật nhãn thời gian cho các nút đánh giá
    updateSRSButtons();
    srsSession.showingAnswer = true;
}

// Cập nhật nhãn thời gian cho các nút đánh giá
function updateSRSButtons() {
    const currentWordData = currentSRSWords[currentSRSIndex];
    const word = currentWordData.word;
    const wordSRSData = SRSManager.initWord(word);
    
    // Tính toán interval cho mỗi mức độ
    const againInterval = SRSManager.calculateNextInterval(wordSRSData, SRS_DIFFICULTY.AGAIN).interval;
    const hardInterval = SRSManager.calculateNextInterval(wordSRSData, SRS_DIFFICULTY.HARD).interval;
    const goodInterval = SRSManager.calculateNextInterval(wordSRSData, SRS_DIFFICULTY.GOOD).interval;
    const easyInterval = SRSManager.calculateNextInterval(wordSRSData, SRS_DIFFICULTY.EASY).interval;
    
    // Cập nhật nhãn
    document.querySelector('#srs-again small').textContent = formatInterval(againInterval);
    document.querySelector('#srs-hard small').textContent = formatInterval(hardInterval);
    document.querySelector('#srs-good small').textContent = formatInterval(goodInterval);
    document.querySelector('#srs-easy small').textContent = formatInterval(easyInterval);
}

// Định dạng interval thành text dễ đọc
function formatInterval(days) {
    if (days < 1) {
        const minutes = Math.round(days * 24 * 60);
        return `${minutes} phút`;
    } else if (days === 1) {
        return '1 ngày';
    } else if (days < 30) {
        return `${Math.round(days)} ngày`;
    } else if (days < 365) {
        const months = Math.round(days / 30);
        return `${months} tháng`;
    } else {
        const years = Math.round(days / 365);
        return `${years} năm`;
    }
}

function rateSRSWord(difficulty) {
    if (!srsSession.showingAnswer) return;
    
    const currentWordData = currentSRSWords[currentSRSIndex];
    const word = currentWordData.word;
    
    // Cập nhật dữ liệu SRS
    SRSManager.updateWordSRS(word, difficulty);
    
    // Cập nhật thống kê phiên học
    srsSession.completedWords++;
    if (difficulty >= SRS_DIFFICULTY.GOOD) {
        srsSession.correctWords++;
    }
    
    // Chuyển sang từ tiếp theo
    currentSRSIndex++;
    
    // Hiển thị từ tiếp theo hoặc kết thúc phiên học
    if (currentSRSIndex < currentSRSWords.length) {
        showSRSWord();
    } else {
        showSRSSessionComplete();
    }
}

function saveSettings() {
    localStorage.setItem('speechRate', document.getElementById('speech-speed')?.value || '1');
    localStorage.setItem('theme', document.getElementById('theme-select')?.value || 'light');
    localStorage.setItem('backgroundColor', document.getElementById('background-color')?.value || '#f5f5f5');
    UIManager.showToast('Đã lưu cài đặt thành công!', 'success');
}

function resetSettings() {
    const confirmReset = confirm('Bạn có chắc muốn khôi phục tất cả cài đặt về mặc định không?');
    if (!confirmReset) return;

    // Xóa tất cả cài đặt đã lưu
    ['speechRate', 'selectedVoice', 'theme', 'backgroundColor', 'backgroundImage'].forEach(key => {
        localStorage.removeItem(key);
    });

    // Reset UI elements
    const elements = {
        'speech-speed': '1',
        'theme-select': 'light',
        'background-color': '#f5f5f5'
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = elements[id];
    });

    // Apply default theme
    document.body.classList.remove('dark-theme');
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.backgroundImage = 'none';

    UIManager.showToast('Đã khôi phục cài đặt mặc định!', 'info');
}

// ============= SRS DASHBOARD FUNCTIONS =============

function showSRSDashboard() {
    console.log('showSRSDashboard: Opening SRS dashboard...');
    
    // Ensure vocabulary data is loaded before calculating statistics
    if (!vocabulary || Object.keys(vocabulary).length === 0) {
        console.log('showSRSDashboard: Vocabulary not loaded yet, ensuring VocabularyManager data is available...');
        VocabularyManager.updateGlobalVariables();
        
        // If still empty, show loading state
        if (!vocabulary || Object.keys(vocabulary).length === 0) {
            console.warn('showSRSDashboard: Vocabulary data is empty, showing loading state');
            showSRSDashboardLoadingState();
            return;
        }
    }
    
    // Ensure SRS data is loaded
    SRSManager.loadSRSData();
    
    // Get statistics from SRS Manager
    const stats = SRSManager.getStatistics();
    
    // Update dashboard elements with validation
    const totalWordsEl = document.getElementById('total-words-stat');
    const studiedWordsEl = document.getElementById('studied-words-stat');
    const newWordsEl = document.getElementById('new-words-stat');
    const dueWordsEl = document.getElementById('due-words-stat');
    const learnedWordsEl = document.getElementById('learned-words-stat');
    const accuracyEl = document.getElementById('accuracy-stat');
    const syncStatusEl = document.getElementById('sync-status-stat');
    
    if (totalWordsEl) totalWordsEl.textContent = stats.totalWords;
    if (studiedWordsEl) studiedWordsEl.textContent = stats.studiedWords;
    if (newWordsEl) newWordsEl.textContent = stats.newWords;
    if (dueWordsEl) dueWordsEl.textContent = stats.dueWords;
    if (learnedWordsEl) learnedWordsEl.textContent = stats.learnedWords;
    if (accuracyEl) accuracyEl.textContent = stats.averageAccuracy + '%';
    
    // Update sync status
    if (syncStatusEl && SRSManager.checkSyncStatus) {
        const syncStatus = SRSManager.checkSyncStatus();
        syncStatusEl.textContent = syncStatus.message;
        
        // Update card color based on status
        const syncCard = document.getElementById('sync-status-card');
        if (syncCard) {
            syncCard.className = 'srs-stat-card';
            if (syncStatus.status === 'enabled') {
                syncCard.classList.add('sync-enabled');
            } else if (syncStatus.status === 'no-auth') {
                syncCard.classList.add('sync-no-auth');
            } else {
                syncCard.classList.add('sync-disabled');
            }
        }
    }
    
    // Show dashboard
    const dashboard = document.getElementById('srs-dashboard');
    if (dashboard) {
        dashboard.style.display = 'flex';
    }
    
    console.log('showSRSDashboard: Dashboard opened with stats:', stats);
}

function closeSRSDashboard() {
    console.log('closeSRSDashboard: Closing SRS dashboard...');
    const dashboard = document.getElementById('srs-dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
}

function resetSRSData() {
    const confirmReset = confirm('Bạn có chắc muốn reset tất cả dữ liệu SRS không? Thao tác này không thể hoàn tác!');
    if (!confirmReset) return;
    
    SRSManager.resetAllData();
    UIManager.showToast('Đã reset tất cả dữ liệu SRS!', 'success');
    
    // Update dashboard if it's open
    const dashboard = document.getElementById('srs-dashboard');
    if (dashboard && dashboard.style.display === 'flex') {
        showSRSDashboard(); // Refresh the dashboard
    }
}

function exportSRSData() {
    try {
        const data = SRSManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `srs_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        UIManager.showToast('Đã xuất dữ liệu SRS thành công!', 'success');
    } catch (error) {
        console.error('Error exporting SRS data:', error);
        UIManager.showToast('Có lỗi khi xuất dữ liệu SRS!', 'error');
    }
}

async function syncSRSData() {
    console.log('syncSRSData: Bắt đầu đồng bộ dữ liệu SRS...');
    
    if (!window.CloudManager) {
        UIManager.showToast('CloudManager chưa sẵn sàng!', 'error');
        return;
    }
    
    try {
        // Hiển thị loading state
        const syncBtn = document.getElementById('sync-srs-data');
        const originalText = syncBtn.innerHTML;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...';
        syncBtn.disabled = true;
        
        // Thực hiện force sync
        const success = await window.CloudManager.forceSyncData();
        
        if (success) {
            UIManager.showToast('Đồng bộ dữ liệu SRS thành công!', 'success');
            
            // Refresh dashboard nếu đang mở
            const dashboard = document.getElementById('srs-dashboard');
            if (dashboard && dashboard.style.display === 'flex') {
                showSRSDashboard(); // Refresh the dashboard
            }
        } else {
            UIManager.showToast('Không thể đồng bộ dữ liệu. Vui lòng kiểm tra kết nối và thông tin đăng nhập.', 'error');
        }
        
        // Khôi phục trạng thái nút
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
        
    } catch (error) {
        console.error('Error syncing SRS data:', error);
        UIManager.showToast('Lỗi khi đồng bộ dữ liệu SRS: ' + error.message, 'error');
        
        // Khôi phục trạng thái nút
        const syncBtn = document.getElementById('sync-srs-data');
        syncBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Đồng bộ Cloud';
        syncBtn.disabled = false;
    }
}

// Show loading state for SRS dashboard when vocabulary data is not available
function showSRSDashboardLoadingState() {
    const totalWordsEl = document.getElementById('total-words-stat');
    const studiedWordsEl = document.getElementById('studied-words-stat');
    const newWordsEl = document.getElementById('new-words-stat');
    const dueWordsEl = document.getElementById('due-words-stat');
    const learnedWordsEl = document.getElementById('learned-words-stat');
    const accuracyEl = document.getElementById('accuracy-stat');
    const syncStatusEl = document.getElementById('sync-status-stat');
    
    if (totalWordsEl) totalWordsEl.textContent = '---';
    if (studiedWordsEl) studiedWordsEl.textContent = '---';
    if (newWordsEl) newWordsEl.textContent = '---';
    if (dueWordsEl) dueWordsEl.textContent = '---';
    if (learnedWordsEl) learnedWordsEl.textContent = '---';
    if (accuracyEl) accuracyEl.textContent = '---%';
    if (syncStatusEl) syncStatusEl.textContent = 'Đang tải dữ liệu...';
    
    // Show dashboard
    const dashboard = document.getElementById('srs-dashboard');
    if (dashboard) {
        dashboard.style.display = 'flex';
    }
    
    // Try to reload the dashboard after a short delay
    setTimeout(() => {
        if (vocabulary && Object.keys(vocabulary).length > 0) {
            showSRSDashboard();
        }
    }, 1000);
}

// ============= EXISTING FUNCTIONS =============

// Khởi động ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', init);

// Fallback cho trường hợp DOMContentLoaded đã được fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('TuVung App - Modular Version Loaded');
