export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionType = 'multiple' | 'boolean'

export interface Category {
  id: number
  name: string
}

/** A question as used by the UI: decoded, with the answer options already ordered. */
export interface Question {
  category: string
  type: QuestionType
  difficulty: Difficulty
  text: string
  correctAnswer: string
  options: string[]
}

export interface QuizSettings {
  amount: number
  /** `null` = any category */
  category: number | null
  /** `null` = any difficulty */
  difficulty: Difficulty | null
}

/** A question the player got wrong, kept for the review on the result screen. */
export interface MissedQuestion {
  question: Question
  givenAnswer: string
}

export type Phase = 'setup' | 'loading' | 'playing' | 'finished'

export type CategoriesStatus = 'loading' | 'ready' | 'error'
