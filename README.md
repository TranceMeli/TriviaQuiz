# TriviaQuiz

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge)
![Open Trivia DB](https://img.shields.io/badge/Open%20Trivia%20DB-API-4CAF50?style=for-the-badge)

Interactive trivia quiz application built with vanilla JavaScript.

## Features

Dynamic trivia questions loaded from an external API. Multiple choice answers with instant visual feedback. Score tracking across the full session. Configurable number of questions, category and difficulty. Responsive layout for mobile and desktop. Restart functionality through a result modal. Loading and error states for failed requests. Modular JavaScript structure split into state, UI and API layers.

## Technologies

HTML5 for the page structure. CSS3 for styling and responsive behavior. JavaScript with ES6 Modules for the application logic. The Open Trivia DB API as the question source.

## Project Structure

```
index.html      Main HTML structure
style.css       Styling and responsive layout
app.js          Application logic and event handling
state.js        Central game state
ui.js           DOM references and rendering functions
api.js          Fetch calls to the Open Trivia DB API
```

## Installation

Clone the repository.

```bash
git clone https://github.com/TranceMeli/TriviaQuiz.git
```

Open the project folder and launch `index.html` in your browser.

## Usage

Select the number of questions, an optional category and an optional difficulty. Start the quiz, select an answer and confirm it. The correct answer is highlighted after each check. After the last question a result modal shows the final score, with the option to play again.

## Credits

Questions provided by [Open Trivia DB](https://opentdb.com/).