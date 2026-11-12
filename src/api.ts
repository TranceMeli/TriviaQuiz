import type { Category, Difficulty, Question, QuizSettings } from './types'
import { shuffle } from './utils/shuffle'

const API_BASE = 'https://opentdb.com'

export type ApiErrorKind =
  | 'no-results'
  | 'rate-limit'
  | 'invalid'
  | 'network'
  /** The session token is unknown or expired. */
  | 'token-invalid'
  /** The session token has already returned every question for this query. */
  | 'token-exhausted'

export class TriviaApiError extends Error {
  readonly kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'TriviaApiError'
    this.kind = kind
  }
}

interface RawQuestion {
  category: string
  type: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

interface QuestionsResponse {
  response_code: number
  results: RawQuestion[]
}

interface CategoriesResponse {
  trivia_categories: Category[]
}

interface TokenResponse {
  response_code: number
  token?: string
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
}

/** Decodes the few HTML entities the category endpoint uses – without touching the DOM. */
export function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#039);/g, (match) => HTML_ENTITIES[match] ?? match)
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new TriviaApiError('network', 'The request could not be sent.')
  }
  if (!response.ok) {
    const kind = response.status === 429 ? 'rate-limit' : 'network'
    throw new TriviaApiError(kind, `Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const data = await getJson<CategoriesResponse>(`${API_BASE}/api_category.php`, signal)
  return data.trivia_categories.map((category) => ({
    ...category,
    name: decodeEntities(category.name),
  }))
}

/**
 * A session token makes the API remember which questions it already returned,
 * so a replayed quiz does not repeat them.
 */
export async function requestToken(signal?: AbortSignal): Promise<string> {
  const data = await getJson<TokenResponse>(`${API_BASE}/api_token.php?command=request`, signal)
  if (data.response_code !== 0 || !data.token) {
    throw new TriviaApiError('invalid', 'No session token received.')
  }
  return data.token
}

/** Forgets the questions already served for a token (needed once it is exhausted). */
export async function resetToken(token: string, signal?: AbortSignal): Promise<void> {
  const params = new URLSearchParams({ command: 'reset', token })
  const data = await getJson<TokenResponse>(`${API_BASE}/api_token.php?${params}`, signal)
  if (data.response_code !== 0) {
    throw new TriviaApiError('token-invalid', 'The session token could not be reset.')
  }
}

export function buildQuestionsUrl({ amount, category, difficulty }: QuizSettings, token?: string): string {
  const params = new URLSearchParams({ amount: String(amount), encode: 'url3986' })
  if (category !== null) params.set('category', String(category))
  if (difficulty !== null) params.set('difficulty', difficulty)
  if (token) params.set('token', token)
  return `${API_BASE}/api.php?${params}`
}

/** Maps a raw API question (URL-encoded, see `encode=url3986`) to the UI model. */
export function toQuestion(raw: RawQuestion, random?: () => number): Question {
  const decode = decodeURIComponent
  const type = decode(raw.type) === 'boolean' ? 'boolean' : 'multiple'
  const correctAnswer = decode(raw.correct_answer)
  const incorrectAnswers = raw.incorrect_answers.map(decode)

  return {
    category: decode(raw.category),
    type,
    difficulty: decode(raw.difficulty) as Difficulty,
    text: decode(raw.question),
    correctAnswer,
    // True/False keeps its natural order; everything else is shuffled once per question.
    options: type === 'boolean' ? ['True', 'False'] : shuffle([correctAnswer, ...incorrectAnswers], random),
  }
}

export async function fetchQuestions(
  settings: QuizSettings,
  signal?: AbortSignal,
  token?: string,
): Promise<Question[]> {
  const data = await getJson<QuestionsResponse>(buildQuestionsUrl(settings, token), signal)

  switch (data.response_code) {
    case 0:
      return data.results.map((raw) => toQuestion(raw))
    case 1:
      throw new TriviaApiError('no-results', 'Not enough questions for this selection.')
    case 3:
      throw new TriviaApiError('token-invalid', 'The session token was not found.')
    case 4:
      throw new TriviaApiError('token-exhausted', 'The session token has returned all questions.')
    case 5:
      throw new TriviaApiError('rate-limit', 'Too many requests.')
    default:
      throw new TriviaApiError('invalid', `OpenTDB returned response_code ${data.response_code}`)
  }
}
