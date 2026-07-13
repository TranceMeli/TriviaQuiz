export const gameState = {
    correctAnswer: "",
    correctScore: 0,
    askedCount: 0,
    totalQuestion: 0,
    currentQuestions: [],
    currentIndex: 0
};

export function resetState(amount) {
    gameState.correctScore = 0;
    gameState.askedCount = 0;
    gameState.currentIndex = 0;
    gameState.totalQuestion = amount;
    gameState.currentQuestions = [];
}