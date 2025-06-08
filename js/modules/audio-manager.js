// Module quản lý âm thanh và phát âm
const AudioManager = {
    currentUtterance: null,
    isSpeaking: false,

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

            // Nếu đang phát âm, dừng lại trước
            if (this.isSpeaking || this.currentUtterance) {
                this.stopSpeaking();
            }

            // Chờ một chút để đảm bảo speech synthesis đã dừng hoàn toàn
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(word);
                this.currentUtterance = utterance;
                this.isSpeaking = true;
                
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

                utterance.onend = () => {
                    this.isSpeaking = false;
                    this.currentUtterance = null;
                    resolve();
                };
                
                utterance.onerror = (error) => {
                    this.isSpeaking = false;
                    this.currentUtterance = null;
                    // Chỉ log lỗi nếu không phải lỗi "interrupted"
                    if (error.error !== 'interrupted') {
                        console.error('Lỗi text-to-speech:', error);
                    }
                    resolve(); // Resolve thay vì reject để không gây lỗi
                };

                utterance.onstart = () => {
                    this.isSpeaking = true;
                };

                try {
                    window.speechSynthesis.speak(utterance);
                } catch (error) {
                    this.isSpeaking = false;
                    this.currentUtterance = null;
                    console.error('Lỗi khi phát âm:', error);
                    resolve();
                }
            }, 100);
        });
    },

    // Dừng phát âm hiện tại
    stopSpeaking() {
        if (window.speechSynthesis && (this.isSpeaking || window.speechSynthesis.speaking)) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
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
