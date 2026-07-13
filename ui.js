export const DOM = {
    question: document.getElementById('question'),
    options: document.querySelector('.quiz-options'),
    checkBtn: document.getElementById('check-answer'),
    result: document.getElementById('result'),
    correctScoreDisplay: document.getElementById('correct-score'),
    totalQuestionDisplay: document.getElementById('total-questions'),
    startBtn: document.getElementById('begin-btn'),
    selectNumber: document.getElementById('select-number'),
    selectCategory: document.getElementById('select-category'),
    selectDifficulty: document.getElementById('select-difficulty'),
    warning: document.getElementById('question-warning'),
    chooseBox: document.querySelector('.choose-box'),
    quizHeader: document.querySelector('.quiz-header'),
    resultModal: document.getElementById('result-modal'),
    finalScoreText: document.getElementById('final-score-text'),
    modalPlayAgainBtn: document.getElementById('modal-play-again')
};

export function renderCategories(categories) {
    DOM.selectCategory.innerHTML = '<option value="">Any</option>';
    categories.forEach(cat => {
        DOM.selectCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

export function renderDifficulties() {
    const difficulties = ["easy", "medium", "hard"];
    DOM.selectDifficulty.innerHTML = `<option value="">Any</option>`;
    difficulties.forEach(level => {
        const label = level.charAt(0).toUpperCase() + level.slice(1);
        DOM.selectDifficulty.innerHTML += `<option value="${level}">${label}</option>`;
    });
}

export function updateScore(score, total) {
    DOM.correctScoreDisplay.textContent = score;
    DOM.totalQuestionDisplay.textContent = total;
}

export function showWarning(message) {
    DOM.warning.textContent = message;
    DOM.warning.style.display = "block";
}

export function hideWarning() {
    DOM.warning.style.display = "none";
    DOM.warning.textContent = "";
}

export function renderQuestion(data) {
    DOM.checkBtn.disabled = false;
    DOM.options.classList.remove('disabled');

    let incorrectAnswers = data.incorrect_answers;
    let optionsList = [...incorrectAnswers];
    optionsList.splice(Math.floor(Math.random() * (incorrectAnswers.length + 1)), 0, data.correct_answer);

    DOM.question.innerHTML = `${data.question} <br> <p class="category">Category: ${data.category}</p>`;

    DOM.options.innerHTML = optionsList
        .map((option, index) => `<li>${index + 1}. <span>${option}</span></li>`)
        .join('');

    DOM.options.querySelectorAll('li').forEach(option => {
        option.addEventListener('click', () => {
            const active = DOM.options.querySelector('.selected');
            if(active) active.classList.remove('selected');
            option.classList.add('selected');
        });
    });
}

export function disableOptions() {
    DOM.options.classList.add('disabled');
}

export function resetUIForNewGame() {
    DOM.result.innerHTML = "";
    DOM.checkBtn.style.display = "block";
    DOM.resultModal.close();
}

export function showFinalResult(score, total) {
    DOM.finalScoreText.innerHTML = `Your Score:<br><span style="color: rgb(255,0,0); font-size: 3rem;">${score}</span> / ${total}`;
    DOM.resultModal.showModal(); 
}

export function toggleViews(isQuizActive) {
    if (isQuizActive) {
        DOM.chooseBox.classList.add('hidden');
        DOM.quizHeader.style.display = 'block';
    } else {
        DOM.chooseBox.classList.remove('hidden');
        DOM.quizHeader.style.display = 'none';
    }
}