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
    },

    // Bắt đầu quiz
    startQuiz() {
        const numQuestions = parseInt(document.getElementById('quiz-questions').value) || 10;
        const questionType = document.getElementById('quiz-type').value || 'mixed';

        this.generateQuestions(numQuestions, questionType);
        this.currentQuestion = 0;
        this.selectedAnswer = null;
        this.answers = [];
        this.score = 0;

        this.showQuizInterface();
        this.showQuestion();
    },

    // Tạo câu hỏi
    generateQuestions(numQuestions, questionType) {
        if (!window.vocabulary) return;

        const words = Object.keys(window.vocabulary);
        if (words.length < 4) {
            if (window.UIManager) {
                window.UIManager.showToast('Cần ít nhất 4 từ vựng để tạo quiz!', 'warning');
            }
            return;
        }

        this.questions = [];
        const usedWords = new Set();

        for (let i = 0; i < Math.min(numQuestions, words.length); i++) {
            let randomWord;
            do {
                randomWord = words[Math.floor(Math.random() * words.length)];
            } while (usedWords.has(randomWord));

            usedWords.add(randomWord);

            const question = this.createQuestion(randomWord, questionType, words);
            if (question) {
                this.questions.push(question);
            }
        }
    },

    // Tạo một câu hỏi
    createQuestion(word, questionType, allWords) {
        const correctAnswer = window.vocabulary[word];
        const isEngToViet = questionType === 'mixed' ? Math.random() > 0.5 : questionType === 'eng-to-viet';
        
        // Tạo các đáp án sai
        const wrongAnswers = [];
        const otherWords = allWords.filter(w => w !== word);
        
        while (wrongAnswers.length < 3 && otherWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherWords.length);
            const wrongWord = otherWords[randomIndex];
            const wrongAnswer = isEngToViet ? window.vocabulary[wrongWord] : wrongWord;
            
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
    },

    // Hiển thị giao diện quiz
    showQuizInterface() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question');
        const resultSection = document.querySelector('.quiz-result');

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
        }

        // Hiển thị các đáp án
        const optionsContainer = document.getElementById('quiz-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'quiz-option';
                optionElement.innerHTML = `
                    <input type="radio" name="quiz-answer" value="${index}" id="option-${index}">
                    <label for="option-${index}">${option}</label>
                `;
                
                optionElement.addEventListener('click', () => this.selectOption(index));
                optionsContainer.appendChild(optionElement);
            });
        }

        this.selectedAnswer = null;
        this.updateNextButton();
    },

    // Chọn đáp án
    selectOption(index) {
        this.selectedAnswer = index;
        
        // Cập nhật UI
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((option, i) => {
            if (i === index) {
                option.classList.add('selected');
                option.querySelector('input').checked = true;
            } else {
                option.classList.remove('selected');
                option.querySelector('input').checked = false;
            }
        });

        this.updateNextButton();
    },

    // Cập nhật nút Next
    updateNextButton() {
        const nextBtn = document.getElementById('next-question');
        const submitBtn = document.getElementById('submit-quiz');
        
        if (this.selectedAnswer !== null) {
            if (this.currentQuestion === this.questions.length - 1) {
                if (nextBtn) nextBtn.style.display = 'none';
                if (submitBtn) submitBtn.style.display = 'inline-block';
            } else {
                if (nextBtn) nextBtn.style.display = 'inline-block';
                if (submitBtn) submitBtn.style.display = 'none';
            }
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
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
    },

    // Hiển thị kết quả
    showResults() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question');
        const resultSection = document.querySelector('.quiz-result');

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
        }

        // Hiển thị nút "Làm lại"
        const retryBtn = document.getElementById('retry-quiz');
        if (retryBtn) {
            retryBtn.style.display = 'inline-block';
            retryBtn.onclick = () => this.resetQuiz();
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
    },

    // Reset quiz
    resetQuiz() {
        const configSection = document.querySelector('.quiz-config');
        const questionSection = document.querySelector('.quiz-question');
        const resultSection = document.querySelector('.quiz-result');

        if (configSection) configSection.style.display = 'block';
        if (questionSection) questionSection.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';

        this.questions = [];
        this.currentQuestion = 0;
        this.selectedAnswer = null;
        this.answers = [];
        this.score = 0;
    }
};

// Export QuizManager
window.QuizManager = QuizManager;
