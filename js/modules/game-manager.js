// filepath: e:\code\robocon2025\TuVung\js\modules\game-manager.js

/**
 * GameManager - Quản lý các trò chơi học từ vựng
 * Tích hợp với hệ thống gamification và quản lý từ vựng hiện có
 */
class GameManager {
    constructor() {
        this.vocabularyManager = null;
        this.uiManager = null;
        this.audioManager = null;
        this.currentGame = null;
        this.gameStats = {
            totalGamesPlayed: 0,
            totalScore: 0,
            highScores: {},
            achievements: []
        };
        
        // Game types
        this.gameTypes = {
            WORD_MATCH: 'word-match',
            TYPING_RACE: 'typing-race',
            MEMORY_GAME: 'memory-game',
            WORD_BUILDER: 'word-builder',
            QUICK_TRANSLATE: 'quick-translate'
        };
        
        this.games = {};
        this.isInitialized = false;
        
        this.loadGameStats();
    }

    /**
     * Khởi tạo GameManager với các dependencies
     */
    async init(vocabularyManager, uiManager, audioManager) {
        try {
            this.vocabularyManager = vocabularyManager;
            this.uiManager = uiManager;
            this.audioManager = audioManager;
            
            this.initializeGames();
            this.setupEventListeners();
            this.isInitialized = true;
            
            console.log('GameManager initialized successfully');
        } catch (error) {
            console.error('Error initializing GameManager:', error);
        }
    }

    /**
     * Khởi tạo các trò chơi
     */
    initializeGames() {
        this.games[this.gameTypes.WORD_MATCH] = new WordMatchGame(this);
        this.games[this.gameTypes.TYPING_RACE] = new TypingRaceGame(this);
        this.games[this.gameTypes.MEMORY_GAME] = new MemoryGame(this);
        this.games[this.gameTypes.WORD_BUILDER] = new WordBuilderGame(this);
        this.games[this.gameTypes.QUICK_TRANSLATE] = new QuickTranslateGame(this);
    }

    /**
     * Thiết lập event listeners
     */
    setupEventListeners() {
        // Game selection buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-game-type]')) {
                const gameType = e.target.getAttribute('data-game-type');
                this.startGame(gameType);
            }
            
            if (e.target.matches('.game-back-btn')) {
                this.exitCurrentGame();
            }
        });
    }

    /**
     * Bắt đầu trò chơi
     */
    async startGame(gameType, options = {}) {
        if (!this.isInitialized) {
            console.error('GameManager not initialized');
            return;
        }

        if (!this.games[gameType]) {
            console.error('Game type not found:', gameType);
            return;
        }

        try {
            // Exit current game if any
            if (this.currentGame) {
                this.exitCurrentGame();
            }

            this.currentGame = this.games[gameType];
            await this.currentGame.start(options);
            
            this.gameStats.totalGamesPlayed++;
            this.saveGameStats();
            
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    /**
     * Kết thúc trò chơi hiện tại
     */
    exitCurrentGame() {
        if (this.currentGame) {
            this.currentGame.end();
            this.currentGame = null;
        }
        
        // Show game selection screen
        this.showGameSelection();
    }    /**
     * Hiển thị màn hình chọn trò chơi
     */
    showGameSelection() {
        const gameContainer = document.getElementById('games-container');
        if (!gameContainer) return;

        gameContainer.innerHTML = `
            <div class="game-selection">
                <h2 class="game-title">🎮 Trò Chơi Học Từ Vựng</h2>
                <div class="game-stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Tổng số trận:</span>
                        <span class="stat-value">${this.gameStats.totalGamesPlayed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tổng điểm:</span>
                        <span class="stat-value">${this.gameStats.totalScore}</span>
                    </div>
                </div>
                
                <div class="games-grid">
                    <div class="game-card" data-game-type="${this.gameTypes.WORD_MATCH}">
                        <div class="game-icon">🎯</div>
                        <h3>Ghép Từ</h3>
                        <p>Kết nối từ tiếng Anh với nghĩa tiếng Việt</p>
                        <div class="game-difficulty">Dễ</div>
                    </div>
                    
                    <div class="game-card" data-game-type="${this.gameTypes.TYPING_RACE}">
                        <div class="game-icon">⚡</div>
                        <h3>Đua Gõ Từ</h3>
                        <p>Gõ từ càng nhanh càng nhiều điểm</p>
                        <div class="game-difficulty">Trung bình</div>
                    </div>
                    
                    <div class="game-card" data-game-type="${this.gameTypes.MEMORY_GAME}">
                        <div class="game-icon">🧠</div>
                        <h3>Trí Nhớ</h3>
                        <p>Lật thẻ tìm cặp từ giống nhau</p>
                        <div class="game-difficulty">Trung bình</div>
                    </div>
                    
                    <div class="game-card" data-game-type="${this.gameTypes.WORD_BUILDER}">
                        <div class="game-icon">🔤</div>
                        <h3>Xếp Chữ</h3>
                        <p>Sắp xếp các chữ cái tạo thành từ</p>
                        <div class="game-difficulty">Khó</div>
                    </div>
                    
                    <div class="game-card" data-game-type="${this.gameTypes.QUICK_TRANSLATE}">
                        <div class="game-icon">💨</div>
                        <h3>Dịch Nhanh</h3>
                        <p>Dịch từ trong thời gian giới hạn</p>
                        <div class="game-difficulty">Khó</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cập nhật điểm số
     */
    updateScore(gameType, score) {
        this.gameStats.totalScore += score;
        
        if (!this.gameStats.highScores[gameType] || score > this.gameStats.highScores[gameType]) {
            this.gameStats.highScores[gameType] = score;
        }
        
        this.saveGameStats();
        this.checkAchievements(gameType, score);
    }

    /**
     * Kiểm tra thành tựu
     */
    checkAchievements(gameType, score) {
        const achievements = [
            { id: 'first_game', name: 'Người chơi mới', condition: () => this.gameStats.totalGamesPlayed >= 1 },
            { id: 'score_100', name: 'Tân binh', condition: () => this.gameStats.totalScore >= 100 },
            { id: 'score_500', name: 'Thành thạo', condition: () => this.gameStats.totalScore >= 500 },
            { id: 'score_1000', name: 'Chuyên gia', condition: () => this.gameStats.totalScore >= 1000 },
            { id: 'games_10', name: 'Chăm chỉ', condition: () => this.gameStats.totalGamesPlayed >= 10 },
            { id: 'games_50', name: 'Kiên trì', condition: () => this.gameStats.totalGamesPlayed >= 50 }
        ];

        achievements.forEach(achievement => {
            if (!this.gameStats.achievements.includes(achievement.id) && achievement.condition()) {
                this.gameStats.achievements.push(achievement.id);
                this.showAchievement(achievement.name);
            }
        });
    }

    /**
     * Hiển thị thông báo thành tựu
     */
    showAchievement(name) {
        if (this.uiManager) {
            this.uiManager.showMessage(`🏆 Thành tựu mới: ${name}!`, 'success');
        }
    }

    /**
     * Lưu thống kê game
     */
    saveGameStats() {
        try {
            localStorage.setItem('gameStats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
    }

    /**
     * Tải thống kê game
     */
    loadGameStats() {
        try {
            const saved = localStorage.getItem('gameStats');
            if (saved) {
                this.gameStats = { ...this.gameStats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading game stats:', error);
        }
    }    /**
     * Lấy từ vựng cho game
     */
    getGameVocabulary(count = 10, difficulty = 'all') {
        if (!this.vocabularyManager || !this.vocabularyManager.getAllWords) {
            // Fallback to global vocabulary object
            if (typeof window !== 'undefined' && window.vocabulary) {
                const words = [];
                for (const [english, vietnamese] of Object.entries(window.vocabulary)) {
                    words.push({ english, vietnamese });
                }
                
                if (words.length === 0) {
                    console.warn('GameManager: No vocabulary available, using fallback words');
                    return [
                        { english: 'hello', vietnamese: 'xin chào' },
                        { english: 'goodbye', vietnamese: 'tạm biệt' },
                        { english: 'thank you', vietnamese: 'cảm ơn' },
                        { english: 'yes', vietnamese: 'có' },
                        { english: 'no', vietnamese: 'không' },
                        { english: 'please', vietnamese: 'xin lỗi' },
                        { english: 'water', vietnamese: 'nước' },
                        { english: 'food', vietnamese: 'thức ăn' },
                        { english: 'love', vietnamese: 'yêu' },
                        { english: 'friend', vietnamese: 'bạn' }
                    ].slice(0, count);
                }
                
                return this.shuffleArray(words).slice(0, count);
            }
            
            console.warn('GameManager: No vocabulary source available, using fallback');
            return [
                { english: 'hello', vietnamese: 'xin chào' },
                { english: 'goodbye', vietnamese: 'tạm biệt' },
                { english: 'thank you', vietnamese: 'cảm ơn' },
                { english: 'yes', vietnamese: 'có' },
                { english: 'no', vietnamese: 'không' }
            ].slice(0, count);
        }
        
        const allWords = this.vocabularyManager.getAllWords();
        let filtered = allWords;
        
        if (difficulty !== 'all') {
            filtered = allWords.filter(word => word.difficulty === difficulty);
        }
        
        return this.shuffleArray(filtered).slice(0, count);
    }

    /**
     * Trộn mảng
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

/**
 * Base class cho các trò chơi
 */
class BaseGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isActive = false;
        this.score = 0;
        this.timeLeft = 0;
        this.timer = null;
        this.vocabulary = [];
    }

    async start(options = {}) {
        this.isActive = true;
        this.score = 0;
        this.setupGame(options);
        this.renderGame();
        this.startTimer();
    }    end() {
        this.isActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.gameManager.updateScore(this.gameType, this.score);
    }

    setupGame(options) {
        // Override in subclasses
    }

    renderGame() {
        // Override in subclasses
    }

    startTimer() {
        if (this.timeLeft <= 0) return;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimer() {
        const timerEl = document.querySelector('.game-timer');
        if (timerEl) {
            timerEl.textContent = `⏰ ${this.timeLeft}s`;
        }
    }    endGame() {
        this.isActive = false;
        this.showResults();
    }    showResults() {
        const container = document.getElementById('games-container');
        if (!container) return;

        container.innerHTML = `
            <div class="game-results">
                <h2>🎉 Kết Quả</h2>
                <div class="final-score">Điểm số: ${this.score}</div>
                <div class="game-actions">
                    <button class="btn btn-primary" data-game-type="${this.gameManager.currentGame.gameType}">
                        Chơi Lại
                    </button>
                    <button class="btn btn-secondary game-back-btn">
                        Về Menu
                    </button>
                </div>
            </div>
        `;
    }

    addScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        const scoreEl = document.querySelector('.game-score');
        if (scoreEl) {
            scoreEl.textContent = `💎 ${this.score}`;
        }
    }
}

/**
 * Trò chơi ghép từ
 */
class WordMatchGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        this.gameType = gameManager.gameTypes.WORD_MATCH;
        this.pairs = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
    }    setupGame(options) {
        this.timeLeft = options.timeLimit || 120;
        this.vocabulary = this.gameManager.getGameVocabulary(8);
        
        // Ensure we have enough vocabulary
        if (this.vocabulary.length < 4) {
            console.warn('WordMatchGame: Not enough vocabulary words available');
            // Duplicate words if necessary
            while (this.vocabulary.length < 4) {
                this.vocabulary.push(...this.vocabulary.slice(0, 4 - this.vocabulary.length));
            }
        }
        
        this.pairs = this.createPairs();
        this.selectedCards = [];
        this.matchedPairs = 0;
    }

    createPairs() {
        const pairs = [];
        this.vocabulary.forEach((word, index) => {
            pairs.push({
                id: `en-${index}`,
                text: word.english,
                type: 'english',
                matchId: index
            });
            pairs.push({
                id: `vi-${index}`,
                text: word.vietnamese,
                type: 'vietnamese', 
                matchId: index
            });
        });
        return this.gameManager.shuffleArray(pairs);
    }    renderGame() {
        const container = document.getElementById('games-container');
        if (!container) return;

        container.innerHTML = `
            <div class="word-match-game">
                <div class="game-header">
                    <div class="game-score">💎 ${this.score}</div>
                    <h3>🎯 Ghép Từ</h3>
                    <div class="game-timer">⏰ ${this.timeLeft}s</div>
                </div>
                <div class="game-instructions">
                    Kết nối từ tiếng Anh với nghĩa tiếng Việt tương ứng
                </div>
                <div class="match-grid">
                    ${this.pairs.map(pair => `
                        <div class="match-card" data-id="${pair.id}" data-match-id="${pair.matchId}" data-type="${pair.type}">
                            <div class="card-content">${pair.text}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary game-back-btn">Thoát</button>
            </div>
        `;

        this.setupMatchEvents();
    }

    setupMatchEvents() {
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!this.isActive) return;
                this.handleCardClick(e.target.closest('.match-card'));
            });
        });
    }

    handleCardClick(card) {
        if (card.classList.contains('matched') || card.classList.contains('selected')) {
            return;
        }

        card.classList.add('selected');
        this.selectedCards.push(card);

        if (this.selectedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 500);
        }
    }

    checkMatch() {
        const [card1, card2] = this.selectedCards;
        const match1 = card1.getAttribute('data-match-id');
        const match2 = card2.getAttribute('data-match-id');
        const type1 = card1.getAttribute('data-type');
        const type2 = card2.getAttribute('data-type');

        if (match1 === match2 && type1 !== type2) {
            // Correct match
            card1.classList.add('matched');            card2.classList.add('matched');
            this.addScore(20);
            this.matchedPairs++;

            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playCorrectSound();
            }

            if (this.matchedPairs === this.vocabulary.length) {
                this.addScore(50); // Bonus for completing
                this.endGame();
            }
        } else {
            // Wrong match
            card1.classList.add('wrong');
            card2.classList.add('wrong');
              setTimeout(() => {
                card1.classList.remove('wrong');
                card2.classList.remove('wrong');
            }, 1000);

            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playIncorrectSound();
            }
        }

        card1.classList.remove('selected');
        card2.classList.remove('selected');
        this.selectedCards = [];
    }
}

/**
 * Trò chơi đua gõ từ
 */
class TypingRaceGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        this.gameType = gameManager.gameTypes.TYPING_RACE;
        this.currentWordIndex = 0;
        this.wordsCompleted = 0;
    }    setupGame(options) {
        this.timeLeft = options.timeLimit || 60;
        this.vocabulary = this.gameManager.getGameVocabulary(20);
        this.currentWordIndex = 0;
        this.wordsCompleted = 0;
    }

    renderGame() {
        const container = document.getElementById('games-container');
        if (!container) return;        container.innerHTML = `
            <div class="typing-race-game">
                <div class="game-header">
                    <div class="game-score">💎 ${this.score}</div>
                    <h3>⚡ Đua Gõ Từ</h3>
                    <div class="game-timer">⏰ ${this.timeLeft}s</div>
                </div>
                <div class="game-instructions">
                    Gõ từ tiếng Anh tương ứng với nghĩa tiếng Việt
                </div>
                <div class="typing-area">
                    <div class="word-prompt">
                        <div class="vietnamese-word">${this.getCurrentWord().vietnamese}</div>
                        <div class="word-pronunciation">[${this.getCurrentWord().pronunciation || ''}]</div>
                    </div>
                    <input type="text" class="typing-input" placeholder="Gõ từ tiếng Anh..." autocomplete="off">
                    <div class="typing-feedback"></div>
                </div>
                <div class="progress-info">
                    <div>Từ đã hoàn thành: ${this.wordsCompleted}/${this.vocabulary.length}</div>
                </div>
                <button class="btn btn-secondary game-back-btn">Thoát</button>
            </div>
        `;

        this.setupTypingEvents();
        document.querySelector('.typing-input').focus();
    }

    setupTypingEvents() {
        const input = document.querySelector('.typing-input');
        const feedback = document.querySelector('.typing-feedback');

        input.addEventListener('input', (e) => {
            if (!this.isActive) return;
            
            const typed = e.target.value.toLowerCase().trim();
            const target = this.getCurrentWord().english.toLowerCase();
            
            if (typed === target) {
                this.handleCorrectWord();
                e.target.value = '';
            } else if (target.startsWith(typed)) {
                feedback.textContent = '✓ Đang gõ đúng...';
                feedback.className = 'typing-feedback correct-partial';
            } else {
                feedback.textContent = '✗ Sai rồi, thử lại!';
                feedback.className = 'typing-feedback incorrect';
            }
        });        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.handleIncorrectWord();
            }
        });
    }

    getCurrentWord() {
        return this.vocabulary[this.currentWordIndex] || { english: 'hello', vietnamese: 'xin chào', pronunciation: '' };
    }

    handleCorrectWord() {        const timeBonus = Math.max(0, Math.floor(this.timeLeft / 10));
        this.addScore(10 + timeBonus);
        this.wordsCompleted++;
        
        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playCorrectSound();
        }

        this.nextWord();
    }    handleIncorrectWord() {
        const feedback = document.querySelector('.typing-feedback');
        feedback.textContent = `✗ Sai! Đáp án: ${this.getCurrentWord().english}`;
        feedback.className = 'typing-feedback incorrect';
        
        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playIncorrectSound();
        }

        setTimeout(() => this.nextWord(), 2000);
    }

    nextWord() {
        this.currentWordIndex++;
        
        if (this.currentWordIndex >= this.vocabulary.length) {
            this.addScore(100); // Completion bonus
            this.endGame();
            return;
        }

        const promptEl = document.querySelector('.vietnamese-word');
        const pronunciationEl = document.querySelector('.word-pronunciation');
        const progressEl = document.querySelector('.progress-info div');
        const feedback = document.querySelector('.typing-feedback');
        
        if (promptEl) {
            promptEl.textContent = this.getCurrentWord().vietnamese;
        }
        if (pronunciationEl) {
            pronunciationEl.textContent = `[${this.getCurrentWord().pronunciation || ''}]`;
        }
        if (progressEl) {
            progressEl.textContent = `Từ đã hoàn thành: ${this.wordsCompleted}/${this.vocabulary.length}`;
        }
        
        feedback.textContent = '';
        feedback.className = 'typing-feedback';
        
        document.querySelector('.typing-input').focus();
    }
}

/**
 * Trò chơi trí nhớ
 */
class MemoryGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        this.gameType = gameManager.gameTypes.MEMORY_GAME;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
    }    setupGame(options) {
        this.timeLeft = options.timeLimit || 180;
        this.vocabulary = this.gameManager.getGameVocabulary(8);
        
        // Ensure we have enough vocabulary
        if (this.vocabulary.length < 4) {
            console.warn('MemoryGame: Not enough vocabulary words available');
            // Duplicate words if necessary
            while (this.vocabulary.length < 4) {
                this.vocabulary.push(...this.vocabulary.slice(0, 4 - this.vocabulary.length));
            }
        }
        
        this.cards = this.createMemoryCards();
        this.flippedCards = [];
        this.matchedPairs = 0;
    }createMemoryCards() {
        const cards = [];
        this.vocabulary.forEach((word, index) => {
            // English card
            cards.push({
                id: `card-en-${index}`,
                content: word.english,
                type: 'english',
                pairId: index
            });
            // Vietnamese card  
            cards.push({
                id: `card-vi-${index}`,
                content: word.vietnamese,
                type: 'vietnamese',
                pairId: index
            });
        });
        return this.gameManager.shuffleArray(cards);
    }

    renderGame() {
        const container = document.getElementById('games-container');
        if (!container) return;

        container.innerHTML = `
            <div class="memory-game">
                <div class="game-header">
                    <div class="game-score">💎 ${this.score}</div>
                    <h3>🧠 Trò Chơi Trí Nhớ</h3>
                    <div class="game-timer">⏰ ${this.timeLeft}s</div>
                </div>
                <div class="game-instructions">
                    Lật thẻ để tìm cặp từ tiếng Anh và tiếng Việt tương ứng
                </div>
                <div class="memory-grid">
                    ${this.cards.map(card => `
                        <div class="memory-card" data-id="${card.id}" data-pair-id="${card.pairId}" data-type="${card.type}">
                            <div class="card-front">?</div>
                            <div class="card-back">${card.content}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary game-back-btn">Thoát</button>
            </div>
        `;

        this.setupMemoryEvents();
    }

    setupMemoryEvents() {
        document.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!this.isActive) return;
                this.handleCardFlip(e.currentTarget);
            });
        });
    }    handleCardFlip(cardElement) {
        if (cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched') ||
            this.flippedCards.length >= 2) {
            return;
        }

        cardElement.classList.add('flipped');
        this.flippedCards.push(cardElement);

        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMemoryMatch(), 800);
        }
    }

    checkMemoryMatch() {
        const [card1, card2] = this.flippedCards;
        const pairId1 = card1.getAttribute('data-pair-id');
        const pairId2 = card2.getAttribute('data-pair-id');
        const type1 = card1.getAttribute('data-type');
        const type2 = card2.getAttribute('data-type');

        if (pairId1 === pairId2 && type1 !== type2) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.addScore(25);
            this.matchedPairs++;            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playCorrectSound();
            }

            if (this.matchedPairs === this.vocabulary.length) {
                this.addScore(100); // Completion bonus
                this.endGame();
            }        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }, 800);

            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playIncorrectSound();
            }
        }

        this.flippedCards = [];
    }
}

/**
 * Trò chơi xếp chữ
 */
class WordBuilderGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        this.gameType = gameManager.gameTypes.WORD_BUILDER;
        this.currentWordIndex = 0;
        this.scrambledLetters = [];
        this.selectedLetters = [];
    }

    setupGame(options) {
        this.timeLeft = options.timeLimit || 90;
        this.vocabulary = this.gameManager.getGameVocabulary(15);
        this.currentWordIndex = 0;
        this.setupCurrentWord();
    }

    setupCurrentWord() {
        const word = this.getCurrentWord();
        this.scrambledLetters = this.scrambleWord(word.english);
        this.selectedLetters = [];
    }    scrambleWord(word) {
        const letters = word.toLowerCase().split('');
        return this.gameManager.shuffleArray(letters);
    }

    renderGame() {
        const container = document.getElementById('games-container');
        if (!container) return;

        container.innerHTML = `
            <div class="word-builder-game">
                <div class="game-header">
                    <div class="game-score">💎 ${this.score}</div>
                    <h3>🔤 Xếp Chữ</h3>
                    <div class="game-timer">⏰ ${this.timeLeft}s</div>
                </div>
                <div class="game-instructions">
                    Sắp xếp các chữ cái để tạo thành từ tiếng Anh
                </div>
                <div class="word-clue">
                    <div class="vietnamese-hint">${this.getCurrentWord().vietnamese}</div>
                    <div class="word-length-hint">${this.getCurrentWord().english.length} chữ cái</div>
                </div>
                <div class="word-construction">
                    <div class="constructed-word">
                        ${this.selectedLetters.map(letter => `<span class="letter-slot filled">${letter}</span>`).join('')}
                        ${Array(this.getCurrentWord().english.length - this.selectedLetters.length).fill().map(() => '<span class="letter-slot empty">_</span>').join('')}
                    </div>
                </div>
                <div class="available-letters">
                    ${this.scrambledLetters.map((letter, index) => `
                        <button class="letter-btn" data-letter="${letter}" data-index="${index}">${letter.toUpperCase()}</button>
                    `).join('')}
                </div>
                <div class="word-actions">
                    <button class="btn btn-warning clear-btn">Xóa Hết</button>
                    <button class="btn btn-info hint-btn">Gợi Ý</button>
                    <button class="btn btn-success check-btn">Kiểm Tra</button>
                </div>
                <div class="progress-info">
                    Từ ${this.currentWordIndex + 1}/${this.vocabulary.length}
                </div>
                <button class="btn btn-secondary game-back-btn">Thoát</button>
            </div>
        `;

        this.setupWordBuilderEvents();
    }

    setupWordBuilderEvents() {
        // Letter selection
        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isActive) return;
                this.selectLetter(e.target);
            });
        });

        // Action buttons
        document.querySelector('.clear-btn').addEventListener('click', () => this.clearWord());
        document.querySelector('.hint-btn').addEventListener('click', () => this.showHint());
        document.querySelector('.check-btn').addEventListener('click', () => this.checkWord());
    }

    selectLetter(btn) {
        if (btn.disabled || this.selectedLetters.length >= this.getCurrentWord().english.length) {
            return;
        }

        const letter = btn.getAttribute('data-letter');
        this.selectedLetters.push(letter);
        btn.disabled = true;
        btn.classList.add('selected');

        this.updateWordDisplay();
    }

    clearWord() {
        this.selectedLetters = [];
        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
        this.updateWordDisplay();
    }    showHint() {
        if (this.selectedLetters.length < this.getCurrentWord().english.length) {
            const correctWord = this.getCurrentWord().english.toLowerCase();
            const nextLetter = correctWord[this.selectedLetters.length];
            
            // Find and auto-select the next correct letter
            const availableBtn = document.querySelector(`.letter-btn[data-letter="${nextLetter}"]:not([disabled])`);
            if (availableBtn) {
                this.selectLetter(availableBtn);
                this.addScore(-5); // Penalty for hint
                
                // Show hint message
                const feedback = document.querySelector('.game-instructions');
                if (feedback) {
                    const originalText = feedback.textContent;
                    feedback.textContent = `Gợi ý: Đã thêm chữ "${nextLetter.toUpperCase()}" (-5 điểm)`;
                    feedback.style.color = '#f39c12';
                    setTimeout(() => {
                        feedback.textContent = originalText;
                        feedback.style.color = '';
                    }, 2000);
                }
            } else {
                // No more hints available
                const feedback = document.querySelector('.game-instructions');
                if (feedback) {
                    const originalText = feedback.textContent;
                    feedback.textContent = 'Không có gợi ý nào khả dụng!';
                    feedback.style.color = '#e74c3c';
                    setTimeout(() => {
                        feedback.textContent = originalText;
                        feedback.style.color = '';
                    }, 2000);
                }
            }
        }
    }checkWord() {
        if (this.selectedLetters.length === 0) {
            // No letters selected, show hint
            const feedback = document.querySelector('.typing-feedback') || document.querySelector('.game-instructions');
            if (feedback) {
                const originalText = feedback.textContent;
                feedback.textContent = 'Vui lòng chọn các chữ cái để tạo từ!';
                feedback.style.color = '#e74c3c';
                setTimeout(() => {
                    feedback.textContent = originalText;
                    feedback.style.color = '';
                }, 2000);
            }
            return;
        }
        
        const constructedWord = this.selectedLetters.join('').toLowerCase();
        const correctWord = this.getCurrentWord().english.toLowerCase();

        if (constructedWord === correctWord) {
            this.handleCorrectWord();
        } else {
            this.handleIncorrectWord();
        }
    }    handleCorrectWord() {
        const baseScore = 20;
        const lengthBonus = this.getCurrentWord().english.length * 2;
        this.addScore(baseScore + lengthBonus);

        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playCorrectSound();
        }

        setTimeout(() => this.nextWord(), 1500);
    }    handleIncorrectWord() {
        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playIncorrectSound();
        }

        // Show correct answer briefly
        const wordDisplay = document.querySelector('.constructed-word');
        if (wordDisplay) {
            wordDisplay.innerHTML = `<span class="correct-answer">Đáp án: ${this.getCurrentWord().english.toUpperCase()}</span>`;
        }
        
        setTimeout(() => this.nextWord(), 2000);
    }

    nextWord() {
        this.currentWordIndex++;
        
        if (this.currentWordIndex >= this.vocabulary.length) {
            this.addScore(150); // Completion bonus
            this.endGame();
            return;
        }        this.setupCurrentWord();
        this.renderGame();
    }

    updateWordDisplay() {
        const wordDisplay = document.querySelector('.constructed-word');
        if (wordDisplay) {
            const currentWord = this.getCurrentWord();
            let html = '';
            
            // Show selected letters
            for (let i = 0; i < this.selectedLetters.length; i++) {
                html += `<span class="letter-slot filled">${this.selectedLetters[i].toUpperCase()}</span>`;
            }
            
            // Show empty slots
            for (let i = this.selectedLetters.length; i < currentWord.english.length; i++) {
                html += '<span class="letter-slot empty">_</span>';
            }
            
            wordDisplay.innerHTML = html;
        }
    }    getCurrentWord() {
        return this.vocabulary[this.currentWordIndex] || { english: '', vietnamese: '' };
    }
}

/**
 * Trò chơi dịch nhanh
 */
class QuickTranslateGame extends BaseGame {    constructor(gameManager) {
        super(gameManager);
        this.gameType = gameManager.gameTypes.QUICK_TRANSLATE;
        this.currentWordIndex = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.keydownHandler = null;
    }setupGame(options) {
        this.timeLeft = options.timeLimit || 90;
        this.vocabulary = this.gameManager.getGameVocabulary(25);
        this.currentWordIndex = 0;
        this.streak = 0;
        this.maxStreak = 0;
    }

    renderGame() {
        const container = document.getElementById('games-container');
        if (!container) return;

        const currentWord = this.getCurrentWord();
        const options = this.generateOptions(currentWord);

        container.innerHTML = `
            <div class="quick-translate-game">
                <div class="game-header">
                    <div class="game-score">💎 ${this.score}</div>
                    <h3>💨 Dịch Nhanh</h3>
                    <div class="game-timer">⏰ ${this.timeLeft}s</div>
                </div>
                <div class="game-stats-bar">
                    <div class="streak-info">🔥 Streak: ${this.streak}</div>
                    <div class="progress-info">${this.currentWordIndex + 1}/${this.vocabulary.length}</div>
                </div>
                <div class="translate-question">
                    <div class="question-word">${currentWord.english}</div>
                    <div class="question-prompt">Chọn nghĩa tiếng Việt:</div>
                </div>
                <div class="answer-options">
                    ${options.map((option, index) => `
                        <button class="option-btn" data-answer="${option}" data-correct="${option === currentWord.vietnamese}">
                            ${String.fromCharCode(65 + index)}. ${option}
                        </button>
                    `).join('')}
                </div>
                <div class="quick-actions">
                    <button class="btn btn-info pronounce-btn">🔊 Phát Âm</button>
                </div>
                <button class="btn btn-secondary game-back-btn">Thoát</button>
            </div>
        `;

        this.setupQuickTranslateEvents();
    }

    setupQuickTranslateEvents() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isActive) return;
                this.handleAnswer(e.target);
            });
        });        document.querySelector('.pronounce-btn').addEventListener('click', () => {
            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.speakWord(this.getCurrentWord().english);
            }
        });// Keyboard shortcuts
        this.keydownHandler = (e) => {
            if (!this.isActive) return;
            
            const key = e.key.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(key)) {
                const index = key.charCodeAt(0) - 65;
                const btn = document.querySelectorAll('.option-btn')[index];
                if (btn && !btn.disabled) {
                    this.handleAnswer(btn);
                }
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
    }generateOptions(correctWord) {
        const options = [correctWord.vietnamese];
        const otherWords = this.vocabulary.filter(w => w.vietnamese !== correctWord.vietnamese);
        
        // Shuffle other words for random selection
        const shuffledOthers = this.gameManager.shuffleArray(otherWords);
        
        while (options.length < 4 && shuffledOthers.length > 0) {
            const randomWord = shuffledOthers.pop();
            if (!options.includes(randomWord.vietnamese)) {
                options.push(randomWord.vietnamese);
            }
        }
        
        // If we don't have enough options, fill with placeholder
        while (options.length < 4) {
            options.push(`Tùy chọn ${options.length}`);
        }
        
        return this.gameManager.shuffleArray(options);
    }    handleAnswer(btn) {
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        
        // Disable all buttons
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        
        if (isCorrect) {
            btn.classList.add('correct');
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);
            
            let score = 10;
            if (this.streak >= 5) score += 5; // Streak bonus
            if (this.timeLeft > 60) score += 5; // Speed bonus
            
            this.addScore(score);
              if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playCorrectSound();
            }
        } else {
            btn.classList.add('incorrect');
            this.streak = 0;
            
            // Show correct answer
            document.querySelectorAll('.option-btn').forEach(b => {
                if (b.getAttribute('data-correct') === 'true') {
                    b.classList.add('correct');
                }
            });
            
            if (this.gameManager.audioManager) {
                this.gameManager.audioManager.playIncorrectSound();
            }
        }

        setTimeout(() => this.nextQuestion(), 1500);
    }    nextQuestion() {
        this.currentWordIndex++;
        
        if (this.currentWordIndex >= this.vocabulary.length) {
            let bonus = 50; // Base completion bonus
            bonus += this.maxStreak * 5; // Streak bonus
            this.addScore(bonus);
            this.endGame();
            return;
        }

        this.renderGame();
    }

    end() {
        // Clean up keyboard event listener
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        super.end();
    }getCurrentWord() {
        return this.vocabulary[this.currentWordIndex] || { english: 'hello', vietnamese: 'xin chào' };
    }showResults() {
        const container = document.getElementById('games-container');
        if (!container) return;

        container.innerHTML = `
            <div class="game-results">
                <h2>🎉 Kết Quả Dịch Nhanh</h2>
                <div class="results-stats">
                    <div class="stat-item">
                        <span class="stat-label">Điểm số:</span>
                        <span class="stat-value">${this.score}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Streak tối đa:</span>
                        <span class="stat-value">${this.maxStreak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Độ chính xác:</span>
                        <span class="stat-value">${Math.round((this.score / (this.currentWordIndex * 10)) * 100)}%</span>
                    </div>
                </div>
                <div class="game-actions">
                    <button class="btn btn-primary" data-game-type="${this.gameType}">
                        Chơi Lại
                    </button>
                    <button class="btn btn-secondary game-back-btn">
                        Về Menu
                    </button>
                </div>
            </div>
        `;
    }
}

// Export GameManager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
} else {
    window.GameManager = GameManager;
}