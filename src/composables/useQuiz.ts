import { computed, ref, shallowRef } from 'vue'
import { fetchCategories, fetchQuestions, TriviaApiError } from '../api'
import type { CategoriesStatus, Category, MissedQuestion, Phase, Question, QuizSettings } from '../types'
import { loadSettings, saveSettings } from '../utils/storage'

export function errorMessage(error: unknown): string {
  if (error instanceof TriviaApiError) {
    switch (error.kind) {
      case 'no-results':
        return 'There are not enough questions for this selection. Try a different category, difficulty or a smaller number.'
      case 'rate-limit':
        return 'Too many requests. Please wait a few seconds and try again.'
    }
  }
  return 'The questions could not be loaded. Check your connection and try again.'
}

/** All quiz state and rules. Components only render it and forward user intent. */
export function useQuiz() {
  const phase = ref<Phase>('setup')
  const error = ref<string | null>(null)

  const categories = ref<Category[]>([])
  const categoriesStatus = ref<CategoriesStatus>('loading')

  /** The settings of the last started quiz – pre-fills the form and powers "play again". */
  const settings = ref<QuizSettings>(loadSettings())

  const questions = shallowRef<Question[]>([])
  const index = ref(0)
  const score = ref(0)
  const missed = shallowRef<MissedQuestion[]>([])
  const selected = ref<string | null>(null)
  const checked = ref(false)
  /** True after "Check" was pressed without choosing an answer. */
  const selectionMissing = ref(false)

  let pendingRequest: AbortController | null = null

  const total = computed(() => questions.value.length)
  const current = computed<Question | null>(() => questions.value[index.value] ?? null)
  const isLastQuestion = computed(() => index.value >= total.value - 1)
  const isCorrect = computed(() => checked.value && selected.value === current.value?.correctAnswer)

  async function loadCategories() {
    categoriesStatus.value = 'loading'
    try {
      categories.value = await fetchCategories()
      categoriesStatus.value = 'ready'
    } catch {
      categoriesStatus.value = 'error'
    }
  }

  async function start(next: QuizSettings) {
    pendingRequest?.abort()
    const request = new AbortController()
    pendingRequest = request

    error.value = null
    phase.value = 'loading'
    try {
      const loaded = await fetchQuestions(next, request.signal)
      if (request.signal.aborted) return
      settings.value = next
      saveSettings(next)
      questions.value = loaded
      index.value = 0
      score.value = 0
      missed.value = []
      selected.value = null
      checked.value = false
      selectionMissing.value = false
      phase.value = 'playing'
    } catch (e) {
      if (request.signal.aborted) return
      error.value = errorMessage(e)
      phase.value = 'setup'
    }
  }

  /** Starts a new quiz with the settings of the previous one. */
  function playAgain() {
    return start(settings.value)
  }

  function select(answer: string) {
    if (phase.value !== 'playing' || checked.value) return
    selected.value = answer
    selectionMissing.value = false
  }

  function check() {
    if (phase.value !== 'playing' || checked.value) return
    const question = current.value
    if (selected.value === null || !question) {
      selectionMissing.value = true
      return
    }
    checked.value = true
    if (selected.value === question.correctAnswer) {
      score.value++
    } else {
      missed.value = [...missed.value, { question, givenAnswer: selected.value }]
    }
  }

  function next() {
    if (phase.value !== 'playing' || !checked.value) return
    if (isLastQuestion.value) {
      phase.value = 'finished'
      return
    }
    index.value++
    selected.value = null
    checked.value = false
    selectionMissing.value = false
  }

  /** Leaves the current quiz (or the result) and returns to the settings. */
  function backToSetup() {
    pendingRequest?.abort()
    error.value = null
    phase.value = 'setup'
  }

  return {
    phase,
    error,
    categories,
    categoriesStatus,
    settings,
    current,
    index,
    total,
    score,
    missed,
    selected,
    checked,
    selectionMissing,
    isLastQuestion,
    isCorrect,
    loadCategories,
    start,
    playAgain,
    select,
    check,
    next,
    backToSetup,
  }
}
