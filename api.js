function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function decodeQuestion(question) {
    return {
        ...question,
        category: decodeHtmlEntities(question.category),
        question: decodeHtmlEntities(question.question),
        correct_answer: decodeHtmlEntities(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map(decodeHtmlEntities)
    };
}

export async function fetchCategories() {
    try {
        const res = await fetch('https://opentdb.com/api_category.php');
        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        return data.trivia_categories.map(cat => ({
            ...cat,
            name: decodeHtmlEntities(cat.name)
        }));
    } catch (err) {
        console.error("Error loading categories:", err);
        return [];
    }
}

export async function fetchQuestions(amount, category, difficulty) {
    let apiUrl = `https://opentdb.com/api.php?amount=${amount}`;
    if (category) apiUrl += `&category=${category}`;
    if (difficulty) apiUrl += `&difficulty=${difficulty}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();

    if (data.response_code !== 0) {
        throw new Error(`OpenTDB returned response_code ${data.response_code}`);
    }

    return data.results.map(decodeQuestion);
}