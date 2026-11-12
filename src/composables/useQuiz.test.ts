import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TriviaApiError } from '../api'
import type { Question } from '../types'
import { useQuiz } from './useQuiz'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  fetchQuestions: vi.fn(),
  fetchCategories: vi.fn(),
}))

const api = await import('../api')

const questions: Question[] = [
  { category: 'A', type: 'multiple', difficulty: 'easy', text: 'Q1', correctAnswer: 'right', options: ['right', 'wrong'] },
  { category: 'A', type: 'multiple', difficulty: 'easy', text: 'Q2', correctAnswer: 'yes', options: ['no', 'yes'] },
]
const settings = { amount: 2, category: null, difficulty: null }

beforeEach(() => {
  vi.mocked(api.fetchQuestions).mockReset()
  // Keep tests independent of any real browser storage.
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  })
})

describe('useQuiz', () => {
  it('plays through a quiz and counts correct answers', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()

    await quiz.start(settings)
    expect(quiz.phase.value).toBe('playing')
    expect(quiz.current.value?.text).toBe('Q1')

    quiz.select('right')
    quiz.check()
    expect(quiz.isCorrect.value).toBe(true)
    expect(quiz.score.value).toBe(1)

    quiz.next()
    quiz.select('no')
    quiz.check()
    expect(quiz.isCorrect.value).toBe(false)
    expect(quiz.score.value).toBe(1)
    expect(quiz.isLastQuestion.value).toBe(true)

    quiz.next()
    expect(quiz.phase.value).toBe('finished')
  })

  it('asks for a selection instead of checking an empty answer', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)

    quiz.check()
    expect(quiz.checked.value).toBe(false)
    expect(quiz.selectionMissing.value).toBe(true)

    quiz.select('right')
    expect(quiz.selectionMissing.value).toBe(false)
  })

  it('locks the answer after checking and only counts it once', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)

    quiz.select('right')
    quiz.check()
    quiz.check()
    quiz.select('wrong')
    expect(quiz.score.value).toBe(1)
    expect(quiz.selected.value).toBe('right')
  })

  it('does not advance before the answer was checked', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)

    quiz.next()
    expect(quiz.index.value).toBe(0)
  })

  it('returns to setup with a readable message when loading fails', async () => {
    vi.mocked(api.fetchQuestions).mockImplementation(async () => {
      throw new TriviaApiError('no-results', 'x')
    })
    const quiz = useQuiz()

    await quiz.start(settings)
    expect(quiz.phase.value).toBe('setup')
    expect(quiz.error.value).toMatch(/not enough questions/i)
  })

  it('collects wrong answers for the review', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)

    quiz.select('wrong')
    quiz.check()
    quiz.next()
    quiz.select('yes')
    quiz.check()

    expect(quiz.missed.value).toHaveLength(1)
    expect(quiz.missed.value[0]?.question.text).toBe('Q1')
    expect(quiz.missed.value[0]?.givenAnswer).toBe('wrong')
  })

  it('remembers the settings of the last quiz and replays them', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    const custom = { amount: 2, category: 9, difficulty: 'hard' as const }

    await quiz.start(custom)
    quiz.select('right')
    quiz.check()
    await quiz.playAgain()

    expect(vi.mocked(api.fetchQuestions)).toHaveBeenLastCalledWith(custom, expect.anything())
    expect(quiz.settings.value).toEqual(custom)
    expect(quiz.score.value).toBe(0)
    expect(quiz.missed.value).toEqual([])
  })

  it('does not overwrite remembered settings when loading fails', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)

    vi.mocked(api.fetchQuestions).mockImplementation(async () => {
      throw new TriviaApiError('network', 'x')
    })
    await quiz.start({ amount: 40, category: 1, difficulty: 'easy' })

    expect(quiz.settings.value).toEqual(settings)
  })

  it('resets the score for a new game', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
    const quiz = useQuiz()
    await quiz.start(settings)
    quiz.select('right')
    quiz.check()
    quiz.backToSetup()

    await quiz.start(settings)
    expect(quiz.score.value).toBe(0)
    expect(quiz.index.value).toBe(0)
    expect(quiz.checked.value).toBe(false)
  })
})
