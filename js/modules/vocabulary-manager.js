// Module quản lý dữ liệu từ vựng
const VocabularyManager = {
    // Lưu trữ dữ liệu
    data: {
        vocabulary: {},
        wordPackages: {},
        wordTopics: {},
        wordSynonyms: {},
        wordExamples: {}
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
            localStorage.setItem('wordExamples', JSON.stringify(this.data.wordExamples));
            
            if (updateTimestamp) {
                localStorage.setItem('lastUpdated', new Date().toISOString());
            }
            
            console.log('Đã lưu dữ liệu vào localStorage');
            return true;
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
            return false;
        }
    },

    // Tải dữ liệu từ localStorage
    loadFromLocalStorage() {
        try {
            const vocabData = localStorage.getItem('vocabularyData');
            const packagesData = localStorage.getItem('wordPackages');
            const topicsData = localStorage.getItem('wordTopics');
            const synonymsData = localStorage.getItem('wordSynonyms');
            const examplesData = localStorage.getItem('wordExamples');

            if (vocabData) {
                this.data.vocabulary = JSON.parse(vocabData);
                this.data.wordPackages = packagesData ? JSON.parse(packagesData) : {};
                this.data.wordTopics = topicsData ? JSON.parse(topicsData) : {};
                this.data.wordSynonyms = synonymsData ? JSON.parse(synonymsData) : {};
                this.data.wordExamples = examplesData ? JSON.parse(examplesData) : {};
                
                console.log('Đã tải dữ liệu từ localStorage:', Object.keys(this.data.vocabulary).length, 'từ');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu từ localStorage:', error);
            return false;
        }
    },

    // Tải một file JSON từ đường dẫn
    async loadJSONFile(filename) {
        for (const path of this.PATHS) {
            try {
                const response = await fetch(path + filename);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Đã tải thành công ${filename} từ ${path}`);
                    return data;
                }
            } catch (error) {
                console.log(`Không thể tải ${filename} từ ${path}:`, error.message);
            }
        }
        return null;
    },

    // Tải tất cả dữ liệu từ các file
    async loadFromFiles() {
        try {
            const vocabData = await this.loadJSONFile('vocabulary_data.json');
            const packagesData = await this.loadJSONFile('word_packages.json');
            const topicsData = await this.loadJSONFile('word_topics.json');
            const synonymsData = await this.loadJSONFile('word_synonyms.json');

            if (vocabData) {
                this.data.vocabulary = vocabData;
                this.data.wordPackages = packagesData || {};
                this.data.wordTopics = topicsData || {};
                this.data.wordSynonyms = synonymsData || {};
                this.data.wordExamples = {};
                
                console.log('Đã tải dữ liệu từ file:', Object.keys(this.data.vocabulary).length, 'từ');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu từ file:', error);
            return false;
        }
    },

    // Tạo dữ liệu mẫu cơ bản
    createSampleData() {
        this.data.vocabulary = {
            "hello": "xin chào",
            "world": "thế giới",
            "computer": "máy tính",
            "book": "sách",
            "student": "học sinh"
        };
        
        this.data.wordPackages = {
            "Basic English": ["hello", "world", "book"],
            "Technology": ["computer"]
        };
        
        this.data.wordTopics = {
            "Greetings": ["hello"],
            "Technology": ["computer"],
            "Education": ["book", "student"]
        };
        
        this.data.wordSynonyms = {};
        this.data.wordExamples = {};
    },

    // Tạo dữ liệu mẫu nâng cao
    createExtendedSampleData() {
        this.data.vocabulary = {
            // Greetings & Basic
            "hello": "xin chào",
            "goodbye": "tạm biệt",
            "please": "xin vui lòng",
            "thank you": "cảm ơn",
            "sorry": "xin lỗi",
            "yes": "có",
            "no": "không",
            
            // Family
            "family": "gia đình",
            "father": "bố",
            "mother": "mẹ",
            "brother": "anh/em trai",
            "sister": "chị/em gái",
            
            // School
            "school": "trường học",
            "teacher": "giáo viên",
            "student": "học sinh",
            "book": "sách",
            "pen": "bút",
            "paper": "giấy",
            
            // Technology
            "computer": "máy tính",
            "phone": "điện thoại",
            "internet": "mạng internet",
            "software": "phần mềm",
            "website": "trang web"
        };
        
        this.data.wordPackages = {
            "Basic English": ["hello", "goodbye", "please", "thank you", "sorry", "yes", "no"],
            "Family": ["family", "father", "mother", "brother", "sister"],
            "School": ["school", "teacher", "student", "book", "pen", "paper"],
            "Technology": ["computer", "phone", "internet", "software", "website"]
        };
        
        this.data.wordTopics = {
            "Greetings": ["hello", "goodbye", "thank you"],
            "Family": ["family", "father", "mother", "brother", "sister"],
            "Education": ["school", "teacher", "student", "book"],
            "Technology": ["computer", "phone", "internet", "software", "website"]
        };
        
        this.data.wordSynonyms = {
            "hello": ["hi", "hey"],
            "goodbye": ["bye", "farewell"],
            "computer": ["PC", "laptop"]
        };
        
        this.data.wordExamples = {};
    },    // Phương thức chính để tải dữ liệu
    async load() {
        // Bước 1: Thử tải từ localStorage
        const localLoaded = this.loadFromLocalStorage();
        if (localLoaded) {
            this.updateGlobalVariables();
            console.log("Đã tải dữ liệu từ localStorage");
            return true;
        }

        // Bước 2: Thử tải từ file
        console.log("Không có dữ liệu trong localStorage, đang tải từ file...");
        const fileLoaded = await this.loadFromFiles();
        if (fileLoaded) {
            this.saveToLocalStorage();
            this.updateGlobalVariables();
            console.log("Đã tải và lưu dữ liệu từ file");
            return true;
        }
        
        // Bước 3: Tạo dữ liệu mẫu nếu không tải được
        console.log("Không thể tải dữ liệu, tạo dữ liệu mẫu...");
        this.createExtendedSampleData();
        this.saveToLocalStorage();
        this.updateGlobalVariables();
        console.log("Đã tạo dữ liệu mẫu:", Object.keys(this.data.vocabulary).length, "từ");
        return true;
    },

    // Cập nhật biến toàn cục
    updateGlobalVariables() {
        vocabulary = this.data.vocabulary;
        wordPackages = this.data.wordPackages;
        wordTopics = this.data.wordTopics;
        wordSynonyms = this.data.wordSynonyms;
        wordExamples = this.data.wordExamples;

        // Export to window for debugging
        window.vocabulary = vocabulary;
        window.wordPackages = wordPackages;
        window.wordTopics = wordTopics;
        window.wordSynonyms = wordSynonyms;
        window.wordExamples = wordExamples;
    },

    // Thêm từ mới
    addWord(english, vietnamese, topic = null, examples = null) {
        this.data.vocabulary[english] = vietnamese;
        
        if (topic && this.data.wordTopics[topic]) {
            if (!this.data.wordTopics[topic].includes(english)) {
                this.data.wordTopics[topic].push(english);
            }
        }
        
        if (examples) {
            this.data.wordExamples[english] = examples;
        }
        
        this.saveToLocalStorage();
        this.updateGlobalVariables();
    },

    // Specific save functions
    saveTopics() {
        localStorage.setItem('wordTopics', JSON.stringify(this.data.wordTopics));
        this.updateGlobalVariables();
    },

    saveSynonyms() {
        localStorage.setItem('wordSynonyms', JSON.stringify(this.data.wordSynonyms));
        this.updateGlobalVariables();
    },

    // Xóa từ
    removeWord(english) {
        delete this.data.vocabulary[english];
        delete this.data.wordExamples[english];
        
        // Xóa khỏi topics
        Object.keys(this.data.wordTopics).forEach(topic => {
            const index = this.data.wordTopics[topic].indexOf(english);
            if (index > -1) {
                this.data.wordTopics[topic].splice(index, 1);
            }
        });
        
        // Xóa khỏi packages
        Object.keys(this.data.wordPackages).forEach(pkg => {
            const index = this.data.wordPackages[pkg].indexOf(english);
            if (index > -1) {
                this.data.wordPackages[pkg].splice(index, 1);
            }
        });
        
        this.saveToLocalStorage();
        this.updateGlobalVariables();
    }
};

// Export VocabularyManager
window.VocabularyManager = VocabularyManager;
