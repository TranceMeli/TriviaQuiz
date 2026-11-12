import { DEFAULT_QUESTIONS, DIFFICULTIES, MAX_QUESTIONS, MIN_QUESTIONS } from '../constants'
import type { QuizSettings } from '../types'

const STORAGE_KEY = 'triviaquiz:settings'

export const DEFAULT_SETTINGS: QuizSettings = {
  amount: DEFAULT_QUESTIONS,
  category: null,
  difficulty: null,
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // blocked (private mode, disabled cookies, …)
  }
}

/** Validates untrusted JSON so a stale or edited entry can never break the form. */
export function parseSettings(raw: string | null): QuizSettings {
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const data = JSON.parse(raw) as Partial<Record<keyof QuizSettings, unknown>>
    const amount =
      typeof data.amount === 'number' && Number.isInteger(data.amount) && data.amount >= MIN_QUESTIONS && data.amount <= MAX_QUESTIONS
        ? data.amount
        : DEFAULT_SETTINGS.amount
    const category = typeof data.category === 'number' && Number.isInteger(data.category) ? data.category : null
    const difficulty = DIFFICULTIES.find((level) => level === data.difficulty) ?? null
    return { amount, category, difficulty }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function loadSettings(storage: StorageLike | null = defaultStorage()): QuizSettings {
  try {
    return parseSettings(storage?.getItem(STORAGE_KEY) ?? null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: QuizSettings, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Remembering settings is a convenience; failing to do so must never affect the quiz.
  }
}
