// Module quản lý Quiz
const QuizManager = {
    questions: [],
    currentQuestion: 0,
    selectedAnswer: null,
    answers: [],
    score: 0,

    // Khởi tạo
    init() {
        this.setupEventListeners();
    },

    // Thiết lập event listeners
    setupEventListeners() {
        const startQuizBtn = document.getElementById('start-quiz');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.startQuiz());
        }

        const submitQuizBtn = document.getElementById('submit-quiz');
        if (submitQuizBtn) {
            submitQuizBtn.addEventListener('click', () => this.submitQuiz());
        }

        const nextQuestionBtn = document.getElementById('next-question');
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        }

        const viewDetailsBtn = document.getElementById('view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => this.showQuizDetails());
        }

        const closeDetailsBtn = document.getElementById('close-quiz-details');
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => this.closeQuizDetails());
        }
    },    // Bắt đầu quiz
    startQuiz() {
        const numQuestions = parseInt(document.getElementById('quiz-count').value) || 10;
        const quizTypeRadio = document.querySelector('input[name="quiz-type"]:checked');
        const questionType = quizTypeRadio ? quizTypeRadio.value : 'eng_to_viet';
        const selectedPackage = document.getElementById('quiz-package')?.value || 'all';

        // Get vocabulary based on selected package
        let vocabularyToUse = {};
        if (selectedPackage === 'all') {
            vocabularyToUse = window.vocabulary || {};
        } else if (window.wordPackages && window.wordPackages[selectedPackage]) {
            // Package selected
            const packageWords = window.wordPackages[selectedPackage];
            for (const word of packageWords) {
                if (window.vocabulary && window.vocabulary[word]) {
                    vocabularyToUse[word] = window.vocabulary[word];
                }
            }
        } else if (window.wordTopics && window.wordTopics[selectedPackage]) {
            // Topic selected
            const topicWords = window.wordTopics[selectedPackage];
            for (const word of topicWords) {
                if (window.vocabulary && window.vocabulary[word]) {
                    vocabularyToUse[word] = window.vocabulary[word];
                }
            }
        }

        this.generateQuestions(numQuestions, questionType, vocabularyToUse);
        this.currentQuestion = 0;
        this.selectedAnswer = null;
        this.answers = [];
        this.score = 0;

        this.showQuizInterface();
        this.showQuestion();
    },    // Tạo câu hỏi
    generateQuestions(numQuestions, questionType, vocabularyToUse = null) {
        const vocabulary = vocabularyToUse || window.vocabulary;
        if (!vocabulary) return;

        const words = Object.keys(vocabulary);
        if (words.length < 4) {
            if (window.UIManager) {
                window.UIManager.showToast('Cần ít nhất 4 từ vựng để tạo quiz!', 'warning');
            }
            return;
        }

        this.questions = [];
        const usedWords = new Set();

        const questionCount = numQuestions === 'all' ? words.length : Math.min(parseInt(numQuestions), words.length);

        for (let i = 0; i < questionCount; i++) {
            let randomWord;
            do {
                randomWord = words[Math.floor(Math.random() * words.length)];
            } while (usedWords.has(randomWord));

            usedWords.add(randomWord);

            const question = this.createQuestion(randomWord, questionType, words, vocabulary);
            if (question) {
                this.questions.push(question);
            }
        }
    },    // Tạo một câu hỏi
    createQuestion(word, questionType, allWords, vocabulary) {
        const correctAnswer = vocabulary[word];
        const isEngToViet = questionType === 'mixed' ? Math.random() > 0.5 : questionType === 'eng_to_viet';
        
        // Tạo các đáp án sai
        const wrongAnswers = [];
        const otherWords = allWords.filter(w => w !== word);
        
        while (wrongAnswers.length < 3 && otherWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherWords.length);
            const wrongWord = otherWords[randomIndex];
            const wrongAnswer = isEngToViet ? vocabulary[wrongWord] : wrongWord;
            
            if (!wrongAnswers.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
                wrongAnswers.push(wrongAnswer);
            }
            otherWords.splice(randomIndex, 1);
        }

        if (wrongAnswers.length < 3) return null;

        // Tạo câu hỏi
        const question = {
            question: isEngToViet ? word : correctAnswer,
            correctAnswer: isEngToViet ? correctAnswer : word,
            options: [...wrongAnswers, isEngToViet ? correctAnswer : word],
            type: isEngToViet ? 'eng-to-viet' : 'viet-to-eng'
        };

        // Trộn đáp án
        this.shuffleArray(question.options);
        question.correctIndex = question.options.indexOf(question.correctAnswer);

        return question;
    },

    // Trộn mảng
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },    // Hiển thị giao diện quiz
    showQuizInterface() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question-section');
        const resultSection = document.querySelector('.quiz-result-section');

        if (configSection) configSection.style.display = 'none';
        if (questionSection) questionSection.style.display = 'block';
        if (resultSection) resultSection.style.display = 'none';
    },

    // Hiển thị câu hỏi
    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }

        const question = this.questions[this.currentQuestion];
        
        // Cập nhật nội dung câu hỏi
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.textContent = question.question;
        }

        const questionNumber = document.getElementById('question-number');
        if (questionNumber) {
            questionNumber.textContent = `Câu hỏi ${this.currentQuestion + 1}/${this.questions.length}`;
        }        // Hiển thị các đáp án
        const optionsContainer = document.getElementById('quiz-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'quiz-option';
                optionElement.innerHTML = `
                    <div class="radio-circle"></div>
                    <span>${option}</span>
                    <input type="radio" name="quiz-answer" value="${index}" id="option-${index}" style="display: none;">
                `;
                
                optionElement.addEventListener('click', () => this.selectOption(index));
                optionsContainer.appendChild(optionElement);
            });
        }

        this.selectedAnswer = null;
        this.updateNextButton();
    },    // Chọn đáp án
    selectOption(index) {
        this.selectedAnswer = index;
        
        // Cập nhật UI
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((option, i) => {
            if (i === index) {
                option.classList.add('selected');
                const radioInput = option.querySelector('input');
                if (radioInput) radioInput.checked = true;
            } else {
                option.classList.remove('selected');
                const radioInput = option.querySelector('input');
                if (radioInput) radioInput.checked = false;
            }
        });

        this.updateNextButton();
    },// Cập nhật nút Next
    updateNextButton() {
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-quiz');
        
        if (this.selectedAnswer !== null) {
            if (this.currentQuestion === this.questions.length - 1) {
                if (nextBtn) {
                    nextBtn.style.display = 'none';
                    nextBtn.disabled = true;
                }
                if (submitBtn) {
                    submitBtn.style.display = 'inline-block';
                    submitBtn.disabled = false;
                }
            } else {
                if (nextBtn) {
                    nextBtn.style.display = 'inline-block';
                    nextBtn.disabled = false;
                }
                if (submitBtn) {
                    submitBtn.style.display = 'none';
                    submitBtn.disabled = true;
                }
            }
        } else {
            if (nextBtn) {
                nextBtn.style.display = 'none';
                nextBtn.disabled = true;
            }
            if (submitBtn) {
                submitBtn.style.display = 'none';
                submitBtn.disabled = true;
            }
        }
    },

    // Câu hỏi tiếp theo
    nextQuestion() {
        if (this.selectedAnswer === null) return;

        const question = this.questions[this.currentQuestion];
        const isCorrect = this.selectedAnswer === question.correctIndex;
        
        this.answers.push({
            question: question.question,
            correctAnswer: question.correctAnswer,
            userAnswer: question.options[this.selectedAnswer],
            isCorrect: isCorrect
        });

        if (isCorrect) {
            this.score++;
        }

        this.currentQuestion++;
        this.showQuestion();
    },

    // Nộp bài quiz
    submitQuiz() {
        this.nextQuestion(); // Lưu câu trả lời cuối
        this.showResults();
    },    // Hiển thị kết quả
    showResults() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question-section');
        const resultSection = document.querySelector('.quiz-result-section');

        if (configSection) configSection.style.display = 'none';
        if (questionSection) questionSection.style.display = 'none';
        if (resultSection) resultSection.style.display = 'block';

        const percentage = Math.round((this.score / this.questions.length) * 100);
        
        // Cập nhật kết quả
        const scoreElement = document.getElementById('quiz-score');
        if (scoreElement) {
            scoreElement.textContent = `${this.score}/${this.questions.length} (${percentage}%)`;
        }

        const gradeElement = document.getElementById('quiz-grade');
        if (gradeElement) {
            let grade = 'Cần cố gắng hơn';
            if (percentage >= 90) grade = 'Xuất sắc';
            else if (percentage >= 80) grade = 'Tốt';
            else if (percentage >= 70) grade = 'Khá';
            else if (percentage >= 60) grade = 'Trung bình';
            
            gradeElement.textContent = grade;
        }        // Hiển thị nút "Làm lại" và "Xem chi tiết"
        const retryBtn = document.getElementById('retry-quiz');
        if (retryBtn) {
            retryBtn.style.display = 'inline-block';
            retryBtn.onclick = () => this.resetQuiz();
        }

        const viewDetailsBtn = document.getElementById('view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.disabled = false;
            viewDetailsBtn.style.display = 'inline-block';
        }
    },

    // Hiển thị chi tiết quiz
    showQuizDetails() {
        const dialog = document.getElementById('quiz-details-dialog');
        if (!dialog) return;

        const detailsContainer = document.getElementById('quiz-details-content');
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
            
            this.answers.forEach((answer, index) => {
                const answerElement = document.createElement('div');
                answerElement.className = `answer-detail ${answer.isCorrect ? 'correct' : 'incorrect'}`;
                answerElement.innerHTML = `
                    <h4>Câu ${index + 1}: ${answer.question}</h4>
                    <p><strong>Đáp án của bạn:</strong> ${answer.userAnswer}</p>
                    <p><strong>Đáp án đúng:</strong> ${answer.correctAnswer}</p>
                    <p class="result">${answer.isCorrect ? '✓ Đúng' : '✗ Sai'}</p>
                `;
                detailsContainer.appendChild(answerElement);
            });
        }

        dialog.style.display = 'block';
    },

    // Đóng chi tiết quiz
    closeQuizDetails() {
        const dialog = document.getElementById('quiz-details-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    },    // Reset quiz
    resetQuiz() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question-section');
        const resultSection = document.querySelector('.quiz-result-section');

        if (configSection) configSection.style.display = 'block';
        if (questionSection) questionSection.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';

        // Reset buttons
        const viewDetailsBtn = document.getElementById('view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.disabled = true;
        }

        const retryBtn = document.getElementById('retry-quiz');
        if (retryBtn) {
            retryBtn.style.display = 'none';
        }

        this.questions = [];
        this.currentQuestion = 0;
        this.selectedAnswer = null;
        this.answers = [];
        this.score = 0;
    }
};

// Export QuizManager
window.QuizManager = QuizManager;
