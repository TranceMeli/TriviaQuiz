import type { Difficulty } from './types'

export const MIN_QUESTIONS = 1
export const MAX_QUESTIONS = 50
export const DEFAULT_QUESTIONS = 10

export const AMOUNT_PRESETS = [
  { label: 'Quick', amount: 5 },
  { label: 'Standard', amount: 10 },
  { label: 'Long', amount: 25 },
] as const

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']
