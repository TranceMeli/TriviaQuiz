import { fetchCategories, fetchQuestions } from './api.js';
import { gameState, resetState } from './state.js';
import { 
    DOM, renderCategories, renderDifficulties, updateScore, 
    showWarning, hideWarning, renderQuestion, disableOptions, 
    resetUIForNewGame, showFinalResult, toggleViews
} from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    updateScore(gameState.correctScore, gameState.totalQuestion);
    renderDifficulties();
    
    const categories = await fetchCategories();
    renderCategories(categories);

    DOM.startBtn.addEventListener('click', startQuiz);
    DOM.checkBtn.addEventListener('click', checkAnswer);
    DOM.modalPlayAgainBtn.addEventListener('click', restartQuiz);
});

async function startQuiz() {
    hideWarning();
    resetUIForNewGame();

    let selectedNumber = parseInt(DOM.selectNumber.value);
    if (isNaN(selectedNumber) || selectedNumber < 1) {
        showWarning("Please enter a number greater than 0");
        return;
    }
    if (selectedNumber > 50) {
        showWarning("Please enter a number not greater than 50");
        return;
    }

    resetState(selectedNumber);
    const category = DOM.selectCategory.value;
    const difficulty = DOM.selectDifficulty.value;

    try {
        const questions = await fetchQuestions(selectedNumber, category, difficulty);

        toggleViews(true); 
        
        gameState.currentQuestions = questions;
        updateScore(gameState.correctScore, gameState.totalQuestion);
        loadCurrentQuestion();
    } catch (err) {
        console.error("Failed to load questions:", err);
        if (err.message.includes('response_code 1')) {
            showWarning("Not enough questions available for this selection. Try different settings.");
        } else if (err.message.includes('response_code 5')) {
            showWarning("Too many requests. Please wait a moment and try again.");
        } else {
            showWarning("Could not load questions. Please try again.");
        }
    }
}

function loadCurrentQuestion() {
    const currentQuestionData = gameState.currentQuestions[gameState.currentIndex];
    gameState.correctAnswer = currentQuestionData.correct_answer;
    renderQuestion(currentQuestionData);
}

function checkAnswer() {
    DOM.checkBtn.disabled = true;
    const selected = DOM.options.querySelector('.selected');

    if (selected) {
        disableOptions();
        DOM.result.innerHTML = ""; 
        
        let selectedAnswer = selected.querySelector('span').textContent;
        selected.classList.remove('selected');

        if (selectedAnswer === gameState.correctAnswer) {
            gameState.correctScore++;
            selected.classList.add('correct');
            selected.innerHTML += " ✅"; 
        } else {
            selected.classList.add('incorrect');
            selected.innerHTML += " ❌"; 
            
            DOM.options.querySelectorAll('li').forEach(li => {
                if (li.querySelector('span').textContent === gameState.correctAnswer) {
                    li.classList.add('correct');
                    li.innerHTML += " ✅";
                }
            });
        }
        
        gameState.askedCount++;
        updateScore(gameState.correctScore, gameState.totalQuestion);

        setTimeout(() => {
            checkCount();
        }, 1500);
        
    } else {
        DOM.result.innerHTML = `<p>Please select an option!</p>`;
        DOM.checkBtn.disabled = false;
    }
}

function checkCount() {
    if (gameState.askedCount >= gameState.totalQuestion) {
        showFinalResult(gameState.correctScore, gameState.totalQuestion);
    } else {
        gameState.currentIndex++;
        loadCurrentQuestion();
    }
}

function restartQuiz() {
    DOM.resultModal.close();
    toggleViews(false);
}