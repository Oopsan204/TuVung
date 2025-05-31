// Module quản lý hệ thống SRS (Spaced Repetition System)
const SRSManager = {
    // Khởi tạo dữ liệu SRS cho một từ
    initWord(word) {
        if (!srsData[word]) {
            srsData[word] = {
                interval: srsSettings.initialInterval,
                easeFactor: srsSettings.easeFactor,
                repetitions: 0,
                lastReview: null,
                nextReview: new Date(),
                streak: 0,
                totalReviews: 0,
                correctReviews: 0,
                difficulty: SRS_DIFFICULTY.GOOD,
                history: []
            };
        }
        return srsData[word];
    },

    // Tính toán interval tiếp theo dựa trên thuật toán SM-2
    calculateNextInterval(wordData, quality) {
        let { interval, easeFactor, repetitions } = wordData;

        // Cập nhật ease factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        easeFactor = Math.max(srsSettings.minEaseFactor, Math.min(srsSettings.maxEaseFactor, easeFactor));

        // Tính interval mới
        if (quality < 3) {
            // Sai hoặc khó - reset interval
            repetitions = 0;
            interval = 1;
        } else {
            repetitions++;
            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
        }

        // Áp dụng bonus/penalty
        if (quality === SRS_DIFFICULTY.EASY) {
            interval = Math.round(interval * srsSettings.easyBonus);
        } else if (quality === SRS_DIFFICULTY.HARD) {
            interval = Math.round(interval * srsSettings.hardPenalty);
        }

        return { interval, easeFactor, repetitions };
    },

    // Cập nhật dữ liệu SRS sau khi ôn tập
    updateWordSRS(word, quality) {
        const wordData = this.initWord(word);
        const now = new Date();

        // Tính toán interval mới
        const { interval, easeFactor, repetitions } = this.calculateNextInterval(wordData, quality);

        // Cập nhật streak
        let streak = wordData.streak;
        if (quality >= SRS_DIFFICULTY.GOOD) {
            streak++;
        } else {
            streak = 0;
        }

        // Cập nhật dữ liệu
        wordData.interval = interval;
        wordData.easeFactor = easeFactor;
        wordData.repetitions = repetitions;
        wordData.lastReview = now;
        wordData.nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
        wordData.streak = streak;
        wordData.totalReviews++;
        wordData.difficulty = quality;

        if (quality >= SRS_DIFFICULTY.GOOD) {
            wordData.correctReviews++;
        }

        // Lưu lịch sử
        wordData.history.push({
            date: now,
            quality: quality,
            interval: interval,
            easeFactor: easeFactor
        });

        // Giới hạn lịch sử (chỉ giữ 50 lần gần nhất)
        if (wordData.history.length > 50) {
            wordData.history = wordData.history.slice(-50);
        }

        this.saveSRSData();
        return wordData;
    },

    // Lấy danh sách từ cần ôn tập
    getDueWords() {
        const now = new Date();
        const dueWords = [];

        Object.keys(vocabulary).forEach(word => {
            const wordData = srsData[word];
            if (!wordData) {
                // Từ mới
                dueWords.push({
                    word: word,
                    isNew: true,
                    priority: 100,
                    overdueDays: 0
                });
            } else {
                // Kiểm tra từ cần ôn tập
                if (wordData.nextReview <= now) {
                    const overdueDays = Math.floor((now - wordData.nextReview) / (24 * 60 * 60 * 1000));
                    const priority = Math.min(100, 50 + overdueDays * 10); // Càng quá hạn càng ưu tiên
                    
                    dueWords.push({
                        word: word,
                        isNew: false,
                        priority: priority,
                        overdueDays: overdueDays
                    });
                }
            }
        });

        // Sắp xếp theo độ ưu tiên
        dueWords.sort((a, b) => b.priority - a.priority);
        return dueWords;
    },

    // Lấy thống kê SRS
    getStatistics() {
        const stats = {
            totalWords: Object.keys(vocabulary).length,
            studiedWords: Object.keys(srsData).length,
            newWords: 0,
            dueWords: 0,
            learnedWords: 0,
            averageAccuracy: 0
        };

        const now = new Date();
        let totalAccuracy = 0;
        let totalReviews = 0;

        Object.keys(vocabulary).forEach(word => {
            const wordData = srsData[word];
            if (!wordData) {
                stats.newWords++;
            } else {
                if (wordData.nextReview <= now) {
                    stats.dueWords++;
                } else if (wordData.repetitions >= 3 && wordData.streak >= 3) {
                    stats.learnedWords++;
                }
                
                if (wordData.totalReviews > 0) {
                    totalAccuracy += (wordData.correctReviews / wordData.totalReviews);
                    totalReviews++;
                }
            }
        });

        if (stats.studiedWords > 0) {
            stats.averageAccuracy = Math.round((totalAccuracy / stats.studiedWords) * 100);
        }

        return stats;
    },

    // Lưu dữ liệu SRS
    saveSRSData() {
        try {
            localStorage.setItem('srsData', JSON.stringify(srsData));
            localStorage.setItem('srsSettings', JSON.stringify(srsSettings));
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu SRS:', error);
        }
    },

    // Tải dữ liệu SRS
    loadSRSData() {
        try {
            const savedSRS = localStorage.getItem('srsData');
            if (savedSRS) {
                srsData = JSON.parse(savedSRS);
                // Chuyển đổi string dates thành Date objects
                Object.values(srsData).forEach(wordData => {
                    if (wordData.lastReview && typeof wordData.lastReview === 'string') {
                        wordData.lastReview = new Date(wordData.lastReview);
                    }
                    if (wordData.nextReview && typeof wordData.nextReview === 'string') {
                        wordData.nextReview = new Date(wordData.nextReview);
                    }
                    if (wordData.history) {
                        wordData.history.forEach(entry => {
                            if (entry.date && typeof entry.date === 'string') {
                                entry.date = new Date(entry.date);
                            }
                        });
                    }
                });
            }

            const savedSettings = localStorage.getItem('srsSettings');
            if (savedSettings) {
                srsSettings = { ...srsSettings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu SRS:', error);
            srsData = {};
        }
    },

    // Reset dữ liệu SRS cho một từ
    resetWord(word) {
        if (srsData[word]) {
            delete srsData[word];
            this.saveSRSData();
        }
    },

    // Reset tất cả dữ liệu SRS
    resetAllData() {
        srsData = {};
        this.saveSRSData();
    },

    // Export dữ liệu SRS
    exportData() {
        return {
            srsData: srsData,
            srsSettings: srsSettings,
            exportDate: new Date().toISOString()
        };
    },

    // Import dữ liệu SRS
    importData(data) {
        try {
            if (data.srsData) {
                srsData = data.srsData;
            }
            if (data.srsSettings) {
                srsSettings = { ...srsSettings, ...data.srsSettings };
            }
            this.saveSRSData();
            return true;
        } catch (error) {
            console.error('Lỗi khi import dữ liệu SRS:', error);
            return false;
        }
    }
};

// Export SRSManager
window.SRSManager = SRSManager;
