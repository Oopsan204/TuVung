// Module quản lý âm thanh và phát âm
const AudioManager = {
    // Khởi tạo âm thanh
    init() {
        this.loadVoicesList();
        this.loadSavedSettings();
    },

    // Phát âm từ với khả năng tùy chỉnh
    async speakWord(word) {
        return new Promise((resolve, reject) => {
            if (!('speechSynthesis' in window)) {
                console.warn('Text-to-speech không được hỗ trợ trong trình duyệt này');
                resolve();
                return;
            }

            // Dừng tất cả giọng nói hiện tại
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(word);
            
            // Cài đặt tốc độ
            const speechRate = localStorage.getItem('speechRate') || '1';
            utterance.rate = parseFloat(speechRate);
            
            // Cài đặt giọng nói
            const selectedVoice = localStorage.getItem('selectedVoice');
            if (selectedVoice) {
                const voices = window.speechSynthesis.getVoices();
                const voice = voices.find(v => v.name === selectedVoice);
                if (voice) {
                    utterance.voice = voice;
                }
            }

            utterance.onend = () => resolve();
            utterance.onerror = (error) => {
                console.error('Lỗi text-to-speech:', error);
                reject(error);
            };

            window.speechSynthesis.speak(utterance);
        });
    },

    // Tải danh sách giọng đọc
    loadVoicesList() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            voiceSelect.innerHTML = '';

            voices.forEach((voice) => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - Default' : ''}`;
                voiceSelect.appendChild(option);
            });

            // Chọn giọng đã được lưu
            const savedVoice = localStorage.getItem('selectedVoice');
            if (savedVoice) {
                voiceSelect.value = savedVoice;
            }
        };

        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
            loadVoices();
        }
    },

    // Tải cài đặt đã lưu
    loadSavedSettings() {
        const savedSpeed = localStorage.getItem('speechRate') || '1';
        const speedElement = document.getElementById('speech-speed');
        const speedValueElement = document.getElementById('speed-value');
        
        if (speedElement) {
            speedElement.value = savedSpeed;
        }
        if (speedValueElement) {
            speedValueElement.textContent = savedSpeed + 'x';
        }
    },

    // Cập nhật tốc độ phát âm
    updateSpeedValue() {
        const speedElement = document.getElementById('speech-speed');
        const speedValueElement = document.getElementById('speed-value');
        
        if (speedElement && speedValueElement) {
            const speed = speedElement.value;
            speedValueElement.textContent = speed + 'x';
            localStorage.setItem('speechRate', speed);
        }
    },

    // Cập nhật giọng đọc được chọn
    updateSelectedVoice() {
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect) {
            const selectedVoice = voiceSelect.value;
            localStorage.setItem('selectedVoice', selectedVoice);
        }
    },

    // Phát âm thanh khi trả lời đúng
    playCorrectSound() {
        // Sử dụng Web Audio API để tạo âm thanh đơn giản
        if (typeof(AudioContext) !== "undefined" || typeof(webkitAudioContext) !== "undefined") {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Tần số cao cho âm thanh tích cực
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    },

    // Phát âm thanh khi trả lời sai
    playIncorrectSound() {
        if (typeof(AudioContext) !== "undefined" || typeof(webkitAudioContext) !== "undefined") {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 300; // Tần số thấp cho âm thanh tiêu cực
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }
};

// Export AudioManager
window.AudioManager = AudioManager;
