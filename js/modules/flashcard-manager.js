// Module quản lý Flashcard
const FlashcardManager = {
    words: [],
    currentIndex: 0,
    isFlipped: false,    // Khởi tạo
    initialized: false,  // Thêm flag để tránh khởi tạo 2 lần    touchStartX: 0,      // Vị trí bắt đầu touch
    touchStartY: 0,      // Vị trí bắt đầu touch Y
    touchEndX: 0,        // Vị trí kết thúc touch
    touchEndY: 0,        // Vị trí kết thúc touch Y
    minSwipeDistance: 50, // Khoảng cách tối thiểu để được coi là swipe
    isSwiping: false,    // Flag để theo dõi trạng thái swipe
    swipeStartTime: 0,   // Thời gian bắt đầu touch
    
    // Debug touch events
    debugTouchEvents: 0,
    lastGesture: 'None',

    init() {
        if (this.initialized) {
            console.log('FlashcardManager: Đã được khởi tạo rồi, bỏ qua...');
            return;
        }
        console.log('FlashcardManager: Bắt đầu khởi tạo...');        this.loadWords();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures(); // Thêm touch gestures cho mobile
        this.setupDebugPanel(); // Thiết lập debug panel
        this.initialized = true;
        console.log('FlashcardManager: Hoàn thành khởi tạo');
    },    // Thiết lập event listeners
    setupEventListeners() {
        console.log('FlashcardManager: Setting up event listeners...');
        
        const nextBtn = document.getElementById('next-flashcard');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextCard());
            console.log('FlashcardManager: Added click listener to next button');
        } else {
            console.warn('FlashcardManager: next-flashcard button not found');
        }

        const prevBtn = document.getElementById('prev-flashcard');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevCard());
            console.log('FlashcardManager: Added click listener to prev button');
        } else {
            console.warn('FlashcardManager: prev-flashcard button not found');
        }

        const flipBtn = document.getElementById('flip-flashcard');
        if (flipBtn) {
            flipBtn.addEventListener('click', () => this.flipCard());
            console.log('FlashcardManager: Added click listener to flip button');
        } else {
            console.warn('FlashcardManager: flip-flashcard button not found');
        }        const speakBtn = document.getElementById('flashcard-speak');
        if (speakBtn) {
            speakBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn chặn event bubbling để không lật thẻ
                this.speakCurrentWord();
            });
            console.log('FlashcardManager: Added click listener to speak button');
        } else {
            console.warn('FlashcardManager: flashcard-speak button not found');
        }        const markLearnedBtn = document.getElementById('mark-learned');
        if (markLearnedBtn) {
            markLearnedBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn chặn event bubbling để không lật thẻ
                this.toggleMarkLearned();
            });
            console.log('FlashcardManager: Added click listener to mark learned button');
        } else {
            console.warn('FlashcardManager: mark-learned button not found');
        }

        const shuffleBtn = document.getElementById('shuffle-cards');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.shuffleCards());
            console.log('FlashcardManager: Added click listener to shuffle button');
        } else {
            console.warn('FlashcardManager: shuffle-cards button not found');
        }        const hintBtn = document.getElementById('toggle-hint');
        if (hintBtn) {
            hintBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn chặn event bubbling để không lật thẻ
                this.toggleHint();
            });
            console.log('FlashcardManager: Added click listener to hint button');
        } else {
            console.warn('FlashcardManager: toggle-hint button not found');
        }        // Add click listeners to flashcard faces for flipping
        const frontCard = document.getElementById('flashcard-front');
        if (frontCard) {
            frontCard.addEventListener('click', (e) => {
                // Chỉ lật thẻ nếu không click vào button
                if (!e.target.closest('button')) {
                    this.flipCard();
                }
            });
            console.log('FlashcardManager: Added click listener to front card');
        } else {
            console.warn('FlashcardManager: flashcard-front element not found');
        }

        const backCard = document.getElementById('flashcard-back');
        if (backCard) {
            backCard.addEventListener('click', (e) => {
                // Chỉ lật thẻ nếu không click vào button
                if (!e.target.closest('button')) {
                    this.flipCard();
                }
            });
            console.log('FlashcardManager: Added click listener to back card');
        } else {
            console.warn('FlashcardManager: flashcard-back element not found');
        }
        
        console.log('FlashcardManager: Finished setting up event listeners');
    },// Thiết lập phím tắt
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Chỉ xử lý khi đang ở tab flashcard
            const flashcardTab = document.getElementById('flashcard');
            if (!flashcardTab || !flashcardTab.classList.contains('active')) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevCard();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case ' ':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.toggleMarkLearned();
                    break;
                default:
                    if (e.ctrlKey && e.key === 's') {
                        e.preventDefault();
                        this.speakCurrentWord();
                    }
                    break;
            }        });
    },    // Thiết lập touch gestures cho mobile
    setupTouchGestures() {
        const flashcardContainer = document.querySelector('.flashcards-container');
        const frontCard = document.getElementById('flashcard-front');
        const backCard = document.getElementById('flashcard-back');
        
        console.log('Setting up touch gestures...');
        console.log('Container found:', !!flashcardContainer);
        console.log('Front card found:', !!frontCard);
        console.log('Back card found:', !!backCard);
        console.log('Is mobile device:', this.isMobileDevice());
        
        if (!flashcardContainer && !frontCard && !backCard) {
            console.warn('FlashcardManager: Không tìm thấy flashcard container để setup touch gestures');
            return;
        }

        // Sử dụng container chính làm target chính
        const touchTarget = flashcardContainer;
        
        if (touchTarget) {
            // Touch start - không passive để có thể preventDefault
            touchTarget.addEventListener('touchstart', (e) => {
                console.log('Touch start event on container');
                this.handleTouchStart(e);
            }, { passive: false });

            // Touch move - ngăn chặn scroll khi swipe
            touchTarget.addEventListener('touchmove', (e) => {
                if (this.isSwiping) {
                    e.preventDefault();
                    console.log('Prevented scroll during swipe');
                }
            }, { passive: false });

            // Touch end - không passive
            touchTarget.addEventListener('touchend', (e) => {
                console.log('Touch end event on container');
                this.handleTouchEnd(e);
            }, { passive: false });

            // Prevent context menu on long press
            touchTarget.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            console.log('FlashcardManager: Touch gestures đã được thiết lập cho container');
        }
        
        // Thêm touch gestures cho cả hai thẻ
        [frontCard, backCard].forEach((card, index) => {
            if (card) {
                card.addEventListener('touchstart', (e) => {
                    console.log(`Touch start on card ${index === 0 ? 'front' : 'back'}`);
                    this.handleTouchStart(e);
                }, { passive: false });

                card.addEventListener('touchmove', (e) => {
                    if (this.isSwiping) {
                        e.preventDefault();
                    }
                }, { passive: false });

                card.addEventListener('touchend', (e) => {
                    console.log(`Touch end on card ${index === 0 ? 'front' : 'back'}`);
                    this.handleTouchEnd(e);
                }, { passive: false });

                card.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                });
                
                console.log(`Touch events added to ${index === 0 ? 'front' : 'back'} card`);
            }
        });
    },// Xử lý touch start
    handleTouchStart(e) {
        // Chỉ xử lý khi đang ở tab flashcard
        const flashcardTab = document.getElementById('flashcard');
        if (!flashcardTab || !flashcardTab.classList.contains('active')) return;

        // Không xử lý nếu touch vào button
        if (e.target.closest('button')) return;

        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isSwiping = false;
        this.swipeStartTime = Date.now();
        
        console.log('Touch start:', this.touchStartX, this.touchStartY);
    },

    // Xử lý touch end
    handleTouchEnd(e) {
        // Chỉ xử lý khi đang ở tab flashcard
        const flashcardTab = document.getElementById('flashcard');
        if (!flashcardTab || !flashcardTab.classList.contains('active')) return;

        // Không xử lý nếu touch vào button
        if (e.target.closest('button')) return;

        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        
        const touchDuration = Date.now() - this.swipeStartTime;
        
        console.log('Touch end:', this.touchEndX, this.touchEndY, 'Duration:', touchDuration);
        
        // Chỉ xử lý swipe nếu thời gian touch hợp lý (không quá lâu)
        if (touchDuration < 1000) {
            this.handleSwipeGesture();
        }
        
        this.isSwiping = false;
    },    // Xử lý swipe gesture
    handleSwipeGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        console.log('Swipe detection:', {
            deltaX, deltaY, absDeltaX, absDeltaY,
            minDistance: this.minSwipeDistance
        });

        // Lấy active card để thêm visual feedback
        const activeCard = document.querySelector('.flashcard-card.active') || 
                          document.getElementById('flashcard-front');

        // Kiểm tra xem có phải là swipe horizontal không (deltaX > deltaY)
        if (absDeltaX > absDeltaY && absDeltaX > this.minSwipeDistance) {
            this.isSwiping = true;
            if (deltaX > 0) {
                // Swipe right - thẻ trước
                console.log('Swipe right detected');
                this.addSwipeVisualFeedback(activeCard, 'swipe-right');
                this.prevCard();
                this.showSwipeFeedback('⬅️ Thẻ trước');
            } else {
                // Swipe left - thẻ tiếp theo
                console.log('Swipe left detected');
                this.addSwipeVisualFeedback(activeCard, 'swipe-left');
                this.nextCard();
                this.showSwipeFeedback('➡️ Thẻ tiếp theo');
            }
        }
        // Kiểm tra swipe vertical để lật thẻ
        else if (absDeltaY > absDeltaX && absDeltaY > this.minSwipeDistance) {
            this.isSwiping = true;
            if (deltaY > 0) {
                // Swipe down - lật thẻ
                console.log('Swipe down detected');
                this.addSwipeVisualFeedback(activeCard, 'swipe-down');
                this.flipCard();
                this.showSwipeFeedback('🔄 Đã lật thẻ');
            } else {
                // Swipe up - lật thẻ
                console.log('Swipe up detected');
                this.addSwipeVisualFeedback(activeCard, 'swipe-up');
                this.flipCard();
                this.showSwipeFeedback('🔄 Đã lật thẻ');
            }
        } else {
            console.log('No swipe detected - distance too small');
        }
    },

    // Thêm visual feedback cho swipe
    addSwipeVisualFeedback(element, swipeClass) {
        if (!element) return;
        
        element.classList.add(swipeClass);
        
        // Xóa class sau một thời gian ngắn
        setTimeout(() => {
            element.classList.remove(swipeClass);
        }, 300);
    },

    // Hiển thị feedback cho swipe
    showSwipeFeedback(message) {
        if (window.UIManager) {
            window.UIManager.showToast(message, 'info', 1000);
        }
    },

    // Tải danh sách từ
    loadWords() {
        if (!window.vocabulary) return;

        const packageSelect = document.getElementById('flashcard-package');
        const selectedPackage = packageSelect ? packageSelect.value : 'all';

        // Lấy danh sách từ dựa trên gói được chọn
        if (selectedPackage === 'all') {
            this.words = Object.keys(window.vocabulary);
        } else if (selectedPackage.startsWith('topic:')) {
            const topicName = selectedPackage.substring(6);
            this.words = window.wordTopics[topicName] || [];
        } else {
            this.words = window.wordPackages[selectedPackage] || [];
        }

        // Sắp xếp: từ chưa học trước
        if (window.LearningManager) {
            this.words.sort((a, b) => {
                const aLearned = window.LearningManager.isWordLearned(a);
                const bLearned = window.LearningManager.isWordLearned(b);
                return aLearned === bLearned ? 0 : aLearned ? 1 : -1;
            });
        }

        this.currentIndex = 0;
        this.showCard();
    },

    // Trộn thẻ
    shuffleCards() {
        this.shuffleArray(this.words);
        this.currentIndex = 0;
        this.showCard();
        
        if (window.UIManager) {
            window.UIManager.showToast('Đã trộn thẻ!', 'info');
        }
    },

    // Trộn mảng
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },    // Hiển thị thẻ
    showCard() {
        if (this.words.length === 0) {
            this.showNoCardsMessage();
            return;
        }

        const word = this.words[this.currentIndex];
        const meaning = window.vocabulary[word] || '';

        // Cập nhật từ tiếng Anh
        const wordElement = document.getElementById('flashcard-word');
        if (wordElement) {
            wordElement.textContent = word;
        }

        // Cập nhật nghĩa tiếng Việt
        const meaningElement = document.getElementById('flashcard-translation');
        if (meaningElement) {
            meaningElement.textContent = meaning;
        }

        // Cập nhật ví dụ
        const exampleElement = document.getElementById('flashcard-example');
        if (exampleElement) {
            const example = this.generateExample(word);
            exampleElement.textContent = example;
        }

        // Reset trạng thái flip - luôn bắt đầu với mặt trước
        this.isFlipped = false;
        this.updateFlipState();

        // Cập nhật trạng thái đã học
        this.updateLearnedState();

        // Cập nhật tiến trình
        this.updateProgress();
    },

    // Tạo ví dụ cho từ
    generateExample(word) {
        // Sử dụng các ví dụ có sẵn hoặc tạo ví dụ đơn giản
        const examples = {
            "hello": "Hello, how are you today?",
            "goodbye": "Goodbye, see you tomorrow!",
            "thank": "Thank you for your help.",
            "computer": "I use my computer every day.",
            "book": "This is a very interesting book.",
            "student": "She is a good student.",
            "teacher": "My teacher is very kind.",
            "school": "I go to school every morning.",
            "family": "I love my family very much.",
            "friend": "He is my best friend."
        };

        return examples[word] || `This is an example with "${word}".`;
    },    // Lật thẻ
    flipCard() {
        console.log('FlashcardManager: flipCard được gọi, isFlipped hiện tại:', this.isFlipped);
        this.isFlipped = !this.isFlipped;
        console.log('FlashcardManager: isFlipped mới:', this.isFlipped);
        this.updateFlipState();
        
        // Force update by triggering reflow
        const frontCard = document.getElementById('flashcard-front');
        const backCard = document.getElementById('flashcard-back');
        if (frontCard) frontCard.offsetHeight; // Trigger reflow
        if (backCard) backCard.offsetHeight; // Trigger reflow
    },    // Cập nhật trạng thái lật thẻ
    updateFlipState() {
        console.log('FlashcardManager: updateFlipState được gọi, isFlipped:', this.isFlipped);
        const frontCard = document.getElementById('flashcard-front');
        const backCard = document.getElementById('flashcard-back');
        
        console.log('FlashcardManager: frontCard element:', frontCard);
        console.log('FlashcardManager: backCard element:', backCard);
        
        if (this.isFlipped) {
            if (frontCard) {
                frontCard.classList.remove('active');
                console.log('FlashcardManager: Removed active from front card, classes:', frontCard.className);
            }
            if (backCard) {
                backCard.classList.add('active');
                console.log('FlashcardManager: Added active to back card, classes:', backCard.className);
            }
        } else {
            if (frontCard) {
                frontCard.classList.add('active');
                console.log('FlashcardManager: Added active to front card, classes:', frontCard.className);
            }
            if (backCard) {
                backCard.classList.remove('active');
                console.log('FlashcardManager: Removed active from back card, classes:', backCard.className);
            }
        }
        
        // Update flip button text
        const flipBtn = document.getElementById('flip-flashcard');
        if (flipBtn) {
            flipBtn.textContent = this.isFlipped ? 'Lật về (Space)' : 'Lật thẻ (Space)';
            console.log('FlashcardManager: Updated flip button text:', flipBtn.textContent);
        }
        
        // Log current computed styles for debugging
        if (frontCard && backCard) {
            const frontStyle = window.getComputedStyle(frontCard);
            const backStyle = window.getComputedStyle(backCard);
            console.log('FlashcardManager: Front card transform:', frontStyle.transform);
            console.log('FlashcardManager: Back card transform:', backStyle.transform);
        }
    },

    // Thẻ tiếp theo
    nextCard() {
        if (this.words.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.words.length;
        this.showCard();
    },

    // Thẻ trước
    prevCard() {
        if (this.words.length === 0) return;
        
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.words.length - 1;
        this.showCard();
    },

    // Đánh dấu/bỏ đánh dấu đã học
    toggleMarkLearned() {
        if (this.words.length === 0) return;
        
        const word = this.words[this.currentIndex];
        
        if (window.LearningManager) {
            const wasLearned = window.LearningManager.isWordLearned(word);
            
            if (wasLearned) {
                window.LearningManager.unmarkWordAsLearned(word);
                if (window.UIManager) {
                    window.UIManager.showToast(`Đã bỏ đánh dấu từ "${word}"!`, 'info');
                }
            } else {
                window.LearningManager.markWordAsLearned(word);
                if (window.UIManager) {
                    window.UIManager.showToast(`Đã đánh dấu từ "${word}" là đã học!`, 'success');
                }
            }
            
            this.updateLearnedState();
            this.updateProgress();
        }
    },

    // Cập nhật trạng thái đã học
    updateLearnedState() {
        if (this.words.length === 0) return;
        
        const word = this.words[this.currentIndex];
        const markButton = document.getElementById('mark-learned');
        
        if (markButton && window.LearningManager) {
            const isLearned = window.LearningManager.isWordLearned(word);
            
            if (isLearned) {
                markButton.textContent = 'Bỏ đánh dấu';
                markButton.classList.remove('success');
                markButton.classList.add('secondary');
            } else {
                markButton.textContent = 'Đánh dấu đã học';
                markButton.classList.remove('secondary');
                markButton.classList.add('success');
            }
        }
    },

    // Cập nhật tiến trình
    updateProgress() {
        if (this.words.length === 0) return;
        
        let learnedCount = 0;
        if (window.LearningManager) {
            learnedCount = this.words.filter(word => window.LearningManager.isWordLearned(word)).length;
        }
        
        const percentage = Math.round((learnedCount / this.words.length) * 100);
        
        const progressText = document.getElementById('flashcard-progress');
        if (progressText) {
            progressText.textContent = `Từ ${this.currentIndex + 1}/${this.words.length} - Đã học: ${learnedCount} (${percentage}%)`;
        }
        
        const progressBar = document.getElementById('learn-progress');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    },

    // Phát âm từ hiện tại
    async speakCurrentWord() {
        if (this.words.length === 0) return;
        
        const word = this.words[this.currentIndex];
        if (window.AudioManager) {
            await window.AudioManager.speakWord(word);
        }
    },

    // Bật/tắt gợi ý
    toggleHint() {
        const hintElement = document.getElementById('flashcard-hint');
        const hintButton = document.getElementById('toggle-hint');
        
        if (hintElement && hintButton) {
            if (hintElement.style.display === 'none' || !hintElement.style.display) {
                hintElement.style.display = 'block';
                hintButton.textContent = 'Ẩn gợi ý';
            } else {
                hintElement.style.display = 'none';
                hintButton.textContent = 'Hiện gợi ý';
            }
        }
    },

    // Hiển thị thông báo không có thẻ
    showNoCardsMessage() {
        const wordElement = document.getElementById('flashcard-word');
        const meaningElement = document.getElementById('flashcard-meaning');
        const exampleElement = document.getElementById('flashcard-example');
        
        if (wordElement) wordElement.textContent = 'Không có từ vựng';
        if (meaningElement) meaningElement.textContent = 'Vui lòng chọn gói từ vựng khác';
        if (exampleElement) exampleElement.textContent = '';
        
        const progressText = document.getElementById('flashcard-progress');
        if (progressText) {
            progressText.textContent = 'Không có từ vựng để hiển thị';
        }
    },

    // Cập nhật gói từ vựng
    updatePackage() {
        this.loadWords();
    },

    // Kiểm tra xem có phải là thiết bị mobile thật không
    isMobileDevice() {
        // Kiểm tra user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        
        // Kiểm tra touch capability
        const hasTouch = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        navigator.msMaxTouchPoints > 0;
        
        // Kiểm tra screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        const isMobile = mobileRegex.test(userAgent) && hasTouch;
        
        console.log('Mobile detection:', {
            userAgent: userAgent,
            hasTouch: hasTouch,
            isSmallScreen: isSmallScreen,
            isMobile: isMobile
        });
        
        return isMobile;
    },

    // Cập nhật debug info
    updateDebugInfo() {
        const touchEventsEl = document.getElementById('touch-events');
        const lastGestureEl = document.getElementById('last-gesture');
        const deviceTypeEl = document.getElementById('device-type');
        
        if (touchEventsEl) touchEventsEl.textContent = this.debugTouchEvents;
        if (lastGestureEl) lastGestureEl.textContent = this.lastGesture;
        if (deviceTypeEl) deviceTypeEl.textContent = this.isMobileDevice() ? 'Mobile' : 'Desktop';
    },

    // Setup debug panel
    setupDebugPanel() {
        // Show debug panel on mobile or when requested
        const shouldShowDebug = this.isMobileDevice() || window.location.hash === '#debug';
        
        if (shouldShowDebug) {
            const debugPanel = document.getElementById('touch-debug');
            if (debugPanel) {
                debugPanel.style.display = 'block';
                this.updateDebugInfo();
            }
        }
        
        // Toggle debug button
        const toggleDebugBtn = document.getElementById('toggle-debug');
        if (toggleDebugBtn) {
            toggleDebugBtn.addEventListener('click', () => {
                const debugPanel = document.getElementById('touch-debug');
                if (debugPanel) {
                    const isVisible = debugPanel.style.display !== 'none';
                    debugPanel.style.display = isVisible ? 'none' : 'block';
                    toggleDebugBtn.textContent = isVisible ? 'Hiện Debug' : 'Ẩn Debug';
                }
            });
        }
        
        // Double tap to show/hide debug
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                const debugPanel = document.getElementById('touch-debug');
                if (debugPanel) {
                    const isVisible = debugPanel.style.display !== 'none';
                    debugPanel.style.display = isVisible ? 'none' : 'block';
                }
            }
            lastTap = currentTime;
        });
    },
};

// Export FlashcardManager
window.FlashcardManager = FlashcardManager;
