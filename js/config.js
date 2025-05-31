// Configuration và constants cho ứng dụng
const APP_CONFIG = {
    version: '1.0.0',
    name: 'TuVung App',
    author: 'Your Name'
};

// SRS Configuration
const GAMIFICATION_CONFIG = {
    points: {
        correctAnswer: 10,
        perfectStreak: 25,
        dailyGoal: 100,
        challengeComplete: 200,
        newWord: 5,
        reviewWord: 8
    },
    levels: [
        { level: 1, name: "Người mới bắt đầu", minPoints: 0, icon: "🌱" },
        { level: 2, name: "Học viên tập sự", minPoints: 500, icon: "📚" },
        { level: 3, name: "Thám hiểm từ vựng", minPoints: 1500, icon: "🗺️" },
        { level: 4, name: "Chiến binh từ vựng", minPoints: 3500, icon: "⚔️" },
        { level: 5, name: "Bậc thầy ngôn ngữ", minPoints: 7500, icon: "🎓" },
        { level: 6, name: "Huyền thoại", minPoints: 15000, icon: "👑" }
    ],
    streaks: {
        milestone: [7, 30, 100, 365],
        rewards: [50, 200, 1000, 5000]
    }
};

// SRS Settings
const SRS_SETTINGS = {
    initialInterval: 1,
    easeFactor: 2.5,
    minEaseFactor: 1.3,
    maxEaseFactor: 3.0,
    easyBonus: 1.3,
    hardPenalty: 0.8
};

// SRS Difficulty constants
const SRS_DIFFICULTY = {
    AGAIN: 0,
    HARD: 1,
    GOOD: 2,
    EASY: 3
};

// Global variables
let vocabulary = {};
let wordPackages = {};
let wordTopics = {};
let wordSynonyms = {};
let wordExamples = {};
let srsData = {};
let srsSettings = SRS_SETTINGS;

// Learning state
let wordList = [];
let currentIndex = 0;
let learnedWordsCount = 0;
let learnedWords = new Set();

// Network state
let isOnline = navigator.onLine;

// GitHub integration
let githubToken = '';
let gistId = '';

// Export cho các module khác
window.APP_CONFIG = APP_CONFIG;
window.GAMIFICATION_CONFIG = GAMIFICATION_CONFIG;
window.SRS_SETTINGS = SRS_SETTINGS;
window.SRS_DIFFICULTY = SRS_DIFFICULTY;
