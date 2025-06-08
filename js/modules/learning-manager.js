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

    // Task hoàn thành từ (Completion)
    completionTask: {
        currentWord: null,
        incompleteWord: '',
        
        init(wordList) {
            this.currentWord = null;
            if (wordList && wordList.length > 0) {
                LearningManager.initializeWordList(wordList);
                this.showNextWord();
            }
        },        showNextWord() {
            this.currentWord = LearningManager.getCurrentWord();
            this.generateIncompleteWord();
            this.showHint();
            this.updateCurrentWordDisplay(); // Gọi sau khi generateIncompleteWord
            this.clearInput();
            this.clearResult();
            LearningManager.updateProgress();
        },updateCurrentWordDisplay() {
            // Update current word display box với từ đã thiếu chữ cái
            const currentWordElement = document.getElementById('completion-current-word');
            if (currentWordElement && this.incompleteWord) {
                currentWordElement.textContent = this.incompleteWord;
                currentWordElement.classList.remove('loading');
            }
            
            // Update word counter
            const wordCounterElement = document.getElementById('completion-word-counter');
            if (wordCounterElement) {
                const currentIndex = LearningManager.currentIndex + 1;
                const totalWords = LearningManager.currentWordList.length;
                wordCounterElement.textContent = `Từ ${currentIndex}/${totalWords}`;
            }
        },        generateIncompleteWord() {
            if (!this.currentWord || this.currentWord.length < 3) {
                this.incompleteWord = this.currentWord;
                return;
            }

            let word = this.currentWord.toLowerCase();
            
            // Xử lý từ có dấu cách hoặc dấu gạch ngang - tách thành các từ riêng biệt
            if (word.includes(' ') || word.includes('-')) {
                // Tách từ bằng cả dấu cách và dấu gạch ngang, nhưng giữ lại dấu phân tách
                let parts = [];
                let separators = [];
                let currentPart = '';
                
                for (let i = 0; i < word.length; i++) {
                    let char = word[i];
                    if (char === ' ' || char === '-') {
                        if (currentPart) {
                            parts.push(currentPart);
                            separators.push(char);
                            currentPart = '';
                        }
                    } else {
                        currentPart += char;
                    }
                }
                
                // Thêm phần cuối cùng
                if (currentPart) {
                    parts.push(currentPart);
                }
                
                // Xử lý từng phần
                let incompleteParts = [];
                for (let part of parts) {
                    if (part.length < 3) {
                        // Từ ngắn giữ nguyên
                        incompleteParts.push(part);
                    } else {
                        // Áp dụng thuật toán ẩn chữ cái cho từng phần
                        let incomplete = '';
                        for (let i = 0; i < part.length; i++) {
                            if (i === 0 || i === part.length - 1) {
                                // Giữ chữ cái đầu và cuối
                                incomplete += part[i];
                            } else if (part.length > 5 && Math.random() < 0.4) {
                                // Với từ dài, ẩn khoảng 40% chữ cái ở giữa
                                incomplete += '_';
                            } else if (part.length <= 5 && Math.random() < 0.3) {
                                // Với từ ngắn, ẩn khoảng 30% chữ cái ở giữa
                                incomplete += '_';
                            } else {
                                incomplete += part[i];
                            }
                        }
                        
                        // Đảm bảo có ít nhất 1 chữ cái bị ẩn trong mỗi phần
                        if (incomplete === part && part.length >= 3) {
                            const middleIndex = Math.floor(part.length / 2);
                            incomplete = incomplete.substring(0, middleIndex) + '_' + incomplete.substring(middleIndex + 1);
                        }
                        
                        incompleteParts.push(incomplete);
                    }
                }
                
                // Ghép lại với các dấu phân tách ban đầu
                let result = '';
                for (let i = 0; i < incompleteParts.length; i++) {
                    result += incompleteParts[i];
                    if (i < separators.length) {
                        result += separators[i];
                    }
                }
                
                this.incompleteWord = result;
            } else {
                // Xử lý từ đơn (không có dấu cách hoặc dấu gạch ngang)
                let incomplete = '';
                
                for (let i = 0; i < word.length; i++) {
                    if (i === 0 || i === word.length - 1) {
                        // Giữ chữ cái đầu và cuối
                        incomplete += word[i];
                    } else if (word.length > 5 && Math.random() < 0.4) {
                        // Với từ dài, ẩn khoảng 40% chữ cái ở giữa
                        incomplete += '_';
                    } else if (word.length <= 5 && Math.random() < 0.3) {
                        // Với từ ngắn, ẩn khoảng 30% chữ cái ở giữa
                        incomplete += '_';
                    } else {
                        incomplete += word[i];
                    }
                }
                
                // Đảm bảo có ít nhất 1 chữ cái bị ẩn
                if (incomplete === word) {
                    const middleIndex = Math.floor(word.length / 2);
                    incomplete = incomplete.substring(0, middleIndex) + '_' + incomplete.substring(middleIndex + 1);
                }
                
                this.incompleteWord = incomplete;
            }
            
            console.log(`Generated incomplete word: "${this.currentWord}" -> "${this.incompleteWord}"`);
        },

        showHint() {
            const hintElement = document.getElementById('word-hint-text');
            if (hintElement && this.currentWord) {
                hintElement.textContent = LearningManager.getCurrentMeaning();
            }
        },

        clearInput() {
            const input = document.getElementById('completion-input');
            if (input) input.value = '';
        },

        clearResult() {
            const result = document.getElementById('completion-result');
            if (result) {
                result.innerHTML = '';
                result.className = 'result-box';
            }
        },

        checkAnswer() {
            const input = document.getElementById('completion-input');
            const result = document.getElementById('completion-result');
            
            if (!input || !result || !this.currentWord) return;

            const userInput = input.value.trim().toLowerCase();
            const correctWord = this.currentWord.toLowerCase();

            if (userInput === '') {
                result.textContent = 'Vui lòng nhập từ đầy đủ!';
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
            }            LearningManager.updateProgress();
        },

        nextWord() {
            LearningManager.nextWord();
            this.showNextWord();
        },        speakCurrentWord() {
            if (this.currentWord && window.AudioManager) {
                window.AudioManager.speakWord(this.currentWord);
                
                // Add visual feedback
                const speakBtn = document.getElementById('completion-speak');
                if (speakBtn) {
                    speakBtn.classList.add('speaking');
                    setTimeout(() => {
                        speakBtn.classList.remove('speaking');
                    }, 1000);
                }
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

        // Completion task events
        const checkCompletionBtn = document.getElementById('check-completion');
        if (checkCompletionBtn) {
            checkCompletionBtn.addEventListener('click', () => {
                this.completionTask.checkAnswer();
            });
        }

        const completionNextBtn = document.getElementById('completion-next');
        if (completionNextBtn) {
            completionNextBtn.addEventListener('click', () => {
                this.completionTask.nextWord();
            });
        }        const completionInput = document.getElementById('completion-input');
        if (completionInput) {
            completionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.completionTask.checkAnswer();
                }
            });
        }        // Completion task speak button
        const completionSpeakBtn = document.getElementById('completion-speak');
        if (completionSpeakBtn) {
            completionSpeakBtn.addEventListener('click', () => {
                this.completionTask.speakCurrentWord();
            });
        }
    }
};

// Export LearningManager
window.LearningManager = LearningManager;
