// DOM elements
const question = document.getElementById('question');
const options = document.querySelector('.quiz-options');
const checkBtn = document.getElementById('check-answer');
const playAgainBtn = document.getElementById('play-again');
const result = document.getElementById('result');
const correctScoreDisplay = document.getElementById('correct-score');
const totalQuestionDisplay = document.getElementById('total-questions');
const startBtn = document.getElementById('begin-btn')

// user input elements
const selectNumber = document.getElementById('select-number')
const selectCategory = document.getElementById('select-category');
const selectDifficulty = document.getElementById('select-difficulty');

const timerElement = document.getElementById('timer');

let correctAnswer = ""; // current correct answers
let correctScore = 0; // number of correct answers
let askedCount = 0;  // number of questions asked so far
let totalQuestion = 0; // number of questions
let currentQuestions = []; // store fetched questions
let currentIndex = 0; // index of the current question

totalQuestionDisplay.textContent = totalQuestion; // display total


// Add event listeners to buttons
function eventListeners(){
    checkBtn.addEventListener('click', checkAnswer);
    playAgainBtn.addEventListener('click', restartQuiz);
    startBtn.addEventListener('click', startQuiz);
}

document.addEventListener('DOMContentLoaded', function(){
    correctScoreDisplay.textContent = correctScore;
    eventListeners(); // initialize event listeners
    loadCategories(); // populate categories
    loadDifficulties(); // difficulty dropdown
});

// API fetch
async function loadCategories() {
    const categoryUrl = 'https://opentdb.com/api_category.php';
    const res = await fetch(categoryUrl);
    const data = await res.json();

    selectCategory.innerHTML = '<option value="">Any</option>';
    data.trivia_categories.forEach(cat => {
        selectCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

// start quiz, fetch and show first question
async function startQuiz(){
    // quizTimer();
    correctScore = 0;
    askedCount = 0;
    currentIndex = 0;
    result.innerHTML = "";
    playAgainBtn.style.display = "none";
    checkBtn.style.display = "block";

    // validate number input
    const warning = document.getElementById('question-warning');    
    warning.style.display = "none";
    warning.textContent = "";

    // get user input
let selectedNumber = parseInt(selectNumber.value);
if (isNaN(selectedNumber) || selectedNumber < 1) {
    selectedNumber = 1; // mininum
    warning.textContent = "Please enter a number greater than 0";
    warning.style.display = "block";
    return;   
}
if (selectedNumber > 50) {
    selectedNumber = 50; // maximum limit
    warning.textContent = "Please enter a number not greater than 50";
    warning.style.display = "block"; 
    return; 
}

totalQuestion = selectedNumber;

const category = selectCategory.value;
const difficulty = selectDifficulty.value;

    // API url with filters
    let apiUrl = `https://opentdb.com/api.php?amount=${totalQuestion}`;
    if (category) apiUrl += `&category=${category}`;
    if (difficulty) apiUrl += `&difficulty=${difficulty}`;

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        currentQuestions = data.results;

        if(!currentQuestions.length) {
            warning.textContent = "No questions found. Try different settings";
            warning.style.display = "block";
        }
        setCount();
        showQuestion(currentQuestions[currentIndex]);
    } catch (err) {
        console.error("Failed to load questions", err);
        result.innerHTML = `<p>Could not load questions. Please try again.</p>`;
    }
}

// display questions and answer options
function showQuestion(data){
    checkBtn.disabled = false;
    correctAnswer = data.correct_answer;

// merge and shuffle answers
    let incorrectAnswer = data.incorrect_answers;
    let optionsList = [...incorrectAnswer];
    optionsList.splice(Math.floor(Math.random() * (incorrectAnswer.length + 1)), 0, correctAnswer);
    console.log(correctAnswer);

// show questions and category
question.innerHTML = `${data.question} <br> <p class="category">Category: ${data.category}</p>`;

// display options
options.innerHTML = optionsList
    .map((option, index) => `<li>${index + 1}. <span>${option}</span></li>`)
    .join('');

    selectOption();
}

//option selection
function selectOption() {
    options.querySelectorAll('li').forEach(function(option){
        option.addEventListener('click', function(){
            const active = options.querySelector('.selected');
            if(active) active.classList.remove('selected');
            option.classList.add('selected');
        });
    });
}

function loadDifficulties() {
    const difficulties = ["easy", "medium", "hard"];
    selectDifficulty.innerHTML = `<option value="">Any</option>`;
    difficulties.forEach(level => {
        selectDifficulty.innerHTML += `<option value="${level}">${level.charAt(0).toUpperCase() + level.slice(1)}</option>`
    }); 
}

// answer checking
function checkAnswer(){
    checkBtn.disabled = true;

    const selected = options.querySelector('.selected');
    if(selected){
        let selectedAnswer = selected.querySelector('span').textContent;
        selected.classList.remove('selected')
        if (selectedAnswer == correctAnswer) {
            correctScore++;
            // result.innerHTML = `<p>Correct Answer!</p>`;
            alert("Correct Answer!")
            
            selected.classList.add('correct');   
        }
        else{
            // result.innerHTML = `<p>Incorrect Answer!</p>`
            alert("Incorrent Answer!")
            selected.classList.add('incorrect')
        }
        checkCount();
    }else{
        result.innerHTML = `<p>Please select an option!</p>`
        checkBtn.disabled = false;
    }
}

// count quiz progression and move to the next question
function checkCount(){
    askedCount++;
    setCount();
    
    if(askedCount >= totalQuestion){
        result.innerHTML += `<p>Your Score: ${correctScore} / ${totalQuestion}</p>`;
        playAgainBtn.style.display = "block";
        checkBtn.style.display = "none";
    }else{
        currentIndex++;
        setTimeout(() => {
            showQuestion(currentQuestions[currentIndex]);
        }, 300);
    }
}

// update display counter
function setCount(){
    totalQuestionDisplay.textContent = totalQuestion;
    correctScoreDisplay.textContent = correctScore;
}

// reset game and start again
function restartQuiz(){
    correctScore = 0;
    askedCount = 0;
    playAgainBtn.style.display = "none";
    checkBtn.style.display = "block";
    checkBtn.disabled = false;
    setCount();
    startQuiz();
}


