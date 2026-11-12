import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildQuestionsUrl,
  decodeEntities,
  fetchQuestions,
  requestToken,
  resetToken,
  toQuestion,
  TriviaApiError,
} from './api'
import { shuffle } from './utils/shuffle'

const enc = encodeURIComponent

function rawQuestion(overrides: Record<string, unknown> = {}) {
  return {
    category: enc('Science & Nature'),
    type: 'multiple',
    difficulty: 'easy',
    question: enc('What is H₂O?'),
    correct_answer: enc('Water'),
    incorrect_answers: [enc('Fire'), enc('Air'), enc('Earth')],
    ...overrides,
  }
}

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('decodeEntities', () => {
  it('decodes the entities used by the category endpoint', () => {
    expect(decodeEntities('Science &amp; Nature')).toBe('Science & Nature')
    expect(decodeEntities('It&#039;s &quot;fun&quot;')).toBe('It\'s "fun"')
  })

  it('does not double-decode', () => {
    expect(decodeEntities('&amp;lt;')).toBe('&lt;')
  })
})

describe('buildQuestionsUrl', () => {
  it('omits category and difficulty when they are "any"', () => {
    const url = new URL(buildQuestionsUrl({ amount: 10, category: null, difficulty: null }))
    expect(url.searchParams.get('amount')).toBe('10')
    expect(url.searchParams.get('encode')).toBe('url3986')
    expect(url.searchParams.has('category')).toBe(false)
    expect(url.searchParams.has('difficulty')).toBe(false)
  })

  it('adds the session token only when there is one', () => {
    const settings = { amount: 5, category: null, difficulty: null }
    expect(new URL(buildQuestionsUrl(settings, 'abc')).searchParams.get('token')).toBe('abc')
    expect(new URL(buildQuestionsUrl(settings)).searchParams.has('token')).toBe(false)
  })

  it('includes category and difficulty when set', () => {
    const url = new URL(buildQuestionsUrl({ amount: 5, category: 9, difficulty: 'hard' }))
    expect(url.searchParams.get('category')).toBe('9')
    expect(url.searchParams.get('difficulty')).toBe('hard')
  })
})

describe('toQuestion', () => {
  it('decodes text and keeps every answer as an option', () => {
    const question = toQuestion(rawQuestion())
    expect(question.category).toBe('Science & Nature')
    expect(question.text).toBe('What is H₂O?')
    expect(question.correctAnswer).toBe('Water')
    expect([...question.options].sort()).toEqual(['Air', 'Earth', 'Fire', 'Water'])
  })

  it('keeps True/False in a fixed order', () => {
    const question = toQuestion(
      rawQuestion({ type: 'boolean', correct_answer: 'False', incorrect_answers: ['True'] }),
    )
    expect(question.options).toEqual(['True', 'False'])
  })
})

describe('fetchQuestions', () => {
  const settings = { amount: 3, category: null, difficulty: null }

  it('maps results', async () => {
    mockFetch({ response_code: 0, results: [rawQuestion()] })
    await expect(fetchQuestions(settings)).resolves.toHaveLength(1)
  })

  it.each([
    [1, 'no-results'],
    [5, 'rate-limit'],
    [2, 'invalid'],
    [3, 'token-invalid'],
    [4, 'token-exhausted'],
  ])('maps response_code %i to "%s"', async (code, kind) => {
    mockFetch({ response_code: code, results: [] })
    await expect(fetchQuestions(settings)).rejects.toMatchObject({ kind })
  })

  it('maps HTTP 429 to rate-limit and other failures to network', async () => {
    mockFetch({}, 429)
    await expect(fetchQuestions(settings)).rejects.toMatchObject({ kind: 'rate-limit' })
    mockFetch({}, 500)
    await expect(fetchQuestions(settings)).rejects.toBeInstanceOf(TriviaApiError)
  })

  it('maps a failed request to network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(fetchQuestions(settings)).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('session token', () => {
  it('requests a token', async () => {
    mockFetch({ response_code: 0, token: 'abc' })
    await expect(requestToken()).resolves.toBe('abc')
  })

  it('rejects when the API sends no token', async () => {
    mockFetch({ response_code: 0 })
    await expect(requestToken()).rejects.toBeInstanceOf(TriviaApiError)
  })

  it('resets a token and reports failure', async () => {
    mockFetch({ response_code: 0, token: 'abc' })
    await expect(resetToken('abc')).resolves.toBeUndefined()
    mockFetch({ response_code: 3 })
    await expect(resetToken('abc')).rejects.toMatchObject({ kind: 'token-invalid' })
  })
})

describe('shuffle', () => {
  it('returns a permutation and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...result].sort()).toEqual(input)
  })
})
