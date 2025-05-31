// Module quản lý học tập (Learning Tasks)
const LearningManager = {
    currentWordList: [],
    currentIndex: 0,
    learnedWords: new Set(),
    learnedWordsCount: 0,

    // Khởi tạo
    init() {
        this.loadLearnedWords();
        this.setupEventListeners();
    },

    // Thiết lập danh sách từ học
    initializeWordList(words) {
        this.currentWordList = Array.isArray(words) ? words : Object.keys(words);
        this.shuffleArray(this.currentWordList);
        this.currentIndex = 0;
        this.updateProgress();
    },

    // Trộn mảng
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    // Tải từ đã học từ localStorage
    loadLearnedWords() {
        try {
            const saved = localStorage.getItem('learnedWords');
            if (saved) {
                this.learnedWords = new Set(JSON.parse(saved));
                this.learnedWordsCount = this.learnedWords.size;
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách từ đã học:", error);
        }
    },

    // Lưu từ đã học
    saveLearnedWords() {
        localStorage.setItem('learnedWords', JSON.stringify([...this.learnedWords]));
    },

    // Đánh dấu từ đã học
    markWordAsLearned(word) {
        if (!this.learnedWords.has(word)) {
            this.learnedWords.add(word);
            this.learnedWordsCount++;
            this.saveLearnedWords();
            return true;
        }
        return false;
    },

    // Bỏ đánh dấu từ đã học
    unmarkWordAsLearned(word) {
        if (this.learnedWords.has(word)) {
            this.learnedWords.delete(word);
            this.learnedWordsCount--;
            this.saveLearnedWords();
            return true;
        }
        return false;
    },

    // Cập nhật tiến trình
    updateProgress() {
        if (this.currentWordList.length === 0) return;

        const learnedCount = this.currentWordList.filter(word => this.learnedWords.has(word)).length;
        const percentage = Math.round((learnedCount / this.currentWordList.length) * 100);

        // Cập nhật UI
        if (window.UIManager) {
            window.UIManager.updateProgressText('learn-word-count', this.currentIndex + 1, this.currentWordList.length, learnedCount);
            window.UIManager.updateProgress('learning-progress', percentage);
        }
    },

    // Chuyển đến từ tiếp theo
    nextWord() {
        if (this.currentWordList.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.currentWordList.length;
        this.updateProgress();
        return this.getCurrentWord();
    },

    // Chuyển đến từ trước
    prevWord() {
        if (this.currentWordList.length === 0) return;
        
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.currentWordList.length - 1;
        this.updateProgress();
        return this.getCurrentWord();
    },

    // Lấy từ hiện tại
    getCurrentWord() {
        if (this.currentWordList.length === 0) return null;
        return this.currentWordList[this.currentIndex];
    },

    // Lấy nghĩa của từ hiện tại
    getCurrentMeaning() {
        const word = this.getCurrentWord();
        return word && window.vocabulary ? window.vocabulary[word] : '';
    },

    // Kiểm tra từ đã học chưa
    isWordLearned(word) {
        return this.learnedWords.has(word);
    },

    // Task nghe viết từ (Dictation)
    dictationTask: {
        currentWord: null,
        
        init(wordList) {
            this.currentWord = null;
            if (wordList && wordList.length > 0) {
                LearningManager.initializeWordList(wordList);
                this.showNextWord();
            }
        },

        showNextWord() {
            this.currentWord = LearningManager.getCurrentWord();
            this.clearInput();
            this.clearResult();
            LearningManager.updateProgress();
        },

        clearInput() {
            const input = document.getElementById('dictation-input');
            if (input) input.value = '';
        },

        clearResult() {
            const result = document.getElementById('dictation-result');
            if (result) {
                result.innerHTML = '';
                result.className = 'result-box';
            }
        },

        async speakCurrentWord() {
            if (this.currentWord && window.AudioManager) {
                await window.AudioManager.speakWord(this.currentWord);
            }
        },

        checkAnswer() {
            const input = document.getElementById('dictation-input');
            const result = document.getElementById('dictation-result');
            
            if (!input || !result || !this.currentWord) return;

            const userInput = input.value.trim().toLowerCase();
            const correctWord = this.currentWord.toLowerCase();

            if (userInput === '') {
                result.textContent = 'Vui lòng nhập từ bạn nghe được!';
                result.className = 'result-box';
                return;
            }

            if (userInput === correctWord) {
                result.textContent = '✓ Chính xác!';
                result.className = 'result-box correct';
                LearningManager.markWordAsLearned(this.currentWord);
                
                if (window.AudioManager) {
                    window.AudioManager.playCorrectSound();
                }
            } else {
                result.textContent = `✗ Không chính xác! Từ đúng là "${this.currentWord}".`;
                result.className = 'result-box incorrect';
                
                if (window.AudioManager) {
                    window.AudioManager.playIncorrectSound();
                }
            }

            LearningManager.updateProgress();
        },

        nextWord() {
            LearningManager.nextWord();
            this.showNextWord();
        }
    },

    // Task xem nghĩa viết từ (Translation)
    translationTask: {
        currentWord: null,

        init(wordList) {
            this.currentWord = null;
            if (wordList && wordList.length > 0) {
                LearningManager.initializeWordList(wordList);
                this.showNextWord();
            }
        },

        showNextWord() {
            this.currentWord = LearningManager.getCurrentWord();
            this.showMeaning();
            this.clearInput();
            this.clearResult();
            LearningManager.updateProgress();
        },

        showMeaning() {
            const meaningElement = document.getElementById('meaning-text');
            if (meaningElement && this.currentWord) {
                meaningElement.textContent = LearningManager.getCurrentMeaning();
            }
        },

        clearInput() {
            const input = document.getElementById('word-input');
            if (input) input.value = '';
        },

        clearResult() {
            const result = document.getElementById('word-result');
            if (result) {
                result.innerHTML = '';
                result.className = 'result-box';
            }
        },

        checkAnswer() {
            const input = document.getElementById('word-input');
            const result = document.getElementById('word-result');
            
            if (!input || !result || !this.currentWord) return;

            const userInput = input.value.trim().toLowerCase();
            const correctWord = this.currentWord.toLowerCase();

            if (userInput === '') {
                result.textContent = 'Vui lòng nhập từ tiếng Anh!';
                result.className = 'result-box';
                return;
            }

            if (userInput === correctWord) {
                result.textContent = '✓ Chính xác!';
                result.className = 'result-box correct';
                LearningManager.markWordAsLearned(this.currentWord);
                
                if (window.AudioManager) {
                    window.AudioManager.playCorrectSound();
                }
            } else {
                result.textContent = `✗ Không chính xác! Từ đúng là "${this.currentWord}".`;
                result.className = 'result-box incorrect';
                
                if (window.AudioManager) {
                    window.AudioManager.playIncorrectSound();
                }
            }

            LearningManager.updateProgress();
        },

        nextWord() {
            LearningManager.nextWord();
            this.showNextWord();
        },

        async speakCurrentWord() {
            if (this.currentWord && window.AudioManager) {
                await window.AudioManager.speakWord(this.currentWord);
            }
        }
    },

    // Thiết lập event listeners
    setupEventListeners() {
        // Dictation task events
        const dictationSpeakBtn = document.getElementById('dictation-speak');
        if (dictationSpeakBtn) {
            dictationSpeakBtn.addEventListener('click', () => {
                this.dictationTask.speakCurrentWord();
            });
        }

        const checkDictationBtn = document.getElementById('check-dictation');
        if (checkDictationBtn) {
            checkDictationBtn.addEventListener('click', () => {
                this.dictationTask.checkAnswer();
            });
        }

        const dictationNextBtn = document.getElementById('dictation-next');
        if (dictationNextBtn) {
            dictationNextBtn.addEventListener('click', () => {
                this.dictationTask.nextWord();
            });
        }

        const dictationInput = document.getElementById('dictation-input');
        if (dictationInput) {
            dictationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.dictationTask.checkAnswer();
                }
            });
        }

        // Translation task events
        const checkWordBtn = document.getElementById('check-word');
        if (checkWordBtn) {
            checkWordBtn.addEventListener('click', () => {
                this.translationTask.checkAnswer();
            });
        }

        const translationNextBtn = document.getElementById('translation-next');
        if (translationNextBtn) {
            translationNextBtn.addEventListener('click', () => {
                this.translationTask.nextWord();
            });
        }

        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.translationTask.checkAnswer();
                }
            });
        }

        const wordSpeakBtn = document.getElementById('word-speak');
        if (wordSpeakBtn) {
            wordSpeakBtn.addEventListener('click', () => {
                this.translationTask.speakCurrentWord();
            });
        }
    }
};

// Export LearningManager
window.LearningManager = LearningManager;
