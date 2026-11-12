import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TriviaApiError } from '../api'
import { RATE_LIMIT_PAUSE_MS } from '../constants'
import type { Question } from '../types'
import { useQuiz } from './useQuiz'

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  fetchQuestions: vi.fn(),
  fetchCategories: vi.fn(),
  requestToken: vi.fn(),
  resetToken: vi.fn(),
}))

const api = await import('../api')

const questions: Question[] = [
  { category: 'A', type: 'multiple', difficulty: 'easy', text: 'Q1', correctAnswer: 'right', options: ['right', 'wrong'] },
  { category: 'A', type: 'multiple', difficulty: 'easy', text: 'Q2', correctAnswer: 'yes', options: ['no', 'yes'] },
]
const settings = { amount: 2, category: null, difficulty: null }

beforeEach(() => {
  vi.mocked(api.fetchQuestions).mockReset()
  vi.mocked(api.requestToken).mockReset().mockResolvedValue('tok')
  vi.mocked(api.resetToken).mockReset().mockResolvedValue(undefined)
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

    expect(vi.mocked(api.fetchQuestions)).toHaveBeenLastCalledWith(custom, expect.anything(), 'tok')
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

  describe('session token', () => {
    it('requests one token and reuses it for replayed quizzes', async () => {
      vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
      const quiz = useQuiz()

      await quiz.start(settings)
      await quiz.playAgain()

      expect(api.requestToken).toHaveBeenCalledTimes(1)
      expect(api.fetchQuestions).toHaveBeenNthCalledWith(1, settings, expect.anything(), 'tok')
      expect(api.fetchQuestions).toHaveBeenNthCalledWith(2, settings, expect.anything(), 'tok')
    })

    it('still starts the quiz when no token can be obtained', async () => {
      vi.mocked(api.requestToken).mockRejectedValue(new TriviaApiError('network', 'x'))
      vi.mocked(api.fetchQuestions).mockResolvedValue(questions)
      const quiz = useQuiz()

      await quiz.start(settings)

      expect(quiz.phase.value).toBe('playing')
      expect(api.fetchQuestions).toHaveBeenCalledWith(settings, expect.anything(), undefined)
    })

    it('resets an exhausted token and retries after the rate-limit pause', async () => {
      vi.useFakeTimers()
      try {
        vi.mocked(api.fetchQuestions)
          .mockRejectedValueOnce(new TriviaApiError('token-exhausted', 'x'))
          .mockResolvedValueOnce(questions)
        const quiz = useQuiz()

        const started = quiz.start(settings)
        await vi.advanceTimersByTimeAsync(0)
        expect(api.resetToken).toHaveBeenCalledWith('tok', expect.anything())
        expect(api.fetchQuestions).toHaveBeenCalledTimes(1) // must not retry before the pause

        await vi.advanceTimersByTimeAsync(RATE_LIMIT_PAUSE_MS)
        await started

        expect(api.fetchQuestions).toHaveBeenCalledTimes(2)
        expect(quiz.phase.value).toBe('playing')
      } finally {
        vi.useRealTimers()
      }
    })

    it('requests a fresh token when the old one is invalid', async () => {
      vi.useFakeTimers()
      try {
        vi.mocked(api.requestToken).mockResolvedValueOnce('old').mockResolvedValueOnce('new')
        vi.mocked(api.fetchQuestions)
          .mockRejectedValueOnce(new TriviaApiError('token-invalid', 'x'))
          .mockResolvedValueOnce(questions)
        const quiz = useQuiz()

        const started = quiz.start(settings)
        await vi.advanceTimersByTimeAsync(RATE_LIMIT_PAUSE_MS)
        await started

        expect(api.resetToken).not.toHaveBeenCalled()
        expect(api.fetchQuestions).toHaveBeenLastCalledWith(settings, expect.anything(), 'new')
        expect(quiz.phase.value).toBe('playing')
      } finally {
        vi.useRealTimers()
      }
    })

    it('gives up after one retry instead of looping', async () => {
      vi.useFakeTimers()
      try {
        vi.mocked(api.fetchQuestions).mockImplementation(async () => {
          throw new TriviaApiError('token-exhausted', 'x')
        })
        const quiz = useQuiz()

        const started = quiz.start(settings)
        await vi.advanceTimersByTimeAsync(RATE_LIMIT_PAUSE_MS)
        await started

        expect(api.fetchQuestions).toHaveBeenCalledTimes(2)
        expect(quiz.phase.value).toBe('setup')
        expect(quiz.error.value).not.toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('cancels the pause when the player leaves', async () => {
      vi.useFakeTimers()
      try {
        vi.mocked(api.fetchQuestions).mockRejectedValue(new TriviaApiError('token-exhausted', 'x'))
        const quiz = useQuiz()

        const started = quiz.start(settings)
        await vi.advanceTimersByTimeAsync(0)
        quiz.backToSetup()
        await vi.advanceTimersByTimeAsync(RATE_LIMIT_PAUSE_MS)
        await started

        expect(api.fetchQuestions).toHaveBeenCalledTimes(1)
        expect(quiz.phase.value).toBe('setup')
        expect(quiz.error.value).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })
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
